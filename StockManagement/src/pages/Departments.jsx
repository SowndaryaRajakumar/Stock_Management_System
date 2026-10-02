import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { masterDataApi } from '../services/api';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

// Standard action icons matching project style
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

export const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Add / Edit Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'ACTIVE'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null, // 'delete' | 'deactivate'
    dept: null,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'danger',
    isBlocked: false
  });

  // Top alert feedback
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchDepartments = useCallback(async () => {
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

      const res = await masterDataApi.getDepartments(params);
      if (res.success) {
        setDepartments(res.departments || res.data || []);
        setTotalItems(res.total !== undefined ? res.total : (res.departments?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setFeedback({ type: 'error', message: 'Failed to load departments from database.' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleOpenAdd = () => {
    setSelectedDept(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      status: 'ACTIVE'
    });
    setError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setSelectedDept(dept);
    setFormData({
      code: dept.code || '',
      name: dept.name || '',
      description: dept.description || '',
      status: dept.active !== false ? 'ACTIVE' : 'INACTIVE'
    });
    setError('');
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setError('Department code is required.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Department name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await masterDataApi.createDepartment({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        active: formData.status === 'ACTIVE'
      });
      setFeedback({ type: 'success', message: 'Department created successfully.' });
      setIsAddModalOpen(false);
      fetchDepartments();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create department.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setError('Department code is required.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Department name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await masterDataApi.updateDepartment(selectedDept.id || selectedDept._id, {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        active: formData.status === 'ACTIVE'
      });
      setFeedback({ type: 'success', message: 'Department updated successfully.' });
      setIsEditModalOpen(false);
      fetchDepartments();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update department.');
    } finally {
      setSaving(false);
    }
  };

  // Safe delete handler: verifies reference usage
  const handlePromptDelete = (dept) => {
    const count = dept.usageCount || dept.referenceCount || 0;
    if (count > 0) {
      setConfirmModal({
        isOpen: true,
        action: 'deactivate',
        dept,
        title: 'Delete Department',
        message: `This department is currently referenced by ${count} record${count === 1 ? '' : 's'} (users, faculty, indents, or transfers) and cannot be permanently deleted. Do you want to deactivate it instead?`,
        confirmText: 'Deactivate Department',
        confirmVariant: 'warning',
        isBlocked: true
      });
    } else {
      setConfirmModal({
        isOpen: true,
        action: 'delete',
        dept,
        title: 'Delete Department',
        message: `Are you sure you want to permanently delete department "${dept.name}" (${dept.code})? This action cannot be undone.`,
        confirmText: 'Delete Department',
        confirmVariant: 'danger',
        isBlocked: false
      });
    }
  };

  const handleConfirmAction = async () => {
    const { action, dept } = confirmModal;
    if (!dept) return;

    try {
      const deptId = dept.id || dept._id;
      if (action === 'deactivate') {
        const res = await masterDataApi.deleteDepartment(deptId, { deactivate: 'true' });
        setFeedback({
          type: 'success',
          message: res.message || `Department "${dept.name}" deactivated successfully.`
        });
      } else {
        const res = await masterDataApi.deleteDepartment(deptId);
        setFeedback({
          type: 'success',
          message: res.message || `Department "${dept.name}" deleted successfully.`
        });
      }
      setConfirmModal({ ...confirmModal, isOpen: false });
      fetchDepartments();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      if (err.response?.data?.inUse) {
        // Backend prevented hard delete due to references
        setConfirmModal({
          isOpen: true,
          action: 'deactivate',
          dept,
          title: 'Referenced Department',
          message: err.response.data.message || 'This department is in use and cannot be permanently deleted. Deactivate it instead?',
          confirmText: 'Deactivate Department',
          confirmVariant: 'warning',
          isBlocked: true
        });
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Operation failed.'
        });
        setConfirmModal({ ...confirmModal, isOpen: false });
        setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
      }
    }
  };

  return (
    <Layout
      title="Departments"
      breadcrumb="Central Store / Master Data / Departments"
    >
      {/* Page Header */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--navy-900)' }}>
              Departments
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Define and manage academic and administrative departments.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={handleOpenAdd}>
            <span className="icon">＋</span> Add Department
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
                placeholder="Search department code or name..."
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
            Showing {departments.length} of {totalItems} departments
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading message="Loading departments..." />
        ) : departments.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No departments found matching your search.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Department Code</th>
                  <th>Department Name</th>
                  <th style={{ width: '110px' }}>Status</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, idx) => {
                  const isActive = dept.active !== false;

                  return (
                    <tr key={dept.id || dept._id || idx}>
                      <td>
                        <code style={{ background: 'var(--navy-50)', padding: '3px 8px', borderRadius: '4px', color: 'var(--navy-800)', fontWeight: 700, fontSize: '0.9rem' }}>
                          {dept.code}
                        </code>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--navy-900)' }}>
                        {dept.name}
                        {dept.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-500)', fontWeight: 'normal', marginTop: '2px' }}>
                            {dept.description}
                          </div>
                        )}
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
                            onClick={() => handleOpenEdit(dept)}
                            title="Edit Department"
                            aria-label="Edit Department"
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
                            onClick={() => handlePromptDelete(dept)}
                            title="Delete Department"
                            aria-label="Delete Department"
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

        {totalItems > pageSize && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalItems / pageSize)}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Department</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="dept-code">Department Code *</label>
                    <input
                      id="dept-code"
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. EEE"
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="dept-name">Department Name *</label>
                    <input
                      id="dept-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Electrical & Electronics Engineering"
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label htmlFor="dept-desc">Description</label>
                  <textarea
                    id="dept-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description or notes about this department"
                    rows="3"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dept-status">Status</label>
                  <select
                    id="dept-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal (Matches Faculty Edit UI Structure & Styling) */}
      {isEditModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Department</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="edit-dept-code">Department Code *</label>
                    <input
                      id="edit-dept-code"
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-dept-name">Department Name *</label>
                    <input
                      id="edit-dept-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label htmlFor="edit-dept-desc">Description</label>
                  <textarea
                    id="edit-dept-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-dept-status">Status</label>
                  <select
                    id="edit-dept-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
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

export default Departments;
