import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

const NotificationTest = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const testNotifications = () => {
    showSuccess('This is a success notification!');
    setTimeout(() => showError('This is an error notification!'), 1000);
    setTimeout(() => showWarning('This is a warning notification!'), 2000);
    setTimeout(() => showInfo('This is an info notification!'), 3000);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Notification System Test</h3>
      <button 
        onClick={testNotifications}
        style={{
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Test Notifications
      </button>
    </div>
  );
};

export default NotificationTest;