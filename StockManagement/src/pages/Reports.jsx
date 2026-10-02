import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import { reportApi, masterDataApi } from '../services/api';
import { exportToExcel, exportToPDF } from '../services/exportService';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

const REPORT_COLUMNS = {
  LOW_STOCK: [
    { header: 'Product Code', dataKey: 'productCode' },
    { header: 'Product Name', dataKey: 'name' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Stock Register', dataKey: 'stockRegister' },
    { header: 'Current Stock', dataKey: 'currentQuantity' },
    { header: 'Min Stock Level', dataKey: 'minimumStockLevel' },
    { header: 'Deficit Qty', dataKey: 'deficit' },
    { header: 'Unit', dataKey: 'unit' },
    { header: 'Status', dataKey: 'status' }
  ],
  PRODUCT: [
    { header: 'Product Code', dataKey: 'productCode' },
    { header: 'Product Name', dataKey: 'name' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Stock Register', dataKey: 'stockRegister' },
    { header: 'Current Stock', dataKey: 'currentQuantity' },
    { header: 'Min Stock', dataKey: 'minimumStockLevel' },
    { header: 'Unit', dataKey: 'unit' },
    { header: 'Status', dataKey: 'status' }
  ],
  PURCHASE: [
    { header: 'Purchase ID', dataKey: 'purchaseId' },
    { header: 'Date', dataKey: 'date' },
    { header: 'Invoice #', dataKey: 'invoiceNumber' },
    { header: 'Product Code', dataKey: 'productCode' },
    { header: 'Product Name', dataKey: 'productName' },
    { header: 'Stock Register', dataKey: 'stockRegister' },
    { header: 'Quantity', dataKey: 'quantity' },
    { header: 'Supplier / Vendor', dataKey: 'supplier' },
    { header: 'Recorded By', dataKey: 'recordedBy' }
  ],
  TRANSFER: [
    { header: 'Transfer ID', dataKey: 'transferId' },
    { header: 'Date', dataKey: 'date' },
    { header: 'Department', dataKey: 'department' },
    { header: 'Product Code', dataKey: 'productCode' },
    { header: 'Product Name', dataKey: 'productName' },
    { header: 'Stock Register', dataKey: 'stockRegister' },
    { header: 'Quantity', dataKey: 'quantity' },
    { header: 'Indent Ref', dataKey: 'indentNumber' },
    { header: 'Issued By', dataKey: 'issuedBy' }
  ],
  INDENT: [
    { header: 'Indent Number', dataKey: 'indentNumber' },
    { header: 'Request Date', dataKey: 'date' },
    { header: 'Faculty / Staff', dataKey: 'requester' },
    { header: 'Department', dataKey: 'department' },
    { header: 'Item Count', dataKey: 'itemsCount' },
    { header: 'Items Summary', dataKey: 'itemSummary' },
    { header: 'Status', dataKey: 'status' }
  ],
  HISTORY: [
    { header: 'Txn ID', dataKey: 'transactionId' },
    { header: 'Date', dataKey: 'date' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Product Code', dataKey: 'productCode' },
    { header: 'Product Name', dataKey: 'productName' },
    { header: 'Stock Register', dataKey: 'stockRegister' },
    { header: 'Quantity', dataKey: 'quantity' },
    { header: 'Prev Stock', dataKey: 'previousQuantity' },
    { header: 'New Stock', dataKey: 'newQuantity' },
    { header: 'Department / Source', dataKey: 'department' },
    { header: 'Reference', dataKey: 'referenceId' },
    { header: 'Performed By', dataKey: 'performedBy' }
  ]
};

export const Reports = () => {
  const [reportType, setReportType] = useState('PRODUCT');
  const [reportTitle, setReportTitle] = useState('Product Stock Inventory Report');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dynamic filter options from DB
  const [availableRegisters, setAvailableRegisters] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);

  // Filters
  const [register, setRegister] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Load master data filter options from DB
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [regRes, catRes, deptRes] = await Promise.all([
          masterDataApi.getStockDocuments(),
          masterDataApi.getCategories(),
          masterDataApi.getDepartments()
        ]);
        if (regRes.success && (regRes.documents || regRes.data)) {
          setAvailableRegisters(regRes.documents || regRes.data || []);
        }
        if (catRes.success && (catRes.categories || catRes.data)) {
          setAvailableCategories(catRes.categories || catRes.data || []);
        }
        if (deptRes.success && (deptRes.departments || deptRes.data)) {
          setAvailableDepartments(deptRes.departments || deptRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load master filters for reports:', err);
      }
    };
    loadFilters();
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        reportType,
        register: register || 'ALL',
        category: category || 'ALL',
        department: department || 'ALL'
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await reportApi.getReportData(params);
      if (res.success) {
        setData(res.data || []);
        setReportTitle(res.title || `${reportType} Report`);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      setLoading(false);
    }
  }, [reportType, register, category, department, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportExcel = () => {
    const filename = `${reportType.toLowerCase()}_report_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(data, REPORT_COLUMNS[reportType], filename, reportTitle);
  };

  const handleExportPDF = () => {
    const filename = `${reportType.toLowerCase()}_report_${new Date().toISOString().split('T')[0]}`;
    exportToPDF(data, REPORT_COLUMNS[reportType], filename, reportTitle);
  };

  const columns = REPORT_COLUMNS[reportType] || [];
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Layout
      title="Institutional Stock Reports"
      breadcrumb="Reports / Export"
    >
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>Consumable Stock Reports</h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Preview and export official inventory balances, low-stock deficit lists, and movement history.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" onClick={handleExportExcel} disabled={data.length === 0}>
              📊 Export to Excel (.xlsx)
            </Button>
            <Button variant="primary" onClick={handleExportPDF} disabled={data.length === 0}>
              📄 Download Official PDF (.pdf)
            </Button>
          </div>
        </div>
      </div>

      <div className="content-area">
        {/* Report configuration card */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-head">
            <span className="card-title">Report Parameters & Data Scope</span>
          </div>
          <div className="card-body">
            {/* Report Type selector tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {[
                { id: 'PRODUCT', label: '📦 Master Product Inventory' },
                { id: 'LOW_STOCK', label: '⚠️ Low Stock & Deficit Alerts' },
                { id: 'PURCHASE', label: '↧ Purchases' },
                { id: 'TRANSFER', label: '↥ Department Transfers' },
                { id: 'INDENT', label: '📋 Indent Requisitions' },
                { id: 'HISTORY', label: '≣ Movement History' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReportType(tab.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: reportType === tab.id ? 'var(--blue-600)' : 'var(--border)',
                    background: reportType === tab.id ? 'var(--blue-50)' : 'var(--surface)',
                    color: reportType === tab.id ? 'var(--blue-700)' : 'var(--text-main)',
                    fontWeight: reportType === tab.id ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.84rem'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter controls */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border)'
              }}
            >
              <div className="field">
                <label>Stock Register</label>
                <select value={register} onChange={(e) => setRegister(e.target.value)}>
                  <option value="">All Registers</option>
                  {availableRegisters.map((reg) => (
                    <option key={reg._id || reg.name} value={reg.name}>
                      {reg.name} {reg.description ? `(${reg.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {(reportType === 'PRODUCT' || reportType === 'LOW_STOCK') && (
                <div className="field">
                  <label>Product Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {availableCategories.map((cat) => (
                      <option key={cat._id || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(reportType === 'TRANSFER' || reportType === 'INDENT' || reportType === 'HISTORY') && (
                <div className="field">
                  <label>Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="">All Departments</option>
                    {availableDepartments.map((dept) => (
                      <option key={dept._id || dept.name} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(reportType === 'PURCHASE' || reportType === 'TRANSFER' || reportType === 'INDENT' || reportType === 'HISTORY') && (
                <>
                  <div className="field">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Report Preview Table */}
        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="card-title">{reportTitle}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '12px' }}>
                ({data.length} records matching criteria)
              </span>
            </div>
            <Button variant="ghost" onClick={fetchReport} style={{ fontSize: '0.78rem' }}>
              ↻ Refresh Data
            </Button>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '40px' }}>
                <Loading message="Generating report from MongoDB Atlas records..." />
              </div>
            ) : data.length === 0 ? (
              <div style={{ padding: '40px' }}>
                <EmptyState
                  title="No Records Found"
                  message="There are no records matching your selected parameters and date filters."
                />
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      {columns.map((col) => (
                        <th key={col.dataKey}>{col.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        {columns.map((col) => {
                          const val = row[col.dataKey];
                          const isCode = col.dataKey.toLowerCase().includes('code') || col.dataKey.toLowerCase().includes('id');
                          const isStatus = col.dataKey.toLowerCase() === 'status';

                          return (
                            <td key={col.dataKey}>
                              {isCode ? (
                                <span className="code">{val || '—'}</span>
                              ) : isStatus ? (
                                <span
                                  className={`badge ${
                                    val === 'Available' || val === 'APPROVED' || val === 'ISSUED'
                                      ? 'badge-green'
                                      : val === 'Low Stock' || val === 'Out of Stock' || val === 'REJECTED'
                                      ? 'badge-red'
                                      : 'badge-amber'
                                  }`}
                                >
                                  {val || '—'}
                                </span>
                              ) : (
                                val ?? '—'
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {data.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={data.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
