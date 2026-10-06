import { Op } from 'sequelize';
import { sequelize, User, Department, Role, Indent, Transfer, StockTransaction, Notification } from '../models/index.js';
import { hashPassword } from '../utils/password.js';

/**
 * Format faculty response object from User model (exclude password)
 */
const formatFaculty = (user, extra = {}) => {
  if (!user) return null;
  const raw = user.toJSON ? user.toJSON() : user;
  const department = raw.department || {};
  const status = (raw.active === true || raw.active === 1) ? 'ACTIVE' : 'INACTIVE';

  return {
    id: raw.id,
    _id: raw.id,
    user_id: raw.id,
    employee_code: extra.employee_code || raw.username?.toUpperCase() || '',
    name: raw.name || '',
    username: raw.username || '',
    email: raw.email || '',
    department_id: raw.department_id || null,
    department_name: department.name || 'Unassigned',
    department_code: department.code || '',
    department: department.name || 'Unassigned',
    designation: extra.designation || 'Faculty',
    phone: extra.phone || '',
    status,
    active: Boolean(raw.active),
    created_at: raw.created_at,
    updated_at: raw.updated_at
  };
};

// @desc    Get all faculty members with department & user information
// @route   GET /api/faculty
// @access  Private (Admin only)
export const getFacultyList = async (req, res, next) => {
  try {
    const { search, department_id, status } = req.query;

    let facultyRole = await Role.findOne({ where: { name: 'FACULTY' } });
    if (!facultyRole) {
      facultyRole = await Role.create({
        name: 'FACULTY',
        description: 'Academic Faculty'
      });
    }

    const whereUser = {
      role_id: facultyRole.id
    };

    if (department_id) {
      whereUser.department_id = Number(department_id);
    }

    if (status && status !== 'ALL') {
      const cleanStatus = status.toUpperCase();
      if (cleanStatus === 'ACTIVE') {
        whereUser.active = true;
      } else if (cleanStatus === 'INACTIVE') {
        whereUser.active = false;
      }
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      whereUser[Op.or] = [
        { name: { [Op.like]: term } },
        { username: { [Op.like]: term } },
        { email: { [Op.like]: term } }
      ];
    }

    const facultyUsers = await User.findAll({
      where: whereUser,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC'], ['id', 'DESC']]
    });

    const data = facultyUsers.map(u => formatFaculty(u));

    res.json({
      success: true,
      count: data.length,
      data,
      faculty: data // alias for compatibility
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

    let facultyRole = await Role.findOne({ where: { name: 'FACULTY' } });
    const where = { id };
    if (facultyRole) {
      where.role_id = facultyRole.id;
    }

    const user = await User.findOne({
      where,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Faculty member not found with ID ${id}`
      });
    }

    res.json({
      success: true,
      data: formatFaculty(user)
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
    if (!name || !email || !password || !department_id || (!username && !employee_code)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Employee Code, Name, Username, Email, Password, Department'
      });
    }

    const cleanUsername = String(username || employee_code).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanEmpCode = String(employee_code || username).trim().toUpperCase();
    const cleanStatus = String(status).toUpperCase() === 'INACTIVE' ? false : true;

    // 2. Check uniqueness of username and email
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

    // 3. Find or create FACULTY role
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
      avatar_text: String(name).trim().charAt(0).toUpperCase(),
      active: cleanStatus
    }, { transaction });

    await transaction.commit();

    // Re-fetch complete record with associations
    const saved = await User.findByPk(user.id, {
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Role, as: 'role', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Faculty account created successfully.',
      data: formatFaculty(saved, {
        designation: designation ? String(designation).trim() : 'Faculty',
        phone: phone ? String(phone).trim() : '',
        employee_code: cleanEmpCode
      })
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
      username,
      department_id,
      designation,
      phone,
      employee_code,
      status,
      active,
      password
    } = req.body;

    let facultyRole = await Role.findOne({ where: { name: 'FACULTY' }, transaction });
    const where = { id };
    if (facultyRole) {
      where.role_id = facultyRole.id;
    }

    const user = await User.findOne({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Role, as: 'role', attributes: ['id', 'name'] }
      ],
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: `Faculty record not found with ID ${id}`
      });
    }

    // Uniqueness checks if email changed
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      const existingEmail = await User.findOne({
        where: {
          email: cleanEmail,
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
      user.email = cleanEmail;
    }

    // Uniqueness checks if username changed
    if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const cleanUsername = username.trim().toLowerCase();
      const existingUsername = await User.findOne({
        where: {
          username: cleanUsername,
          id: { [Op.ne]: user.id }
        },
        transaction
      });
      if (existingUsername) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Username is already in use by another account.'
        });
      }
      user.username = cleanUsername;
    }

    if (name) {
      user.name = String(name).trim();
      user.avatar_text = user.name.charAt(0).toUpperCase();
    }

    if (department_id) {
      user.department_id = Number(department_id);
    }

    if (status !== undefined) {
      user.active = String(status).toUpperCase() === 'INACTIVE' ? false : true;
    } else if (active !== undefined) {
      user.active = Boolean(active);
    }

    // If new password provided, hash with bcryptjs
    if (password && String(password).trim()) {
      user.password = await hashPassword(String(password).trim());
    }

    await user.save({ transaction });
    await transaction.commit();

    const updated = await User.findByPk(user.id, {
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Role, as: 'role', attributes: ['id', 'name'] }
      ]
    });

    res.json({
      success: true,
      message: 'Faculty details updated successfully.',
      data: formatFaculty(updated, {
        designation: designation !== undefined ? String(designation).trim() : 'Faculty',
        phone: phone !== undefined ? String(phone).trim() : '',
        employee_code: employee_code ? String(employee_code).trim().toUpperCase() : user.username.toUpperCase()
      })
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

    let facultyRole = await Role.findOne({ where: { name: 'FACULTY' }, transaction });
    const where = { id };
    if (facultyRole) {
      where.role_id = facultyRole.id;
    }

    const user = await User.findOne({
      where,
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: `Faculty record not found with ID ${id}`
      });
    }

    let newActive;
    if (active !== undefined) {
      newActive = Boolean(active);
    } else if (status !== undefined) {
      newActive = String(status).toUpperCase() === 'ACTIVE';
    } else {
      newActive = !user.active;
    }

    user.active = newActive;
    await user.save({ transaction });
    await transaction.commit();

    const actionText = newActive ? 'activated' : 'deactivated';
    const newStatus = newActive ? 'ACTIVE' : 'INACTIVE';
    res.json({
      success: true,
      message: `Faculty account ${actionText} successfully.`,
      status: newStatus,
      active: newActive
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

// @desc    Delete faculty (or deactivate if referenced)
// @route   DELETE /api/faculty/:id
// @access  Private (Admin only)
export const deleteFaculty = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { deactivate, soft, permanent } = req.query;
    const isDeactivateReq = deactivate === 'true' || soft === 'true' || req.body?.deactivate === true;
    const isPermanent = permanent === 'true';

    let facultyRole = await Role.findOne({ where: { name: 'FACULTY' }, transaction });
    const where = { id };
    if (facultyRole) {
      where.role_id = facultyRole.id;
    }

    const user = await User.findOne({
      where,
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: `Faculty record not found with ID ${id}`
      });
    }

    // Check references across historical records (indents, transfers, transactions)
    const [indentCount, transferCount, stockTxCount] = await Promise.all([
      Indent.count({ where: { requested_by: user.id }, transaction }),
      Transfer.count({ where: { issued_by: user.id }, transaction }),
      StockTransaction.count({ where: { recorded_by: user.id }, transaction })
    ]);

    const totalRefs = indentCount + transferCount + stockTxCount;

    if (totalRefs > 0 && isPermanent) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        inUse: true,
        referenceCount: totalRefs,
        message: 'This faculty account is associated with existing records and cannot be permanently deleted. Deactivate the account instead.'
      });
    }

    if (isPermanent && totalRefs === 0) {
      await Notification.destroy({ where: { user_id: user.id }, transaction }).catch(() => {});
      await user.destroy({ transaction });
      await transaction.commit();

      return res.json({
        success: true,
        message: 'Faculty account deleted successfully.'
      });
    }

    // Deactivate account (soft delete / deactivate)
    user.active = false;
    await user.save({ transaction });
    await transaction.commit();

    return res.json({
      success: true,
      message: 'Faculty account deactivated successfully.',
      status: 'INACTIVE',
      active: false
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
