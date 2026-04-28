import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  unlockUser,
  createDoctor,
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/unlock', unlockUser);
router.post('/create-doctor', createDoctor);

export default router;

