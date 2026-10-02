import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

export const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getIconForType = (type) => {
    switch (type) {
      case 'LOW_STOCK':
        return '⚠';
      case 'INDENT_CREATED':
        return '▧';
      case 'INDENT_STATUS':
        return '✓';
      case 'PURCHASE':
        return '↧';
      case 'TRANSFER':
        return '↥';
      default:
        return 'ℹ';
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      const dt = new Date(dateVal);
      return isNaN(dt.getTime())
        ? ''
        : dt.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
    } catch {
      return '';
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      await markAsRead(n._id);
    }
    setIsOpen(false);

    if (n.type === 'LOW_STOCK') {
      navigate('/low-stock');
    } else if (n.type === 'INDENT_CREATED' || n.type === 'INDENT_STATUS') {
      navigate(n.referenceId ? `/indents/${n.referenceId}` : '/manage-indents');
    } else if (n.type === 'PURCHASE') {
      navigate('/purchases');
    } else if (n.type === 'TRANSFER') {
      navigate('/transfers');
    }
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="bell"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        title="View notifications"
        style={{
          cursor: 'pointer',
          border: 'none',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-4px',
              background: '#dc2626',
              color: '#ffffff',
              borderRadius: '999px',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '1px 5px',
              minWidth: '16px',
              lineHeight: '1.3',
              textAlign: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="notification-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxWidth: 'min(380px, calc(100vw - 24px))',
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.18)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'slideUp 0.15s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: '#f8fafc'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-900)' }}>
              Notifications {unreadCount > 0 && <span style={{ color: 'var(--blue-600)' }}>({unreadCount})</span>}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={markAllAsRead}
                style={{ fontSize: '0.75rem', padding: '2px 8px', color: 'var(--blue-600)', cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No notifications recorded.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: n.isRead ? 'var(--white)' : '#f0f7ff',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: n.type === 'LOW_STOCK' ? 'var(--red-100)' : 'var(--blue-100)',
                      color: n.type === 'LOW_STOCK' ? 'var(--red-600)' : 'var(--blue-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      flexShrink: 0
                    }}
                  >
                    {getIconForType(n.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: n.isRead ? 600 : 700,
                        fontSize: '0.84rem',
                        color: 'var(--navy-900)',
                        marginBottom: '2px'
                      }}
                    >
                      {n.title}
                    </div>
                    <div
                      style={{
                        fontSize: '0.79rem',
                        color: 'var(--text-700)',
                        lineHeight: '1.35',
                        wordBreak: 'break-word'
                      }}
                    >
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {formatDate(n.createdAt)}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--blue-600)',
                        marginTop: '6px',
                        flexShrink: 0
                      }}
                      title="Unread"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              fontSize: '0.78rem'
            }}
          >
            <Link
              to="/low-stock"
              onClick={() => setIsOpen(false)}
              style={{ fontWeight: 600, color: 'var(--red-700)', textDecoration: 'none' }}
            >
              ⚠ Low Stock Alerts →
            </Link>
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              style={{ fontWeight: 600, color: 'var(--blue-600)', textDecoration: 'none' }}
            >
              All Notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
