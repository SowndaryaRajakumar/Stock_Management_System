import React from "react";

export const SearchBar = ({
  value,
  onChange,
  placeholder = "Search products...",
  style = {},
  className = ""
}) => {
  return (
    <div className={`search-box ${className}`} style={style}>
      <span className="ic" aria-hidden="true">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
};

export default SearchBar;
