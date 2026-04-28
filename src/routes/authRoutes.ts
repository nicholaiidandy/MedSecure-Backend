import express from 'express';
import { login, registerPatient, adminRegisterUser, getMe, updatePassword, logout } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/register', registerPatient);
router.post('/admin/register', protect, adminOnly, adminRegisterUser);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

export default router;
