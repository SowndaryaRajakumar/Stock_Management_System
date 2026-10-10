import express from 'express';
import {
  getIndents,
  getIndentById,
  createIndent,
  updateIndent,
  deleteIndent,
  submitIndent,
  recommendIndent,
  approveIndent,
  rejectIndent,
  issueIndent,
  reviewIndent,
  completeIndent
} from '../controllers/indentController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, requireAdmin, getIndents);
router.post('/', protect, requireAdmin, createIndent);

router.get('/:id', protect, requireAdmin, getIndentById);
router.put('/:id', protect, requireAdmin, updateIndent);
router.delete('/:id', protect, requireAdmin, deleteIndent);

// Compatibility endpoints (Admin only on Electrical backend)
router.post('/:id/submit', protect, requireAdmin, submitIndent);
router.post('/:id/recommend', protect, requireAdmin, recommendIndent);
router.post('/:id/approve', protect, requireAdmin, approveIndent);
router.post('/:id/reject', protect, requireAdmin, rejectIndent);
router.post('/:id/complete', protect, requireAdmin, completeIndent);
router.post('/:id/issue', protect, requireAdmin, issueIndent);
router.post('/:id/review', protect, requireAdmin, reviewIndent);
router.put('/:id/review', protect, requireAdmin, reviewIndent);

export default router;
