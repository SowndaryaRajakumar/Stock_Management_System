import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../common/Button';
import { productApi, purchaseApi } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

export const PurchaseForm = ({ onPurchaseCompleted = null, onPurchaseSuccess = null }) => {
  const [searchParams] = useSearchParams();
  const preselectedProductCode = searchParams.get('productCode');
  const preselectedProductId = searchParams.get('productId');

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const { fetchNotifications } = useNotifications();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await productApi.getProducts();
        if (res.success && res.products && res.products.length > 0) {
          setProducts(res.products);
          // Check if productCode or productId matches URL param
          const matched = res.products.find(
            (p) =>
              (preselectedProductId && String(p._id) === String(preselectedProductId)) ||
              (preselectedProductCode && p.productCode === preselectedProductCode)
          );
          if (matched) {
            setSelectedProductId(matched._id);
          } else {
            setSelectedProductId(res.products[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load products for purchase:', err);
      }
    };
    loadProducts();
  }, [preselectedProductCode, preselectedProductId]);

  // Sync if URL search parameters change dynamically
  useEffect(() => {
    if (products.length > 0 && (preselectedProductId || preselectedProductCode)) {
      const matched = products.find(
        (p) =>
          (preselectedProductId && String(p._id) === String(preselectedProductId)) ||
          (preselectedProductCode && p.productCode === preselectedProductCode)
      );
      if (matched) {
        setSelectedProductId(matched._id);
      }
    }
  }, [preselectedProductCode, preselectedProductId, products]);

  const selectedProduct = products.find(
    (p) =>
      String(p._id) === String(selectedProductId) ||
      String(p.id) === String(selectedProductId) ||
      p.productCode === selectedProductId ||
      p.product_code === selectedProductId
  );
  const currentStock = selectedProduct
    ? Number(
        selectedProduct.current_quantity !== undefined
          ? selectedProduct.current_quantity
          : (selectedProduct.currentQuantity !== undefined
              ? selectedProduct.currentQuantity
              : (selectedProduct.currentStock || 0))
      )
    : 0;
  const productUnit = selectedProduct
    ? (typeof selectedProduct.unit === 'string'
        ? selectedProduct.unit
        : (selectedProduct.unit?.name || selectedProduct.unitName || selectedProduct.unit_name || ''))
    : '';
  const numQty = Number(quantity) || 0;
  const newCalculatedStock = currentStock + (numQty > 0 ? numQty : 0);
  const totalAmount = (Number(unitPrice) || 0) * numQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || numQty <= 0) {
      setFeedback({
        type: 'error',
        message: 'Please select a valid product and enter a purchase quantity greater than zero.'
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productId: selectedProductId,
        quantity: numQty,
        supplier: supplier ? supplier.trim() : '',
        invoiceNumber: invoiceNumber ? invoiceNumber.trim() : '',
        unitPrice: Number(unitPrice) || 0,
        date,
        remarks: remarks ? remarks.trim() : ''
      };

      const res = await purchaseApi.recordPurchase(payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Purchase recorded successfully.'
        });

        const newStockVal =
          res.data?.product?.currentQuantity ??
          res.data?.product?.current_quantity ??
          res.product?.newQuantity ??
          res.updatedProduct?.currentQuantity ??
          (currentStock + numQty);

        setProducts((prev) =>
          prev.map((p) =>
            String(p._id) === String(selectedProductId) || String(p.id) === String(selectedProductId)
              ? {
                  ...p,
                  currentQuantity: Number(newStockVal),
                  current_quantity: Number(newStockVal),
                  currentStock: Number(newStockVal)
                }
              : p
          )
        );

        if (typeof fetchNotifications === 'function') {
          fetchNotifications();
        }

        const purchaseRecord = res.data?.purchase || res.purchase || {
          quantity: numQty,
          productName: selectedProduct?.productName || selectedProduct?.name
        };

        const cb = onPurchaseSuccess || onPurchaseCompleted;
        if (typeof cb === 'function') {
          try {
            cb(purchaseRecord);
          } catch (errCb) {
            console.error('Error in onPurchaseSuccess callback:', errCb);
          }
        }

        setQuantity('');
        setInvoiceNumber('');
        setRemarks('');
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Failed to record purchase.'
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to record purchase.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card">
      <div className="card-head">
        <h2>Record Stock Purchase</h2>
      </div>
      <div className="card-pad">
        {feedback && (
          <div className={feedback.type === 'success' ? 'success-box' : 'alert-box'}>
            {feedback.type === 'success' ? '✓ ' : '⚠ '}
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="purchase-product">Product *</label>
              <select
                id="purchase-product"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setFeedback(null);
                }}
                required
              >
                {products.map((p) => {
                  const qty = Number(
                    p.current_quantity !== undefined
                      ? p.current_quantity
                      : (p.currentQuantity !== undefined
                          ? p.currentQuantity
                          : (p.currentStock || 0))
                  );
                  const u = typeof p.unit === 'string'
                    ? p.unit
                    : (p.unit?.name || p.unitName || p.unit_name || '');
                  const pId = p._id !== undefined ? p._id : p.id;
                  const name = p.name || p.productName || p.product_name;
                  const code = p.productCode || p.product_code;
                  const reg = p.stockRegister || 'SR1';
                  return (
                    <option key={pId} value={pId}>
                      {name} ({code}) — Current: {qty} {u} [{reg}]
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="field">
              <label htmlFor="purchase-qty">Quantity Purchased *</label>
              <input
                type="number"
                id="purchase-qty"
                min="1"
                placeholder="e.g. 50"
                value={quantity || ''}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setFeedback(null);
                }}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="purchase-date">Purchase Date *</label>
              <input
                type="date"
                id="purchase-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="purchase-supplier">Supplier / Vendor Name</label>
              <input
                type="text"
                id="purchase-supplier"
                placeholder="e.g. Sri Balaji Electricals"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="purchase-invoice">Invoice / Bill Number</label>
              <input
                type="text"
                id="purchase-invoice"
                placeholder="e.g. INV-4432"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="purchase-price">Unit Price (₹)</label>
              <input
                type="number"
                id="purchase-price"
                min="0"
                step="0.01"
                placeholder="e.g. 85.00"
                value={unitPrice || ''}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Estimated Total Amount</label>
              <input
                type="text"
                value={`₹${totalAmount.toLocaleString('en-IN')}`}
                disabled
              />
            </div>

            <div className="field full">
              <label htmlFor="purchase-remarks">Remarks / Delivery Notes</label>
              <textarea
                id="purchase-remarks"
                placeholder="Batch number, warranty, rack storage location..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="info-strip">
            <div className="item">
              <div className="k">Current Stock</div>
              <div className="v">
                {currentStock} {selectedProduct?.unit}
              </div>
            </div>
            <div className="item">
              <div className="k">Purchased Quantity</div>
              <div className="v">
                +{numQty} {selectedProduct?.unit}
              </div>
            </div>
            <div className="item">
              <div className="k">New Stock Count</div>
              <div className="v" style={{ color: 'var(--green-600)' }}>
                {newCalculatedStock} {selectedProduct?.unit}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Recording Purchase...' : 'Record Purchase'}
            </Button>
            <Link to="/products" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseForm;
