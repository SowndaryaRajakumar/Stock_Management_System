import express from 'express';
import { getReportData } from '../controllers/reportController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, requireAdmin, getReportData);

export default router;
