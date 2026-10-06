import jwt from 'jsonwebtoken';
import { User, Role, Department } from '../models/index.js';

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
        { model: Department, as: 'department' }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or session has expired.'
      });
    }

    if (user.active === false || user.active === 0) {
      const isFaculty = user.role?.name?.toUpperCase() === 'FACULTY';
      return res.status(401).json({
        success: false,
        message: isFaculty
          ? 'Faculty account is deactivated. Please contact administrator.'
          : 'Account is inactive. Please contact administrator.'
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
      department_id: user.department_id || null,
      department: user.department?.name || 'Central Store',
      designation: roleName === 'FACULTY' ? 'Faculty' : 'Administrator',
      employeeCode: user.username.toUpperCase(),
      phone: null,
      avatarText: user.avatar_text || user.name.charAt(0).toUpperCase(),
      active: Boolean(user.active)
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
