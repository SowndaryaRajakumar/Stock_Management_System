import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { masterDataApi } from '../services/api';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

// Standard action icons
const EditIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const DeleteIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export const StockRegisters = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Add / Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null, // 'delete' | 'deactivate' | 'activate'
    doc: null,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'danger',
    isBlocked: false
  });

  // Top alert feedback
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        all: true,
        search: searchTerm,
        page: currentPage,
        limit: pageSize
      };
      if (statusFilter === 'ACTIVE') params.status = 'active';
      if (statusFilter === 'INACTIVE') params.status = 'inactive';

      const res = await masterDataApi.getStockDocuments(params);
      if (res.success) {
        setDocuments(res.documents || res.stockDocuments || res.data || []);
        setTotalItems(res.total !== undefined ? res.total : (res.documents?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch stock registers:', err);
      setFeedback({ type: 'error', message: 'Failed to load stock registers from database.' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedDoc(null);
    setFormData({ name: '', description: '', active: true });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setIsEditMode(true);
    setSelectedDoc(doc);
    setFormData({
      name: doc.name || doc.code || '',
      description: doc.description || '',
      active: doc.active !== false
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Register code is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (isEditMode && selectedDoc) {
        await masterDataApi.updateStockDocument(selectedDoc._id, {
          name: formData.name.trim().toUpperCase(),
          documentCode: formData.name.trim().toUpperCase(),
          description: formData.description,
          active: formData.active
        });
        setFeedback({
          type: 'success',
          message: 'Stock register updated successfully.'
        });
      } else {
        await masterDataApi.createStockDocument({
          name: formData.name.trim().toUpperCase(),
          documentCode: formData.name.trim().toUpperCase(),
          description: formData.description,
          active: formData.active
        });
        setFeedback({
          type: 'success',
          message: 'Stock register created successfully.'
        });
      }
      setIsModalOpen(false);
      fetchDocuments();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save stock register.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Action: always visible, checks reference usage
  const handlePromptDelete = (doc) => {
    const count = doc.usageCount || 0;
    const inUse = doc.isReferenced || count > 0;

    if (inUse) {
      setConfirmModal({
        isOpen: true,
        action: 'deactivate',
        doc,
        title: 'Delete Stock Register',
        message: `This stock register is currently used by ${count || 1} product(s) and cannot be deleted. Deactivate it instead.`,
        confirmText: 'Deactivate Register',
        confirmVariant: 'warning',
        isBlocked: true
      });
    } else {
      setConfirmModal({
        isOpen: true,
        action: 'delete',
        doc,
        title: 'Delete Stock Register',
        message: 'Are you sure you want to permanently delete this stock register?',
        confirmText: 'Delete',
        confirmVariant: 'danger',
        isBlocked: false
      });
    }
  };

  // Deactivate Action: available for ACTIVE records
  const handlePromptDeactivate = (doc) => {
    setConfirmModal({
      isOpen: true,
      action: 'deactivate',
      doc,
      title: 'Deactivate Stock Register',
      message: 'Are you sure you want to deactivate this stock register?',
      confirmText: 'Deactivate',
      confirmVariant: 'warning',
      isBlocked: false
    });
  };

  // Activate Action: available for INACTIVE records
  const handlePromptActivate = (doc) => {
    setConfirmModal({
      isOpen: true,
      action: 'activate',
      doc,
      title: 'Activate Stock Register',
      message: 'Do you want to activate this stock register?',
      confirmText: 'Activate',
      confirmVariant: 'primary',
      isBlocked: false
    });
  };

  const handleConfirmAction = async () => {
    const { action, doc } = confirmModal;
    if (!doc) return;

    try {
      if (action === 'deactivate') {
        const res = await masterDataApi.updateStockDocumentStatus(doc._id, false);
        setFeedback({ type: 'success', message: res.message || 'Stock register deactivated successfully.' });
      } else if (action === 'activate') {
        const res = await masterDataApi.updateStockDocumentStatus(doc._id, true);
        setFeedback({ type: 'success', message: res.message || 'Stock register activated successfully.' });
      } else if (action === 'delete') {
        const res = await masterDataApi.deleteStockDocument(doc._id);
        setFeedback({ type: 'success', message: res.message || 'Stock register deleted successfully.' });
      }
      setConfirmModal({ isOpen: false, action: null, doc: null, title: '', message: '', confirmText: '', confirmVariant: 'danger', isBlocked: false });
      fetchDocuments();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || `Failed to ${action} stock register.`;
      setFeedback({ type: 'error', message: errorMsg });
      setConfirmModal({ isOpen: false, action: null, doc: null, title: '', message: '', confirmText: '', confirmVariant: 'danger', isBlocked: false });
      setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
    }
  };

  return (
    <Layout
      title="Stock Register Documents"
      breadcrumb="Master Data / Stock Registers"
    >
      {/* Header section */}
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>Stock Register Documents</h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Define physical register books mapped to offline record ledgers.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={handleOpenAdd}>
            <span className="icon">＋</span> Add Stock Register
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback.message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '0.88rem',
            background: feedback.type === 'error' ? 'var(--red-50)' : 'var(--green-50)',
            color: feedback.type === 'error' ? 'var(--red-700)' : 'var(--green-700)',
            border: `1px solid ${feedback.type === 'error' ? 'var(--red-200)' : 'var(--green-200)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', message: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '16px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: '1 1 320px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px' }}>
              <input
                type="text"
                placeholder="Search register code or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            </div>
            {/* Status Segmented Buttons */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--slate-100, #f1f5f9)', padding: '3px', borderRadius: '6px' }}>
              {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: statusFilter === st ? '#ffffff' : 'transparent',
                    color: statusFilter === st ? 'var(--blue-700, #0369a1)' : 'var(--text-600, #64748b)',
                    boxShadow: statusFilter === st ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {documents.length} of {totalItems} registers
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading message="Loading stock registers..." />
        ) : documents.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No stock registers found matching your search.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Register Code</th>
                  <th>Description</th>
                  <th style={{ width: '130px' }}>Usage</th>
                  <th style={{ width: '110px' }}>Status</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, idx) => {
                  const isInUse = Boolean(doc.isReferenced || (doc.usageCount && doc.usageCount > 0));
                  const isActive = doc.active !== false;

                  return (
                    <tr key={doc._id || idx}>
                      <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td style={{ fontWeight: '700', color: 'var(--blue-700)', fontSize: '0.95rem' }}>
                        {doc.name || doc.code}
                      </td>
                      <td style={{ color: 'var(--text-600)' }}>
                        {doc.description || '—'}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: isInUse ? '#e0f2fe' : '#f1f5f9',
                            color: isInUse ? '#0369a1' : '#64748b',
                            fontWeight: 600
                          }}
                        >
                          {doc.usageCount || 0} {doc.usageCount === 1 ? 'product' : 'products'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}
                          style={{
                            backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                            color: isActive ? '#166534' : '#991b1b',
                            fontWeight: 600
                          }}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          {/* Edit Icon Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(doc)}
                            title="Edit Stock Register"
                            aria-label="Edit Stock Register"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              padding: '0',
                              borderRadius: '6px',
                              border: '1px solid #bfdbfe',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <EditIcon />
                          </button>

                          {/* Delete Icon Button */}
                          <button
                            type="button"
                            onClick={() => handlePromptDelete(doc)}
                            title="Delete Stock Register"
                            aria-label="Delete Stock Register"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              padding: '0',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              background: '#fff5f5',
                              color: '#b91c1c',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <DeleteIcon />
                          </button>
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditMode ? 'Edit Stock Register' : 'Add Stock Register'}</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'var(--red-50)',
                      color: 'var(--red-700)',
                      border: '1px solid var(--red-200)',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      fontSize: '0.85rem'
                    }}
                  >
                    {error}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label htmlFor="doc-code">Register Code *</label>
                  <input
                    id="doc-code"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. CSSR1, SR1, SR2, SR3"
                    required
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label htmlFor="doc-desc">Description / Physical Book Purpose</label>
                  <textarea
                    id="doc-desc"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Central stock register CSSR1 for general inventory"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="doc-status">Status</label>
                  <select
                    id="doc-status"
                    value={formData.active ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === 'active' })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save Stock Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{confirmModal.title}</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 16px 0', fontSize: '0.92rem', lineHeight: '1.5', color: 'var(--text-700)' }}>
                {confirmModal.message}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={
                  confirmModal.confirmVariant === 'warning'
                    ? 'btn-outline'
                    : confirmModal.confirmVariant === 'primary'
                    ? 'btn-primary'
                    : 'btn-danger'
                }
                style={confirmModal.confirmVariant === 'warning' ? {
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  borderColor: '#f59e0b',
                  fontWeight: 600
                } : {}}
                onClick={handleConfirmAction}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StockRegisters;
