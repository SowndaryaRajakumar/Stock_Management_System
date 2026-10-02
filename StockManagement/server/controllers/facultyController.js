import { Op } from 'sequelize';
import { sequelize, User, Faculty, Department, Role, Indent, Transfer, Notification } from '../models/index.js';
import { hashPassword } from '../utils/password.js';

/**
 * Format faculty response object (exclude password)
 */
const formatFaculty = (faculty) => {
  if (!faculty) return null;
  const user = faculty.user || {};
  const department = faculty.department || user.department || {};

  return {
    id: faculty.id,
    _id: faculty.id,
    user_id: faculty.user_id,
    employee_code: faculty.employee_code,
    name: user.name || '',
    username: user.username || '',
    email: user.email || '',
    department_id: faculty.department_id || user.department_id,
    department_name: department.name || 'Unassigned',
    department_code: department.code || '',
    department: department.name || 'Unassigned',
    designation: faculty.designation || '',
    phone: faculty.phone || '',
    status: faculty.status || 'ACTIVE',
    active: faculty.status === 'ACTIVE' && Boolean(user.active),
    created_at: faculty.created_at,
    updated_at: faculty.updated_at
  };
};

// @desc    Get all faculty members with department & user information
// @route   GET /api/faculty
// @access  Private (Admin only)
export const getFacultyList = async (req, res, next) => {
  try {
    const { search, department_id, status } = req.query;

    const whereFaculty = {};
    if (department_id) {
      whereFaculty.department_id = department_id;
    }
    if (status && status !== 'ALL') {
      whereFaculty.status = status.toUpperCase();
    }

    const whereUser = {};
    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      whereUser[Op.or] = [
        { name: { [Op.like]: term } },
        { username: { [Op.like]: term } },
        { email: { [Op.like]: term } }
      ];
    }

    const facultyRecords = await Faculty.findAll({
      where: whereFaculty,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'name', 'email', 'role_id', 'active', 'department_id'],
          where: Object.keys(whereUser).length > 0 ? whereUser : undefined
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const data = facultyRecords.map(formatFaculty);

    res.json({
      success: true,
      count: data.length,
      data,
      faculty: data // alias
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single faculty member by ID
// @route   GET /api/faculty/:id
// @access  Private (Admin only)
export const getFacultyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'name', 'email', 'role_id', 'active', 'department_id']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: `Faculty member not found with ID ${id}`
      });
    }

    res.json({
      success: true,
      data: formatFaculty(faculty)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new faculty member & user account
// @route   POST /api/faculty
// @access  Private (Admin only)
export const createFaculty = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      employee_code,
      name,
      username,
      email,
      password,
      department_id,
      designation,
      phone,
      status = 'ACTIVE'
    } = req.body;

    // 1. Validate required fields
    if (!employee_code || !name || !username || !email || !password || !department_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Employee Code, Name, Username, Email, Password, Department'
      });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanEmpCode = String(employee_code).trim().toUpperCase();
    const cleanStatus = String(status).toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    // 2. Check uniqueness of username, email, employee_code
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: cleanUsername },
          { email: cleanEmail }
        ]
      },
      transaction
    });

    if (existingUser) {
      await transaction.rollback();
      const conflictField = existingUser.username === cleanUsername ? 'Username' : 'Email';
      return res.status(400).json({
        success: false,
        message: `${conflictField} is already registered to another account.`
      });
    }

    const existingFacultyCode = await Faculty.findOne({
      where: { employee_code: cleanEmpCode },
      transaction
    });

    if (existingFacultyCode) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Employee Code "${cleanEmpCode}" is already in use.`
      });
    }

    // 3. Find FACULTY role
    let facultyRole = await Role.findOne({ where: { name: 'FACULTY' }, transaction });
    if (!facultyRole) {
      facultyRole = await Role.create({
        name: 'FACULTY',
        description: 'Academic Faculty'
      }, { transaction });
    }

    // 4. Hash password with bcryptjs
    const hashedPassword = await hashPassword(password);

    // 5. Create user in MySQL
    const user = await User.create({
      username: cleanUsername,
      password: hashedPassword,
      name: String(name).trim(),
      email: cleanEmail,
      role_id: facultyRole.id,
      department_id: Number(department_id),
      avatar_text: name.trim().charAt(0).toUpperCase(),
      active: cleanStatus === 'ACTIVE'
    }, { transaction });

    // 6. Create faculty record in MySQL
    const faculty = await Faculty.create({
      user_id: user.id,
      employee_code: cleanEmpCode,
      department_id: Number(department_id),
      designation: designation ? String(designation).trim() : 'Faculty',
      phone: phone ? String(phone).trim() : null,
      status: cleanStatus
    }, { transaction });

    await transaction.commit();

    // Re-fetch complete record with associations
    const saved = await Faculty.findByPk(faculty.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'name', 'email', 'role_id', 'active', 'department_id'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Faculty account created successfully.',
      data: formatFaculty(saved)
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

// @desc    Update existing faculty member details
// @route   PUT /api/faculty/:id
// @access  Private (Admin only)
export const updateFaculty = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      name,
      email,
      department_id,
      designation,
      phone,
      employee_code,
      status,
      password
    } = req.body;

    const faculty = await Faculty.findByPk(id, {
      include: [{ model: User, as: 'user' }],
      transaction
    });

    if (!faculty) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: `Faculty record not found with ID ${id}`
      });
    }

    const user = faculty.user;
    if (!user) {
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: 'Associated user account record not found.'
      });
    }

    // Uniqueness checks if email or employee_code changed
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const existingEmail = await User.findOne({
        where: {
          email: email.trim().toLowerCase(),
          id: { [Op.ne]: user.id }
        },
        transaction
      });
      if (existingEmail) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Email address is already in use by another account.'
        });
      }
      user.email = email.trim().toLowerCase();
    }

    if (employee_code && employee_code.trim().toUpperCase() !== faculty.employee_code.toUpperCase()) {
      const existingCode = await Faculty.findOne({
        where: {
          employee_code: employee_code.trim().toUpperCase(),
          id: { [Op.ne]: faculty.id }
        },
        transaction
      });
      if (existingCode) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Employee code is already in use by another faculty member.'
        });
      }
      faculty.employee_code = employee_code.trim().toUpperCase();
    }

    if (name) {
      user.name = name.trim();
      user.avatar_text = name.trim().charAt(0).toUpperCase();
    }

    if (department_id) {
      faculty.department_id = Number(department_id);
      user.department_id = Number(department_id);
    }

    if (designation !== undefined) {
      faculty.designation = designation ? designation.trim() : '';
    }

    if (phone !== undefined) {
      faculty.phone = phone ? phone.trim() : null;
    }

    if (status) {
      const cleanStatus = status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
      faculty.status = cleanStatus;
      user.active = cleanStatus === 'ACTIVE';
    }

    // If new password provided, hash with bcryptjs
    if (password && password.trim()) {
      user.password = await hashPassword(password.trim());
    }

    await user.save({ transaction });
    await faculty.save({ transaction });

    await transaction.commit();

    const updated = await Faculty.findByPk(faculty.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'name', 'email', 'role_id', 'active', 'department_id'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] }
      ]
    });

    res.json({
      success: true,
      message: 'Faculty details updated successfully.',
      data: formatFaculty(updated)
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

// @desc    Update faculty status (toggle or set ACTIVE / INACTIVE)
// @route   PATCH /api/faculty/:id/status
// @access  Private (Admin only)
export const updateFacultyStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status, active } = req.body;

    const faculty = await Faculty.findByPk(id, {
      include: [{ model: User, as: 'user' }],
      transaction
    });

    if (!faculty) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: `Faculty record not found with ID ${id}`
      });
    }

    let newStatus;
    if (active !== undefined) {
      newStatus = active ? 'ACTIVE' : 'INACTIVE';
    } else if (status !== undefined) {
      newStatus = String(status).toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    } else {
      newStatus = faculty.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    }

    faculty.status = newStatus;

    if (faculty.user) {
      faculty.user.active = newStatus === 'ACTIVE';
      await faculty.user.save({ transaction });
    }

    await faculty.save({ transaction });
    await transaction.commit();

    const actionText = newStatus === 'ACTIVE' ? 'activated' : 'deactivated';
    res.json({
      success: true,
      message: `Faculty account ${actionText} successfully.`,
      status: newStatus,
      active: newStatus === 'ACTIVE'
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

// @desc    Delete faculty (with FK reference safety) or deactivate if referenced
// @route   DELETE /api/faculty/:id
// @access  Private (Admin only)
export const deleteFaculty = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { deactivate, soft } = req.query;
    const isDeactivateReq = deactivate === 'true' || soft === 'true' || req.body?.deactivate === true;

    const faculty = await Faculty.findByPk(id, {
      include: [{ model: User, as: 'user' }],
      transaction
    });

    if (!faculty) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: `Faculty record not found with ID ${id}`
      });
    }

    const userId = faculty.user_id;

    // Check references across historical records (indents, transfers)
    const [indentCount, transferCount] = await Promise.all([
      Indent.count({ where: { requested_by: userId } }),
      Transfer.count({ where: { issued_by: userId } })
    ]);

    const totalRefs = indentCount + transferCount;

    if (totalRefs > 0) {
      // If client explicitly requested deactivation or soft delete
      if (isDeactivateReq) {
        faculty.status = 'INACTIVE';
        if (faculty.user) {
          faculty.user.active = false;
          await faculty.user.save({ transaction });
        }
        await faculty.save({ transaction });
        await transaction.commit();

        return res.json({
          success: true,
          message: 'Faculty account deactivated successfully.',
          status: 'INACTIVE',
          active: false
        });
      }

      await transaction.rollback();
      return res.status(409).json({
        success: false,
        inUse: true,
        referenceCount: totalRefs,
        message: 'This faculty account is associated with existing records and cannot be permanently deleted. Deactivate the account instead.'
      });
    }

    // 0 historical references: Safe to permanently delete
    await Notification.destroy({ where: { user_id: userId }, transaction }).catch(() => {});
    await faculty.destroy({ transaction });
    if (faculty.user) {
      await faculty.user.destroy({ transaction });
    }

    await transaction.commit();
    return res.json({
      success: true,
      message: 'Faculty account deleted successfully.'
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    if (error.name === 'SequelizeForeignKeyConstraintError' || error.original?.errno === 1451) {
      return res.status(409).json({
        success: false,
        inUse: true,
        message: 'This faculty account is associated with existing records and cannot be permanently deleted. Deactivate the account instead.'
      });
    }
    next(error);
  }
};

export const deactivateFaculty = deleteFaculty;

export default {
  getFacultyList,
  getFacultyById,
  createFaculty,
  updateFaculty,
  updateFacultyStatus,
  deleteFaculty,
  deactivateFaculty
};
