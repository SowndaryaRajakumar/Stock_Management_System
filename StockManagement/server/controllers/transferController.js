import { sequelize, Product, Unit, Transfer, StockTransaction, Department, StockDocument, User } from '../models/index.js';
import { generateTransferNumber } from '../utils/codeGenerator.js';
import { syncProductLowStockNotification } from '../services/stockService.js';
import { formatTransfer, formatProduct } from '../utils/formatters.js';
import { Op } from 'sequelize';

// @desc    Get all transfers with optional filtering
// @route   GET /api/transfers
export const getTransfers = async (req, res, next) => {
  try {
    const { department, date, search, page, limit } = req.query;
    const where = {};

    if (date) {
      where.transfer_date = date;
    }
    if (department && department !== 'ALL') {
      where['$department.name$'] = { [Op.like]: `%${department.trim()}%` };
    }
    if (search) {
      where[Op.or] = [
        { transfer_number: { [Op.like]: `%${search.trim()}%` } },
        { issued_to: { [Op.like]: `%${search.trim()}%` } },
        { purpose: { [Op.like]: `%${search.trim()}%` } },
        { '$product.product_name$': { [Op.like]: `%${search.trim()}%` } },
        { '$product.product_code$': { [Op.like]: `%${search.trim()}%` } },
        { '$department.name$': { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const include = [
      {
        model: Product,
        as: 'product',
        include: [{ model: Unit, as: 'unit' }]
      },
      { model: Department, as: 'department' },
      { model: StockDocument, as: 'stockDocument' },
      { model: User, as: 'issuer' }
    ];

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.max(1, parseInt(limit, 10) || 10);

      const { count: total, rows } = await Transfer.findAndCountAll({
        where,
        include,
        order: [['id', 'DESC']],
        offset: (pageNum - 1) * pageSize,
        limit: pageSize,
        distinct: true
      });

      const formatted = rows.map(formatTransfer);
      return res.json({
        success: true,
        count: formatted.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize),
        limit: pageSize,
        transfers: formatted,
        data: formatted
      });
    }

    const rows = await Transfer.findAll({
      where,
      include,
      order: [['id', 'DESC']]
    });

    const formatted = rows.map(formatTransfer);
    res.json({
      success: true,
      count: formatted.length,
      total: formatted.length,
      transfers: formatted,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Issue stock transfer to department
// @route   POST /api/transfers
export const issueTransfer = async (req, res, next) => {
  try {
    const {
      productId,
      quantity,
      departmentId,
      department,
      issuedTo,
      purpose,
      date,
      stockRegister,
      pageNumber,
      remarks
    } = req.body;

    const qty = Number(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid product and quantity > 0 are required.' });
    }

    if (!departmentId && !department) {
      return res.status(400).json({ success: false, message: 'Receiving department is required.' });
    }

    // Execute in a Sequelize database transaction
    const result = await sequelize.transaction(async (t) => {
      // 1. Read product with row lock
      let product = null;
      if (String(productId).match(/^\d+$/)) {
        product = await Product.findByPk(productId, {
          include: [{ model: Unit, as: 'unit' }],
          lock: t.LOCK.UPDATE,
          transaction: t
        });
      }
      if (!product) {
        product = await Product.findOne({
          where: { product_code: String(productId).toUpperCase() },
          include: [{ model: Unit, as: 'unit' }],
          lock: t.LOCK.UPDATE,
          transaction: t
        });
      }

      if (!product) {
        throw new Error('Product not found.');
      }

      const previousQuantity = Number(product.current_quantity) || 0;

      // 2. Validate sufficient quantity
      if (qty > previousQuantity) {
        const err = new Error(`Validation Error: Cannot transfer ${qty} units. Only ${previousQuantity} available in stock.`);
        err.statusCode = 400;
        throw err;
      }

      const newQuantity = previousQuantity - qty;

      // 3. Decrease products.current_quantity
      product.current_quantity = newQuantity;
      product.updated_by = req.user?.id || 1;
      await product.save({ transaction: t });

      // Resolve department ID
      let targetDeptId = 1;
      if (departmentId && String(departmentId).match(/^\d+$/)) {
        targetDeptId = Number(departmentId);
      } else if (department) {
        const deptDoc = await Department.findOne({
          where: {
            [Op.or]: [
              { name: department.trim() },
              { code: department.trim().toUpperCase() }
            ]
          },
          transaction: t
        });
        if (deptDoc) targetDeptId = deptDoc.id;
      }

      // Resolve stock register ID
      let registerId = product.stock_register_id || 2;
      if (stockRegister) {
        const doc = await StockDocument.findOne({
          where: {
            [Op.or]: [
              { document_code: stockRegister },
              { document_name: stockRegister }
            ]
          },
          transaction: t
        });
        if (doc) registerId = doc.id;
      }

      const transferNumber = await generateTransferNumber();
      const transferDate = date || new Date().toISOString().split('T')[0];

      // 4. Create transfers record
      const transfer = await Transfer.create({
        transfer_number: transferNumber,
        product_id: product.id,
        quantity: qty,
        department_id: targetDeptId,
        issued_to: issuedTo || (req.user?.name ? `${req.user.name} (Faculty)` : 'Faculty User'),
        issued_by: req.user?.id || 1,
        purpose: purpose || 'Departmental Consumables Issue',
        transfer_date: transferDate,
        stock_register_id: registerId,
        page_number: Number(pageNumber) || product.page_number || 1,
        remarks: remarks || ''
      }, { transaction: t });

      // 5. Create stock_transactions record
      await StockTransaction.create({
        transaction_code: `TXN-${transferNumber}`,
        product_id: product.id,
        transaction_type: 'TRANSFER',
        quantity: qty,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        department_id: targetDeptId,
        reference_id: transfer.id,
        reference_type: 'TRANSFER',
        remarks: `Stock Issue to Department. ${remarks || ''}`,
        transaction_date: new Date(transferDate),
        recorded_by: req.user?.id || 1
      }, { transaction: t });

      // 6. Check low-stock condition & update notifications
      await syncProductLowStockNotification(product, t);

      return {
        transfer,
        product,
        quantity: qty,
        departmentId: targetDeptId
      };
    });

    const formattedTransfer = formatTransfer(result.transfer);
    const formattedProduct = formatProduct(result.product);

    res.status(201).json({
      success: true,
      message: `Successfully transferred ${qty} units of ${formattedProduct.productName}`,
      data: {
        transfer: formattedTransfer,
        product: formattedProduct,
        updatedProduct: formattedProduct,
        quantity: qty,
        department: formattedTransfer.department,
        productName: formattedProduct.productName
      },
      transfer: formattedTransfer,
      product: formattedProduct,
      updatedProduct: formattedProduct,
      quantity: qty,
      department: formattedTransfer.department,
      productName: formattedProduct.productName
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message === 'Product not found.') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};
