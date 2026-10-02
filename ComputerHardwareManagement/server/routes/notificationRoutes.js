import express from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.put('/read-all', verifyToken, markAllNotificationsRead);
router.put('/:id/read', verifyToken, markNotificationRead);

export default router;
