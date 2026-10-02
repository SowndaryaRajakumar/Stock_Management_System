import React from 'react';
import { Link } from 'react-router-dom';

export const StockHistoryTable = ({ transactions = [] }) => {
  if (transactions.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
          No transactions found.
        </div>
        <p style={{ fontSize: '0.84rem', margin: 0 }}>
          No recorded purchase or departmental transfer transactions match your filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
            <th style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>Date & Time</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>Transaction ID</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Product</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Transaction Type</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Quantity</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Previous Stock</th>
            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>New Stock</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Department</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Performed By</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Reference</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn, idx) => {
            const rawType = (txn.type || txn.transactionType || '').toUpperCase();
            const isPurchase = rawType === 'PURCHASE' || rawType === 'IN';
            const qty = Math.abs(Number(txn.quantity || 0));

            // Format date readable e.g. "17 Sep 2026"
            let dateDisplay = txn.date || '';
            if (txn.transactionDate) {
              const d = new Date(txn.transactionDate);
              if (!isNaN(d.getTime())) {
                dateDisplay = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              }
            }

            return (
              <tr
                key={txn._id || txn.transactionId || idx}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: '#475569' }}>
                  {dateDisplay}
                </td>
                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>
                  {txn.transactionId || txn.transactionCode}
                </td>
                <td style={{ padding: '12px 16px', minWidth: '180px' }}>
                  <div>
                    <Link
                      to={`/products/${txn.productId || txn.productCode}`}
                      style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                    >
                      {txn.productName}
                    </Link>
                  </div>
                  {txn.productCode && (
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace', marginTop: '1px' }}>
                      {txn.productCode}
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 9px',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      letterSpacing: '0.4px',
                      background: isPurchase ? '#ecfdf5' : '#fff7ed',
                      color: isPurchase ? '#059669' : '#d97706',
                      border: `1px solid ${isPurchase ? '#a7f3d0' : '#fed7aa'}`
                    }}
                  >
                    {isPurchase ? 'PURCHASE' : 'TRANSFER'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isPurchase ? '#059669' : '#d97706' }}>
                    {isPurchase ? `+${qty}` : `-${qty}`}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>
                  {txn.previousQuantity !== undefined ? txn.previousQuantity : '—'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>
                  {txn.newQuantity !== undefined ? txn.newQuantity : '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#334155' }}>
                  {txn.department || 'Central Store'}
                </td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>
                  {txn.performedBy || txn.recordedBy || 'Admin'}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b' }}>
                  {txn.reference || txn.referenceId || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockHistoryTable;
