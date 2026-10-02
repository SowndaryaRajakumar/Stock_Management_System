import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import IndentApprovalModal from '../components/indents/IndentApprovalModal';
import { indentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';

export const IndentDetails = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [indent, setIndent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [completing, setCompleting] = useState(false);

  const fetchIndent = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await indentApi.getIndentById(id);
      if (res.success) {
        setIndent(res.indent);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load indent details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIndent();
  }, [fetchIndent]);

  const handleIndentProcessed = (updatedIndent) => {
    setIndent(updatedIndent);
    setSuccessToast(`Indent ${updatedIndent.indentNumber} successfully processed!`);
    setTimeout(() => setSuccessToast(''), 5000);
  };

  const handleCompleteIndent = async () => {
    if (!window.confirm(`Mark Indent ${indent.indentNumber} as completed (physically fulfilled offline)?\n\nNote: This records physical fulfillment. To record the stock deduction in inventory, visit the Transfer module.`)) {
      return;
    }
    try {
      setCompleting(true);
      setError('');
      const res = await indentApi.completeIndent(indent._id || indent.id);
      if (res.success) {
        setIndent(res.indent);
        setSuccessToast(`Indent ${indent.indentNumber} marked as completed (physically fulfilled).`);
        setTimeout(() => setSuccessToast(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete indent.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading message="Loading indent record..." />
      </Layout>
    );
  }

  if (error || !indent) {
    return (
      <Layout>
        <div className="content-area">
          <div className="login-error-box" style={{ marginBottom: '20px' }}>
            <span>⚠</span>
            <span>{error || 'Indent not found.'}</span>
          </div>
          <Button variant="outline" onClick={() => navigate('/indents')}>
            ← Back to Indents
          </Button>
        </div>
      </Layout>
    );
  }

  const isPending = indent.status === 'SUBMITTED' || indent.status === 'PENDING' || indent.status === 'DRAFT';
  const canReview = isAdmin && ['SUBMITTED', 'PENDING', 'RECOMMENDED'].includes(indent.status);

  return (
    <Layout
      title={`Requisition ${indent.indentNumber}`}
      breadcrumb={`Indents / ${indent.indentNumber}`}
    >
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <Link to="/indents" style={{ fontSize: '0.85rem', color: 'var(--blue-600)', textDecoration: 'none' }}>
                ← Back to Indents
              </Link>
              <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Requisition {indent.indentNumber}</h1>
              <StatusBadge status={indent.status} />
            </div>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Submitted by <strong>{indent.requesterName || indent.requestedBy}</strong> for <strong>{indent.department}</strong> on{' '}
              {indent.requestDate || indent.date}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {canReview && (
              <Button variant="primary" onClick={() => setIsReviewModalOpen(true)}>
                <span className="icon">✓</span> Review & Decide
              </Button>
            )}
            {isAdmin && (indent.status === 'APPROVED' || indent.status === 'PARTIALLY_APPROVED') && (
              <Button
                variant="primary"
                onClick={handleCompleteIndent}
                disabled={completing}
                title="Mark this approved indent as physically fulfilled offline (does not alter stock)"
              >
                {completing ? 'Completing...' : '✓ Mark as Completed'}
              </Button>
            )}
            {isAdmin && (indent.status === 'APPROVED' || indent.status === 'PARTIALLY_APPROVED' || indent.status === 'COMPLETED') && (
              <Link
                to="/transfers"
                className="btn-outline"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Go to Transfer module to record offline stock transfer"
              >
                ↗ Record Transfer
              </Link>
            )}
            <button
              type="button"
              className="btn-outline"
              onClick={() => window.print()}
            >
              🖨 Print Slip
            </button>
          </div>
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

        {/* Indent Status Lifecycle Tracking */}
        <div className="card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--navy-900)' }}>
              Requisition Lifecycle Tracking
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Indent: <strong>{indent.indentNumber}</strong>
            </span>
          </div>

          {indent.status === 'REJECTED' ? (
            /* Rejected Lifecycle (3 Steps: Submitted -> Under Review -> Rejected) */
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', padding: '10px 0' }}>
              {/* Step 1: Submitted */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '120px', zIndex: 2 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--green-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.88rem', boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }}>
                  ✓
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: '8px', color: 'var(--navy-900)' }}>Submitted</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{indent.requestDate || indent.date}</span>
              </div>

              {/* Connector Line 1 */}
              <div style={{ flex: 1, height: '3px', background: 'var(--green-500)', margin: '0 8px', alignSelf: 'center', marginBottom: '22px' }} />

              {/* Step 2: Under Review */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '120px', zIndex: 2 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--green-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.88rem', boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }}>
                  ✓
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: '8px', color: 'var(--navy-900)' }}>Under Review</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Reviewed</span>
              </div>

              {/* Connector Line 2 */}
              <div style={{ flex: 1, height: '3px', background: 'var(--red-500)', margin: '0 8px', alignSelf: 'center', marginBottom: '22px' }} />

              {/* Step 3: Rejected */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '120px', zIndex: 2 }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--red-600)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.88rem',
                  boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
                  outline: '3px solid #fecaca'
                }}>
                  ✕
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: '8px', color: 'var(--red-700)' }}>Rejected</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {indent.reviewedBy ? `By ${indent.reviewedBy}` : (indent.approvedBy ? `By ${indent.approvedBy}` : 'By Admin')}
                </span>
              </div>
            </div>
          ) : (
            /* Standard / Approved Lifecycle (4 Steps: Submitted -> Under Review -> Approved -> Completed) */
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', padding: '10px 0' }}>
              {/* Step 1: Submitted */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '110px', zIndex: 2 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--green-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.88rem', boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }}>
                  ✓
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: '8px', color: 'var(--navy-900)' }}>Submitted</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{indent.requestDate || indent.date}</span>
              </div>

              {/* Connector Line 1 */}
              <div style={{
                flex: 1,
                height: '3px',
                background: 'var(--green-500)',
                margin: '0 8px',
                alignSelf: 'center',
                marginBottom: '22px'
              }} />

              {/* Step 2: Under Review */}
              {(() => {
                const isUnderReviewActive = indent.status === 'PENDING' || indent.status === 'SUBMITTED' || indent.status === 'DRAFT';
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '110px', zIndex: 2 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isUnderReviewActive ? 'var(--amber-500)' : 'var(--green-600)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.88rem',
                      boxShadow: isUnderReviewActive ? '0 2px 8px rgba(245,158,11,0.4)' : '0 2px 6px rgba(16,185,129,0.3)',
                      outline: isUnderReviewActive ? '3px solid #fef3c7' : 'none'
                    }}>
                      {isUnderReviewActive ? '⏳' : '✓'}
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: '8px', color: isUnderReviewActive ? 'var(--amber-800)' : 'var(--navy-900)' }}>
                      Under Review
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {isUnderReviewActive ? 'Pending Admin Action' : 'Reviewed'}
                    </span>
                  </div>
                );
              })()}

              {/* Connector Line 2 */}
              <div style={{
                flex: 1,
                height: '3px',
                background: (indent.status === 'PENDING' || indent.status === 'SUBMITTED' || indent.status === 'DRAFT')
                  ? 'var(--border)'
                  : 'var(--green-500)',
                margin: '0 8px',
                alignSelf: 'center',
                marginBottom: '22px'
              }} />

              {/* Step 3: Approved */}
              {(() => {
                const isApprovedActive = indent.status === 'APPROVED' || indent.status === 'PARTIALLY_APPROVED';
                const isPastApproved = indent.status === 'COMPLETED' || indent.status === 'ISSUED';
                const isApprovedOrPast = isApprovedActive || isPastApproved;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '110px', zIndex: 2 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isApprovedOrPast ? 'var(--green-600)' : 'var(--gray-300)',
                      color: isApprovedOrPast ? '#fff' : 'var(--text-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.88rem',
                      boxShadow: isApprovedActive ? '0 2px 8px rgba(16,185,129,0.4)' : 'none',
                      outline: isApprovedActive ? '3px solid #d1fae5' : 'none'
                    }}>
                      {isApprovedOrPast ? '✓' : '3'}
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: isApprovedActive ? 700 : 600, marginTop: '8px', color: isApprovedActive ? 'var(--green-800)' : 'var(--navy-900)' }}>
                      {indent.status === 'PARTIALLY_APPROVED' ? 'Partially Approved' : 'Approved'}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {isApprovedOrPast
                        ? (indent.reviewedBy ? `By ${indent.reviewedBy}` : (indent.approvedBy ? `By ${indent.approvedBy}` : 'By Admin'))
                        : 'Pending Approval'}
                    </span>
                  </div>
                );
              })()}

              {/* Connector Line 3 */}
              <div style={{
                flex: 1,
                height: '3px',
                background: (indent.status === 'COMPLETED' || indent.status === 'ISSUED') ? 'var(--green-500)' : 'var(--border)',
                margin: '0 8px',
                alignSelf: 'center',
                marginBottom: '22px'
              }} />

              {/* Step 4: Completed */}
              {(() => {
                const isCompleted = indent.status === 'COMPLETED' || indent.status === 'ISSUED';
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '110px', zIndex: 2 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isCompleted ? 'var(--green-600)' : 'var(--gray-300)',
                      color: isCompleted ? '#fff' : 'var(--text-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.88rem',
                      boxShadow: isCompleted ? '0 2px 8px rgba(16,185,129,0.4)' : 'none',
                      outline: isCompleted ? '3px solid #d1fae5' : 'none'
                    }}>
                      {isCompleted ? '✓' : '4'}
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: isCompleted ? 700 : 600, marginTop: '8px', color: isCompleted ? 'var(--green-800)' : 'var(--navy-900)' }}>
                      Completed
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {isCompleted ? 'Physically Fulfilled' : 'Pending Fulfillment'}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Overview cards */}
        <div className="grid-3col" style={{ marginBottom: '24px' }}>
          <div className="card">
            <div className="card-head">
              <span className="card-title">Department & Requester</span>
            </div>
            <div className="card-body" style={{ fontSize: '0.88rem' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Department:</span>{' '}
                <strong>{indent.department}</strong>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Faculty / Staff:</span>{' '}
                <strong>{indent.requesterName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Purpose:</span>{' '}
                <strong>{indent.purpose}</strong>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <span className="card-title">Timeline & Schedule</span>
            </div>
            <div className="card-body" style={{ fontSize: '0.88rem' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date Requested:</span>{' '}
                <strong>{indent.requestDate}</strong>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Required By:</span>{' '}
                <strong style={{ color: 'var(--blue-700)' }}>{indent.requiredDate}</strong>
              </div>
              {indent.reviewedDate && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Reviewed On:</span>{' '}
                  <strong>{indent.reviewedDate}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <span className="card-title">Approval & Review Status</span>
            </div>
            <div className="card-body" style={{ fontSize: '0.88rem' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
                <StatusBadge status={indent.status} />
              </div>
              {indent.reviewedBy && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reviewed By:</span>{' '}
                  <strong>{indent.reviewedBy}</strong>
                </div>
              )}
              {indent.adminRemarks && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Admin Note:</span>{' '}
                  <em>{indent.adminRemarks}</em>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <span className="card-title">Requisition Item Details</span>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {indent.items?.length || 0} line items
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item #</th>
                    <th>Product Details</th>
                    <th>Stock Register</th>
                    <th>Requested Qty</th>
                    <th>Approved Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {indent.items?.map((item, index) => {
                    const reqQty = item.requestedQuantity !== undefined ? item.requestedQuantity : (item.quantityRequired || 0);
                    const appQty = item.approvedQuantity !== undefined ? item.approvedQuantity : (item.quantityApproved || 0);

                    return (
                      <tr key={index}>
                        <td style={{ fontWeight: 600 }}>{index + 1}</td>
                        <td>
                          <div className="cell-strong">{item.productName}</div>
                          <span className="code">{item.productCode}</span>
                        </td>
                        <td>
                          <span className="badge badge-blue">{item.stockRegister || 'SR1'}</span>
                        </td>
                        <td>
                          <strong>
                            {reqQty} {item.unit || 'Pieces'}
                          </strong>
                        </td>
                        <td>
                          <strong
                            style={{
                              color:
                                appQty > 0
                                  ? 'var(--green-700)'
                                  : isPending
                                  ? 'var(--text-muted)'
                                  : 'var(--red-600)'
                            }}
                          >
                            {isPending ? '—' : `${appQty} ${item.unit || 'Pieces'}`}
                          </strong>
                        </td>
                        <td>
                          {isPending ? (
                            <span className="badge badge-amber">Awaiting Review</span>
                          ) : appQty === reqQty && appQty > 0 ? (
                            <span className="badge badge-green">Fully Approved</span>
                          ) : appQty > 0 ? (
                            <span className="badge badge-amber">Partially Approved</span>
                          ) : (
                            <span className="badge badge-red">Rejected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Remarks / Justification */}
        {indent.remarks && (
          <div className="card">
            <div className="card-head">
              <span className="card-title">Faculty Remarks / Justification</span>
            </div>
            <div className="card-body">
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {indent.remarks}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <IndentApprovalModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          indent={indent}
          onIndentProcessed={handleIndentProcessed}
        />
      )}
    </Layout>
  );
};

export default IndentDetails;
