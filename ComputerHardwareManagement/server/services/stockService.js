import { sequelize, Product, StockTransaction, Department, Notification, User, Role } from '../models/index.js';
import { generatePurchaseNumber, generateTransferNumber } from '../utils/codeGenerator.js';
import { formatProduct, formatStockTransaction } from '../utils/formatters.js';

/**
 * Synchronize product low-stock notification state in MySQL:
 * - A product is LOW STOCK when: current_quantity <= minimum_quantity
 * - When entering/in low stock: creates or updates a single active alert for ADMIN
 * - Prevents duplicate spam by maintaining one active unread alert per low-stock product
 * - When restocked (current_quantity > minimum_quantity): marks existing active alert as resolved/read
 */
export const syncProductLowStockNotification = async (product, transaction = null) => {
  if (!product) return null;
  try {
    const minStock = Number(product.minimum_quantity !== undefined ? product.minimum_quantity : (product.minimum_stock_level || 0));
    const currentStock = Number(product.current_quantity || 0);
    const isLowStock = currentStock <= minStock;
    const prodName = product.product_name || product.name || 'Product';
    const unitName = product.unit?.name || 'Pieces';

    // Find the primary admin user ID to assign notification
    let adminUser = await User.findOne({
      include: [{ model: Role, as: 'role', where: { name: 'ADMIN' } }],
      transaction
    });
    const adminUserId = adminUser ? adminUser.id : 1;

    if (isLowStock) {
      const message = `${prodName} (${product.product_code}) is low in stock. Current quantity: ${currentStock} ${unitName}. Minimum required: ${minStock} ${unitName}.`;

      // Check for an existing active (unread) alert for this product
      const activeAlert = await Notification.findOne({
        where: {
          type: 'LOW_STOCK',
          reference_id: product.id,
          is_read: false
        },
        transaction
      });

      if (activeAlert) {
        activeAlert.message = message;
        activeAlert.title = 'Low Stock Alert';
        await activeAlert.save({ transaction });
        return activeAlert;
      } else {
        return await Notification.create({
          user_id: adminUserId,
          type: 'LOW_STOCK',
          title: 'Low Stock Alert',
          message,
          reference_id: product.id,
          reference_type: 'PRODUCT',
          is_read: false
        }, { transaction });
      }
    } else {
      // Restocked above minimum: resolve any unread low-stock notifications for this product
      await Notification.update(
        { is_read: true },
        {
          where: {
            type: 'LOW_STOCK',
            reference_id: product.id,
            is_read: false
          },
          transaction
        }
      );
      return null;
    }
  } catch (error) {
    console.error('Error in syncProductLowStockNotification:', error);
    return null;
  }
};

/**
 * Record incoming stock (Stock IN / Purchase) inside a Sequelize transaction
 */
export const recordIncoming = async ({
  productId,
  quantity,
  date,
  remarks,
  user
}) => {
  const numQty = Number(quantity);
  if (!productId || isNaN(numQty) || numQty <= 0) {
    throw new Error('Valid product and positive quantity (> 0) are required.');
  }

  return await sequelize.transaction(async (t) => {
    // Find product with row locking
    let product = null;
    if (String(productId).match(/^\d+$/)) {
      product = await Product.findByPk(productId, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });
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

    const previousQuantity = Number(product.current_quantity) || 0;
    const newQuantity = previousQuantity + numQty;

    product.current_quantity = newQuantity;
    product.updated_by = user?.id || 1;
    await product.save({ transaction: t });

    // Generate transaction code
    const txnCode = await generatePurchaseNumber();

    const transaction = await StockTransaction.create({
      transaction_code: txnCode,
      product_id: product.id,
      transaction_type: 'PURCHASE',
      quantity: numQty,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      department_id: 7, // Central Store
      reference_id: product.id,
      reference_type: 'STOCK_IN',
      remarks: remarks || 'Stock received',
      transaction_date: date ? new Date(date) : new Date(),
      recorded_by: user?.id || 1
    }, { transaction: t });

    // Update or clear low-stock notifications
    await syncProductLowStockNotification(product, t);

    const formattedProduct = formatProduct(product);
    const formattedTransaction = formatStockTransaction(transaction);

    return {
      success: true,
      product: formattedProduct,
      transaction: formattedTransaction,
      previousQuantity,
      addedQuantity: numQty,
      currentQuantity: newQuantity,
      stockStatus: formattedProduct.stockStatus
    };
  });
};

/**
 * Record outgoing stock (Stock OUT / Transfer) inside a Sequelize transaction
 */
export const recordOutgoing = async ({
  productId,
  quantity,
  departmentId,
  department,
  indentDetailId,
  date,
  remarks,
  user
}) => {
  const numQty = Number(quantity);
  if (!productId || isNaN(numQty) || numQty <= 0) {
    throw new Error('Valid product and positive quantity (> 0) are required.');
  }

  return await sequelize.transaction(async (t) => {
    let product = null;
    if (String(productId).match(/^\d+$/)) {
      product = await Product.findByPk(productId, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });
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

    const previousQuantity = Number(product.current_quantity) || 0;

    if (numQty > previousQuantity) {
      throw new Error(`Insufficient stock. Available: ${previousQuantity}, Requested: ${numQty}.`);
    }

    const newQuantity = previousQuantity - numQty;
    product.current_quantity = newQuantity;
    product.updated_by = user?.id || 1;
    await product.save({ transaction: t });

    // Resolve department
    let targetDeptId = 1; // Default EEE
    if (departmentId && String(departmentId).match(/^\d+$/)) {
      targetDeptId = Number(departmentId);
    } else if (department) {
      const deptDoc = await Department.findOne({
        where: {
          name: department
        },
        transaction: t
      });
      if (deptDoc) targetDeptId = deptDoc.id;
    }

    const txnCode = await generateTransferNumber();

    const transaction = await StockTransaction.create({
      transaction_code: txnCode,
      product_id: product.id,
      transaction_type: 'TRANSFER',
      quantity: numQty,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      department_id: targetDeptId,
      reference_id: indentDetailId ? (Number(indentDetailId) || null) : null,
      reference_type: 'TRANSFER',
      remarks: remarks || `Issued to department`,
      transaction_date: date ? new Date(date) : new Date(),
      recorded_by: user?.id || 1
    }, { transaction: t });

    // Check low stock
    await syncProductLowStockNotification(product, t);

    const formattedProduct = formatProduct(product);
    const formattedTransaction = formatStockTransaction(transaction);

    return {
      success: true,
      product: formattedProduct,
      transaction: formattedTransaction,
      previousQuantity,
      issuedQuantity: numQty,
      currentQuantity: newQuantity,
      isLowStock: formattedProduct.isLowStock,
      stockStatus: formattedProduct.stockStatus
    };
  });
};
