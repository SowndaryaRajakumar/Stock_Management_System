import express from 'express';
import { getTransfers, issueTransfer } from '../controllers/transferController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, requireAdmin, getTransfers);
router.post('/', verifyToken, requireAdmin, issueTransfer);

export default router;
