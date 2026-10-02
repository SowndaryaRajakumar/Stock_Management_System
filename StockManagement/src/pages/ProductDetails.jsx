import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import StatusBadge from '../components/common/StatusBadge';
import StockReferenceCard from '../components/products/StockReferenceCard';
import EditProductModal from '../components/products/EditProductModal';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Loading from '../components/common/Loading';
import { productApi, historyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ProductDetails = ({ initialEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin controls state
  const shouldOpenEdit = initialEdit || location.pathname.endsWith('/edit');
  const [isEditModalOpen, setIsEditModalOpen] = useState(shouldOpenEdit);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isAddRemarkOpen, setIsAddRemarkOpen] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [remarkAuthor, setRemarkAuthor] = useState(user?.name ? `${user.name} (Admin)` : 'Admin');
  const [feedback, setFeedback] = useState(null);

  const loadProductData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await productApi.getProductDetails(id);
      if (res.success && res.product) {
        const prod = res.product;
        if (res.references && res.references.length > 0) {
          prod.registerRefs = res.references.map(r => ({
            sheet: r.sheet || r.stockDocument || r.stockDocumentName,
            page: r.page || r.pageNumber,
            note: r.referenceNote
          }));
        } else if (prod.registerRefs && prod.registerRefs.length > 0) {
          prod.registerRefs = prod.registerRefs.map(r => ({
            sheet: r.sheet || r.stockDocumentName,
            page: r.page || r.pageNumber,
            note: r.note || r.referenceNote
          }));
        } else if (prod.stockRegister) {
          prod.registerRefs = [{
            sheet: prod.stockRegister,
            page: prod.pageNumber || 1
          }];
        }

        if (res.remarks && res.remarks.length > 0) {
          prod.remarks = res.remarks.map(rem => ({
            id: rem._id || rem.id,
            author: rem.enteredBy || rem.author || 'Admin',
            date: rem.enteredAt ? new Date(rem.enteredAt).toISOString().split('T')[0] : (rem.date || new Date().toISOString().split('T')[0]),
            text: rem.remark || rem.text
          }));
        }
        setProduct(prod);
        setHistory(res.history || []);
      } else {
        const singleRes = await productApi.getProductById(id);
        if (singleRes.success && singleRes.product) {
          const prod = singleRes.product;
          if (!prod.registerRefs || prod.registerRefs.length === 0) {
            prod.registerRefs = [{
              sheet: prod.stockRegister || 'SR1',
              page: prod.pageNumber || 1
            }];
          }
          setProduct(prod);
          if (isAdmin) {
            const histRes = await historyApi.getStockHistory({ search: prod.productCode });
            if (histRes.success) {
              setHistory(histRes.transactions || []);
            }
          }
        } else {
          setError('Product not found.');
        }
      }
    } catch (err) {
      console.error('Failed to load product details:', err);
      setError('Product not found.');
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  if (loading && !product) {
    return (
      <Layout title="Product Details" breadcrumb="Products / Loading">
        <Loading message="Fetching product specifications and stock details from database..." />
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout title="Product Details" breadcrumb="Products / Not Found">
        <div className="card card-pad" style={{ textAlign: 'center', padding: '40px', maxWidth: '600px', margin: '40px auto' }}>
          <EmptyState
            icon="⚠"
            title="Product Not Found"
            description={`Could not find product matching ID/Code "${id}".`}
            action={
              <Link to={isAdmin ? "/products" : "/faculty/catalog"} className="btn-primary">
                ← Back to {isAdmin ? 'Products' : 'Product Catalog'}
              </Link>
            }
          />
        </div>
      </Layout>
    );
  }

  const minStock = product.minimumQuantity !== undefined ? product.minimumQuantity : (product.minimumStockLevel || 5);
  const curQty = product.currentQuantity !== undefined ? product.currentQuantity : (product.currentStock || 0);
  const isLowStock = curQty <= minStock;
  const isNearing = !isLowStock && curQty <= minStock + 2;
  const statusText = isLowStock ? 'Low Stock' : isNearing ? 'Nearing Limit' : 'Available';

  const handleSaveRemark = async (e) => {
    e.preventDefault();
    if (!remarkText.trim()) return;

    try {
      const res = await productApi.addRemark(product._id || product.id, {
        remark: remarkText.trim(),
        text: remarkText.trim(),
        author: remarkAuthor
      });
      if (res.success) {
        const newRem = {
          id: res.remark?._id || `rem-${Date.now()}`,
          author: remarkAuthor,
          date: new Date().toISOString().split('T')[0],
          text: remarkText.trim()
        };
        setProduct((prev) => ({
          ...prev,
          remarks: [newRem, ...(prev.remarks || [])]
        }));
        setRemarkText('');
        setIsAddRemarkOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save remark.');
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await productApi.deleteProduct(product._id || product.id);
      setIsDeleteModalOpen(false);
      if (res.success) {
        if (res.deactivated) {
          setFeedback({
            type: 'info',
            message: res.message || 'This product cannot be deleted because it is referenced by existing stock or transaction records. It has been deactivated instead.'
          });
          loadProductData();
        } else {
          alert(res.message || 'Product deleted successfully.');
          navigate('/products');
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formattedCreatedDate = product.createdAt
    ? new Date(product.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  const formattedUpdatedDate = product.updatedAt
    ? new Date(product.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  return (
    <Layout
      title="Product Details"
      breadcrumb={`${isAdmin ? 'Inventory' : 'Catalog'} / ${product.productName || product.name} (${product.productCode})`}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Navigation & Actions Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <Link to={isAdmin ? "/products" : "/faculty/catalog"} className="back-link" style={{ marginBottom: 0, fontWeight: 600 }}>
            ← Back to {isAdmin ? 'Products' : 'Product Catalog'}
          </Link>

          {/* ADMIN ACTIONS */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                ✏ Edit Product
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                🗑 Delete
              </Button>
            </div>
          )}

          {/* FACULTY ACTION */}
          {!isAdmin && (
            <Button
              variant="primary"
              onClick={() => navigate(`/indents/create?product=${product._id || product.id}`)}
              disabled={curQty <= 0}
            >
              {curQty <= 0 ? 'Out of Stock' : 'Request Item →'}
            </Button>
          )}
        </div>

        {feedback && (
          <div
            className={feedback.type === 'info' ? 'alert-box' : 'success-box'}
            style={{ marginBottom: '20px' }}
          >
            ℹ {feedback.message}
          </div>
        )}

        {/* Product Details Header Card */}
        <div className="card card-pad" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span className="code" style={{ fontSize: '0.95rem', fontWeight: 700, padding: '3px 8px', background: 'var(--navy-100)', color: 'var(--blue-700)', borderRadius: '4px' }}>
                  {product.productCode}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>·</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-600)' }}>
                  Status: <strong style={{ color: product.active === false ? 'var(--red-600)' : 'var(--green-600)' }}>{product.active === false ? 'INACTIVE' : 'ACTIVE'}</strong>
                </span>
              </div>
              <h1 style={{ fontSize: '1.6rem', color: 'var(--navy-900)', margin: '4px 0 8px 0' }}>
                {product.productName || product.name}
              </h1>
              {product.description && (
                <p style={{ margin: '6px 0 0 0', fontSize: '0.92rem', color: 'var(--text-700)', maxWidth: '650px', lineHeight: 1.5 }}>
                  {product.description}
                </p>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <StatusBadge status={statusText} />
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Stock Status: <strong>{isLowStock ? 'LOW STOCK' : 'AVAILABLE'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Product Information */}
        <div className="section" style={{ marginBottom: '24px' }}>
          <div className="card">
            <div className="card-head" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2>Product Information</h2>
              <span className="hint">Specification & master classification</span>
            </div>
            <div className="card-pad">
              <div className="def-list">
                <div>
                  <div className="dt">Product Code</div>
                  <div className="dd" style={{ fontWeight: 600, color: 'var(--blue-700)' }}>
                    {product.productCode}
                  </div>
                </div>
                <div>
                  <div className="dt">Product Name</div>
                  <div className="dd" style={{ fontWeight: 600 }}>
                    {product.productName || product.name}
                  </div>
                </div>
                <div>
                  <div className="dt">Category</div>
                  <div className="dd">
                    <span className="badge badge-blue">{product.category}</span>
                  </div>
                </div>
                <div>
                  <div className="dt">Unit of Measurement</div>
                  <div className="dd">{product.unit || 'Pieces'}</div>
                </div>
                <div>
                  <div className="dt">Current Quantity</div>
                  <div className="dd" style={{ fontWeight: 700, fontSize: '1.1rem', color: isLowStock ? 'var(--red-600)' : 'var(--navy-900)' }}>
                    {curQty} {product.unit || 'Pieces'}
                  </div>
                </div>
                <div>
                  <div className="dt">Minimum Threshold Quantity</div>
                  <div className="dd">
                    {minStock} {product.unit || 'Pieces'}
                  </div>
                </div>
                {formattedCreatedDate && (
                  <div>
                    <div className="dt">Created Date</div>
                    <div className="dd" style={{ color: 'var(--text-600)' }}>
                      {formattedCreatedDate}
                    </div>
                  </div>
                )}
                {formattedUpdatedDate && (
                  <div>
                    <div className="dt">Last Updated</div>
                    <div className="dd" style={{ color: 'var(--text-600)' }}>
                      {formattedUpdatedDate}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Stock Information */}
        <div className="section" style={{ marginBottom: '24px' }}>
          <div className="card">
            <div className="card-head" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2>Stock Information</h2>
              <span className="hint">Central store inventory balance</span>
            </div>
            <div className="card-pad">
              <div className="def-list">
                <div>
                  <div className="dt">Current Stock</div>
                  <div className="dd" style={{ fontSize: '1.4rem', fontWeight: 700, color: isLowStock ? 'var(--red-600)' : 'var(--green-700)' }}>
                    {curQty} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{product.unit || 'Pieces'}</span>
                  </div>
                </div>
                <div>
                  <div className="dt">Minimum Stock</div>
                  <div className="dd" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                    {minStock} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{product.unit || 'Pieces'}</span>
                  </div>
                </div>
                <div>
                  <div className="dt">Stock Status</div>
                  <div className="dd" style={{ fontWeight: 700, color: isLowStock ? 'var(--red-600)' : isNearing ? 'var(--amber-700)' : 'var(--green-600)' }}>
                    {isLowStock
                      ? 'Low Stock (Requires Restock)'
                      : isNearing
                      ? 'Nearing Minimum Threshold'
                      : 'Available in Central Store'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Stock Register References */}
        <div className="section" style={{ marginBottom: '24px' }}>
          <div className="card">
            <div className="card-head" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2>Stock Register References</h2>
              <span className="hint">Physical store ledger & document references</span>
            </div>
            <div className="card-pad">
              <StockReferenceCard references={product.registerRefs} />
            </div>
          </div>
        </div>

        {/* ADMIN-ONLY Stock Movement History */}
        {isAdmin && (
          <div className="section" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div className="card-head" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2>Stock Movement History (Purchases & Transfers)</h2>
                <span className="hint">Audit log of all receipts and department issues in MongoDB</span>
              </div>
              <div className="table-wrap">
                {history.length === 0 ? (
                  <EmptyState
                    icon="📋"
                    title="No movement history"
                    description="No purchase or department transfer transactions recorded for this product yet."
                  />
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Department / Supplier</th>
                        <th>Recorded By</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((txn) => {
                        const isIncoming = txn.type === 'IN' || txn.type === 'PURCHASE' || txn.transactionType === 'IN' || txn.transactionType === 'PURCHASE';
                        return (
                          <tr key={txn._id || txn.id || txn.transactionId}>
                            <td style={{ whiteSpace: 'nowrap' }}>{txn.date}</td>
                            <td>
                              <span className={isIncoming ? 'tag-in' : 'tag-out'}>
                                {isIncoming ? 'IN' : 'OUT'}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: isIncoming ? 'var(--green-600)' : 'var(--red-600)' }}>
                                {isIncoming ? `+${txn.quantity}` : `-${txn.quantity}`}
                              </strong>
                            </td>
                            <td>{txn.department || 'Store'}</td>
                            <td>{txn.recordedBy || txn.performedBy || 'Admin'}</td>
                            <td className="small">{txn.remarks || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADMIN-ONLY Technical Remarks */}
        {isAdmin && (
          <div className="section" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div className="card-head" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2>Technical Remarks & Quality Inspection Notes</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddRemarkOpen(true)}
                >
                  + Add Remark
                </Button>
              </div>
              <div className="card-pad">
                {!product.remarks || product.remarks.length === 0 ? (
                  <EmptyState
                    icon="💬"
                    title="No remarks recorded"
                    description="Record initial inspection notes, rack locations, or technician comments."
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {product.remarks.map((rem, idx) => (
                      <div
                        key={rem.id || idx}
                        style={{
                          background: 'var(--slate-50)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <strong>{rem.author}</strong>
                          <span>{rem.date}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-800)' }}>
                          {rem.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Add Remark Modal */}
      {isAdmin && (
        <Modal
          isOpen={isAddRemarkOpen}
          onClose={() => setIsAddRemarkOpen(false)}
          title={`Add Technical Remark for ${product.productName || product.name}`}
        >
          <form onSubmit={handleSaveRemark}>
            <div className="field">
              <label htmlFor="remark-author">Author</label>
              <input
                type="text"
                id="remark-author"
                value={remarkAuthor}
                onChange={(e) => setRemarkAuthor(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="remark-text">Remark / Technical Note *</label>
              <textarea
                id="remark-text"
                rows="4"
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setIsAddRemarkOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save to Database
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Delete Confirmation Modal */}
      {isAdmin && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Product Deletion"
        >
          <div style={{ padding: '4px 0' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-800)', marginBottom: '16px' }}>
              Are you sure you want to delete this product?
            </p>

            <div
              style={{
                background: 'var(--slate-50)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                marginBottom: '16px'
              }}
            >
              <div><strong>Product Code:</strong> {product.productCode}</div>
              <div><strong>Product Name:</strong> {product.productName || product.name}</div>
              <div><strong>Current Stock:</strong> {curQty} {product.unit || 'Pieces'}</div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Note: If this product has historical transactions, purchases, transfers, or indents recorded,
              it will be safely deactivated rather than permanently removed, protecting your historical ledger.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Processing...' : 'Delete Product'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Edit Modal */}
      {isAdmin && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          product={product}
          onProductUpdated={(updated) => {
            setProduct(updated);
            loadProductData();
          }}
        />
      )}
    </Layout>
  );
};

export default ProductDetails;
