import crypto from 'crypto';
import MedicalRecord from '../models/MedicalRecord.js';
import Patient from '../models/Patient.js';
import { logAudit } from '../utils/auditLogger.js';
// @desc    Get medical records by patient
// @route   GET /api/medical-records/patient/:patientId
// @access  Private
export const getRecordsByPatient = async (req, res) => {
    try {
        const records = await MedicalRecord.find({ patient: req.params.patientId })
            .populate('doctor', 'name email')
            .sort({ date: -1 });
        res.status(200).json({
            success: true,
            count: records.length,
            data: records,
        });
    }
    catch (error) {
        console.error('Get records error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
// @desc    Get all medical records
// @route   GET /api/medical-records
// @access  Private (Admin)
export const getAllRecords = async (req, res) => {
    try {
        const records = await MedicalRecord.find()
            .populate('patient', 'name patientId')
            .populate('doctor', 'name email')
            .sort({ date: -1 });
        res.status(200).json({
            success: true,
            count: records.length,
            data: records,
        });
    }
    catch (error) {
        console.error('Get all records error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
// @desc    Create medical record
// @route   POST /api/medical-records
// @access  Private (Doctor)
export const createRecord = async (req, res) => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    try {
        const { patientId, diagnosis, symptoms, prescription, labResults } = req.body;
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }
        const blockchainHash = crypto
            .createHash('sha256')
            .update(`${patientId}-${diagnosis}-${symptoms}-${prescription}-${new Date().toISOString()}`)
            .digest('hex');
        const record = await MedicalRecord.create({
            patient: patientId,
            doctor: req.user?._id,
            diagnosis,
            symptoms,
            prescription,
            labResults,
            blockchainHash,
            blockchainTimestamp: new Date(),
        });
        // Update patient's last visit
        patient.lastVisit = new Date();
        await patient.save();
        if (req.user) {
            await logAudit(req.user, 'CREATE_MEDICAL_RECORD', 'medical_record', ipAddress, {
                resourceId: record._id.toString(),
                metadata: {
                    patientId: patient.patientId,
                    blockchainHash: record.blockchainHash
                },
            });
        }
        const populatedRecord = await MedicalRecord.findById(record._id)
            .populate('patient', 'name patientId')
            .populate('doctor', 'name email');
        res.status(201).json({
            success: true,
            data: populatedRecord,
        });
    }
    catch (error) {
        console.error('Create record error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
// @desc    Verify blockchain hash
// @route   POST /api/medical-records/verify
// @access  Private
export const verifyRecord = async (req, res) => {
    try {
        const { recordId } = req.body;
        if (!recordId || typeof recordId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Record ID or patient identifier is required',
            });
        }
        let record = null;
        if (/^[0-9a-fA-F]{24}$/.test(recordId)) {
            record = await MedicalRecord.findById(recordId).populate('patient', 'name patientId');
        }
        if (!record) {
            const patient = await Patient.findOne({
                $or: [
                    { patientId: recordId },
                    { name: { $regex: `^${recordId}$`, $options: 'i' } },
                ],
            });
            if (patient) {
                record = await MedicalRecord.findOne({ patient: patient._id })
                    .populate('patient', 'name patientId')
                    .sort({ date: -1 });
            }
        }
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found',
            });
        }
        const currentHash = record.generateBlockchainHash();
        const isValid = currentHash === record.blockchainHash;
        res.status(200).json({
            success: true,
            data: {
                recordId: record._id,
                dbHash: record.blockchainHash,
                blockchainHash: record.blockchainHash,
                currentHash,
                isValid,
                timestamp: record.blockchainTimestamp,
                recordDetails: {
                    patient: record.patient?.name || 'Unknown',
                    diagnosis: record.diagnosis,
                    date: record.date ? record.date.toISOString().slice(0, 10) : '',
                    patientId: record.patient?.patientId || '',
                },
            },
        });
    }
    catch (error) {
        console.error('Verify record error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
