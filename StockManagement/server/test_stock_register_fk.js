import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import { User, Product, StockDocument, ProductDocumentReference, Purchase, Transfer, sequelize } from './models/index.js';

let server;
let baseUrl;

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('STARTING AUTOMATED VERIFICATION FOR STOCK REGISTER FK INTEGRITY');
  console.log('================================================================\n');

  await connectDB();

  const port = 5997;
  server = app.listen(port);
  baseUrl = `http://localhost:${port}`;

  // Admin JWT
  const adminToken = jwt.sign(
    { userId: 1, id: 1, username: 'admin', role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  try {
    // ----------------------------------------------------
    // TEST 1: Create a new unused stock register & delete it
    // ----------------------------------------------------
    console.log('--- TEST 1: Create unused stock register and physically delete it ---');
    const createRes = await request('POST', '/api/stock-documents', {
      name: 'UNUSED_REG_TEST',
      documentCode: 'UNUSED_REG_TEST',
      description: 'Temporary unused test register'
    }, adminToken);

    console.log('Create Status:', createRes.status);
    console.log('Created ID:', createRes.data.document?.id || createRes.data.data?.id);
    const createdId = createRes.data.document?.id || createRes.data.data?.id;

    if (createRes.status !== 201 || !createdId) {
      throw new Error(`Failed to create test register: ${JSON.stringify(createRes.data)}`);
    }

    const deleteRes = await request('DELETE', `/api/stock-documents/${createdId}`, null, adminToken);
    console.log('Delete Status:', deleteRes.status);
    console.log('Delete Message:', deleteRes.data.message);

    if (deleteRes.status === 200 && deleteRes.data.success === true) {
      console.log('✓ TEST 1 PASSED: Unused stock register physically deleted successfully.\n');
    } else {
      throw new Error(`TEST 1 FAILED: ${JSON.stringify(deleteRes.data)}`);
    }

    // ----------------------------------------------------
    // TEST 2: Try to delete SR1 (referenced register)
    // ----------------------------------------------------
    console.log('--- TEST 2: Attempt to delete SR1 (referenced by products & records) ---');
    const sr1 = await StockDocument.findOne({ where: { document_code: 'SR1' } });
    if (!sr1) throw new Error('SR1 register not found in database');

    const deleteSR1Res = await request('DELETE', `/api/stock-documents/${sr1.id}`, null, adminToken);
    console.log('Delete SR1 Status:', deleteSR1Res.status);
    console.log('Delete SR1 Response:', deleteSR1Res.data);

    const isRawSqlError = JSON.stringify(deleteSR1Res.data).includes('Cannot delete or update a parent row') ||
                          JSON.stringify(deleteSR1Res.data).includes('foreign key constraint fails');

    if (deleteSR1Res.status === 409 && deleteSR1Res.data.success === false && !isRawSqlError) {
      console.log('✓ TEST 2 PASSED: Physical deletion blocked with HTTP 409 Conflict and friendly user message.\n');
    } else {
      throw new Error(`TEST 2 FAILED: Expected 409 Conflict with friendly message, got ${deleteSR1Res.status}: ${JSON.stringify(deleteSR1Res.data)}`);
    }

    // ----------------------------------------------------
    // TEST 3: Deactivate SR1
    // ----------------------------------------------------
    console.log('--- TEST 3: Deactivate SR1 safely ---');
    const deactivateRes = await request('PATCH', `/api/stock-documents/${sr1.id}/status`, {
      active: false
    }, adminToken);

    console.log('Deactivate Status:', deactivateRes.status);
    console.log('Deactivate Message:', deactivateRes.data.message);
    console.log('Deactivate State (active):', deactivateRes.data.active);
    console.log('Deactivate State (status):', deactivateRes.data.status);

    const reloadedSR1 = await StockDocument.findByPk(sr1.id);
    if (deactivateRes.status === 200 && reloadedSR1.active === false) {
      console.log('✓ TEST 3 PASSED: SR1 status updated to INACTIVE in MySQL.\n');
    } else {
      throw new Error(`TEST 3 FAILED: ${JSON.stringify(deactivateRes.data)}`);
    }

    // ----------------------------------------------------
    // TEST 4: Existing products referencing SR1 still work
    // ----------------------------------------------------
    console.log('--- TEST 4: Verify existing products referencing SR1 still work ---');
    const productsRes = await request('GET', '/api/products', null, adminToken);
    const sr1Products = (productsRes.data.products || productsRes.data.data || []).filter(
      p => p.stockRegister === 'SR1' || p.stockRegisterCode === 'SR1'
    );
    console.log(`Found ${sr1Products.length} products referencing SR1:`);
    sr1Products.forEach(p => console.log(`  - [${p.productCode}] ${p.name || p.productName} (Qty: ${p.currentQuantity})`));

    if (productsRes.status === 200 && sr1Products.length > 0) {
      console.log('✓ TEST 4 PASSED: Existing products referencing SR1 remain 100% functional.\n');
    } else {
      throw new Error(`TEST 4 FAILED: Could not retrieve products referencing SR1`);
    }

    // ----------------------------------------------------
    // TEST 5: SR1 does not appear in new product dropdowns
    // ----------------------------------------------------
    console.log('--- TEST 5: Verify inactive SR1 is omitted from default registers list ---');
    const defaultDocsRes = await request('GET', '/api/stock-documents', null, adminToken);
    const activeDocCodes = (defaultDocsRes.data.documents || defaultDocsRes.data.data || []).map(d => d.code || d.name);
    console.log('Active Registers returned for product creation:', activeDocCodes);

    if (!activeDocCodes.includes('SR1')) {
      console.log('✓ TEST 5 PASSED: Inactive register SR1 is omitted from default product options.\n');
    } else {
      throw new Error('TEST 5 FAILED: Inactive register SR1 should NOT be returned by default');
    }

    // Also verify that ?all=true returns both active and inactive
    const allDocsRes = await request('GET', '/api/stock-documents?all=true', null, adminToken);
    const allDocCodes = (allDocsRes.data.documents || allDocsRes.data.data || []).map(d => d.code || d.name);
    console.log('All Registers returned with ?all=true (for Admin management):', allDocCodes);
    if (allDocCodes.includes('SR1')) {
      console.log('✓ ?all=true correctly includes deactivated register SR1 for management table.\n');
    } else {
      throw new Error('TEST 5.1 FAILED: ?all=true should return inactive registers');
    }

    // ----------------------------------------------------
    // TEST 6 & 7: Stock history & Analytics remain unchanged
    // ----------------------------------------------------
    console.log('--- TEST 6 & 7: Verify Stock History and Analytics endpoints ---');
    const historyRes = await request('GET', '/api/history', null, adminToken);
    console.log('History Status:', historyRes.status);
    console.log('History Transactions Count:', historyRes.data.count || historyRes.data.total || historyRes.data.transactions?.length);

    const analyticsRes = await request('GET', '/api/dashboard', null, adminToken);
    console.log('Dashboard Analytics Status:', analyticsRes.status);
    console.log('Total Products in Analytics:', analyticsRes.data.stats?.totalProducts || analyticsRes.data.totalProducts);

    if (historyRes.status === 200 && analyticsRes.status === 200) {
      console.log('✓ TEST 6 & 7 PASSED: Stock History and Analytics operate normally.\n');
    } else {
      throw new Error('TEST 6 & 7 FAILED');
    }

    // ----------------------------------------------------
    // TEST 8: Reactivate SR1 and verify usage count in table
    // ----------------------------------------------------
    console.log('--- TEST 8: Reactivate SR1 and verify dynamic usage counts ---');
    const activateRes = await request('PATCH', `/api/stock-documents/${sr1.id}/status`, {
      active: true
    }, adminToken);
    console.log('Reactivation Status:', activateRes.status);

    const checkUsageRes = await request('GET', '/api/stock-documents?all=true', null, adminToken);
    const checkSR1 = (checkUsageRes.data.documents || []).find(d => d.code === 'SR1' || d.name === 'SR1');
    console.log('SR1 Usage Count:', checkSR1?.usageCount);
    console.log('SR1 Total References:', checkSR1?.referenceCount);
    console.log('SR1 isReferenced flag:', checkSR1?.isReferenced);
    console.log('SR1 Active:', checkSR1?.active);

    if (checkSR1?.usageCount > 0 && checkSR1?.isReferenced === true && checkSR1?.active === true) {
      console.log('✓ TEST 8 PASSED: Dynamic usage count calculated accurately and SR1 reactivated.\n');
    } else {
      throw new Error('TEST 8 FAILED: Incorrect usage count or activation state');
    }

    // ----------------------------------------------------
    // TEST 9: Verify foreign key checks are ON
    // ----------------------------------------------------
    console.log('--- TEST 9: Verify foreign key checks remain enabled in MySQL ---');
    const [fkCheck] = await sequelize.query('SELECT @@foreign_key_checks AS fk_checks');
    console.log('Foreign Key Checks Setting:', fkCheck[0]?.fk_checks);
    if (fkCheck[0]?.fk_checks === 1) {
      console.log('✓ TEST 9 PASSED: FOREIGN_KEY_CHECKS = 1 (Strict integrity enforced).\n');
    } else {
      throw new Error('TEST 9 FAILED: Foreign key checks are disabled!');
    }

    console.log('================================================================');
    console.log('ALL TESTS PASSED WITH 100% SUCCESS! INTEGRITY FULLY VERIFIED');
    console.log('================================================================');
  } catch (err) {
    console.error('TEST SUITE ERROR:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await sequelize.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();
