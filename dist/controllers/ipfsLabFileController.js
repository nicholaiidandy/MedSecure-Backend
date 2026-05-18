import multer from 'multer';
import { create as createIPFS } from 'ipfs-http-client';
import crypto from 'crypto';
import MedicalRecord from '../models/MedicalRecord.js';
const uploadToPinata = async (file, pinataJwt, pinataApiUrl) => {
    if (!pinataJwt) {
        throw new Error('PINATA_JWT is not set');
    }
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' });
    formData.append('file', blob, file.originalname);
    formData.append('pinataMetadata', JSON.stringify({ name: file.originalname }));
    const response = await fetch(pinataApiUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${pinataJwt}`,
        },
        body: formData,
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Pinata upload failed (${response.status}): ${errorBody}`);
    }
    const payload = (await response.json());
    if (!payload.IpfsHash) {
        throw new Error('Pinata response did not include IpfsHash');
    }
    return payload.IpfsHash;
};
const uploadToInfura = async (file, ipfsApiUrl, ipfsProjectId, ipfsProjectSecret) => {
    const ipfsHeaders = ipfsProjectId && ipfsProjectSecret
        ? {
            authorization: `Basic ${Buffer.from(`${ipfsProjectId}:${ipfsProjectSecret}`).toString('base64')}`,
        }
        : undefined;
    const ipfs = createIPFS({ url: ipfsApiUrl, headers: ipfsHeaders });
    const { cid } = await ipfs.add(file.buffer);
    return cid.toString();
};
// Multer setup for file upload
const upload = multer({ storage: multer.memoryStorage() });
export const uploadLabFileMiddleware = upload.single('labFile');
export const uploadLabFileToIPFS = async (req, res) => {
    try {
        const recordId = req.params.id;
        const pinataJwt = process.env.PINATA_JWT;
        const pinataApiUrl = process.env.PINATA_API_URL || 'https://api.pinata.cloud/pinning/pinFileToIPFS';
        const ipfsApiUrl = process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001/api/v0';
        const ipfsProjectId = process.env.INFURA_PROJECT_ID;
        const ipfsProjectSecret = process.env.INFURA_PROJECT_SECRET;
        const isInfuraApi = ipfsApiUrl.includes('ipfs.infura.io');
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        let cidString;
        if (pinataJwt) {
            try {
                cidString = await uploadToPinata(req.file, pinataJwt, pinataApiUrl);
            }
            catch (pinataError) {
                console.error('Upload lab file to Pinata error:', pinataError);
                const message = String(pinataError?.message || '').toLowerCase();
                const isPinataAuthError = message.includes('(401)') || message.includes('(403)') || message.includes('unauthorized');
                if (isPinataAuthError) {
                    return res.status(502).json({
                        success: false,
                        message: 'Pinata authentication failed. Check PINATA_JWT in backend environment.',
                    });
                }
                return res.status(502).json({
                    success: false,
                    message: 'Failed to upload file to Pinata IPFS provider',
                });
            }
        }
        else {
            if (isInfuraApi && (!ipfsProjectId || !ipfsProjectSecret)) {
                return res.status(500).json({
                    success: false,
                    message: 'IPFS is not configured. Set PINATA_JWT or set INFURA_PROJECT_ID and INFURA_PROJECT_SECRET in backend environment.',
                });
            }
            try {
                cidString = await uploadToInfura(req.file, ipfsApiUrl, ipfsProjectId, ipfsProjectSecret);
            }
            catch (ipfsError) {
                console.error('Upload lab file to IPFS error:', ipfsError);
                const status = ipfsError?.response?.status;
                const message = String(ipfsError?.message || '').toLowerCase();
                const isInfuraAuthError = status === 401 ||
                    message.includes('project id required') ||
                    message.includes('project id does not have access');
                if (isInfuraAuthError) {
                    return res.status(502).json({
                        success: false,
                        message: 'Infura IPFS authentication failed. Set valid INFURA_PROJECT_ID/INFURA_PROJECT_SECRET or use PINATA_JWT.',
                    });
                }
                return res.status(502).json({
                    success: false,
                    message: 'Failed to upload file to IPFS provider',
                });
            }
        }
        // Hash file (SHA256)
        const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
        // Stub transaction hash for internal audit trail
        const txHash = '0xBLOCKCHAIN_TX_HASH_STUB';
        // Simpan ke database (medicalrecords.labFiles[])
        const record = await MedicalRecord.findById(recordId);
        if (!record) {
            return res.status(404).json({ success: false, message: 'Medical record not found' });
        }
        record.labFiles = record.labFiles || [];
        record.labFiles.push({
            filename: req.file.originalname,
            ipfsCid: cidString,
            hash,
            txHash,
            uploadedAt: new Date(),
        });
        await record.save();
        res.status(201).json({
            success: true,
            ipfsCid: cidString,
            hash,
            txHash,
            filename: req.file.originalname,
        });
    }
    catch (error) {
        console.error('Upload lab file to IPFS error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
