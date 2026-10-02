import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useNotifications } from '../context/NotificationContext';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';

export const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [filterUnread, setFilterUnread] = useState(false);

  const displayedNotifications = filterUnread
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const getIconForType = (type) => {
    switch (type) {
      case 'LOW_STOCK':
        return '⚠';
      case 'INDENT_CREATED':
        return '📋';
      case 'INDENT_STATUS':
        return '✓';
      case 'PURCHASE':
        return '↧';
      case 'TRANSFER':
        return '↥';
      default:
        return '🔔';
    }
  };

  const getTargetLink = (n) => {
    if (n.type === 'LOW_STOCK') {
      return n.referenceId ? `/products?search=${encodeURIComponent(n.referenceId)}` : '/low-stock';
    }
    if (n.type === 'INDENT_CREATED' || n.type === 'INDENT_STATUS') {
      return n.referenceId ? `/indents/${n.referenceId}` : '/indents';
    }
    if (n.type === 'PURCHASE') {
      return '/purchases';
    }
    if (n.type === 'TRANSFER') {
      return '/transfers';
    }
    return null;
  };

  return (
    <Layout title="Notifications" breadcrumb="System / Notifications">
      <div className="topbar">
        <div className="topbar-title">
          <h1>Notifications</h1>
          <p>Real-time system alerts, indent requisition progress, and stock warnings.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="content-area">
        {/* Controls */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={!filterUnread ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                onClick={() => setFilterUnread(false)}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                className={filterUnread ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                onClick={() => setFilterUnread(true)}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">
              {filterUnread ? 'Unread Alerts' : 'Notification Stream'}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Showing {displayedNotifications.length} items
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {displayedNotifications.length === 0 ? (
              <EmptyState
                icon="🔔"
                title={filterUnread ? 'No unread notifications' : 'No notifications'}
                description={
                  filterUnread
                    ? 'All alerts have been marked as read.'
                    : 'No system notifications or alerts currently recorded in MongoDB.'
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {displayedNotifications.map((n) => {
                  const targetLink = getTargetLink(n);
                  return (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && markAsRead(n._id)}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--border)',
                        background: n.isRead ? 'var(--white)' : '#f0f7ff',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: n.type === 'LOW_STOCK' ? '#fee2e2' : '#e0e7ff',
                          color: n.type === 'LOW_STOCK' ? '#b91c1c' : '#3730a3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0
                        }}
                      >
                        {getIconForType(n.type)}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--navy-900)' }}>
                            {n.title}
                          </div>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {new Date(n.createdAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.86rem', color: 'var(--text-700)', lineHeight: '1.4' }}>
                          {n.message}
                        </p>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          {targetLink && (
                            <Link
                              to={targetLink}
                              style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--blue-600)', textDecoration: 'none' }}
                            >
                              View details →
                            </Link>
                          )}
                          {!n.isRead && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n._id);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '0.76rem',
                                color: 'var(--text-500)',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>

                      {!n.isRead && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--blue-600)',
                            marginTop: '8px',
                            flexShrink: 0
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
