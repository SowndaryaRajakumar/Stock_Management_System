import { sequelize, Indent, IndentItem, Product, Department, Notification, User, Role } from '../models/index.js';
import { generateIndentNumber } from '../utils/codeGenerator.js';
import { formatIndent } from '../utils/formatters.js';

export const createIndent = async ({
  indentNumber,
  requestingDepartment,
  department,
  departmentId,
  purpose,
  requiredDate,
  remarks,
  items,
  user
}) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('At least one item is required in the indent.');
  }

  return await sequelize.transaction(async (t) => {
    // Resolve department ID
    let resolvedDeptId = departmentId;
    if (!resolvedDeptId) {
      const deptName = requestingDepartment || department || user?.department;
      if (deptName) {
        const deptDoc = await Department.findOne({
          where: { name: deptName },
          transaction: t
        });
        if (deptDoc) resolvedDeptId = deptDoc.id;
      }
    }
    if (!resolvedDeptId) {
      resolvedDeptId = user?.department_id || 1;
    }

    const genIndentNumber = indentNumber || await generateIndentNumber();
    const userRemarks = remarks || purpose || 'Faculty Material Requisition';

    // 1. Create Indent record (SUBMITTED) - DOES NOT REDUCE STOCK
    const indent = await Indent.create({
      indent_number: genIndentNumber,
      department_id: resolvedDeptId,
      requested_by: user?.id || 2,
      status: 'SUBMITTED',
      remarks: userRemarks
    }, { transaction: t });

    // 2. Create IndentItem records
    for (const item of items) {
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

      if (!product) {
        throw new Error(`Product not found for code/ID: ${item.productCode || item.productId}`);
      }

      const qty = Number(item.quantityRequired || item.requestedQuantity || item.quantity);
      if (!qty || qty <= 0) {
        throw new Error(`Valid quantity > 0 is required for item ${product.product_name}.`);
      }

      await IndentItem.create({
        indent_id: indent.id,
        product_id: product.id,
        requested_quantity: qty,
        approved_quantity: 0,
        issued_quantity: 0,
        remarks: item.remarks || item.lineRemarks || ''
      }, { transaction: t });
    }

    // 3. Create ADMIN notification for new indent
    let adminUser = await User.findOne({
      include: [{ model: Role, as: 'role', where: { name: 'ADMIN' } }],
      transaction: t
    });
    const adminUserId = adminUser ? adminUser.id : 1;

    await Notification.create({
      user_id: adminUserId,
      type: 'INDENT_CREATED',
      title: 'New Indent Request Submitted',
      message: `A new indent ${indent.indent_number} has been submitted by ${user?.name || 'Faculty User'}.`,
      reference_id: indent.id,
      reference_type: 'INDENT',
      is_read: false
    }, { transaction: t });

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

export const submitIndent = async (indentId, user) => {
  const indent = await Indent.findByPk(indentId);
  if (!indent) throw new Error('Indent not found.');

  indent.status = 'SUBMITTED';
  await indent.save();

  const refreshed = await Indent.findByPk(indent.id, {
    include: [
      { model: Department, as: 'department' },
      { model: User, as: 'requester' },
      {
        model: IndentItem,
        as: 'items',
        include: [{ model: Product, as: 'product', include: ['unit'] }]
      }
    ]
  });

  return formatIndent(refreshed);
};

export const approveIndent = async (indentId, { approvals, remarks }, user) => {
  const indent = await Indent.findByPk(indentId, {
    include: [{ model: IndentItem, as: 'items' }]
  });
  if (!indent) throw new Error('Indent not found.');

  await sequelize.transaction(async (t) => {
    indent.status = 'APPROVED';
    if (remarks) {
      indent.remarks = `${indent.remarks ? indent.remarks + ' | ' : ''}Approved: ${remarks}`;
    }
    await indent.save({ transaction: t });

    // Update approved quantities for items
    if (Array.isArray(approvals) && approvals.length > 0) {
      for (const app of approvals) {
        const item = indent.items.find(i => i.id === app.itemId || i.product_id === app.productId);
        if (item) {
          const qty = Number(app.approvedQuantity !== undefined ? app.approvedQuantity : app.quantityApproved);
          item.approved_quantity = isNaN(qty) ? item.requested_quantity : qty;
          await item.save({ transaction: t });
        }
      }
    } else {
      for (const item of indent.items) {
        item.approved_quantity = item.requested_quantity;
        await item.save({ transaction: t });
      }
    }

    // Create notification for requesting faculty user
    await Notification.create({
      user_id: indent.requested_by,
      type: 'INDENT_APPROVED',
      title: 'Indent Request Approved',
      message: `Your indent ${indent.indent_number} has been APPROVED by Administrator.`,
      reference_id: indent.id,
      reference_type: 'INDENT',
      is_read: false
    }, { transaction: t });

    // Mark admin's indent creation notification as read/resolved
    await Notification.update(
      { is_read: true },
      {
        where: {
          type: 'INDENT_CREATED',
          reference_id: indent.id,
          is_read: false
        },
        transaction: t
      }
    );
  });

  const refreshed = await Indent.findByPk(indent.id, {
    include: [
      { model: Department, as: 'department' },
      { model: User, as: 'requester' },
      {
        model: IndentItem,
        as: 'items',
        include: [{ model: Product, as: 'product', include: ['unit'] }]
      }
    ]
  });

  return formatIndent(refreshed);
};

export const rejectIndent = async (indentId, { remarks }, user) => {
  const indent = await Indent.findByPk(indentId);
  if (!indent) throw new Error('Indent not found.');

  await sequelize.transaction(async (t) => {
    indent.status = 'REJECTED';
    if (remarks) {
      indent.remarks = `${indent.remarks ? indent.remarks + ' | ' : ''}Rejected: ${remarks}`;
    }
    await indent.save({ transaction: t });

    // Create notification for requesting faculty user
    await Notification.create({
      user_id: indent.requested_by,
      type: 'INDENT_REJECTED',
      title: 'Indent Request Rejected',
      message: `Your indent ${indent.indent_number} was REJECTED.${remarks ? ` Reason: ${remarks}` : ''}`,
      reference_id: indent.id,
      reference_type: 'INDENT',
      is_read: false
    }, { transaction: t });

    // Mark admin's indent creation notification as read/resolved
    await Notification.update(
      { is_read: true },
      {
        where: {
          type: 'INDENT_CREATED',
          reference_id: indent.id,
          is_read: false
        },
        transaction: t
      }
    );
  });

  const refreshed = await Indent.findByPk(indent.id, {
    include: [
      { model: Department, as: 'department' },
      { model: User, as: 'requester' },
      {
        model: IndentItem,
        as: 'items',
        include: [{ model: Product, as: 'product', include: ['unit'] }]
      }
    ]
  });

  return formatIndent(refreshed);
};
