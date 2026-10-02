import express from 'express';
import { getStockHistory } from '../controllers/stockHistoryController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, requireAdmin, getStockHistory);

export default router;
