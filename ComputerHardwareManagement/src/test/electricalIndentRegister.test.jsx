import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthProvider } from '../context/AuthContext';
import { SystemProvider } from '../context/SystemContext';
import { StockProvider } from '../context/StockContext';
import { NotificationProvider } from '../context/NotificationContext';
import Sidebar from '../components/layout/Sidebar';
import ElectricalIndentRegister from '../pages/ElectricalIndentRegister';
import Dashboard from '../pages/Dashboard';
import { indentApi, productApi, masterDataApi, facultyApi } from '../services/api';

vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({
      success: true,
      token: 'mock-token',
      user: { id: 1, name: 'Admin User', role: 'ADMIN' }
    }),
    getMe: vi.fn().mockResolvedValue({ success: true, user: { id: 1, name: 'Admin User', role: 'ADMIN' } })
  },
  indentApi: {
    getIndents: vi.fn().mockResolvedValue({
      success: true,
      indents: [
        {
          id: 101,
          indentNumber: 'IND-EL-2026-0001',
          date: '2026-10-06',
          department: 'Electrical Engineering',
          departmentId: 1,
          requestedBy: 'Dr. Ramesh Kumar',
          requesterId: 2,
          purpose: 'Lab 3 Wiring Maintenance',
          remarks: 'Urgent replacement',
          status: 'RECORDED',
          recordedBy: 'Admin',
          items: [
            {
              productId: 1,
              productCode: 'EL-SW-001',
              productName: 'Switch 6A',
              requestedQuantity: 10,
              unit: 'Pieces'
            }
          ]
        }
      ],
      total: 1
    }),
    createIndent: vi.fn().mockResolvedValue({
      success: true,
      indent: {
        id: 102,
        indentNumber: 'IND-EL-2026-0002',
        date: '2026-10-06',
        department: 'Power Systems',
        requestedBy: 'Prof. Suresh',
        purpose: 'Panel board test',
        status: 'RECORDED'
      }
    }),
    updateIndent: vi.fn().mockResolvedValue({
      success: true,
      indent: {
        id: 101,
        indentNumber: 'IND-EL-2026-0001',
        purpose: 'Updated Lab 3 Wiring'
      }
    }),
    deleteIndent: vi.fn().mockResolvedValue({
      success: true,
      message: 'Indent record deleted successfully.'
    })
  },
  productApi: {
    getProducts: vi.fn().mockResolvedValue({
      success: true,
      products: [
        { id: 1, productCode: 'EL-SW-001', productName: 'Switch 6A', currentQuantity: 50, unit: 'Pieces' }
      ]
    })
  },
  masterDataApi: {
    getDepartments: vi.fn().mockResolvedValue({
      success: true,
      departments: [
        { id: 1, name: 'Electrical Engineering', code: 'EE' },
        { id: 2, name: 'Power Systems', code: 'PS' }
      ]
    })
  },
  facultyApi: {
    getFaculty: vi.fn().mockResolvedValue({
      success: true,
      faculty: [
        { id: 2, name: 'Dr. Ramesh Kumar', designation: 'Professor' },
        { id: 3, name: 'Prof. Suresh', designation: 'Assistant Professor' }
      ]
    })
  },
  analyticsApi: {
    getDashboardStats: vi.fn().mockResolvedValue({
      success: true,
      stats: {
        totalProducts: 10,
        totalCategories: 4,
        totalCurrentStock: 500,
        lowStockCount: 1,
        totalPurchases: 15,
        totalTransfers: 8,
        totalManualIndents: 12
      },
      lowStockItems: [],
      recentIndents: []
    })
  },
  notificationApi: {
    getNotifications: vi.fn().mockResolvedValue({ success: true, notifications: [], unreadCount: 0 })
  }
}));

const mockAdminUser = { id: 1, name: 'Admin', role: 'ADMIN' };
const mockFacultyUser = { id: 2, name: 'Dr. Ramesh Kumar', role: 'FACULTY', department: 'Electrical Engineering' };

const renderComponent = (ui, { user = mockAdminUser, system = 'electrical', initialRoute = '/' } = {}) => {
  localStorage.setItem('stock_auth_user', JSON.stringify(user));
  localStorage.setItem('stock_auth_token', 'mock-token');
  localStorage.setItem('stock_active_system', system);

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <SystemProvider>
          <StockProvider>
            <NotificationProvider>
              {ui}
            </NotificationProvider>
          </StockProvider>
        </SystemProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Electrical Stock Indent Register & Workflow Separation Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Electrical Admin Sidebar: Shows Indent Register and DOES NOT show Manage Indents', () => {
    renderComponent(<Sidebar />, { user: mockAdminUser, system: 'electrical' });

    expect(screen.getByText(/Electrical Stock/i)).toBeInTheDocument();
    expect(screen.getByText('Indent Register')).toBeInTheDocument();
    expect(screen.queryByText('Manage Indents')).not.toBeInTheDocument();
  });

  it('2. Hardware Admin Sidebar: Shows Manage Indents online requisition navigation', () => {
    renderComponent(<Sidebar />, { user: mockAdminUser, system: 'hardware' });

    expect(screen.getByText(/Hardware Stock/i)).toBeInTheDocument();
    expect(screen.getByText('Manage Indents')).toBeInTheDocument();
  });

  it('3. Electrical Faculty Sidebar: DOES NOT show Create Indent or My Indent Requests online workflow', () => {
    renderComponent(<Sidebar />, { user: mockFacultyUser, system: 'electrical' });

    expect(screen.queryByText('Create Indent')).not.toBeInTheDocument();
    expect(screen.queryByText('My Indent Requests')).not.toBeInTheDocument();
    expect(screen.queryByText('Product Catalog')).not.toBeInTheDocument();
  });

  it('4. Hardware Faculty Sidebar: Shows Product Catalog and My Indent Requests', () => {
    renderComponent(<Sidebar />, { user: mockFacultyUser, system: 'hardware' });

    expect(screen.getByText('Product Catalog')).toBeInTheDocument();
    expect(screen.getByText('My Indent Requests')).toBeInTheDocument();
  });

  it('5. Electrical Indent Register Page: Displays correct titles and manual entry interface', async () => {
    renderComponent(<ElectricalIndentRegister />, { user: mockAdminUser, system: 'electrical' });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /ELECTRICAL STOCK – INDENT REGISTER/i })).toBeInTheDocument();
      expect(screen.getByText('Record manually received material requests')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Indent Entry/i })).toBeInTheDocument();
      expect(screen.getByText('IND-EL-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('Lab 3 Wiring Maintenance')).toBeInTheDocument();
    });

    // Verify online approval buttons do NOT exist
    expect(screen.queryByText('Accept')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Issue / Transfer')).not.toBeInTheDocument();
  });

  it('6. Electrical Indent Register: Opens Add Indent Entry modal and creates manual record', async () => {
    renderComponent(<ElectricalIndentRegister />, { user: mockAdminUser, system: 'electrical' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Indent Entry/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Indent Entry/i }));

    await waitFor(() => {
      expect(screen.getByText('Record New Indent Entry')).toBeInTheDocument();
    });

    // Fill form fields
    const deptSelect = screen.getByLabelText(/Department \*/i);
    fireEvent.change(deptSelect, { target: { value: '1' } });

    const facSelect = screen.getByLabelText(/Requested By/i);
    fireEvent.change(facSelect, { target: { value: '2' } });

    const prodSelect = screen.getByLabelText(/Electrical Product \*/i);
    fireEvent.change(prodSelect, { target: { value: '1' } });

    const purposeInput = screen.getByLabelText(/Purpose \/ Requirement \*/i);
    fireEvent.change(purposeInput, { target: { value: 'Panel board test' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Record Indent/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(indentApi.createIndent).toHaveBeenCalled();
    });
  });

  it('7. Electrical Indent Register: Opens Edit modal and updates record', async () => {
    renderComponent(<ElectricalIndentRegister />, { user: mockAdminUser, system: 'electrical' });

    await waitFor(() => {
      expect(screen.getByText('IND-EL-2026-0001')).toBeInTheDocument();
    });

    const editBtn = screen.getByTitle('Edit Indent Record');
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(screen.getByText(/Edit Indent Record: IND-EL-2026-0001/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(indentApi.updateIndent).toHaveBeenCalled();
    });
  });

  it('8. Electrical Indent Register: Opens Delete confirmation and deletes record', async () => {
    renderComponent(<ElectricalIndentRegister />, { user: mockAdminUser, system: 'electrical' });

    await waitFor(() => {
      expect(screen.getByText('IND-EL-2026-0001')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Delete Indent Record');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText(/Delete Indent Record IND-EL-2026-0001\?/i)).toBeInTheDocument();
    });

    const confirmDeleteBtn = screen.getByRole('button', { name: /Confirm Delete/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(indentApi.deleteIndent).toHaveBeenCalledWith(101);
    });
  });

  it('9. Electrical Dashboard: Shows Manual Indents metric and does NOT show Pending Indents', async () => {
    renderComponent(<Dashboard />, { user: mockAdminUser, system: 'electrical', initialRoute: '/electrical/dashboard' });

    await waitFor(() => {
      expect(screen.getByText('Manual Indents')).toBeInTheDocument();
      expect(screen.queryByText('Pending Indents')).not.toBeInTheDocument();
      expect(screen.getByText('Recent Manual Indents Recorded')).toBeInTheDocument();
    });
  });
});
