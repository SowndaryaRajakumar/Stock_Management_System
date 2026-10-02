import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { facultyApi, masterDataApi } from '../services/api';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

// Standard action icons
const ViewIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const DeleteIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const DeactivateIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>
);

const ActivateIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export const Faculty = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [viewFaculty, setViewFaculty] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    employee_code: '',
    name: '',
    username: '',
    email: '',
    password: '',
    department_id: '',
    designation: 'Assistant Professor',
    phone: '',
    status: 'ACTIVE'
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null, // 'delete' | 'deactivate' | 'activate'
    faculty: null,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'danger',
    isBlocked: false
  });

  // Top alert feedback
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Fetch departments for filter & dropdowns
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await masterDataApi.getDepartments({ all: true });
      if (res.success) {
        setDepartments(res.departments || res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  }, []);

  // Fetch faculty list
  const fetchFaculty = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedDeptFilter) params.department_id = selectedDeptFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await facultyApi.getFaculty(params);
      if (res.success) {
        setFacultyList(res.data || res.faculty || []);
      }
    } catch (err) {
      console.error('Failed to fetch faculty:', err);
      setFeedback({ type: 'error', message: 'Failed to load faculty records.' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedDeptFilter, statusFilter]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  // Open Add Modal
  const handleOpenAdd = () => {
    const defaultDept = departments.length > 0 ? departments[0].id : '';
    setFormData({
      employee_code: '',
      name: '',
      username: '',
      email: '',
      password: '',
      department_id: defaultDept,
      designation: 'Assistant Professor',
      phone: '',
      status: 'ACTIVE'
    });
    setError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (faculty) => {
    setSelectedFaculty(faculty);
    setFormData({
      employee_code: faculty.employee_code || '',
      name: faculty.name || '',
      username: faculty.username || '',
      email: faculty.email || '',
      password: '', // Blank unless updating
      department_id: faculty.department_id || '',
      designation: faculty.designation || '',
      phone: faculty.phone || '',
      status: faculty.status || 'ACTIVE'
    });
    setError('');
    setIsEditModalOpen(true);
  };

  // Open View Modal (Read-Only)
  const handleOpenView = (faculty) => {
    setViewFaculty(faculty);
  };

  // Create Faculty
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_code.trim()) {
      setError('Employee code is required.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!formData.username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!formData.password) {
      setError('Password is required when creating a new faculty account.');
      return;
    }
    if (!formData.department_id) {
      setError('Please select a department.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const res = await facultyApi.createFaculty({
        ...formData,
        employee_code: formData.employee_code.trim().toUpperCase(),
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
        department_id: Number(formData.department_id)
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Faculty account created successfully.'
        });
        setIsAddModalOpen(false);
        fetchFaculty();
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create faculty account.');
    } finally {
      setSaving(false);
    }
  };

  // Update Faculty
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_code.trim()) {
      setError('Employee code is required.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!formData.department_id) {
      setError('Please select a department.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const updatePayload = {
        employee_code: formData.employee_code.trim().toUpperCase(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        department_id: Number(formData.department_id),
        designation: formData.designation,
        phone: formData.phone,
        status: formData.status
      };
      if (formData.password && formData.password.trim()) {
        updatePayload.password = formData.password.trim();
      }

      const res = await facultyApi.updateFaculty(selectedFaculty.id, updatePayload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Faculty details updated successfully.'
        });
        setIsEditModalOpen(false);
        fetchFaculty();
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update faculty account.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Action: always visible
  const handlePromptDelete = (faculty) => {
    setConfirmModal({
      isOpen: true,
      action: 'delete',
      faculty,
      title: 'Delete Faculty Account',
      message: `Are you sure you want to permanently delete faculty account "${faculty.name}" (${faculty.employee_code})?`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
      isBlocked: false
    });
  };

  // Deactivate Action: available for ACTIVE records
  const handlePromptDeactivate = (faculty) => {
    setConfirmModal({
      isOpen: true,
      action: 'deactivate',
      faculty,
      title: 'Deactivate Faculty Account',
      message: `Are you sure you want to deactivate faculty member "${faculty.name}" (${faculty.employee_code})?`,
      confirmText: 'Deactivate',
      confirmVariant: 'warning',
      isBlocked: false
    });
  };

  // Activate Action: available for INACTIVE records
  const handlePromptActivate = (faculty) => {
    setConfirmModal({
      isOpen: true,
      action: 'activate',
      faculty,
      title: 'Activate Faculty Account',
      message: `Do you want to activate faculty member "${faculty.name}" (${faculty.employee_code})?`,
      confirmText: 'Activate',
      confirmVariant: 'primary',
      isBlocked: false
    });
  };

  const handleConfirmAction = async () => {
    const { action, faculty } = confirmModal;
    if (!faculty) return;

    try {
      if (action === 'deactivate') {
        const res = await facultyApi.updateStatus(faculty.id, 'INACTIVE');
        setFeedback({ type: 'success', message: res.message || 'Faculty account deactivated successfully.' });
        setConfirmModal({ isOpen: false, action: null, faculty: null, title: '', message: '', confirmText: '', confirmVariant: 'danger', isBlocked: false });
      } else if (action === 'activate') {
        const res = await facultyApi.updateStatus(faculty.id, 'ACTIVE');
        setFeedback({ type: 'success', message: res.message || 'Faculty account activated successfully.' });
        setConfirmModal({ isOpen: false, action: null, faculty: null, title: '', message: '', confirmText: '', confirmVariant: 'danger', isBlocked: false });
      } else if (action === 'delete') {
        const res = await facultyApi.deleteFaculty(faculty.id);
        setFeedback({ type: 'success', message: res.message || 'Faculty account deleted successfully.' });
        setConfirmModal({ isOpen: false, action: null, faculty: null, title: '', message: '', confirmText: '', confirmVariant: 'danger', isBlocked: false });
      }
      fetchFaculty();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      if (err.response?.status === 409) {
        // Referenced record: display the safe Deactivate alternative
        setConfirmModal({
          isOpen: true,
          action: 'deactivate',
          faculty,
          title: 'Cannot Delete Faculty Account',
          message: 'This faculty account is associated with existing records and cannot be permanently deleted. Deactivate the account instead.',
          confirmText: 'Deactivate Account',
          confirmVariant: 'warning',
          isBlocked: true
        });
      } else {
        const errorMsg = err.response?.data?.message || `Failed to ${action} faculty account.`;
        setFeedback({ type: 'error', message: errorMsg });
        setConfirmModal({ isOpen: false, action: null, faculty: null, title: '', message: '', confirmText: '', confirmVariant: 'danger', isBlocked: false });
        setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
      }
    }
  };

  // KPIs
  const totalCount = facultyList.length;
  const activeCount = facultyList.filter(f => f.status === 'ACTIVE').length;
  const inactiveCount = facultyList.filter(f => f.status === 'INACTIVE').length;

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedFaculty = facultyList.slice(startIndex, startIndex + pageSize);

  return (
    <Layout
      title="Faculty Management"
      breadcrumb="Master Data / Faculty"
    >
      {/* Page Header */}
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>Faculty Management</h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Manage faculty accounts, departments and login access.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={handleOpenAdd}>
            <span className="icon">＋</span> Add Faculty
          </button>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--blue-600, #2563eb)' }}>
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-500)', fontWeight: 600 }}>
            TOTAL FACULTY
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--navy-900)', margin: '4px 0' }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-500)' }}>
            Registered academic accounts
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-500)', fontWeight: 600 }}>
            ACTIVE ACCOUNTS
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16a34a', margin: '4px 0' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-500)' }}>
            Permitted to login & raise indents
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-500)', fontWeight: 600 }}>
            DEACTIVATED ACCOUNTS
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', margin: '4px 0' }}>
            {inactiveCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-500)' }}>
            Login blocked / historical data preserved
          </div>
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: '1 1 540px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px' }}>
              <input
                type="text"
                placeholder="Search by name, employee code, username or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            </div>

            {/* Department Dropdown */}
            <div style={{ minWidth: '160px' }}>
              <select
                value={selectedDeptFilter}
                onChange={(e) => {
                  setSelectedDeptFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
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
            Showing {facultyList.length} of {totalCount} faculty accounts
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading message="Loading faculty accounts..." />
        ) : facultyList.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No faculty accounts found matching your search.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Employee Code</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFaculty.map((fac, idx) => {
                  const isActive = fac.status === 'ACTIVE';

                  return (
                    <tr key={fac.id || idx}>
                      <td>{startIndex + idx + 1}</td>
                      <td style={{ fontWeight: '700', color: 'var(--navy-900)' }}>
                        <code style={{ background: 'var(--navy-50)', padding: '2px 6px', borderRadius: '4px', color: 'var(--navy-800)' }}>
                          {fac.employee_code}
                        </code>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--navy-900)' }}>
                        {fac.name}
                      </td>
                      <td style={{ color: 'var(--text-600)' }}>
                        @{fac.username}
                      </td>
                      <td style={{ color: 'var(--text-600)' }}>
                        {fac.email}
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                          {fac.department_code || fac.department_name || fac.department || '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-600)' }}>
                        {fac.designation || '—'}
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
                            onClick={() => handleOpenEdit(fac)}
                            title="Edit Faculty"
                            aria-label="Edit Faculty"
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
                            onClick={() => handlePromptDelete(fac)}
                            title="Delete Faculty"
                            aria-label="Delete Faculty"
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

        <Pagination
          currentPage={currentPage}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Faculty</h2>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="fac-empcode">Employee Code *</label>
                    <input
                      id="fac-empcode"
                      type="text"
                      value={formData.employee_code}
                      onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                      placeholder="e.g. FAC002"
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fac-name">Full Name *</label>
                    <input
                      id="fac-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Dr. John Doe"
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="fac-user">Username *</label>
                    <input
                      id="fac-user"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. jdoe"
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fac-email">Email *</label>
                    <input
                      id="fac-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. jdoe@institution.edu"
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label htmlFor="fac-pwd">Initial Password *</label>
                  <input
                    id="fac-pwd"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Secure password for initial login"
                    required
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="fac-dept">Department *</label>
                    <select
                      id="fac-dept"
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="fac-desig">Designation</label>
                    <input
                      id="fac-desig"
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Assistant Professor"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="fac-phone">Phone</label>
                    <input
                      id="fac-phone"
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Optional contact number"
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fac-status">Status</label>
                    <select
                      id="fac-status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
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
                  {saving ? 'Creating...' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Faculty</h2>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="edit-empcode">Employee Code *</label>
                    <input
                      id="edit-empcode"
                      type="text"
                      value={formData.employee_code}
                      onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-name">Full Name *</label>
                    <input
                      id="edit-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="edit-user">Username</label>
                    <input
                      id="edit-user"
                      type="text"
                      value={formData.username}
                      disabled
                      style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--slate-100, #f1f5f9)', color: 'var(--text-500)', cursor: 'not-allowed' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-email">Email *</label>
                    <input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="edit-dept">Department *</label>
                    <select
                      id="edit-dept"
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-desig">Designation</label>
                    <input
                      id="edit-desig"
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="edit-phone">Phone</label>
                    <input
                      id="edit-phone"
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-status">Status</label>
                    <select
                      id="edit-status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-pwd">Change Password <span style={{ fontSize: '0.78rem', color: 'var(--text-400)', fontWeight: 'normal' }}>(Leave blank to keep current)</span></label>
                  <input
                    id="edit-pwd"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter new password only if changing"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
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

      {/* View Modal (Read-Only) */}
      {viewFaculty && (
        <div className="modal-backdrop" onClick={() => setViewFaculty(null)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>View Faculty</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setViewFaculty(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px 8px', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Employee Code:</span>
                <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{viewFaculty.employee_code}</span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Full Name:</span>
                <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{viewFaculty.name}</span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Username:</span>
                <span>@{viewFaculty.username}</span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Email:</span>
                <span>{viewFaculty.email}</span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Department:</span>
                <span>{viewFaculty.department_name || viewFaculty.department || 'Unassigned'}</span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Designation:</span>
                <span>{viewFaculty.designation || '—'}</span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Phone:</span>
                <span>{viewFaculty.phone || '—'}</span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Status:</span>
                <span>
                  <span
                    className={`badge ${viewFaculty.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}
                    style={{
                      backgroundColor: viewFaculty.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                      color: viewFaculty.status === 'ACTIVE' ? '#166534' : '#991b1b',
                      fontWeight: 600
                    }}
                  >
                    {viewFaculty.status}
                  </span>
                </span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Created Date:</span>
                <span style={{ color: 'var(--text-500)' }}>
                  {viewFaculty.created_at ? new Date(viewFaculty.created_at).toLocaleString() : '—'}
                </span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Updated Date:</span>
                <span style={{ color: 'var(--text-500)' }}>
                  {viewFaculty.updated_at ? new Date(viewFaculty.updated_at).toLocaleString() : '—'}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewFaculty(null)}
              >
                Close
              </button>
            </div>
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

export default Faculty;
