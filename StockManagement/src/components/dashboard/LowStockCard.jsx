import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";

export const LowStockCard = ({ items = [] }) => {
  return (
    <div className="card">
      <div className="card-head">
        <h2>Low Stock Items</h2>
        <Link to="/low-stock" className="small">
          View all →
        </Link>
      </div>
      <div className="table-wrap">
        {items.length === 0 ? (
          <EmptyState
            icon="✓"
            title="All stock levels healthy"
            description="No items are currently below minimum stock requirements."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Available Qty</th>
                <th>Minimum Qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 5).map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/products/${item.id}`} className="cell-strong">
                      {item.name}
                    </Link>
                  </td>
                  <td>
                    {item.currentStock} {item.unit}
                  </td>
                  <td>
                    {item.minStock} {item.unit}
                  </td>
                  <td>
                    <StatusBadge status="Low Stock" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LowStockCard;
