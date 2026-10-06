import { sequelize, Indent, IndentItem, Product, Department, User, Role } from '../models/index.js';
import { generateIndentNumber } from '../utils/codeGenerator.js';
import { formatIndent } from '../utils/formatters.js';

export const createIndent = async ({
  indentNumber,
  requestingDepartment,
  department,
  departmentId,
  requestedBy,
  requesterId,
  facultyId,
  userId,
  purpose,
  requiredDate,
  date,
  remarks,
  items,
  productId,
  productCode,
  quantity,
  requestedQuantity,
  unit,
  user
}) => {
  // Normalize items: if items array not provided, build from single product fields
  let normalizedItems = items;
  if (!normalizedItems || !Array.isArray(normalizedItems) || normalizedItems.length === 0) {
    if (productId || productCode) {
      normalizedItems = [{
        productId: productId || productCode,
        productCode: productCode,
        requestedQuantity: quantity || requestedQuantity || 1,
        remarks: remarks || ''
      }];
    }
  }

  if (!normalizedItems || !Array.isArray(normalizedItems) || normalizedItems.length === 0) {
    throw new Error('At least one item is required for the indent record.');
  }

  return await sequelize.transaction(async (t) => {
    // Resolve department ID
    let resolvedDeptId = departmentId;
    if (!resolvedDeptId && department) {
      if (String(department).match(/^\d+$/)) {
        resolvedDeptId = parseInt(department, 10);
      } else {
        const deptDoc = await Department.findOne({
          where: { name: department },
          transaction: t
        });
        if (deptDoc) resolvedDeptId = deptDoc.id;
      }
    }
    if (!resolvedDeptId && requestingDepartment) {
      const deptDoc = await Department.findOne({
        where: { name: requestingDepartment },
        transaction: t
      });
      if (deptDoc) resolvedDeptId = deptDoc.id;
    }
    if (!resolvedDeptId) {
      resolvedDeptId = user?.department_id || 1;
    }

    // Resolve requester ID (Faculty/User who made the physical request)
    let resolvedRequesterId = requestedBy || requesterId || facultyId || userId;
    if (resolvedRequesterId && !String(resolvedRequesterId).match(/^\d+$/)) {
      const reqUser = await User.findOne({
        where: { name: String(resolvedRequesterId) },
        transaction: t
      });
      if (reqUser) resolvedRequesterId = reqUser.id;
    }
    if (!resolvedRequesterId || !String(resolvedRequesterId).match(/^\d+$/)) {
      resolvedRequesterId = user?.id || 1;
    }

    const genIndentNumber = indentNumber?.trim() || await generateIndentNumber();
    const userRemarks = remarks || purpose || 'Manual Indent Record';

    // 1. Create Indent record (RECORDED) - MANUAL STORE ENTRY, DOES NOT REDUCE STOCK
    const indent = await Indent.create({
      indent_number: genIndentNumber,
      department_id: resolvedDeptId,
      requested_by: resolvedRequesterId,
      status: 'RECORDED',
      remarks: userRemarks
    }, { transaction: t });

    // 2. Create IndentItem records
    for (const item of normalizedItems) {
      let product = null;
      if (item.productId && String(item.productId).match(/^\d+$/)) {
        product = await Product.findByPk(item.productId, { transaction: t });
      }
      if (!product && item.productCode) {
        product = await Product.findOne({
          where: { product_code: String(item.productCode).toUpperCase() },
          transaction: t
        });
      }
      if (!product && item.product) {
        if (String(item.product).match(/^\d+$/)) {
          product = await Product.findByPk(item.product, { transaction: t });
        } else {
          product = await Product.findOne({
            where: { product_name: String(item.product) },
            transaction: t
          });
        }
      }

      if (!product) {
        throw new Error(`Product not found for ID/code: ${item.productId || item.productCode || item.product}`);
      }

      const qty = Number(item.quantityRequired || item.requestedQuantity || item.quantity);
      if (!qty || qty <= 0) {
        throw new Error(`Valid quantity > 0 is required for item ${product.product_name}.`);
      }

      await IndentItem.create({
        indent_id: indent.id,
        product_id: product.id,
        requested_quantity: qty,
        approved_quantity: qty,
        issued_quantity: 0,
        remarks: item.remarks || item.lineRemarks || ''
      }, { transaction: t });
    }

    // Return full formatted indent
    const fullIndent = await Indent.findByPk(indent.id, {
      include: [
        { model: Department, as: 'department' },
        { model: User, as: 'requester' },
        {
          model: IndentItem,
          as: 'items',
          include: [{ model: Product, as: 'product', include: ['unit'] }]
        }
      ],
      transaction: t
    });

    return formatIndent(fullIndent);
  });
};

export const updateIndentRecord = async (indentId, updateData) => {
  const indent = await Indent.findByPk(indentId);
  if (!indent) throw new Error('Indent record not found.');

  return await sequelize.transaction(async (t) => {
    const { departmentId, department, requestedBy, requesterId, facultyId, remarks, purpose, status, items, productId, productCode, quantity, requestedQuantity } = updateData;

    if (departmentId || department) {
      let resolvedDeptId = departmentId;
      if (!resolvedDeptId && department) {
        if (String(department).match(/^\d+$/)) {
          resolvedDeptId = parseInt(department, 10);
        } else {
          const deptDoc = await Department.findOne({ where: { name: department }, transaction: t });
          if (deptDoc) resolvedDeptId = deptDoc.id;
        }
      }
      if (resolvedDeptId) indent.department_id = resolvedDeptId;
    }

    if (requestedBy || requesterId || facultyId) {
      let resolvedReqId = requestedBy || requesterId || facultyId;
      if (resolvedReqId && !String(resolvedReqId).match(/^\d+$/)) {
        const reqUser = await User.findOne({ where: { name: String(resolvedReqId) }, transaction: t });
        if (reqUser) resolvedReqId = reqUser.id;
      }
      if (resolvedReqId && String(resolvedReqId).match(/^\d+$/)) {
        indent.requested_by = parseInt(resolvedReqId, 10);
      }
    }

    if (remarks !== undefined || purpose !== undefined) {
      indent.remarks = remarks || purpose;
    }
    if (status) {
      indent.status = status;
    }

    await indent.save({ transaction: t });

    // If items or product updated
    let normalizedItems = items;
    if (!normalizedItems && (productId || productCode)) {
      normalizedItems = [{
        productId: productId || productCode,
        requestedQuantity: quantity || requestedQuantity || 1,
        remarks: remarks || ''
      }];
    }

    if (normalizedItems && Array.isArray(normalizedItems) && normalizedItems.length > 0) {
      // Remove old items
      await IndentItem.destroy({ where: { indent_id: indent.id }, transaction: t });

      // Create new items
      for (const item of normalizedItems) {
        let product = null;
        if (item.productId && String(item.productId).match(/^\d+$/)) {
          product = await Product.findByPk(item.productId, { transaction: t });
        }
        if (!product && item.productCode) {
          product = await Product.findOne({ where: { product_code: String(item.productCode).toUpperCase() }, transaction: t });
        }
        if (!product) {
          throw new Error(`Product not found for item: ${item.productId || item.productCode}`);
        }
        const qty = Number(item.quantityRequired || item.requestedQuantity || item.quantity);
        if (!qty || qty <= 0) {
          throw new Error(`Valid quantity > 0 is required for item ${product.product_name}.`);
        }

        await IndentItem.create({
          indent_id: indent.id,
          product_id: product.id,
          requested_quantity: qty,
          approved_quantity: qty,
          issued_quantity: 0,
          remarks: item.remarks || ''
        }, { transaction: t });
      }
    }

    const refreshed = await Indent.findByPk(indent.id, {
      include: [
        { model: Department, as: 'department' },
        { model: User, as: 'requester' },
        {
          model: IndentItem,
          as: 'items',
          include: [{ model: Product, as: 'product', include: ['unit'] }]
        }
      ],
      transaction: t
    });

    return formatIndent(refreshed);
  });
};

export const deleteIndentRecord = async (indentId) => {
  const indent = await Indent.findByPk(indentId);
  if (!indent) throw new Error('Indent record not found.');

  return await sequelize.transaction(async (t) => {
    await IndentItem.destroy({ where: { indent_id: indent.id }, transaction: t });
    await indent.destroy({ transaction: t });
    return true;
  });
};

// Legacy stubs kept for compatibility
export const submitIndent = async (indentId) => {
  const indent = await Indent.findByPk(indentId);
  if (!indent) throw new Error('Indent not found.');
  return formatIndent(indent);
};
export const approveIndent = async (indentId) => {
  const indent = await Indent.findByPk(indentId);
  if (!indent) throw new Error('Indent not found.');
  return formatIndent(indent);
};
export const rejectIndent = async (indentId) => {
  const indent = await Indent.findByPk(indentId);
  if (!indent) throw new Error('Indent not found.');
  return formatIndent(indent);
};
