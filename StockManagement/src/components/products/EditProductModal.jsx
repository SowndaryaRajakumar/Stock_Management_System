import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { productApi, masterDataApi } from '../../services/api';

export const EditProductModal = ({ isOpen, onClose, product, onProductUpdated }) => {
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [registerOptions, setRegisterOptions] = useState([]);

  const [formData, setFormData] = useState({
    productCode: '',
    name: '',
    category: '',
    description: '',
    unit: 'Pieces',
    currentQuantity: 0,
    minimumStockLevel: 5,
    stockRegister: 'SR1',
    pageNumber: 1,
    status: 'ACTIVE'
  });

  const [registerRefs, setRegisterRefs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [catRes, unitRes, docRes] = await Promise.all([
          masterDataApi.getCategories().catch(() => ({})),
          masterDataApi.getUnits().catch(() => ({})),
          masterDataApi.getStockDocuments().catch(() => ({}))
        ]);
        if (catRes?.success && catRes.categories?.length > 0) {
          const cats = catRes.categories.map(c => c.name);
          if (product?.category && !cats.includes(product.category)) {
            cats.push(product.category);
          }
          setCategories(cats);
        }
        if (unitRes?.success && unitRes.units?.length > 0) {
          setUnits(unitRes.units.map(u => u.name));
        }
        if (docRes?.success && docRes.documents?.length > 0) {
          const docs = docRes.documents.map(d => d.name);
          if (product?.stockRegister && !docs.includes(product.stockRegister)) {
            docs.push(product.stockRegister);
          }
          setRegisterOptions(docs);
        }
      } catch (e) {
        console.error('Failed to load master data in EditProductModal:', e);
      }
    };
    if (isOpen) {
      loadMasterData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      setFormData({
        productCode: product.productCode || '',
        name: product.name || product.productName || '',
        category: product.category || '',
        description: product.description || '',
        unit: product.unit || 'Pieces',
        currentQuantity: product.currentQuantity !== undefined ? product.currentQuantity : 0,
        minimumStockLevel: product.minimumStockLevel !== undefined ? product.minimumStockLevel : (product.minimumQuantity || 5),
        stockRegister: product.stockRegister || 'SR1',
        pageNumber: product.pageNumber || 1,
        status: product.status || (product.active === false ? 'INACTIVE' : 'ACTIVE')
      });

      if (product.registerRefs && product.registerRefs.length > 0) {
        setRegisterRefs(product.registerRefs.map(r => ({
          sheet: r.sheet || r.stockDocumentName || 'SR1',
          page: Number(r.page || r.pageNumber) || 1
        })));
      } else {
        setRegisterRefs([{ sheet: product.stockRegister || 'SR1', page: product.pageNumber || 1 }]);
      }

      if (product.category) {
        setCategories(prev => prev.includes(product.category) ? prev : [...prev, product.category]);
      }
      if (product.stockRegister) {
        setRegisterOptions(prev => prev.includes(product.stockRegister) ? prev : [...prev, product.stockRegister]);
      }
      setError('');
    }
  }, [product]);

  const handleAddRefRow = () => {
    setRegisterRefs([...registerRefs, { sheet: registerOptions[0] || 'SR1', page: 1 }]);
  };

  const handleRemoveRefRow = (index) => {
    if (registerRefs.length > 1) {
      setRegisterRefs(registerRefs.filter((_, i) => i !== index));
    }
  };

  const handleRefChange = (index, field, value) => {
    const updated = [...registerRefs];
    updated[index][field] = field === 'page' ? (value === '' ? '' : Math.max(1, Number(value) || 1)) : value;
    setRegisterRefs(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (!formData.category) {
      setError('Category is required.');
      return;
    }

    if (!formData.unit) {
      setError('Unit is required.');
      return;
    }

    const qty = Number(formData.currentQuantity);
    if (isNaN(qty) || qty < 0) {
      setError('Current Quantity must be a valid non-negative number.');
      return;
    }

    const minQty = Number(formData.minimumStockLevel);
    if (isNaN(minQty) || minQty < 0) {
      setError('Minimum Stock Level must be a valid non-negative number.');
      return;
    }

    setLoading(true);
    try {
      const validRefs = registerRefs
        .filter((r) => r.sheet && r.page)
        .map((r) => ({ sheet: r.sheet, page: Math.max(1, Number(r.page) || 1) }));

      const payload = {
        ...formData,
        productName: formData.name.trim(),
        name: formData.name.trim(),
        category: formData.category.trim(),
        unit: formData.unit.trim(),
        description: formData.description ? formData.description.trim() : '',
        currentQuantity: qty,
        minimumQuantity: minQty,
        minimumStockLevel: minQty,
        stockRegister: validRefs[0]?.sheet || formData.stockRegister || 'SR1',
        pageNumber: validRefs[0]?.page || Number(formData.pageNumber) || 1,
        registerRefs: validRefs.length > 0 ? validRefs : [{ sheet: formData.stockRegister || 'SR1', page: Number(formData.pageNumber) || 1 }]
      };

      // Ensure productCode is never sent to be mutated
      delete payload.productCode;

      const res = await productApi.updateProduct(product._id || product.id, payload);
      if (res.success) {
        onProductUpdated(res.product || res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to update product.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update product.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Product: ${product?.productName || product?.name || ''}`} maxWidth="640px">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="login-error-box" role="alert" style={{ marginBottom: '16px' }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="edit-product-code">Product Code (System Generated)</label>
            <input
              type="text"
              id="edit-product-code"
              value={formData.productCode}
              disabled
              style={{ background: 'var(--navy-50)', color: 'var(--blue-700)', fontWeight: 600, cursor: 'not-allowed' }}
              title="Product code is automatically generated by backend and remains unchanged."
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Assigned automatically by backend and cannot be changed.
            </span>
          </div>

          <div className="field">
            <label htmlFor="edit-product-name">Product Name *</label>
            <input
              type="text"
              id="edit-product-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="edit-category">Category *</label>
            <select
              id="edit-category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              {formData.category && !categories.includes(formData.category) && (
                <option value={formData.category}>{formData.category}</option>
              )}
            </select>
          </div>

          <div className="field">
            <label htmlFor="edit-unit">Unit of Measurement *</label>
            <select
              id="edit-unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
              {formData.unit && !units.includes(formData.unit) && (
                <option value={formData.unit}>{formData.unit}</option>
              )}
            </select>
          </div>

          <div className="field">
            <label htmlFor="edit-quantity">Current Stock Quantity *</label>
            <input
              type="number"
              id="edit-quantity"
              min="0"
              value={formData.currentQuantity}
              onChange={(e) => setFormData({ ...formData, currentQuantity: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="edit-min-stock">Minimum Stock Level *</label>
            <input
              type="number"
              id="edit-min-stock"
              min="0"
              value={formData.minimumStockLevel}
              onChange={(e) => setFormData({ ...formData, minimumStockLevel: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="edit-stock-register">Primary Stock Register</label>
            <select
              id="edit-stock-register"
              value={formData.stockRegister}
              onChange={(e) => setFormData({ ...formData, stockRegister: e.target.value })}
            >
              {registerOptions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
              {formData.stockRegister && !registerOptions.includes(formData.stockRegister) && (
                <option value={formData.stockRegister}>{formData.stockRegister}</option>
              )}
            </select>
          </div>

          <div className="field">
            <label htmlFor="edit-status">Status</label>
            <select
              id="edit-status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive / Deactivated</option>
            </select>
          </div>

          <div className="full field">
            <label htmlFor="edit-description">Description / Technical Specification</label>
            <input
              type="text"
              id="edit-description"
              placeholder="e.g. Model number, technical rating, brand..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="full" style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.82rem', margin: 0 }}>
                Physical Stock Register References
              </label>
              <button
                type="button"
                onClick={handleAddRefRow}
                className="btn-outline"
                style={{ fontSize: '12px', padding: '3px 8px' }}
              >
                + Add Reference
              </button>
            </div>

            {registerRefs.map((ref, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <select
                  style={{ flex: 1 }}
                  value={ref.sheet}
                  onChange={(e) => handleRefChange(index, 'sheet', e.target.value)}
                  aria-label="Stock Register"
                >
                  {registerOptions.map((s) => (
                    <option key={s} value={s}>
                      {s} Register
                    </option>
                  ))}
                  {ref.sheet && !registerOptions.includes(ref.sheet) && (
                    <option value={ref.sheet}>{ref.sheet} Register</option>
                  )}
                </select>

                <input
                  type="number"
                  placeholder="Page Number"
                  style={{ flex: 1 }}
                  min="1"
                  value={ref.page}
                  onChange={(e) => handleRefChange(index, 'page', e.target.value)}
                  aria-label="Page Number"
                />

                {registerRefs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRefRow(index)}
                    className="btn-ghost"
                    style={{ color: 'var(--red-600)', padding: '6px' }}
                    title="Remove reference"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProductModal;
