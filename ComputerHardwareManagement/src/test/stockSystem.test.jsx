import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthProvider } from '../context/AuthContext';
import { SystemProvider } from '../context/SystemContext';
import { StockProvider } from '../context/StockContext';
import { NotificationProvider } from '../context/NotificationContext';
import AppRoutes from '../routes/AppRoutes';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import Purchase from '../pages/Purchase';
import Transfer from '../pages/Transfer';
import Indents from '../pages/Indents';
import CreateIndent from '../pages/CreateIndent';
import StockHistory from '../pages/StockHistory';
import LowStock from '../pages/LowStock';
import Reports from '../pages/Reports';

// Mock API module
vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({
      success: true,
      token: 'mock-token',
      user: {
        id: 'usr-admin-01',
        username: 'e.ramesh',
        name: 'E. Ramesh',
        role: 'ADMIN',
        department: 'Maintenance Dept.',
        avatarText: 'ER'
      }
    }),
    getMe: vi.fn().mockResolvedValue({ success: true, user: { role: 'ADMIN' } })
  },
  productApi: {
    getProducts: vi.fn().mockResolvedValue({
      success: true,
      products: [
        {
          _id: 'p1',
          productCode: 'EL-SW-001',
          productName: 'Switch (2-pin, 6A)',
          category: 'Wiring Accessories',
          currentQuantity: 45,
          minimumStockLevel: 20,
          unit: 'Pieces',
          stockRegister: 'SR1',
          status: 'ACTIVE',
          registerRefs: [{ sheet: 'SR1', page: 12 }]
        },
        {
          _id: 'p2',
          productCode: 'EL-BLB-001',
          productName: 'LED Bulb 10W',
          category: 'Lighting',
          currentQuantity: 8,
          minimumStockLevel: 25,
          unit: 'Pieces',
          stockRegister: 'SR1',
          status: 'ACTIVE',
          registerRefs: [{ sheet: 'SR1', page: 4 }]
        }
      ]
    }),
    getProductById: vi.fn().mockResolvedValue({
      success: true,
      product: {
        _id: 'p1',
        productCode: 'EL-SW-001',
        productName: 'Switch (2-pin, 6A)',
        category: 'Wiring Accessories',
        currentQuantity: 45,
        minimumStockLevel: 20,
        unit: 'Pieces',
        stockRegister: 'SR1',
        status: 'ACTIVE',
        registerRefs: [{ sheet: 'SR1', page: 12 }],
        remarks: []
      }
    }),
    createProduct: vi.fn().mockResolvedValue({ success: true }),
    updateProduct: vi.fn().mockResolvedValue({ success: true }),
    deleteProduct: vi.fn().mockResolvedValue({ success: true })
  },
  purchaseApi: {
    getPurchases: vi.fn().mockResolvedValue({
      success: true,
      purchases: [
        {
          _id: 'pur-1',
          purchaseId: 'PUR-2026-001',
          purchaseDate: '2026-09-08',
          invoiceNumber: 'INV-4401',
          productId: 'p1',
          productCode: 'EL-SW-001',
          productName: 'Switch (2-pin, 6A)',
          stockRegister: 'SR1',
          supplierName: 'Anchor Electricals Ltd.',
          quantity: 50,
          unitPrice: 28,
          totalAmount: 1400,
          unit: 'Pieces',
          receivedBy: 'E. Ramesh'
        }
      ]
    }),
    recordPurchase: vi.fn().mockResolvedValue({ success: true })
  },
  transferApi: {
    getTransfers: vi.fn().mockResolvedValue({
      success: true,
      transfers: [
        {
          _id: 'tr-1',
          transferId: 'TR-2026-001',
          transferDate: '2026-09-08',
          department: 'CSE Department',
          productId: 'p1',
          productCode: 'EL-SW-001',
          productName: 'Switch (2-pin, 6A)',
          stockRegister: 'SR1',
          quantity: 5,
          unit: 'Pieces',
          issuedBy: 'E. Ramesh',
          remarks: 'Lab 3 switchboard'
        }
      ]
    }),
    issueTransfer: vi.fn().mockResolvedValue({ success: true })
  },
  indentApi: {
    getIndents: vi.fn().mockResolvedValue({
      success: true,
      indents: [
        {
          _id: 'ind-1',
          indentNumber: 'IND-2026-001',
          requestDate: '2026-09-08',
          requiredDate: '2026-09-11',
          requesterName: 'Dr. K. Arul',
          department: 'CSE Department',
          purpose: 'IoT Lab Setup',
          status: 'PENDING',
          items: [
            {
              productId: 'p1',
              productCode: 'EL-SW-001',
              productName: 'Switch (2-pin, 6A)',
              requestedQuantity: 10,
              approvedQuantity: 0,
              availableQuantityAtRequest: 45,
              stockRegister: 'SR1',
              unit: 'Pieces'
            }
          ]
        }
      ]
    }),
    getIndentById: vi.fn().mockResolvedValue({
      success: true,
      indent: {
        _id: 'ind-1',
        indentNumber: 'IND-2026-001',
        requestDate: '2026-09-08',
        requiredDate: '2026-09-11',
        requesterName: 'Dr. K. Arul',
        department: 'CSE Department',
        purpose: 'IoT Lab Setup',
        status: 'PENDING',
        items: [
          {
            productId: 'p1',
            productCode: 'EL-SW-001',
            productName: 'Switch (2-pin, 6A)',
            requestedQuantity: 10,
            approvedQuantity: 0,
            stockRegister: 'SR1',
            unit: 'Pieces'
          }
        ]
      }
    }),
    createIndent: vi.fn().mockResolvedValue({ success: true, indent: { _id: 'ind-2', indentNumber: 'IND-2026-002' } }),
    reviewIndent: vi.fn().mockResolvedValue({ success: true, indent: { _id: 'ind-1', status: 'APPROVED' } })
  },
  historyApi: {
    getStockHistory: vi.fn().mockResolvedValue({
      success: true,
      history: [
        {
          _id: 'h1',
          transactionId: 'TXN-001',
          date: '2026-09-08',
          type: 'PURCHASE',
          productCode: 'EL-SW-001',
          productName: 'Switch (2-pin, 6A)',
          stockRegister: 'SR1',
          quantity: 50,
          previousQuantity: 0,
          newQuantity: 50,
          department: 'Store',
          performedBy: 'E. Ramesh'
        }
      ]
    })
  },
  notificationApi: {
    getNotifications: vi.fn().mockResolvedValue({
      success: true,
      unreadCount: 1,
      notifications: [
        {
          _id: 'n1',
          type: 'LOW_STOCK',
          title: 'Low Stock Alert',
          message: 'LED Bulb 10W is below minimum stock.',
          isRead: false,
          createdAt: '2026-09-08'
        }
      ]
    }),
    markRead: vi.fn().mockResolvedValue({ success: true }),
    markAllRead: vi.fn().mockResolvedValue({ success: true })
  },
  analyticsApi: {
    getDashboardStats: vi.fn().mockResolvedValue({
      success: true,
      stats: {
        totalProducts: 12,
        currentStock: 480,
        lowStockCount: 2,
        pendingIndents: 1,
        todayPurchased: 50,
        todayTransferred: 5
      },
      lowStockItems: [],
      recentActivity: [],
      recentIndents: []
    }),
    getAnalyticsOverview: vi.fn().mockResolvedValue({
      success: true,
      inventory: {
        totalProducts: 12,
        totalStock: 480,
        lowStockCount: 2,
        criticalStockCount: 1,
        categoryDistribution: [{ name: 'Wiring Accessories', stock: 45 }],
        registerDistribution: [{ name: 'SR1', stock: 300 }]
      },
      purchases: { todayPurchased: 50, weeklyPurchases: 120, monthlyPurchases: 300, totalPurchases: 5 },
      transfers: { todayTransferred: 5, weeklyTransfers: 30, monthlyTransfers: 80, totalTransfers: 8, departmentTransfers: [] },
      indents: { pending: 1, approved: 3, completed: 4, rejected: 0, total: 8 },
      trends: [{ date: '08 Sep', purchases: 50, transfers: 5 }]
    })
  },
    reportApi: {
      getReportData: vi.fn().mockResolvedValue({
        success: true,
        title: 'Product Stock Inventory Report',
        data: [
          {
            productCode: 'EL-SW-001',
            name: 'Switch (2-pin, 6A)',
            category: 'Wiring Accessories',
            currentQuantity: 45,
            minimumStockLevel: 20,
            unit: 'Pieces',
            stockRegister: 'SR1',
            status: 'Available'
          }
        ]
      })
    },
    masterDataApi: {
      getDepartments: vi.fn().mockResolvedValue({
        success: true,
        departments: [{ name: 'Electrical & Electronics Engineering' }, { name: 'CSE Department' }]
      }),
      getCategories: vi.fn().mockResolvedValue({
        success: true,
        categories: [{ name: 'Lighting' }, { name: 'Wiring Accessories' }]
      }),
      getUnits: vi.fn().mockResolvedValue({
        success: true,
        units: [{ name: 'Pieces' }, { name: 'Meters' }]
      }),
      getStockDocuments: vi.fn().mockResolvedValue({
        success: true,
        documents: [{ name: 'SR1' }, { name: 'SR2' }]
      })
    }
  }));

const mockAdminUser = {
  id: 'usr-admin-01',
  username: 'admin',
  name: 'System Admin',
  role: 'ADMIN',
  department: 'Maintenance Dept.',
  avatarText: 'AD'
};

const mockFacultyUser = {
  id: 'usr-fac-01',
  username: 'faculty',
  name: 'Faculty User',
  role: 'FACULTY',
  department: 'Electrical & Electronics Engineering',
  avatarText: 'FA'
};

const renderWithProviders = (
  ui,
  { initialRoute = '/dashboard', authenticated = true, user = mockAdminUser, system = 'electrical' } = {}
) => {
  if (authenticated) {
    window.localStorage.setItem('auth_user', JSON.stringify(user));
    window.localStorage.setItem('auth_token', 'mock-jwt-token-12345');
    window.localStorage.setItem('stock_active_system', system);
  } else {
    window.localStorage.clear();
  }

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <SystemProvider>
          <NotificationProvider>
            <StockProvider>{ui}</StockProvider>
          </NotificationProvider>
        </SystemProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Consumable Stock Management System - MERN Stack Frontend Suite', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('1. Renders Login page with demo credentials and institutional header', () => {
    renderWithProviders(<Login />, { initialRoute: '/login', authenticated: false });

    expect(screen.getByRole('heading', { name: /Consumable Stock Management System|Institutional Stock Management Portal/i })).toBeInTheDocument();
    expect(screen.getByText(/Central Consumable Store|Unified Access/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username or Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login to System/i })).toBeInTheDocument();
  });

  it('2. Protected Route: Redirects unauthenticated users to /login', () => {
    renderWithProviders(<AppRoutes />, { initialRoute: '/dashboard', authenticated: false });

    expect(screen.getByRole('heading', { name: /Consumable Stock Management System|Institutional Stock Management Portal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login to System/i })).toBeInTheDocument();
  });

  it('3. Renders Dashboard with summary metrics', async () => {
    renderWithProviders(<Dashboard />, { initialRoute: '/dashboard', authenticated: true });

    await waitFor(() => {
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      expect(screen.getByText('Current Stock')).toBeInTheDocument();
      expect(screen.getByText('Pending Indents')).toBeInTheDocument();
    });
  });

  it('4. Products Page: Lists products, filter and search bar', async () => {
    renderWithProviders(<Products />, { initialRoute: '/products', authenticated: true });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search products by code, name, category/i)).toBeInTheDocument();
      expect(screen.getByText('Add Product')).toBeInTheDocument();
    });
  });

  it('5. Purchase Page: Renders operational Purchase form and logs without intake summary', async () => {
    renderWithProviders(<Purchase />, { initialRoute: '/purchases', authenticated: true });

    expect(screen.getByRole('heading', { level: 1, name: /Stock Purchases|Purchase/i })).toBeInTheDocument();
    expect(screen.queryByText('Purchase Intake Summary')).not.toBeInTheDocument();
    expect(screen.queryByText(/Procurement Standard Operating Procedure/i)).not.toBeInTheDocument();
    expect(screen.getByText('Recent Purchase Logs')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Record Stock Purchase' })).toBeInTheDocument();
    });
  });

  it('6. Transfer Page: Renders Transfer and issue form', async () => {
    renderWithProviders(<Transfer />, { initialRoute: '/transfers', authenticated: true });

    expect(screen.getByRole('heading', { level: 1, name: /Stock Transfers|Transfer/i })).toBeInTheDocument();
    expect(screen.getByText('Transfer Statistics')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Issue Department Stock Transfer' })).toBeInTheDocument();
    });
  });

  it('7. Indents Page: Renders requisition records and summary metrics', async () => {
    renderWithProviders(<Indents />, { initialRoute: '/indents', authenticated: true });

    expect(screen.getByRole('heading', { name: /Online Indent Requisitions/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Total Indents')).toBeInTheDocument();
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
    });
  });

  it('8. Create Indent Page: Renders multi-item requisition form for faculty', async () => {
    renderWithProviders(<CreateIndent />, {
      initialRoute: '/indents/create',
      authenticated: true,
      user: mockFacultyUser
    });

    const titleEl = await screen.findByRole('heading', { name: 'Create Material Indent' });
    expect(titleEl).toBeInTheDocument();
    expect(screen.getByText(/Requisition Notice/i)).toBeInTheDocument();
  });

  it('9. Stock History: Renders Movement history and filter controls', async () => {
    renderWithProviders(<StockHistory />, { initialRoute: '/history', authenticated: true });

    expect(screen.getByRole('heading', { name: 'Stock History' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Total Transactions')).toBeInTheDocument();
    });
  });

  it('10. Low Stock Page: Renders Deficit items and replenishment alerts', async () => {
    renderWithProviders(<LowStock />, { initialRoute: '/low-stock', authenticated: true });

    expect(screen.getByRole('heading', { name: 'Low Stock Alerts' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Deficit Inventory Items')).toBeInTheDocument();
    });
  });

  it('11. Reports Page: Renders report generator with Excel and PDF export buttons', async () => {
    renderWithProviders(<Reports />, { initialRoute: '/reports', authenticated: true });

    expect(screen.getByRole('heading', { name: 'Consumable Stock Reports' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Export to Excel/i)).toBeInTheDocument();
      expect(screen.getByText(/Download Official PDF/i)).toBeInTheDocument();
    });
  });
});
