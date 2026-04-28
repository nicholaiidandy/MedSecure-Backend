import express from 'express';
import { getAuditLogs, getAuditStats } from '../controllers/auditLogController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin', 'doctor'));

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);

export default router;
