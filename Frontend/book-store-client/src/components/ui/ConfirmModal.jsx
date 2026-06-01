import React from 'react';
import '../../styles/staff/ui-kit.css';

export default function ConfirmModal({ open, title, message, confirmText = 'OK', cancelText = 'Hủy', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="ui-modal-backdrop" onClick={onCancel}>
      <div className="ui-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ui-modal-header">
          <h3 className="ui-modal-title">{title}</h3>
        </div>
        <div className="ui-modal-body">
          <p>{message}</p>
        </div>
        <div className="ui-modal-actions">
          <button className="ui-btn ui-btn--ghost" onClick={onCancel}>{cancelText}</button>
          <button className="ui-btn ui-btn--danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
