import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import { productApi, indentApi, masterDataApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Loading from '../components/common/Loading';

export const CreateIndent = () => {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [department, setDepartment] = useState(user?.department || '');
  const [purpose, setPurpose] = useState('');
  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [remarks, setRemarks] = useState('');

  // Items list
  const [items, setItems] = useState([
    {
      productId: '',
      productCode: '',
      productName: '',
      stockRegister: 'SR1',
      unit: 'Pieces',
      requestedQuantity: 1,
      availableStock: 0
    }
  ]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoadingProducts(true);
        const [prodRes, deptRes] = await Promise.all([
          productApi.getProducts({ status: 'ACTIVE', limit: 100 }),
          masterDataApi.getDepartments()
        ]);
        if (prodRes?.success) {
          const prods = prodRes.products || [];
          setProducts(prods);

          // Check if product was passed in URL query param
          const preselected = searchParams.get('product') || searchParams.get('productId') || searchParams.get('productCode');
          if (preselected) {
            const target = prods.find((p) => p._id === preselected || p.productCode === preselected);
            if (target) {
              setItems([
                {
                  productId: target._id,
                  productCode: target.productCode,
                  productName: target.productName || target.name,
                  stockRegister: target.stockRegister || 'SR1',
                  unit: target.unit || 'Pieces',
                  requestedQuantity: 1,
                  availableStock: target.currentQuantity
                }
              ]);
            }
          }
        }
        if (deptRes?.success && deptRes.departments?.length > 0) {
          setDepartments(deptRes.departments.map((d) => d.name));
          if (!department) {
            setDepartment(user?.department || deptRes.departments[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load products/departments for indent:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadMasterData();
  }, [department, user, searchParams]);

  const handleProductSelect = (index, productId) => {
    const selected = products.find((p) => p._id === productId);
    const updated = [...items];
    if (selected) {
      updated[index] = {
        ...updated[index],
        productId: selected._id,
        productCode: selected.productCode,
        productName: selected.productName || selected.name,
        stockRegister: selected.stockRegister || 'SR1',
        unit: selected.unit || 'Pieces',
        availableStock: selected.currentQuantity
      };
    } else {
      updated[index] = {
        ...updated[index],
        productId: '',
        productCode: '',
        productName: '',
        stockRegister: 'SR1',
        unit: 'Pieces',
        availableStock: 0
      };
    }
    setItems(updated);
  };

  const handleQtyChange = (index, value) => {
    const val = Math.max(1, Number(value) || 1);
    const updated = [...items];
    updated[index].requestedQuantity = val;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        productCode: '',
        productName: '',
        stockRegister: 'SR1',
        unit: 'Pieces',
        requestedQuantity: 1,
        availableStock: 0
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!purpose.trim()) {
      setError('Please provide a specific purpose or project name for this indent.');
      return;
    }

    const invalidItems = items.filter((item) => !item.productId || item.requestedQuantity <= 0);
    if (invalidItems.length > 0) {
      setError('Please select a valid product and requested quantity for each item line.');
      return;
    }

    // Check for duplicate products in the same indent
    const productIds = items.map((i) => i.productId);
    if (new Set(productIds).size !== productIds.length) {
      setError('Duplicate items found in the requisition. Please adjust the quantities on a single line.');
      return;
    }

    // Validate requested quantity against available store stock
    for (const item of items) {
      if (item.availableStock !== undefined && item.requestedQuantity > item.availableStock) {
        setError(`Requested quantity (${item.requestedQuantity}) for ${item.productName} exceeds available store stock (${item.availableStock} max).`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        department: department || user?.department || 'General',
        purpose: purpose.trim(),
        requiredDate,
        remarks: remarks.trim(),
        items: items.map((i) => ({
          productId: i.productId,
          productCode: i.productCode,
          productName: i.productName,
          requestedQuantity: i.requestedQuantity,
          stockRegister: i.stockRegister,
          unit: i.unit
        }))
      };

      const res = await indentApi.createIndent(payload);
      if (res.success) {
        fetchNotifications();
        navigate('/indents', {
          state: {
            successMessage: 'Indent submitted successfully.'
          }
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit indent request.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProducts) {
    return (
      <Layout>
        <Loading message="Loading inventory catalog..." />
      </Layout>
    );
  }

  return (
    <Layout
      title="Create Material Indent"
      breadcrumb="Submit a material requisition for required consumables."
    >
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>Create Material Indent</h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Submit a material requisition for required consumables.
            </p>
          </div>
        </div>
      </div>

      <div className="content-area">
        {error && (
          <div className="login-error-box" role="alert" style={{ marginBottom: '20px' }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div
          style={{
            background: 'var(--blue-50)',
            border: '1px solid var(--blue-200)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: '24px',
            color: 'var(--blue-900)',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>ℹ</span>
          <span>
            <strong>Requisition Notice:</strong> Submitting an indent creates a requisition for Admin review. Physical issue of approved items is handled offline.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '880px', margin: '0 auto' }}>
          <div className="card-head">
            <span className="card-title">Requisition Details</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Requester: <strong>{user?.name || 'Faculty'}</strong>
            </span>
          </div>

          <div className="card-body">
            {/* Header info */}
            <div className="grid-3col" style={{ marginBottom: '20px' }}>
              <div className="field">
                <label htmlFor="indent-dept">Department / Lab *</label>
                <select
                  id="indent-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="indent-req-date">Required By Date *</label>
                <input
                  id="indent-req-date"
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="indent-purpose">Purpose / Project *</label>
                <input
                  id="indent-purpose"
                  type="text"
                  placeholder="e.g. IoT Lab Setup, Semester Exam Prep"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Requisition Line Items */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}
              >
                <label style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-900)' }}>
                  Requested Items ({items.length})
                </label>
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={handleAddItem}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>＋</span> Add Item Line
                </button>
              </div>

              <div className="table-wrap" style={{ border: '1px solid var(--border)' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Product Selection</th>
                      <th>Register</th>
                      <th>Available in Store</th>
                      <th>Requested Quantity</th>
                      <th>Unit</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            required
                            style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                          >
                            <option value="">-- Choose Product --</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>
                                [{p.productCode}] {p.productName} ({p.currentQuantity} {p.unit} in store)
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span className="badge badge-blue">{item.stockRegister || 'SR1'}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              color: item.availableStock === 0 ? 'var(--red-600)' : 'inherit'
                            }}
                          >
                            {item.availableStock}
                          </span>
                        </td>
                        <td style={{ width: '130px' }}>
                          <input
                            type="number"
                            min="1"
                            value={item.requestedQuantity}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                            required
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-strong)',
                              fontWeight: 700
                            }}
                          />
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {item.unit}
                        </td>
                        <td>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="btn-ghost"
                              style={{ color: 'var(--red-600)', padding: '4px 8px', fontSize: '1.1rem' }}
                              title="Remove item"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Remarks */}
            <div className="field" style={{ marginBottom: '24px' }}>
              <label htmlFor="indent-remarks">Special Instructions / Justification</label>
              <textarea
                id="indent-remarks"
                rows={3}
                placeholder="Specify any urgency, special brand requirements, or lab room numbers..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                borderTop: '1px solid var(--border)',
                paddingTop: '18px'
              }}
            >
              <Button variant="outline" type="button" onClick={() => navigate('/indents')}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Submitting Indent...' : 'Submit Requisition for Approval'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateIndent;
