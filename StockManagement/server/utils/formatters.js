/**
 * Formatter utilities to guarantee 100% backward compatibility with React components
 * by ensuring both MySQL snake_case and frontend camelCase / _id fields are populated.
 */

export const formatProduct = (p) => {
  if (!p) return null;
  const raw = p.toJSON ? p.toJSON() : p;
  const currentQty = Number(raw.current_quantity || 0);
  const minQty = Number(raw.minimum_quantity !== undefined ? raw.minimum_quantity : (raw.minimum_stock_level || 0));
  const isLowStock = currentQty <= minQty;

  const refs = raw.documentReferences || raw.registerRefs || [];
  const formattedRefs = refs.map(r => ({
    id: r.id || r._id,
    _id: r.id || r._id,
    stockDocumentId: r.stock_document_id || r.stockDocumentId,
    stockDocumentName: r.stock_document_name || r.stockDocument?.document_name || r.sheet,
    sheet: r.stock_document_name || r.stockDocument?.document_code || r.sheet,
    stockDocument: r.stock_document_name || r.stockDocument?.document_code || r.sheet,
    pageNumber: r.page_number || r.page,
    page: r.page_number || r.page,
    referenceNote: r.reference_note || r.note || '',
    note: r.reference_note || r.note || ''
  }));

  const remarks = raw.remarks || [];
  const formattedRemarks = remarks.map(rem => ({
    id: rem.id || rem._id,
    _id: rem.id || rem._id,
    author: rem.creator?.name || rem.enteredBy || rem.author || 'Store Keeper',
    enteredBy: rem.creator?.name || rem.enteredBy || rem.author || 'Store Keeper',
    date: rem.created_at ? new Date(rem.created_at).toISOString().split('T')[0] : (rem.date || new Date().toISOString().split('T')[0]),
    text: rem.remark || rem.text,
    remark: rem.remark || rem.text,
    createdAt: rem.created_at
  }));

  return {
    ...raw,
    id: raw.id,
    _id: raw.id,
    productId: raw.id,
    productCode: raw.product_code,
    productName: raw.product_name || raw.name,
    name: raw.name || raw.product_name,
    category: raw.category?.name || raw.category_name || (typeof raw.category === 'string' ? raw.category : 'General'),
    categoryId: raw.category_id,
    unit: raw.unit?.name || raw.unit_name || (typeof raw.unit === 'string' ? raw.unit : (raw.unit?.symbol || '')),
    unitName: raw.unit?.name || raw.unit_name || (typeof raw.unit === 'string' ? raw.unit : (raw.unit?.symbol || '')),
    unit_name: raw.unit?.name || raw.unit_name || (typeof raw.unit === 'string' ? raw.unit : (raw.unit?.symbol || '')),
    unitId: raw.unit_id,
    unit_id: raw.unit_id,
    unitSymbol: raw.unit?.symbol,
    currentQuantity: currentQty,
    current_quantity: raw.current_quantity !== undefined ? raw.current_quantity : currentQty,
    currentStock: currentQty,
    quantity: currentQty,
    minimumQuantity: minQty,
    minimum_quantity: raw.minimum_quantity !== undefined ? raw.minimum_quantity : minQty,
    minimumStockLevel: minQty,
    minStock: minQty,
    stockRegister: raw.stockDocument?.document_code || (raw.stock_register_id ? `SR${raw.stock_register_id}` : 'SR1'),
    pageNumber: raw.page_number || 1,
    active: Boolean(raw.active),
    status: raw.status || (raw.active ? 'ACTIVE' : 'INACTIVE'),
    stockStatus: isLowStock ? 'LOW_STOCK' : 'AVAILABLE',
    isLowStock,
    registerRefs: formattedRefs.length > 0 ? formattedRefs : [{
      sheet: raw.stockDocument?.document_code || 'SR1',
      page: raw.page_number || 1
    }],
    references: formattedRefs,
    remarks: formattedRemarks
  };
};

export const formatPurchase = (pur) => {
  if (!pur) return null;
  const raw = pur.toJSON ? pur.toJSON() : pur;
  return {
    ...raw,
    id: raw.id,
    _id: raw.id,
    purchaseId: raw.purchase_number,
    purchaseNumber: raw.purchase_number,
    productId: raw.product_id,
    productCode: raw.product?.product_code,
    productName: raw.product?.product_name || raw.product?.name,
    quantity: Number(raw.quantity),
    unitPrice: Number(raw.unit_price || 0),
    totalAmount: Number(raw.total_amount || 0),
    supplier: raw.supplier || '',
    invoiceNumber: raw.invoice_number || '',
    date: raw.purchase_date,
    purchaseDate: raw.purchase_date,
    stockRegister: raw.stockDocument?.document_code || 'SR1',
    pageNumber: raw.page_number || 1,
    remarks: raw.remarks || '',
    recordedBy: raw.recorder?.name || 'Admin'
  };
};

export const formatTransfer = (trf) => {
  if (!trf) return null;
  const raw = trf.toJSON ? trf.toJSON() : trf;
  return {
    ...raw,
    id: raw.id,
    _id: raw.id,
    transferId: raw.transfer_number,
    transferNumber: raw.transfer_number,
    productId: raw.product_id,
    productCode: raw.product?.product_code,
    productName: raw.product?.product_name || raw.product?.name,
    quantity: Number(raw.quantity),
    unit: raw.product?.unit?.name || raw.product?.unit_name || (typeof raw.product?.unit === 'string' ? raw.product?.unit : (raw.product?.unit?.symbol || '')),
    unitName: raw.product?.unit?.name || raw.product?.unit_name || (typeof raw.product?.unit === 'string' ? raw.product?.unit : ''),
    unitSymbol: raw.product?.unit?.symbol || '',
    departmentId: raw.department_id,
    department: raw.department?.name || 'Department',
    issuedTo: raw.issued_to || '',
    issuedBy: raw.issuer?.name || 'Admin',
    purpose: raw.purpose || '',
    date: raw.transfer_date,
    transferDate: raw.transfer_date,
    stockRegister: raw.stockDocument?.document_code || 'SR1',
    pageNumber: raw.page_number || 1,
    remarks: raw.remarks || ''
  };
};

export const formatStockTransaction = (st) => {
  if (!st) return null;
  const raw = st.toJSON ? st.toJSON() : st;
  const isPurchase = raw.transaction_type === 'PURCHASE' || raw.transaction_type === 'IN';
  return {
    ...raw,
    id: raw.id,
    _id: raw.id,
    transactionId: raw.transaction_code,
    transactionCode: raw.transaction_code,
    productId: raw.product_id,
    productCode: raw.product?.product_code,
    productName: raw.product?.product_name || raw.product?.name,
    type: isPurchase ? 'PURCHASE' : (raw.transaction_type === 'TRANSFER' ? 'TRANSFER' : raw.transaction_type),
    transactionType: isPurchase ? 'PURCHASE' : (raw.transaction_type === 'TRANSFER' ? 'TRANSFER' : raw.transaction_type),
    typeLabel: isPurchase ? 'Purchase' : (raw.transaction_type === 'TRANSFER' ? 'Transfer' : 'Adjustment'),
    quantity: Math.abs(Number(raw.quantity || 0)),
    previousQuantity: Number(raw.previous_quantity || 0),
    newQuantity: Number(raw.new_quantity || 0),
    departmentId: raw.department_id,
    department: raw.department?.name || (isPurchase ? 'Store' : 'Department'),
    date: raw.transaction_date ? new Date(raw.transaction_date).toISOString().split('T')[0] : '',
    transactionDate: raw.transaction_date,
    referenceId: raw.reference_type === 'PURCHASE' && raw.reference_id ? `PUR-${String(raw.reference_id).padStart(4, '0')}` : (raw.reference_type === 'TRANSFER' && raw.reference_id ? `TRF-${String(raw.reference_id).padStart(4, '0')}` : (raw.reference_type || raw.reference_id || '—')),
    reference: raw.reference_type === 'PURCHASE' && raw.reference_id ? `PUR-${String(raw.reference_id).padStart(4, '0')}` : (raw.reference_type === 'TRANSFER' && raw.reference_id ? `TRF-${String(raw.reference_id).padStart(4, '0')}` : (raw.reference_type || raw.reference_id || '—')),
    referenceType: raw.reference_type,
    remarks: raw.remarks || '',
    recordedBy: raw.recorder?.name || 'Admin',
    performedBy: raw.recorder?.name || 'Admin'
  };
};

export const formatIndent = (ind) => {
  if (!ind) return null;
  const raw = ind.toJSON ? ind.toJSON() : ind;
  const dateStr = raw.created_at ? new Date(raw.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const items = (raw.items || []).map(item => ({
    id: item.id,
    _id: item.id,
    itemId: item.id,
    productId: item.product_id,
    productCode: item.product?.product_code || '',
    productName: item.product?.product_name || item.product?.name || '',
    unit: item.product?.unit?.name || 'Pieces',
    availableQuantityAtRequest: Number(item.product?.current_quantity || 0),
    quantityRequired: Number(item.requested_quantity || 0),
    requestedQuantity: Number(item.requested_quantity || 0),
    quantityApproved: Number(item.approved_quantity || 0),
    approvedQuantity: Number(item.approved_quantity || 0),
    quantityIssued: Number(item.issued_quantity || 0),
    issuedQuantity: Number(item.issued_quantity || 0),
    remarks: item.remarks || '',
    lineRemarks: item.remarks || ''
  }));

  return {
    ...raw,
    id: raw.id,
    _id: raw.id,
    indentId: raw.id,
    indentNumber: raw.indent_number,
    departmentId: raw.department_id,
    department: raw.department?.name || '',
    requestingDepartment: raw.department?.name || '',
    requestedBy: raw.requester?.name || 'Faculty',
    requesterName: raw.requester?.name || 'Faculty',
    requesterId: raw.requested_by,
    status: raw.status || 'SUBMITTED',
    purpose: raw.remarks || 'Department Requisition',
    remarks: raw.remarks || '',
    date: dateStr,
    requestDate: dateStr,
    requiredDate: dateStr,
    items
  };
};
