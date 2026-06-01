import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/staff/StaffOrder.css";
import { showToast } from "../../components/common/Toast.jsx";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api").replace(/\/$/, "");
const ORDER_API = "/orders";
const ORDER_STATUSES = ["Đơn mới", "Đang xử lý", "Đã đóng gói", "Đang giao", "Giao thành công", "Bị hủy", "Hoàn hàng",];
const SHIPPING_STATUSES = ["Chưa giao vận", "Đã giao cho vận chuyển", "Shipper đang giao", "Giao chậm", "Thất lạc", "Đã giao",];
const PAYMENT_STATUSES = ["Chưa thanh toán", "Đã thanh toán", "Còn nợ"];
const COD_STATUSES = ["Không áp dụng", "Chưa về", "Đã về"];
const ISSUE_OPTIONS = ["Không có", "Khách đổi địa chỉ", "Khách hủy đơn", "Giao sai hàng", "Thiếu hàng", "Hàng lỗi", "Khách không nhận hàng",];
const FILTER_ALL = "__ALL__"; 

const SENTINEL_WALK_IN       = "__WALK_IN__";
const SENTINEL_ONLINE_ORDER  = "__ONLINE_ORDER__";
const SENTINEL_UNKNOWN       = "__UNKNOWN__";
const SENTINEL_NO_DATA       = "__NO_DATA__";
function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
}
function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}
function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.$values)) return value.$values;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.data)) return value.data;
  return [];
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

  const time = date.toLocaleTimeString(locale);
  const day = date.toLocaleDateString(locale);

  return `${time} | ${day}`;
}
function getBadgeClass(value) {
  if ( ["Giao thành công", "Đã thanh toán", "Đã về", "Đã giao"].includes(value)) {
    return "staff-badge staff-badge--success";
  }
  if ( ["Đơn mới", "Đang xử lý", "Đã đóng gói", "Đang giao", "Shipper đang giao", "Chưa thanh toán", "Chưa về",].includes(value)) {
    return "staff-badge staff-badge--warning";
  }
  if ( ["Bị hủy", "Hoàn hàng", "Giao chậm", "Thất lạc", "Còn nợ"].includes(value)) {
    return "staff-badge staff-badge--danger";
  }
  return "staff-badge";
}
function getOrderStatusLabel(status, t) {
  const map = {
    "Đơn mới": "orders.statuses.new",
    "Đang xử lý": "orders.statuses.processing",
    "Đã đóng gói": "orders.statuses.packed",
    "Đang giao": "orders.statuses.shipping",
    "Giao thành công": "orders.statuses.shipped",
    "Bị hủy": "orders.statuses.cancelled",
    "Hoàn hàng": "orders.statuses.returned"
  };
  return map[status] ? t(map[status]) : status;
}
function getShippingStatusLabel(status, t) {
  const map = {
    "Chưa giao vận": "orders.statuses.ship_unassigned",
    "Đã giao cho vận chuyển": "orders.statuses.ship_handed_over",
    "Shipper đang giao": "orders.statuses.ship_shipper_delivering",
    "Giao chậm": "orders.statuses.ship_delayed",
    "Thất lạc": "orders.statuses.ship_lost",
    "Đã giao": "orders.statuses.ship_delivered"
  };
  return map[status] ? t(map[status]) : status;
}
function getPaymentStatusLabel(status, t) {
  const map = {
    "Chưa thanh toán": "orders.statuses.pay_unpaid",
    "Đã thanh toán": "orders.statuses.pay_paid",
    "Còn nợ": "orders.statuses.pay_debt"
  };
  return map[status] ? t(map[status]) : status;
}
function getIssueLabel(issue, t) {
  const map = {
    "Không có": "orders.statuses.issue_none",
    "Khách đổi địa chỉ": "orders.statuses.issue_address_change",
    "Khách hủy đơn": "orders.statuses.issue_customer_cancelled",
    "Giao sai hàng": "orders.statuses.issue_wrong_goods",
    "Thiếu hàng": "orders.statuses.issue_missing_goods",
    "Hàng lỗi": "orders.statuses.issue_defective_goods",
    "Khách không nhận hàng": "orders.statuses.issue_customer_refused"
  };
  return map[issue] ? t(map[issue]) : issue;
}
function getItemName(item, fallback = "—") {
  return pick(item.productTitle, item.ProductTitle, item.productName, item.ProductName, item.bookName, item.BookName, item.name, item.Name, item.title, item.Title, item.product?.name, item.Product?.Name, item.book?.title, item.Book?.Title, item.book?.name, item.Book?.Name, fallback);
}
function normalizeOrderItem(item, index, productFallback = "—") {
  const quantity = Number(pick(item.quantity, item.Quantity, item.qty, item.Qty, 1));
  const price = Number(pick(item.price, item.Price, item.unitPrice, item.UnitPrice, item.salePrice, item.SalePrice, item.product?.price, item.Product?.Price, item.book?.price, item.Book?.Price, 0));
  return {
    id: pick(item.id, item.Id, item.orderDetailId, item.OrderDetailId, index),
    productName: getItemName(item, productFallback),
    quantity,
    price,
    stock: Number(pick(item.stock, item.Stock, item.quantityInStock, item.QuantityInStock, item.product?.stock, item.Product?.Stock, item.book?.stock, item.Book?.Stock, 0)),
    total: quantity * price,
  };
}
function normalizeOrder(rawOrder, index, productFallback = "—") {
  const customer = pick(rawOrder.customer, rawOrder.Customer, rawOrder.user, rawOrder.User, {});
  const payment = pick(rawOrder.payment, rawOrder.Payment, {});
  const delivery = pick(rawOrder.delivery, rawOrder.Delivery, {});

  const rawItems = toArray(
    pick(
      rawOrder.items,
      rawOrder.Items,
      rawOrder.orderItems,
      rawOrder.OrderItems,
      rawOrder.orderDetails,
      rawOrder.OrderDetails,
      rawOrder.details,
      rawOrder.Details
    )
  );

  const items = rawItems.map((item, i) => normalizeOrderItem(item, i, productFallback));
  const calculatedTotal = items.reduce((sum, item) => sum + item.total, 0);

  const serverId = pick(
    rawOrder.id,
    rawOrder.Id,
    rawOrder.orderId,
    rawOrder.OrderId,
    rawOrder.orderID,
    rawOrder.OrderID
  );

  const code = pick(
    rawOrder.orderCode,
    rawOrder.OrderCode,
    rawOrder.code,
    rawOrder.Code,
    rawOrder.orderNo,
    rawOrder.OrderNo,
    serverId ? `DH${String(serverId).padStart(3, "0")}` : `DH${index + 1}`
  );

  const paymentMethod = pick(
    rawOrder.paymentMethod,
    rawOrder.PaymentMethod,
    payment.method,
    payment.Method,
    SENTINEL_UNKNOWN
  );

  const paymentStatus = pick(
    rawOrder.paymentStatus,
    rawOrder.PaymentStatus,
    payment.status,
    payment.Status,
    rawOrder.isPaid === true ? "Đã thanh toán" : undefined,
    rawOrder.isPaid === false ? "Chưa thanh toán" : undefined,
    "Chưa thanh toán"
  );

  const orderStatus = pick(
    rawOrder.orderStatus,
    rawOrder.OrderStatus,
    rawOrder.status,
    rawOrder.Status,
    "Đơn mới"
  );

  const shippingStatus = pick(
    rawOrder.shippingStatus,
    rawOrder.ShippingStatus,
    delivery.status,
    delivery.Status,
    "Chưa giao vận"
  );

  const codStatus = pick(
    rawOrder.codStatus,
    rawOrder.CodStatus,
    rawOrder.CODStatus,
    paymentMethod === "COD" ? "Chưa về" : "Không áp dụng"
  );

  return {
    serverId,
    code,
    staffName: pick(
      rawOrder.staffName,
      rawOrder.StaffName,
      (rawOrder.orderType === "Online" || rawOrder.OrderType === "Online") ? SENTINEL_ONLINE_ORDER : SENTINEL_UNKNOWN
    ),
    customerName: pick(
      rawOrder.customerName,
      rawOrder.CustomerName,
      customer.fullName,
      customer.FullName,
      customer.name,
      customer.Name,
      SENTINEL_WALK_IN
    ),
    phone: pick(
      rawOrder.phone,
      rawOrder.Phone,
      rawOrder.phoneNumber,
      rawOrder.PhoneNumber,
      customer.phoneNumber,
      customer.PhoneNumber,
      SENTINEL_NO_DATA
    ),
    address: pick(
      rawOrder.address,
      rawOrder.Address,
      rawOrder.shippingAddress,
      rawOrder.ShippingAddress,
      customer.address,
      customer.Address,
      SENTINEL_NO_DATA
    ),
    items,
    total: Number(
      pick(
        rawOrder.totalAmount,
        rawOrder.TotalAmount,
        rawOrder.total,
        rawOrder.Total,
        rawOrder.finalAmount,
        rawOrder.FinalAmount,
        calculatedTotal
      )
    ),
    paymentMethod,
    paymentStatus,
    orderStatus,
    shippingStatus,
    codStatus,
    issue: pick(rawOrder.issue, rawOrder.Issue, ""),
    note: pick(rawOrder.note, rawOrder.Note, rawOrder.description, rawOrder.Description, ""),
    createdAt: pick(rawOrder.createdAt, rawOrder.CreatedAt, rawOrder.orderDate, rawOrder.OrderDate),
    raw: rawOrder,
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
    throw new Error(text || `HTTP Error ${response.status}`);
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
function StaffOrders() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language?.startsWith("en") ? "en" : "vi";
  const dateLocale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";
  const money = useCallback(
    (value) => formatCurrency(value, currentLanguage),
    [currentLanguage]
  );
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [paymentFilter, setPaymentFilter] = useState(FILTER_ALL);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    const productFallback = t("orders.modal.noNote");
    try {
      const payload = await apiRequest(ORDER_API);
      const rawOrders = toArray(payload);
      const normalizedOrders = rawOrders.map((rawOrder, i) => normalizeOrder(rawOrder, i, productFallback));
      setOrders(normalizedOrders);
    } catch (err) {
      setError(
        t("orders.loadError", { url: `${API_BASE_URL}${ORDER_API}`, message: err.message })
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [t]);
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (selectedOrder || orderToDelete) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [selectedOrder, orderToDelete]);
  const filteredOrders = useMemo(() => {
    const searchValue = keyword.trim().toLowerCase();

    return orders.filter((order) => {
      const productText = order.items.map((item) => item.productName).join(" ");
      const matchKeyword =
        !searchValue ||
        order.code.toLowerCase().includes(searchValue) ||
        order.customerName.toLowerCase().includes(searchValue) ||
        order.phone.toLowerCase().includes(searchValue) ||
        order.address.toLowerCase().includes(searchValue) ||
        productText.toLowerCase().includes(searchValue);
      const matchStatus =
        statusFilter === FILTER_ALL || order.orderStatus === statusFilter;
      const matchPayment =
        paymentFilter === FILTER_ALL || order.paymentStatus === paymentFilter;
      return matchKeyword && matchStatus && matchPayment;
    });
  }, [orders, keyword, statusFilter, paymentFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, paymentFilter]);

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + rowsPerPage);
  const stats = useMemo(() => {
    const paidRevenue = orders.reduce((sum, order) => { if (order.paymentStatus === "Đã thanh toán") { return sum + Number(order.total || 0); } return sum; }, 0);
    const debt = orders.reduce((sum, order) => { if (order.paymentStatus !== "Đã thanh toán") { return sum + Number(order.total || 0);} return sum; }, 0);
    return { totalOrders: orders.length, waitingOrders: orders.filter((order) => ["Đơn mới", "Đang xử lý", "Đã đóng gói"].includes(order.orderStatus) ).length, paidRevenue, debt,};}, [orders]);

  async function updateOrderField(order, field, value) {
  if (!order?.serverId) {
    alert(t("orders.alerts.noDbIdUpdate"));
    return;
  }

  const previousOrders = orders;

  const nextOrder = {
    ...order,
    [field]: value,
  };

  if (field === "issue") {
    if (value === "Khách hủy đơn") {
      nextOrder.orderStatus = "Bị hủy";
    }

    if (value === "Khách không nhận hàng") {
      nextOrder.orderStatus = "Hoàn hàng";
    }
  }

  setSavingId(order.serverId);

  setOrders((prevOrders) =>
    prevOrders.map((item) =>
      item.serverId === order.serverId ? nextOrder : item
    )
  );

  try {
    await apiRequest(`${ORDER_API}/${order.serverId}/staff-update`, {
      method: "PUT",
      body: JSON.stringify({
        orderStatus: nextOrder.orderStatus,
        shippingStatus: nextOrder.shippingStatus,
        paymentStatus: nextOrder.paymentStatus,
        codStatus: nextOrder.codStatus,
        issue: nextOrder.issue,
      }),
    });
  } catch (err) {
    setOrders(previousOrders);
    alert(t("orders.alerts.updateFailed", { message: err.message }));
  } finally {
    setSavingId(null);
  }
}
  function deleteOrder(order) {
    if (!order?.serverId) {
      alert(t("orders.alerts.noDbIdDelete"));
      return;
    }
    setOrderToDelete(order);
  }

  async function confirmDeleteOrder() {
    if (!orderToDelete) return;
    const previousOrders = orders;
    setOrders((prevOrders) => prevOrders.filter((item) => item.serverId !== orderToDelete.serverId));
    const targetOrder = orderToDelete;
    setOrderToDelete(null);
    try {
      await apiRequest(`${ORDER_API}/${targetOrder.serverId}`, { method: "DELETE" });
      showToast(t("orders.alerts.deleteSuccess"), "success");
    } catch (err) {
      setOrders(previousOrders);
      alert(t("orders.alerts.deleteFailed", { message: err.message }));
    }
  }
  function printOrder(order) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const dateObj = new Date(order.createdAt);
    const dateStr = Number.isNaN(dateObj.getTime())
  ? formatDate(order.createdAt, dateLocale, t("orders.modal.noNote"))
  : `${dateObj.toLocaleTimeString(dateLocale)} | ${dateObj.toLocaleDateString(dateLocale)}`;
    const finalCustomerName    = order.customerName === SENTINEL_WALK_IN     ? t("pos.retailCustomer")         : order.customerName;
    const finalStaffName        = order.staffName    === SENTINEL_ONLINE_ORDER ? t("orders.receipt.onlineOrder") :
                                  order.staffName    === SENTINEL_UNKNOWN      ? t("orders.modal.noNote")        : order.staffName;
    const finalPaymentMethod    = order.paymentMethod === SENTINEL_UNKNOWN     ? t("orders.modal.noNote")        : order.paymentMethod;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${t("orders.receipt.title")} ${order.code}</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 0; margin: 0; background: #fff; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .receipt { max-width: 420px; margin: 0 auto; padding: 30px 24px; }
          .header { text-align: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 16px; }
          .header h2 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px; }
          .header p { margin: 6px 0 0; font-size: 13px; }
          .header h3 { margin: 20px 0 0; font-size: 18px; font-weight: bold; }
          .info { font-size: 13px; display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
          .info-row { display: flex; justify-content: space-between; }
          .table-container { border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; padding: 12px 0; margin-bottom: 16px; }
          table { width: 100%; font-size: 13px; border-collapse: collapse; }
          th { text-align: left; padding-bottom: 8px; font-weight: bold; }
          th.center { text-align: center; }
          th.right { text-align: right; }
          td { padding-bottom: 8px; vertical-align: top; }
          td.center { text-align: center; }
          td.right { text-align: right; font-weight: 600; }
          .summary { font-size: 14px; display: flex; flex-direction: column; gap: 8px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 16px; }
          .summary-row { display: flex; justify-content: space-between; }
          .total-row { display: flex; justify-content: space-between; font-size: 18px; margin-top: 4px; }
          .payment-info { font-size: 13px; display: flex; flex-direction: column; gap: 6px; margin-bottom: 24px; }
          .footer { text-align: center; font-size: 13px; font-style: italic; color: #1e293b; }
          @media print {
            @page { margin: 0; size: 80mm auto; }
            body { background: #fff; }
            .receipt { padding: 5mm; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h2>BOOKSTORE</h2>
            <p>${t("orders.receipt.address")}</p>
            <p>${t("orders.receipt.hotline")}</p>
            <h3>${t("orders.receipt.title")}</h3>
          </div>
          <div class="info">
            <div class="info-row"><span>${t("orders.receipt.staffName")}</span> <strong>${finalStaffName}</strong></div>
            <div class="info-row"><span>${t("orders.receipt.orderCode")}</span> <strong>${order.code}</strong></div>
            <div class="info-row"><span>${t("orders.receipt.invoiceDate")}</span> <strong>${dateStr}</strong></div>
            <div class="info-row"><span>${t("orders.receipt.customerName")}</span> <strong>${finalCustomerName}</strong></div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>${t("orders.receipt.productName")}</th>
                  <th class="center">${t("orders.receipt.qty")}</th>
                  <th class="right">${t("orders.receipt.total")}</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td style="padding-right: 8px;">
                      <div style="font-weight: 600; word-break: break-word;">${item.productName}</div>
                      <div style="font-size: 11px; color: #475569;">${formatCurrency(item.price)}</div>
                    </td>
                    <td class="center">${item.quantity}</td>
                    <td class="right">${formatCurrency(item.total)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          <div class="summary">
            <div class="summary-row"><span>${t("orders.receipt.subtotal")}</span> <strong>${formatCurrency(order.total)}</strong></div>
            <div class="summary-row"><span>${t("orders.receipt.discount")}</span> <strong>-${formatCurrency(0)}</strong></div>
            <div class="total-row">
              <strong>${t("orders.receipt.payment")}</strong>
              <strong style="color: #000;">${formatCurrency(order.total)}</strong>
            </div>
          </div>
          <div class="payment-info">
            <div class="info-row"><span>${t("orders.receipt.paymentMethod")}</span> <strong>${finalPaymentMethod}</strong></div>
            <div class="info-row"><span>${t("orders.receipt.customerPaid")}</span> <strong>${formatCurrency(order.total)}</strong></div>
            <div class="info-row"><span>${t("orders.receipt.change")}</span> <strong>${formatCurrency(0)}</strong></div>
          </div>
          <div class="footer">
            ${t("orders.receipt.footer")}
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  }
  return (
    <div className="staff-page staff-orders-page">
      {error && (
        <div className="staff-alert staff-alert--warning">
          <strong>{t("orders.loadErrorTitle")}</strong>
          <p>{error}</p>
        </div>
      )}
      <div className="staff-grid staff-grid--4 staff-stats-compact">
        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">🧾</div>
          <div>
            <p>{t("orders.stats.totalOrders")}</p>
            <h3>{stats.totalOrders}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">⏳</div>
          <div>
            <p>{t("orders.stats.waitingOrders")}</p>
            <h3>{stats.waitingOrders}</h3>
          </div>
        </div>
        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">💰</div>
          <div>
            <p>{t("orders.stats.paidRevenue")}</p>
            <h3>{money(stats.paidRevenue)}</h3>
          </div>
        </div>
        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">📌</div>
          <div>
            <p>{t("orders.stats.debt")}</p>
            <h3>{money(stats.debt)}</h3>
          </div>
        </div>
      </div>
      <div className="staff-card staff-orders-card">
        <div className="staff-page__toolbar staff-orders-toolbar">
          <input
            className="staff-input staff-orders-search"
            placeholder={t("orders.toolbar.searchPlaceholder")}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <div className="staff-orders-filter-wrap">
            <select className="staff-input staff-orders-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value={FILTER_ALL}>{t("orders.toolbar.all")}</option>
              {ORDER_STATUSES.map((status) => (<option key={status} value={status}>{getOrderStatusLabel(status, t)}</option>))}
            </select>
            {statusFilter !== FILTER_ALL && (
              <button 
                type="button"
                onClick={() => setStatusFilter(FILTER_ALL)} 
                title={t("orders.toolbar.clearFilter")}
                className="staff-orders-clear-filter">
                ×
              </button>
            )}
          </div>
          <div className="staff-orders-filter-wrap">
            <select className="staff-input staff-orders-select" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
              <option value={FILTER_ALL}>{t("orders.toolbar.all")}</option>
              {PAYMENT_STATUSES.map((status) => (<option key={status} value={status}>{getPaymentStatusLabel(status, t)}</option>))}
            </select>
            {paymentFilter !== FILTER_ALL && (
              <button 
                type="button"
                onClick={() => setPaymentFilter(FILTER_ALL)} 
                title={t("orders.toolbar.clearFilter")}
                className="staff-orders-clear-filter"
              >
                ×
              </button>
            )}
          </div>
          <button className="staff-btn staff-btn--outline staff-orders-refresh-btn" onClick={fetchOrders} disabled={loading}>
            {loading ? t("orders.toolbar.loading") : t("orders.toolbar.refresh")}
          </button>
        </div>
        <div className="staff-table-wrap staff-orders-table-wrap">
          <table className="staff-table staff-orders-table">  
            <thead>
              <tr>
                <th>{t("orders.table.stt")}</th>
                <th>{t("orders.table.code")}</th>
                <th style={{ minWidth: '150px' }}>{t("orders.table.staff")}</th>
                <th style={{ minWidth: '200px' }}>{t("orders.table.customer")}</th>
                <th>{t("orders.table.total")}</th>
                <th>{t("orders.table.orderStatus")}</th>
                <th>{t("orders.table.shippingStatus")}</th>
                <th>{t("orders.table.paymentStatus")}</th>
                <th>{t("orders.table.issue")}</th>
                <th style={{ textAlign: 'center' }} >{t("orders.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="10">
                    <div className="staff-empty">{t("orders.table.loadingData")}</div>
                  </td>
                </tr>
              )}
              {!loading && paginatedOrders.map((order, index) => {
                  const displayCustomer = order.customerName === SENTINEL_WALK_IN     ? t("pos.retailCustomer")         : order.customerName;
                  const displayStaff    = order.staffName    === SENTINEL_ONLINE_ORDER ? t("orders.receipt.onlineOrder") :
                                          order.staffName    === SENTINEL_UNKNOWN      ? t("orders.modal.noNote")        : order.staffName;
                  return (
                    <tr key={order.serverId || order.code}>
                      <td className="staff-orders-index">{startIndex + index + 1}</td>
                      <td>
                        <span>{order.code}</span>
                      </td>
                      <td>
                        <span>{displayStaff}</span>
                      </td>
                      <td>
                        <span>{displayCustomer}</span>
                      </td>
                      <td>
                        <span>{money(order.total)}</span>
                      </td>
                      <td>
                        <select className={getBadgeClass(order.orderStatus)} value={order.orderStatus} disabled={savingId === order.serverId} onChange={(event) => updateOrderField(order, "orderStatus", event.target.value)}>
                          {ORDER_STATUSES.map((status) => (<option key={status} value={status}>{getOrderStatusLabel(status, t)}</option>))}
                        </select>
                      </td>
                      <td>
                        <select className={getBadgeClass(order.shippingStatus)} value={order.shippingStatus} disabled={savingId === order.serverId} onChange={(event) => updateOrderField(order, "shippingStatus", event.target.value)}>
                          {SHIPPING_STATUSES.map((status) => (<option key={status} value={status}>{getShippingStatusLabel(status, t)}</option>))}
                        </select>
                      </td>
                      <td>
                        <select className={getBadgeClass(order.paymentStatus)} value={order.paymentStatus} disabled={savingId === order.serverId} onChange={(event) => updateOrderField(order, "paymentStatus", event.target.value)}>
                          {PAYMENT_STATUSES.map((status) => (<option key={status} value={status}>{getPaymentStatusLabel(status, t)}</option>))}
                        </select>
                      </td>
                      <td>
                        <select className={getBadgeClass(order.issue)} value={order.issue} disabled={savingId === order.serverId} onChange={(event) => updateOrderField(order, "issue", event.target.value)}>
                          {ISSUE_OPTIONS.map((issue) => (<option key={issue} value={issue}>{getIssueLabel(issue, t)}</option>))}
                        </select>
                      </td>
                      <td>
                        <div className="staff-actions staff-orders-actions">
                          <button
                            type="button"
                            className="staff-btn staff-btn--small staff-orders-action-btn"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setSelectedOrder(order);
                            }}
                          >
                            {t("orders.table.actionDetail")}
                          </button>

                          <button
                            type="button"
                            className="staff-btn staff-btn--small staff-btn--outline staff-orders-action-btn"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              printOrder(order);
                            }}
                          >
                            {t("orders.table.actionPrint")}
                          </button>

                          <button
                            type="button"
                            className="staff-btn staff-btn--small staff-btn--danger staff-orders-action-btn"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              deleteOrder(order);
                            }}
                          >
                            {t("orders.table.actionDelete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="11">
                    <div className="staff-empty">
                      {t("orders.table.noOrders")}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="staff-orders-pagination-footer">
            <div className="staff-orders-pagination-bar">
              <div className="staff-orders-pagination-info">
                {t("orders.pagination.displayRange", {
                  start: startIndex + 1,
                  end: Math.min(filteredOrders.length, currentPage * rowsPerPage),
                  total: filteredOrders.length
                })}
              </div>

              
            <div className="staff-orders-pagination-controls">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 700, letterSpacing: '0.5px' }}>{t("orders.pagination.pageSize")}</span>
                <select
                  style={{ width: '75px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', border: '1px solid #e2e8f0', padding: '4px 8px', cursor: 'pointer', outline: 'none' }}
                  value={rowsPerPage}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setRowsPerPage(newSize);
                    localStorage.setItem("adminPageSize_staffOrders", newSize);
                    setCurrentPage(1);
                  }}
                >
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', backgroundColor: '#f8fafc', color: currentPage === 1 ? '#cbd5e1' : '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                {(() => {
                  const pages = [];
                  const btnStyle = (active) => ({ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', backgroundColor: active ? '#6366f1' : '#f8fafc', color: active ? '#fff' : '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' });
                  const dots = (k) => <span key={k} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '5px', color: '#94a3b8', fontWeight: 800, letterSpacing: '2px' }}>...</span>;
                  if (totalPages <= 3) {
                    for (let i = 1; i <= totalPages; i++) pages.push(<button key={i} style={btnStyle(currentPage === i)} onClick={() => setCurrentPage(i)}>{i}</button>);
                  } else {
                    const start = Math.min(currentPage, totalPages - 2);
                    if (start > 1) {
                      pages.push(dots('s'));
                    }
                    pages.push(<button key={start} style={btnStyle(currentPage === start)} onClick={() => setCurrentPage(start)}>{start}</button>);
                    pages.push(<button key={start + 1} style={btnStyle(currentPage === start + 1)} onClick={() => setCurrentPage(start + 1)}>{start + 1}</button>);
                    
                    if (start + 1 < totalPages - 1) {
                      pages.push(dots('e'));
                    }
                    
                    pages.push(<button key={totalPages} style={btnStyle(currentPage === totalPages)} onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>);
                  }
                  return pages;
                })()}
                <button
                  style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', backgroundColor: '#f8fafc', color: currentPage === totalPages ? '#cbd5e1' : '#475569', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
      {selectedOrder && (
        <div className="staff-invoice-modal" onClick={() => setSelectedOrder(null)}>
          <div className="staff-invoice" onClick={(event) => event.stopPropagation()}>
            <div className="staff-invoice__header">
              <div>
                <h2>{t("orders.modal.detailTitle", { code: selectedOrder.code })}</h2>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)}>
                ×
              </button>
            </div>
            <div className="staff-invoice__body">
              <div>
                <span>{t("orders.modal.customer")}</span>
                <strong>{selectedOrder.customerName === SENTINEL_WALK_IN ? t("pos.retailCustomer") : selectedOrder.customerName}</strong>
              </div>
              <div>
                <span>{t("orders.modal.phone")}</span>
                <strong>{selectedOrder.phone === SENTINEL_NO_DATA ? t("orders.modal.noNote") : selectedOrder.phone}</strong>
              </div>
              <div>
                <span>{t("orders.modal.address")}</span>
                <strong>{selectedOrder.address === SENTINEL_NO_DATA ? t("orders.modal.noNote") : selectedOrder.address}</strong>
              </div>
              <div>
                <span>{t("orders.modal.payment")}</span>
                <strong>
                  {(selectedOrder.paymentMethod === SENTINEL_UNKNOWN ? t("orders.modal.noNote") : selectedOrder.paymentMethod)} - {getPaymentStatusLabel(selectedOrder.paymentStatus, t)}
                </strong>
              </div>
              <div>
                <span>{t("orders.modal.status")}</span>
                <strong>{getOrderStatusLabel(selectedOrder.orderStatus, t)}</strong>
              </div>
              <div>
                <span>{t("orders.modal.staff")}</span>
                <strong>{selectedOrder.staffName === SENTINEL_ONLINE_ORDER ? t("orders.receipt.onlineOrder") :
                          selectedOrder.staffName === SENTINEL_UNKNOWN      ? t("orders.modal.noNote")        : selectedOrder.staffName}</strong>
              </div>
              <div>
                <strong>{t("orders.modal.note")}:</strong> {selectedOrder.note || t("orders.modal.noNote")}
              </div>
              <div style={{ marginTop: '8px' }}>
                <strong>{t("orders.modal.createdAt")}:</strong> {formatDate(selectedOrder.createdAt, dateLocale, t("orders.modal.noNote"))}
              </div>
            </div>
            <div className="staff-table-wrap staff-orders-detail-table">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>{t("orders.modal.tableName")}</th>
                    <th>{t("orders.modal.tableQty")}</th>
                    <th>{t("orders.modal.tablePrice")}</th>
                    <th>{t("orders.modal.tableSubtotal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.price)}</td>
                      <td>{money(item.total)}</td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="staff-total-box">
              {t("orders.modal.totalAmount")}: {money(selectedOrder.total)}
            </div>
            <div className="staff-invoice__actions staff-orders-detail-actions">
              <button type="button" className="staff-btn staff-btn--primary staff-orders-modal-btn" onClick={() => setSelectedOrder(null)}>{t("orders.modal.btnClose")}</button>
              <button type="button" className="staff-btn staff-btn--outline staff-orders-modal-btn" onClick={() => printOrder(selectedOrder)}>{t("orders.modal.btnPrint")}</button>
            </div>
          </div>
        </div>
      )}

      {orderToDelete && (
        <div className="staff-invoice-modal" onClick={() => setOrderToDelete(null)}>
          <div className="staff-invoice staff-orders-delete-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="staff-orders-delete-content">
              <div className="staff-orders-delete-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
              </div>
              <h3 className="staff-orders-delete-title">{t("orders.deleteDialog.title")}</h3>
              <p className="staff-orders-delete-text">
                {t("orders.deleteDialog.confirmText", { code: orderToDelete.code })}
              </p>
              <div className="staff-orders-delete-actions">
                <button 
                  type="button"
                  className="staff-orders-delete-cancel"
                  onClick={() => setOrderToDelete(null)}
                >
                  {t("orders.deleteDialog.btnCancel")}
                </button>
                <button 
                  type="button"
                  className="staff-orders-delete-confirm"
                  onClick={confirmDeleteOrder}
                >
                  {t("orders.deleteDialog.btnConfirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default StaffOrders;