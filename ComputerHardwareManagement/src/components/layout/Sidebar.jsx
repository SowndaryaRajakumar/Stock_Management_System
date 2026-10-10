import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { useNotifications } from '../../context/NotificationContext';
import { useStock } from '../../context/StockContext';

export const Sidebar = ({ mobileOpen = false, onCloseMobile = () => { } }) => {
  const { user, isAdmin, logout } = useAuth();
  const { activeSystem, isElectrical } = useSystem();
  const { unreadCount } = useNotifications();
  const { lowStockCount } = useStock();
  const navigate = useNavigate();

  const getPath = (subpath) => `/${activeSystem || 'hardware'}${subpath}`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="mark">{isElectrical ? '⚡' : '💻'}</div>
          <div className="name">
            {isElectrical ? 'Electrical Stock' : 'Hardware Stock'}
            <span>{isAdmin ? 'Admin Portal' : 'Faculty Portal'}</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="nav-group">
          <div className="nav-label">Overview</div>
          <NavLink
            to={getPath('/dashboard')}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="icon">▤</span> Dashboard
          </NavLink>

          {/* ==========================================
              ELECTRICAL STOCK NAVIGATION (MANUAL WORKFLOW)
             ========================================== */}
          {isElectrical && isAdmin && (
            <>
              <div className="nav-label">Inventory & Stock</div>
              <NavLink
                to={getPath('/products')}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">▦</span> Products
              </NavLink>

              <NavLink
                to={getPath('/purchases')}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">↧</span> Purchase
              </NavLink>

              <NavLink
                to={getPath('/transfers')}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">↥</span> Transfer
              </NavLink>

              <NavLink
                to={getPath('/history')}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">≣</span> Stock History
              </NavLink>

              <NavLink
                to={getPath('/low-stock')}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">⚠</span> Low Stock Alerts
                <span className="nav-badge">{lowStockCount ?? 0}</span>
              </NavLink>

              <div className="nav-label">Master Data</div>
              <NavLink
                to={getPath('/categories')}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">🏷</span> Categories
              </NavLink>

              <NavLink
                to={getPath('/units')}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">⚖</span> Units of Measurement
              </NavLink>

              <NavLink
                to={getPath('/stock-documents')}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">📖</span> Stock Registers
              </NavLink>

              <NavLink
                to={getPath('/departments')}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">🏛</span> Departments
              </NavLink>

              <NavLink
                to={getPath('/faculty')}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">👥</span> Faculty
              </NavLink>

              <div className="nav-label">Records</div>
              <NavLink
                to={getPath('/indents')}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">📋</span> Indent Register
              </NavLink>
            </>
          )}

          {/* ==========================================
              COMPUTER HARDWARE NAVIGATION (ONLINE WORKFLOW)
             ========================================== */}
          {!isElectrical && (
            <>
              {/* FACULTY SECTION */}
              {!isAdmin && (
                <>
                  <div className="nav-label">Catalog & Requests</div>
                  <NavLink
                    to={getPath('/faculty/catalog')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">▦</span> Product Catalog
                  </NavLink>

                  <NavLink
                    to={getPath('/indents/create')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">＋</span> Physical Indent
                  </NavLink>

                  <NavLink
                    to={getPath('/indents/my')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">📋</span> My Indent Requests
                  </NavLink>

                  <NavLink
                    to={getPath('/notifications')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">🔔</span> Notifications
                    {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                  </NavLink>
                </>
              )}

              {/* ADMIN SECTION */}
              {isAdmin && (
                <>
                  <div className="nav-label">Inventory & Stock</div>
                  <NavLink
                    to={getPath('/products')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">▦</span> Products
                  </NavLink>

                  <NavLink
                    to={getPath('/purchases')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">↧</span> Purchase
                  </NavLink>

                  <NavLink
                    to={getPath('/transfers')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">↥</span> Transfer
                  </NavLink>

                  <NavLink
                    to={getPath('/history')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">≣</span> Stock History
                  </NavLink>

                  <NavLink
                    to={getPath('/low-stock')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">⚠</span> Low Stock Alerts
                    <span className="nav-badge">{lowStockCount ?? 0}</span>
                  </NavLink>

                  <div className="nav-label">Master Data</div>
                  <NavLink
                    to={getPath('/categories')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">🏷</span> Categories
                  </NavLink>

                  <NavLink
                    to={getPath('/units')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">⚖</span> Units of Measurement
                  </NavLink>

                  <NavLink
                    to={getPath('/stock-documents')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">📖</span> Stock Registers
                  </NavLink>

                  <NavLink
                    to={getPath('/departments')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">🏛</span> Departments
                  </NavLink>

                  <NavLink
                    to={getPath('/faculty')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">👥</span> Faculty
                  </NavLink>

                  <div className="nav-label">Requisitions & Management</div>
                  <NavLink
                    to={getPath('/indents')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">📋</span> Manage Indents
                  </NavLink>

                  <NavLink
                    to={getPath('/analytics')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">📈</span> Analytics
                  </NavLink>

                  <NavLink
                    to={getPath('/reports')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">📄</span> Reports
                  </NavLink>

                  <NavLink
                    to={getPath('/notifications')}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">🔔</span> Notifications
                    {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                  </NavLink>
                </>
              )}
            </>
          )}
        </div>

        <div className="sidebar-foot">
          <button type="button" className="nav-link" onClick={handleLogout} style={{ width: '100%' }}>
            <span className="icon">⏻</span> Logout ({isAdmin ? 'Admin' : 'Faculty'})
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
