import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';

const EditIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const DeleteIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export const ProductTable = ({ products = [], onEdit = null, onDelete = null }) => {
  const { isAdmin } = useAuth();

  if (products.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="No products found"
        description="Try adjusting your search criteria or filter options."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product Code</th>
            <th>Product Name</th>
            <th>Category</th>
            <th>Available Qty</th>
            <th>Minimum Qty</th>
            <th>Unit</th>
            <th>Stock Register</th>
            <th>Page No.</th>
            <th>Status</th>
            <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isLowStock = product.currentQuantity <= product.minimumStockLevel;
            const isNearing =
              !isLowStock && product.currentQuantity <= product.minimumStockLevel + 2;
            const statusText = isLowStock
              ? 'Low Stock'
              : isNearing
              ? 'Nearing Limit'
              : 'Available';

            const registerName = product.stockRegister || product.registerRefs?.[0]?.sheet || 'SR1';
            const pageNum = product.pageNumber || product.registerRefs?.[0]?.page || '—';

            return (
              <tr key={product._id || product.id}>
                <td className="code">{product.productCode}</td>
                <td>
                  <Link to={`/products/${product._id || product.id}`} className="cell-strong">
                    {product.name || product.productName}
                  </Link>
                </td>
                <td>{product.category}</td>
                <td>
                  <strong style={{ color: isLowStock ? 'var(--red-600)' : 'inherit' }}>
                    {product.currentQuantity}
                  </strong>
                </td>
                <td>{product.minimumStockLevel}</td>
                <td>{product.unit || 'Pieces'}</td>
                <td>
                  <span className="badge badge-blue" style={{ fontWeight: 700 }}>
                    {registerName}
                  </span>
                </td>
                <td>{pageNum}</td>
                <td>
                  <StatusBadge status={statusText} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                    {isAdmin && onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        title="Edit Product"
                        aria-label="Edit Product"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          padding: '0',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <EditIcon />
                      </button>
                    )}

                    {isAdmin && onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        title="Delete Product"
                        aria-label="Delete Product"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          padding: '0',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          background: '#fff5f5',
                          color: '#b91c1c',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <DeleteIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
