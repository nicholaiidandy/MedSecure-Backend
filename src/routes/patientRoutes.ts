import express from 'express';
import {
  getPatients,
  searchPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/search', authorize('doctor', 'admin'), searchPatients);

router.route('/')
  .get(getPatients)
  .post(authorize('doctor', 'admin'), createPatient);

router.route('/:id')
  .get(getPatient)
  .put(authorize('doctor', 'admin'), updatePatient)
  .delete(authorize('doctor', 'admin'), deletePatient);

export default router;

