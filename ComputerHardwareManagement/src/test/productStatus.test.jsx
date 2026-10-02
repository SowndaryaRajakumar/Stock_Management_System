import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthProvider } from '../context/AuthContext';
import { SystemProvider } from '../context/SystemContext';
import { StockProvider } from '../context/StockContext';
import { NotificationProvider } from '../context/NotificationContext';
import Products from '../pages/Products';
import ProductTable from '../components/products/ProductTable';
import EditProductModal from '../components/products/EditProductModal';
import StatusBadge from '../components/common/StatusBadge';
import { productApi, masterDataApi } from '../services/api';

vi.mock('../services/api', () => ({
  authApi: {
    getMe: vi.fn().mockResolvedValue({
      success: true,
      user: { name: 'Admin', role: 'ADMIN', department: 'Central Store' }
    })
  },
  productApi: {
    getProducts: vi.fn(),
    getProductDetails: vi.fn(),
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn()
  },
  notificationApi: {
    getNotifications: vi.fn().mockResolvedValue({ success: true, unreadCount: 0, notifications: [] }),
    markAsRead: vi.fn()
  },
  masterDataApi: {
    getCategories: vi.fn().mockResolvedValue({
      success: true,
      categories: [{ name: 'Computer Accessories' }, { name: 'Networking' }]
    }),
    getUnits: vi.fn().mockResolvedValue({
      success: true,
      units: [{ name: 'Pieces' }, { name: 'Boxes' }]
    }),
    getStockDocuments: vi.fn().mockResolvedValue({
      success: true,
      documents: [{ name: 'SR1' }, { name: 'SR2' }]
    })
  }
}));

const mockProducts = [
  {
    _id: 'prod-1',
    id: 1,
    productCode: 'HW-0001',
    productName: 'Computer Workstation',
    name: 'Computer Workstation',
    category: 'Computer Accessories',
    unit: 'Pieces',
    currentQuantity: 13,
    minimumStockLevel: 5,
    minimumQuantity: 5,
    stockRegister: 'SR1',
    pageNumber: 10,
    active: true,
    status: 'ACTIVE'
  },
  {
    _id: 'prod-2',
    id: 2,
    productCode: 'HW-0002',
    productName: 'Old Mechanical Keyboard',
    name: 'Old Mechanical Keyboard',
    category: 'Computer Accessories',
    unit: 'Pieces',
    currentQuantity: 25,
    minimumStockLevel: 5,
    minimumQuantity: 5,
    stockRegister: 'SR1',
    pageNumber: 15,
    active: false,
    status: 'INACTIVE'
  }
];

const renderWithProviders = (ui, { route = '/products' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <SystemProvider>
          <NotificationProvider>
            <StockProvider>
              {ui}
            </StockProvider>
          </NotificationProvider>
        </SystemProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Hardware Product Status CRUD & Filtering Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_user', JSON.stringify({
      id: 'admin-1',
      name: 'Hardware Admin',
      role: 'ADMIN',
      department: 'Store'
    }));
    localStorage.setItem('auth_token', 'mock-token');

    productApi.getProducts.mockResolvedValue({
      success: true,
      products: mockProducts,
      total: 2,
      count: 2
    });
  });

  it('1. StatusBadge renders Active in badge-green and Inactive in badge-grey', () => {
    const { container, rerender } = render(<StatusBadge status="Active" />);
    const activeBadge = container.querySelector('.badge');
    expect(activeBadge).toHaveClass('badge-green');
    expect(activeBadge.textContent).toBe('Active');

    rerender(<StatusBadge status="Inactive" />);
    const inactiveBadge = container.querySelector('.badge');
    expect(inactiveBadge).toHaveClass('badge-grey');
    expect(inactiveBadge.textContent).toBe('Inactive');
  });

  it('2. ProductTable accurately displays Active and Inactive based on actual product status, not stock quantity', () => {
    renderWithProviders(<ProductTable products={mockProducts} />);

    // Both products have currentQuantity > 0 (13 and 25)
    // Product 1 must show 'Active', Product 2 must show 'Inactive'
    const badges = screen.getAllByText(/Active|Inactive/);
    expect(badges.length).toBe(2);
    expect(badges[0].textContent).toBe('Active');
    expect(badges[1].textContent).toBe('Inactive');
  });

  it('3. Status filter dropdown changes filter and calls getProducts with correct status params', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/products" element={<Products />} />
      </Routes>
    );

    // Initial load: status is ALL
    await waitFor(() => {
      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ALL', page: 1, limit: 10 })
      );
    });

    // Change status filter to Active Only
    const statusSelect = screen.getByLabelText(/Status Filter/i);
    fireEvent.change(statusSelect, { target: { value: 'ACTIVE' } });

    await waitFor(() => {
      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE', page: 1 })
      );
    });

    // Change status filter to Inactive Only
    fireEvent.change(statusSelect, { target: { value: 'INACTIVE' } });

    await waitFor(() => {
      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'INACTIVE', page: 1 })
      );
    });
  });

  it('4. EditProductModal correctly preselects status based on product record', () => {
    // Open with Active product
    const { rerender } = render(
      <EditProductModal
        isOpen={true}
        onClose={vi.fn()}
        product={mockProducts[0]}
        onProductUpdated={vi.fn()}
      />
    );

    const statusDropdown = screen.getByLabelText(/^Status$/i);
    expect(statusDropdown.value).toBe('ACTIVE');

    // Open with Inactive product
    rerender(
      <EditProductModal
        isOpen={true}
        onClose={vi.fn()}
        product={mockProducts[1]}
        onProductUpdated={vi.fn()}
      />
    );

    expect(statusDropdown.value).toBe('INACTIVE');
  });

  it('5. EditProductModal submits both status and active boolean on save', async () => {
    productApi.updateProduct.mockResolvedValue({
      success: true,
      product: { ...mockProducts[0], active: false, status: 'INACTIVE' }
    });

    const onUpdateMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <EditProductModal
        isOpen={true}
        onClose={onCloseMock}
        product={mockProducts[0]}
        onProductUpdated={onUpdateMock}
      />
    );

    const statusDropdown = screen.getByLabelText(/^Status$/i);
    fireEvent.change(statusDropdown, { target: { value: 'INACTIVE' } });
    expect(statusDropdown.value).toBe('INACTIVE');

    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(productApi.updateProduct).toHaveBeenCalledWith(
        'prod-1',
        expect.objectContaining({
          status: 'INACTIVE',
          active: false
        })
      );
      expect(onUpdateMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('6. Filter combination: Search + Category + Register + Status all combine correctly', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/products" element={<Products />} />
      </Routes>
    );

    await waitFor(() => {
      expect(productApi.getProducts).toHaveBeenCalled();
    });

    // Set Search
    const searchInput = screen.getByPlaceholderText(/Search products by code, name, category/i);
    fireEvent.change(searchInput, { target: { value: 'HW-0001' } });

    // Set Category
    const categorySelect = screen.getByLabelText(/Category Filter/i);
    fireEvent.change(categorySelect, { target: { value: 'Computer Accessories' } });

    // Set Register
    const registerSelect = screen.getByLabelText(/Stock Register Filter/i);
    fireEvent.change(registerSelect, { target: { value: 'SR1' } });

    // Set Status to Active
    const statusSelect = screen.getByLabelText(/Status Filter/i);
    fireEvent.change(statusSelect, { target: { value: 'ACTIVE' } });

    await waitFor(() => {
      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'HW-0001',
          category: 'Computer Accessories',
          register: 'SR1',
          status: 'ACTIVE',
          page: 1
        })
      );
    });
  });

  it('7. End-to-end Edit in Products page: edits Active product to Inactive and refetches data', async () => {
    productApi.updateProduct.mockResolvedValue({
      success: true,
      product: { ...mockProducts[0], active: false, status: 'INACTIVE' }
    });

    renderWithProviders(
      <Routes>
        <Route path="/products" element={<Products />} />
      </Routes>
    );

    await waitFor(() => {
      expect(screen.getByText('Computer Workstation')).toBeInTheDocument();
    });

    // Click Edit button for first product
    const editButtons = screen.getAllByTitle('Edit Product');
    fireEvent.click(editButtons[0]);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText(/Edit Product: Computer Workstation/i)).toBeInTheDocument();
    });

    // Change status to Inactive
    const statusSelect = screen.getByLabelText(/^Status$/i);
    fireEvent.change(statusSelect, { target: { value: 'INACTIVE' } });

    // Click Save Changes
    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(productApi.updateProduct).toHaveBeenCalledWith(
        'prod-1',
        expect.objectContaining({
          status: 'INACTIVE',
          active: false
        })
      );
    });

    // Success feedback is displayed
    await waitFor(() => {
      expect(screen.getByText(/updated successfully/i)).toBeInTheDocument();
    });
  });

  it('8. Safely resets pagination when status filter changes', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/products" element={<Products />} />
      </Routes>
    );

    await waitFor(() => {
      expect(productApi.getProducts).toHaveBeenCalled();
    });

    // Change status filter
    const statusSelect = screen.getByLabelText(/Status Filter/i);
    fireEvent.change(statusSelect, { target: { value: 'INACTIVE' } });

    await waitFor(() => {
      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'INACTIVE',
          page: 1
        })
      );
    });
  });
});
