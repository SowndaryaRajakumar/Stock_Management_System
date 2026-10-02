import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { productApi, masterDataApi } from '../../services/api';

export const AddProductModal = ({ isOpen, onClose, onProductCreated }) => {
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [registerOptions, setRegisterOptions] = useState([]);

  const [formData, setFormData] = useState({
    productCode: '',
    name: '',
    category: '',
    description: '',
    unit: 'Pieces',
    currentQuantity: 10,
    minimumStockLevel: 5,
    stockRegister: 'SR1',
    pageNumber: 1,
    initialRemark: ''
  });

  const [registerRefs, setRegisterRefs] = useState([
    { sheet: 'SR1', page: 1 }
  ]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [catRes, unitRes, docRes] = await Promise.all([
          masterDataApi.getCategories().catch(() => ({})),
          masterDataApi.getUnits().catch(() => ({})),
          masterDataApi.getStockDocuments().catch(() => ({}))
        ]);

        if (catRes?.success && catRes.categories?.length > 0) {
          setCategories(catRes.categories.map(c => c.name));
          setFormData(prev => ({ ...prev, category: catRes.categories[0].name }));
        }
        if (unitRes?.success && unitRes.units?.length > 0) {
          setUnits(unitRes.units.map(u => u.name));
          setFormData(prev => ({ ...prev, unit: unitRes.units[0].name }));
        }
        if (docRes?.success && docRes.documents?.length > 0) {
          const docs = docRes.documents.map(d => d.name);
          setRegisterOptions(docs);
          setFormData(prev => ({ ...prev, stockRegister: docs[0] }));
          setRegisterRefs([{ sheet: docs[0], page: 1 }]);
        }
      } catch (err) {
        console.error('Failed to load master data in AddProductModal:', err);
      }
    };
    if (isOpen) {
      fetchMasterData();
    }
  }, [isOpen]);

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
    updated[index][field] = field === 'page' ? Number(value) : value;
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

      // Product code is strictly assigned by MongoDB backend
      delete payload.productCode;

      const res = await productApi.createProduct(payload);
      if (res.success) {
        onProductCreated(res.product || res.data);
        // Reset form
        setFormData({
          productCode: '',
          name: '',
          category: categories[0] || '',
          description: '',
          unit: units[0] || 'Pieces',
          currentQuantity: 10,
          minimumStockLevel: 5,
          stockRegister: registerOptions[0] || 'SR1',
          pageNumber: 1,
          initialRemark: ''
        });
        setRegisterRefs([{ sheet: registerOptions[0] || 'SR1', page: 1 }]);
        onClose();
      } else {
        setError(res.message || 'Failed to create product.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Server error creating product.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Consumable Product"
      maxWidth="700px"
    >
      {error && (
        <div className="alert-box" style={{ marginBottom: '16px' }}>
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Product Code */}
          <div className="field">
            <label htmlFor="modal-pcode">
              Product Code (Auto-Generated)
            </label>
            <input
              type="text"
              id="modal-pcode"
              value={formData.productCode || 'Auto-generated sequential code (CON-XXXX)'}
              disabled
              style={{ background: 'var(--navy-50)', color: 'var(--blue-700)', fontWeight: 600, cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Assigned automatically by MongoDB on save (e.g. CON-0007)
            </span>
          </div>

          {/* Product Name */}
          <div className="field">
            <label htmlFor="modal-pname">
              Product Name <span className="req">*</span>
            </label>
            <input
              type="text"
              id="modal-pname"
              placeholder="e.g. 5-Pin Multi Socket 16A"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          {/* Category */}
          <div className="field">
            <label htmlFor="modal-category">
              Category <span className="req">*</span>
            </label>
            <select
              id="modal-category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              required
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Unit of Measurement */}
          <div className="field">
            <label htmlFor="modal-unit">
              Unit of Measurement <span className="req">*</span>
            </label>
            <select
              id="modal-unit"
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              required
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Initial Stock Quantity */}
          <div className="field">
            <label htmlFor="modal-initqty">
              Initial Quantity <span className="req">*</span>
            </label>
            <input
              type="number"
              id="modal-initqty"
              min="0"
              placeholder="0"
              value={formData.currentQuantity}
              onChange={(e) =>
                setFormData({ ...formData, currentQuantity: e.target.value })
              }
              required
            />
          </div>

          {/* Minimum Stock Level */}
          <div className="field">
            <label htmlFor="modal-minstock">
              Minimum Threshold Level <span className="req">*</span>
            </label>
            <input
              type="number"
              id="modal-minstock"
              min="0"
              placeholder="5"
              value={formData.minimumStockLevel}
              onChange={(e) =>
                setFormData({ ...formData, minimumStockLevel: e.target.value })
              }
              required
            />
          </div>

          {/* Description */}
          <div className="field full">
            <label htmlFor="modal-desc">Specification / Description</label>
            <textarea
              id="modal-desc"
              rows={2}
              placeholder="Brand, technical ratings, model number..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Stock Register Document References (SR1, SR2, SR3, CSSR1) */}
          <div className="field full">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}
            >
              <label style={{ margin: 0, fontWeight: 'bold' }}>
                Stock Sheet / Register References (SR Sheet & Page)
              </label>
              <button
                type="button"
                onClick={handleAddRefRow}
                className="btn-outline"
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                + Add Register Entry
              </button>
            </div>

            <div
              style={{
                background: 'var(--slate-50)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              {registerRefs.map((ref, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    marginBottom: idx < registerRefs.length - 1 ? '8px' : '0'
                  }}
                >
                  <div style={{ flex: '1' }}>
                    <select
                      value={ref.sheet}
                      onChange={(e) =>
                        handleRefChange(idx, 'sheet', e.target.value)
                      }
                      style={{ width: '100%' }}
                    >
                      {registerOptions.map((r) => (
                        <option key={r} value={r}>
                          {r} Register
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '120px' }}>
                    <input
                      type="number"
                      min="1"
                      placeholder="Page #"
                      value={ref.page}
                      onChange={(e) =>
                        handleRefChange(idx, 'page', e.target.value)
                      }
                      style={{ width: '100%' }}
                    />
                  </div>
                  {registerRefs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRefRow(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--red-600)',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px'
                      }}
                      title="Remove Reference"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Initial Remark */}
          <div className="field full">
            <label htmlFor="modal-remark">Initial Stock Remark (Optional)</label>
            <input
              type="text"
              id="modal-remark"
              placeholder="e.g. Placed in Rack A-1; inspected by Store Keeper"
              value={formData.initialRemark}
              onChange={(e) =>
                setFormData({ ...formData, initialRemark: e.target.value })
              }
            />
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)'
          }}
        >
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProductModal;
