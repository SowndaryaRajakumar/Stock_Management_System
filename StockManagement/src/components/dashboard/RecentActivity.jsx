import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";

export const RecentActivity = ({ transactions = [] }) => {
  return (
    <div className="card">
      <div className="card-head">
        <h2>Recent Stock Activity</h2>
        <Link to="/history" className="small">
          View full history →
        </Link>
      </div>
      <div className="table-wrap">
        {transactions.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No activity recorded"
            description="Recent stock receipts and department issues will appear here."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 6).map((txn) => (
                <tr key={txn.id}>
                  <td>{txn.date}</td>
                  <td>
                    <Link to={`/products/${txn.productId}`} className="cell-strong">
                      {txn.productName}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={txn.type} type="transaction" />
                  </td>
                  <td><strong>{txn.quantity}</strong></td>
                  <td>{txn.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
