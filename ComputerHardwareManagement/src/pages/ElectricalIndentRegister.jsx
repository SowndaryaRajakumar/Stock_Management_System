import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import { indentApi, productApi, masterDataApi, facultyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Standard SVG Icons matching system design
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const ElectricalIndentRegister = () => {
  const { user } = useAuth();

  // Indents list state
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Master data for dropdowns
  const [departments, setDepartments] = useState([]);
  const [products, setProducts] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Flash messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingIndentId, setEditingIndentId] = useState(null);
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal
  const [deleteModalData, setDeleteModalData] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    indentNumber: '',
    date: new Date().toISOString().split('T')[0],
    departmentId: '',
    departmentName: '',
    requestedBy: '',
    requesterId: '',
    productId: '',
    productName: '',
    productCode: '',
    quantity: 1,
    unit: 'Pieces',
    purpose: '',
    remarks: ''
  });

  // Load Master Data (Departments, Products, Faculty)
  const loadMasterData = useCallback(async () => {
    try {
      const [deptRes, prodRes, facRes] = await Promise.all([
        masterDataApi.getDepartments({ status: 'ACTIVE', limit: 200 }).catch(() => ({ departments: [] })),
        productApi.getProducts({ status: 'ACTIVE', limit: 300 }).catch(() => ({ products: [] })),
        facultyApi.getFaculty({ limit: 200 }).catch(() => ({ faculty: [] }))
      ]);

      if (deptRes?.departments) {
        setDepartments(deptRes.departments);
      }
      if (prodRes?.products) {
        setProducts(prodRes.products);
      }
      if (facRes?.faculty) {
        setFacultyList(facRes.faculty);
      }
    } catch (err) {
      console.error('Failed to load master data for Electrical Indent Register:', err);
    }
  }, []);

  // Fetch Indent Records
  const fetchIndents = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedDeptFilter) params.department = selectedDeptFilter;
      if (selectedProductFilter) params.product = selectedProductFilter;
      if (selectedDateFilter) params.date = selectedDateFilter;

      const res = await indentApi.getIndents(params);
      if (res?.success) {
        setIndents(res.indents || res.data || []);
        setTotalItems(res.total !== undefined ? res.total : (res.indents?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch electrical indents:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load indent register.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, selectedDeptFilter, selectedProductFilter, selectedDateFilter]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDeptFilter, selectedProductFilter, selectedDateFilter]);

  useEffect(() => {
    fetchIndents();
  }, [fetchIndents]);

  // Flash message timeout
  const showFlashSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // Generate a clean proposed Indent Number
  const generateNewIndentNumber = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `IND-EL-${year}-${rand}`;
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingIndentId(null);
    setFormError('');

    const defaultDept = departments[0]?.id ? String(departments[0].id) : '';
    const defaultDeptName = departments[0]?.name || '';
    const defaultFaculty = facultyList[0]?.id ? String(facultyList[0].id) : '';
    const defaultFacultyName = facultyList[0]?.name || user?.name || '';
    const defaultProduct = products[0]?.id ? String(products[0].id) : '';
    const defaultProductObj = products[0];

    setFormData({
      indentNumber: generateNewIndentNumber(),
      date: new Date().toISOString().split('T')[0],
      departmentId: defaultDept,
      departmentName: defaultDeptName,
      requesterId: defaultFaculty,
      requestedBy: defaultFacultyName,
      productId: defaultProduct,
      productName: defaultProductObj?.productName || defaultProductObj?.name || '',
      productCode: defaultProductObj?.productCode || '',
      quantity: 1,
      unit: defaultProductObj?.unit || 'Pieces',
      purpose: '',
      remarks: ''
    });

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (indent) => {
    setModalMode('edit');
    setEditingIndentId(indent.id || indent._id || indent.indentId);
    setFormError('');

    const firstItem = indent.items?.[0] || {};
    const itemProductId = firstItem.productId ? String(firstItem.productId) : '';
    const matchedProduct = products.find(p => String(p.id || p._id) === itemProductId || p.productCode === firstItem.productCode);

    const deptId = indent.departmentId ? String(indent.departmentId) : '';
    const matchedDept = departments.find(d => String(d.id || d._id) === deptId || d.name === indent.department);

    const reqId = indent.requesterId ? String(indent.requesterId) : '';
    const matchedFaculty = facultyList.find(f => String(f.id || f._id) === reqId || f.name === indent.requestedBy);

    setFormData({
      indentNumber: indent.indentNumber || indent.indent_number || '',
      date: indent.date || indent.requestDate || (indent.created_at ? new Date(indent.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      departmentId: matchedDept ? String(matchedDept.id || matchedDept._id) : deptId,
      departmentName: indent.department || matchedDept?.name || '',
      requesterId: matchedFaculty ? String(matchedFaculty.id || matchedFaculty._id) : reqId,
      requestedBy: indent.requestedBy || matchedFaculty?.name || '',
      productId: matchedProduct ? String(matchedProduct.id || matchedProduct._id) : itemProductId,
      productName: firstItem.productName || matchedProduct?.productName || '',
      productCode: firstItem.productCode || matchedProduct?.productCode || '',
      quantity: Number(firstItem.requestedQuantity || firstItem.quantityRequired || 1),
      unit: firstItem.unit || matchedProduct?.unit || 'Pieces',
      purpose: indent.purpose || indent.remarks || '',
      remarks: indent.remarks || ''
    });

    setIsModalOpen(true);
  };

  // Handle Product selection in form
  const handleProductChange = (prodId) => {
    const selected = products.find(p => String(p.id || p._id) === String(prodId));
    if (selected) {
      setFormData(prev => ({
        ...prev,
        productId: String(selected.id || selected._id),
        productName: selected.productName || selected.name,
        productCode: selected.productCode,
        unit: selected.unit?.name || selected.unit || 'Pieces'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        productId: prodId,
        productName: '',
        productCode: '',
        unit: 'Pieces'
      }));
    }
  };

  // Handle Department selection in form
  const handleDepartmentChange = (deptId) => {
    const selected = departments.find(d => String(d.id || d._id) === String(deptId));
    setFormData(prev => ({
      ...prev,
      departmentId: deptId,
      departmentName: selected?.name || ''
    }));
  };

  // Handle Requester selection in form
  const handleRequesterChange = (reqId) => {
    const selected = facultyList.find(f => String(f.id || f._id) === String(reqId));
    setFormData(prev => ({
      ...prev,
      requesterId: reqId,
      requestedBy: selected?.name || ''
    }));
  };

  // Save / Record Indent Entry
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.departmentId && !formData.departmentName) {
      setFormError('Please select a requesting department.');
      return;
    }
    if (!formData.requesterId && !formData.requestedBy) {
      setFormError('Please select or specify the requester / faculty name.');
      return;
    }
    if (!formData.productId) {
      setFormError('Please select a product/item for this indent.');
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setFormError('Requested quantity must be at least 1.');
      return;
    }
    if (!formData.purpose?.trim()) {
      setFormError('Please provide the purpose / requirement.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        indentNumber: formData.indentNumber.trim(),
        date: formData.date,
        departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
        department: formData.departmentName,
        requestedBy: formData.requesterId ? Number(formData.requesterId) : undefined,
        requesterName: formData.requestedBy,
        purpose: formData.purpose.trim(),
        remarks: formData.remarks?.trim() || formData.purpose.trim(),
        productId: Number(formData.productId),
        productCode: formData.productCode,
        quantity: Number(formData.quantity),
        requestedQuantity: Number(formData.quantity),
        unit: formData.unit,
        items: [
          {
            productId: Number(formData.productId),
            productCode: formData.productCode,
            requestedQuantity: Number(formData.quantity),
            unit: formData.unit,
            remarks: formData.remarks?.trim() || ''
          }
        ]
      };

      if (modalMode === 'create') {
        const res = await indentApi.createIndent(payload);
        if (res.success) {
          showFlashSuccess(`Indent ${res.indent?.indentNumber || formData.indentNumber} recorded successfully in register.`);
          setIsModalOpen(false);
          fetchIndents();
        }
      } else {
        const res = await indentApi.updateIndent(editingIndentId, payload);
        if (res.success) {
          showFlashSuccess(`Indent record ${formData.indentNumber} updated successfully.`);
          setIsModalOpen(false);
          fetchIndents();
        }
      }
    } catch (err) {
      console.error('Failed to save manual indent record:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to save indent entry.');
    } finally {
      setSaving(false);
    }
  };

  // Prompt delete modal
  const handlePromptDelete = (indent) => {
    setDeleteModalData(indent);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteModalData) return;
    const targetId = deleteModalData.id || deleteModalData._id || deleteModalData.indentId;

    try {
      setDeletingId(targetId);
      const res = await indentApi.deleteIndent(targetId);
      if (res?.success) {
        showFlashSuccess(`Indent record ${deleteModalData.indentNumber} deleted successfully.`);
        setDeleteModalData(null);
        fetchIndents();
      }
    } catch (err) {
      console.error('Failed to delete indent record:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to delete indent record.');
    } finally {
      setDeletingId(null);
    }
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDeptFilter('');
    setSelectedProductFilter('');
    setSelectedDateFilter('');
  };

  const hasActiveFilters = Boolean(searchTerm || selectedDeptFilter || selectedProductFilter || selectedDateFilter);

  // Summary Metrics
  const totalRecorded = totalItems;
  const uniqueDeptsCount = useMemo(() => {
    const set = new Set(indents.map(i => i.department).filter(Boolean));
    return set.size || departments.length || 0;
  }, [indents, departments]);

  const totalItemsCount = useMemo(() => {
    return indents.reduce((sum, ind) => sum + (Number(ind.items?.[0]?.requestedQuantity || ind.items?.[0]?.quantityRequired || 0)), 0);
  }, [indents]);

  return (
    <Layout
      title="Indent Register"
      breadcrumb="ELECTRICAL STOCK – INDENT REGISTER"
    >
      {/* Header & Action Bar */}
      <div className="section" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-950)', margin: '0 0 3px 0' }}>
              ELECTRICAL STOCK – INDENT REGISTER
            </h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.86rem' }}>
              Record manually received material requests
            </p>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenCreateModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              fontWeight: 700,
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
            }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>＋</span> Add Indent Entry
          </button>
        </div>
      </div>

      {/* Flash Messages */}
      {successMessage && (
        <div
          style={{
            background: 'var(--green-50, #f0fdf4)',
            border: '1px solid var(--green-200, #bbf7d0)',
            color: 'var(--green-800, #166534)',
            padding: '11px 16px',
            borderRadius: 'var(--radius-md, 6px)',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            fontSize: '0.88rem'
          }}
        >
          <span>✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: 'var(--red-50, #fef2f2)',
            border: '1px solid var(--red-200, #fecaca)',
            color: 'var(--red-800, #991b1b)',
            padding: '11px 16px',
            borderRadius: 'var(--radius-md, 6px)',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            fontSize: '0.88rem'
          }}
        >
          <span>⚠</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '20px'
        }}
      >
        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid var(--blue-600, #2563eb)' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-500)', fontWeight: 700 }}>
            TOTAL INDENT RECORDS
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '4px' }}>
            {totalRecorded}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', marginTop: '2px' }}>
            Manually logged in register
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid var(--amber-500, #f59e0b)' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-500)', fontWeight: 700 }}>
            DEPARTMENTS RECORDED
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--amber-700)', marginTop: '4px' }}>
            {uniqueDeptsCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', marginTop: '2px' }}>
            Requesting departments
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-500)', fontWeight: 700 }}>
            UNITS REQUESTED
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#047857', marginTop: '4px' }}>
            {totalItemsCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', marginTop: '2px' }}>
            Cumulative items requested
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-500)', fontWeight: 700 }}>
            WORKFLOW MODE
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4338ca', marginTop: '7px' }}>
            Manual Record Entry
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-400)', marginTop: '4px' }}>
            No online approval required
          </div>
        </div>
      </div>

      {/* Reactive Search & Filter Toolbar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 260px', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search by indent no, requester, department, purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '0.86rem'
              }}
            />
          </div>

          {/* Department Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="dept-filter" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-600)' }}>
              Dept:
            </label>
            <select
              id="dept-filter"
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '0.85rem',
                background: 'white'
              }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => {
                const name = typeof d === 'string' ? d : d.name;
                const id = typeof d === 'string' ? d : (d.id || d._id);
                return (
                  <option key={id} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Product Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="prod-filter" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-600)' }}>
              Product:
            </label>
            <select
              id="prod-filter"
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '0.85rem',
                background: 'white',
                maxWidth: '200px'
              }}
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id || p._id} value={p.productName || p.name}>
                  {p.productName || p.name} ({p.productCode})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="date-filter" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-600)' }}>
              Date:
            </label>
            <input
              id="date-filter"
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn-outline btn-sm"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              ✕ Clear Filters
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Showing {indents.length} of {totalItems} records
          </span>
        </div>
      </div>

      {/* Indents Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading message="Loading indent register records..." />
        ) : indents.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No Indent Records Found"
            description={hasActiveFilters ? "No records match your filter criteria." : "No manual indents have been recorded in the Electrical Stock register yet."}
            action={
              <button
                type="button"
                className="btn-primary"
                onClick={handleOpenCreateModal}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>＋</span> Record First Indent Entry
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Indent No.</th>
                  <th style={{ width: '105px' }}>Date</th>
                  <th>Department</th>
                  <th>Requested By</th>
                  <th>Purpose</th>
                  <th>Item</th>
                  <th style={{ width: '90px' }}>Quantity</th>
                  <th style={{ width: '80px' }}>Unit</th>
                  <th style={{ width: '110px' }}>Recorded By</th>
                  <th style={{ width: '95px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {indents.map((indent) => {
                  const firstItem = indent.items?.[0] || {};
                  const itemName = firstItem.productName || '—';
                  const itemCode = firstItem.productCode || '';
                  const itemQty = Number(firstItem.requestedQuantity || firstItem.quantityRequired || 0);
                  const itemUnit = firstItem.unit || 'Pieces';
                  const moreItemsCount = (indent.items?.length || 1) - 1;

                  const dateStr = indent.date || indent.requestDate || (indent.created_at ? new Date(indent.created_at).toISOString().split('T')[0] : '—');
                  const targetId = indent.id || indent._id || indent.indentId;

                  return (
                    <tr key={targetId || indent.indentNumber}>
                      {/* 1. Indent No. */}
                      <td className="code" style={{ fontWeight: 700, color: 'var(--blue-700)' }}>
                        {indent.indentNumber || indent.indent_number}
                      </td>

                      {/* 2. Date */}
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.84rem' }}>
                        {dateStr}
                      </td>

                      {/* 3. Department */}
                      <td>
                        <span className="badge-light" style={{ fontWeight: 600 }}>
                          {indent.department || indent.requestingDepartment || 'Department'}
                        </span>
                      </td>

                      {/* 4. Requested By */}
                      <td>
                        <strong>{indent.requestedBy || indent.requesterName || 'Faculty'}</strong>
                      </td>

                      {/* 5. Purpose */}
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={indent.purpose || indent.remarks}>
                        {indent.purpose || indent.remarks || '—'}
                      </td>

                      {/* 6. Item */}
                      <td style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`${itemName} (${itemCode})`}>
                        <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{itemName}</span>
                        {itemCode && (
                          <span style={{ marginLeft: '6px', fontSize: '0.76rem', color: 'var(--text-400)', fontFamily: 'monospace' }}>
                            [{itemCode}]
                          </span>
                        )}
                        {moreItemsCount > 0 && (
                          <span style={{ marginLeft: '6px', fontSize: '0.74rem', background: 'var(--blue-50)', color: 'var(--blue-700)', padding: '1px 6px', borderRadius: '4px' }}>
                            +{moreItemsCount} more
                          </span>
                        )}
                      </td>

                      {/* 7. Quantity */}
                      <td style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                        {itemQty}
                      </td>

                      {/* 8. Unit */}
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-600)' }}>
                        {itemUnit}
                      </td>

                      {/* 9. Recorded By */}
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-700)' }}>
                          {indent.recordedBy || 'Store Admin'}
                        </span>
                      </td>

                      {/* 10. Action: Edit & Delete Icon Buttons */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(indent)}
                            title="Edit Indent Record"
                            aria-label="Edit Indent Record"
                            style={{
                              padding: '5px 7px',
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

                          <button
                            type="button"
                            onClick={() => handlePromptDelete(indent)}
                            title="Delete Indent Record"
                            aria-label="Delete Indent Record"
                            disabled={deletingId === targetId}
                            style={{
                              padding: '5px 7px',
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
                            <TrashIcon />
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

      {/* ==========================================
          ADD / EDIT MANUAL INDENT MODAL
         ========================================== */}
      {isModalOpen && (
        <div
          className="modal-backdrop"
          style={{
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
          }}
        >
          <div
            className="modal-content"
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg, 8px)',
              maxWidth: '640px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-950)' }}>
                  {modalMode === 'create' ? 'Record New Indent Entry' : `Edit Indent Record: ${formData.indentNumber}`}
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: 'var(--text-500)' }}>
                  Enter details of the physical material requirement received by the store.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: 'var(--text-400)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Information Notice */}
            <div
              style={{
                background: 'var(--blue-50, #eff6ff)',
                border: '1px solid var(--blue-200, #bfdbfe)',
                borderRadius: '6px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '0.82rem',
                color: 'var(--blue-900, #1e3a8a)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>ℹ</span>
              <span>
                <strong>Record Keeping:</strong> This entry logs physically received indent requests for audit and historical records. <strong>It does not deduct store stock.</strong> Stock deduction occurs only upon recording a Transfer.
              </span>
            </div>

            {formError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '0.84rem'
                }}
              >
                ⚠ {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                {/* Indent Number */}
                <div className="field">
                  <label htmlFor="modal-indent-number" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                    Indent Number *
                  </label>
                  <input
                    id="modal-indent-number"
                    type="text"
                    value={formData.indentNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, indentNumber: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Date */}
                <div className="field">
                  <label htmlFor="modal-indent-date" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                    Date Received *
                  </label>
                  <input
                    id="modal-indent-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Department Dropdown */}
                <div className="field">
                  <label htmlFor="modal-indent-dept" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                    Department *
                  </label>
                  <select
                    id="modal-indent-dept"
                    value={formData.departmentId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'white' }}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id || d._id} value={d.id || d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Requester Dropdown */}
                <div className="field">
                  <label htmlFor="modal-indent-faculty" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                    Requested By (Faculty / Requester) *
                  </label>
                  <select
                    id="modal-indent-faculty"
                    value={formData.requesterId}
                    onChange={(e) => handleRequesterChange(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'white' }}
                  >
                    <option value="">-- Select Faculty / Requester --</option>
                    {facultyList.map((f) => (
                      <option key={f.id || f._id} value={f.id || f._id}>
                        {f.name} {f.designation ? `(${f.designation})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Selection Section */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '10px' }}>
                  Material / Item Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  {/* Product Dropdown */}
                  <div className="field" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="modal-product-select" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                      Electrical Product *
                    </label>
                    <select
                      id="modal-product-select"
                      value={formData.productId}
                      onChange={(e) => handleProductChange(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'white' }}
                    >
                      <option value="">-- Select Electrical Product --</option>
                      {products.map((p) => (
                        <option key={p.id || p._id} value={p.id || p._id}>
                          {p.productName || p.name} ({p.productCode}) · Stock: {p.currentQuantity} {p.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="field">
                    <label htmlFor="modal-quantity" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                      Requested Quantity *
                    </label>
                    <input
                      id="modal-quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: Math.max(1, Number(e.target.value) || 1) }))}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>

                  {/* Unit */}
                  <div className="field">
                    <label htmlFor="modal-unit" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                      Unit of Measurement
                    </label>
                    <input
                      id="modal-unit"
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Purpose & Remarks */}
              <div className="field" style={{ marginBottom: '12px' }}>
                <label htmlFor="modal-purpose" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  Purpose / Requirement *
                </label>
                <input
                  id="modal-purpose"
                  type="text"
                  placeholder="e.g. Electrical wiring repair in Computer Lab 3, Semester Exam Setup"
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div className="field" style={{ marginBottom: '20px' }}>
                <label htmlFor="modal-remarks" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  Remarks / Physical Indent Slip Reference (Optional)
                </label>
                <textarea
                  id="modal-remarks"
                  rows={2}
                  placeholder="e.g. Physical slip #402 signed by HOD, urgent replacement required..."
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-sm"
                  disabled={saving}
                  style={{ padding: '8px 18px', fontWeight: 700 }}
                >
                  {saving ? 'Saving Record...' : modalMode === 'create' ? 'Record Indent' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE CONFIRMATION MODAL
         ========================================== */}
      {deleteModalData && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1250,
            padding: '16px'
          }}
        >
          <div
            className="modal-content"
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg, 8px)',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', color: '#b91c1c', fontWeight: 700 }}>
              Delete Indent Record {deleteModalData.indentNumber}?
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-600)', marginBottom: '18px' }}>
              Are you sure you want to delete this indent record for department <strong>{deleteModalData.department}</strong>? This action will remove the record from the historical indent register.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => setDeleteModalData(null)}
                disabled={deletingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
                style={{ background: '#b91c1c', borderColor: '#b91c1c' }}
              >
                {deletingId !== null ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ElectricalIndentRegister;
