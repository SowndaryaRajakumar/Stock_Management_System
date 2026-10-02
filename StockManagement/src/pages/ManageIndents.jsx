import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import IndentTable from '../components/indents/IndentTable';
import IndentApprovalModal from '../components/indents/IndentApprovalModal';
import { indentApi } from '../services/api';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

export const ManageIndents = () => {
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndentForReview, setSelectedIndentForReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

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
      console.error('Failed to fetch indents for admin:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, currentPage, pageSize]);

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
      title="Manage Indent Requests"
      breadcrumb="Admin / Indent Requisitions"
    >
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>Department Indent Requisitions</h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Review online material requisitions submitted by faculty members, verify store quantities, and approve allocations.
            </p>
          </div>
        </div>
      </div>

      <div>
        {actionSuccessMessage && (
          <div
            style={{
              background: 'var(--green-50)',
              border: '1px solid var(--green-200)',
              color: 'var(--green-700)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              fontSize: '0.85rem'
            }}
          >
            ✓ {actionSuccessMessage}
          </div>
        )}

        {/* Quick summary cards for Admin */}
        <div className="grid-3col" style={{ marginBottom: '20px' }}>
          <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--amber-500)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pending Indents Awaiting Action
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--amber-700)', marginTop: '4px' }}>
              {pendingCount}
            </div>
          </div>

          <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--green-500)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Approved / Issued
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green-700)', marginTop: '4px' }}>
              {approvedCount}
            </div>
          </div>

          <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--blue-500)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Requisitions
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--blue-700)', marginTop: '4px' }}>
              {totalItems}
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px' }}>
              <input
                type="text"
                placeholder="Search indent #, department, or requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label htmlFor="status-select" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-600)' }}>Status:</label>
              <select
                id="status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Pending / Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="ISSUED">Issued</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {indents.length} of {totalItems} records
            </span>
          </div>
        </div>

        {/* Indent Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <Loading message="Fetching indent requisitions from MongoDB..." />
          ) : (
            <IndentTable
              indents={indents}
              isAdmin={true}
              onReviewClick={handleOpenReview}
            />
          )}

          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Review & Approval Modal */}
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

export default ManageIndents;
