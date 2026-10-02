import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import { productApi } from '../services/api';
import Loading from '../components/common/Loading';

export const LowStock = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        setLoading(true);
        const res = await productApi.getProducts({ lowStock: true });
        if (res.success) {
          setProducts(res.products || []);
        }
      } catch (err) {
        console.error('Failed to fetch low stock products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLowStock();
  }, []);

  const getMin = (p) => p.minimumQuantity !== undefined ? p.minimumQuantity : (p.minimumStockLevel !== undefined ? p.minimumStockLevel : (p.minStockLevel || 0));

  const sortedLowStock = [...products].sort((a, b) => {
    const deficitA = getMin(a) - (a.currentQuantity || 0);
    const deficitB = getMin(b) - (b.currentQuantity || 0);
    return deficitB - deficitA;
  });

  const totalItems = sortedLowStock.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLowStock = sortedLowStock.slice(startIndex, startIndex + pageSize);

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Low Stock Alerts</h1>
          <p>Consumable items currently at or below minimum threshold requiring purchase replenishment.</p>
        </div>
        <div className="topbar-actions">
          <Link to="/purchases" className="btn-primary">
            <span className="icon">↧</span> Record Purchase
          </Link>
        </div>
      </div>

      <div className="content-area">
        {products.length > 0 ? (
          <div
            style={{
              background: 'var(--amber-50)',
              border: '1px solid var(--amber-300)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              marginBottom: '24px',
              color: 'var(--amber-900)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>⚠</span>
            <span>
              <strong>Attention Required:</strong> There are <strong>{products.length} electrical products</strong> currently
              running below the minimum safe threshold. Purchase orders should be initiated promptly.
            </span>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--green-50)',
              border: '1px solid var(--green-300)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              marginBottom: '24px',
              color: 'var(--green-900)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>✓</span>
            <span>
              <strong>Inventory Status Healthy:</strong> All products in the warehouse meet or exceed safe minimum stock levels.
            </span>
          </div>
        )}

        <div className="card">
          <div className="card-head">
            <span className="card-title">Deficit Inventory Items</span>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {totalItems} product{totalItems === 1 ? '' : 's'} flagged
            </span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <Loading message="Checking inventory levels..." />
            ) : totalItems === 0 ? (
              <EmptyState
                icon="✓"
                title="All Inventory Levels Safe"
                description="No items are currently below minimum stock thresholds."
              />
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product Code</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Stock Register</th>
                        <th>Current Quantity</th>
                        <th>Min Required</th>
                        <th>Deficit Units</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLowStock.map((product) => {
                        const minLevel = getMin(product);
                        const deficit = Math.max(0, minLevel - (product.currentQuantity || 0));
                        const isCritical = product.currentQuantity <= Math.floor(minLevel / 2);

                        return (
                          <tr key={product._id}>
                            <td className="code" style={{ fontWeight: 700 }}>
                              <Link to={`/products/${product._id}`}>{product.productCode}</Link>
                            </td>
                            <td>
                              <Link to={`/products/${product._id}`} className="cell-strong">
                                {product.productName || product.name}
                              </Link>
                            </td>
                            <td>{product.category}</td>
                            <td>
                              <span className="badge badge-blue">{product.stockRegister || 'SR1'}</span>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--red-600)', fontSize: '0.95rem' }}>
                                {product.currentQuantity} {product.unit || 'Pieces'}
                              </strong>
                            </td>
                            <td>
                              {minLevel} {product.unit || 'Pieces'}
                            </td>
                            <td>
                              <strong style={{ color: 'var(--red-700)' }}>
                                −{deficit} {product.unit || 'Pieces'}
                              </strong>
                            </td>
                            <td>
                              <StatusBadge status={isCritical ? 'CRITICAL' : 'LOW_STOCK'} />
                            </td>
                            <td>
                              <Link
                                to={`/purchases?productCode=${encodeURIComponent(product.productCode)}&productId=${product._id}`}
                                className="btn-primary btn-sm"
                                style={{ whiteSpace: 'nowrap' }}
                              >
                                Record Restock Purchase
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LowStock;
