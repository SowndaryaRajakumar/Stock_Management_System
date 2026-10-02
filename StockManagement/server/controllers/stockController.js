import { Product, StockTransaction, Department, User } from '../models/index.js';
import { recordIncoming, recordOutgoing } from '../services/stockService.js';
import { formatProduct, formatStockTransaction } from '../utils/formatters.js';
import { Op } from 'sequelize';

// @desc    Record incoming stock (Stock IN)
// @route   POST /api/stock/incoming
export const handleIncomingStock = async (req, res, next) => {
  try {
    const { productId, quantity, date, remarks } = req.body;
    const result = await recordIncoming({
      productId,
      quantity,
      date,
      remarks,
      user: req.user
    });

    res.status(201).json({
      success: true,
      message: `Stock updated successfully. Added ${result.addedQuantity} units for ${result.product.productName}.`,
      data: result,
      transaction: result.transaction,
      product: result.product,
      previousQuantity: result.previousQuantity,
      addedQuantity: result.addedQuantity,
      currentQuantity: result.currentQuantity,
      newStock: result.currentQuantity
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Record outgoing stock (Stock OUT)
// @route   POST /api/stock/outgoing
export const handleOutgoingStock = async (req, res, next) => {
  try {
    const { productId, quantity, departmentId, department, indentDetailId, date, remarks } = req.body;
    const result = await recordOutgoing({
      productId,
      quantity,
      departmentId,
      department,
      indentDetailId,
      date,
      remarks,
      user: req.user
    });

    res.status(201).json({
      success: true,
      message: `Stock issued successfully. Issued ${result.issuedQuantity} units of ${result.product.productName}.`,
      data: result,
      transaction: result.transaction,
      product: result.product,
      previousQuantity: result.previousQuantity,
      issuedQuantity: result.issuedQuantity,
      currentQuantity: result.currentQuantity,
      newStock: result.currentQuantity,
      isLowStock: result.isLowStock,
      stockStatus: result.stockStatus
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get stock transaction history with filters
// @route   GET /api/stock/history
export const getStockHistory = async (req, res, next) => {
  try {
    const {
      productId,
      departmentId,
      department,
      transactionType,
      type,
      fromDate,
      toDate,
      search,
      page,
      limit
    } = req.query;

    const where = {};

    if (productId) {
      if (String(productId).match(/^\d+$/)) {
        where.product_id = productId;
      } else {
        where['$product.product_code$'] = String(productId).toUpperCase();
      }
    }

    if (departmentId) {
      where.department_id = departmentId;
    } else if (department && department !== 'ALL') {
      where['$department.name$'] = { [Op.like]: `%${department.trim()}%` };
    }

    const resolvedType = transactionType || type;
    if (resolvedType && resolvedType !== 'ALL') {
      if (resolvedType === 'IN' || resolvedType === 'PURCHASE') {
        where.transaction_type = 'PURCHASE';
      } else if (resolvedType === 'OUT' || resolvedType === 'TRANSFER') {
        where.transaction_type = 'TRANSFER';
      } else {
        where.transaction_type = resolvedType;
      }
    }

    if (fromDate || toDate) {
      where.transaction_date = {};
      if (fromDate) where.transaction_date[Op.gte] = new Date(fromDate);
      if (toDate) where.transaction_date[Op.lte] = new Date(toDate + ' 23:59:59');
    }

    if (search) {
      where[Op.or] = [
        { transaction_code: { [Op.like]: `%${search.trim()}%` } },
        { remarks: { [Op.like]: `%${search.trim()}%` } },
        { '$product.product_name$': { [Op.like]: `%${search.trim()}%` } },
        { '$product.product_code$': { [Op.like]: `%${search.trim()}%` } },
        { '$department.name$': { [Op.like]: `%${search.trim()}%` } },
        { '$recorder.name$': { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const include = [
      { model: Product, as: 'product' },
      { model: Department, as: 'department' },
      { model: User, as: 'recorder' }
    ];

    const [totalPurchases, totalTransfers] = await Promise.all([
      StockTransaction.count({ where: { transaction_type: 'PURCHASE' } }),
      StockTransaction.count({ where: { transaction_type: 'TRANSFER' } })
    ]);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 50);

    const { count: total, rows } = await StockTransaction.findAndCountAll({
      where,
      include,
      order: [['transaction_date', 'DESC'], ['id', 'DESC']],
      offset: (pageNum - 1) * pageSize,
      limit: pageSize,
      distinct: true
    });

    const formatted = rows.map(formatStockTransaction);

    res.json({
      success: true,
      count: formatted.length,
      total,
      totalPurchases,
      totalTransfers,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      limit: pageSize,
      transactions: formatted,
      history: formatted,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock items
// @route   GET /api/stock/low-stock
export const getLowStockItems = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { active: true },
      include: ['category', 'unit', 'stockDocument', 'documentReferences']
    });

    const formattedList = products.map(formatProduct);
    const lowStockList = formattedList.filter(p => p.isLowStock);

    res.json({
      success: true,
      count: lowStockList.length,
      total: lowStockList.length,
      lowStockItems: lowStockList,
      products: lowStockList,
      data: lowStockList
    });
  } catch (error) {
    next(error);
  }
};
