import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';

export const SystemSelection = () => {
  const { user, logout } = useAuth();
  const { selectSystem } = useSystem();
  const navigate = useNavigate();

  const handleSelect = (system) => {
    selectSystem(system);
    navigate(`/${system}/dashboard`);
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', padding: '32px 16px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: '780px', width: '100%', margin: '0 auto' }}>
        
        {/* Top Header Card with User info */}
        <div
          style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 24px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '36px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'var(--navy-900)',
                color: 'var(--white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem'
              }}
            >
              🏢
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
                Stock Management Portal
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                {user?.name || user?.username}
              </div>
              <span className="badge badge-blue" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                {user?.role}
              </span>
            </div>
            <button
              type="button"
              className="btn-outline"
              onClick={handleSignOut}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
            Select Stock Management System
          </h1>
        </div>

        {/* Dual System Choices Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* 1. Electrical Stock Card */}
          <div
            className="card"
            style={{
              padding: '32px 24px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '20px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              cursor: 'pointer'
            }}
            onClick={() => handleSelect('electrical')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(245, 158, 11, 0.12)';
              e.currentTarget.style.borderColor = '#f59e0b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}
            >
              ⚡
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
              Electrical Stock Management
            </h2>

            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px 20px',
                fontWeight: 700,
                background: 'var(--blue-700)',
                color: 'var(--white)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect('electrical');
              }}
            >
              Open Electrical System →
            </button>
          </div>

          {/* 2. Computer Hardware Stock Card */}
          <div
            className="card"
            style={{
              padding: '32px 24px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '20px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              cursor: 'pointer'
            }}
            onClick={() => handleSelect('hardware')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(37, 99, 235, 0.12)';
              e.currentTarget.style.borderColor = 'var(--blue-500)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}
            >
              💻
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
              Computer Hardware Stock
            </h2>

            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px 20px',
                fontWeight: 700,
                background: 'var(--blue-700)',
                color: 'var(--white)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect('hardware');
              }}
            >
              Open Hardware System →
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SystemSelection;
