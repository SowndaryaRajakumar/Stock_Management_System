import express from 'express';
import { getDashboardStats, getAnalyticsOverview } from '../controllers/analyticsController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', verifyToken, getDashboardStats);
router.get('/overview', verifyToken, requireAdmin, getAnalyticsOverview);

export default router;
