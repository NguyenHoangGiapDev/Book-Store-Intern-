import React, { useState, useEffect, useCallback } from 'react';
import "../../styles/staff/ui-kit.css";

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type = 'success', duration = 4000 } = e.detail;
      const id = Math.random().toString(36).substr(2, 9);
      
      setToasts((prev) => [...prev, { id, message, type, duration }]);
      
      setTimeout(() => {
        removeToast(id);
      }, duration);
    };

    window.addEventListener('showToast', handleToast);
    return () => window.removeEventListener('showToast', handleToast);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div 
      className="toast-container position-fixed top-0 end-0 p-4" 
      style={{ zIndex: 10000, pointerEvents: 'none', maxWidth: '420px', width: '100%' }}
    >
      <div className="d-flex flex-column gap-3 align-items-end">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .premium-toast {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          pointer-events: auto;
          overflow: hidden;
          width: 100%;
          animation: toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateX(100%) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }

        .toast-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: rgba(0,0,0,0.05);
          width: 100%;
        }

        .toast-progress-value {
          height: 100%;
          border-radius: 0 2px 2px 0;
        }

        .toast-icon-wrapper {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 1.25rem;
        }

        .toast-type-success .toast-icon-wrapper { background: #ecfdf5; color: #10b981; }
        .toast-type-error .toast-icon-wrapper { background: #fef2f2; color: #ef4444; }
        .toast-type-warning .toast-icon-wrapper { background: #fffbeb; color: #f59e0b; }
        .toast-type-info .toast-icon-wrapper { background: #eff6ff; color: #3b82f6; }

        .toast-type-success .toast-progress-value { background: #10b981; }
        .toast-type-error .toast-progress-value { background: #ef4444; }
        .toast-type-warning .toast-progress-value { background: #f59e0b; }
        .toast-type-info .toast-progress-value { background: #3b82f6; }
      `}</style>
    </div>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const step = 100 / (toast.duration / 50);
    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, 50);
    return () => clearInterval(timer);
  }, [toast.duration]);

  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill'
  };

  const titles = {
    success: 'Thành công',
    error: 'Lỗi hệ thống',
    warning: 'Cảnh báo',
    info: 'Thông báo'
  };

  return (
    <div className={`premium-toast toast-type-${toast.type} d-flex align-items-center p-3`}>
      <div className="toast-icon-wrapper me-3">
        <i className={`bi ${icons[toast.type]}`}></i>
      </div>
      <div className="flex-grow-1">
        <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{titles[toast.type]}</h6>
        <p className="mb-0 text-secondary" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{toast.message}</p>
      </div>
      <button 
        className="btn-close ms-2 p-2" 
        style={{ fontSize: '0.75rem', opacity: 0.5 }}
        onClick={onClose}
      />
      <div className="toast-progress-bar">
        <div 
          className="toast-progress-value" 
          style={{ width: `${progress}%`, transition: 'width 0.05s linear' }}
        />
      </div>
    </div>
  );
};

export const showToast = (message, type = 'success', duration = 4000) => {
  window.dispatchEvent(new CustomEvent('showToast', { detail: { message, type, duration } }));
};

export default Toast;
