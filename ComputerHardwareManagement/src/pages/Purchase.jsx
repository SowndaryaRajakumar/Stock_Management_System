import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import PurchaseForm from '../components/stock/PurchaseForm';
import { purchaseApi } from '../services/api';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

export const Purchase = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [registerFilter, setRegisterFilter] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (searchTerm) params.search = searchTerm;
      if (registerFilter) params.stockRegister = registerFilter;

      const res = await purchaseApi.getPurchases(params);
      if (res.success) {
        setPurchases(res.purchases || []);
        setTotalItems(res.total !== undefined ? res.total : (res.count || res.purchases?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, registerFilter, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, registerFilter]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handlePurchaseSuccess = (result) => {
    const qty = result?.quantity || '';
    const name = result?.productName || '';
    setSuccessToast(
      qty && name
        ? `Purchase recorded successfully: +${qty} units for ${name}.`
        : 'Purchase recorded successfully.'
    );
    fetchPurchases();
    setTimeout(() => setSuccessToast(''), 5000);
  };


  return (
    <Layout
      title="Stock Purchases"
      breadcrumb="Procurement / Purchases"
    >
      <div className="page-header">
        <div className="page-header-title">
          <h1>Stock Purchases</h1>
          <p>Record newly purchased hardware stock and goods received.</p>
        </div>
      </div>

      <div className="content-area">
        {successToast && (
          <div
            style={{
              background: 'var(--green-50)',
              border: '1px solid var(--green-600)',
              color: 'var(--green-800)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            <span>✓</span>
            <span>{successToast}</span>
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          {/* Operational Purchase Form */}
          <PurchaseForm onPurchaseSuccess={handlePurchaseSuccess} />
        </div>

        {/* Recent Purchases List */}
        <div className="card">
          <div className="card-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <span className="card-title">Recent Purchase Logs</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search vendor, invoice, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                  minWidth: '220px'
                }}
              />
              <select
                value={registerFilter}
                onChange={(e) => setRegisterFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem'
                }}
              >
                <option value="">All Registers</option>
                <option value="SR1">SR1</option>
                <option value="SR2">SR2</option>
                <option value="SR3">SR3</option>
                <option value="CSSR1">CSSR1</option>
              </select>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading && purchases.length === 0 ? (
              <Loading message="Loading purchase records..." />
            ) : purchases.length === 0 ? (
              <EmptyState
                icon="↧"
                title="No purchase logs found"
                description="No purchase transactions match your current filters."
              />
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Purchase Date</th>
                        <th>Invoice / DC No.</th>
                        <th>Product</th>
                        <th>Stock Register</th>
                        <th>Supplier / Vendor</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total Value</th>
                        <th>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((item) => (
                        <tr key={item._id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{item.date || item.purchaseDate}</td>
                          <td className="code" style={{ fontWeight: 700 }}>
                            {item.invoiceNumber || '—'}
                          </td>
                          <td>
                            <div className="cell-strong">{item.productName}</div>
                            <span className="code">{item.productCode}</span>
                          </td>
                          <td>
                            <span className="badge badge-blue">{item.stockRegister || 'SR1'}</span>
                          </td>
                          <td>{item.supplier || item.supplierName || '—'}</td>
                          <td>
                            <strong style={{ color: 'var(--green-700)' }}>
                              +{item.quantity} {item.unit || 'Units'}
                            </strong>
                          </td>
                          <td>₹{(Number(item.unitPrice) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td>
                            <strong>₹{(Number(item.totalAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {item.recordedBy || item.receivedBy || 'Admin'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Purchase;
