import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export const Topbar = ({ title = 'Dashboard', breadcrumb = 'Overview', onToggleMobile = () => {} }) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const roleLabel = user?.role === 'ADMIN' ? 'Admin' : 'Faculty';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobile}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>
        <div>
          <div className="page-title">{title}</div>
          <div className="breadcrumb">{breadcrumb}</div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Live Notification Dropdown */}
        <NotificationDropdown />

        {/* Interactive User Profile Chip */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <div
            className="user-chip"
            onClick={() => setProfileOpen(!profileOpen)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Click to view profile & sign out"
          >
            <div
              className="avatar"
              style={{
                background: user?.role === 'ADMIN' ? 'var(--blue-700)' : 'var(--navy-800)'
              }}
            >
              {user?.avatarText || (user?.role === 'ADMIN' ? 'AD' : 'FA')}
            </div>
            <div className="who">
              <strong>{user?.name || (user?.role === 'ADMIN' ? 'Admin' : 'Faculty User')}</strong>
              <span>
                {roleLabel} · {user?.department || (user?.role === 'ADMIN' ? 'Central Store' : 'Department')}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
              {profileOpen ? '▲' : '▼'}
            </span>
          </div>

          {/* Profile Popover */}
          {profileOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '260px',
                zIndex: 1000,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid var(--border)',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  className="avatar"
                  style={{
                    width: '40px',
                    height: '40px',
                    fontSize: '1rem',
                    background: user?.role === 'ADMIN' ? 'var(--blue-700)' : 'var(--navy-800)'
                  }}
                >
                  {user?.avatarText || (user?.role === 'ADMIN' ? 'AD' : 'FA')}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--navy-900)' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-500)' }}>
                    @{user?.username}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginBottom: '12px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Role:</span>
                  <span className="badge badge-blue">{roleLabel}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                  <strong style={{ color: 'var(--navy-900)', textAlign: 'right', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.department || 'Consumable Store'}
                  </strong>
                </div>
                {user?.email && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                    <span style={{ color: 'var(--text-600)', fontSize: '0.78rem' }}>{user.email}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn-danger"
                onClick={handleLogout}
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.84rem', padding: '8px 12px' }}
              >
                <span className="icon">⏻</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
