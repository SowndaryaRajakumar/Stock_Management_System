import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
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
            const isProductActive = product.active !== false && String(product.status || '').toUpperCase() !== 'INACTIVE' && String(product.status || '').toUpperCase() !== 'DEACTIVATED';
            const statusText = isProductActive ? 'Active' : 'Inactive';

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
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    {isAdmin && onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="btn-secondary btn-sm"
                        style={{
                          padding: '6px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          border: '1px solid #bfdbfe',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          cursor: 'pointer'
                        }}
                        title="Edit Product"
                        aria-label="Edit Product"
                      >
                        <EditIcon />
                      </button>
                    )}

                    {isAdmin && onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        className="btn-danger btn-sm"
                        style={{
                          padding: '6px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          border: '1px solid #fecaca',
                          background: '#fff5f5',
                          color: '#b91c1c',
                          cursor: 'pointer'
                        }}
                        title="Delete Product"
                        aria-label="Delete Product"
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
