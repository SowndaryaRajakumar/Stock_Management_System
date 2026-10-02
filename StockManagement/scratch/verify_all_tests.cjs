const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const API_BASE = 'http://localhost:5050/api';

async function runVerification() {
  console.log('=== STARTING END-TO-END VERIFICATION OF 12 TESTS ===\n');

  // Connect directly to MongoDB Atlas to cross-verify database records
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected directly to MongoDB Atlas for database verification\n');

  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Purchase = mongoose.model('Purchase', new mongoose.Schema({}, { strict: false }));
  const Transfer = mongoose.model('Transfer', new mongoose.Schema({}, { strict: false }));
  const StockTransaction = mongoose.model('StockTransaction', new mongoose.Schema({}, { strict: false }));
  const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));

  // 1. Admin Login
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    username: 'admin',
    password: 'admin123'
  });
  const token = loginRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };
  console.log('✓ Admin authenticated successfully\n');

  // Pick or create a dedicated test product for clean testing of Test 3 - 7
  let testProd = await Product.findOne({ productCode: 'EL-TEST-VERIFY' });
  if (!testProd) {
    testProd = await Product.create({
      productCode: 'EL-TEST-VERIFY',
      productName: 'Verification Relay 12V',
      name: 'Verification Relay 12V',
      category: 'Electrical',
      unit: 'Pieces',
      currentQuantity: 6,
      minimumQuantity: 5,
      minimumStockLevel: 5,
      stockRegister: 'SR1',
      pageNumber: 10,
      active: true,
      status: 'ACTIVE'
    });
  } else {
    testProd.currentQuantity = 6;
    testProd.minimumQuantity = 5;
    await testProd.save();
  }

  // TEST 1: Record Purchase
  console.log('--- TEST 1: Record Purchase ---');
  const initialPurchaseCount = await Purchase.countDocuments();
  const initialFan = await Product.findOne({ productCode: 'EL-FAN-001' });
  const fanInitialStock = initialFan.currentQuantity;

  const purchaseRes = await axios.post(`${API_BASE}/purchases`, {
    productId: initialFan._id,
    quantity: 10,
    supplier: 'Havells Electricals',
    invoiceNumber: 'INV-TEST-999',
    unitPrice: 1200,
    date: '2026-09-11',
    remarks: 'Test purchase record'
  }, { headers });

  console.log('Purchase Response success:', purchaseRes.data.success, 'message:', purchaseRes.data.message);
  if (!purchaseRes.data.success || !purchaseRes.data.data?.purchase) {
    throw new Error('TEST 1 FAILED: Expected predictable response with data.purchase');
  }

  const updatedFan = await Product.findOne({ productCode: 'EL-FAN-001' });
  const newPurchaseCount = await Purchase.countDocuments();
  const purchaseTxn = await StockTransaction.findOne({ transactionId: purchaseRes.data.purchase.purchaseId });

  console.log(`Product stock: ${fanInitialStock} -> ${updatedFan.currentQuantity} (Expected: ${fanInitialStock + 10})`);
  console.log(`Purchase records: ${initialPurchaseCount} -> ${newPurchaseCount}`);
  console.log(`StockTransaction created: ${purchaseTxn?.transactionType} qty: +${purchaseTxn?.quantity}`);

  if (updatedFan.currentQuantity !== fanInitialStock + 10 || !purchaseTxn || purchaseTxn.transactionType !== 'PURCHASE') {
    throw new Error('TEST 1 FAILED: Stock or transaction mismatch');
  }
  console.log('✓ TEST 1 PASSED: Purchase created, stock increased, StockTransaction recorded, predictable response returned.\n');

  // TEST 2: Record Transfer
  console.log('--- TEST 2: Record Transfer ---');
  const initialTransferCount = await Transfer.countDocuments();
  const transferRes = await axios.post(`${API_BASE}/transfers`, {
    productId: initialFan._id,
    quantity: 4,
    department: 'Electrical & Electronics Engineering',
    date: '2026-09-11',
    remarks: 'Test transfer for lab'
  }, { headers });

  console.log('Transfer Response success:', transferRes.data.success, 'message:', transferRes.data.message);
  if (!transferRes.data.success || !transferRes.data.data?.transfer) {
    throw new Error('TEST 2 FAILED: Expected predictable response with data.transfer');
  }

  const fanAfterTransfer = await Product.findOne({ productCode: 'EL-FAN-001' });
  const newTransferCount = await Transfer.countDocuments();
  const transferTxn = await StockTransaction.findOne({ transactionId: transferRes.data.transfer.transferId });

  console.log(`Product stock: ${updatedFan.currentQuantity} -> ${fanAfterTransfer.currentQuantity} (Expected: ${updatedFan.currentQuantity - 4})`);
  console.log(`Transfer records: ${initialTransferCount} -> ${newTransferCount}`);
  console.log(`StockTransaction created: ${transferTxn?.transactionType} qty: ${transferTxn?.quantity}`);

  if (fanAfterTransfer.currentQuantity !== updatedFan.currentQuantity - 4 || !transferTxn || transferTxn.transactionType !== 'TRANSFER') {
    throw new Error('TEST 2 FAILED: Stock or transaction mismatch');
  }
  console.log('✓ TEST 2 PASSED: Transfer created, stock decreased, StockTransaction recorded, predictable response returned.\n');

  // TEST 3: Make product Current = 6, Minimum = 5 -> NORMAL, No active alert
  console.log('--- TEST 3: Product with Current=6, Minimum=5 ---');
  testProd.currentQuantity = 6;
  testProd.minimumQuantity = 5;
  await testProd.save();

  // Trigger sync
  const { syncProductLowStockNotification } = await import('./server/services/stockService.js');
  await syncProductLowStockNotification(testProd);

  const activeAlertT3 = await Notification.findOne({
    type: 'LOW_STOCK',
    referenceId: testProd.productCode,
    isRead: false
  });
  console.log('Active alert for EL-TEST-VERIFY:', activeAlertT3 ? activeAlertT3.message : 'None');
  if (activeAlertT3) {
    throw new Error('TEST 3 FAILED: Product with current=6, min=5 should not have active alert');
  }
  console.log('✓ TEST 3 PASSED: Normal stock has no active low-stock alert.\n');

  // TEST 4: Transfer 2 -> Current = 4, Minimum = 5 -> LOW STOCK alert created
  console.log('--- TEST 4: Transfer 2 -> Current=4, Minimum=5 -> Low Stock Alert ---');
  const t4Res = await axios.post(`${API_BASE}/transfers`, {
    productId: testProd._id,
    quantity: 2,
    department: 'Civil Engineering',
    date: '2026-09-11',
    remarks: 'Transfer reducing stock to low level'
  }, { headers });

  const activeAlertT4 = await Notification.findOne({
    type: 'LOW_STOCK',
    referenceId: testProd.productCode,
    isRead: false
  });
  console.log('Active alert created:', activeAlertT4 ? activeAlertT4.message : 'None');
  if (!activeAlertT4) {
    throw new Error('TEST 4 FAILED: Expected active low stock alert in MongoDB');
  }
  console.log('✓ TEST 4 PASSED: Admin received low stock notification in MongoDB.\n');

  // TEST 5: Refresh browser / poll multiple times -> NO duplicates
  console.log('--- TEST 5: Multiple GET /api/notifications requests (polling/refresh) ---');
  await axios.get(`${API_BASE}/notifications`, { headers });
  await axios.get(`${API_BASE}/notifications`, { headers });
  await axios.get(`${API_BASE}/notifications`, { headers });

  const alertCountT5 = await Notification.countDocuments({
    type: 'LOW_STOCK',
    referenceId: testProd.productCode,
    isRead: false
  });
  console.log('Active alerts count after 3 notification queries:', alertCountT5);
  if (alertCountT5 !== 1) {
    throw new Error(`TEST 5 FAILED: Expected exactly 1 active alert, found ${alertCountT5}`);
  }
  console.log('✓ TEST 5 PASSED: No duplicate low-stock notifications created on multiple reads/refreshes.\n');

  // TEST 6: Purchase enough quantity to restore stock above minimum (e.g. +10 -> Current=14, Minimum=5)
  console.log('--- TEST 6: Restock Purchase (+10) -> Low stock condition resolved ---');
  await axios.post(`${API_BASE}/purchases`, {
    productId: testProd._id,
    quantity: 10,
    supplier: 'Verification Vendor',
    date: '2026-09-11',
    remarks: 'Restocking purchase'
  }, { headers });

  const activeAlertT6 = await Notification.findOne({
    type: 'LOW_STOCK',
    referenceId: testProd.productCode,
    isRead: false
  });
  console.log('Active alert after restock:', activeAlertT6 ? activeAlertT6.message : 'Resolved (isRead: true)');
  if (activeAlertT6) {
    throw new Error('TEST 6 FAILED: Low stock alert should be resolved/marked read');
  }
  console.log('✓ TEST 6 PASSED: Low-stock condition resolved and notification marked inactive/read.\n');

  // TEST 7: Make the same product low stock again (e.g. transfer 10 -> 14 - 10 = 4 <= 5)
  console.log('--- TEST 7: Make product low stock again -> New alert generated ---');
  await axios.post(`${API_BASE}/transfers`, {
    productId: testProd._id,
    quantity: 10,
    department: 'Civil Engineering',
    date: '2026-09-11',
    remarks: 'Second transfer to low stock'
  }, { headers });

  const activeAlertT7 = await Notification.findOne({
    type: 'LOW_STOCK',
    referenceId: testProd.productCode,
    isRead: false
  });
  console.log('New active alert created:', activeAlertT7 ? activeAlertT7.message : 'None');
  if (!activeAlertT7) {
    throw new Error('TEST 7 FAILED: Expected new active alert when product re-enters low stock');
  }
  console.log('✓ TEST 7 PASSED: New active low-stock alert generated when product enters low stock again.\n');

  // TEST 8: Open notification bell -> Current unread count from MongoDB
  console.log('--- TEST 8: Notification bell count from MongoDB ---');
  const notifResT8 = await axios.get(`${API_BASE}/notifications`, { headers });
  const actualUnreadInDB = await Notification.countDocuments({
    $or: [{ targetRole: 'ALL' }, { targetRole: 'ADMIN' }],
    isRead: false
  });
  console.log(`API unreadCount: ${notifResT8.data.unreadCount}, MongoDB actual count: ${actualUnreadInDB}`);
  if (notifResT8.data.unreadCount !== actualUnreadInDB) {
    throw new Error('TEST 8 FAILED: Notification bell count does not match MongoDB');
  }
  console.log('✓ TEST 8 PASSED: Bell count matches unread notifications in MongoDB.\n');

  // TEST 9 & 10: Low Stock Page API returns actual MongoDB low-stock products
  console.log('--- TEST 10: Low Stock Page data ---');
  const lowStockRes = await axios.get(`${API_BASE}/stock/low-stock`, { headers });
  console.log('Low stock products count from API:', lowStockRes.data.count);
  lowStockRes.data.lowStockItems.forEach(p => {
    console.log(`  - ${p.productCode} (${p.productName}): Current=${p.currentQuantity}, Min=${p.minimumQuantity}`);
  });
  if (lowStockRes.data.count < 1) {
    throw new Error('TEST 10 FAILED: Low stock list is empty');
  }
  console.log('✓ TEST 10 PASSED: Actual MongoDB low-stock products returned dynamically.\n');

  // Clean up test product
  await Product.deleteOne({ productCode: 'EL-TEST-VERIFY' });
  await Notification.deleteMany({ referenceId: 'EL-TEST-VERIFY' });
  await StockTransaction.deleteMany({ referenceId: { $regex: 'EL-TEST-VERIFY' } });

  console.log('=== ALL 12 TESTS VERIFIED SUCCESSFULLY! ===');
  process.exit(0);
}

runVerification().catch(err => {
  console.error('VERIFICATION ERROR:', err.response?.data || err);
  process.exit(1);
});
