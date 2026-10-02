import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Loading from '../components/common/Loading';
import { masterDataApi } from '../services/api';

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // Confirmation / Safe-Delete Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null,
    department: null,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'danger',
    isBlocked: false
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE'
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterDataApi.getDepartments({ all: 'true' });
      const list = res.departments || res.data || [];
      setDepartments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load departments', err);
      setFeedback({ type: 'error', message: 'Failed to load departments. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Filtered list
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const name = (d.name || '').toLowerCase();
      const code = (d.code || '').toLowerCase();
      const desc = (d.description || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || code.includes(query) || desc.includes(query);

      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = d.active !== false && d.status !== 'INACTIVE';
      } else if (statusFilter === 'INACTIVE') {
        matchesStatus = d.active === false || d.status === 'INACTIVE';
      }

      return matchesSearch && matchesStatus;
    });
  }, [departments, searchTerm, statusFilter]);

  // KPIs
  const totalCount = departments.length;
  const activeCount = departments.filter((d) => d.active !== false && d.status !== 'INACTIVE').length;
  const inactiveCount = departments.filter((d) => d.active === false || d.status === 'INACTIVE').length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDepartments = filteredDepartments.slice(startIndex, startIndex + pageSize);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      status: 'ACTIVE'
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal (Reuses Faculty Edit styling and patterns)
  const handleOpenEdit = (dept) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      status: dept.active !== false && dept.status !== 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Submit Add
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Department name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Department code is required.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      await masterDataApi.createDepartment({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        active: formData.status === 'ACTIVE'
      });
      setFeedback({ type: 'success', message: 'Department created successfully.' });
      setIsAddModalOpen(false);
      fetchDepartments();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create department.');
    } finally {
      setSaving(false);
    }
  };

  // Submit Update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Department name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Department code is required.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      await masterDataApi.updateDepartment(selectedDept.id || selectedDept._id, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        active: formData.status === 'ACTIVE'
      });
      setFeedback({ type: 'success', message: 'Department updated successfully.' });
      setIsEditModalOpen(false);
      fetchDepartments();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update department.');
    } finally {
      setSaving(false);
    }
  };

  // Safe Delete prompt
  const handlePromptDelete = (dept) => {
    const usage = dept.usageCount || dept.referenceCount || 0;
    if (usage > 0) {
      setConfirmModal({
        isOpen: true,
        action: 'deactivate',
        department: dept,
        title: 'Cannot Delete Department',
        message: `This department is currently referenced by ${usage} record${usage === 1 ? '' : 's'} (users, faculty, indents, or transfers) and cannot be permanently deleted. Do you want to deactivate it instead?`,
        confirmText: 'Deactivate Department',
        confirmVariant: 'warning',
        isBlocked: true
      });
    } else {
      setConfirmModal({
        isOpen: true,
        action: 'delete',
        department: dept,
        title: 'Delete Department',
        message: `Are you sure you want to permanently delete department "${dept.name}" (${dept.code})?`,
        confirmText: 'Delete',
        confirmVariant: 'danger',
        isBlocked: false
      });
    }
  };

  // Confirm safe delete / deactivate
  const handleConfirmAction = async () => {
    const { action, department } = confirmModal;
    if (!department) return;

    try {
      const deptId = department.id || department._id;
      if (action === 'deactivate') {
        const res = await masterDataApi.updateDepartmentStatus(deptId, false);
        setFeedback({ type: 'success', message: res.message || 'Department deactivated successfully.' });
      } else if (action === 'delete') {
        const res = await masterDataApi.deleteDepartment(deptId);
        setFeedback({ type: 'success', message: res.message || 'Department deleted successfully.' });
      }
      setConfirmModal({ isOpen: false, action: null, department: null, title: '', message: '', confirmText: '', confirmVariant: 'danger', isBlocked: false });
      fetchDepartments();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      if (err.response?.status === 409) {
        setConfirmModal({
          isOpen: true,
          action: 'deactivate',
          department,
          title: 'Cannot Delete Department',
          message: err.response?.data?.message || 'This department is currently referenced and cannot be deleted. Deactivate it instead.',
          confirmText: 'Deactivate Department',
          confirmVariant: 'warning',
          isBlocked: true
        });
      } else {
        const errorMsg = err.response?.data?.message || `Failed to ${action} department.`;
        setFeedback({ type: 'error', message: errorMsg });
        setConfirmModal({ isOpen: false, action: null, department: null, title: '', message: '', confirmText: '', confirmVariant: 'danger', isBlocked: false });
        setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
      }
    }
  };

  return (
    <Layout
      title="Departments Management"
      breadcrumb="Master Data / Departments"
    >
      {/* Page Header */}
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>Departments</h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Manage academic and administrative departments for users, faculty, indents, and stock transfers.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={handleOpenAdd}>
            <span className="icon">＋</span> Add Department
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--blue-600, #2563eb)' }}>
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-500)', fontWeight: 600 }}>
            TOTAL DEPARTMENTS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--navy-900)', marginTop: '4px' }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', marginTop: '2px' }}>
            Registered departments
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-500)', fontWeight: 600 }}>
            ACTIVE DEPARTMENTS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', marginTop: '2px' }}>
            Available for selection
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-500)', fontWeight: 600 }}>
            INACTIVE DEPARTMENTS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>
            {inactiveCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', marginTop: '2px' }}>
            Deactivated records
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback.message && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '0.88rem',
            fontWeight: 500,
            background: feedback.type === 'error' ? 'var(--red-50, #fee2e2)' : '#dcfce7',
            color: feedback.type === 'error' ? 'var(--red-700, #b91c1c)' : '#15803d',
            border: `1px solid ${feedback.type === 'error' ? 'var(--red-200, #fecaca)' : '#bbf7d0'}`
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Search & Status Filter */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <input
                type="text"
                placeholder="Search departments by code, name, or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', padding: '7px 12px', fontSize: '0.86rem' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-400)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', background: 'var(--slate-100, #f1f5f9)', padding: '2px', borderRadius: '6px' }}>
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
            Showing {filteredDepartments.length} of {totalCount} departments
          </span>
        </div>
      </div>

      {/* Departments Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading message="Loading departments..." />
        ) : filteredDepartments.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No departments found matching your criteria.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th style={{ width: '160px' }}>Department Code</th>
                  <th>Department Name</th>
                  <th>Description</th>
                  <th style={{ width: '130px' }}>Associated Records</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDepartments.map((dept, idx) => {
                  const isActive = dept.active !== false && dept.status !== 'INACTIVE';
                  const usage = dept.usageCount || dept.referenceCount || 0;
                  const isInUse = usage > 0;

                  return (
                    <tr key={dept.id || dept._id || idx}>
                      <td>{startIndex + idx + 1}</td>
                      <td>
                        <code
                          style={{
                            background: 'var(--navy-50, #f8fafc)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            color: 'var(--navy-800, #1e293b)',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            fontSize: '0.86rem'
                          }}
                        >
                          {dept.code}
                        </code>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                        {dept.name}
                      </td>
                      <td style={{ color: 'var(--text-600)' }}>
                        {dept.description || '—'}
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
                          {usage} {usage === 1 ? 'record' : 'records'}
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
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(dept)}
                            title="Edit Department"
                            aria-label="Edit Department"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: '1px solid #bfdbfe',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <EditIcon />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handlePromptDelete(dept)}
                            title="Delete Department"
                            aria-label="Delete Department"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: '1px solid #fecaca',
                              background: '#fff5f5',
                              color: '#b91c1c',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-500)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Department Modal (Styled exactly like Faculty modal) */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
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
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                {formError && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'var(--red-50, #fee2e2)',
                      color: 'var(--red-700, #b91c1c)',
                      border: '1px solid var(--red-200, #fecaca)',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      fontSize: '0.85rem'
                    }}
                  >
                    {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="dept-add-code">Department Code *</label>
                    <input
                      id="dept-add-code"
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. EEE, CSE"
                      required
                      style={{ width: '100%', padding: '8px 12px', textTransform: 'uppercase' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="dept-add-name">Department Name *</label>
                    <input
                      id="dept-add-name"
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
                  <label htmlFor="dept-add-desc">Description</label>
                  <input
                    id="dept-add-desc"
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description or notes"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dept-add-status">Status</label>
                  <select
                    id="dept-add-status"
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

      {/* Edit Department Modal (Styled exactly like Faculty Edit modal) */}
      {isEditModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
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
                {formError && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'var(--red-50, #fee2e2)',
                      color: 'var(--red-700, #b91c1c)',
                      border: '1px solid var(--red-200, #fecaca)',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      fontSize: '0.85rem'
                    }}
                  >
                    {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="dept-edit-code">Department Code *</label>
                    <input
                      id="dept-edit-code"
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                      style={{ width: '100%', padding: '8px 12px', textTransform: 'uppercase' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="dept-edit-name">Department Name *</label>
                    <input
                      id="dept-edit-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label htmlFor="dept-edit-desc">Description</label>
                  <input
                    id="dept-edit-desc"
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dept-edit-status">Status</label>
                  <select
                    id="dept-edit-status"
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

      {/* Confirmation / Safe-Delete Modal */}
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
