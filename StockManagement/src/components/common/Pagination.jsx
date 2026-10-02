import React from 'react';

export const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = ''
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endItem = Math.min(validPage * pageSize, totalItems);

  // Generate page numbers with ellipses (e.g. 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show page 1
      pages.push(1);

      let start = Math.max(2, validPage - 1);
      let end = Math.min(totalPages - 1, validPage + 1);

      if (validPage <= 2) {
        start = 2;
        end = 3;
      } else if (validPage >= totalPages - 1) {
        start = totalPages - 2;
        end = totalPages - 1;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`pagination-wrap ${className}`}>
      <div className="pagination-info">
        <span>
          Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="pagination-size-select">
            <label htmlFor="pagination-page-size" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Per page:
            </label>
            <select
              id="pagination-page-size"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                if (onPageChange) onPageChange(1);
              }}
              aria-label="Items per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="pagination-controls" aria-label="Pagination Navigation">
        {/* First Page */}
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(1)}
          disabled={validPage === 1}
          title="First Page"
          aria-label="Go to first page"
        >
          «
        </button>

        {/* Previous Page */}
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(validPage - 1)}
          disabled={validPage === 1}
          title="Previous Page"
          aria-label="Go to previous page"
        >
          ‹
        </button>

        {/* Numbered Page Buttons */}
        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                …
              </span>
            );
          }

          return (
            <button
              key={p}
              type="button"
              className={`pagination-btn ${p === validPage ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-current={p === validPage ? 'page' : undefined}
            >
              {p}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(validPage + 1)}
          disabled={validPage === totalPages}
          title="Next Page"
          aria-label="Go to next page"
        >
          ›
        </button>

        {/* Last Page */}
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={validPage === totalPages}
          title="Last Page"
          aria-label="Go to last page"
        >
          »
        </button>
      </div>
    </div>
  );
};

export default Pagination;
