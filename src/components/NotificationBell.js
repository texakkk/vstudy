import React, { useState, useRef, useEffect } from 'react';
import { FaBell, FaCheck, FaTrash, FaEye, FaComment, FaTasks, FaUsers, FaVideo, FaAt } from 'react-icons/fa';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      await fetchNotifications(1, false);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/dashboard/notifications');
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.Notification_read) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.Notification_type) {
      case 'message':
        if (notification.Notification_groupId) {
          navigate(`/dashboard/chat/${notification.Notification_groupId._id}`);
        }
        break;
      case 'task':
        if (notification.Notification_groupId) {
          navigate(`/dashboard/task-manager/${notification.Notification_groupId._id}`);
        }
        break;
      case 'group':
        if (notification.Notification_groupId) {
          navigate(`/dashboard/groups/${notification.Notification_groupId._id}`);
        }
        break;
      case 'video':
        if (notification.Notification_groupId) {
          navigate(`/dashboard/chat/${notification.Notification_groupId._id}?video=true`);
        }
        break;
      default:
        navigate('/dashboard/notifications');
    }

    setIsOpen(false);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 'message': return '#10b981';
      case 'task': return '#f59e0b';
      case 'group': return '#8b5cf6';
      case 'video': return '#ef4444';
      case 'mention': return '#06b6d4';
      default: return '#64748b';
    }
  };

  // Show only recent notifications (last 5)
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={handleBellClick}
        title={`${unreadCount} unread notifications`}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-small"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <FaCheck />
              </button>
            )}
          </div>

          <div className="notification-dropdown-content">
            {loading ? (
              <div className="notification-loading-small">
                <div className="loading-spinner-small"></div>
                <span>Loading...</span>
              </div>
            ) : recentNotifications.length > 0 ? (
              <>
                {recentNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`notification-dropdown-item ${!notification.Notification_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-dropdown-content-main">
                      <div 
                        className="notification-type-indicator"
                        style={{ backgroundColor: getNotificationTypeColor(notification.Notification_type) }}
                      ></div>
                      
                      <div className="notification-dropdown-text">
                        <div className="notification-dropdown-title">
                          {notification.Notification_title}
                        </div>
                        <div className="notification-dropdown-message">
                          {notification.Notification_message.length > 60 
                            ? `${notification.Notification_message.substring(0, 60)}...`
                            : notification.Notification_message
                          }
                        </div>
                        <div className="notification-dropdown-time">
                          {formatTimeAgo(notification.Notification_createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="notification-dropdown-actions">
                      {!notification.Notification_read && (
                        <button
                          className="notification-action-btn mark-read"
                          onClick={(e) => handleMarkAsRead(notification._id, e)}
                          title="Mark as read"
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button
                        className="notification-action-btn delete"
                        onClick={(e) => handleDelete(notification._id, e)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="no-notifications-small">
                <FaBell />
                <span>No notifications</span>
              </div>
            )}
          </div>

          <div className="notification-dropdown-footer">
            <button 
              className="view-all-btn"
              onClick={handleViewAll}
            >
              <FaEye />
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;