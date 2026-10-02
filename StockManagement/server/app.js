import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import productRoutes from './routes/productRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import indentRoutes from './routes/indentRoutes.js';
import {
  departmentRouter,
  categoryRouter,
  unitRouter,
  stockDocumentRouter
} from './routes/masterDataRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import stockHistoryRoutes from './routes/stockHistoryRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { getDashboardStats } from './controllers/analyticsController.js';
import { protect } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
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

// System Isolation & Dynamic Route Normalization
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
    req.url = req.url.replace(/^\/api\/electrical/, '/api');
  }
  next();
});

// Core API Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/departments', departmentRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/units', unitRouter);
app.use('/api/stock-documents', stockDocumentRouter);
app.use('/api/indents', indentRoutes);

// Dashboard direct endpoint
app.get('/api/dashboard', protect, getDashboardStats);

// Compatibility & Analytics Routes
app.use('/api/history', stockHistoryRoutes);
app.use('/api/stock-history', stockHistoryRoutes);
app.use('/api/stock-transactions', stockHistoryRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Consumable Stock Management System Backend Active',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
