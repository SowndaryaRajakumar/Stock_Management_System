import express from 'express';
import {
  getIndents,
  getIndentById,
  createIndent,
  updateIndent,
  submitIndent,
  recommendIndent,
  approveIndent,
  rejectIndent,
  issueIndent,
  reviewIndent,
  completeIndent
} from '../controllers/indentController.js';
import { protect, requireAdmin, requireStaffOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getIndents);
router.post('/', protect, requireStaffOrAdmin, createIndent);

router.get('/:id', protect, getIndentById);
router.put('/:id', protect, requireStaffOrAdmin, updateIndent);

router.post('/:id/submit', protect, requireStaffOrAdmin, submitIndent);
router.post('/:id/recommend', protect, requireStaffOrAdmin, recommendIndent);
router.post('/:id/approve', protect, requireAdmin, approveIndent);
router.post('/:id/reject', protect, requireAdmin, rejectIndent);
router.post('/:id/complete', protect, requireAdmin, completeIndent);
router.post('/:id/issue', protect, requireAdmin, issueIndent);
router.post('/:id/review', protect, requireAdmin, reviewIndent);
router.put('/:id/review', protect, requireAdmin, reviewIndent);

export default router;
