import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import { analyticsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { activeSystem, isElectrical } = useSystem();
  const currentSystem = activeSystem ||
    (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('/electrical') ? 'electrical' : null) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('stock_active_system')) ||
    'hardware';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await analyticsApi.getDashboardStats(currentSystem);
      if (res?.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to connect to backend service.');
    } finally {
      setLoading(false);
    }
  }, [currentSystem]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading && !data) {
    return (
      <Layout title={isAdmin ? "Admin Dashboard" : "Faculty Portal"} breadcrumb="Overview">
        <Loading message="Loading inventory metrics..." />
      </Layout>
    );
  }

  const stats = data?.stats || {};
  const facultyStats = data?.facultyStats || {};
  const lowStockItems = data?.lowStockItems || [];
  const recentActivity = data?.recentActivity || [];
  const recentIndents = data?.recentIndents || [];

  // ==========================================
  // 1. ELECTRICAL FACULTY DASHBOARD VIEW (NO ONLINE REQUISITIONS)
  // ==========================================
  if (isElectrical && !isAdmin) {
    return (
      <Layout title="Electrical Stock – Overview" breadcrumb="Overview of Electrical Consumables & Stock Levels">
        {error && (
          <div className="login-error-box" style={{ marginBottom: '18px' }}>
            ⚠ {error}
          </div>
        )}

        {/* Welcome Banner */}
        <div
          className="card card-pad"
          style={{
            marginBottom: '22px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f766e 100%)',
            color: 'var(--white)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ color: 'var(--white)', fontSize: '1.25rem', marginBottom: '4px' }}>
                Electrical Stock System
              </h2>
              <p style={{ color: '#ccfbf1', margin: 0, fontSize: '0.86rem' }}>
                Welcome, {user?.name || 'Faculty Member'} · Department of {user?.department || 'Engineering'}
              </p>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                color: 'white'
              }}
            >
              📋 Physical Indent Requisition: Submit manual material slips directly to the Electrical Store.
            </div>
          </div>
        </div>

        {/* Store Inventory Metrics Overview */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
          <StatCard
            label="Total Products"
            figure={stats.totalProducts || 0}
            icon="▦"
            variant="blue"
          />
          <StatCard
            label="Categories"
            figure={stats.totalCategories || 0}
            icon="🏷"
            variant="blue"
          />
          <StatCard
            label="Total Store Stock"
            figure={(stats.currentStock || stats.totalCurrentStock || 0).toLocaleString()}
            icon="✓"
            variant="green"
          />
          <StatCard
            label="Stock Status"
            figure={(stats.lowStockCount || 0) > 0 ? `${stats.lowStockCount} Low` : 'Healthy'}
            icon={(stats.lowStockCount || 0) > 0 ? '⚠' : '✓'}
            variant={(stats.lowStockCount || 0) > 0 ? 'amber' : 'green'}
          />
        </div>

        {/* Notice Card */}
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⚡</div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-900)', marginBottom: '8px' }}>
            Electrical Consumables Store Management
          </h3>
          <p style={{ color: 'var(--text-600)', fontSize: '0.88rem', maxWidth: '600px', margin: '0 auto 16px auto', lineHeight: 1.6 }}>
            Electrical stock operates via offline manual requisition. For material requests, please submit a signed physical indent slip to the Electrical Store keeper. The store administrator records received indents directly into the system register.
          </p>
        </div>
      </Layout>
    );
  }

  // ==========================================
  // 2. COMPUTER HARDWARE FACULTY DASHBOARD VIEW (ONLINE REQUISITIONS)
  // ==========================================
  if (!isElectrical && !isAdmin) {
    const myTotal = facultyStats.myTotalRequests !== undefined ? facultyStats.myTotalRequests : (stats.myTotalRequests || 0);
    const myPending = facultyStats.myPendingRequests !== undefined ? facultyStats.myPendingRequests : (stats.myPendingRequests || 0);
    const myApproved = facultyStats.myApprovedRequests !== undefined ? facultyStats.myApprovedRequests : (stats.myApprovedRequests || 0);
    const myRejected = facultyStats.myRejectedRequests !== undefined ? facultyStats.myRejectedRequests : (stats.myRejectedRequests || 0);

    return (
      <Layout title="Faculty Portal Dashboard" breadcrumb="Department Requisition & Material Overview">
        {error && (
          <div className="login-error-box" style={{ marginBottom: '18px' }}>
            ⚠ {error}
          </div>
        )}

        {/* Quick Welcome & Action Banner */}
        <div
          className="card card-pad"
          style={{
            marginBottom: '22px',
            background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--blue-700) 100%)',
            color: 'var(--white)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ color: 'var(--white)', fontSize: '1.25rem', marginBottom: '4px' }}>
                Welcome, {user?.name || 'Faculty Member'}
              </h2>
              <p style={{ color: '#d0e1f9', margin: 0, fontSize: '0.85rem' }}>
                Department of {user?.department || 'Engineering'} · Browse catalog or submit material indents.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                to={`/${currentSystem}/faculty/catalog`}
                className="btn-primary"
                style={{ background: 'var(--white)', color: 'var(--navy-900)', fontWeight: 700 }}
              >
                ▦ Browse Catalog
              </Link>
              <Link
                to={`/${currentSystem}/indents/create`}
                className="btn-outline"
                style={{
                  background: 'transparent',
                  borderColor: 'rgba(255,255,255,0.6)',
                  color: 'var(--white)',
                  fontWeight: 600
                }}
              >
                ＋ Create Indent
              </Link>
            </div>
          </div>
        </div>

        {/* Faculty Specific Metric Cards */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
          <StatCard
            label="My Requisitions"
            figure={myTotal}
            icon="▧"
            variant="blue"
            onClick={() => navigate(`/${currentSystem}/indents/my`)}
          />
          <StatCard
            label="Pending Approval"
            figure={myPending}
            icon="⏳"
            variant="amber"
            onClick={() => navigate(`/${currentSystem}/indents/my`)}
          />
          <StatCard
            label="Approved & Ready"
            figure={myApproved}
            icon="✓"
            variant="green"
            onClick={() => navigate(`/${currentSystem}/indents/my`)}
          />
          <StatCard
            label="Rejected"
            figure={myRejected}
            icon="✕"
            variant="red"
            onClick={() => navigate(`/${currentSystem}/indents/my`)}
          />
        </div>

        {/* Recent Personal Indents Table */}
        <div className="section">
          <div className="section-head">
            <h2>My Recent Indents</h2>
            <Link to={`/${currentSystem}/indents/my`} className="link-subtle">
              View all my indents ({myTotal}) →
            </Link>
          </div>

          <div className="card">
            {recentIndents.length === 0 ? (
              <div className="card-pad" style={{ textAlign: 'center' }}>
                <EmptyState
                  icon="▧"
                  title="No recent indents found"
                  description="You have not submitted any departmental material requests yet."
                  action={
                    <Link to={`/${currentSystem}/faculty/catalog`} className="btn-primary">
                      Browse Product Catalog →
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Indent Number</th>
                      <th>Date</th>
                      <th>Purpose</th>
                      <th>Items Count</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentIndents.map((indent) => {
                      const indentId = indent.id || indent._id || indent.indentId;
                      return (
                        <tr key={indentId}>
                          <td className="code" style={{ fontWeight: 700 }}>
                            <Link to={`/${currentSystem}/indents/${indentId}`}>
                              {indent.indentNumber || indent.indent_number}
                            </Link>
                          </td>
                          <td>{indent.requestDate || indent.date || (indent.created_at ? new Date(indent.created_at).toISOString().split('T')[0] : '—')}</td>
                          <td style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {indent.purpose || indent.remarks || 'Department Requisition'}
                          </td>
                          <td>{indent.items?.length || 1} item(s)</td>
                          <td>
                            <StatusBadge status={indent.status} />
                          </td>
                          <td>
                            <Link to={`/${currentSystem}/indents/${indentId}`} className="btn-outline btn-sm">
                              View Status
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // ==========================================
  // 3. ADMIN DASHBOARD VIEW (ELECTRICAL vs COMPUTER HARDWARE)
  // ==========================================
  const totalProducts = stats.totalProducts || 0;
  const totalCategories = stats.totalCategories || 0;
  const currentStock = stats.currentStock !== undefined ? stats.currentStock : (stats.totalCurrentStock || 0);
  const lowStockCount = stats.lowStockCount || 0;
  const purchasesCount = stats.purchases !== undefined ? stats.purchases : (stats.totalPurchases || 0);
  const transfersCount = stats.transfers !== undefined ? stats.transfers : (stats.totalTransfers || 0);

  // Electrical uses totalManualIndents; Hardware uses pendingIndents
  const indentsRecordedCount = stats.manualIndents !== undefined ? stats.manualIndents : (stats.totalManualIndents || stats.indentsRecorded || recentIndents.length || 0);
  const pendingIndents = stats.pendingIndents !== undefined ? stats.pendingIndents : (stats.pendingIndentCount || 0);

  return (
    <Layout
      title="Admin Dashboard"
      breadcrumb={isElectrical ? "Electrical Stock & Inventory Overview" : "Hardware Stock & Inventory Overview"}
    >
      {error && (
        <div className="login-error-box" style={{ marginBottom: '18px' }}>
          ⚠ {error}
        </div>
      )}

      {/* 7 Summary Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginBottom: '24px' }}>
        <StatCard
          label="Total Products"
          figure={totalProducts}
          icon="▦"
          variant="blue"
          onClick={() => navigate(`/${activeSystem || 'hardware'}/products`)}
        />
        <StatCard
          label="Total Categories"
          figure={totalCategories}
          icon="🏷"
          variant="blue"
          onClick={() => navigate(`/${activeSystem || 'hardware'}/categories`)}
        />
        <StatCard
          label="Current Stock"
          figure={currentStock.toLocaleString()}
          icon="✓"
          variant="green"
          onClick={() => navigate(`/${activeSystem || 'hardware'}/products`)}
        />
        <StatCard
          label="Low Stock"
          figure={lowStockCount}
          icon="⚠"
          variant="red"
          onClick={() => navigate(`/${activeSystem || 'hardware'}/low-stock`)}
        />
        <StatCard
          label="Purchases"
          figure={purchasesCount}
          icon="↧"
          variant="blue"
          onClick={() => navigate(`/${activeSystem || 'hardware'}/purchases`)}
        />
        <StatCard
          label="Transfers"
          figure={transfersCount}
          icon="↥"
          variant="amber"
          onClick={() => navigate(`/${activeSystem || 'hardware'}/transfers`)}
        />

        {/* 7th Card: Manual Indents Recorded for Electrical vs Pending Indents for Hardware */}
        {isElectrical ? (
          <StatCard
            label="Manual Indents"
            figure={indentsRecordedCount}
            icon="📋"
            variant="blue"
            onClick={() => navigate(`/${activeSystem || 'electrical'}/indents`)}
          />
        ) : (
          <StatCard
            label="Pending Indents"
            figure={pendingIndents}
            icon="📋"
            variant="amber"
            onClick={() => navigate(`/${activeSystem || 'hardware'}/indents`)}
          />
        )}
      </div>

      <div className="grid-2">
        {/* Low stock alert panel */}
        <div className="section">
          <div className="section-head">
            <h2>Critical Low Stock Alerts</h2>
            <Link to={`/${activeSystem || 'hardware'}/low-stock`} className="link-subtle">
              View all ({lowStockCount}) →
            </Link>
          </div>

          <div className="card">
            {lowStockItems.length === 0 ? (
              <div className="card-pad" style={{ textAlign: 'center' }}>
                <EmptyState
                  icon="✓"
                  title="Stock Levels Healthy"
                  description="All inventory products are currently above their minimum safety thresholds."
                />
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Current</th>
                      <th>Min Limit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item) => (
                      <tr key={item._id || item.id}>
                        <td>
                          <Link to={`/${activeSystem || 'hardware'}/products/${item._id || item.id}`} className="cell-strong">
                            {item.productName || item.name}
                          </Link>
                          <div className="small code">{item.productCode}</div>
                        </td>
                        <td>{item.category}</td>
                        <td>
                          <strong style={{ color: 'var(--red-600)' }}>
                            {item.currentQuantity || item.currentStock} {item.unit}
                          </strong>
                        </td>
                        <td>{item.minimumQuantity || item.minStock}</td>
                        <td>
                          <StatusBadge status="Low Stock" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ELECTRICAL: Recent Manual Indents Recorded Panel */}
        {isElectrical && (
          <div className="section">
            <div className="section-head">
              <h2>Recent Manual Indents Recorded</h2>
              <Link to={`/${activeSystem || 'electrical'}/indents`} className="link-subtle">
                View Indent Register →
              </Link>
            </div>

            <div className="card">
              {recentIndents.length === 0 ? (
                <div className="card-pad" style={{ textAlign: 'center' }}>
                  <EmptyState
                    icon="📋"
                    title="No Indents Recorded"
                    description="No manual material requests have been logged in the register yet."
                  />
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Indent No.</th>
                        <th>Department</th>
                        <th>Requester</th>
                        <th>Purpose / Item</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentIndents.map((indent) => (
                        <tr key={indent._id || indent.id}>
                          <td className="code" style={{ fontWeight: 700, color: 'var(--blue-700)' }}>
                            {indent.indentNumber}
                          </td>
                          <td>{indent.department}</td>
                          <td><strong>{indent.requestedBy || indent.requesterName}</strong></td>
                          <td style={{ maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {indent.items?.[0]?.productName || indent.purpose || '—'}
                          </td>
                          <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                            {indent.date || indent.requestDate || (indent.created_at ? new Date(indent.created_at).toISOString().split('T')[0] : '—')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HARDWARE: Pending Requisition Indents Panel */}
        {!isElectrical && (
          <div className="section">
            <div className="section-head">
              <h2>Pending Requisition Indents</h2>
              <Link to={`/${activeSystem || 'hardware'}/indents`} className="link-subtle">
                Manage Indents →
              </Link>
            </div>

            <div className="card">
              {recentIndents.length === 0 ? (
                <div className="card-pad" style={{ textAlign: 'center' }}>
                  <EmptyState
                    icon="▧"
                    title="No Pending Indents"
                    description="No material requests are currently awaiting store approval."
                  />
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Indent No.</th>
                        <th>Department</th>
                        <th>Requester</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentIndents.map((indent) => (
                        <tr key={indent._id || indent.id}>
                          <td className="code" style={{ fontWeight: 700 }}>
                            <Link to={`/${activeSystem || 'hardware'}/indents/${indent._id || indent.id}`}>
                              {indent.indentNumber}
                            </Link>
                          </td>
                          <td>{indent.department}</td>
                          <td>{indent.requesterName}</td>
                          <td>
                            <StatusBadge status={indent.status} />
                          </td>
                          <td>
                            <Link
                              to={`/${activeSystem || 'hardware'}/indents/${indent._id || indent.id}`}
                              className="btn-outline btn-sm"
                            >
                              Review →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
