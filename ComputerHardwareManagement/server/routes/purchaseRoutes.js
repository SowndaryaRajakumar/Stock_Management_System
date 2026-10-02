import express from 'express';
import { getPurchases, recordPurchase } from '../controllers/purchaseController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, requireAdmin, getPurchases);
router.post('/', verifyToken, requireAdmin, recordPurchase);

export default router;
