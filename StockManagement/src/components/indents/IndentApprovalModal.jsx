import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { indentApi, productApi } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

export const IndentApprovalModal = ({ isOpen, onClose, indent, onIndentProcessed }) => {
  const [approvedItems, setApprovedItems] = useState([]);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [liveStockMap, setLiveStockMap] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { fetchNotifications } = useNotifications();

  useEffect(() => {
    if (indent && indent.items) {
      // Default each item approved quantity to min(requestedQuantity, availableStock)
      const initialApproved = indent.items.map((item) => {
        const reqQty = item.requestedQuantity !== undefined ? item.requestedQuantity : (item.quantityRequired || 0);
        return {
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          requestedQuantity: reqQty,
          approvedQuantity: reqQty,
          stockRegister: item.stockRegister || 'SR1',
          unit: item.unit || 'Pieces'
        };
      });
      setApprovedItems(initialApproved);
      setError('');

      // Fetch live product stock from backend to ensure accurate available quantity
      const fetchLiveStock = async () => {
        try {
          const res = await productApi.getProducts();
          if (res.success) {
            const map = {};
            res.products.forEach((p) => {
              map[p._id] = p.currentQuantity;
            });
            setLiveStockMap(map);
          }
        } catch (e) {
          console.error('Failed to fetch live stock:', e);
        }
      };
      fetchLiveStock();
    }
  }, [indent]);

  const handleApprovedQtyChange = (index, value) => {
    const val = Math.max(0, Number(value) || 0);
    const updated = [...approvedItems];
    updated[index].approvedQuantity = val;
    setApprovedItems(updated);
  };

  const handleSetMaxAvailable = (index) => {
    const item = indent.items[index];
    const reqQty = item.requestedQuantity !== undefined ? item.requestedQuantity : (item.quantityRequired || 0);
    const liveAvailable = liveStockMap[item.productId] !== undefined ? liveStockMap[item.productId] : (item.availableQuantityAtRequest || 0);
    const maxPossible = Math.min(reqQty, liveAvailable);
    handleApprovedQtyChange(index, maxPossible);
  };

  const handleProcess = async (action) => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        action, // 'APPROVE', 'REJECT', 'PARTIALLY_APPROVE'
        approvedItems: action === 'REJECT' ? [] : approvedItems,
        adminRemarks: adminRemarks.trim()
      };

      const res = await indentApi.reviewIndent(indent._id || indent.id, payload);
      if (res.success) {
        fetchNotifications();
        onIndentProcessed(res.indent);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to process indent.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!indent) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review Indent ${indent.indentNumber} — ${indent.department}`}
      maxWidth="720px"
    >
      <div>
        {error && (
          <div className="login-error-box" role="alert" style={{ marginBottom: '14px' }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div
          style={{
            background: 'var(--blue-50)',
            border: '1px solid var(--blue-100)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '0.84rem'
          }}
        >
          <div>
            <strong>Requester:</strong> {indent.requesterName} ({indent.department})
          </div>
          <div>
            <strong>Purpose:</strong> {indent.purpose}
          </div>
          <div>
            <strong>Requested Date:</strong> {indent.requestDate} · <strong>Required By:</strong>{' '}
            {indent.requiredDate}
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--navy-900)' }}>
            Requested Products & Approval Quantities:
          </label>
        </div>

        <div className="table-wrap" style={{ marginBottom: '16px' }}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock Register</th>
                <th>Store Stock</th>
                <th>Requested Qty</th>
                <th>Approved Qty</th>
                <th>Quick Fill</th>
              </tr>
            </thead>
            <tbody>
              {indent.items?.map((item, idx) => {
                const reqQty = item.requestedQuantity !== undefined ? item.requestedQuantity : (item.quantityRequired || 0);
                const liveAvailable =
                  liveStockMap[item.productId] !== undefined
                    ? liveStockMap[item.productId]
                    : (item.availableQuantityAtRequest || 0);
                const approvedQty = approvedItems[idx]?.approvedQuantity ?? reqQty;
                const isOverStock = approvedQty > liveAvailable;

                return (
                  <tr key={idx}>
                    <td>
                      <div className="cell-strong">{item.productName}</div>
                      <span className="code">{item.productCode}</span>
                    </td>
                    <td>
                      <span className="badge badge-blue">{item.stockRegister || 'SR1'}</span>
                    </td>
                    <td>
                      <strong style={{ color: liveAvailable === 0 ? 'var(--red-600)' : 'inherit' }}>
                        {liveAvailable} {item.unit || 'Pieces'}
                      </strong>
                    </td>
                    <td>
                      <strong>
                        {reqQty} {item.unit || 'Pieces'}
                      </strong>
                    </td>
                    <td style={{ width: '130px' }}>
                      <input
                        type="number"
                        min="0"
                        max={liveAvailable}
                        value={approvedQty}
                        onChange={(e) => handleApprovedQtyChange(idx, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: isOverStock
                            ? '1px solid var(--red-600)'
                            : '1px solid var(--border-strong)',
                          fontSize: '0.86rem',
                          fontWeight: 700
                        }}
                      />
                      {isOverStock && (
                        <div style={{ color: 'var(--red-600)', fontSize: '0.68rem', marginTop: '2px' }}>
                          Exceeds stock ({liveAvailable} max)
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => handleSetMaxAvailable(idx)}
                        style={{ padding: '3px 6px', fontSize: '0.72rem', color: 'var(--blue-600)' }}
                      >
                        Max Available
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="field" style={{ marginBottom: '16px' }}>
          <label htmlFor="admin-review-remarks">Admin Remarks</label>
          <textarea
            id="admin-review-remarks"
            rows={2}
            value={adminRemarks}
            onChange={(e) => setAdminRemarks(e.target.value)}
            placeholder="Optional notes or instructions for the department..."
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border)',
            paddingTop: '16px'
          }}
        >
          <Button
            variant="danger"
            onClick={() => handleProcess('REJECT')}
            disabled={loading}
          >
            Reject Indent
          </Button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleProcess('APPROVE')}
              disabled={loading}
            >
              {loading ? 'Approving Indent...' : 'Approve Indent'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default IndentApprovalModal;
