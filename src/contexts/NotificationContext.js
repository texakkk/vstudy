import React, { createContext, useContext, useState, useEffect } from "react";
import { useSnackbar } from "notistack";
import io from "socket.io-client";
import api from "../api";
import { useAuth } from "../AuthContext";

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated, currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  // Toast notification methods (defined early so they can be used in other functions)
  const showSuccess = (message) => {
    enqueueSnackbar(message, {
      variant: "success",
      autoHideDuration: 3000,
      anchorOrigin: {
        vertical: "top",
        horizontal: "right",
      },
    });
  };

  const showError = (message) => {
    enqueueSnackbar(message, {
      variant: "error",
      autoHideDuration: 4000,
      anchorOrigin: {
        vertical: "top",
        horizontal: "right",
      },
    });
  };

  const showWarning = (message) => {
    enqueueSnackbar(message, {
      variant: "warning",
      autoHideDuration: 3500,
      anchorOrigin: {
        vertical: "top",
        horizontal: "right",
      },
    });
  };

  const showInfo = (message) => {
    enqueueSnackbar(message, {
      variant: "info",
      autoHideDuration: 3000,
      anchorOrigin: {
        vertical: "top",
        horizontal: "right",
      },
    });
  };

  // Fetch notifications from API
  const fetchNotifications = async (page = 1, unreadOnly = false) => {
    try {
      const response = await api.get("/notifications", {
        params: { page, unreadOnly },
      });

      if (page === 1) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications((prev) => [...prev, ...response.data.notifications]);
      }

      setUnreadCount(response.data.pagination.unreadCount);
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      showError("Failed to fetch notifications");
    }
  };

  // Show toast notification based on type
  const showNotificationToast = (notification) => {
    const message = `${notification.Notification_title}: ${notification.Notification_message}`;

    switch (notification.Notification_type) {
      case "message":
        showInfo(message);
        break;
      case "task":
        showWarning(message);
        break;
      case "video":
        showSuccess(message);
        break;
      case "mention":
        showError(message); // Use error styling for mentions to make them stand out
        break;
      default:
        showInfo(message);
    }
  };

  // Handle new real-time notification
  const handleNewNotification = (notification) => {
    console.log("Handling new notification:", notification);
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Show toast notification
    showNotificationToast(notification);
  };

  // Initialize socket connection for real-time notifications and fetch initial data
  useEffect(() => {
    // Clean up existing socket if any
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    // Only connect if user is authenticated
    if (isAuthenticated && currentUser) {
      const token = localStorage.getItem("token");

      if (token) {
        // Fetch initial notifications
        fetchNotifications();

        // Connect to dedicated notification namespace
        const notificationSocket = io("http://localhost:5001/notifications", {
          auth: { token },
        });

        // Handle new notifications
        notificationSocket.on("newNotification", (data) => {
          console.log("📢 Received newNotification event:", data);
          handleNewNotification(data.notification);
        });

        // Handle notification count updates
        notificationSocket.on("notificationCount", (data) => {
          console.log("📢 Received notificationCount update:", data);
          setUnreadCount(data.unreadCount);
        });

        // Handle notification marked as read
        notificationSocket.on("notificationMarkedRead", (data) => {
          console.log("📢 Notification marked as read:", data);
          setNotifications((prev) =>
            prev.map((notif) =>
              notif._id === data.notificationId
                ? { ...notif, Notification_read: true }
                : notif
            )
          );
          setUnreadCount(data.unreadCount);
        });

        // Handle all notifications marked as read
        notificationSocket.on("allNotificationsMarkedRead", (data) => {
          console.log("📢 All notifications marked as read:", data);
          setNotifications((prev) =>
            prev.map((notif) => ({ ...notif, Notification_read: true }))
          );
          setUnreadCount(0);
        });

        // Handle notification deleted
        notificationSocket.on("notificationDeleted", (data) => {
          console.log("📢 Notification deleted:", data);
          setNotifications((prev) =>
            prev.filter((notif) => notif._id !== data.notificationId)
          );
          setUnreadCount(data.unreadCount);
        });

        // Handle notifications list
        notificationSocket.on("notificationsList", (data) => {
          console.log("📢 Received notifications list:", data);
          setNotifications(data.notifications);
          setUnreadCount(data.pagination.unreadCount);
        });

        // Handle errors
        notificationSocket.on("error", (error) => {
          console.error("📢 Notification socket error:", error);
          showError(error.message || "Notification error occurred");
        });

        // Debug connection events
        notificationSocket.on("connect", () => {
          console.log(
            "📢 Notification socket connected:",
            notificationSocket.id
          );
          // Request initial notification count
          notificationSocket.emit("getNotifications", { page: 1, limit: 20 });
        });

        notificationSocket.on("connect_error", (error) => {
          console.error("📢 Notification socket connection error:", error);
        });

        notificationSocket.on("disconnect", (reason) => {
          console.log("📢 Notification socket disconnected:", reason);
        });

        setSocket(notificationSocket);

        return () => {
          notificationSocket.disconnect();
        };
      }
    } else {
      // Clear notifications when user is not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, currentUser]); // React to authentication changes

  // Mark notification as read (using socket for real-time updates)
  const markAsRead = async (notificationId) => {
    try {
      if (socket && socket.connected) {
        // Use socket for real-time update
        socket.emit("markNotificationRead", { notificationId });
      } else {
        // Fallback to API call
        await api.patch(`/notifications/${notificationId}/read`);

        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId
              ? { ...notif, Notification_read: true }
              : notif
          )
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      showError("Failed to mark notification as read");
    }
  };

  // Mark all notifications as read (using socket for real-time updates)
  const markAllAsRead = async () => {
    try {
      if (socket && socket.connected) {
        // Use socket for real-time update
        socket.emit("markAllNotificationsRead");
      } else {
        // Fallback to API call
        await api.patch("/notifications/mark-all-read");

        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, Notification_read: true }))
        );

        setUnreadCount(0);
      }
      showSuccess("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      showError("Failed to mark all notifications as read");
    }
  };

  // Delete notification (using socket for real-time updates)
  const deleteNotification = async (notificationId) => {
    try {
      if (socket && socket.connected) {
        // Use socket for real-time update
        socket.emit("deleteNotification", { notificationId });
      } else {
        // Fallback to API call
        await api.delete(`/notifications/${notificationId}`);

        const deletedNotification = notifications.find(
          (n) => n._id === notificationId
        );
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== notificationId)
        );

        if (deletedNotification && !deletedNotification.Notification_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
      showSuccess("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      showError("Failed to delete notification");
    }
  };

  const value = {
    // Toast methods
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Notification state
    notifications,
    unreadCount,

    // Notification methods
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // Socket
    socket,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export default NotificationContext;
