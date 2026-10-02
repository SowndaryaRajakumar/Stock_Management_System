import { Product, Purchase, Transfer, Indent, IndentItem, StockTransaction, Category, Department, User, StockDocument } from '../models/index.js';
import { formatProduct } from '../utils/formatters.js';
import { Op } from 'sequelize';

// @desc    Get structured report data
// @route   GET /api/reports
export const getReportData = async (req, res, next) => {
  try {
    const { reportType, startDate, endDate, category, register, department } = req.query;

    let data = [];
    let title = 'Consumable Stock Report';

    switch (reportType) {
      case 'LOW_STOCK': {
        title = 'Low Stock & Reorder Alert Report';
        const where = { active: true };
        if (category && category !== 'ALL') where['$category.name$'] = category;
        if (register && register !== 'ALL') where['$stockDocument.document_code$'] = register;

        const prods = await Product.findAll({
          where,
          include: ['category', 'unit', 'stockDocument'],
          order: [['product_name', 'ASC']]
        });

        const formatted = prods.map(formatProduct);
        const lowProds = formatted.filter(p => p.isLowStock);

        data = lowProds.map(p => ({
          productCode: p.productCode,
          name: p.productName,
          category: p.category,
          currentQuantity: p.currentQuantity,
          minimumStockLevel: p.minimumQuantity,
          unit: p.unit,
          stockRegister: p.stockRegister,
          deficit: Math.max(0, p.minimumQuantity - p.currentQuantity),
          status: p.currentQuantity === 0 ? 'Out of Stock' : 'Low Stock'
        }));
        break;
      }

      case 'PRODUCT': {
        title = 'Product Stock Inventory Report';
        const where = { active: true };
        if (category && category !== 'ALL') where['$category.name$'] = category;
        if (register && register !== 'ALL') where['$stockDocument.document_code$'] = register;

        const prods = await Product.findAll({
          where,
          include: ['category', 'unit', 'stockDocument'],
          order: [['product_name', 'ASC']]
        });

        data = prods.map(p => {
          const formatted = formatProduct(p);
          return {
            productCode: formatted.productCode,
            name: formatted.productName,
            category: formatted.category,
            currentQuantity: formatted.currentQuantity,
            minimumStockLevel: formatted.minimumQuantity,
            unit: formatted.unit,
            stockRegister: formatted.stockRegister,
            status: formatted.isLowStock ? 'Low Stock' : 'Available'
          };
        });
        break;
      }

      case 'PURCHASE': {
        title = 'Stock Purchase History Report';
        const where = {};
        if (startDate && endDate) {
          where.purchase_date = { [Op.gte]: startDate, [Op.lte]: endDate };
        }
        const purchases = await Purchase.findAll({
          where,
          include: [
            { model: Product, as: 'product' },
            { model: StockDocument, as: 'stockDocument' },
            { model: User, as: 'recorder' }
          ],
          order: [['purchase_date', 'DESC'], ['id', 'DESC']]
        });

        data = purchases.map(p => ({
          purchaseId: p.purchase_number,
          date: p.purchase_date,
          productCode: p.product?.product_code || '',
          productName: p.product?.product_name || '',
          stockRegister: p.stockDocument?.document_code || 'SR1',
          quantity: `${p.quantity} ${p.product?.unit?.name || 'Pieces'}`,
          supplier: p.supplier || '',
          invoiceNumber: p.invoice_number || '—',
          recordedBy: p.recorder?.name || 'Admin'
        }));
        break;
      }

      case 'TRANSFER': {
        title = 'Department Stock Transfer Report';
        const where = {};
        if (startDate && endDate) {
          where.transfer_date = { [Op.gte]: startDate, [Op.lte]: endDate };
        }
        if (department && department !== 'ALL') {
          where['$department.name$'] = { [Op.like]: `%${department.trim()}%` };
        }
        const transfers = await Transfer.findAll({
          where,
          include: [
            { model: Product, as: 'product' },
            { model: Department, as: 'department' },
            { model: StockDocument, as: 'stockDocument' },
            { model: User, as: 'issuer' }
          ],
          order: [['transfer_date', 'DESC'], ['id', 'DESC']]
        });

        data = transfers.map(t => ({
          transferId: t.transfer_number,
          date: t.transfer_date,
          productCode: t.product?.product_code || '',
          productName: t.product?.product_name || '',
          stockRegister: t.stockDocument?.document_code || 'SR1',
          quantity: `${t.quantity} ${t.product?.unit?.name || 'Pieces'}`,
          department: t.department?.name || '',
          indentNumber: 'Direct Transfer',
          issuedBy: t.issuer?.name || 'Admin'
        }));
        break;
      }

      case 'INDENT': {
        title = 'Department Indent Requests Report';
        const where = {};
        if (startDate && endDate) {
          where.created_at = {
            [Op.gte]: new Date(startDate),
            [Op.lte]: new Date(endDate + ' 23:59:59')
          };
        }
        if (department && department !== 'ALL') {
          where['$department.name$'] = { [Op.like]: `%${department.trim()}%` };
        }
        const indents = await Indent.findAll({
          where,
          include: [
            { model: Department, as: 'department' },
            { model: User, as: 'requester' },
            {
              model: IndentItem,
              as: 'items',
              include: [{ model: Product, as: 'product' }]
            }
          ],
          order: [['id', 'DESC']]
        });

        data = indents.map(i => ({
          indentNumber: i.indent_number,
          date: i.created_at ? new Date(i.created_at).toISOString().split('T')[0] : '',
          requester: i.requester?.name || 'Faculty',
          department: i.department?.name || '',
          itemsCount: i.items?.length || 0,
          itemSummary: (i.items || []).map(it => `${it.product?.product_name || ''} (Req: ${it.requested_quantity}, Appr: ${it.approved_quantity})`).join('; '),
          status: i.status
        }));
        break;
      }

      case 'HISTORY':
      default: {
        title = 'Complete Stock Movement Report';
        const where = {};
        if (startDate && endDate) {
          where.transaction_date = {
            [Op.gte]: new Date(startDate),
            [Op.lte]: new Date(endDate + ' 23:59:59')
          };
        }
        if (department && department !== 'ALL') {
          where['$department.name$'] = { [Op.like]: `%${department.trim()}%` };
        }
        const history = await StockTransaction.findAll({
          where,
          include: [
            {
              model: Product,
              as: 'product',
              include: [{ model: StockDocument, as: 'stockDocument' }]
            },
            { model: Department, as: 'department' },
            { model: User, as: 'recorder' }
          ],
          order: [['transaction_date', 'DESC'], ['id', 'DESC']]
        });

        data = history.map(h => ({
          transactionId: h.transaction_code,
          date: h.transaction_date ? new Date(h.transaction_date).toISOString().split('T')[0] : '',
          productCode: h.product?.product_code || '',
          productName: h.product?.product_name || '',
          stockRegister: h.product?.stockDocument?.document_code || 'SR1',
          type: h.transaction_type,
          quantity: Math.abs(Number(h.quantity || 0)),
          previousQuantity: Number(h.previous_quantity || 0),
          newQuantity: Number(h.new_quantity || 0),
          department: h.department?.name || (h.transaction_type === 'PURCHASE' ? 'Store' : 'Department'),
          performedBy: h.recorder?.name || 'Admin',
          referenceId: h.reference_id || h.transaction_code
        }));
        break;
      }
    }

    res.json({
      success: true,
      title,
      generatedAt: new Date().toISOString(),
      institution: 'Consumable Stock Management System',
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};
