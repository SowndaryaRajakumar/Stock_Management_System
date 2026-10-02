import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import IndentApprovalModal from '../components/indents/IndentApprovalModal';
import { indentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';
import { useNotifications } from '../context/NotificationContext';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

export const ManageIndents = () => {
  const { isAdmin } = useAuth();
  const { activeSystem } = useSystem();
  const { fetchNotifications } = useNotifications();
  const navigate = useNavigate();

  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndentForReview, setSelectedIndentForReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [actionErrorMessage, setActionErrorMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Rejection prompt modal state
  const [rejectModalData, setRejectModalData] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchIndents = useCallback(async () => {
    try {
      setLoading(true);
      setActionErrorMessage('');
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
      setActionErrorMessage(err.response?.data?.message || err.message || 'Failed to fetch indent requisitions.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, currentPage, pageSize]);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchIndents();
  }, [fetchIndents]);

  // Quick action: Open review modal (for approve or detailed review)
  const handleOpenReview = (indent) => {
    setSelectedIndentForReview(indent);
    setIsReviewModalOpen(true);
  };

  // Callback when review modal finishes processing
  const handleIndentProcessed = (updatedIndent) => {
    setActionSuccessMessage(`Indent ${updatedIndent.indentNumber} processed successfully (${updatedIndent.status})!`);
    fetchNotifications();
    fetchIndents();
    setTimeout(() => setActionSuccessMessage(''), 5000);
  };

  // Quick action: Approve indent directly
  const handleQuickApprove = (indent) => {
    setSelectedIndentForReview(indent);
    setIsReviewModalOpen(true);
  };

  // Quick action: Open reject dialog
  const handleOpenRejectPrompt = (indent) => {
    setRejectModalData(indent);
    setRejectionReason('');
  };

  // Submit rejection
  const handleConfirmReject = async () => {
    if (!rejectModalData) return;
    const reason = rejectionReason.trim() || 'Not approved by Central Store Administration';

    try {
      setProcessingId(rejectModalData.id || rejectModalData._id);
      const indentId = rejectModalData.id || rejectModalData._id;
      const res = await indentApi.reviewIndent(indentId, {
        action: 'REJECT',
        adminRemarks: reason,
        approvedItems: []
      });

      if (res.success) {
        setActionSuccessMessage(`Indent ${rejectModalData.indentNumber} has been rejected.`);
        setRejectModalData(null);
        fetchNotifications();
        fetchIndents();
        setTimeout(() => setActionSuccessMessage(''), 5000);
      }
    } catch (err) {
      setActionErrorMessage(err.response?.data?.message || err.message || 'Failed to reject indent.');
    } finally {
      setProcessingId(null);
    }
  };

  // Quick action: Physical stock issue / transfer
  const handleIssueTransfer = async (indent) => {
    const confirmMsg = `Physically issue approved items for Indent ${indent.indentNumber}?\n\nThis will:\n1. Deduct live hardware store stock\n2. Create a departmental stock transfer record\n3. Record stock movement transaction\n4. Mark requisition status as COMPLETED.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setProcessingId(indent.id || indent._id);
      setActionErrorMessage('');
      const indentId = indent.id || indent._id;
      const res = await indentApi.issueIndent(indentId, {
        remarks: 'Physical store issue to department'
      });

      if (res.success) {
        setActionSuccessMessage(`Indent ${indent.indentNumber} issued successfully! Hardware store stock deducted.`);
        fetchNotifications();
        fetchIndents();
        setTimeout(() => setActionSuccessMessage(''), 6000);
      }
    } catch (err) {
      setActionErrorMessage(err.response?.data?.message || err.message || 'Failed to issue indent.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter indents locally if client search is active
  const filteredIndents = useMemo(() => {
    if (!searchTerm) return indents;
    const q = searchTerm.toLowerCase().trim();
    return indents.filter((i) => {
      const numMatch = (i.indentNumber || '').toLowerCase().includes(q);
      const reqMatch = (i.requesterName || i.requestedBy || '').toLowerCase().includes(q);
      const deptMatch = (i.department || '').toLowerCase().includes(q);
      const purpMatch = (i.purpose || '').toLowerCase().includes(q);
      const itemsMatch = (i.items || []).some((item) =>
        (item.productName || '').toLowerCase().includes(q) ||
        (item.productCode || '').toLowerCase().includes(q)
      );
      return numMatch || reqMatch || deptMatch || purpMatch || itemsMatch;
    });
  }, [indents, searchTerm]);

  // Counts for status cards
  const pendingCount = indents.filter((i) => ['SUBMITTED', 'PENDING', 'RECOMMENDED'].includes(i.status)).length;
  const approvedCount = indents.filter((i) => ['APPROVED', 'PARTIALLY_APPROVED'].includes(i.status)).length;
  const rejectedCount = indents.filter((i) => i.status === 'REJECTED').length;
  const issuedCount = indents.filter((i) => ['ISSUED', 'COMPLETED'].includes(i.status)).length;

  const getSystemPath = (path) => `/${activeSystem || 'hardware'}${path}`;

  return (
    <Layout
      title="Manage Indent Requests"
      breadcrumb="Admin / Manage Indents"
    >
      {/* Header Section */}
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px', fontWeight: 700 }}>
              Manage Indent Requests
            </h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Review, approve, reject and issue hardware requisitions.
            </p>
          </div>
        </div>
      </div>

      <div>
        {/* Success / Error Alerts */}
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

        {actionErrorMessage && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              fontSize: '0.85rem'
            }}
          >
            ⚠ {actionErrorMessage}
          </div>
        )}

        {/* 4 Status Summary Cards */}
        <div className="grid-4col" style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--amber-500)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pending Review
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--amber-700)', marginTop: '4px' }}>
              {pendingCount}
            </div>
          </div>

          <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--blue-500)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Approved
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--blue-700)', marginTop: '4px' }}>
              {approvedCount}
            </div>
          </div>

          <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Rejected
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
              {rejectedCount}
            </div>
          </div>

          <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--green-500)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Issued / Completed
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green-700)', marginTop: '4px' }}>
              {issuedCount}
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 280px' }}>
              <input
                type="text"
                placeholder="Search by indent number, requester, department, product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label htmlFor="status-filter" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-600)' }}>Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ISSUED">Issued</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredIndents.length} of {totalItems} requisitions
            </span>
          </div>
        </div>

        {/* Indents Table with Exact 9 Columns */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <Loading message="Fetching indent requisitions..." />
          ) : filteredIndents.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No indent requests found"
              description="No requisitions match your search or filter criteria in the system."
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Indent No.</th>
                    <th>Requester</th>
                    <th>Department</th>
                    <th>Required Date</th>
                    <th>Purpose</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIndents.map((indent) => {
                    const isPending = ['SUBMITTED', 'PENDING', 'RECOMMENDED', 'DRAFT'].includes(indent.status);
                    const isApproved = ['APPROVED', 'PARTIALLY_APPROVED'].includes(indent.status);
                    const isCompletedOrIssued = ['ISSUED', 'COMPLETED'].includes(indent.status);
                    const isProcessing = processingId === (indent.id || indent._id);

                    // Summarize items for column 6
                    const itemsSummary = indent.items && indent.items.length > 0
                      ? indent.items.map((i) => `${i.productName || i.productCode} (${i.quantityRequired || i.requestedQuantity || 0} ${i.unit || 'box'})`).join(', ')
                      : '—';

                    const totalItemCount = indent.items?.length || 0;

                    const createdDateStr = indent.created_at
                      ? new Date(indent.created_at).toISOString().split('T')[0]
                      : (indent.requestDate || indent.date || '—');

                    return (
                      <tr key={indent.id || indent._id || indent.indentNumber}>
                        {/* 1. Indent No. */}
                        <td className="code" style={{ fontWeight: 700 }}>
                          <Link to={getSystemPath(`/indents/${indent.id || indent._id || indent.indentNumber}`)}>
                            {indent.indentNumber}
                          </Link>
                        </td>

                        {/* 2. Requester */}
                        <td>
                          <strong>{indent.requesterName || indent.requestedBy || 'Faculty'}</strong>
                        </td>

                        {/* 3. Department */}
                        <td>
                          <span className="badge-light">{indent.department || indent.requestingDepartment || 'Department'}</span>
                        </td>

                        {/* 4. Required Date */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {indent.requiredDate || indent.requestDate || indent.date || '—'}
                        </td>

                        {/* 5. Purpose */}
                        <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={indent.purpose}>
                          {indent.purpose || '—'}
                        </td>

                        {/* 6. Items */}
                        <td style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={itemsSummary}>
                          <span style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
                            [{totalItemCount} item{totalItemCount !== 1 ? 's' : ''}]
                          </span>{' '}
                          {itemsSummary}
                        </td>

                        {/* 7. Status */}
                        <td>
                          <StatusBadge status={indent.status} />
                        </td>

                        {/* 8. Created Date */}
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-600)' }}>
                          {createdDateStr}
                        </td>

                        {/* 9. Actions */}
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* View Action - always available */}
                            <Link
                              to={getSystemPath(`/indents/${indent.id || indent._id || indent.indentNumber}`)}
                              className="btn-outline btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                              title="View complete requisition details"
                            >
                              View
                            </Link>

                            {/* Pending status actions: Approve & Reject */}
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleQuickApprove(indent)}
                                  className="btn-primary btn-sm"
                                  disabled={isProcessing}
                                  style={{ padding: '4px 8px', fontSize: '0.74rem', background: 'var(--blue-600)', borderColor: 'var(--blue-600)' }}
                                  title="Review and approve requisition"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectPrompt(indent)}
                                  className="btn-outline btn-sm"
                                  disabled={isProcessing}
                                  style={{ padding: '4px 8px', fontSize: '0.74rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                                  title="Reject requisition"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {/* Approved status actions: Issue / Transfer */}
                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => handleIssueTransfer(indent)}
                                className="btn-primary btn-sm"
                                disabled={isProcessing}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.74rem',
                                  background: 'var(--green-700)',
                                  borderColor: 'var(--green-700)'
                                }}
                                title="Physically issue approved items from store"
                              >
                                {isProcessing ? 'Issuing...' : 'Issue / Transfer'}
                              </button>
                            )}

                            {/* Issued / Completed status: View only (no additional buttons) */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

      {/* Indent Review / Approval Modal */}
      {isReviewModalOpen && selectedIndentForReview && (
        <IndentApprovalModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          indent={selectedIndentForReview}
          onIndentProcessed={handleIndentProcessed}
        />
      )}

      {/* Reject Confirmation Dialog */}
      {rejectModalData && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '16px'
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', color: '#b91c1c' }}>
              Reject Requisition {rejectModalData.indentNumber}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-600)', marginBottom: '16px' }}>
              Please provide a reason for rejecting this requisition submitted by{' '}
              <strong>{rejectModalData.requesterName || rejectModalData.requestedBy}</strong>. The faculty member will be notified.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="rejection-reason" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                Rejection Remarks / Reason:
              </label>
              <textarea
                id="rejection-reason"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Budget limit reached, alternative item recommended, or out of stock..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => setRejectModalData(null)}
                disabled={processingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={handleConfirmReject}
                disabled={processingId !== null}
                style={{ background: '#b91c1c', borderColor: '#b91c1c' }}
              >
                {processingId !== null ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageIndents;
