import { authenticateToken } from './authenticateToken.js';
import {
  requireRole,
  requireAdmin,
  requireFaculty,
  requireFacultyOrAdmin
} from './authorizeRole.js';

export {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireFaculty,
  requireFacultyOrAdmin
};

// Aliases for full backwards compatibility
export const protect = authenticateToken;
export const verifyToken = authenticateToken;
export const authorize = requireRole;
export const requireStaffOrAdmin = requireFacultyOrAdmin;

export default {
  authenticateToken,
  protect,
  verifyToken,
  authorize,
  requireRole,
  requireAdmin,
  requireFaculty,
  requireFacultyOrAdmin,
  requireStaffOrAdmin
};
