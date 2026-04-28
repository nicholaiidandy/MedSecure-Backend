import express from 'express';
import { uploadLabFileMiddleware, uploadLabFileToIPFS } from '../controllers/ipfsLabFileController.js';
import { protect, authorize } from '../middleware/auth.js';
const router = express.Router();
router.post('/medical-records/:id/lab-file', protect, authorize('doctor'), uploadLabFileMiddleware, uploadLabFileToIPFS);
export default router;
