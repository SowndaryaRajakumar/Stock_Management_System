import jwt from 'jsonwebtoken';
import { User, Role, Department, Faculty } from '../models/index.js';

/**
 * JWT Authentication Middleware
 * Reads 'Authorization: Bearer <token>', verifies JWT, checks MySQL user active status,
 * and attaches authenticated user to req.user.
 */
export const authenticateToken = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No authorization token provided.'
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret configuration missing on server.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization token.'
      });
    }

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token payload missing user identifier.'
      });
    }

    const user = await User.findByPk(userId, {
      include: [
        { model: Role, as: 'role' },
        { model: Department, as: 'department' },
        { model: Faculty, as: 'facultyProfile' }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or session has expired.'
      });
    }

    if (user.active === false || user.active === 0) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    // If user has a faculty profile, check faculty status
    if (user.facultyProfile && user.facultyProfile.status === 'INACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Faculty account is deactivated. Please contact administrator.'
      });
    }

    const roleName = user.role?.name ? user.role.name.toUpperCase() : (decoded.role || 'FACULTY');

    // Attach normalized authenticated user
    req.user = {
      id: user.id,
      _id: user.id,
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      role: roleName,
      department_id: user.department_id || user.facultyProfile?.department_id,
      department: user.department?.name || 'Central Store',
      designation: user.facultyProfile?.designation || null,
      employeeCode: user.facultyProfile?.employee_code || null,
      phone: user.facultyProfile?.phone || null,
      avatarText: user.avatar_text || user.name.charAt(0).toUpperCase(),
      active: user.active
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please log in again.'
    });
  }
};

export default authenticateToken;
