import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { masterDataApi } from '../services/api';
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

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // View Modal state
  const [viewCategory, setViewCategory] = useState(null);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null, // 'delete' | 'deactivate' | 'activate'
    category: null,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'danger',
    isBlocked: false
  });

  // Top alert feedback
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchCategories = useCallback(async () => {
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

      const res = await masterDataApi.getCategories(params);
      if (res.success) {
        setCategories(res.categories || res.data || []);
        setTotalItems(res.total !== undefined ? res.total : (res.categories?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setFeedback({ type: 'error', message: 'Failed to load categories from database.' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedCategory(null);
    setFormData({ name: '', description: '', active: true });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setIsEditMode(true);
    setSelectedCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      active: cat.active !== false
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenView = (cat) => {
    setViewCategory(cat);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (isEditMode && selectedCategory) {
        await masterDataApi.updateCategory(selectedCategory._id, {
          name: formData.name.trim(),
          description: formData.description,
          active: formData.active
        });
        setFeedback({ type: 'success', message: 'Category updated successfully.' });
      } else {
        await masterDataApi.createCategory({
          name: formData.name.trim(),
          description: formData.description,
          active: formData.active
        });
        setFeedback({ type: 'success', message: 'Category created successfully.' });
      }
      setIsModalOpen(false);
      fetchCategories();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Action: always visible, checks reference usage
  const handlePromptDelete = (cat) => {
    const count = cat.usageCount || 0;
    if (count > 0) {
      setConfirmModal({
        isOpen: true,
        action: 'deactivate',
        category: cat,
        title: 'Delete Category',
        message: `This category is currently used by ${count} product${count === 1 ? '' : 's'} and cannot be permanently deleted. Do you want to deactivate it instead?`,
        confirmText: 'Deactivate Category',
        confirmVariant: 'warning',
        isBlocked: true
      });
    } else {
      setConfirmModal({
        isOpen: true,
        action: 'delete',
        category: cat,
        title: 'Delete Category',
        message: 'Are you sure you want to permanently delete this category?',
        confirmText: 'Delete',
        confirmVariant: 'danger',
        isBlocked: false
      });
    }
  };

  // Deactivate Action: available for ACTIVE records
  const handlePromptDeactivate = (cat) => {
    setConfirmModal({
      isOpen: true,
      action: 'deactivate',
      category: cat,
      title: 'Deactivate Category',
      message: 'Are you sure you want to deactivate this category?',
      confirmText: 'Deactivate',
      confirmVariant: 'warning',
      isBlocked: false
    });
  };

  // Activate Action: available for INACTIVE records
  const handlePromptActivate = (cat) => {
    setConfirmModal({
      isOpen: true,
      action: 'activate',
      category: cat,
      title: 'Activate Category',
      message: 'Do you want to activate this category?',
      confirmText: 'Activate',
      confirmVariant: 'primary',
      isBlocked: false
    });
  };

  const handleConfirmAction = async () => {
    const { action, category } = confirmModal;
    if (!category) return;

    try {
      if (action === 'deactivate') {
        const res = await masterDataApi.updateCategoryStatus(category._id, false);
        setFeedback({ type: 'success', message: res.message || 'Category deactivated successfully.' });
      } else if (action === 'activate') {
        const res = await masterDataApi.updateCategoryStatus(category._id, true);
        setFeedback({ type: 'success', message: res.message || 'Category activated successfully.' });
      } else if (action === 'delete') {
        const res = await masterDataApi.deleteCategory(category._id);
        setFeedback({ type: 'success', message: res.message || 'Category deleted successfully.' });
      }
      setConfirmModal({ isOpen: false, action: null, category: null, title: '', message: '', confirmText: '', confirmVariant: 'danger', isBlocked: false });
      fetchCategories();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || `Failed to ${action} category.`;
      setFeedback({ type: 'error', message: errorMsg });
      setConfirmModal({ isOpen: false, action: null, category: null, title: '', message: '', confirmText: '', confirmVariant: 'danger', isBlocked: false });
      setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
    }
  };

  return (
    <Layout
      title="Category Management"
      breadcrumb="Master Data / Categories"
    >
      {/* Header section */}
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>Category Management</h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Define and manage hardware component classifications.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={handleOpenAdd}>
            <span className="icon">＋</span> Add Category
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
                placeholder="Search category name or description..."
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
            Showing {categories.length} of {totalItems} categories
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading message="Loading categories..." />
        ) : categories.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No categories found matching your search.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th style={{ width: '130px' }}>Usage</th>
                  <th style={{ width: '110px' }}>Status</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, idx) => {
                  const usage = cat.usageCount || 0;
                  const isInUse = usage > 0;
                  const isActive = cat.active !== false;

                  return (
                    <tr key={cat._id || idx}>
                      <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td style={{ fontWeight: '600', color: 'var(--navy-900)' }}>
                        {cat.name}
                      </td>
                      <td style={{ color: 'var(--text-600)' }}>
                        {cat.description || '—'}
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
                          {usage} {usage === 1 ? 'product' : 'products'}
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
                            onClick={() => handleOpenEdit(cat)}
                            title="Edit Category"
                            aria-label="Edit Category"
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
                            onClick={() => handlePromptDelete(cat)}
                            title="Delete Category"
                            aria-label="Delete Category"
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
              <h2>{isEditMode ? 'Edit Category' : 'Add Category'}</h2>
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
                  <label htmlFor="cat-name">Category Name *</label>
                  <input
                    id="cat-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Storage Devices, Processors, Networking"
                    required
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label htmlFor="cat-desc">Description</label>
                  <textarea
                    id="cat-desc"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this category..."
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cat-status">Status</label>
                  <select
                    id="cat-status"
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
                  {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal (Read-Only) */}
      {viewCategory && (
        <div className="modal-backdrop" onClick={() => setViewCategory(null)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>View Category</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setViewCategory(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px 8px', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Category Name:</span>
                <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{viewCategory.name}</span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Description:</span>
                <span>{viewCategory.description || '—'}</span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Product Usage:</span>
                <span>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: (viewCategory.usageCount || 0) > 0 ? '#e0f2fe' : '#f1f5f9',
                      color: (viewCategory.usageCount || 0) > 0 ? '#0369a1' : '#64748b',
                      fontWeight: 600
                    }}
                  >
                    {viewCategory.usageCount || 0} {(viewCategory.usageCount || 0) === 1 ? 'product' : 'products'}
                  </span>
                </span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Status:</span>
                <span>
                  <span
                    className={`badge ${viewCategory.active !== false ? 'badge-success' : 'badge-danger'}`}
                    style={{
                      backgroundColor: viewCategory.active !== false ? '#dcfce7' : '#fee2e2',
                      color: viewCategory.active !== false ? '#166534' : '#991b1b',
                      fontWeight: 600
                    }}
                  >
                    {viewCategory.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Created Date:</span>
                <span style={{ color: 'var(--text-500)' }}>
                  {viewCategory.created_at || viewCategory.createdAt ? new Date(viewCategory.created_at || viewCategory.createdAt).toLocaleString() : '—'}
                </span>

                <span style={{ fontWeight: 600, color: 'var(--text-600)' }}>Updated Date:</span>
                <span style={{ color: 'var(--text-500)' }}>
                  {viewCategory.updated_at || viewCategory.updatedAt ? new Date(viewCategory.updated_at || viewCategory.updatedAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewCategory(null)}
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

export default Categories;
