import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StockHistory from '../pages/StockHistory';
import { historyApi, masterDataApi } from '../services/api';
import { AuthProvider } from '../context/AuthContext';
import { StockProvider } from '../context/StockContext';
import { NotificationProvider } from '../context/NotificationContext';
import { SystemProvider } from '../context/SystemContext';

vi.mock('../services/api', () => ({
  historyApi: {
    getStockHistory: vi.fn()
  },
  masterDataApi: {
    getDepartments: vi.fn(),
    getStockDocuments: vi.fn()
  },
  notificationApi: {
    getNotifications: vi.fn().mockResolvedValue({ success: true, notifications: [] }),
    markRead: vi.fn()
  }
}));

const mockTransactions = [
  {
    id: 1,
    transactionCode: 'TXN-HW-001',
    type: 'PURCHASE',
    transactionType: 'PURCHASE',
    productName: 'Dell OptiPlex 7090 Desktop',
    productCode: 'HW-PC-001',
    quantity: 15,
    department: 'Central Store',
    stockRegister: 'HW-SR1',
    date: '2026-09-10',
    transactionDate: '2026-09-10',
    recorderName: 'Admin User'
  },
  {
    id: 2,
    transactionCode: 'TXN-HW-002',
    type: 'TRANSFER',
    transactionType: 'TRANSFER',
    productName: 'HP LaserJet Pro M404dn',
    productCode: 'HW-PRN-002',
    quantity: 3,
    department: 'Computer Science and Engineering',
    stockRegister: 'HW-SR2',
    date: '2026-09-15',
    transactionDate: '2026-09-15',
    recorderName: 'Admin User'
  }
];

const renderComponent = () => {
  localStorage.setItem('auth_token', 'mock-admin-token');
  localStorage.setItem(
    'auth_user',
    JSON.stringify({
      id: 1,
      name: 'System Admin',
      email: 'admin@college.edu',
      role: 'ADMIN'
    })
  );

  return render(
    <MemoryRouter initialEntries={['/history']}>
      <AuthProvider>
        <SystemProvider>
          <StockProvider>
            <NotificationProvider>
              <StockHistory />
            </NotificationProvider>
          </StockProvider>
        </SystemProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Hardware Fully Reactive Stock History Filter Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    masterDataApi.getDepartments.mockResolvedValue({
      success: true,
      departments: [
        { id: 1, name: 'Central Store', code: 'CS' },
        { id: 2, name: 'Computer Science and Engineering', code: 'CSE' }
      ]
    });

    masterDataApi.getStockDocuments.mockResolvedValue({
      success: true,
      documents: [
        { id: 1, document_code: 'HW-SR1', document_name: 'Hardware Register 1' },
        { id: 2, document_code: 'HW-SR2', document_name: 'Hardware Register 2' }
      ]
    });

    historyApi.getStockHistory.mockResolvedValue({
      success: true,
      history: mockTransactions,
      total: 2,
      totalPurchases: 1,
      totalTransfers: 1
    });
  });

  it('1. Loads initial hardware stock history and verifies Apply Filters button is completely absent', async () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: 'Stock History' })).toBeInTheDocument();

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 })
      );
    });

    // There should be NO Apply Filters button anywhere
    expect(screen.queryByRole('button', { name: /apply filters/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/apply filters/i)).not.toBeInTheDocument();

    // Verify Clear Filters button is present
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('2. Selecting Transaction Type immediately triggers reactive fetch on hardware', async () => {
    renderComponent();

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledTimes(1);
    });

    const typeSelect = document.getElementById('filter-type');
    fireEvent.change(typeSelect, { target: { value: 'PURCHASE' } });

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PURCHASE',
          page: 1
        })
      );
    });
  });

  it('3. Selecting Department immediately triggers reactive fetch on hardware', async () => {
    renderComponent();

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledTimes(1);
    });

    const deptSelect = document.getElementById('filter-department');
    fireEvent.change(deptSelect, { target: { value: 'Computer Science and Engineering' } });

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          department: 'Computer Science and Engineering',
          page: 1
        })
      );
    });
  });

  it('4. Selecting Stock Register HW-SR1 immediately triggers reactive fetch', async () => {
    renderComponent();

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledTimes(1);
    });

    const regSelect = document.getElementById('filter-register');
    fireEvent.change(regSelect, { target: { value: 'HW-SR1' } });

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          stockRegister: 'HW-SR1',
          page: 1
        })
      );
    });
  });

  it('5 & 6. Selecting From and To dates immediately triggers reactive fetch on hardware', async () => {
    renderComponent();

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledTimes(1);
    });

    const fromDateInput = document.getElementById('filter-from-date');
    const toDateInput = document.getElementById('filter-to-date');

    fireEvent.change(fromDateInput, { target: { value: '2026-09-01' } });

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2026-09-01',
          page: 1
        })
      );
    });

    fireEvent.change(toDateInput, { target: { value: '2026-09-23' } });

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2026-09-01',
          endDate: '2026-09-23',
          page: 1
        })
      );
    });
  });

  it('7. Typing in Search automatically filters after short debounce on hardware', async () => {
    vi.useFakeTimers();
    renderComponent();

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    const searchInput = document.getElementById('filter-search');
    fireEvent.change(searchInput, { target: { value: 'Dell' } });

    // Should NOT have called immediately
    expect(historyApi.getStockHistory).not.toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Dell' })
    );

    // Fast-forward past 300ms debounce
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(historyApi.getStockHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'Dell',
        page: 1
      })
    );

    vi.useRealTimers();
  });

  it('8. Multiple cumulative filters work together simultaneously on hardware', async () => {
    renderComponent();

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(document.getElementById('filter-type'), { target: { value: 'PURCHASE' } });
    fireEvent.change(document.getElementById('filter-department'), { target: { value: 'Central Store' } });
    fireEvent.change(document.getElementById('filter-register'), { target: { value: 'HW-SR1' } });
    fireEvent.change(document.getElementById('filter-from-date'), { target: { value: '2026-09-01' } });
    fireEvent.change(document.getElementById('filter-to-date'), { target: { value: '2026-09-23' } });

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PURCHASE',
          department: 'Central Store',
          stockRegister: 'HW-SR1',
          startDate: '2026-09-01',
          endDate: '2026-09-23',
          page: 1
        })
      );
    });
  });

  it('9. Clicking Clear Filters resets all controls and refetches complete unfiltered history on hardware', async () => {
    renderComponent();

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(document.getElementById('filter-type'), { target: { value: 'PURCHASE' } });
    await waitFor(() => {
      expect(document.getElementById('filter-type').value).toBe('PURCHASE');
    });

    const clearBtn = document.getElementById('clear-filters-btn');
    expect(clearBtn).not.toBeDisabled();

    fireEvent.click(clearBtn);

    expect(document.getElementById('filter-type').value).toBe('');
    expect(document.getElementById('filter-search').value).toBe('');
    expect(document.getElementById('filter-department').value).toBe('');
    expect(document.getElementById('filter-register').value).toBe('');
    expect(document.getElementById('filter-from-date').value).toBe('');
    expect(document.getElementById('filter-to-date').value).toBe('');

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 })
      );
    });
  });
});
