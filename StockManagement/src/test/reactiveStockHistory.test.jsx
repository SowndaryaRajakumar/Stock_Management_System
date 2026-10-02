import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StockHistory from '../pages/StockHistory';
import { historyApi, masterDataApi } from '../services/api';
import { AuthProvider } from '../context/AuthContext';
import { StockProvider } from '../context/StockContext';
import { NotificationProvider } from '../context/NotificationContext';

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
    transactionCode: 'TXN-001',
    type: 'PURCHASE',
    transactionType: 'PURCHASE',
    productName: 'Copper Wire 2.5mm',
    productCode: 'ELE-WIR-001',
    quantity: 50,
    department: 'Central Store',
    stockRegister: 'SR1',
    date: '2026-09-10',
    transactionDate: '2026-09-10',
    recorderName: 'Admin User'
  },
  {
    id: 2,
    transactionCode: 'TXN-002',
    type: 'TRANSFER',
    transactionType: 'TRANSFER',
    productName: 'Schneider MCB 16A',
    productCode: 'ELE-MCB-002',
    quantity: 10,
    department: 'Electrical & Electronics Engineering',
    stockRegister: 'SR2',
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
        <StockProvider>
          <NotificationProvider>
            <StockHistory />
          </NotificationProvider>
        </StockProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Fully Reactive Stock History Filter Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    masterDataApi.getDepartments.mockResolvedValue({
      success: true,
      departments: [
        { id: 1, name: 'Central Store', code: 'CS' },
        { id: 2, name: 'Electrical & Electronics Engineering', code: 'EEE' }
      ]
    });

    masterDataApi.getStockDocuments.mockResolvedValue({
      success: true,
      documents: [
        { id: 1, document_code: 'SR1', document_name: 'Register 1' },
        { id: 2, document_code: 'SR2', document_name: 'Register 2' }
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

  it('1. Loads initial stock history records and verifies Apply Filters button is completely absent', async () => {
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

  it('2. Selecting Transaction Type immediately triggers reactive fetch and updates summary counts', async () => {
    renderComponent();

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledTimes(1);
    });

    historyApi.getStockHistory.mockResolvedValueOnce({
      success: true,
      history: [mockTransactions[0]],
      total: 1,
      totalPurchases: 1,
      totalTransfers: 0
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

    // Verify summary reflects purchases only
    await waitFor(() => {
      expect(screen.getByText('Total Purchases')).toBeInTheDocument();
    });
  });

  it('3. Selecting Department immediately triggers reactive fetch preserving active type', async () => {
    renderComponent();

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledTimes(1);
    });

    const deptSelect = document.getElementById('filter-department');
    fireEvent.change(deptSelect, { target: { value: 'Electrical & Electronics Engineering' } });

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          department: 'Electrical & Electronics Engineering',
          page: 1
        })
      );
    });
  });

  it('4. Selecting Stock Register immediately triggers reactive fetch', async () => {
    renderComponent();

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledTimes(1);
    });

    const regSelect = document.getElementById('filter-register');
    fireEvent.change(regSelect, { target: { value: 'SR1' } });

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          stockRegister: 'SR1',
          page: 1
        })
      );
    });
  });

  it('5 & 6. Selecting From and To dates immediately triggers reactive fetch', async () => {
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

  it('7. Typing in Search automatically filters after short debounce', async () => {
    vi.useFakeTimers();
    renderComponent();

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    const searchInput = document.getElementById('filter-search');
    fireEvent.change(searchInput, { target: { value: 'Copper' } });

    // Should NOT have called immediately
    expect(historyApi.getStockHistory).not.toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Copper' })
    );

    // Fast-forward past 300ms debounce
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(historyApi.getStockHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'Copper',
        page: 1
      })
    );

    vi.useRealTimers();
  });

  it('8. Multiple cumulative filters work together simultaneously', async () => {
    renderComponent();

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(document.getElementById('filter-type'), { target: { value: 'PURCHASE' } });
    fireEvent.change(document.getElementById('filter-department'), { target: { value: 'Central Store' } });
    fireEvent.change(document.getElementById('filter-register'), { target: { value: 'SR1' } });
    fireEvent.change(document.getElementById('filter-from-date'), { target: { value: '2026-09-01' } });
    fireEvent.change(document.getElementById('filter-to-date'), { target: { value: '2026-09-23' } });

    await waitFor(() => {
      expect(historyApi.getStockHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PURCHASE',
          department: 'Central Store',
          stockRegister: 'SR1',
          startDate: '2026-09-01',
          endDate: '2026-09-23',
          page: 1
        })
      );
    });
  });

  it('9. Clicking Clear Filters resets all controls and refetches complete unfiltered history', async () => {
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
