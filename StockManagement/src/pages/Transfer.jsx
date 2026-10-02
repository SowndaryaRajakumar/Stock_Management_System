import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import TransferForm from '../components/stock/TransferForm';
import { transferApi, masterDataApi } from '../services/api';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

export const Transfer = () => {
  const [transfers, setTransfers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await masterDataApi.getDepartments();
        if (res.success && res.departments) {
          setDepartments(res.departments);
        }
      } catch (err) {
        console.error('Failed to load departments for transfer list:', err);
      }
    };
    loadDepartments();
  }, []);

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (searchTerm) params.search = searchTerm;
      if (departmentFilter) params.department = departmentFilter;

      const res = await transferApi.getTransfers(params);
      if (res && res.success) {
        setTransfers(res.transfers || res.data || []);
        setTotalItems(res.total !== undefined ? res.total : (res.count || res.transfers?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, departmentFilter, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleTransferSuccess = (result) => {
    const qty = result?.quantity || '';
    const name = result?.productName || '';
    const dept = typeof result?.department === 'string' ? result.department : (result?.department?.name || '');
    setSuccessToast(
      qty && name
        ? `Transfer recorded successfully: -${qty} units of ${name}${dept ? ' to ' + dept : ''}.`
        : 'Transfer recorded successfully.'
    );
    fetchTransfers();
    setTimeout(() => setSuccessToast(''), 5000);
  };

  const totalUnitsTransferred = transfers.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Transfer</h1>
          <p>Record stock transfers and material issues to departments.</p>
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

        {/* 1. TRANSFER FORM */}
        <div style={{ marginBottom: '24px' }}>
          <TransferForm onTransferSuccess={handleTransferSuccess} />
        </div>

        {/* 2. TRANSFER STATISTICS */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <span className="card-title">Transfer Statistics</span>
          </div>
          <div className="card-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px'
              }}
            >
              <div
                style={{
                  background: 'var(--navy-50)',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--navy-100)'
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                  }}
                >
                  Total Issues Logged
                </div>
                <div
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: 'var(--navy-900)',
                    marginTop: '4px'
                  }}
                >
                  {totalItems}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Recorded stock transfers
                </div>
              </div>

              <div
                style={{
                  background: 'var(--amber-50)',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--amber-100)'
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                  }}
                >
                  Units on Page
                </div>
                <div
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: 'var(--amber-800)',
                    marginTop: '4px'
                  }}
                >
                  {totalUnitsTransferred}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Total units transferred
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. RECENT STOCK TRANSFERS */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <span className="card-title">Recent Stock Transfers</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search department, product..."
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
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem'
                }}
              >
                <option value="">All Departments</option>
                {departments.map((d, idx) => (
                  <option key={d._id || d.id || d.code || `dept-${idx}`} value={d.name || d}>
                    {d.name || d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading && transfers.length === 0 ? (
              <Loading message="Loading transfer records..." />
            ) : transfers.length === 0 ? (
              <EmptyState
                icon="↥"
                title="No stock transfers recorded yet."
                description="No stock transfers match your current filter parameters."
              />
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Receiving Department</th>
                        <th>Indent Reference</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((item) => {
                        let dateDisplay = item.date || item.transferDate || '';
                        if (item.transferDate) {
                          const d = new Date(item.transferDate);
                          if (!isNaN(d.getTime())) {
                            dateDisplay = d.toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            });
                          }
                        }
                        const deptName =
                          typeof item.department === 'object'
                            ? item.department?.name || '—'
                            : item.department || '—';
                        const qtyNum = Number(item.quantity) || 0;
                        const unitName =
                          item.unit || item.unitName || (typeof item.product?.unit === 'string' ? item.product.unit : '') || 'Units';

                        return (
                          <tr key={item._id || item.id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{dateDisplay}</td>
                            <td>
                              <div className="cell-strong">{item.productName}</div>
                              <span className="code">{item.productCode}</span>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--amber-700)' }}>
                                -{qtyNum} {unitName}
                              </strong>
                            </td>
                            <td>
                              <strong>{deptName}</strong>
                              {item.receivedByPerson && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Req by: {item.receivedByPerson}
                                </div>
                              )}
                            </td>
                            <td>
                              {item.indentNumber ? (
                                <span className="code" style={{ fontWeight: 700, color: 'var(--blue-700)' }}>
                                  {item.indentNumber}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>Direct Issue</span>
                              )}
                            </td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  background: '#ecfdf5',
                                  color: '#059669',
                                  border: '1px solid #a7f3d0'
                                }}
                              >
                                Completed
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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

        {/* 4. STOCK TRANSFER POLICY */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Stock Transfer Policy</span>
          </div>
          <div className="card-body" style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#059669', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>✓</span>
                <span>Transferring stock immediately decreases current store inventory.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#059669', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>✓</span>
                <span>Transfer quantity cannot exceed available stock.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#059669', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>✓</span>
                <span>
                  Department requisitions should be reviewed and approved via <strong>Manage Indents</strong>.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#059669', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>✓</span>
                <span>All transfers are recorded in <strong>Stock History</strong> with receiving department information.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Transfer;
