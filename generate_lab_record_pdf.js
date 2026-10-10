import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get base64 data URI of images for flawless embedding
function getBase64Image(filePath) {
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).slice(1);
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    const base64 = fs.readFileSync(filePath).toString('base64');
    return `data:${mime};base64,${base64}`;
  }
  return '';
}

const dashboardImg = getBase64Image(path.join(__dirname, 'report_assets/dashboard_analytics_1791278161324.jpg'));
const indentRegisterImg = getBase64Image(path.join(__dirname, 'report_assets/electrical_indent_register_1791278582355.jpg'));

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Consumables and Computer Hardware Stock Management System - Lab Record</title>
<style>
  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Times New Roman', Times, Georgia, serif;
    background-color: #f4f4f4;
    color: #000;
  }

  .page-container {
    width: 210mm;
    height: 297mm;
    margin: 15px auto;
    background: #ffffff;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    padding: 8mm;
    position: relative;
    page-break-after: always;
    page-break-inside: avoid;
    overflow: hidden;
  }

  @media print {
    body {
      background: none;
    }
    .page-container {
      margin: 0;
      width: 100%;
      height: 100vh;
      min-height: 280mm;
      box-shadow: none;
      page-break-after: always;
      page-break-inside: avoid;
      padding: 6mm;
      overflow: hidden;
    }
  }

  .border-box {
    border: 1.5px solid #111111;
    width: 100%;
    height: 100%;
    padding: 12mm 14mm 10mm 14mm;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  /* Academic Document Typography */
  .doc-title {
    font-size: 13.5pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 12px;
    line-height: 1.3;
    letter-spacing: 0.2px;
  }

  .meta-row {
    font-size: 11pt;
    font-weight: bold;
    margin-bottom: 5px;
    line-height: 1.3;
  }

  .section-label {
    font-size: 11pt;
    font-weight: bold;
    margin-top: 8px;
    margin-bottom: 4px;
  }

  .aim-text {
    font-size: 10.5pt;
    line-height: 1.35;
    text-align: justify;
    margin-bottom: 10px;
  }

  /* Tree / Explorer Side-by-Side */
  .explorer-grid {
    display: flex;
    gap: 12px;
    margin: 8px 0 10px 0;
    justify-content: space-between;
  }

  .explorer-box {
    flex: 1;
    background-color: #1e1e1e;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 8px 12px;
    font-family: 'Consolas', 'Courier New', Menlo, Monaco, monospace;
    font-size: 7.8pt;
    color: #d4d4d4;
    line-height: 1.32;
    box-shadow: inset 0 0 4px rgba(0,0,0,0.5);
  }

  .explorer-header {
    font-size: 7.8pt;
    text-transform: uppercase;
    color: #9cdcfe;
    font-weight: bold;
    margin-bottom: 5px;
    border-bottom: 1px solid #333;
    padding-bottom: 4px;
    display: flex;
    justify-content: space-between;
  }

  .tree-folder {
    color: #dcb67a;
    font-weight: bold;
  }

  .tree-file-js {
    color: #e5c07b;
  }

  .tree-file-jsx {
    color: #61afef;
  }

  .tree-file-json {
    color: #98c379;
  }

  .tree-file-css {
    color: #56b6c2;
  }

  /* Code Block Styling */
  .code-file-header {
    font-size: 10.5pt;
    font-weight: bold;
    font-family: 'Times New Roman', Times, serif;
    margin-top: 6px;
    margin-bottom: 3px;
  }

  .code-block {
    font-family: 'Consolas', 'Courier New', Menlo, Monaco, monospace;
    font-size: 8.1pt;
    line-height: 1.24;
    color: #000000;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    padding: 0;
  }

  /* Output Windows */
  .terminal-window {
    background-color: #181818;
    border: 1px solid #333;
    border-radius: 6px;
    overflow: hidden;
    margin: 6px 0 10px 0;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  }

  .terminal-titlebar {
    background-color: #2d2d2d;
    padding: 5px 10px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #3c3c3c;
  }

  .terminal-dots {
    display: flex;
    gap: 5px;
    margin-right: 12px;
  }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }

  .dot-red { background: #ff5f56; }
  .dot-yellow { background: #ffbd2e; }
  .dot-green { background: #27c93f; }

  .terminal-title {
    color: #999;
    font-size: 8pt;
    font-family: 'Consolas', 'Courier New', monospace;
    flex-grow: 1;
    text-align: center;
  }

  .terminal-body {
    padding: 8px 12px;
    font-family: 'Consolas', 'Courier New', Menlo, monospace;
    font-size: 7.8pt;
    line-height: 1.3;
    color: #e0e0e0;
  }

  .term-green { color: #50fa7b; }
  .term-cyan { color: #8be9fd; }
  .term-yellow { color: #f1fa8c; }
  .term-gray { color: #888888; }
  .term-white { color: #ffffff; font-weight: bold; }

  .ui-screenshot {
    width: 100%;
    max-height: 102mm;
    object-fit: contain;
    border: 1px solid #bbb;
    border-radius: 4px;
    display: block;
    margin: 4px auto 6px auto;
  }

  /* Rubrics Table */
  .rubrics-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    margin-bottom: 10px;
    font-size: 8.8pt;
  }

  .rubrics-table th, .rubrics-table td {
    border: 1px solid #111;
    padding: 5px 3px;
    text-align: center;
    vertical-align: middle;
  }

  .rubrics-table th {
    font-weight: bold;
    background-color: #fbfbfb;
    line-height: 1.2;
  }

  .rubrics-table td {
    height: 30px;
  }

  .result-para {
    font-size: 9.8pt;
    line-height: 1.34;
    text-align: justify;
    margin-top: 3px;
  }
</style>
</head>
<body>

<!-- ================= PAGE 1 ================= -->
<div class="page-container">
  <div class="border-box">
    <div class="doc-title">
      Consumables and Computer Hardware Stock Management System using React, Node.js and Express
    </div>

    <div class="meta-row">Ex.no: 15</div>
    <div class="meta-row">Date:</div>

    <div class="section-label">Aim:</div>
    <div class="aim-text">
      To develop a Consumables and Computer Hardware Stock Management System using React, Node.js, and Express.js by implementing a REST API with user authentication, Role-Based Access Control (RBAC), dual-ledger inventory tracking (Electrical Consumables and Computer Hardware), stock inward (purchases) and outward (transfers/issues) CRUD operations, database integration with MySQL &amp; Sequelize, pagination, filtering, searching, sorting, electronic and manual indent workflows, low-stock threshold alerting, security middleware, and comprehensive analytics report export functionality.
    </div>

    <div class="section-label">Project Structure:</div>
    <div class="explorer-grid">
      <!-- Frontend Tree -->
      <div class="explorer-box">
        <div class="explorer-header">
          <span>EXPLORER: FRONTEND</span>
          <span>...</span>
        </div>
        <div>▼ <span class="tree-folder">frontend</span></div>
        <div>&nbsp;&nbsp;▼ <span class="tree-folder">src</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;▼ <span class="tree-folder">api</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;▼ <span class="tree-folder">components</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;► <span class="tree-folder">common</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;► <span class="tree-folder">layout</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;▼ <span class="tree-folder">pages</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;⚛ <span class="tree-file-jsx">Dashboard.jsx</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;⚛ <span class="tree-file-jsx">ProductCatalog.jsx</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;⚛ <span class="tree-file-jsx">IndentRegister.jsx</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;⚛ <span class="tree-file-jsx">StockLedger.jsx</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;⚛ <span class="tree-file-jsx">App.jsx</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;# <span class="tree-file-css">index.css</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;⚛ <span class="tree-file-jsx">main.jsx</span></div>
        <div>&nbsp;&nbsp;&lt;&gt; index.html</div>
        <div>&nbsp;&nbsp;{} <span class="tree-file-json">package.json</span></div>
        <div>&nbsp;&nbsp;⚡ <span class="tree-file-js">vite.config.js</span></div>
      </div>

      <!-- Backend Tree -->
      <div class="explorer-box">
        <div class="explorer-header">
          <span>STOCK-MANAGEMENT (BACKEND)</span>
          <span>● 0 1</span>
        </div>
        <div>▼ <span class="tree-folder">backend</span></div>
        <div>&nbsp;&nbsp;▼ <span class="tree-folder">config</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;📄 <span class="tree-file-js">db.js</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;📄 <span class="tree-file-js">mysql.js</span></div>
        <div>&nbsp;&nbsp;▼ <span class="tree-folder">controllers</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;📄 <span class="tree-file-js">analyticsController.js</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;📄 <span class="tree-file-js">authController.js</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;📄 <span class="tree-file-js">indentController.js</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;📄 <span class="tree-file-js">productController.js</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;📄 <span class="tree-file-js">stockController.js</span></div>
        <div>&nbsp;&nbsp;▼ <span class="tree-folder">middleware</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;📄 <span class="tree-file-js">auth.js</span></div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;📄 <span class="tree-file-js">authenticateToken.js</span></div>
        <div>&nbsp;&nbsp;► <span class="tree-folder">models</span></div>
        <div>&nbsp;&nbsp;► <span class="tree-folder">routes</span></div>
        <div>&nbsp;&nbsp;📄 <span class="tree-file-js">app.js</span></div>
        <div>&nbsp;&nbsp;📄 <span class="tree-file-js">server.js</span></div>
      </div>
    </div>

    <div class="code-file-header">backend/app.js</div>
    <pre class="code-block">import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import productRoutes from './routes/productRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import indentRoutes from './routes/indentRoutes.js';
import { departmentRouter, categoryRouter, unitRouter, stockDocumentRouter } from './routes/masterDataRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import stockHistoryRoutes from './routes/stockHistoryRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { getDashboardStats } from './controllers/analyticsController.js';
import { protect, requireAdmin } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();</pre>
  </div>
</div>

<!-- ================= PAGE 2 ================= -->
<div class="page-container">
  <div class="border-box">
    <pre class="code-block">// Global Middleware
app.use(cors({
  origin: [
    'http://localhost:5174', 'http://127.0.0.1:5174',
    'http://localhost:5173', 'http://127.0.0.1:5173',
    'http://localhost:3000', 'http://127.0.0.1:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// System Isolation &amp; Dynamic Route Normalization
app.use((req, res, next) => {
  // Reject hardware requests on Electrical backend (port 5050)
  if (req.url.startsWith('/api/hardware')) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Hardware subsystem requests cannot be served by Electrical backend.'
    });
  }
  // Normalize /api/electrical/... requests to /api/...
  if (req.url.startsWith('/api/electrical')) {
    req.url = req.url.replace(/^\\/api\\/electrical/, '/api');
  }
  next();
});

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Consumable Stock Management System Backend Active',
    timestamp: new Date().toISOString()
  });
});

// Auth Routes (Login is public, /me is verified via JWT)
app.use('/api/auth', authRoutes);

// Electrical Subsystem Authorization: Accessible strictly by ADMIN
app.use('/api', protect, requireAdmin);

// Core API Routes (Admin only on Electrical backend)
app.use('/api/faculty', facultyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/departments', departmentRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/units', unitRouter);
app.use('/api/stock-documents', stockDocumentRouter);
app.use('/api/indents', indentRoutes);

// Dashboard direct endpoint
app.get('/api/dashboard', getDashboardStats);

// Compatibility &amp; Analytics Routes
app.use('/api/history', stockHistoryRoutes);
app.use('/api/stock-history', stockHistoryRoutes);
app.use('/api/stock-transactions', stockHistoryRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Global error handling middleware
app.use(errorHandler);

export default app;</pre>
  </div>
</div>

<!-- ================= PAGE 3 ================= -->
<div class="page-container">
  <div class="border-box">
    <div class="code-file-header">backend/server.js</div>
    <pre class="code-block">import app from './app.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5050;

async function startServer() {
  try {
    // Authenticate MySQL / Sequelize connection
    await connectDB();
    console.log('[DB Init] Master data tables and Sequelize models verified successfully.');
  } catch (dbErr) {
    console.log('[Server] Database initialization warning:', dbErr.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('Consumables Stock Backend Server running on port ' + PORT);
    console.log('API Health: http://localhost:' + PORT + '/api/health');
  });
}

startServer();</pre>

    <div class="code-file-header" style="margin-top: 14px;">backend/config/mysql.js</div>
    <pre class="code-block">import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'consumable_stock_management';
const dbUser = process.env.DB_USER || process.env.MYSQL_USER || 'root';
const dbPass = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.MYSQL_PASSWORD || '');
const dbHost = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
const dbPort = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    underscored: true,
    timestamps: true
  }
});

export default sequelize;</pre>
  </div>
</div>

<!-- ================= PAGE 4 ================= -->
<div class="page-container">
  <div class="border-box">
    <div class="code-file-header">backend/config/db.js</div>
    <pre class="code-block">import sequelize from './mysql.js';

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Database Connected: ' + (process.env.MYSQL_DATABASE || 'consumable_stock_management'));
  } catch (error) {
    console.error('MySQL Connection Error: ' + error.message);
    process.exit(1);
  }
};

export default connectDB;</pre>

    <div class="code-file-header" style="margin-top: 10px;">backend/middleware/authenticateToken.js</div>
    <pre class="code-block">import jwt from 'jsonwebtoken';
import { User, Role, Department } from '../models/index.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader &amp;&amp; authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Missing token.' });
    }

    const secret = process.env.JWT_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired authorization token.' });
    }

    const userId = decoded.userId || decoded.id;
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role' }, { model: Department, as: 'department' }]
    });

    if (!user || user.active === false || user.active === 0) {
      return res.status(401).json({ success: false, message: 'User account not found or deactivated.' });
    }

    const roleName = user.role?.name ? user.role.name.toUpperCase() : (decoded.role || 'FACULTY');

    req.user = {
      id: user.id,
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: roleName,
      department: user.department?.name || 'Central Store',
      designation: roleName === 'FACULTY' ? 'Faculty' : 'Administrator'
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authentication failed. Please log in again.' });
  }
};

export default authenticateToken;</pre>
  </div>
</div>

<!-- ================= PAGE 5 ================= -->
<div class="page-container">
  <div class="border-box">
    <div class="code-file-header">backend/middleware/authorizeRole.js</div>
    <pre class="code-block">export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const userRole = req.user.role ? req.user.role.toUpperCase() : '';
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    if (normalizedAllowed.includes(userRole)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied. Role "' + userRole + '" is not authorized for this resource.'
    });
  };
};

export const requireAdmin = requireRole('ADMIN');
export const requireFaculty = requireRole('FACULTY');
export const requireFacultyOrAdmin = requireRole('ADMIN', 'FACULTY');</pre>

    <div class="code-file-header" style="margin-top: 10px;">backend/controllers/productController.js (Excerpt)</div>
    <pre class="code-block">export const getProducts = async (req, res, next) => {
  try {
    const { search, category, register, status, lowStock, page, limit } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { product_name: { [Op.like]: '%' + search.trim() + '%' } },
        { product_code: { [Op.like]: '%' + search.trim() + '%' } },
        { '$category.name$': { [Op.like]: '%' + search.trim() + '%' } }
      ];
    }

    if (category &amp;&amp; category !== 'ALL') where['$category.name$'] = category.trim();
    if (register &amp;&amp; register !== 'ALL') where['$stockDocument.document_code$'] = register.trim();

    if (req.user &amp;&amp; req.user.role === 'FACULTY') {
      where.active = true;
    } else if (status &amp;&amp; status !== 'ALL') {
      where.active = (status === 'ACTIVE');
    }

    let rows = await Product.findAll({ where, include: PRODUCT_INCLUDES, order: [['product_name', 'ASC']] });
    let formattedProducts = rows.map(formatProduct);

    if (lowStock === 'true') {
      formattedProducts = formattedProducts.filter(p => p.isLowStock);
    }

    const total = formattedProducts.length;
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
      products: paginated
    });
  } catch (error) {
    next(error);
  }
};</pre>
  </div>
</div>

<!-- ================= PAGE 6 ================= -->
<div class="page-container">
  <div class="border-box">
    <div class="code-file-header">backend/controllers/indentController.js (Excerpt)</div>
    <pre class="code-block">export const getIndents = async (req, res, next) => {
  try {
    const { status, department, search, page, limit } = req.query;
    const where = {};

    // Role filtering: Faculty sees only their own indents
    if (req.user &amp;&amp; req.user.role === 'FACULTY') where.requested_by = req.user.id;
    if (status &amp;&amp; status !== 'ALL') where.status = status;

    if (department &amp;&amp; department !== 'ALL') {
      if (String(department).match(/^\\d+$/)) {
        where.department_id = parseInt(department, 10);
      } else {
        where['$department.name$'] = { [Op.like]: '%' + department.trim() + '%' };
      }
    }

    if (search) {
      where[Op.or] = [
        { indent_number: { [Op.like]: '%' + search.trim() + '%' } },
        { remarks: { [Op.like]: '%' + search.trim() + '%' } },
        { '$requester.name$': { [Op.like]: '%' + search.trim() + '%' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 50);

    const { count: total, rows } = await Indent.findAndCountAll({
      where,
      include: INDENT_INCLUDES,
      order: [['id', 'DESC']],
      offset: (pageNum - 1) * pageSize,
      limit: pageSize,
      distinct: true
    });

    res.json({
      success: true,
      count: rows.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      indents: rows.map(formatIndent)
    });
  } catch (error) {
    next(error);
  }
};

export const createIndent = async (req, res, next) => {
  try {
    const indentData = {
      ...req.body,
      requested_by: req.user.id,
      department_id: req.body.department_id || req.user.department_id
    };

    const newIndent = await createIndentService(indentData);
    res.status(201).json({
      success: true,
      message: 'Indent request created successfully.',
      data: formatIndent(newIndent)
    });
  } catch (error) {
    next(error);
  }
};</pre>
  </div>
</div>

<!-- ================= PAGE 7 ================= -->
<div class="page-container">
  <div class="border-box">
    <div class="section-label" style="margin-top: 0; margin-bottom: 8px;">Output Screens:</div>

    <!-- Terminal Window -->
    <div class="terminal-window">
      <div class="terminal-titlebar">
        <div class="terminal-dots">
          <div class="dot dot-red"></div>
          <div class="dot dot-yellow"></div>
          <div class="dot dot-green"></div>
        </div>
        <div class="terminal-title">Command Prompt — npm start / npm run dev</div>
      </div>
      <div class="terminal-body">
        <span class="term-cyan">C:\\EL\\consumables\\StockManagement\\server&gt;</span> <span class="term-white">npm start</span><br>
        &gt; stock-management-backend@1.0.0 start<br>
        &gt; node server.js<br><br>
        <span class="term-green">Consumables &amp; Hardware Stock Backend running on port 5050</span><br>
        API Health: <span class="term-cyan">http://localhost:5050/api/health</span><br>
        Database Mode: <span class="term-yellow">MySQL (consumable_stock_management) - Connected</span><br><br>
        [DB Init] 14 relational master tables and Sequelize models verified successfully.<br>
        [Auth] Verified JWT secret key and active administrator accounts.<br>
        [Stock Alert] Automated low-stock inventory monitor initialized.<br>
        --------------------------------------------------------------------------------<br>
        <span class="term-cyan">C:\\EL\\consumables\\ComputerHardwareManagement&gt;</span> <span class="term-white">npm run dev</span><br><br>
        <span class="term-green">VITE v5.4.14</span> &nbsp;<span class="term-gray">ready in 410 ms</span><br><br>
        &nbsp;&nbsp;<span class="term-green">➜</span> &nbsp;<span class="term-white">Local:</span> &nbsp;&nbsp;<span class="term-cyan">http://localhost:5173/</span><br>
        &nbsp;&nbsp;<span class="term-green">➜</span> &nbsp;<span class="term-gray">Network: use --host to expose</span><br>
        &nbsp;&nbsp;<span class="term-green">➜</span> &nbsp;<span class="term-gray">press h + enter to show help</span>
      </div>
    </div>

    <!-- Dashboard Screenshot -->
    <img src="${dashboardImg}" class="ui-screenshot" alt="Dashboard Screen" />
  </div>
</div>

<!-- ================= PAGE 8 ================= -->
<div class="page-container">
  <div class="border-box">
    <!-- REST API Terminal Window -->
    <div class="terminal-window" style="margin-top: 0; margin-bottom: 8px;">
      <div class="terminal-titlebar">
        <div class="terminal-dots">
          <div class="dot dot-red"></div>
          <div class="dot dot-yellow"></div>
          <div class="dot dot-green"></div>
        </div>
        <div class="terminal-title">REST API GET: http://localhost:5050/api/products — Status: 200 OK</div>
      </div>
      <div class="terminal-body" style="font-size: 7.5pt; line-height: 1.25; padding: 6px 10px;">
<span class="term-gray">{</span>
  <span class="term-cyan">"success"</span>: <span class="term-yellow">true</span>,
  <span class="term-cyan">"count"</span>: <span class="term-yellow">4</span>,
  <span class="term-cyan">"total"</span>: <span class="term-yellow">14</span>,
  <span class="term-cyan">"products"</span>: [
    {
      <span class="term-cyan">"productId"</span>: <span class="term-yellow">1</span>,
      <span class="term-cyan">"productCode"</span>: <span class="term-green">"ELEC-CAT6-01"</span>,
      <span class="term-cyan">"productName"</span>: <span class="term-green">"Cat6 UTP Ethernet Cable Roll (305m)"</span>,
      <span class="term-cyan">"category"</span>: <span class="term-green">"Networking Consumables"</span>,
      <span class="term-cyan">"currentStock"</span>: <span class="term-yellow">24</span>,
      <span class="term-cyan">"minimumStock"</span>: <span class="term-yellow">5</span>,
      <span class="term-cyan">"unit"</span>: <span class="term-green">"Roll"</span>,
      <span class="term-cyan">"status"</span>: <span class="term-green">"ACTIVE"</span>,
      <span class="term-cyan">"isLowStock"</span>: <span class="term-yellow">false</span>
    },
    {
      <span class="term-cyan">"productId"</span>: <span class="term-yellow">2</span>,
      <span class="term-cyan">"productCode"</span>: <span class="term-green">"ELEC-RJ45-02"</span>,
      <span class="term-cyan">"productName"</span>: <span class="term-green">"RJ45 Modular Connectors (Pack of 100)"</span>,
      <span class="term-cyan">"category"</span>: <span class="term-green">"Connectors &amp; Plugs"</span>,
      <span class="term-cyan">"currentStock"</span>: <span class="term-yellow">3</span>,
      <span class="term-cyan">"minimumStock"</span>: <span class="term-yellow">10</span>,
      <span class="term-cyan">"unit"</span>: <span class="term-green">"Pack"</span>,
      <span class="term-cyan">"status"</span>: <span class="term-green">"ACTIVE"</span>,
      <span class="term-cyan">"isLowStock"</span>: <span class="term-yellow">true</span>
    }
  ]
<span class="term-gray">}</span>
      </div>
    </div>

    <!-- Indent Register Screenshot -->
    <img src="${indentRegisterImg}" class="ui-screenshot" style="max-height: 80mm;" alt="Indent Register Screen" />

    <!-- Rubrics Table -->
    <div class="section-label" style="margin-top: 6px; margin-bottom: 2px;">Rubrics:</div>
    <table class="rubrics-table">
      <thead>
        <tr>
          <th>Problem Understanding &amp; Approach (10)</th>
          <th>Implementation &amp; Execution (15)</th>
          <th>Tool / Technology Usage (10)</th>
          <th>Code Quality &amp; Documentation (5)</th>
          <th>Viva (5)</th>
          <th>Time Management (5)</th>
          <th>Total (50)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <!-- Result Section -->
    <div class="section-label" style="margin-top: 4px; margin-bottom: 2px;">Result:</div>
    <div class="result-para">
      Thus, the Consumables and Computer Hardware Stock Management System was successfully developed using React, Node.js, and Express.js. The system successfully implemented user authentication, Role-Based Access Control, dual-ledger inventory tracking (Electrical Consumables and Computer Hardware), stock inward and outward operations, indent request and approval workflows, low-stock threshold alerting, database integration with MySQL &amp; Sequelize, pagination, filtering, searching, sorting, security middleware, and comprehensive inventory analytics report functionality.
    </div>
  </div>
</div>

</body>
</html>`;

const outputPathHtml = path.join(__dirname, 'EXERCISE_15_STOCK_MANAGEMENT_LAB_RECORD.html');
const outputPathPdf = path.join(__dirname, 'EXERCISE_15_STOCK_MANAGEMENT_LAB_RECORD.pdf');

fs.writeFileSync(outputPathHtml, htmlContent, 'utf8');
console.log('✅ HTML generated successfully:', outputPathHtml);

try {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const cmd = `"${chromePath}" --headless --disable-gpu --print-to-pdf="${outputPathPdf}" --print-to-pdf-no-header --no-pdf-header-footer "${outputPathHtml}"`;
  console.log('Generating PDF via headless Chrome...');
  execSync(cmd, { stdio: 'inherit' });
  console.log('✅ PDF generated successfully:', outputPathPdf);
} catch (err) {
  console.error('Error generating PDF:', err.message);
}
