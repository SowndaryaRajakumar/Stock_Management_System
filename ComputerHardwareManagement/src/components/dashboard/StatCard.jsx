import React from "react";

export const StatCard = ({
  label,
  figure,
  icon = "▦",
  variant = "blue", // blue, green, red, amber
  onClick = null
}) => {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div>
        <div className="label">{label}</div>
        <div className="figure">{figure}</div>
      </div>
      <div className={`stat-icon ${variant}`} aria-hidden="true">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
