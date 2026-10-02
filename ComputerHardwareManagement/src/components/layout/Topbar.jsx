import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import NotificationDropdown from './NotificationDropdown';

export const Topbar = ({ title = 'Dashboard', breadcrumb = 'Overview', onToggleMobile = () => {} }) => {
  const { user, logout } = useAuth();
  const { activeSystem, selectSystem, isElectrical, isHardware } = useSystem();
  const [profileOpen, setProfileOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);
  const profileRef = useRef(null);
  const systemRef = useRef(null);
  const navigate = useNavigate();

  const roleLabel = user?.role === 'ADMIN' ? 'Admin' : 'Faculty';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (systemRef.current && !systemRef.current.contains(event.target)) {
        setSystemOpen(false);
      }
    };
    if (profileOpen || systemOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen, systemOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    setSystemOpen(false);
    logout();
    navigate('/login');
  };

  const handleSwitchSystem = (targetSystem) => {
    setSystemOpen(false);
    if (targetSystem !== activeSystem) {
      selectSystem(targetSystem);
      navigate(`/${targetSystem}/dashboard`);
    }
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
        {/* Active System Switcher Pill */}
        <div style={{ position: 'relative' }} ref={systemRef}>
          <button
            type="button"
            onClick={() => setSystemOpen(!systemOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: isElectrical ? '1px solid #f59e0b' : '1px solid #3b82f6',
              background: isElectrical ? '#fffbeb' : '#eff6ff',
              color: isElectrical ? '#b45309' : '#1d4ed8',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Switch between Electrical and Hardware Stock Systems"
          >
            <span>{isElectrical ? '⚡ Electrical Stock' : '💻 Hardware Stock'}</span>
            <span style={{ fontSize: '0.65rem' }}>▼</span>
          </button>

          {systemOpen && (
            <div
              className="card shadow-lg"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                maxWidth: 'min(260px, calc(100vw - 24px))',
                zIndex: 1000,
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--white)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
              }}
            >
              <div style={{ padding: '6px 8px', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Active Subsystem
              </div>
              <button
                type="button"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: isElectrical ? 'var(--blue-50)' : 'transparent',
                  fontWeight: isElectrical ? 700 : 500,
                  color: isElectrical ? 'var(--blue-700)' : 'var(--text-900)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.84rem'
                }}
                onClick={() => handleSwitchSystem('electrical')}
              >
                <span>⚡ Electrical Stock</span>
                {isElectrical && <span style={{ marginLeft: 'auto', color: 'var(--blue-600)' }}>✓</span>}
              </button>
              <button
                type="button"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: isHardware ? 'var(--blue-50)' : 'transparent',
                  fontWeight: isHardware ? 700 : 500,
                  color: isHardware ? 'var(--blue-700)' : 'var(--text-900)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.84rem'
                }}
                onClick={() => handleSwitchSystem('hardware')}
              >
                <span>💻 Computer Hardware</span>
                {isHardware && <span style={{ marginLeft: 'auto', color: 'var(--blue-600)' }}>✓</span>}
              </button>
              <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />
              <button
                type="button"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: 'var(--text-600)'
                }}
                onClick={() => { setSystemOpen(false); navigate('/select-system'); }}
              >
                <span>▤ System Selection Menu</span>
              </button>
            </div>
          )}
        </div>

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
                maxWidth: 'min(260px, calc(100vw - 24px))',
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
                    {user?.department || 'Central Store'}
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
