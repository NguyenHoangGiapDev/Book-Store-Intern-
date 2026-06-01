import React from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "../../styles/staff/ui-kit.css";

const ConfirmModal = ({
  show,
  title,
  titleKey,
  message,
  messageKey,
  confirmText,
  confirmTextKey,
  cancelText,
  cancelTextKey,
  onConfirm,
  onCancel,
  type = "warning",
}) => {
  const { t } = useTranslation();

  if (!show) return null;

  const config = {
    warning: {
      icon: "bi-exclamation-triangle",
      color: "#f43f5e",
      bg: "rgba(244, 63, 94, 0.1)",
      btn: "btn-danger-premium",
    },
    success: {
      icon: "bi-check2-circle",
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)",
      btn: "btn-success-premium",
    },
    info: {
      icon: "bi-info-circle",
      color: "#4f46e5",
      bg: "rgba(79, 70, 229, 0.1)",
      btn: "btn-indigo-premium",
    },
  };

  const style = config[type] || config.warning;

  const modalTitle = titleKey
    ? t(titleKey)
    : title || t("common.confirmTitle", { defaultValue: "Xác nhận" });

  const modalMessage = messageKey
    ? t(messageKey)
    : message ||
      t("common.confirmMessage", {
        defaultValue: "Bạn có chắc chắn muốn thực hiện thao tác này không?",
      });

  const modalCancelText = cancelTextKey
    ? t(cancelTextKey)
    : cancelText || t("common.cancel", { defaultValue: "Hủy bỏ" });

  const modalConfirmText = confirmTextKey
    ? t(confirmTextKey)
    : confirmText || t("common.confirm", { defaultValue: "Xác nhận" });

  const handleBackdropClick = () => {
    if (typeof onCancel === "function") {
      onCancel();
    }
  };

  const handleCardClick = (event) => {
    event.stopPropagation();
  };

  const handleConfirm = () => {
    if (typeof onConfirm === "function") {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (typeof onCancel === "function") {
      onCancel();
    }
  };

  return createPortal(
    <div
      className="modal-confirm-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="modal-confirm-card animate-pop-in"
        onClick={handleCardClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <div
          className="modal-confirm-icon"
          style={{
            backgroundColor: style.bg,
            color: style.color,
          }}
        >
          <i className={`bi ${style.icon}`} aria-hidden="true"></i>
        </div>

        <div className="modal-confirm-content">
          <h5
            id="confirm-modal-title"
            className="fw-800 text-slate-800 mb-2"
          >
            {modalTitle}
          </h5>

          <p
            id="confirm-modal-message"
            className="text-slate-500 small mb-0"
          >
            {modalMessage}
          </p>
        </div>

        <div className="modal-confirm-footer">
          <button
            type="button"
            className="btn-confirm-cancel"
            onClick={handleCancel}
          >
            {modalCancelText}
          </button>

          <button
            type="button"
            className={`btn-confirm-action ${style.btn}`}
            onClick={handleConfirm}
          >
            {modalConfirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;