import { Indent, IndentItem, Product, Department, User, sequelize } from '../models/index.js';
import {
  createIndent as createIndentService,
  updateIndentRecord as updateIndentService,
  deleteIndentRecord as deleteIndentService
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

// @desc    Get all indents with filters (Manual Indent Register)
// @route   GET /api/indents
export const getIndents = async (req, res, next) => {
  try {
    const { status, department, product, date, search, page, limit } = req.query;
    const where = {};

    // Role filtering: Faculty sees only their own indents if applicable
    if (req.user && req.user.role === 'FACULTY') {
      where.requested_by = req.user.id;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (department && department !== 'ALL') {
      if (String(department).match(/^\d+$/)) {
        where.department_id = parseInt(department, 10);
      } else {
        where['$department.name$'] = { [Op.like]: `%${department.trim()}%` };
      }
    }

    if (date) {
      where.created_at = {
        [Op.gte]: new Date(`${date}T00:00:00.000Z`),
        [Op.lte]: new Date(`${date}T23:59:59.999Z`)
      };
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

    let formatted = rows.map(formatIndent);

    // Optional client-side product filter on items if requested
    if (product && product !== 'ALL') {
      const pSearch = String(product).toLowerCase().trim();
      formatted = formatted.filter(ind =>
        ind.items?.some(it =>
          String(it.productId) === pSearch ||
          (it.productName || '').toLowerCase().includes(pSearch) ||
          (it.productCode || '').toLowerCase().includes(pSearch)
        )
      );
    }

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

// @desc    Record manual indent received by store
// @route   POST /api/indents
export const createIndent = async (req, res, next) => {
  try {
    const indent = await createIndentService({
      ...req.body,
      user: req.user
    });

    res.status(201).json({
      success: true,
      message: `Indent ${indent.indentNumber} recorded successfully.`,
      indent,
      data: indent
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update manual indent record
// @route   PUT /api/indents/:id
export const updateIndent = async (req, res, next) => {
  try {
    const indent = await findIndent(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    const updated = await updateIndentService(indent.id, req.body);

    res.json({
      success: true,
      message: 'Indent record updated successfully.',
      indent: updated,
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete manual indent record
// @route   DELETE /api/indents/:id
export const deleteIndent = async (req, res, next) => {
  try {
    const indent = await findIndent(req.params.id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Indent not found.' });
    }

    await deleteIndentService(indent.id);

    res.json({
      success: true,
      message: 'Indent record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LEGACY STUBS FOR BACKWARD COMPATIBILITY
// ==========================================
export const submitIndent = async (req, res) => {
  res.json({ success: true, message: 'Indent recorded in register.' });
};
export const reviewIndent = async (req, res) => {
  res.json({ success: true, message: 'Indent recorded in register.' });
};
export const recommendIndent = async (req, res) => {
  res.json({ success: true, message: 'Indent recorded in register.' });
};
export const approveIndent = async (req, res) => {
  res.json({ success: true, message: 'Indent recorded in register.' });
};
export const rejectIndent = async (req, res) => {
  res.json({ success: true, message: 'Indent recorded in register.' });
};
export const issueIndent = async (req, res) => {
  res.json({ success: true, message: 'Issue processed offline.' });
};
export const completeIndent = async (req, res) => {
  res.json({ success: true, message: 'Indent fulfilled.' });
};
