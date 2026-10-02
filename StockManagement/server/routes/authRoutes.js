import express from 'express';
import { loginUser, getMe, getUsers } from '../controllers/authController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', loginUser);
router.get('/me', verifyToken, getMe);
router.get('/users', verifyToken, requireAdmin, getUsers);

export default router;
