import express from 'express';
import { getRecordsByPatient, getAllRecords, createRecord, verifyRecord, } from '../controllers/medicalRecordController.js';
import { protect, authorize } from '../middleware/auth.js';
const router = express.Router();
router.use(protect);
// Allow doctors to read medical record totals for the dashboard
router.get('/', authorize('admin', 'doctor'), getAllRecords);
router.get('/patient/:patientId', getRecordsByPatient);
router.post('/', authorize('doctor'), createRecord);
router.post('/verify', verifyRecord);
export default router;
