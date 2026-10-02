import { sequelize, Product, Purchase, StockTransaction, StockDocument, User } from '../models/index.js';
import { generatePurchaseNumber } from '../utils/codeGenerator.js';
import { syncProductLowStockNotification } from '../services/stockService.js';
import { formatPurchase, formatProduct } from '../utils/formatters.js';
import { Op } from 'sequelize';

// @desc    Get all purchases with optional filtering
// @route   GET /api/purchases
export const getPurchases = async (req, res, next) => {
  try {
    const { supplier, date, search, page, limit } = req.query;
    const where = {};

    if (supplier) {
      where.supplier = { [Op.like]: `%${supplier.trim()}%` };
    }
    if (date) {
      where.purchase_date = date;
    }
    if (search) {
      where[Op.or] = [
        { purchase_number: { [Op.like]: `%${search.trim()}%` } },
        { supplier: { [Op.like]: `%${search.trim()}%` } },
        { invoice_number: { [Op.like]: `%${search.trim()}%` } },
        { '$product.product_name$': { [Op.like]: `%${search.trim()}%` } },
        { '$product.product_code$': { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const include = [
      { model: Product, as: 'product' },
      { model: StockDocument, as: 'stockDocument' },
      { model: User, as: 'recorder' }
    ];

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.max(1, parseInt(limit, 10) || 10);

      const { count: total, rows } = await Purchase.findAndCountAll({
        where,
        include,
        order: [['id', 'DESC']],
        offset: (pageNum - 1) * pageSize,
        limit: pageSize,
        distinct: true
      });

      const formatted = rows.map(formatPurchase);
      return res.json({
        success: true,
        count: formatted.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize),
        limit: pageSize,
        purchases: formatted,
        data: formatted
      });
    }

    const rows = await Purchase.findAll({
      where,
      include,
      order: [['id', 'DESC']]
    });

    const formatted = rows.map(formatPurchase);
    res.json({
      success: true,
      count: formatted.length,
      total: formatted.length,
      purchases: formatted,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a new stock purchase / incoming stock
// @route   POST /api/purchases
export const recordPurchase = async (req, res, next) => {
  try {
    const {
      productId,
      quantity,
      supplier,
      invoiceNumber,
      unitPrice,
      date,
      stockRegister,
      pageNumber,
      remarks
    } = req.body;

    const qty = Number(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid product and quantity > 0 are required.' });
    }

    // Execute within a Sequelize database transaction
    const result = await sequelize.transaction(async (t) => {
      // 1. Read product with row lock
      let product = null;
      if (String(productId).match(/^\d+$/)) {
        product = await Product.findByPk(productId, { lock: t.LOCK.UPDATE, transaction: t });
      }
      if (!product) {
        product = await Product.findOne({
          where: { product_code: String(productId).toUpperCase() },
          lock: t.LOCK.UPDATE,
          transaction: t
        });
      }

      if (!product) {
        throw new Error('Product not found.');
      }

      const purchaseNumber = await generatePurchaseNumber();
      const previousQuantity = Number(product.current_quantity) || 0;
      const newQuantity = previousQuantity + qty;

      // 2. Update products.current_quantity
      product.current_quantity = newQuantity;
      product.updated_by = req.user?.id || 1;
      await product.save({ transaction: t });

      // Resolve stock register ID
      let registerId = product.stock_register_id || 2; // Default SR1
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

      const numUnitPrice = Number(unitPrice) || 0;
      const totalAmount = numUnitPrice * qty;
      const purchaseDate = date || new Date().toISOString().split('T')[0];

      // 3. Create purchases record
      const trimmedSupplier = supplier && typeof supplier === 'string' && supplier.trim() ? supplier.trim() : null;
      const trimmedInvoice = invoiceNumber && typeof invoiceNumber === 'string' && invoiceNumber.trim() ? invoiceNumber.trim() : null;
      const trimmedRemarks = remarks && typeof remarks === 'string' && remarks.trim() ? remarks.trim() : '';

      const purchase = await Purchase.create({
        purchase_number: purchaseNumber,
        product_id: product.id,
        quantity: qty,
        unit_price: numUnitPrice,
        total_amount: totalAmount,
        supplier: trimmedSupplier,
        invoice_number: trimmedInvoice || '',
        purchase_date: purchaseDate,
        stock_register_id: registerId,
        page_number: Number(pageNumber) || product.page_number || 1,
        remarks: trimmedRemarks,
        recorded_by: req.user?.id || 1
      }, { transaction: t });

      // 4. Create stock_transactions record
      const remarkSegments = [];
      if (trimmedSupplier) remarkSegments.push(`Supplier: ${trimmedSupplier}`);
      if (trimmedInvoice) remarkSegments.push(`Invoice: ${trimmedInvoice}`);
      if (trimmedRemarks) remarkSegments.push(trimmedRemarks);
      const purchaseTxnRemarks = remarkSegments.length > 0
        ? `Purchase (${remarkSegments.join(' - ')})`
        : 'Stock Purchase';

      await StockTransaction.create({
        transaction_code: `TXN-${purchaseNumber}`,
        product_id: product.id,
        transaction_type: 'PURCHASE',
        quantity: qty,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        department_id: 7, // Central Store
        reference_id: purchase.id,
        reference_type: 'PURCHASE',
        remarks: purchaseTxnRemarks,
        transaction_date: new Date(purchaseDate),
        recorded_by: req.user?.id || 1
      }, { transaction: t });

      // 5. Check low-stock condition & update notifications
      await syncProductLowStockNotification(product, t);

      return {
        purchase,
        product,
        quantity: qty
      };
    });

    const formattedPurchase = formatPurchase(result.purchase);
    const formattedProduct = formatProduct(result.product);

    res.status(201).json({
      success: true,
      message: `Successfully recorded purchase of ${qty} units of ${formattedProduct.productName}`,
      data: {
        purchase: formattedPurchase,
        product: formattedProduct,
        updatedProduct: formattedProduct,
        quantity: qty,
        productName: formattedProduct.productName
      },
      purchase: formattedPurchase,
      product: formattedProduct,
      updatedProduct: formattedProduct,
      quantity: qty,
      productName: formattedProduct.productName
    });
  } catch (error) {
    if (error.message === 'Product not found.') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};
