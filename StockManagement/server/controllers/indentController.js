import { Indent, IndentItem, Product, Department, User, sequelize } from '../models/index.js';
import {
  createIndent as createIndentService,
  submitIndent as submitIndentService,
  approveIndent as approveIndentService,
  rejectIndent as rejectIndentService
} from '../services/indentService.js';
import { formatIndent } from '../utils/formatters.js';
import { Op } from 'sequelize';

const INDENT_INCLUDES = [
  { model: Department, as: 'department' },
  { model: User, as: 'requester' },
  {
    model: IndentItem,
    as: 'items',
    include: [{ model: Product, as: 'product', include: ['unit'] }]
  }
];

// Helper to find indent by id or indent_number
const findIndent = async (identifier) => {
  if (!identifier) return null;
  let indent = null;
  if (String(identifier).match(/^\d+$/)) {
    indent = await Indent.findByPk(identifier, { include: INDENT_INCLUDES });
  }
  if (!indent) {
    indent = await Indent.findOne({
      where: { indent_number: String(identifier).toUpperCase() },
      include: INDENT_INCLUDES
    });
  }
  return indent;
};

// @desc    Get all indents with filters
// @route   GET /api/indents
export const getIndents = async (req, res, next) => {
  try {
    const { status, department, search, page, limit } = req.query;
    const where = {};

    // Role filtering: Faculty sees only their own indents
    if (req.user && req.user.role === 'FACULTY') {
      where.requested_by = req.user.id;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (department && department !== 'ALL') {
      where['$department.name$'] = { [Op.like]: `%${department.trim()}%` };
    }

    if (search) {
      where[Op.or] = [
        { indent_number: { [Op.like]: `%${search.trim()}%` } },
        { remarks: { [Op.like]: `%${search.trim()}%` } },
        { '$requester.name$': { [Op.like]: `%${search.trim()}%` } },
        { '$department.name$': { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 50);

    const { count: total, rows } = await Indent.findAndCountAll({
      where,
      include: INDENT_INCLUDES,
      order: [['id', 'DESC']],
      offset: (pageNum - 1) * pageSize,
      limit: pageSize,
      distinct: true
    });

    const formatted = rows.map(formatIndent);

    res.json({
      success: true,
      count: formatted.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      limit: pageSize,
      indents: formatted,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single indent by ID or IndentNumber
// @route   GET /api/indents/:id
export const getIndentById = async (req, res, next) => {
  try {
    const indent = await findIndent(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    const formatted = formatIndent(indent);
    res.json({ success: true, indent: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new indent request
// @route   POST /api/indents
export const createIndent = async (req, res, next) => {
  try {
    const {
      indentNumber,
      department,
      departmentId,
      requestingDepartment,
      purpose,
      requiredDate,
      remarks,
      items
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required in the indent.' });
    }

    const indent = await createIndentService({
      indentNumber,
      department,
      departmentId,
      requestingDepartment,
      purpose,
      requiredDate,
      remarks,
      items,
      user: req.user
    });

    res.status(201).json({
      success: true,
      message: `Indent ${indent.indentNumber} created successfully.`,
      indent,
      data: indent
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update draft indent
// @route   PUT /api/indents/:id
export const updateIndent = async (req, res, next) => {
  try {
    const indent = await findIndent(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    const { purpose, remarks, status } = req.body;
    if (remarks !== undefined || purpose !== undefined) {
      indent.remarks = remarks || purpose;
    }
    if (status) {
      indent.status = status;
    }
    await indent.save();

    const refreshed = await findIndent(indent.id);
    const formatted = formatIndent(refreshed);
    res.json({ success: true, message: 'Indent updated successfully.', indent: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit indent (DRAFT -> SUBMITTED)
// @route   POST /api/indents/:id/submit
export const submitIndent = async (req, res, next) => {
  try {
    const indent = await findIndent(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    indent.status = 'SUBMITTED';
    await indent.save();

    const refreshed = await findIndent(indent.id);
    const formatted = formatIndent(refreshed);
    res.json({ success: true, message: 'Indent submitted for review.', indent: formatted, data: formatted });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Review indent (Approve / Reject / Change status from admin)
// @route   POST /api/indents/:id/review
export const reviewIndent = async (req, res, next) => {
  try {
    const { action, approvedItems, adminRemarks, status } = req.body;
    const indent = await findIndent(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    if (action === 'REJECT') {
      const result = await rejectIndentService(indent.id, { remarks: adminRemarks }, req.user);
      return res.json({ success: true, message: 'Indent rejected.', indent: result, data: result });
    }

    if (action === 'UNDER_REVIEW' || status === 'UNDER_REVIEW') {
      indent.status = 'UNDER_REVIEW';
      if (adminRemarks) {
        indent.remarks = `${indent.remarks ? indent.remarks + ' | ' : ''}Review: ${adminRemarks}`;
      }
      await indent.save();
      const refreshed = await findIndent(indent.id);
      const formatted = formatIndent(refreshed);
      return res.json({ success: true, message: 'Indent moved to UNDER_REVIEW.', indent: formatted, data: formatted });
    }

    const result = await approveIndentService(indent.id, {
      approvals: approvedItems,
      remarks: adminRemarks
    }, req.user);

    res.json({ success: true, message: 'Indent review completed.', indent: result, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Recommend indent (SUBMITTED -> UNDER_REVIEW)
// @route   POST /api/indents/:id/recommend
export const recommendIndent = async (req, res, next) => {
  try {
    const indent = await findIndent(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    indent.status = 'UNDER_REVIEW';
    if (req.body.remarks) {
      indent.remarks = `${indent.remarks ? indent.remarks + ' | ' : ''}Recommendation: ${req.body.remarks}`;
    }
    await indent.save();

    const refreshed = await findIndent(indent.id);
    const formatted = formatIndent(refreshed);
    res.json({ success: true, message: 'Indent status changed to UNDER_REVIEW.', indent: formatted, data: formatted });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Approve indent (SUBMITTED / UNDER_REVIEW -> APPROVED)
// @route   POST /api/indents/:id/approve
export const approveIndent = async (req, res, next) => {
  try {
    const indent = await findIndent(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    const result = await approveIndentService(indent.id, req.body, req.user);
    res.json({ success: true, message: 'Indent approved successfully.', indent: result, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Reject indent
// @route   POST /api/indents/:id/reject
export const rejectIndent = async (req, res, next) => {
  try {
    const indent = await findIndent(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    const result = await rejectIndentService(indent.id, req.body, req.user);
    res.json({ success: true, message: 'Indent rejected.', indent: result, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Issue indent (For backward compatibility with existing route)
// @route   POST /api/indents/:id/issue
export const issueIndent = async (req, res, next) => {
  try {
    const indent = await findIndent(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    indent.status = 'COMPLETED';
    await indent.save();

    const refreshed = await findIndent(indent.id);
    const formatted = formatIndent(refreshed);

    res.json({
      success: true,
      message: `Indent ${formatted.indentNumber} marked as completed.`,
      indent: formatted,
      data: formatted,
      transactions: []
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Complete indent (Mark physically fulfilled offline without touching stock)
// @route   POST /api/indents/:id/complete
export const completeIndent = async (req, res, next) => {
  try {
    const indent = await findIndent(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    indent.status = 'COMPLETED';
    await indent.save();

    const refreshed = await findIndent(indent.id);
    const formatted = formatIndent(refreshed);

    res.json({
      success: true,
      message: `Indent ${formatted.indentNumber} marked as completed (physically fulfilled).`,
      indent: formatted,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};
