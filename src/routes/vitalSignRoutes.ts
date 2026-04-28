import express from 'express';
import {
  getVitalSignsByPatient,
  getAllVitalSigns,
  createVitalSign,
} from '../controllers/vitalSignController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllVitalSigns);
router.get('/patient/:patientId', getVitalSignsByPatient);
router.post('/', authorize('nurse', 'doctor'), createVitalSign);

export default router;
