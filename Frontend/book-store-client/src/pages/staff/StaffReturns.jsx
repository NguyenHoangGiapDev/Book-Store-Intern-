import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/staff/StaffReturns.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api"
).replace(/\/$/, "");

const FILTER_ALL = "all";

const ISSUE_VALUES = {
  NONE: "Không có",
  DEFECTIVE: "Hàng lỗi",
  WRONG_GOODS: "Giao sai hàng",
  MISSING_GOODS: "Thiếu hàng",
  CUSTOMER_REFUSED: "Khách không nhận hàng",
  CUSTOMER_CANCELLED: "Khách hủy đơn",
};

const ORDER_STATUS_VALUES = {
  NEW: "Đơn mới",
  PROCESSING: "Đang xử lý",
  RETURNED: "Hoàn hàng",
  CANCELLED: "Bị hủy",
  DELIVERED: "Giao thành công",
};

const SHIPPING_STATUS_VALUES = {
  UNASSIGNED: "Chưa giao vận",
};

const PAYMENT_STATUS_VALUES = {
  UNPAID: "Chưa thanh toán",
};

const COD_STATUS_VALUES = {
  NOT_APPLICABLE: "Không áp dụng",
};

const RETURN_ISSUES = [
  ISSUE_VALUES.DEFECTIVE,
  ISSUE_VALUES.WRONG_GOODS,
  ISSUE_VALUES.MISSING_GOODS,
  ISSUE_VALUES.CUSTOMER_REFUSED,
  ISSUE_VALUES.CUSTOMER_CANCELLED,
];

const RETURN_STATUSES = [
  ORDER_STATUS_VALUES.RETURNED,
  ORDER_STATUS_VALUES.CANCELLED,
];

const RESOLVE_STATUSES = [
  ORDER_STATUS_VALUES.PROCESSING,
  ORDER_STATUS_VALUES.RETURNED,
  ORDER_STATUS_VALUES.CANCELLED,
  ORDER_STATUS_VALUES.DELIVERED,
];

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.$values)) return value.$values;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.result)) return value.result;
  return [];
}

function pick(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );
}

function formatCurrency(value, language = "vi") {
  const locale = language?.startsWith("vi") ? "vi-VN" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value, locale = "vi-VN", fallback = "—") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(locale);
}

function getIssueKey(issue) {
  const map = {
    [ISSUE_VALUES.NONE]: "none",
    [ISSUE_VALUES.DEFECTIVE]: "defectiveGoods",
    [ISSUE_VALUES.WRONG_GOODS]: "wrongGoods",
    [ISSUE_VALUES.MISSING_GOODS]: "missingGoods",
    [ISSUE_VALUES.CUSTOMER_REFUSED]: "customerRefused",
    [ISSUE_VALUES.CUSTOMER_CANCELLED]: "customerCancelled",
  };

  return map[issue] || "none";
}

function getStatusKey(status) {
  const map = {
    [ORDER_STATUS_VALUES.NEW]: "new",
    [ORDER_STATUS_VALUES.PROCESSING]: "processing",
    [ORDER_STATUS_VALUES.RETURNED]: "returned",
    [ORDER_STATUS_VALUES.CANCELLED]: "cancelled",
    [ORDER_STATUS_VALUES.DELIVERED]: "delivered",
  };

  return map[status] || "new";
}

function getShippingStatusKey(status) {
  const map = {
    [SHIPPING_STATUS_VALUES.UNASSIGNED]: "unassigned",
  };

  return map[status] || "unassigned";
}

function getPaymentStatusKey(status) {
  const map = {
    [PAYMENT_STATUS_VALUES.UNPAID]: "unpaid",
  };

  return map[status] || "unpaid";
}

function getIssueLabel(issue, t) {
  return t(`returns.issues.${getIssueKey(issue)}`);
}

function getStatusLabel(status, t) {
  return t(`returns.statuses.${getStatusKey(status)}`);
}

function getShippingStatusLabel(status, t) {
  return t(`returns.shippingStatuses.${getShippingStatusKey(status)}`);
}

function getPaymentStatusLabel(status, t) {
  return t(`returns.paymentStatuses.${getPaymentStatusKey(status)}`);
}

function getIssueBadgeClass(issue) {
  if (
    [
      ISSUE_VALUES.DEFECTIVE,
      ISSUE_VALUES.WRONG_GOODS,
      ISSUE_VALUES.MISSING_GOODS,
    ].includes(issue)
  ) {
    return "staff-badge staff-badge--danger";
  }

  if (
    [ISSUE_VALUES.CUSTOMER_REFUSED, ISSUE_VALUES.CUSTOMER_CANCELLED].includes(
      issue
    )
  ) {
    return "staff-badge staff-badge--warning";
  }

  return "staff-badge";
}

function getStatusBadgeClass(status) {
  if ([ORDER_STATUS_VALUES.RETURNED, ORDER_STATUS_VALUES.CANCELLED].includes(status)) {
    return "staff-badge staff-badge--danger";
  }

  if (status === ORDER_STATUS_VALUES.PROCESSING) {
    return "staff-badge staff-badge--warning";
  }

  if (status === ORDER_STATUS_VALUES.DELIVERED) {
    return "staff-badge staff-badge--success";
  }

  return "staff-badge";
}

function normalizeOrder(raw, index) {
  const customer = pick(raw.customer, raw.Customer, raw.user, raw.User, {});

  const rawItems = toArray(
    pick(
      raw.orderDetails,
      raw.OrderDetails,
      raw.items,
      raw.Items,
      raw.details,
      raw.Details
    )
  );

  const items = rawItems.map((item, itemIndex) => ({
    id: pick(item.id, item.Id, itemIndex),
    productName: pick(
      item.productTitle,
      item.ProductTitle,
      item.productName,
      item.ProductName,
      item.bookName,
      item.BookName,
      item.name,
      item.Name,
      ""
    ),
    quantity: Number(pick(item.quantity, item.Quantity, 1)),
    price: Number(pick(item.unitPrice, item.UnitPrice, item.price, item.Price, 0)),
    total: Number(pick(item.totalPrice, item.TotalPrice, item.total, item.Total, 0)),
  }));

  const serverId = pick(raw.id, raw.Id, raw.orderId, raw.OrderId);

  const code = pick(
    raw.orderCode,
    raw.OrderCode,
    raw.code,
    raw.Code,
    serverId ? `DH${String(serverId).padStart(3, "0")}` : `DH${index + 1}`
  );

  return {
    serverId,
    code,
    customerName: pick(
      raw.customerName,
      raw.CustomerName,
      customer.fullName,
      customer.FullName,
      customer.name,
      customer.Name,
      ""
    ),
    phone: pick(
      raw.phone,
      raw.Phone,
      raw.phoneNumber,
      raw.PhoneNumber,
      customer.phoneNumber,
      customer.PhoneNumber,
      ""
    ),
    address: pick(
      raw.address,
      raw.Address,
      raw.shippingAddress,
      raw.ShippingAddress,
      customer.address,
      customer.Address,
      ""
    ),
    orderStatus: pick(
      raw.status,
      raw.Status,
      raw.orderStatus,
      raw.OrderStatus,
      ORDER_STATUS_VALUES.NEW
    ),
    shippingStatus: pick(
      raw.shippingStatus,
      raw.ShippingStatus,
      SHIPPING_STATUS_VALUES.UNASSIGNED
    ),
    paymentStatus: pick(
      raw.paymentStatus,
      raw.PaymentStatus,
      PAYMENT_STATUS_VALUES.UNPAID
    ),
    codStatus: pick(raw.codStatus, raw.CodStatus, COD_STATUS_VALUES.NOT_APPLICABLE),
    issue: pick(raw.issue, raw.Issue, ISSUE_VALUES.NONE),
    total: Number(pick(raw.totalAmount, raw.TotalAmount, raw.total, raw.Total, 0)),
    createdAt: pick(raw.orderDate, raw.OrderDate, raw.createdAt, raw.CreatedAt),
    note: pick(raw.note, raw.Note, ""),
    items,
    raw,
  };
}

async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login?error=session_expired';
    }
    throw new Error(text || `API error ${response.status}`);
  }

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function ReturnDetailModal({
  order,
  onClose,
  onSave,
  saving,
  t,
  dateLocale,
  money,
}) {
  const [orderStatus, setOrderStatus] = useState(order.orderStatus);
  const [note, setNote] = useState(order.note || "");

  const handleSave = () => {
    onSave(order, orderStatus, note);
  };

  return (
    <div className="staff-invoice-modal" onClick={onClose}>
      <div
        className="staff-invoice staff-returns-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="staff-invoice__header">
          <div>
            <h2>
              {t("returns.modal.title", {
                code: order.code,
              })}
            </h2>

            <p className="staff-returns-modal-date">
              {t("returns.modal.createdAt")}:{" "}
              {formatDate(order.createdAt, dateLocale, t("returns.defaults.noDate"))}
            </p>
          </div>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="staff-returns-modal-issue">
          <span className="staff-returns-modal-issue-label">
            {t("returns.modal.issue")}:{" "}
          </span>

          <span className={getIssueBadgeClass(order.issue)}>
            {getIssueLabel(order.issue, t)}
          </span>
        </div>

        <div className="staff-invoice__body">
          <div>
            <span>{t("returns.modal.customer")}</span>
            <strong>
              {order.customerName || t("returns.defaults.walkInCustomer")}
            </strong>
          </div>

          <div>
            <span>{t("returns.modal.phone")}</span>
            <strong>{order.phone || t("returns.defaults.noPhone")}</strong>
          </div>

          <div>
            <span>{t("returns.modal.address")}</span>
            <strong>{order.address || t("returns.defaults.notUpdated")}</strong>
          </div>

          <div>
            <span>{t("returns.modal.payment")}</span>
            <strong>{getPaymentStatusLabel(order.paymentStatus, t)}</strong>
          </div>

          <div>
            <span>{t("returns.modal.shipping")}</span>
            <strong>{getShippingStatusLabel(order.shippingStatus, t)}</strong>
          </div>
        </div>

        <div className="staff-table-wrap staff-returns-modal-table">
          <table className="staff-table">
            <thead>
              <tr>
                <th>{t("returns.modal.product")}</th>
                <th>{t("returns.modal.quantity")}</th>
                <th>{t("returns.modal.unitPrice")}</th>
                <th>{t("returns.modal.subtotal")}</th>
              </tr>
            </thead>

            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.productName || t("returns.defaults.product")}</td>
                  <td>{item.quantity}</td>
                  <td>{money(item.price)}</td>
                  <td>{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="staff-total-box">
          {t("returns.modal.refundTotal")}: {money(order.total)}
        </div>

        <div className="staff-form staff-returns-modal-form">
          <div className="staff-form-group">
            <label>{t("returns.modal.updateStatus")}</label>

            <select
              className="staff-input"
              value={orderStatus}
              onChange={(event) => setOrderStatus(event.target.value)}
            >
              {RESOLVE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status, t)}
                </option>
              ))}
            </select>
          </div>

          <div className="staff-form-group">
            <label>{t("returns.modal.processNote")}</label>

            <textarea
              className="staff-textarea"
              placeholder={t("returns.modal.notePlaceholder")}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>

        <div className="staff-invoice__actions">
          <button
            type="button"
            className="staff-btn staff-btn--outline"
            onClick={onClose}
          >
            {t("returns.actions.close")}
          </button>

          <button
            type="button"
            className="staff-btn staff-btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t("returns.actions.saving") : t("returns.actions.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffReturns() {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language?.startsWith("en") ? "en" : "vi";
  const dateLocale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";

  const money = useCallback(
    (value) => formatCurrency(value, currentLanguage),
    [currentLanguage]
  );

  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [issueFilter, setIssueFilter] = useState(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [pageSize, setPageSize] = useState(() =>
    Number(localStorage.getItem("staffPageSize_returns") || 10)
  );

  const [currentPage, setCurrentPage] = useState(1);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const payload = await apiRequest("/orders");
      const rawOrders = toArray(payload);
      const normalizedOrders = rawOrders.map(normalizeOrder);

      setAllOrders(normalizedOrders);
    } catch (err) {
      setError(t("returns.alerts.loadError", { message: err.message }));
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, issueFilter, statusFilter, pageSize]);

  const returnOrders = useMemo(() => {
    return allOrders.filter(
      (order) =>
        RETURN_ISSUES.includes(order.issue) ||
        RETURN_STATUSES.includes(order.orderStatus)
    );
  }, [allOrders]);

  const filteredOrders = useMemo(() => {
    const searchValue = keyword.trim().toLowerCase();

    return returnOrders.filter((order) => {
      const issueLabel = getIssueLabel(order.issue, t).toLowerCase();

      const matchKeyword =
        !searchValue ||
        order.code.toLowerCase().includes(searchValue) ||
        (order.customerName || "").toLowerCase().includes(searchValue) ||
        (order.phone || "").toLowerCase().includes(searchValue) ||
        order.issue.toLowerCase().includes(searchValue) ||
        issueLabel.includes(searchValue);

      const matchIssue =
        issueFilter === FILTER_ALL || order.issue === issueFilter;

      const matchStatus =
        statusFilter === FILTER_ALL || order.orderStatus === statusFilter;

      return matchKeyword && matchIssue && matchStatus;
    });
  }, [returnOrders, keyword, issueFilter, statusFilter, t]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const stats = useMemo(() => {
    const pending = returnOrders.filter((order) =>
      [ORDER_STATUS_VALUES.PROCESSING, ORDER_STATUS_VALUES.RETURNED].includes(
        order.orderStatus
      )
    ).length;

    const faultyGoods = returnOrders.filter(
      (order) => order.issue === ISSUE_VALUES.DEFECTIVE
    ).length;

    const wrongGoods = returnOrders.filter(
      (order) => order.issue === ISSUE_VALUES.WRONG_GOODS
    ).length;

    const totalRefund = returnOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    return {
      total: returnOrders.length,
      pending,
      faultyGoods,
      wrongGoods,
      totalRefund,
    };
  }, [returnOrders]);

  const issueStats = useMemo(() => {
    const issueRows = RETURN_ISSUES.map((issue) => ({
      key: issue,
      label: getIssueLabel(issue, t),
      badgeClass: getIssueBadgeClass(issue),
      count: returnOrders.filter((order) => order.issue === issue).length,
    }));

    const statusRows = RETURN_STATUSES.map((status) => ({
      key: status,
      label: getStatusLabel(status, t),
      badgeClass: "staff-badge staff-badge--danger",
      count: returnOrders.filter(
        (order) =>
          order.orderStatus === status && !RETURN_ISSUES.includes(order.issue)
      ).length,
    }));

    return [...issueRows, ...statusRows];
  }, [returnOrders, t]);

  const renderPaginationButtons = () => {
    const pages = [];

    const addPageButton = (page) => {
      pages.push(
        <button
          key={page}
          type="button"
          className={`staff-returns-page-btn ${
            currentPage === page ? "is-active" : ""
          }`}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </button>
      );
    };

    const addDots = (key) => {
      pages.push(
        <span key={key} className="staff-returns-pagination-dots">
          ...
        </span>
      );
    };

    if (totalPages <= 5) {
      for (let page = 1; page <= totalPages; page += 1) {
        addPageButton(page);
      }

      return pages;
    }

    addPageButton(1);

    if (currentPage > 3) addDots("start");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let page = start; page <= end; page += 1) {
      addPageButton(page);
    }

    if (currentPage < totalPages - 2) addDots("end");

    addPageButton(totalPages);

    return pages;
  };

  const handleSave = async (order, newStatus, newNote) => {
    if (!order?.serverId) {
      showToast(t("returns.alerts.missingOrderId"), "error");
      return;
    }

    setSaving(true);

    try {
      await apiRequest(`/orders/${order.serverId}/staff-update`, {
        method: "PUT",
        body: JSON.stringify({
          orderStatus: newStatus,
          shippingStatus: order.shippingStatus,
          paymentStatus: order.paymentStatus,
          codStatus: order.codStatus,
          issue: order.issue,
        }),
      });

      setAllOrders((prev) =>
        prev.map((item) =>
          item.serverId === order.serverId
            ? { ...item, orderStatus: newStatus, note: newNote }
            : item
        )
      );

      if (selectedOrder?.serverId === order.serverId) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: newStatus,
          note: newNote,
        }));
      }

      showToast(t("returns.alerts.updateSuccess"));
      setSelectedOrder(null);
    } catch (err) {
      showToast(t("returns.alerts.updateFailed", { message: err.message }), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="staff-page staff-returns-page">
      {toast && (
        <div
          className={`staff-alert staff-returns-toast ${
            toast.type === "error" ? "staff-alert--warning" : "staff-alert--success"
          }`}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="staff-alert staff-alert--warning">
          <strong>{t("returns.alerts.loadErrorTitle")}</strong>
          <p>{error}</p>
        </div>
      )}

      <div className="staff-grid staff-grid--4 staff-stats-compact">
        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">🔄</div>
          <div>
            <p>{t("returns.stats.total")}</p>
            <h3>{stats.total}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon staff-returns-icon--warning">⏳</div>
          <div>
            <p>{t("returns.stats.pending")}</p>
            <h3>{stats.pending}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon staff-returns-icon--danger">📦</div>
          <div>
            <p>{t("returns.stats.faultyOrWrong")}</p>
            <h3>{stats.faultyGoods + stats.wrongGoods}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon staff-returns-icon--success">💸</div>
          <div>
            <p>{t("returns.stats.totalRefund")}</p>
            <h3>{money(stats.totalRefund)}</h3>
          </div>
        </div>
      </div>

      <div className="staff-grid staff-grid--2 staff-returns-info-grid">
        <div className="staff-card staff-returns-rule-card">
          <div className="staff-card__header">
            <h2>{t("returns.rules.title")}</h2>
          </div>

          <div className="staff-alert-list">
            <div className="staff-alert staff-alert--info">
              <strong>{t("returns.rules.within7DaysTitle")}</strong>
              <p>{t("returns.rules.within7DaysDesc")}</p>
            </div>

            <div className="staff-alert staff-alert--warning">
              <strong>{t("returns.rules.managerApprovalTitle")}</strong>
              <p>{t("returns.rules.managerApprovalDesc")}</p>
            </div>

            <div className="staff-alert staff-alert--success">
              <strong>{t("returns.rules.defectiveWrongTitle")}</strong>
              <p>{t("returns.rules.defectiveWrongDesc")}</p>
            </div>
          </div>
        </div>

        <div className="staff-card staff-returns-stats-card">
          <div className="staff-card__header">
            <h2>{t("returns.issueStats.title")}</h2>
          </div>

          <div className="staff-table-wrap">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>{t("returns.issueStats.issueType")}</th>
                  <th>{t("returns.issueStats.quantity")}</th>
                </tr>
              </thead>

              <tbody>
                {issueStats.map((item) => (
                  <tr key={item.key}>
                    <td>
                      <span className={item.badgeClass}>{item.label}</span>
                    </td>
                    <td>
                      <strong>{item.count}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="staff-card staff-returns-list-card">
        <div className="staff-card__header">
          <h2>{t("returns.list.title")}</h2>

          <button
            type="button"
            className="staff-btn staff-btn--outline staff-returns-refresh-header"
            onClick={fetchOrders}
            disabled={loading}
          >
            {loading ? t("returns.actions.loading") : t("returns.actions.refresh")}
          </button>
        </div>

        <div className="staff-returns-toolbar">
          <input
            className="staff-input staff-returns-search"
            placeholder={t("returns.list.searchPlaceholder")}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <div
            className={`staff-returns-select-wrap ${
              issueFilter !== FILTER_ALL ? "has-clear" : ""
            }`}
          >
            <select
              className="staff-input staff-returns-issue-select"
              value={issueFilter}
              onChange={(event) => setIssueFilter(event.target.value)}
            >
              <option value={FILTER_ALL}>{t("returns.filters.all")}</option>

              {RETURN_ISSUES.map((issue) => (
                <option key={issue} value={issue}>
                  {getIssueLabel(issue, t)}
                </option>
              ))}
            </select>

            {issueFilter !== FILTER_ALL && (
              <button
                type="button"
                className="staff-returns-select-clear"
                title={t("returns.filters.clear")}
                onClick={() => setIssueFilter(FILTER_ALL)}
              >
                ×
              </button>
            )}
          </div>

          <div
            className={`staff-returns-select-wrap ${
              statusFilter !== FILTER_ALL ? "has-clear" : ""
            }`}
          >
            <select
              className="staff-input staff-returns-status-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value={FILTER_ALL}>{t("returns.filters.all")}</option>

              {RESOLVE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status, t)}
                </option>
              ))}
            </select>

            {statusFilter !== FILTER_ALL && (
              <button
                type="button"
                className="staff-returns-select-clear"
                title={t("returns.filters.clear")}
                onClick={() => setStatusFilter(FILTER_ALL)}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="staff-table-wrap">
          <table className="staff-table staff-returns-table">
            <thead>
              <tr>
                <th>{t("returns.table.no")}</th>
                <th>{t("returns.table.orderCode")}</th>
                <th>{t("returns.table.customer")}</th>
                <th>{t("returns.table.issue")}</th>
                <th>{t("returns.table.product")}</th>
                <th>{t("returns.table.amount")}</th>
                <th>{t("returns.table.orderStatus")}</th>
                <th>{t("returns.table.createdAt")}</th>
                <th>{t("returns.table.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="9">
                    <div className="staff-empty">
                      {t("returns.table.loading")}
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="staff-empty">
                      {returnOrders.length === 0
                        ? t("returns.table.noReturns")
                        : t("returns.table.noFiltered")}
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedOrders.map((order, index) => (
                  <tr key={order.serverId || order.code}>
                    <td style={{ textAlign: "center" }}>
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

                    <td>
                      <span>{order.code}</span>
                    </td>

                    <td>
                      <strong>
                        {order.customerName || t("returns.defaults.walkInCustomer")}
                      </strong>
                      <p>{order.phone || t("returns.defaults.noPhone")}</p>
                    </td>

                    <td>
                      <span className={getIssueBadgeClass(order.issue)}>
                        {getIssueLabel(order.issue, t)}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {order.items[0]?.productName || t("returns.defaults.product")}
                      </strong>

                      {order.items.length > 1 && (
                        <p>
                          {t("returns.table.moreProducts", {
                            count: order.items.length - 1,
                          })}
                        </p>
                      )}
                    </td>

                    <td>
                      <strong className="staff-returns-total">
                        {money(order.total)}
                      </strong>
                    </td>

                    <td>
                      <span className={getStatusBadgeClass(order.orderStatus)}>
                        {getStatusLabel(order.orderStatus, t)}
                      </span>
                    </td>

                    <td className="staff-returns-date">
                      {formatDate(
                        order.createdAt,
                        dateLocale,
                        t("returns.defaults.noDate")
                      )}
                    </td>

                    <td>
                      <div className="staff-actions">
                        <button
                          type="button"
                          className="staff-btn staff-btn--small staff-btn--primary"
                          onClick={() => setSelectedOrder(order)}
                        >
                          {t("returns.actions.process")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="staff-returns-pagination-footer">
            <div className="staff-returns-pagination-bar">
              <div className="staff-returns-pagination-info">
                {t("returns.pagination.displayRange", {
                  start: Math.min(
                    filteredOrders.length,
                    (currentPage - 1) * pageSize + 1
                  ),
                  end: Math.min(filteredOrders.length, currentPage * pageSize),
                  total: filteredOrders.length,
                })}
              </div>

              <div className="staff-returns-pagination-controls">
                <div className="staff-returns-page-size">
                  <span className="staff-returns-page-size-label">
                    {t("returns.pagination.pageSize")}
                  </span>

                  <select
                    className="staff-returns-page-size-select"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      localStorage.setItem(
                        "staffPageSize_returns",
                        event.target.value
                      );
                      setCurrentPage(1);
                    }}
                  >
                    <option value={6}>6</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                <div className="staff-returns-pagination-list">
                  <button
                    type="button"
                    className={`staff-returns-page-btn ${
                      currentPage === 1 ? "is-disabled" : ""
                    }`}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>

                  {renderPaginationButtons()}

                  <button
                    type="button"
                    className={`staff-returns-page-btn ${
                      currentPage === totalPages ? "is-disabled" : ""
                    }`}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <ReturnDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSave={handleSave}
          saving={saving}
          t={t}
          dateLocale={dateLocale}
          money={money}
        />
      )}
    </div>
  );
}

export default StaffReturns;