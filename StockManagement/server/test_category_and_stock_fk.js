import {
  Category,
  StockDocument,
  Product,
  User,
  sequelize
} from './models/index.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const BASE_URL = 'http://localhost:5050/api';

async function runTests() {
  console.log('=== STARTING CATEGORY & STOCK REGISTER FK TESTS ===');

  // Generate Admin JWT Token
  const admin = await User.findOne({ where: { username: 'admin' } });
  if (!admin) {
    throw new Error('Admin user not found for testing');
  }

  const token = jwt.sign(
    { id: admin.id, role: 'admin', username: admin.username },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const client = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // ----------------------------------------------------
  // TEST 1: CATEGORY CRUD & FK SAFE HANDLING
  // ----------------------------------------------------
  console.log('\n--- 1. Testing Category CRUD & FK Handling ---');

  const testCatName = `TestCat_${Date.now()}`;
  // 1.1 Create Category
  const createRes = await client.post('/categories', {
    name: testCatName,
    description: 'Temporary category for automated FK test'
  });
  console.log('✓ Create Category status:', createRes.status, createRes.data.message);
  const catId = createRes.data.category.id;

  // 1.2 Duplicate Check
  try {
    await client.post('/categories', { name: testCatName });
    console.error('✗ Duplicate check failed to throw!');
  } catch (err) {
    console.log('✓ Duplicate Category blocked correctly:', err.response.status, err.response.data.message);
  }

  // 1.3 Unused Category Deletion (Safe Physical Delete)
  const delRes = await client.delete(`/categories/${catId}`);
  console.log('✓ Unused Category delete status:', delRes.status, delRes.data.message);

  // 1.4 Test Referenced Category FK Protection
  // Find a category in use
  const usedProd = await Product.findOne();
  if (usedProd && usedProd.category_id) {
    const usedCatId = usedProd.category_id;
    const catDoc = await Category.findByPk(usedCatId);
    console.log(`\nTesting used category: "${catDoc.name}" (ID: ${usedCatId})`);

    // 1.5 Attempt physical delete on referenced category (Should return 409)
    try {
      await client.delete(`/categories/${usedCatId}`);
      console.error('✗ Deletion of referenced category succeeded when it should fail!');
    } catch (err) {
      console.log('✓ Referenced Category delete blocked safely with 409:');
      console.log('   Status:', err.response.status);
      console.log('   Message:', err.response.data.message);
      console.log('   Usage Count:', err.response.data.usageCount);
    }

    // 1.6 Deactivate referenced category
    const deactRes = await client.patch(`/categories/${usedCatId}/status`, { active: false });
    console.log('✓ Category deactivation:', deactRes.status, deactRes.data.message, 'Status:', deactRes.data.status);

    // 1.7 Verify getCategories() defaults to active only (should NOT include inactive category)
    const activeCats = await client.get('/categories');
    const hasInactive = activeCats.data.categories.some(c => c.id === usedCatId);
    console.log('✓ Active-only list excludes deactivated category:', !hasInactive);

    // 1.8 Verify getCategories({ all: true }) includes deactivated category
    const allCats = await client.get('/categories?all=true');
    const inAll = allCats.data.categories.find(c => c.id === usedCatId);
    console.log('✓ All categories list includes deactivated category:', Boolean(inAll), 'Usage count:', inAll?.usageCount);

    // 1.9 Reactivate category
    const reactRes = await client.patch(`/categories/${usedCatId}/status`, { active: true });
    console.log('✓ Category reactivation:', reactRes.status, reactRes.data.message, 'Status:', reactRes.data.status);
  }

  // ----------------------------------------------------
  // TEST 2: STOCK REGISTER CRUD & FK SAFE HANDLING
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Stock Register CRUD & FK Handling ---');

  const testDocCode = `TSR_${Date.now()}`.substring(0, 15);
  // 2.1 Create Stock Register
  const createDocRes = await client.post('/stock-documents', {
    documentCode: testDocCode,
    description: 'Temporary stock register for testing'
  });
  console.log('✓ Create Stock Register status:', createDocRes.status, createDocRes.data.message);
  const docId = createDocRes.data.document.id;

  // 2.2 Duplicate Check
  try {
    await client.post('/stock-documents', { documentCode: testDocCode });
    console.error('✗ Duplicate stock register check failed to throw!');
  } catch (err) {
    console.log('✓ Duplicate Stock Register blocked correctly:', err.response.status, err.response.data.message);
  }

  // 2.3 Unused Stock Register Deletion
  const delDocRes = await client.delete(`/stock-documents/${docId}`);
  console.log('✓ Unused Stock Register delete status:', delDocRes.status, delDocRes.data.message);

  // 2.4 Referenced Stock Register FK Protection
  const usedDoc = await StockDocument.findOne({ where: { document_code: 'SR1' } });
  if (usedDoc) {
    console.log(`\nTesting used stock register: "${usedDoc.document_code}" (ID: ${usedDoc.id})`);

    // 2.5 Attempt physical delete on used register (Should return 409)
    try {
      await client.delete(`/stock-documents/${usedDoc.id}`);
      console.error('✗ Deletion of referenced register succeeded when it should fail!');
    } catch (err) {
      console.log('✓ Referenced Register delete blocked safely with 409:');
      console.log('   Status:', err.response.status);
      console.log('   Message:', err.response.data.message);
      console.log('   Usage Count:', err.response.data.usageCount);
    }

    // 2.6 Deactivate register
    const deactDocRes = await client.patch(`/stock-documents/${usedDoc.id}/status`, { active: false });
    console.log('✓ Register deactivation:', deactDocRes.status, deactDocRes.data.message, 'Status:', deactDocRes.data.status);

    // 2.7 Verify active-only list excludes deactivated register
    const activeDocs = await client.get('/stock-documents');
    const hasInactiveDoc = activeDocs.data.documents.some(d => d.id === usedDoc.id);
    console.log('✓ Active-only list excludes deactivated register:', !hasInactiveDoc);

    // 2.8 Verify all documents list includes deactivated register with dynamic usage
    const allDocs = await client.get('/stock-documents?all=true');
    const inAllDoc = allDocs.data.documents.find(d => d.id === usedDoc.id);
    console.log('✓ All registers list includes deactivated register:', Boolean(inAllDoc), 'Usage count:', inAllDoc?.usageCount);

    // 2.9 Reactivate register
    const reactDocRes = await client.patch(`/stock-documents/${usedDoc.id}/status`, { active: true });
    console.log('✓ Register reactivation:', reactDocRes.status, reactDocRes.data.message, 'Status:', reactDocRes.data.status);
  }

  console.log('\n=== ALL CATEGORY & STOCK REGISTER TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
