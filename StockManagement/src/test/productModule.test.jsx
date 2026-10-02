import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthProvider } from '../context/AuthContext';
import { StockProvider } from '../context/StockContext';
import { NotificationProvider } from '../context/NotificationContext';
import ProductDetails from '../pages/ProductDetails';
import Products from '../pages/Products';
import { productApi, masterDataApi, historyApi } from '../services/api';

vi.mock('../services/api', () => ({
  authApi: {
    getMe: vi.fn().mockResolvedValue({
      success: true,
      user: { name: 'Store Admin', role: 'ADMIN', department: 'Central Consumable Store' }
    })
  },
  productApi: {
    getProducts: vi.fn().mockResolvedValue({
      success: true,
      products: [
        {
          _id: '6aa35535f08ecc3e24ecffc2',
          productCode: 'EL-FAN-001',
          productName: 'Ceiling Fan 1200mm',
          category: 'Appliances',
          unit: 'Pieces',
          currentQuantity: 82,
          minimumQuantity: 10,
          minimumStockLevel: 10,
          stockRegister: 'SR3',
          pageNumber: 12,
          active: true,
          status: 'ACTIVE',
          registerRefs: [{ sheet: 'SR3', page: 12, note: 'Appliance ledger' }]
        }
      ],
      total: 1
    }),
    getProductDetails: vi.fn().mockResolvedValue({
      success: true,
      product: {
        _id: '6aa35535f08ecc3e24ecffc2',
        productCode: 'EL-FAN-001',
        productName: 'Ceiling Fan 1200mm',
        name: 'Ceiling Fan 1200mm',
        category: 'Appliances',
        unit: 'Pieces',
        currentQuantity: 82,
        minimumQuantity: 10,
        minimumStockLevel: 10,
        description: 'Standard heavy-duty ceiling fan 1200mm blade sweep',
        stockRegister: 'SR3',
        pageNumber: 12,
        active: true,
        status: 'ACTIVE',
        createdAt: '2026-09-10T10:00:00.000Z',
        updatedAt: '2026-09-11T12:00:00.000Z',
        registerRefs: [
          { sheet: 'SR1', page: 12, note: 'Main register' },
          { sheet: 'SR3', page: 42, note: 'Appliance ledger' }
        ],
        remarks: [
          { id: 'rem-1', author: 'Store Keeper', date: '2026-09-10', text: 'Checked physical stock balance' }
        ]
      },
      references: [
        { sheet: 'SR1', page: 12, referenceNote: 'Main register' },
        { sheet: 'SR3', page: 42, referenceNote: 'Appliance ledger' }
      ],
      history: [
        {
          _id: 'txn-1',
          transactionId: 'TXN-001',
          type: 'PURCHASE',
          quantity: 82,
          department: 'Store',
          recordedBy: 'Store Admin',
          date: '2026-09-10',
          remarks: 'Opening inventory'
        }
      ],
      remarks: []
    }),
    getProductById: vi.fn(),
    createProduct: vi.fn().mockResolvedValue({
      success: true,
      product: {
        _id: 'p-new',
        productCode: 'CON-0008',
        productName: 'Modular Socket 16A',
        currentQuantity: 20
      }
    }),
    updateProduct: vi.fn().mockResolvedValue({
      success: true,
      product: {
        _id: '6aa35535f08ecc3e24ecffc2',
        productCode: 'EL-FAN-001',
        productName: 'Ceiling Fan 1200mm Deluxe',
        currentQuantity: 85
      }
    }),
    deleteProduct: vi.fn().mockResolvedValue({
      success: true,
      message: 'This product cannot be deleted because it is referenced by existing stock or transaction records. It has been deactivated instead to preserve historical records.',
      deactivated: true,
      deleted: false
    })
  },
  masterDataApi: {
    getCategories: vi.fn().mockResolvedValue({
      success: true,
      categories: [{ name: 'Appliances' }, { name: 'Wiring' }]
    }),
    getUnits: vi.fn().mockResolvedValue({
      success: true,
      units: [{ name: 'Pieces' }, { name: 'Meters' }]
    }),
    getStockDocuments: vi.fn().mockResolvedValue({
      success: true,
      documents: [{ name: 'SR1' }, { name: 'SR2' }, { name: 'SR3' }]
    })
  },
  historyApi: {
    getStockHistory: vi.fn().mockResolvedValue({ success: true, transactions: [] })
  },
  notificationApi: {
    getNotifications: vi.fn().mockResolvedValue({ success: true, unreadCount: 0, notifications: [] }),
    markAsRead: vi.fn()
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

describe('Product Module End-to-End Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_user', JSON.stringify({
      id: 'u1',
      name: 'Store Admin',
      role: 'ADMIN',
      department: 'Central Consumable Store'
    }));
    localStorage.setItem('auth_token', 'mock-token');
  });

  it('1. Renders Product Details page without REGISTER_OPTIONS error', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/products/:id" element={<ProductDetails />} />
      </Routes>,
      { route: '/products/6aa35535f08ecc3e24ecffc2' }
    );

    // Wait for product details to load
    await waitFor(() => {
      expect(screen.getAllByText('Ceiling Fan 1200mm').length).toBeGreaterThan(0);
    });

    // Verify Product code and status
    expect(screen.getAllByText('EL-FAN-001').length).toBeGreaterThan(0);
    expect(screen.getByText('82 Pieces')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();

    // Verify multiple Stock Register references are rendered
    expect(screen.getByText('SR1')).toBeInTheDocument();
    expect(screen.getByText('Page 12')).toBeInTheDocument();
    expect(screen.getByText('SR3')).toBeInTheDocument();
    expect(screen.getByText('Page 42')).toBeInTheDocument();

    // Verify "Back to Products" link is present
    expect(screen.getByText('← Back to Products')).toBeInTheDocument();
  });

  it('2. Opens Edit Product modal with read-only code and dynamic master data', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/products/:id" element={<ProductDetails />} />
      </Routes>,
      { route: '/products/6aa35535f08ecc3e24ecffc2' }
    );

    await waitFor(() => {
      expect(screen.getAllByText('Ceiling Fan 1200mm').length).toBeGreaterThan(0);
    });

    // Click Edit Product button
    const editBtn = screen.getByText('✏ Edit Product');
    fireEvent.click(editBtn);

    // Verify Edit Product modal opened
    await waitFor(() => {
      expect(screen.getByText(/Edit Product: Ceiling Fan 1200mm/i)).toBeInTheDocument();
    });

    // Verify Product Code input is disabled (system-generated)
    const codeInput = screen.getByLabelText(/Product Code/i);
    expect(codeInput).toBeDisabled();
    expect(codeInput.value).toBe('EL-FAN-001');

    // Verify master data options are fetched
    expect(masterDataApi.getCategories).toHaveBeenCalled();
    expect(masterDataApi.getUnits).toHaveBeenCalled();
    expect(masterDataApi.getStockDocuments).toHaveBeenCalled();
  });

  it('3. Handles safe deletion confirmation dialog with deactivation warning', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/products/:id" element={<ProductDetails />} />
      </Routes>,
      { route: '/products/6aa35535f08ecc3e24ecffc2' }
    );

    await waitFor(() => {
      expect(screen.getAllByText('Ceiling Fan 1200mm').length).toBeGreaterThan(0);
    });

    // Click Delete button
    const deleteBtn = screen.getByText('🗑 Delete');
    fireEvent.click(deleteBtn);

    // Verify Delete confirmation modal opened
    expect(screen.getByText('Confirm Product Deletion')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this product?')).toBeInTheDocument();

    // Click Confirm Delete inside modal
    const confirmBtn = screen.getByText('Delete Product');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(productApi.deleteProduct).toHaveBeenCalledWith('6aa35535f08ecc3e24ecffc2');
    });
  });

  it('4. Handles invalid product ID gracefully with Not Found message', async () => {
    productApi.getProductDetails.mockRejectedValueOnce(new Error('Product not found'));
    productApi.getProductById.mockResolvedValueOnce({ success: false });

    renderWithProviders(
      <Routes>
        <Route path="/products/:id" element={<ProductDetails />} />
      </Routes>,
      { route: '/products/invalid-id-999' }
    );

    await waitFor(() => {
      expect(screen.getByText('Product Not Found')).toBeInTheDocument();
    });
    expect(screen.getByText('← Back to Products')).toBeInTheDocument();
  });
});
