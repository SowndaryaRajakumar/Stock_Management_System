import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthProvider } from '../context/AuthContext';
import { SystemProvider } from '../context/SystemContext';
import { StockProvider } from '../context/StockContext';
import { NotificationProvider } from '../context/NotificationContext';
import AppRoutes from '../routes/AppRoutes';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

// Mock API calls
vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({
      success: true,
      token: 'mock-token',
      user: {
        id: 'usr-admin-01',
        username: 'admin',
        name: 'Admin User',
        role: 'ADMIN',
        department: 'Central Store'
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
          productCode: 'HW-001',
          productName: 'Cat6 Cable 305m',
          category: 'Networking',
          currentQuantity: 10,
          minimumStockLevel: 2,
          unit: 'Box',
          stockRegister: 'HW-SR1',
          status: 'ACTIVE'
        }
      ],
      total: 1
    }),
    getProductById: vi.fn().mockResolvedValue({
      success: true,
      product: {
        _id: 'p1',
        productCode: 'HW-001',
        productName: 'Cat6 Cable 305m',
        category: 'Networking',
        currentQuantity: 10,
        minimumStockLevel: 2,
        unit: 'Box',
        stockRegister: 'HW-SR1',
        status: 'ACTIVE'
      }
    })
  },
  purchaseApi: {
    getPurchases: vi.fn().mockResolvedValue({ success: true, purchases: [] })
  },
  transferApi: {
    getTransfers: vi.fn().mockResolvedValue({ success: true, transfers: [] })
  },
  indentApi: {
    getIndents: vi.fn().mockResolvedValue({
      success: true,
      indents: [
        {
          id: 1,
          indentNumber: 'HW-IND-001',
          department: 'Computer Science',
          requesterName: 'Dr. John',
          purpose: 'Lab 1 Upgrade',
          status: 'SUBMITTED',
          items: [{ productName: 'Cat6 Cable 305m', quantityRequired: 2, unit: 'Box' }]
        }
      ],
      total: 1
    }),
    getIndentById: vi.fn().mockResolvedValue({
      success: true,
      indent: {
        id: 1,
        indentNumber: 'HW-IND-001',
        department: 'Computer Science',
        requesterName: 'Dr. John',
        purpose: 'Lab 1 Upgrade',
        status: 'SUBMITTED',
        items: [{ productName: 'Cat6 Cable 305m', quantityRequired: 2, unit: 'Box' }]
      }
    }),
    createIndent: vi.fn().mockResolvedValue({ success: true, indent: { id: 2, indentNumber: 'HW-IND-002' } })
  },
  historyApi: {
    getStockHistory: vi.fn().mockResolvedValue({ success: true, history: [] })
  },
  notificationApi: {
    getNotifications: vi.fn().mockResolvedValue({ success: true, notifications: [], unreadCount: 0 }),
    markRead: vi.fn().mockResolvedValue({ success: true }),
    markAllRead: vi.fn().mockResolvedValue({ success: true })
  },
  analyticsApi: {
    getDashboardStats: vi.fn().mockResolvedValue({
      success: true,
      stats: {
        totalProducts: 5,
        totalCategories: 2,
        currentStock: 150,
        lowStockCount: 0,
        pendingIndents: 1
      },
      facultyStats: {
        myTotalRequests: 1,
        myPendingRequests: 1,
        myApprovedRequests: 0,
        myRejectedRequests: 0
      },
      lowStockItems: [],
      recentActivity: [],
      recentIndents: []
    })
  },
  reportApi: {
    getReportData: vi.fn().mockResolvedValue({ success: true, data: [] })
  },
  masterDataApi: {
    getDepartments: vi.fn().mockResolvedValue({
      success: true,
      departments: [{ id: 1, name: 'Computer Science' }]
    }),
    getCategories: vi.fn().mockResolvedValue({
      success: true,
      categories: [{ id: 1, name: 'Networking' }]
    }),
    getUnits: vi.fn().mockResolvedValue({
      success: true,
      units: [{ id: 1, name: 'Box' }]
    }),
    getStockDocuments: vi.fn().mockResolvedValue({
      success: true,
      documents: [{ id: 1, name: 'HW-SR1' }]
    })
  }
}));

const mockAdminUser = {
  id: 'usr-admin-01',
  username: 'admin',
  name: 'Admin User',
  role: 'ADMIN',
  department: 'Central Store'
};

const mockFacultyUser = {
  id: 'usr-fac-01',
  username: 'faculty',
  name: 'Faculty User',
  role: 'FACULTY',
  department: 'Computer Science'
};

const renderWithContext = (
  ui,
  { initialRoute = '/dashboard', authenticated = true, user = mockFacultyUser, system = 'hardware' } = {}
) => {
  if (authenticated) {
    window.localStorage.setItem('auth_user', JSON.stringify(user));
    window.localStorage.setItem('stock_auth_user', JSON.stringify(user));
    window.localStorage.setItem('auth_token', 'mock-token');
    window.localStorage.setItem('stock_auth_token', 'mock-token');
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

describe('Role-Based Access Control & Navigation Enforcement', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. FACULTY Role Access Restriction', () => {
    it('Blocks Faculty from accessing /electrical/dashboard and redirects to hardware', async () => {
      renderWithContext(<AppRoutes />, {
        initialRoute: '/electrical/dashboard',
        authenticated: true,
        user: mockFacultyUser,
        system: 'electrical'
      });

      // Faculty should be redirected to Hardware Faculty Portal Dashboard
      await waitFor(() => {
        expect(screen.getByText('Faculty Portal Dashboard')).toBeInTheDocument();
        expect(screen.queryByText(/Electrical Stock – Overview/i)).not.toBeInTheDocument();
      });
    });

    it('Blocks Faculty from accessing /electrical/products and redirects to hardware', async () => {
      renderWithContext(<AppRoutes />, {
        initialRoute: '/electrical/products',
        authenticated: true,
        user: mockFacultyUser,
        system: 'electrical'
      });

      await waitFor(() => {
        expect(screen.getByText('Faculty Portal Dashboard')).toBeInTheDocument();
      });
    });

    it('Blocks Faculty from accessing /electrical/purchases and redirects to hardware', async () => {
      renderWithContext(<AppRoutes />, {
        initialRoute: '/electrical/purchases',
        authenticated: true,
        user: mockFacultyUser,
        system: 'electrical'
      });

      await waitFor(() => {
        expect(screen.getByText('Faculty Portal Dashboard')).toBeInTheDocument();
      });
    });

    it('Blocks Faculty from accessing /select-system and redirects to hardware dashboard', async () => {
      renderWithContext(<AppRoutes />, {
        initialRoute: '/select-system',
        authenticated: true,
        user: mockFacultyUser,
        system: 'hardware'
      });

      await waitFor(() => {
        expect(screen.getByText('Faculty Portal Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Select Stock Management System')).not.toBeInTheDocument();
      });
    });

    it('Sidebar for Faculty shows ONLY Hardware navigation with Physical Indent and hides Electrical', () => {
      renderWithContext(<Sidebar />, {
        initialRoute: '/hardware/dashboard',
        authenticated: true,
        user: mockFacultyUser,
        system: 'hardware'
      });

      // Shows Hardware Overview, Product Catalog, Physical Indent, My Indent Requests, Notifications
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Product Catalog')).toBeInTheDocument();
      expect(screen.getByText('Physical Indent')).toBeInTheDocument();
      expect(screen.getByText('My Indent Requests')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Faculty Portal')).toBeInTheDocument();

      // Electrical menu items MUST NOT be present
      expect(screen.queryByText('Electrical Stock')).not.toBeInTheDocument();
      expect(screen.queryByText('Indent Register')).not.toBeInTheDocument();
      expect(screen.queryByText('Stock Registers')).not.toBeInTheDocument();
      expect(screen.queryByText('Departments')).not.toBeInTheDocument();
      expect(screen.queryByText('Manage Indents')).not.toBeInTheDocument();
    });

    it('Topbar for Faculty shows static Hardware Stock pill without system switcher menu', () => {
      renderWithContext(<Topbar title="Faculty Portal Dashboard" breadcrumb="Overview" />, {
        initialRoute: '/hardware/dashboard',
        authenticated: true,
        user: mockFacultyUser,
        system: 'hardware'
      });

      expect(screen.getByText('💻 Hardware Stock')).toBeInTheDocument();
      // Should not have the dropdown indicator or system switch menu
      expect(screen.queryByText('⚡ Electrical Stock')).not.toBeInTheDocument();
      expect(screen.queryByText('System Selection Menu')).not.toBeInTheDocument();
    });
  });

  describe('2. ADMIN Role Full Access Preservation', () => {
    it('Admin can access Electrical dashboard and modules', async () => {
      renderWithContext(<AppRoutes />, {
        initialRoute: '/electrical/dashboard',
        authenticated: true,
        user: mockAdminUser,
        system: 'electrical'
      });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Manual Indents')).toBeInTheDocument();
      });
    });

    it('Admin can access Hardware dashboard and modules', async () => {
      renderWithContext(<AppRoutes />, {
        initialRoute: '/hardware/dashboard',
        authenticated: true,
        user: mockAdminUser,
        system: 'hardware'
      });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Pending Indents')).toBeInTheDocument();
      });
    });

    it('Admin can access /select-system portal', async () => {
      renderWithContext(<AppRoutes />, {
        initialRoute: '/select-system',
        authenticated: true,
        user: mockAdminUser,
        system: 'hardware'
      });

      await waitFor(() => {
        expect(screen.getByText('Select Stock Management System')).toBeInTheDocument();
        expect(screen.getByText('Electrical Stock Management')).toBeInTheDocument();
        expect(screen.getByText('Computer Hardware Stock')).toBeInTheDocument();
      });
    });

    it('Sidebar for Admin in Hardware shows full inventory, master data, and management menu', () => {
      renderWithContext(<Sidebar />, {
        initialRoute: '/hardware/dashboard',
        authenticated: true,
        user: mockAdminUser,
        system: 'hardware'
      });

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Purchase')).toBeInTheDocument();
      expect(screen.getByText('Transfer')).toBeInTheDocument();
      expect(screen.getByText('Stock History')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Units of Measurement')).toBeInTheDocument();
      expect(screen.getByText('Stock Registers')).toBeInTheDocument();
      expect(screen.getByText('Departments')).toBeInTheDocument();
      expect(screen.getByText('Faculty')).toBeInTheDocument();
      expect(screen.getByText('Manage Indents')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    });

    it('Topbar for Admin provides interactive system switcher between Electrical and Hardware', () => {
      renderWithContext(<Topbar title="Admin Dashboard" breadcrumb="Overview" />, {
        initialRoute: '/hardware/dashboard',
        authenticated: true,
        user: mockAdminUser,
        system: 'hardware'
      });

      const switchBtn = screen.getByTitle('Switch between Electrical and Hardware Stock Systems');
      expect(switchBtn).toBeInTheDocument();
      fireEvent.click(switchBtn);

      expect(screen.getByText('Active Subsystem')).toBeInTheDocument();
      expect(screen.getByText('⚡ Electrical Stock')).toBeInTheDocument();
      expect(screen.getByText('💻 Computer Hardware')).toBeInTheDocument();
      expect(screen.getByText('▤ System Selection Menu')).toBeInTheDocument();
    });
  });
});
