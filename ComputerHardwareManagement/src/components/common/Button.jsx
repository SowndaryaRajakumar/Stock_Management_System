import React from "react";

export const Button = ({
  children,
  variant = "primary", // primary, secondary, outline, danger, ghost
  size = "md", // sm, md
  type = "button",
  onClick,
  disabled = false,
  className = "",
  style = {},
  icon = null,
  ...props
}) => {
  const baseClass = `btn-${variant}`;
  const sizeClass = size === "sm" ? "btn-sm" : "";
  const combinedClasses = `${baseClass} ${sizeClass} ${className}`.trim();

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled}
      style={style}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
