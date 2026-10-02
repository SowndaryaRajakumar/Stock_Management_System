import { Op } from 'sequelize';
import { User, Role, Department, Faculty } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';
import { comparePassword } from '../utils/password.js';

// @desc    Auth user (Admin or Faculty via single endpoint) & get JWT
// @route   POST /api/auth/login
export const loginUser = async (req, res, next) => {
  try {
    // Read identifier or fallback to username (to support legacy scripts)
    const rawIdentifier = req.body.identifier || req.body.username;
    const rawPassword = req.body.password;

    if (!rawIdentifier || !rawPassword) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username/email or password'
      });
    }

    const cleanIdentifier = String(rawIdentifier).trim().toLowerCase();

    // Find user by username OR email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: cleanIdentifier },
          { email: cleanIdentifier }
        ]
      },
      include: [
        { model: Role, as: 'role' },
        { model: Department, as: 'department' },
        { model: Faculty, as: 'facultyProfile' }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password'
      });
    }

    // Verify bcrypt hashed password
    const passwordMatch = await comparePassword(String(rawPassword), user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password'
      });
    }

    // Check account active status
    if (user.active === false || user.active === 0) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    // If faculty profile exists and is inactive, block login
    if (user.facultyProfile && user.facultyProfile.status === 'INACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Faculty account is deactivated. Please contact administrator.'
      });
    }

    // Role MUST come exclusively from database, never trusted from client
    const roleName = user.role?.name ? user.role.name.toUpperCase() : 'FACULTY';

    // Generate JWT containing userId, username, role
    const token = generateToken({
      userId: user.id,
      id: user.id,
      username: user.username,
      role: roleName
    });

    const userPayload = {
      id: user.id,
      _id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: roleName,
      department_id: user.department_id || user.facultyProfile?.department_id || null,
      department: user.department?.name || 'Central Store',
      designation: user.facultyProfile?.designation || null,
      employeeCode: user.facultyProfile?.employee_code || null,
      avatarText: user.avatar_text || user.name.charAt(0).toUpperCase()
    };

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userPayload
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    return res.json({
      success: true,
      user: {
        id: req.user.id,
        _id: req.user.id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        department_id: req.user.department_id,
        department: req.user.department,
        designation: req.user.designation,
        employeeCode: req.user.employeeCode,
        avatarText: req.user.avatarText
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Role, as: 'role' },
        { model: Department, as: 'department' },
        { model: Faculty, as: 'facultyProfile' }
      ],
      order: [['name', 'ASC']]
    });

    const formatted = users.map(u => ({
      id: u.id,
      _id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      role: u.role?.name || 'FACULTY',
      department: u.department?.name || null,
      designation: u.facultyProfile?.designation || null,
      employeeCode: u.facultyProfile?.employee_code || null,
      active: u.active
    }));

    res.json({ success: true, count: formatted.length, users: formatted });
  } catch (error) {
    next(error);
  }
};

export default {
  loginUser,
  getMe,
  getUsers
};
