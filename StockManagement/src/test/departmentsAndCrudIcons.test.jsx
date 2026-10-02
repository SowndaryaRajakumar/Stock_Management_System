import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthProvider } from '../context/AuthContext';
import { StockProvider } from '../context/StockContext';
import { NotificationProvider } from '../context/NotificationContext';
import ProductTable from '../components/products/ProductTable';
import Departments from '../pages/Departments';
import Categories from '../pages/Categories';
import Units from '../pages/Units';
import StockRegisters from '../pages/StockRegisters';
import Faculty from '../pages/Faculty';
import AppRoutes from '../routes/AppRoutes';
import { masterDataApi, facultyApi } from '../services/api';

vi.mock('../services/api', () => ({
  authApi: {
    getMe: vi.fn().mockResolvedValue({
      success: true,
      user: { name: 'Store Admin', role: 'ADMIN', department: 'Central Consumable Store' }
    })
  },
  masterDataApi: {
    getDepartments: vi.fn().mockResolvedValue({
      success: true,
      departments: [
        {
          id: 1,
          code: 'EEE',
          name: 'Electrical & Electronics Engineering',
          description: 'Department of EEE',
          active: true,
          usageCount: 4
        },
        {
          id: 2,
          code: 'CIVIL',
          name: 'Civil Engineering',
          description: 'Department of Civil',
          active: true,
          usageCount: 0
        }
      ],
      total: 2
    }),
    createDepartment: vi.fn().mockResolvedValue({
      success: true,
      department: { id: 3, code: 'MECH', name: 'Mechanical Engineering', active: true }
    }),
    updateDepartment: vi.fn().mockResolvedValue({
      success: true,
      department: { id: 1, code: 'EEE', name: 'Electrical and Electronics Engg', active: true }
    }),
    deleteDepartment: vi.fn().mockResolvedValue({
      success: true,
      message: 'Department deleted successfully.'
    }),
    getCategories: vi.fn().mockResolvedValue({
      success: true,
      categories: [
        { _id: 'cat-1', id: 'cat-1', name: 'Wiring Accessories', description: 'Cables & wires', active: true, usageCount: 2 }
      ],
      total: 1
    }),
    getUnits: vi.fn().mockResolvedValue({
      success: true,
      units: [
        { _id: 'u-1', id: 'u-1', name: 'Meters', symbol: 'm', active: true, usageCount: 5 }
      ],
      total: 1
    }),
    getStockDocuments: vi.fn().mockResolvedValue({
      success: true,
      documents: [
        { _id: 'doc-1', id: 'doc-1', name: 'SR1', description: 'Main Register', active: true, usageCount: 10 }
      ],
      total: 1
    })
  },
  facultyApi: {
    getFaculty: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          employee_code: 'FAC-001',
          name: 'Dr. John Doe',
          username: 'johndoe',
          email: 'johndoe@institution.edu',
          department_code: 'EEE',
          designation: 'Associate Professor',
          status: 'ACTIVE'
        }
      ]
    })
  },
  productApi: {
    getProducts: vi.fn().mockResolvedValue({ success: true, products: [], total: 0 }),
    getProductDetails: vi.fn().mockResolvedValue({ success: true, product: {} })
  },
  notificationApi: {
    getNotifications: vi.fn().mockResolvedValue({ success: true, notifications: [], unreadCount: 0 })
  },
  analyticsApi: {
    getDashboardStats: vi.fn().mockResolvedValue({ success: true, stats: {} }),
    getAnalyticsOverview: vi.fn().mockResolvedValue({ success: true, data: {} })
  },
  historyApi: {
    getStockHistory: vi.fn().mockResolvedValue({ success: true, history: [] })
  },
  purchaseApi: {
    getPurchases: vi.fn().mockResolvedValue({ success: true, purchases: [] })
  },
  transferApi: {
    getTransfers: vi.fn().mockResolvedValue({ success: true, transfers: [] })
  },
  indentApi: {
    getIndents: vi.fn().mockResolvedValue({ success: true, indents: [] })
  },
  reportApi: {
    getReportData: vi.fn().mockResolvedValue({ success: true, reports: [] })
  }
}));

const renderWithProviders = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <StockProvider>
          <NotificationProvider>
            {ui}
          </NotificationProvider>
        </StockProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('CRUD Actions & Department Master Data Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_user', JSON.stringify({
      id: 'admin-1',
      name: 'Store Admin',
      role: 'ADMIN',
      department: 'Central Store'
    }));
    localStorage.setItem('auth_token', 'mock-token');
  });

  describe('CHANGE 1: CRUD Actions Icon Design & View Removal', () => {
    it('ProductTable: renders only Edit and Delete icons with tooltips/aria-labels and no View button', () => {
      const mockProducts = [
        {
          _id: 'p1',
          productCode: 'EL-001',
          name: 'Ceiling Fan',
          category: 'Appliances',
          currentQuantity: 50,
          minimumStockLevel: 10,
          unit: 'Pieces',
          stockRegister: 'SR1',
          pageNumber: 5
        }
      ];
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      renderWithProviders(
        <ProductTable products={mockProducts} onEdit={onEdit} onDelete={onDelete} />
      );

      // Verify View button does NOT exist
      expect(screen.queryByRole('link', { name: /^view$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^view$/i })).not.toBeInTheDocument();

      // Verify Edit icon button exists with proper title & aria-label
      const editBtn = screen.getByTitle('Edit Product');
      expect(editBtn).toBeInTheDocument();
      expect(editBtn).toHaveAttribute('aria-label', 'Edit Product');
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledWith(mockProducts[0]);

      // Verify Delete icon button exists with proper title & aria-label
      const deleteBtn = screen.getByTitle('Delete Product');
      expect(deleteBtn).toBeInTheDocument();
      expect(deleteBtn).toHaveAttribute('aria-label', 'Delete Product');
      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledWith(mockProducts[0]);
    });

    it('Categories page: renders only Edit and Delete icons with tooltips and no View button', async () => {
      renderWithProviders(<Categories />);

      await waitFor(() => {
        expect(screen.getByText('Wiring Accessories')).toBeInTheDocument();
      });

      // View button must not exist
      expect(screen.queryByTitle(/view category/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^view$/i })).not.toBeInTheDocument();

      // Edit and Delete icons exist
      expect(screen.getByTitle('Edit Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit Category')).toBeInTheDocument();
      expect(screen.getByTitle('Delete Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Category')).toBeInTheDocument();
    });

    it('Units page: renders only Edit and Delete icons and no View button', async () => {
      renderWithProviders(<Units />);

      await waitFor(() => {
        expect(screen.getByText('Meters')).toBeInTheDocument();
      });

      expect(screen.queryByTitle(/view unit/i)).not.toBeInTheDocument();
      expect(screen.getByTitle('Edit Unit')).toBeInTheDocument();
      expect(screen.getByTitle('Delete Unit')).toBeInTheDocument();
    });

    it('Stock Registers page: renders only Edit and Delete icons and no View button', async () => {
      renderWithProviders(<StockRegisters />);

      await waitFor(() => {
        expect(screen.getByText('SR1')).toBeInTheDocument();
      });

      expect(screen.queryByTitle(/view stock register/i)).not.toBeInTheDocument();
      expect(screen.getByTitle('Edit Stock Register')).toBeInTheDocument();
      expect(screen.getByTitle('Delete Stock Register')).toBeInTheDocument();
    });

    it('Faculty page: renders only Edit and Delete icons and no View button', async () => {
      renderWithProviders(<Faculty />);

      await waitFor(() => {
        expect(screen.getByText('Dr. John Doe')).toBeInTheDocument();
      });

      expect(screen.queryByTitle(/view faculty profile/i)).not.toBeInTheDocument();
      expect(screen.getByTitle('Edit Faculty')).toBeInTheDocument();
      expect(screen.getByTitle('Delete Faculty')).toBeInTheDocument();
    });
  });

  describe('CHANGE 2: Department Master Data CRUD', () => {
    it('Renders Department list with Code, Name, Status, and Action icons', async () => {
      renderWithProviders(<Departments />);

      await waitFor(() => {
        expect(screen.getByText('Electrical & Electronics Engineering')).toBeInTheDocument();
      });

      expect(screen.getByText('EEE')).toBeInTheDocument();
      expect(screen.getByText('Civil Engineering')).toBeInTheDocument();
      expect(screen.getByText('CIVIL')).toBeInTheDocument();

      // Only Edit and Delete icons
      expect(screen.queryByText(/^View$/i)).not.toBeInTheDocument();
      const editButtons = screen.getAllByTitle('Edit Department');
      const deleteButtons = screen.getAllByTitle('Delete Department');
      expect(editButtons.length).toBe(2);
      expect(deleteButtons.length).toBe(2);
    });

    it('Add Department modal opens and creates a new department', async () => {
      renderWithProviders(<Departments />);

      await waitFor(() => {
        expect(screen.getByText('EEE')).toBeInTheDocument();
      });

      // Click Add Department
      const addBtn = screen.getByRole('button', { name: /add department/i });
      fireEvent.click(addBtn);

      // Verify Add Modal opened
      expect(screen.getByRole('heading', { name: 'Add Department' })).toBeInTheDocument();

      // Fill in form
      fireEvent.change(screen.getByLabelText(/Department Code/i), { target: { value: 'MECH' } });
      fireEvent.change(screen.getByLabelText(/Department Name/i), { target: { value: 'Mechanical Engineering' } });

      // Submit
      const submitBtn = screen.getByRole('button', { name: 'Create Department' });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(masterDataApi.createDepartment).toHaveBeenCalledWith({
          code: 'MECH',
          name: 'Mechanical Engineering',
          description: '',
          active: true
        });
      });
    });

    it('Edit Department modal opens in Faculty style and updates fields', async () => {
      renderWithProviders(<Departments />);

      await waitFor(() => {
        expect(screen.getByText('Electrical & Electronics Engineering')).toBeInTheDocument();
      });

      // Click Edit on EEE
      const editButtons = screen.getAllByTitle('Edit Department');
      fireEvent.click(editButtons[0]);

      // Verify Edit Modal opened
      expect(screen.getByRole('heading', { name: 'Edit Department' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('EEE')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Electrical & Electronics Engineering')).toBeInTheDocument();

      // Modify name
      fireEvent.change(screen.getByLabelText(/Department Name/i), {
        target: { value: 'Electrical and Electronics Engg' }
      });

      // Submit
      const saveBtn = screen.getByRole('button', { name: 'Save Changes' });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(masterDataApi.updateDepartment).toHaveBeenCalledWith(1, {
          code: 'EEE',
          name: 'Electrical and Electronics Engg',
          description: 'Department of EEE',
          active: true
        });
      });
    });

    it('Delete Department handles referenced record by offering deactivation', async () => {
      renderWithProviders(<Departments />);

      await waitFor(() => {
        expect(screen.getByText('Electrical & Electronics Engineering')).toBeInTheDocument();
      });

      // EEE has usageCount: 4 -> clicking delete should trigger safe deactivation prompt
      const deleteButtons = screen.getAllByTitle('Delete Department');
      fireEvent.click(deleteButtons[0]);

      // Safe confirmation modal
      expect(screen.getByText('Delete Department')).toBeInTheDocument();
      expect(screen.getByText(/referenced by 4 records/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Deactivate Department' })).toBeInTheDocument();

      // Click Deactivate
      fireEvent.click(screen.getByRole('button', { name: 'Deactivate Department' }));

      await waitFor(() => {
        expect(masterDataApi.deleteDepartment).toHaveBeenCalledWith(1, { deactivate: 'true' });
      });
    });

    it('Delete Department on unreferenced record confirms permanent deletion', async () => {
      renderWithProviders(<Departments />);

      await waitFor(() => {
        expect(screen.getByText('Civil Engineering')).toBeInTheDocument();
      });

      // CIVIL has usageCount: 0 -> clicking delete should offer permanent delete
      const deleteButtons = screen.getAllByTitle('Delete Department');
      fireEvent.click(deleteButtons[1]);

      expect(screen.getByText(/permanently delete department "Civil Engineering"/i)).toBeInTheDocument();
      const modalConfirmBtn = document.querySelector('.modal-footer .btn-danger');
      expect(modalConfirmBtn).toBeInTheDocument();
      expect(modalConfirmBtn.textContent).toContain('Delete Department');

      fireEvent.click(modalConfirmBtn);

      await waitFor(() => {
        expect(masterDataApi.deleteDepartment).toHaveBeenCalledWith(2);
      });
    });

    it('Role Protection: Faculty users cannot access /departments', async () => {
      // Simulate Faculty login
      localStorage.setItem('auth_user', JSON.stringify({
        id: 'faculty-1',
        name: 'Prof. Faculty User',
        role: 'FACULTY',
        department: 'EEE'
      }));

      renderWithProviders(<AppRoutes />, { route: '/departments' });

      // Faculty should be redirected to faculty catalog, not show Departments page
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Departments' })).not.toBeInTheDocument();
      });
    });
  });
});
