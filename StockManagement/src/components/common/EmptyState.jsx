import React from "react";

export const EmptyState = ({
  icon = "📂",
  title = "No records found",
  description = "No items match your criteria or none have been added yet.",
  action = null
}) => {
  return (
    <div className="empty-state">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p style={{ maxWidth: "340px", margin: "0 auto 16px", fontSize: "0.84rem" }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
