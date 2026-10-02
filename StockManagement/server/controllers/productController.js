import { sequelize, Product, Category, Unit, Department, StockDocument, ProductDocumentReference, ProductRemark, StockTransaction, Purchase, Transfer, IndentItem, User } from '../models/index.js';
import { generateProductCode } from '../utils/codeGenerator.js';
import { syncProductLowStockNotification } from '../services/stockService.js';
import { formatProduct, formatStockTransaction } from '../utils/formatters.js';
import { Op } from 'sequelize';

const PRODUCT_INCLUDES = [
  { model: Category, as: 'category' },
  { model: Unit, as: 'unit' },
  { model: StockDocument, as: 'stockDocument' },
  { model: ProductDocumentReference, as: 'documentReferences' },
  { model: ProductRemark, as: 'remarks', include: [{ model: User, as: 'creator' }] }
];

// Helper to find product by id or product_code
const findProduct = async (identifier) => {
  if (!identifier) return null;
  let product = null;
  if (String(identifier).match(/^\d+$/)) {
    product = await Product.findByPk(identifier, { include: PRODUCT_INCLUDES });
  }
  if (!product) {
    product = await Product.findOne({
      where: { product_code: String(identifier).toUpperCase() },
      include: PRODUCT_INCLUDES
    });
  }
  return product;
};

// @desc    Get all products with search & filter
// @route   GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const { search, category, register, status, lowStock, page, limit } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { product_name: { [Op.like]: `%${search.trim()}%` } },
        { name: { [Op.like]: `%${search.trim()}%` } },
        { product_code: { [Op.like]: `%${search.trim()}%` } },
        { '$category.name$': { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    if (category && category !== 'ALL') {
      where['$category.name$'] = category.trim();
    }

    if (register && register !== 'ALL') {
      where['$stockDocument.document_code$'] = register.trim();
    }

    if (req.user && req.user.role === 'FACULTY') {
      where.active = true;
    } else if (status && status !== 'ALL') {
      if (status === 'ACTIVE') {
        where.active = true;
      } else if (status === 'INACTIVE') {
        where.active = false;
      } else {
        where.status = status;
      }
    } else if (!status) {
      where.active = true;
    }

    let rows = await Product.findAll({
      where,
      include: PRODUCT_INCLUDES,
      order: [['product_name', 'ASC']]
    });

    let formattedProducts = rows.map(formatProduct);

    if (lowStock === 'true') {
      formattedProducts = formattedProducts.filter(p => p.isLowStock);
    }

    const total = formattedProducts.length;

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.max(1, parseInt(limit, 10) || 10);
      const startIndex = (pageNum - 1) * pageSize;
      const paginated = formattedProducts.slice(startIndex, startIndex + pageSize);

      return res.json({
        success: true,
        count: paginated.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize),
        limit: pageSize,
        products: paginated,
        data: paginated
      });
    }

    res.json({
      success: true,
      count: formattedProducts.length,
      total,
      products: formattedProducts,
      data: formattedProducts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or ProductCode
// @route   GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const formatted = formatProduct(product);
    res.json({ success: true, product: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete product details (references, history, remarks, stock status)
// @route   GET /api/products/:id/details
export const getProductDetails = async (req, res, next) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const formattedProduct = formatProduct(product);

    // Fetch transaction history
    const historyRows = await StockTransaction.findAll({
      where: { product_id: product.id },
      include: [
        { model: Product, as: 'product' },
        { model: Department, as: 'department' },
        { model: User, as: 'recorder' }
      ],
      order: [['transaction_date', 'DESC'], ['id', 'DESC']],
      limit: 50
    });
    const history = historyRows.map(formatStockTransaction);

    // Remarks
    const remarks = formattedProduct.remarks || [];

    res.json({
      success: true,
      product: formattedProduct,
      stockStatus: formattedProduct.stockStatus,
      references: formattedProduct.references,
      history,
      remarks,
      data: {
        product: formattedProduct,
        stockStatus: formattedProduct.stockStatus,
        references: formattedProduct.references,
        history,
        remarks
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    const {
      productName,
      name,
      category,
      categoryId,
      unit,
      unitId,
      description,
      currentQuantity,
      minimumQuantity,
      minimumStockLevel,
      stockRegister,
      pageNumber,
      registerRefs,
      initialRemark
    } = req.body;

    const resolvedName = (productName || name || '').trim();
    if (!resolvedName) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    // Resolve Category ID
    let resolvedCatId = categoryId;
    if (!resolvedCatId && category) {
      const catDoc = await Category.findOne({ where: { name: category.trim() } });
      if (catDoc) resolvedCatId = catDoc.id;
    }
    if (!resolvedCatId) {
      // Default to first category or create
      const firstCat = await Category.findOne();
      resolvedCatId = firstCat ? firstCat.id : 1;
    }

    // Resolve Unit ID
    let resolvedUnitId = unitId;
    if (!resolvedUnitId && unit) {
      const unitDoc = await Unit.findOne({
        where: {
          [Op.or]: [
            { name: unit.trim() },
            { symbol: unit.trim() }
          ]
        }
      });
      if (unitDoc) resolvedUnitId = unitDoc.id;
    }
    if (!resolvedUnitId) {
      const firstUnit = await Unit.findOne();
      resolvedUnitId = firstUnit ? firstUnit.id : 1;
    }

    // Resolve Stock Register ID
    let resolvedRegisterId = 2; // default SR1
    if (stockRegister) {
      const doc = await StockDocument.findOne({
        where: {
          [Op.or]: [
            { document_code: stockRegister },
            { document_name: stockRegister }
          ]
        }
      });
      if (doc) resolvedRegisterId = doc.id;
    }

    const resolvedCode = await generateProductCode();
    const initQty = Math.max(0, Number(currentQuantity) || 0);
    const minQty = Math.max(0, Number(minimumQuantity !== undefined ? minimumQuantity : minimumStockLevel) || 5);

    const product = await sequelize.transaction(async (t) => {
      const newProd = await Product.create({
        product_code: resolvedCode,
        product_name: resolvedName,
        name: resolvedName,
        description: description || '',
        category_id: resolvedCatId,
        unit_id: resolvedUnitId,
        current_quantity: initQty,
        minimum_quantity: minQty,
        minimum_stock_level: minQty,
        stock_register_id: resolvedRegisterId,
        page_number: Number(pageNumber) || 1,
        active: true,
        status: 'ACTIVE',
        created_by: req.user?.id || 1,
        updated_by: req.user?.id || 1
      }, { transaction: t });

      // Create document references
      if (Array.isArray(registerRefs) && registerRefs.length > 0) {
        for (const ref of registerRefs) {
          const sheetName = (ref.sheet || ref.stockDocumentName || 'SR1').toUpperCase();
          const page = Number(ref.page || ref.pageNumber) || 1;
          const stockDoc = await StockDocument.findOne({
            where: {
              [Op.or]: [
                { document_code: sheetName },
                { document_name: sheetName }
              ]
            },
            transaction: t
          });

          await ProductDocumentReference.create({
            product_id: newProd.id,
            stock_document_id: stockDoc ? stockDoc.id : resolvedRegisterId,
            stock_document_name: sheetName,
            page_number: page,
            reference_note: ref.note || ref.referenceNote || ''
          }, { transaction: t });
        }
      } else {
        const sheetName = (stockRegister || 'SR1').toUpperCase();
        await ProductDocumentReference.create({
          product_id: newProd.id,
          stock_document_id: resolvedRegisterId,
          stock_document_name: sheetName,
          page_number: Number(pageNumber) || 1
        }, { transaction: t });
      }

      // Initial remark
      if (initialRemark && initialRemark.trim()) {
        await ProductRemark.create({
          product_id: newProd.id,
          remark: initialRemark.trim(),
          created_by: req.user?.id || 1
        }, { transaction: t });
      }

      // Initial stock transaction if initial quantity > 0
      if (initQty > 0) {
        await StockTransaction.create({
          transaction_code: `TXN-INIT-${resolvedCode}`,
          product_id: newProd.id,
          transaction_type: 'PURCHASE',
          quantity: initQty,
          previous_quantity: 0,
          new_quantity: initQty,
          department_id: 7, // Store
          reference_id: newProd.id,
          reference_type: 'OPENING_STOCK',
          remarks: 'Physical register opening stock balance',
          transaction_date: new Date(),
          recorded_by: req.user?.id || 1
        }, { transaction: t });
      }

      await syncProductLowStockNotification(newProd, t);

      return newProd;
    });

    const refreshed = await findProduct(product.id);
    const formatted = formatProduct(refreshed);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: formatted,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product details
// @route   PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const {
      productName,
      name,
      category,
      categoryId,
      unit,
      unitId,
      description,
      currentQuantity,
      minimumQuantity,
      minimumStockLevel,
      active,
      status,
      stockRegister,
      pageNumber,
      registerRefs
    } = req.body;

    await sequelize.transaction(async (t) => {
      const prodToUpdate = await Product.findByPk(product.id, { lock: t.LOCK.UPDATE, transaction: t });

      if (productName) {
        prodToUpdate.product_name = productName.trim();
        prodToUpdate.name = productName.trim();
      } else if (name) {
        prodToUpdate.product_name = name.trim();
        prodToUpdate.name = name.trim();
      }

      if (description !== undefined) prodToUpdate.description = description;

      if (categoryId) {
        prodToUpdate.category_id = categoryId;
      } else if (category) {
        const cat = await Category.findOne({ where: { name: category.trim() }, transaction: t });
        if (cat) prodToUpdate.category_id = cat.id;
      }

      if (unitId) {
        prodToUpdate.unit_id = unitId;
      } else if (unit) {
        const u = await Unit.findOne({ where: { name: unit.trim() }, transaction: t });
        if (u) prodToUpdate.unit_id = u.id;
      }

      // Handle Current Quantity adjustment
      if (currentQuantity !== undefined) {
        const newQty = Math.max(0, Number(currentQuantity));
        const prevQty = Number(prodToUpdate.current_quantity) || 0;
        if (!isNaN(newQty) && newQty !== prevQty) {
          const diff = newQty - prevQty;
          await StockTransaction.create({
            transaction_code: `TXN-ADJ-${prodToUpdate.product_code}-${Date.now()}`,
            product_id: prodToUpdate.id,
            transaction_type: diff > 0 ? 'PURCHASE' : 'TRANSFER',
            quantity: Math.abs(diff),
            previous_quantity: prevQty,
            new_quantity: newQty,
            department_id: 7,
            reference_id: prodToUpdate.id,
            reference_type: 'ADJUSTMENT',
            remarks: `Inventory stock quantity adjusted by Admin (${diff > 0 ? '+' : ''}${diff})`,
            transaction_date: new Date(),
            recorded_by: req.user?.id || 1
          }, { transaction: t });

          prodToUpdate.current_quantity = newQty;
        }
      }

      if (minimumQuantity !== undefined) {
        prodToUpdate.minimum_quantity = Math.max(0, Number(minimumQuantity));
        prodToUpdate.minimum_stock_level = prodToUpdate.minimum_quantity;
      } else if (minimumStockLevel !== undefined) {
        prodToUpdate.minimum_stock_level = Math.max(0, Number(minimumStockLevel));
        prodToUpdate.minimum_quantity = prodToUpdate.minimum_stock_level;
      }

      if (active !== undefined) {
        prodToUpdate.active = Boolean(active);
        prodToUpdate.status = prodToUpdate.active ? 'ACTIVE' : 'INACTIVE';
      } else if (status !== undefined) {
        prodToUpdate.status = status;
        prodToUpdate.active = status === 'ACTIVE';
      }

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
        if (doc) prodToUpdate.stock_register_id = doc.id;
      }

      if (pageNumber !== undefined) {
        prodToUpdate.page_number = Number(pageNumber) || 1;
      }

      prodToUpdate.updated_by = req.user?.id || 1;
      await prodToUpdate.save({ transaction: t });

      // Update register references if supplied
      if (Array.isArray(registerRefs) && registerRefs.length > 0) {
        await ProductDocumentReference.destroy({ where: { product_id: prodToUpdate.id }, transaction: t });
        for (const ref of registerRefs) {
          const sheetName = (ref.sheet || ref.stockDocumentName || 'SR1').toUpperCase();
          const page = Math.max(1, Number(ref.page || ref.pageNumber) || 1);
          const stockDoc = await StockDocument.findOne({
            where: {
              [Op.or]: [
                { document_code: sheetName },
                { document_name: sheetName }
              ]
            },
            transaction: t
          });

          await ProductDocumentReference.create({
            product_id: prodToUpdate.id,
            stock_document_id: stockDoc ? stockDoc.id : (prodToUpdate.stock_register_id || 2),
            stock_document_name: sheetName,
            page_number: page,
            reference_note: ref.note || ref.referenceNote || ''
          }, { transaction: t });
        }
      }

      await syncProductLowStockNotification(prodToUpdate, t);
    });

    const refreshed = await findProduct(product.id);
    const formatted = formatProduct(refreshed);

    res.json({
      success: true,
      message: 'Product updated successfully.',
      product: formatted,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or deactivate product safely
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check all historical dependencies in MySQL
    const [txnCount, indentCount, purchaseCount, transferCount] = await Promise.all([
      StockTransaction.count({ where: { product_id: product.id } }),
      IndentItem.count({ where: { product_id: product.id } }),
      Purchase.count({ where: { product_id: product.id } }),
      Transfer.count({ where: { product_id: product.id } })
    ]);

    if (txnCount > 0 || indentCount > 0 || purchaseCount > 0 || transferCount > 0) {
      // Historical records exist: deactivate instead
      product.active = false;
      product.status = 'INACTIVE';
      product.updated_by = req.user?.id || 1;
      await product.save();

      const formatted = formatProduct(product);
      return res.json({
        success: true,
        message: 'This product cannot be deleted because it is referenced by existing stock or transaction records. It has been deactivated instead to preserve historical records.',
        deleted: false,
        deactivated: true,
        product: formatted
      });
    }

    // Safe to fully remove document references, remarks, and product
    await sequelize.transaction(async (t) => {
      await ProductDocumentReference.destroy({ where: { product_id: product.id }, transaction: t });
      await ProductRemark.destroy({ where: { product_id: product.id }, transaction: t });
      await Product.destroy({ where: { id: product.id }, transaction: t });
    });

    res.json({
      success: true,
      message: `Product "${product.product_name}" (${product.product_code}) deleted successfully.`,
      deleted: true,
      deactivated: false
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Product Document References Endpoints
// ==========================================
export const getProductReferences = async (req, res, next) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const refs = await ProductDocumentReference.findAll({
      where: { product_id: product.id },
      include: [{ model: StockDocument, as: 'stockDocument' }]
    });

    const formatted = refs.map(r => ({
      id: r.id,
      _id: r.id,
      productId: r.product_id,
      stockDocumentId: r.stock_document_id,
      stockDocumentName: r.stock_document_name,
      sheet: r.stock_document_name,
      pageNumber: r.page_number,
      page: r.page_number,
      referenceNote: r.reference_note,
      note: r.reference_note
    }));

    res.json({ success: true, count: formatted.length, references: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const createProductReference = async (req, res, next) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { stockDocumentId, stockDocumentName, sheet, pageNumber, page, referenceNote, note } = req.body;
    const docName = (stockDocumentName || sheet || 'SR1').toUpperCase();

    let docId = stockDocumentId;
    if (!docId) {
      const doc = await StockDocument.findOne({ where: { document_code: docName } });
      docId = doc ? doc.id : 2;
    }

    const ref = await ProductDocumentReference.create({
      product_id: product.id,
      stock_document_id: docId,
      stock_document_name: docName,
      page_number: Number(pageNumber || page) || 1,
      reference_note: referenceNote || note || ''
    });

    res.status(201).json({ success: true, reference: ref, data: ref });
  } catch (error) {
    next(error);
  }
};

export const addProductReference = createProductReference;

export const updateProductReference = async (req, res, next) => {
  try {
    const { id, refId } = req.params;
    const ref = await ProductDocumentReference.findOne({
      where: { id: refId, product_id: id }
    });

    if (!ref) {
      return res.status(404).json({ success: false, message: 'Reference not found.' });
    }

    const { stockDocumentName, sheet, pageNumber, page, referenceNote, note } = req.body;
    if (stockDocumentName || sheet) ref.stock_document_name = (stockDocumentName || sheet).toUpperCase();
    if (pageNumber !== undefined || page !== undefined) ref.page_number = Number(pageNumber || page);
    if (referenceNote !== undefined || note !== undefined) ref.reference_note = referenceNote || note;

    await ref.save();
    res.json({ success: true, reference: ref, data: ref });
  } catch (error) {
    next(error);
  }
};

export const deleteProductReference = async (req, res, next) => {
  try {
    const { id, refId } = req.params;
    const ref = await ProductDocumentReference.findOne({
      where: { id: refId, product_id: id }
    });

    if (!ref) {
      return res.status(404).json({ success: false, message: 'Reference not found.' });
    }

    await ref.destroy();
    res.json({ success: true, message: 'Reference deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Product Remarks Endpoints
// ==========================================
export const getProductRemarks = async (req, res, next) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const remarks = await ProductRemark.findAll({
      where: { product_id: product.id },
      include: [{ model: User, as: 'creator' }],
      order: [['created_at', 'DESC']]
    });

    const formatted = remarks.map(r => ({
      id: r.id,
      _id: r.id,
      author: r.creator?.name || 'Admin',
      date: new Date(r.created_at).toISOString().split('T')[0],
      text: r.remark,
      remark: r.remark
    }));

    res.json({ success: true, count: formatted.length, remarks: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const addProductRemark = async (req, res, next) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { remark, text } = req.body;
    const resolvedRemark = (remark || text || '').trim();
    if (!resolvedRemark) {
      return res.status(400).json({ success: false, message: 'Remark text is required.' });
    }

    const newRemark = await ProductRemark.create({
      product_id: product.id,
      remark: resolvedRemark,
      created_by: req.user?.id || 1
    });

    const formatted = {
      id: newRemark.id,
      _id: newRemark.id,
      author: req.user?.name || 'Admin',
      date: new Date().toISOString().split('T')[0],
      text: newRemark.remark,
      remark: newRemark.remark
    };

    res.status(201).json({ success: true, remark: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};
