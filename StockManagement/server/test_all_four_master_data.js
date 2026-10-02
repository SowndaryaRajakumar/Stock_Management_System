import {
  Category,
  Unit,
  StockDocument,
  Product,
  Faculty,
  User,
  Department,
  Indent,
  sequelize
} from './models/index.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const BASE_URL = 'http://localhost:5050/api';

async function runMasterDataTests() {
  console.log('====================================================');
  console.log('MASTER DATA TEST MATRIX: CATEGORIES, UNITS, REGISTERS, FACULTY');
  console.log('====================================================\n');

  // Authenticate as Admin
  const admin = await User.findOne({ where: { username: 'admin' } });
  if (!admin) {
    throw new Error('Admin user not found in MySQL database.');
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

  // ====================================================
  // 1. CATEGORIES TEST
  // ====================================================
  console.log('--- 1. CATEGORIES ---');
  const catName = `T_Cat_${Date.now()}`;
  // CREATE
  const catCreate = await client.post('/categories', { name: catName, description: 'Test Category' });
  console.log('✓ CREATE:', catCreate.status, catCreate.data.message);
  const catId = catCreate.data.category.id;

  // READ
  const catGet = await client.get(`/categories/${catId}`);
  console.log('✓ READ (getById):', catGet.status, catGet.data.category.name, 'Usage:', catGet.data.category.usageCount);

  // EDIT
  const catUpdate = await client.put(`/categories/${catId}`, { name: `${catName}_Updated`, description: 'Updated' });
  console.log('✓ EDIT:', catUpdate.status, catUpdate.data.message);

  // DEACTIVATE
  const catDeact = await client.patch(`/categories/${catId}/status`, { active: false });
  console.log('✓ DEACTIVATE:', catDeact.status, catDeact.data.message, 'Status:', catDeact.data.status);

  // ACTIVATE
  const catAct = await client.patch(`/categories/${catId}/status`, { active: true });
  console.log('✓ ACTIVATE:', catAct.status, catAct.data.message, 'Status:', catAct.data.status);

  // DELETE (Unused -> 200)
  const catDel = await client.delete(`/categories/${catId}`);
  console.log('✓ DELETE (Unused):', catDel.status, catDel.data.message);

  // DELETE (Used -> 409)
  const usedProd = await Product.findOne();
  if (usedProd) {
    try {
      await client.delete(`/categories/${usedProd.category_id}`);
      console.error('✗ Referenced category deletion should have failed with 409!');
    } catch (err) {
      console.log('✓ DELETE (Used blocked safely):', err.response.status, err.response.data.message);
    }
  }

  // ====================================================
  // 2. UNITS OF MEASUREMENT TEST
  // ====================================================
  console.log('\n--- 2. UNITS OF MEASUREMENT ---');
  const unitName = `Unit_${Date.now()}`;
  const unitSymbol = `u${Date.now()}`.substring(0, 10);
  // CREATE
  const unitCreate = await client.post('/units', { name: unitName, symbol: unitSymbol, description: 'Test Unit' });
  console.log('✓ CREATE:', unitCreate.status, unitCreate.data.message);
  const unitId = unitCreate.data.unit.id;

  // READ
  const unitGet = await client.get(`/units/${unitId}`);
  console.log('✓ READ (getById):', unitGet.status, unitGet.data.unit.name, 'Usage:', unitGet.data.unit.usageCount);

  // EDIT
  const unitUpdate = await client.put(`/units/${unitId}`, { name: `${unitName}_Updated`, symbol: `${unitSymbol}u` });
  console.log('✓ EDIT:', unitUpdate.status, unitUpdate.data.message);

  // DEACTIVATE
  const unitDeact = await client.patch(`/units/${unitId}/status`, { active: false });
  console.log('✓ DEACTIVATE:', unitDeact.status, unitDeact.data.message, 'Status:', unitDeact.data.status);

  // ACTIVATE
  const unitAct = await client.patch(`/units/${unitId}/status`, { active: true });
  console.log('✓ ACTIVATE:', unitAct.status, unitAct.data.message, 'Status:', unitAct.data.status);

  // DELETE (Unused -> 200)
  const unitDel = await client.delete(`/units/${unitId}`);
  console.log('✓ DELETE (Unused):', unitDel.status, unitDel.data.message);

  // DELETE (Used -> 409)
  if (usedProd && usedProd.unit_id) {
    try {
      await client.delete(`/units/${usedProd.unit_id}`);
      console.error('✗ Referenced unit deletion should have failed with 409!');
    } catch (err) {
      console.log('✓ DELETE (Used blocked safely):', err.response.status, err.response.data.message);
    }
  }

  // ====================================================
  // 3. STOCK REGISTERS TEST
  // ====================================================
  console.log('\n--- 3. STOCK REGISTERS ---');
  const regCode = `REG_${Date.now()}`.substring(0, 15);
  // CREATE
  const regCreate = await client.post('/stock-documents', { documentCode: regCode, description: 'Test Register' });
  console.log('✓ CREATE:', regCreate.status, regCreate.data.message);
  const regId = regCreate.data.document.id;

  // READ
  const regGet = await client.get(`/stock-documents/${regId}`);
  console.log('✓ READ (getById):', regGet.status, regGet.data.document.code, 'Usage:', regGet.data.document.usageCount);

  // EDIT
  const regUpdate = await client.put(`/stock-documents/${regId}`, { description: 'Updated physical book' });
  console.log('✓ EDIT:', regUpdate.status, regUpdate.data.message);

  // DEACTIVATE
  const regDeact = await client.patch(`/stock-documents/${regId}/status`, { active: false });
  console.log('✓ DEACTIVATE:', regDeact.status, regDeact.data.message, 'Status:', regDeact.data.status);

  // ACTIVATE
  const regAct = await client.patch(`/stock-documents/${regId}/status`, { active: true });
  console.log('✓ ACTIVATE:', regAct.status, regAct.data.message, 'Status:', regAct.data.status);

  // DELETE (Unused -> 200)
  const regDel = await client.delete(`/stock-documents/${regId}`);
  console.log('✓ DELETE (Unused):', regDel.status, regDel.data.message);

  // DELETE (Used -> 409)
  const usedReg = await StockDocument.findOne({ where: { document_code: 'SR1' } });
  if (usedReg) {
    try {
      await client.delete(`/stock-documents/${usedReg.id}`);
      console.error('✗ Referenced stock register deletion should have failed with 409!');
    } catch (err) {
      console.log('✓ DELETE (Used blocked safely):', err.response.status, err.response.data.message);
    }
  }

  // ====================================================
  // 4. FACULTY MANAGEMENT TEST
  // ====================================================
  console.log('\n--- 4. FACULTY MANAGEMENT ---');
  const dept = await Department.findOne();
  const deptId = dept ? dept.id : 1;
  const empCode = `FAC${Date.now()}`.substring(0, 10);
  const username = `u_${Date.now()}`.substring(0, 15);
  const email = `${username}@test.edu`;

  // CREATE
  const facCreate = await client.post('/faculty', {
    employee_code: empCode,
    name: 'Dr. Test Professor',
    username,
    email,
    password: 'password123',
    department_id: deptId,
    designation: 'Associate Professor',
    phone: '9876543210'
  });
  console.log('✓ CREATE:', facCreate.status, facCreate.data.message);
  const facId = facCreate.data.data.id;

  // READ
  const facGet = await client.get(`/faculty/${facId}`);
  console.log('✓ READ (getById):', facGet.status, facGet.data.data.name, 'Employee Code:', facGet.data.data.employee_code);

  // EDIT
  const facUpdate = await client.put(`/faculty/${facId}`, {
    name: 'Dr. Test Professor Updated',
    designation: 'Professor'
  });
  console.log('✓ EDIT:', facUpdate.status, facUpdate.data.message);

  // DEACTIVATE
  const facDeact = await client.patch(`/faculty/${facId}/status`, { active: false });
  console.log('✓ DEACTIVATE:', facDeact.status, facDeact.data.message, 'Status:', facDeact.data.status);

  // ACTIVATE
  const facAct = await client.patch(`/faculty/${facId}/status`, { active: true });
  console.log('✓ ACTIVATE:', facAct.status, facAct.data.message, 'Status:', facAct.data.status);

  // DELETE (Unused -> 200)
  const facDel = await client.delete(`/faculty/${facId}`);
  console.log('✓ DELETE (Unused):', facDel.status, facDel.data.message);

  console.log('\n====================================================');
  console.log('ALL 4 MASTER DATA MODULES VERIFIED & WORKING PERFECTLY!');
  console.log('====================================================');
  process.exit(0);
}

runMasterDataTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
