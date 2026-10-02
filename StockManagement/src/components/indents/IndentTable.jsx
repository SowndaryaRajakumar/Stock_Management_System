import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';

export const IndentTable = ({ indents = [], onReview = null, onApprove = null, onReject = null }) => {
  const { isAdmin } = useAuth();

  if (indents.length === 0) {
    return (
      <EmptyState
        icon="▧"
        title="No indent requests found"
        description="No requisitions match your search or filter criteria in MongoDB."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Indent No.</th>
            <th>Date</th>
            {isAdmin && <th>Faculty / Requester</th>}
            {isAdmin && <th>Department</th>}
            <th>Requested Products</th>
            <th>Total Qty</th>
            <th>Purpose</th>
            <th>Status</th>
            {!isAdmin && <th>Admin Remarks</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {indents.map((indent) => {
            const isPending = ['SUBMITTED', 'PENDING', 'RECOMMENDED'].includes(indent.status);

            const productsSummary = indent.items && indent.items.length > 0
              ? indent.items.map(i => `${i.productName || i.productCode} (${i.quantityRequired || i.requestedQuantity} ${i.unit || 'pcs'})`).join(', ')
              : '—';

            const totalQuantity = indent.items && indent.items.length > 0
              ? indent.items.reduce((sum, i) => sum + (Number(i.quantityRequired || i.requestedQuantity) || 0), 0)
              : 0;

            return (
              <tr key={indent._id || indent.indentNumber}>
                <td className="code" style={{ fontWeight: 700 }}>
                  <Link to={`/indents/${indent._id || indent.indentNumber}`}>
                    {indent.indentNumber}
                  </Link>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{indent.requestDate || indent.date}</td>
                {isAdmin && <td><strong>{indent.requesterName || indent.requestedBy}</strong></td>}
                {isAdmin && <td>{indent.department}</td>}
                <td style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={productsSummary}>
                  {productsSummary}
                </td>
                <td>
                  <strong>{totalQuantity}</strong>
                </td>
                <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={indent.purpose}>
                  {indent.purpose}
                </td>
                <td>
                  <StatusBadge status={indent.status} />
                </td>
                {!isAdmin && (
                  <td className="small" style={{ maxWidth: '160px', color: 'var(--text-700)' }}>
                    {indent.adminRemarks || '—'}
                  </td>
                )}
                <td>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Link
                      to={`/indents/${indent._id || indent.indentNumber}`}
                      className="btn-outline btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                    >
                      View
                    </Link>

                    {isAdmin && isPending && onReview && (
                      <button
                        type="button"
                        onClick={() => onReview(indent)}
                        className="btn-primary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                        title="Review and approve/reject this requisition"
                      >
                        Review / Decide
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

export default IndentTable;
