import express from 'express';
import {
  getFacultyList,
  getFacultyById,
  createFaculty,
  updateFaculty,
  updateFacultyStatus,
  deleteFaculty,
  deactivateFaculty
} from '../controllers/facultyController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { requireAdmin } from '../middleware/authorizeRole.js';

const router = express.Router();

// All faculty routes require valid JWT token AND ADMIN role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', getFacultyList);
router.post('/', createFaculty);
router.get('/:id', getFacultyById);
router.put('/:id', updateFaculty);
router.patch('/:id/status', updateFacultyStatus);
router.delete('/:id', deactivateFaculty);

export default router;
