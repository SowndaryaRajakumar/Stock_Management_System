import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import { User, Faculty, Department, Role, sequelize } from './models/index.js';

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
  console.log('====================================================');
  console.log('STARTING AUTOMATED VERIFICATION OF 11 REQUIRED TESTS');
  console.log('====================================================\n');

  await connectDB();

  // Start temporary server on an ephemeral port
  const port = 5998;
  server = app.listen(port);
  baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on ${baseUrl}\n`);

  let adminToken = '';
  let facultyToken = '';
  let createdFacultyId = null;
  const testFacultyUsername = `prof_test_${Date.now()}`;
  const testFacultyEmpCode = `FAC${Math.floor(1000 + Math.random() * 9000)}`;
  const testFacultyPassword = 'facultySecret123!';

  try {
    // ----------------------------------------------------
    // TEST 1: Admin login with valid credentials
    // ----------------------------------------------------
    console.log('--- TEST 1: Admin login with valid credentials ---');
    const t1 = await request('POST', '/api/auth/login', {
      identifier: 'admin',
      password: 'admin123'
    });
    console.log('Response Status:', t1.status);
    console.log('Token exists:', !!t1.data.token);
    console.log('User Role:', t1.data.user?.role);
    if (t1.status === 200 && t1.data.token && t1.data.user?.role === 'ADMIN') {
      adminToken = t1.data.token;
      console.log('✓ TEST 1 PASSED: Admin authenticated with JWT & role=ADMIN\n');
    } else {
      throw new Error(`TEST 1 FAILED: ${JSON.stringify(t1.data)}`);
    }

    // ----------------------------------------------------
    // TEST 2: Faculty login with valid credentials
    // ----------------------------------------------------
    console.log('--- TEST 2: Faculty login with valid credentials ---');
    const t2 = await request('POST', '/api/auth/login', {
      identifier: 'faculty',
      password: 'faculty123'
    });
    console.log('Response Status:', t2.status);
    console.log('Token exists:', !!t2.data.token);
    console.log('User Role:', t2.data.user?.role);
    if (t2.status === 200 && t2.data.token && t2.data.user?.role === 'FACULTY') {
      facultyToken = t2.data.token;
      console.log('✓ TEST 2 PASSED: Faculty authenticated with JWT & role=FACULTY\n');
    } else {
      throw new Error(`TEST 2 FAILED: ${JSON.stringify(t2.data)}`);
    }

    // ----------------------------------------------------
    // TEST 3: Wrong password
    // ----------------------------------------------------
    console.log('--- TEST 3: Wrong password ---');
    const t3 = await request('POST', '/api/auth/login', {
      identifier: 'admin',
      password: 'wrongPasswordXYZ'
    });
    console.log('Response Status:', t3.status);
    console.log('Message:', t3.data.message);
    if (t3.status === 401 && t3.data.success === false) {
      console.log('✓ TEST 3 PASSED: Wrong password rejected with 401\n');
    } else {
      throw new Error(`TEST 3 FAILED: ${JSON.stringify(t3.data)}`);
    }

    // ----------------------------------------------------
    // TEST 4: Non-existent user
    // ----------------------------------------------------
    console.log('--- TEST 4: Non-existent user ---');
    const t4 = await request('POST', '/api/auth/login', {
      identifier: 'nobody_user_xyz_9999',
      password: 'somepassword'
    });
    console.log('Response Status:', t4.status);
    console.log('Message:', t4.data.message);
    if (t4.status === 401 && t4.data.success === false) {
      console.log('✓ TEST 4 PASSED: Non-existent user rejected with 401\n');
    } else {
      throw new Error(`TEST 4 FAILED: ${JSON.stringify(t4.data)}`);
    }

    // ----------------------------------------------------
    // TEST 6: Admin creates faculty
    // ----------------------------------------------------
    console.log('--- TEST 6: Admin creates faculty ---');
    const t6 = await request('POST', '/api/faculty', {
      employee_code: testFacultyEmpCode,
      name: 'Dr. Test Ramesh',
      username: testFacultyUsername,
      email: `${testFacultyUsername}@nec.edu.in`,
      password: testFacultyPassword,
      department_id: 1,
      designation: 'Assistant Professor',
      phone: '9876543210',
      status: 'ACTIVE'
    }, adminToken);

    console.log('Response Status:', t6.status);
    console.log('Created Faculty ID:', t6.data.data?.id);
    console.log('Created Faculty Name:', t6.data.data?.name);
    console.log('Password Hash in response:', (t6.data.data?.password || t6.data.data?.password_hash) ? 'EXPOSED!' : 'PROTECTED (none)');

    if (t6.status === 201 && t6.data.data?.id && !t6.data.data?.password && !t6.data.data?.password_hash) {
      createdFacultyId = t6.data.data.id;
      // Verify login with newly created faculty account
      const loginNew = await request('POST', '/api/auth/login', {
        identifier: testFacultyUsername,
        password: testFacultyPassword
      });
      if (loginNew.status === 200 && loginNew.data.user?.role === 'FACULTY') {
        console.log('✓ TEST 6 PASSED: Faculty created, password hashed, successfully authenticated via login API\n');
      } else {
        throw new Error(`TEST 6 Login FAILED: ${JSON.stringify(loginNew.data)}`);
      }
    } else {
      throw new Error(`TEST 6 FAILED: ${JSON.stringify(t6.data)}`);
    }

    // ----------------------------------------------------
    // TEST 7: Admin edits faculty
    // ----------------------------------------------------
    console.log('--- TEST 7: Admin edits faculty ---');
    const t7 = await request('PUT', `/api/faculty/${createdFacultyId}`, {
      employee_code: testFacultyEmpCode,
      name: 'Dr. Test Ramesh Senior',
      email: `${testFacultyUsername}_updated@nec.edu.in`,
      department_id: 2,
      designation: 'Associate Professor',
      phone: '9988776655',
      status: 'ACTIVE'
    }, adminToken);

    console.log('Response Status:', t7.status);
    console.log('Updated Name:', t7.data.data?.name);
    console.log('Updated Designation:', t7.data.data?.designation);
    if (t7.status === 200 && t7.data.data?.name === 'Dr. Test Ramesh Senior' && t7.data.data?.designation === 'Associate Professor') {
      console.log('✓ TEST 7 PASSED: Faculty details updated successfully\n');
    } else {
      throw new Error(`TEST 7 FAILED: ${JSON.stringify(t7.data)}`);
    }

    // ----------------------------------------------------
    // TEST 8: Admin deactivates faculty
    // ----------------------------------------------------
    console.log('--- TEST 8: Admin deactivates faculty ---');
    const t8 = await request('DELETE', `/api/faculty/${createdFacultyId}`, null, adminToken);
    console.log('Response Status:', t8.status);
    console.log('Message:', t8.data.message);
    if (t8.status === 200) {
      console.log('✓ TEST 8 PASSED: Faculty deactivated\n');
    } else {
      throw new Error(`TEST 8 FAILED: ${JSON.stringify(t8.data)}`);
    }

    // ----------------------------------------------------
    // TEST 5: Inactive faculty login
    // ----------------------------------------------------
    console.log('--- TEST 5: Inactive faculty login ---');
    const t5 = await request('POST', '/api/auth/login', {
      identifier: `${testFacultyUsername}_updated@nec.edu.in`,
      password: testFacultyPassword
    });
    console.log('Response Status:', t5.status);
    console.log('Message:', t5.data.message);
    if (t5.status === 401 && t5.data.success === false) {
      console.log('✓ TEST 5 PASSED: Inactive faculty login blocked with 401\n');
    } else {
      throw new Error(`TEST 5 FAILED: ${JSON.stringify(t5.data)}`);
    }

    // ----------------------------------------------------
    // TEST 9: Faculty tries: POST /api/faculty
    // ----------------------------------------------------
    console.log('--- TEST 9: Faculty tries: POST /api/faculty ---');
    const t9 = await request('POST', '/api/faculty', {
      employee_code: 'HACK001',
      name: 'Hacker',
      username: 'hacker',
      email: 'hacker@nec.edu.in',
      password: 'password123',
      department_id: 1
    }, facultyToken); // Using faculty token
    console.log('Response Status:', t9.status);
    console.log('Message:', t9.data.message);
    if (t9.status === 403) {
      console.log('✓ TEST 9 PASSED: Faculty rejected with 403 Forbidden on Admin endpoint\n');
    } else {
      throw new Error(`TEST 9 FAILED: ${JSON.stringify(t9.data)}`);
    }

    // ----------------------------------------------------
    // TEST 10: Unauthenticated user accesses /api/faculty
    // ----------------------------------------------------
    console.log('--- TEST 10: Unauthenticated user accesses /api/faculty ---');
    const t10 = await request('GET', '/api/faculty', null, null); // No token
    console.log('Response Status:', t10.status);
    console.log('Message:', t10.data.message);
    if (t10.status === 401) {
      console.log('✓ TEST 10 PASSED: Unauthenticated user rejected with 401 Unauthorized\n');
    } else {
      throw new Error(`TEST 10 FAILED: ${JSON.stringify(t10.data)}`);
    }

    // ----------------------------------------------------
    // TEST 11: Expired JWT
    // ----------------------------------------------------
    console.log('--- TEST 11: Expired JWT ---');
    // Generate an expired token with past timestamp
    const expiredToken = jwt.sign(
      { userId: 1, id: 1, username: 'admin', role: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '-10s' } // Expired 10 seconds ago
    );
    const t11 = await request('GET', '/api/faculty', null, expiredToken);
    console.log('Response Status:', t11.status);
    console.log('Message:', t11.data.message);
    if (t11.status === 401) {
      console.log('✓ TEST 11 PASSED: Expired JWT rejected with 401 Unauthorized\n');
    } else {
      throw new Error(`TEST 11 FAILED: ${JSON.stringify(t11.data)}`);
    }

    // Clean up test faculty
    if (createdFacultyId) {
      const fac = await Faculty.findByPk(createdFacultyId);
      if (fac) {
        await User.destroy({ where: { id: fac.user_id } });
        await Faculty.destroy({ where: { id: createdFacultyId } });
        console.log('🧹 Cleaned up temporary test faculty record.');
      }
    }

    console.log('\n====================================================');
    console.log('ALL 11 TESTS PASSED SUCCESSFULLY! 100% VERIFIED');
    console.log('====================================================');
  } catch (err) {
    console.error('VERIFICATION ERROR:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await sequelize.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();
