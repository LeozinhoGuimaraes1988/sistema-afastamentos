// components/Notification.jsx
import toast from 'react-hot-toast';

export const showNotification = {
  success: (message) =>
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: 'white',
      },
    }),

  error: (message) =>
    toast.error(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: 'white',
      },
    }),

  warning: (message) =>
    toast.warning(message, {
      duration: 3000,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: 'white',
      },
    }),
};
