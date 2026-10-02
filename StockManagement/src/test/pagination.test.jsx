import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Pagination from '../components/common/Pagination';

describe('Pagination Component', () => {
  it('renders correct page info range and page numbers', () => {
    const handlePageChange = vi.fn();
    const handleSizeChange = vi.fn();

    render(
      <Pagination
        currentPage={1}
        totalItems={45}
        pageSize={10}
        onPageChange={handlePageChange}
        onPageSizeChange={handleSizeChange}
      />
    );

    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getByText('45')).toBeInTheDocument();

    // Check Previous/First buttons are disabled on page 1
    const prevBtn = screen.getByTitle('Previous Page');
    expect(prevBtn).toBeDisabled();

    // Click Next button
    const nextBtn = screen.getByTitle('Next Page');
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);
    expect(handlePageChange).toHaveBeenCalledWith(2);

    // Change Page size
    const sizeSelect = screen.getByLabelText(/Items per page/i);
    fireEvent.change(sizeSelect, { target: { value: '25' } });
    expect(handleSizeChange).toHaveBeenCalledWith(25);
  });

  it('renders nothing when totalItems is 0', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalItems={0}
        pageSize={10}
        onPageChange={() => {}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
