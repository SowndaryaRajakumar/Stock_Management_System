import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { analyticsApi, stockApi, transferApi } from '../services/api';
import Loading from '../components/common/Loading';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b'];
const REGISTER_COLORS = {
  SR1: '#2563eb',
  SR2: '#10b981',
  SR3: '#f59e0b',
  CSSR1: '#8b5cf6'
};

const DATE_PRESETS = [
  { id: '7days', label: 'Last 7 Days', rangeText: '11 Sep 2026 - 17 Sep 2026', days: 7 },
  { id: '14days', label: 'Last 14 Days', rangeText: '04 Sep 2026 - 17 Sep 2026', days: 14 },
  { id: '30days', label: 'Last 30 Days', rangeText: '19 Aug 2026 - 17 Sep 2026', days: 30 },
  { id: 'month', label: 'This Month', rangeText: '01 Sep 2026 - 17 Sep 2026', days: 17 },
  { id: 'custom', label: 'Custom Range', rangeText: '01 Sep 2026 - 17 Sep 2026', days: 17 }
];

export const Analytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [lowStockItems, setLowStockItems] = useState([]);
  const [topConsumedItems, setTopConsumedItems] = useState([]);

  const [dateFilter, setDateFilter] = useState('14days');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, lowStockRes, transfersRes] = await Promise.all([
        analyticsApi.getAnalyticsOverview(),
        stockApi.getLowStock().catch(() => ({ success: false, lowStockProducts: [] })),
        transferApi.getTransfers({ limit: 100 }).catch(() => ({ success: false, transfers: [] }))
      ]);

      if (overviewRes && overviewRes.success) {
        setData(overviewRes);
      } else {
        throw new Error(overviewRes?.message || 'Failed to aggregate analytics data');
      }

      // Low Stock items
      const rawLowStock = lowStockRes?.lowStockProducts || lowStockRes?.data || [];
      setLowStockItems(rawLowStock);

      // Top Consumed items aggregated dynamically from transfers
      const rawTransfers = transfersRes?.transfers || transfersRes?.data || [];
      const consumptionMap = {};
      rawTransfers.forEach((t) => {
        const name = t.productName || t.product?.product_name || t.product?.name || 'Item';
        const qty = Number(t.quantity || 0);
        if (!consumptionMap[name]) {
          consumptionMap[name] = {
            productName: name,
            productCode: t.productCode || t.product?.product_code || '',
            quantity: 0
          };
        }
        consumptionMap[name].quantity += qty;
      });

      const sortedConsumed = Object.values(consumptionMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      setTopConsumedItems(sortedConsumed);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const activePreset = useMemo(() => {
    return DATE_PRESETS.find((p) => p.id === dateFilter) || DATE_PRESETS[1];
  }, [dateFilter]);

  if (loading) {
    return (
      <Layout title="Stock & Movement Analytics" breadcrumb="Analytics / Movement & Distribution">
        <Loading message="Loading analytics..." />
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout title="Stock & Movement Analytics" breadcrumb="Analytics / Movement & Distribution">
        <div style={{ padding: '48px 24px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
          <div style={{ color: '#ef4444', fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
            Unable to load analytics data. Please try again.
          </div>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
            {error || 'An unexpected error occurred while communicating with the server.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={loadAnalytics}
            style={{ padding: '8px 22px', fontSize: '0.88rem', cursor: 'pointer' }}
          >
            Retry Analytics
          </button>
        </div>
      </Layout>
    );
  }

  const inventory = data.inventory || data.data?.inventory || {};
  const purchases = data.purchases || data.data?.purchases || {};
  const transfers = data.transfers || data.data?.transfers || {};
  const indents = data.indents || data.data?.indents || {};
  const allTrends = data.trends || data.data?.trends || [];

  // Filter trends based on selected preset
  const filteredTrends = dateFilter === '7days' ? allTrends.slice(-7) : allTrends;

  // Format date for chart XAxis (e.g. "2026-09-15" -> "15 Sep")
  const formattedTrends = filteredTrends.map((item) => {
    if (!item.date) return item;
    const parts = item.date.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return {
        ...item,
        displayDate: `${parts[2]} ${monthNames[mIdx] || parts[1]}`
      };
    }
    return { ...item, displayDate: item.date };
  });

  // Department Consumption data
  const rawDeptTransfers = transfers.departmentTransfers || [];
  const totalDeptUnits = rawDeptTransfers.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

  // Stock Register data
  const rawRegisters = inventory.registerDistribution || [];
  const totalRegisterUnits = Number(inventory.totalStock || 0);

  // Online Requisitions breakdown
  const totalIndentsCount = Number(indents.total || 0);
  const indentsBreakdown = [
    { name: 'Approved', value: indents.approved || 0, color: '#2563eb' },
    { name: 'Completed', value: indents.completed || 0, color: '#10b981' },
    { name: 'Pending', value: indents.pending || 0, color: '#f59e0b' },
    { name: 'Rejected', value: indents.rejected || 0, color: '#ef4444' }
  ];
  const activeIndentsPie = indentsBreakdown.filter((i) => i.value > 0);

  return (
    <Layout
      title="Stock & Movement Analytics"
      breadcrumb="Analytics / Movement & Distribution"
    >
      {/* PAGE HEADER WITH BREADCRUMB & DATE RANGE FILTER */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Stock & Movement Analytics
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.84rem', margin: 0 }}>
            Analytics / Movement & Distribution &bull; Real-time MongoDB consumable inventory data
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.15s ease'
            }}
          >
            {/* Calendar Icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>{activePreset.rangeText}</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>▼</span>
          </button>

          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                width: '210px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 50,
                padding: '4px'
              }}
            >
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setDateFilter(preset.id);
                    setIsDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    color: dateFilter === preset.id ? '#2563eb' : '#334155',
                    background: dateFilter === preset.id ? '#eff6ff' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: dateFilter === preset.id ? 600 : 500,
                    textAlign: 'left'
                  }}
                >
                  <span>{preset.label}</span>
                  {dateFilter === preset.id && <span style={{ color: '#2563eb', fontWeight: 'bold' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 1. TOP 4 ANALYTICS KPI SUMMARY CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {/* Card 1: Total Inventory */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TOTAL INVENTORY
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Package Icon */}
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1, marginBottom: '6px' }}>
              {(inventory.totalStock || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Across {inventory.totalProducts || 0} registered products
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Purchases */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              MONTHLY PURCHASES
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Shopping Cart Icon */}
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669', lineHeight: 1.1, marginBottom: '6px' }}>
              +{(purchases.monthlyPurchases || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              This month's replenishment units
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Transfers */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              MONTHLY TRANSFERS
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#fff7ed',
                color: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Transfer Outgoing Icon */}
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706', lineHeight: 1.1, marginBottom: '6px' }}>
              -{(transfers.monthlyTransfers || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Units issued to labs & departments
            </div>
          </div>
        </div>

        {/* Card 4: Deficit Stock Alerts */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              DEFICIT STOCK ALERTS
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: (inventory.lowStockCount || 0) > 0 ? '#fef2f2' : '#f0fdf4',
                color: (inventory.lowStockCount || 0) > 0 ? '#dc2626' : '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Warning Triangle Icon */}
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: (inventory.lowStockCount || 0) > 0 ? '#dc2626' : '#16a34a',
                lineHeight: 1.1,
                marginBottom: '6px'
              }}
            >
              {inventory.lowStockCount || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {(inventory.criticalStockCount || 0) > 0
                ? `${inventory.criticalStockCount} items at critical level`
                : 'All items above critical threshold'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. STOCK MOVEMENT TRENDS (LINE / AREA CHART) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          marginBottom: '24px',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 2px 0' }}>
              Stock Movement Trends ({activePreset.label})
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>
              Daily volume of replenishment purchases (+) and outgoing department transfers (-)
            </p>
          </div>
        </div>

        <div style={{ height: '320px', padding: '16px 20px 8px 10px' }}>
          {formattedTrends.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.88rem' }}>
              No data available for the selected period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="purchasesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="transfersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                  }}
                  labelStyle={{ fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="purchases"
                  name="Purchases (+)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#purchasesGrad)"
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="transfers"
                  name="Transfers (-)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#transfersGrad)"
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. ROW 2: DEPARTMENT CONSUMPTION & ONLINE REQUISITIONS STATUS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        {/* Department Consumption Breakdown */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 2px 0' }}>
              Department Consumption Breakdown
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>
              Units issued by department
            </p>
          </div>

          <div style={{ padding: '16px 20px', flex: 1 }}>
            {rawDeptTransfers.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#94a3b8', fontSize: '0.88rem' }}>
                No department transfers recorded yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', alignItems: 'center', gap: '16px' }}>
                {/* Doughnut with center label */}
                <div style={{ position: 'relative', width: '100%', height: '210px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={rawDeptTransfers}
                        dataKey="quantity"
                        nameKey="department"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {rawDeptTransfers.map((entry, index) => (
                          <Cell key={`dept-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name) => [`${val} Units`, name]}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                      {totalDeptUnits}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                      Units
                    </div>
                  </div>
                </div>

                {/* Breakdown list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {rawDeptTransfers.map((dept, idx) => {
                    const pct = totalDeptUnits > 0 ? ((dept.quantity / totalDeptUnits) * 100).toFixed(1) : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span style={{ width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0, backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span style={{ color: '#334155', fontWeight: 500, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }} title={dept.name || dept.department}>
                            {dept.name || dept.department}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{dept.quantity}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem', width: '38px', textAlign: 'right' }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Online Requisitions Status */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 2px 0' }}>
              Online Requisitions Status
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>
              Total Indent Requests: {totalIndentsCount}
            </p>
          </div>

          <div style={{ padding: '16px 20px', flex: 1 }}>
            {totalIndentsCount === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#94a3b8', fontSize: '0.88rem' }}>
                No indent requisitions recorded yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', alignItems: 'center', gap: '16px' }}>
                {/* Doughnut Chart */}
                <div style={{ position: 'relative', width: '100%', height: '210px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeIndentsPie}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {activeIndentsPie.map((entry, index) => (
                          <Cell key={`ind-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name) => [`${val} Indents`, name]}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                      {totalIndentsCount}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                      Indents
                    </div>
                  </div>
                </div>

                {/* Status Summary List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {indentsBreakdown.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: item.color }}></span>
                        <span style={{ color: '#334155', fontWeight: 500 }}>{item.name}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. ROW 3: PHYSICAL STOCK REGISTER DISTRIBUTION & TOP CONSUMED ITEMS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        {/* Physical Stock Register Distribution */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 2px 0' }}>
              Physical Stock Register Distribution
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>
              Total inventory allocated per register
            </p>
          </div>

          <div style={{ padding: '16px 20px', flex: 1 }}>
            {rawRegisters.length === 0 || totalRegisterUnits === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#94a3b8', fontSize: '0.88rem' }}>
                No stock register allocation found.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', alignItems: 'center', gap: '16px' }}>
                {/* Doughnut Chart */}
                <div style={{ position: 'relative', width: '100%', height: '210px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={rawRegisters.filter((r) => r.stock > 0)}
                        dataKey="stock"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {rawRegisters.map((entry, index) => (
                          <Cell
                            key={`reg-cell-${index}`}
                            fill={REGISTER_COLORS[entry.name] || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name) => [`${val} Units`, `Register ${name}`]}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                      {totalRegisterUnits}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                      Units
                    </div>
                  </div>
                </div>

                {/* Beside Chart Data Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {rawRegisters.map((reg, idx) => {
                    const pct = totalRegisterUnits > 0 ? ((reg.stock / totalRegisterUnits) * 100).toFixed(1) : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '9px',
                              height: '9px',
                              borderRadius: '50%',
                              backgroundColor: REGISTER_COLORS[reg.name] || COLORS[idx % COLORS.length]
                            }}
                          ></span>
                          <span style={{ color: '#334155', fontWeight: 600 }}>{reg.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{reg.stock}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem', width: '42px', textAlign: 'right' }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Consumed Items */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 2px 0' }}>
              Top Consumed Items
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>
              Highest outgoing consumable items issued to departments
            </p>
          </div>

          <div style={{ padding: '12px 16px', flex: 1, overflowX: 'auto' }}>
            {topConsumedItems.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#94a3b8', fontSize: '0.88rem' }}>
                No consumption records found.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '8px 10px', width: '32px' }}>#</th>
                    <th style={{ padding: '8px 10px' }}>Product</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Units Issued</th>
                  </tr>
                </thead>
                <tbody>
                  {topConsumedItems.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: idx === topConsumedItems.length - 1 ? 'none' : '1px solid #f8fafc',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px 10px', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '10px 10px', color: '#1e293b', fontWeight: 500 }}>
                        {item.productName}
                        {item.productCode && (
                          <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#64748b' }}>
                            ({item.productCode})
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 5. ROW 4: LOW STOCK ITEMS (FULL WIDTH CARD WITH VIEW ALL) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          marginBottom: '24px'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 2px 0' }}>
              Low Stock Items
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>
              Consumables needing replenishment based on safety thresholds
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/low-stock')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#2563eb',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            View All &rarr;
          </button>
        </div>

        <div style={{ padding: '12px 16px', overflowX: 'auto' }}>
          {lowStockItems.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: '#10b981', fontSize: '0.88rem', fontWeight: 500 }}>
              ✓ All inventory items are currently stocked above their minimum thresholds.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '10px 12px' }}>Product</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Current Stock</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Threshold</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((prod, idx) => {
                  const current = Number(prod.currentQuantity !== undefined ? prod.currentQuantity : (prod.current_quantity || 0));
                  const threshold = Number(prod.minimumQuantity !== undefined ? prod.minimumQuantity : (prod.minimum_quantity || prod.minimum_stock_level || 0));
                  const isCritical = current <= threshold * 0.5;

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: idx === lowStockItems.length - 1 ? 'none' : '1px solid #f8fafc',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 12px', fontWeight: 600, color: '#0f172a' }}>
                        {prod.productName || prod.product_name || prod.name}
                        {(prod.productCode || prod.product_code) && (
                          <span style={{ marginLeft: '8px', fontSize: '0.74rem', color: '#64748b', fontWeight: 400 }}>
                            ({prod.productCode || prod.product_code})
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>
                        {current} {prod.unit || prod.unitName || ''}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'center', color: '#64748b' }}>
                        {threshold} {prod.unit || prod.unitName || ''}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: isCritical ? '#fef2f2' : '#fffbeb',
                            color: isCritical ? '#dc2626' : '#d97706',
                            border: `1px solid ${isCritical ? '#fecaca' : '#fde68a'}`
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                          {isCritical ? 'Critical' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
