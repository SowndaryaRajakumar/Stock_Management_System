/**
 * Role-Based Authorization Middleware Factory
 * @param  {...string} allowedRoles - e.g. "ADMIN", "FACULTY"
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No user identity attached.'
      });
    }

    const userRole = req.user.role ? req.user.role.toUpperCase() : '';
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    if (normalizedAllowed.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role "${userRole}" is not authorized for this resource.`
    });
  };
};

export const requireAdmin = requireRole('ADMIN');
export const requireFaculty = requireRole('FACULTY');
export const requireFacultyOrAdmin = requireRole('ADMIN', 'FACULTY');

export default {
  requireRole,
  requireAdmin,
  requireFaculty,
  requireFacultyOrAdmin
};
