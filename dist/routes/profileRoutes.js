import express from 'express';
import { getProfile, updatePassword, toggle2FA, } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();
router.use(protect); // Only auth required, no adminOnly
router.get('/', getProfile);
router.put('/password', updatePassword);
router.put('/2fa', toggle2FA);
export default router;
