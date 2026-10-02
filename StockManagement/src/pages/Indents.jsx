import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import IndentTable from '../components/indents/IndentTable';
import IndentApprovalModal from '../components/indents/IndentApprovalModal';
import { indentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

export const Indents = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndentForReview, setSelectedIndentForReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Read flash message from create redirect
  useEffect(() => {
    if (location.state?.successMessage) {
      setActionSuccessMessage(location.state.successMessage);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setActionSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchIndents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await indentApi.getIndents(params);
      if (res.success) {
        setIndents(res.indents || []);
        setTotalItems(res.total !== undefined ? res.total : (res.count || res.indents?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch indents:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchIndents();
  }, [fetchIndents]);

  const handleOpenReview = (indent) => {
    setSelectedIndentForReview(indent);
    setIsReviewModalOpen(true);
  };

  const handleIndentProcessed = (updatedIndent) => {
    setActionSuccessMessage(`Indent ${updatedIndent.indentNumber} processed successfully (${updatedIndent.status})!`);
    fetchIndents();
    setTimeout(() => setActionSuccessMessage(''), 5000);
  };

  const pendingCount = indents.filter((i) => ['SUBMITTED', 'PENDING', 'RECOMMENDED'].includes(i.status)).length;
  const approvedCount = indents.filter((i) => ['APPROVED', 'ISSUED', 'PARTIALLY_ISSUED', 'COMPLETED'].includes(i.status)).length;

  return (
    <Layout
      title={isAdmin ? 'Online Indent Requests' : 'My Indent Requests'}
      breadcrumb={isAdmin ? 'Admin / Indent Approvals' : 'Track the status of your submitted material requisitions.'}
    >
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>
              {isAdmin ? 'Online Indent Requisitions' : 'My Indent Requisitions'}
            </h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              {isAdmin
                ? 'Review faculty material requisitions and approve stock allocations.'
                : 'Track the status of your submitted material requisitions.'}
            </p>
          </div>
          {!isAdmin && (
            <Link to="/indents/create" className="btn-primary">
              <span className="icon">＋</span> Create New Indent
            </Link>
          )}
        </div>
      </div>

      <div>
        {actionSuccessMessage && (
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
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Stats row */}
        <div className="grid-4col" style={{ marginBottom: '24px' }}>
          <div className="metric-card">
            <div className="metric-label">Total Indents</div>
            <div className="metric-value">{totalItems}</div>
            <div className="metric-sub">Across all statuses</div>
          </div>
          <div className="metric-card" style={{ borderColor: pendingCount > 0 ? 'var(--amber-400)' : 'inherit' }}>
            <div className="metric-label">Pending Review</div>
            <div className="metric-value" style={{ color: pendingCount > 0 ? 'var(--amber-600)' : 'inherit' }}>
              {pendingCount}
            </div>
            <div className="metric-sub">{pendingCount > 0 ? 'Action required by Store' : 'All indents processed'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Approved / Issued</div>
            <div className="metric-value" style={{ color: 'var(--green-700)' }}>
              {approvedCount}
            </div>
            <div className="metric-sub">Store approved</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">User Role</div>
            <div className="metric-value" style={{ fontSize: '1.2rem', color: 'var(--blue-700)' }}>
              {isAdmin ? 'Admin' : 'Faculty'}
            </div>
            <div className="metric-sub">{isAdmin ? 'Store review & approval' : 'Requisition submitter'}</div>
          </div>
        </div>

        {/* Indents Table Card */}
        <div className="card">
          <div className="card-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <span className="card-title">Requisition Records</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search indent no, purpose, product..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem'
                }}
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ISSUED">ISSUED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading && indents.length === 0 ? (
              <Loading message="Loading indent requisitions..." />
            ) : (
              <>
                <IndentTable indents={indents} onReview={handleOpenReview} />
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

      {/* Review Modal */}
      {isReviewModalOpen && selectedIndentForReview && (
        <IndentApprovalModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          indent={selectedIndentForReview}
          onIndentProcessed={handleIndentProcessed}
        />
      )}
    </Layout>
  );
};

export default Indents;
