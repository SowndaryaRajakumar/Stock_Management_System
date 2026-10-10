import express from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, requireAdmin, getNotifications);
router.put('/read-all', verifyToken, requireAdmin, markAllNotificationsRead);
router.put('/:id/read', verifyToken, requireAdmin, markNotificationRead);

export default router;
