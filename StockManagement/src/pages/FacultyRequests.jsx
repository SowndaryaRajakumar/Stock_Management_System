import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import IndentTable from '../components/indents/IndentTable';
import { indentApi } from '../services/api';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

export const FacultyRequests = () => {
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchIndents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await indentApi.getIndents(params);
      if (res.success) {
        setIndents(res.indents || []);
        setTotalItems(res.total !== undefined ? res.total : (res.count || res.indents?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch faculty indents:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchIndents();
  }, [fetchIndents]);

  return (
    <Layout
      title="My Indent Requests"
      breadcrumb="Faculty Portal / Requisitions"
    >
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>My Indent Requisitions</h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Track the status of your departmental consumable requisitions submitted to the Central Store.
            </p>
          </div>
          <Link to="/indents/create" className="btn-primary">
            <span className="icon">＋</span> Create New Indent
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <input
              type="text"
              placeholder="Search by indent # or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label htmlFor="fac-status-select" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-600)' }}>Status:</label>
            <select
              id="fac-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Pending / Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="ISSUED">Issued</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {indents.length} of {totalItems} requisitions
          </span>
        </div>
      </div>

      {/* Indents Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading message="Fetching your indent requests from MongoDB..." />
        ) : indents.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📝</div>
            <h3 style={{ fontSize: '1rem', color: 'var(--navy-900)', marginBottom: '6px' }}>No Indent Requests Found</h3>
            <p style={{ color: 'var(--text-500)', fontSize: '0.85rem', marginBottom: '16px' }}>
              You have not submitted any material indent requisitions yet.
            </p>
            <Link to="/indents/create" className="btn-primary" style={{ display: 'inline-flex' }}>
              Create Your First Indent
            </Link>
          </div>
        ) : (
          <IndentTable
            indents={indents}
            isAdmin={false}
          />
        )}

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </Layout>
  );
};

export default FacultyRequests;
