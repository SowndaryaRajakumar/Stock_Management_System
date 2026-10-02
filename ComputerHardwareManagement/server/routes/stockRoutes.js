import express from 'express';
import {
  handleIncomingStock,
  handleOutgoingStock,
  getStockHistory,
  getLowStockItems
} from '../controllers/stockController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/incoming', protect, requireAdmin, handleIncomingStock);
router.post('/outgoing', protect, requireAdmin, handleOutgoingStock);
router.get('/history', protect, requireAdmin, getStockHistory);
router.get('/low-stock', protect, requireAdmin, getLowStockItems);

export default router;

