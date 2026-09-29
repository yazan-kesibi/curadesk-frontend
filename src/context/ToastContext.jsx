import { createContext, useState, useCallback } from 'react';
import ToastContainer from '../components/Toast/ToastContainer';

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // دالة لإغلاق التنبيه
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // دالة إضافة تنبيه جديد
  const addToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      title: options.title || '',
      type: options.type || 'info', // 'success' | 'error' | 'warning' | 'info'
      duration: options.duration !== undefined ? options.duration : 4000, // بالمللي ثانية
      position: options.position || 'bottom-left', // 'bottom-left' | 'top-left' | 'top-right' | 'bottom-right'
      action: options.action || null, // { label: string, onClick: () => void }
      dismissible: options.dismissible !== undefined ? options.dismissible : true,
    };

    setToasts((prev) => [...prev, newToast]);

    // الإغلاق التلقائي إذا كانت المدة أكبر من 0
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [removeToast]);

  // واجهة استدعاء عملية وشاملة (Helper Methods)
  const toast = {
    show: (msg, opts) => addToast(msg, opts),
    success: (msg, opts) => addToast(msg, { ...opts, type: 'success' }),
    error: (msg, opts) => addToast(msg, { ...opts, type: 'error' }),
    warning: (msg, opts) => addToast(msg, { ...opts, type: 'warning' }),
    info: (msg, opts) => addToast(msg, { ...opts, type: 'info' }),
    dismiss: (id) => removeToast(id),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};
