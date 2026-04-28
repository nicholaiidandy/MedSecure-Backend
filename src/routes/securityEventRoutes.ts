import express from 'express';
import { getSecurityEvents, getSecurityStats } from '../controllers/securityEventController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', getSecurityEvents);
router.get('/stats', getSecurityStats);

export default router;
