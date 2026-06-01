import React, { useEffect } from 'react';
import '../../styles/staff/ui-kit.css';

export function Toast({ open, message, type = 'success', onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), 3000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={`ui-toast ui-toast--${type}`} role="status">
      <div className="ui-toast__message">{message}</div>
      <button className="ui-toast__close" onClick={onClose}>×</button>
    </div>
  );
}

export default Toast;
