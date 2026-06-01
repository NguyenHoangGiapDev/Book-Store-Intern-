import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/staff/StaffReports.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api"
).replace(/\/$/, "");

const DATE_FILTERS = {
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
  ALL: "all",
};

const ORDER_STATUS_VALUES = {
  CANCELLED: "Bị hủy",
  RETURNED: "Hoàn hàng",
  DELIVERED: "Giao thành công",
  PAID: "Đã thanh toán",
};

const RETURN_ISSUES = [
  "Hàng lỗi",
  "Giao sai hàng",
  "Thiếu hàng",
  "Khách không nhận hàng",
  "Khách hủy đơn",
];

const CASH_METHODS = ["cash", "tiền mặt", "tien mat", ""];

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function getUserId() {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || localStorage.getItem("userData") || "{}"
    );

    return user.id || user.Id || user.userId || user.UserId || null;
  } catch {
    return null;
  }
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

function formatCurrency(value, language = "vi") {
  const locale = language?.startsWith("vi") ? "vi-VN" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDateTime(value, locale = "vi-VN", fallback = "—") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(locale);
}

function isToday(dateValue) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getOrderId(order) {
  return order.id || order.Id || order.orderId || order.OrderId || "";
}

function getOrderDate(order) {
  return order.orderDate || order.OrderDate || order.createdAt || order.CreatedAt;
}

function getOrderStatus(order) {
  return order.status || order.Status || "";
}

function getOrderIssue(order) {
  return order.issue || order.Issue || "";
}

function getOrderTotal(order) {
  return Number(
    order.totalAmount ||
      order.TotalAmount ||
      order.total ||
      order.Total ||
      order.grandTotal ||
      order.GrandTotal ||
      0
  );
}

function getOrderCustomerName(order) {
  return (
    order.customerName ||
    order.CustomerName ||
    order.customer?.fullName ||
    order.Customer?.FullName ||
    ""
  );
}

function getOrderDetails(order) {
  return toArray(order.orderDetails || order.OrderDetails || order.items || order.Items);
}

function getProductName(detail, fallback) {
  return (
    detail.productTitle ||
    detail.ProductTitle ||
    detail.productName ||
    detail.ProductName ||
    detail.name ||
    detail.Name ||
    fallback
  );
}

function getPaymentOrderId(payment) {
  return payment.orderId || payment.OrderId || payment.order?.id || payment.Order?.Id;
}

function getPaymentMethod(payment, fallback) {
  return payment.paymentMethod || payment.PaymentMethod || fallback;
}

function getPaymentAmount(payment) {
  return Number(payment.amount || payment.Amount || payment.total || payment.Total || 0);
}

function getTransactionType(transaction) {
  return transaction.type || transaction.Type || "";
}

function getTransactionReason(transaction) {
  return transaction.reason || transaction.Reason || "";
}

function getTransactionAmount(transaction) {
  return Number(transaction.amount || transaction.Amount || 0);
}

function getTransactionDate(transaction) {
  return transaction.createdAt || transaction.CreatedAt || transaction.date || transaction.Date;
}

async function apiRequest(path) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

function analyzeOrders(orders, payments, shift, t) {
  const activeOrders = orders
    .filter((order) => {
      const orderDate = getOrderDate(order);

      if (!orderDate) return false;

      if (shift?.openedAt) {
        return new Date(orderDate) >= new Date(shift.openedAt);
      }

      return isToday(orderDate);
    })
    .filter((order) => getOrderStatus(order) !== ORDER_STATUS_VALUES.CANCELLED);

  const totalRevenue = activeOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const productMap = {};

  activeOrders.forEach((order) => {
    const details = getOrderDetails(order);

    details.forEach((detail) => {
      const name = getProductName(detail, t("reports.defaults.product"));
      const quantity = Number(detail.quantity || detail.Quantity || 0);
      const revenue = Number(detail.totalPrice || detail.TotalPrice || 0);

      if (!productMap[name]) {
        productMap[name] = {
          name,
          qty: 0,
          revenue: 0,
        };
      }

      productMap[name].qty += quantity;
      productMap[name].revenue += revenue;
    });
  });

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const totalItems = Object.values(productMap).reduce(
    (sum, product) => sum + product.qty,
    0
  );

  const returnOrders = activeOrders.filter((order) => {
    const issue = getOrderIssue(order);
    const status = getOrderStatus(order);

    return (
      RETURN_ISSUES.includes(issue) ||
      [ORDER_STATUS_VALUES.RETURNED, ORDER_STATUS_VALUES.CANCELLED].includes(
        status
      )
    );
  });

  const activeOrderIds = new Set(activeOrders.map(getOrderId));
  const activePayments = payments.filter((payment) =>
    activeOrderIds.has(getPaymentOrderId(payment))
  );

  const paymentMap = {};

  activePayments.forEach((payment) => {
    const method = getPaymentMethod(payment, t("reports.payment.cash"));
    const amount = getPaymentAmount(payment);

    if (!paymentMap[method]) {
      paymentMap[method] = {
        method,
        count: 0,
        amount: 0,
      };
    }

    paymentMap[method].count += 1;
    paymentMap[method].amount += amount;
  });

  const paymentStats = Object.values(paymentMap);

  const cashRevenue = activePayments
    .filter((payment) => {
      const method = getPaymentMethod(payment, "").toLowerCase();
      return CASH_METHODS.includes(method);
    })
    .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);

  const transactions = toArray(shift?.transactions || shift?.Transactions);

  const shiftIncome = transactions
    .filter((transaction) => getTransactionType(transaction) === "Thu")
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);

  const shiftExpense = transactions
    .filter((transaction) => getTransactionType(transaction) === "Chi")
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);

  const openingCash = Number(shift?.openingCash || shift?.OpeningCash || 0);
  const expectedCash = openingCash + cashRevenue + shiftIncome - shiftExpense;

  return {
    totalOrders: activeOrders.length,
    totalRevenue,
    totalItems,
    returnCount: returnOrders.length,
    topProducts,
    paymentStats,
    cashRevenue,
    shiftIncome,
    shiftExpense,
    openingCash,
    expectedCash,
    todayOrders: activeOrders,
    transactions,
  };
}

function getStatusBadgeClass(status) {
  if (
    [ORDER_STATUS_VALUES.DELIVERED, ORDER_STATUS_VALUES.PAID].includes(status)
  ) {
    return "staff-badge--success";
  }

  if ([ORDER_STATUS_VALUES.CANCELLED, ORDER_STATUS_VALUES.RETURNED].includes(status)) {
    return "staff-badge--danger";
  }

  return "staff-badge--warning";
}

export default function StaffReports() {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language?.startsWith("en") ? "en" : "vi";
  const dateLocale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";

  const money = useCallback(
    (value) => formatCurrency(value, currentLanguage),
    [currentLanguage]
  );

  const staffId = useMemo(() => getUserId(), []);

  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.TODAY);
  const [keyword, setKeyword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [ordersData, paymentsData] = await Promise.all([
        apiRequest("/orders"),
        apiRequest("/payments"),
      ]);

      setOrders(toArray(ordersData));
      setPayments(toArray(paymentsData));

      try {
        const shiftUrl = staffId
          ? `/shifts/open?staffId=${staffId}`
          : "/shifts/open";

        const shiftData = await apiRequest(shiftUrl);
        setShift(shiftData);
      } catch {
        setShift(null);
      }
    } catch (err) {
      setError(t("reports.alerts.loadError", { message: err.message }));
      setOrders([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [staffId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const filters = useMemo(
    () => [
      { key: DATE_FILTERS.TODAY, label: t("reports.filters.today") },
      { key: DATE_FILTERS.WEEK, label: t("reports.filters.week") },
      { key: DATE_FILTERS.MONTH, label: t("reports.filters.month") },
      { key: DATE_FILTERS.ALL, label: t("reports.filters.all") },
    ],
    [t]
  );

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const searchValue = keyword.trim().toLowerCase();

    return orders
      .filter((order) => {
        const date = new Date(getOrderDate(order) || 0);

        if (dateFilter === DATE_FILTERS.TODAY) {
          return date.toDateString() === now.toDateString();
        }

        if (dateFilter === DATE_FILTERS.WEEK) {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return date >= weekAgo;
        }

        if (dateFilter === DATE_FILTERS.MONTH) {
          return (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth()
          );
        }

        return true;
      })
      .filter((order) => {
        if (!searchValue) return true;

        const id = getOrderId(order);
        const code = `DH${String(id).padStart(3, "0")}`.toLowerCase();
        const customer = getOrderCustomerName(order).toLowerCase();

        return code.includes(searchValue) || customer.includes(searchValue);
      });
  }, [orders, dateFilter, keyword]);

  const stats = useMemo(
    () => analyzeOrders(filteredOrders, payments, shift, t),
    [filteredOrders, payments, shift, t]
  );

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) return;

    const now = new Date().toLocaleString(dateLocale);

    const topProductRows = stats.topProducts
      .map(
        (product) => `
          <tr>
            <td>${product.name}</td>
            <td>${product.qty}</td>
            <td>${money(product.revenue)}</td>
          </tr>
        `
      )
      .join("");

    const paymentRows = stats.paymentStats
      .map(
        (payment) => `
          <tr>
            <td>${payment.method}</td>
            <td>${payment.count}</td>
            <td>${money(payment.amount)}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${t("reports.print.title")}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #0f172a;
            }

            h2 {
              margin-bottom: 4px;
            }

            p {
              margin: 4px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 14px;
            }

            th,
            td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }

            th {
              background: #f5f5f5;
            }

            .total {
              font-size: 20px;
              font-weight: 700;
              color: #2563eb;
              margin-top: 16px;
            }
          </style>
        </head>

        <body>
          <h2>${t("reports.print.heading")}</h2>
          <p>${t("reports.print.printedAt")}: ${now}</p>
          <p>
            ${t("reports.print.totalOrders")}: <b>${stats.totalOrders}</b> |
            ${t("reports.print.revenue")}: <b>${money(stats.totalRevenue)}</b> |
            ${t("reports.print.items")}: <b>${stats.totalItems}</b>
          </p>

          <h3>${t("reports.sections.topProducts")}</h3>
          <table>
            <thead>
              <tr>
                <th>${t("reports.table.product")}</th>
                <th>${t("reports.table.quantity")}</th>
                <th>${t("reports.table.revenue")}</th>
              </tr>
            </thead>
            <tbody>
              ${
                topProductRows ||
                `<tr><td colspan="3">${t("reports.empty.noSalesData")}</td></tr>`
              }
            </tbody>
          </table>

          <h3>${t("reports.sections.paymentReport")}</h3>
          <table>
            <thead>
              <tr>
                <th>${t("reports.table.paymentMethod")}</th>
                <th>${t("reports.table.orderCount")}</th>
                <th>${t("reports.table.amount")}</th>
              </tr>
            </thead>
            <tbody>
              ${
                paymentRows ||
                `<tr><td colspan="3">${t("reports.empty.noPaymentData")}</td></tr>`
              }
            </tbody>
          </table>

          <h3>${t("reports.sections.shiftClosing")}</h3>
          <p>${t("reports.summary.openingCash")}: ${money(stats.openingCash)}</p>
          <p>${t("reports.summary.cashRevenue")}: ${money(stats.cashRevenue)}</p>
          <p>${t("reports.summary.extraIncome")}: ${money(stats.shiftIncome)}</p>
          <p>${t("reports.summary.expense")}: ${money(stats.shiftExpense)}</p>

          <div class="total">
            ${t("reports.summary.expectedCash")}: ${money(stats.expectedCash)}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="staff-page">
      {error && (
        <div className="staff-alert staff-alert--warning">
          <strong>{t("reports.alerts.loadErrorTitle")}</strong>
          <p>{error}</p>
        </div>
      )}

      <div className="staff-card report-toolbar-card">
        <div className="report-toolbar">
          <div className="report-filter-group">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`report-filter-btn ${
                  dateFilter === filter.key ? "active" : ""
                }`}
                onClick={() => setDateFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <input
            className="staff-input report-search-input"
            placeholder={t("reports.toolbar.searchPlaceholder")}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <button
            type="button"
            className="staff-btn staff-btn--outline"
            onClick={load}
            disabled={loading}
          >
            {loading ? t("reports.toolbar.loading") : t("reports.toolbar.refresh")}
          </button>
        </div>
      </div>

      <div className="staff-grid staff-grid--4 staff-stats-compact">
        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">📦</div>
          <div>
            <p>{t("reports.stats.totalOrders")}</p>
            <h3>{loading ? "..." : stats.totalOrders}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon staff-stat__icon--warning">💰</div>
          <div>
            <p>{t("reports.stats.revenue")}</p>
            <h3 className="staff-stat__value--warning">
              {loading ? "..." : money(stats.totalRevenue)}
            </h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon staff-stat__icon--success">📚</div>
          <div>
            <p>{t("reports.stats.soldItems")}</p>
            <h3 className="staff-stat__value--success">
              {loading ? "..." : stats.totalItems}
            </h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon staff-stat__icon--danger">🔄</div>
          <div>
            <p>{t("reports.stats.returns")}</p>
            <h3 className="staff-stat__value--danger">
              {loading ? "..." : stats.returnCount}
            </h3>
          </div>
        </div>
      </div>

      <div className="staff-grid staff-grid--2">
        <div className="staff-card">
          <div className="staff-card__header">
            <h2>{t("reports.sections.topProducts")}</h2>
            <span className="staff-badge">
              {t("reports.badges.productCount", {
                count: stats.topProducts.length,
              })}
            </span>
          </div>

          {loading ? (
            <div className="staff-empty">{t("reports.empty.loading")}</div>
          ) : stats.topProducts.length === 0 ? (
            <div className="staff-empty">{t("reports.empty.noSalesData")}</div>
          ) : (
            <div className="staff-table-wrap">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>{t("reports.table.no")}</th>
                    <th>{t("reports.table.product")}</th>
                    <th>{t("reports.table.quantity")}</th>
                    <th>{t("reports.table.revenue")}</th>
                  </tr>
                </thead>

                <tbody>
                  {stats.topProducts.map((product, index) => (
                    <tr key={product.name}>
                      <td>
                        <span
                          className={`report-rank report-rank--${
                            index < 3 ? index + 1 : "other"
                          }`}
                        >
                          {index === 0
                            ? "🥇"
                            : index === 1
                              ? "🥈"
                              : index === 2
                                ? "🥉"
                                : index + 1}
                        </span>
                      </td>

                      <td>
                        <strong>{product.name}</strong>
                      </td>

                      <td>
                        <span className="staff-badge staff-badge--warning">
                          {product.qty}
                        </span>
                      </td>

                      <td>
                        <strong className="report-money-primary">
                          {money(product.revenue)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="staff-card">
          <div className="staff-card__header">
            <h2>{t("reports.sections.paymentReport")}</h2>
          </div>

          {loading ? (
            <div className="staff-empty">{t("reports.empty.loading")}</div>
          ) : stats.paymentStats.length === 0 ? (
            <div className="staff-alert staff-alert--info" style={{ marginBottom: 0 }}>
              <strong>{t("reports.empty.noPaymentTitle")}</strong>
              <p>{t("reports.empty.noPaymentDesc")}</p>
            </div>
          ) : (
            <div className="staff-table-wrap">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>{t("reports.table.paymentMethod")}</th>
                    <th>{t("reports.table.orderCount")}</th>
                    <th>{t("reports.table.amount")}</th>
                    <th>{t("reports.table.percent")}</th>
                  </tr>
                </thead>

                <tbody>
                  {stats.paymentStats.map((payment) => {
                    const percent =
                      stats.totalRevenue > 0
                        ? Math.round((payment.amount / stats.totalRevenue) * 100)
                        : 0;

                    return (
                      <tr key={payment.method}>
                        <td>
                          <strong>{payment.method}</strong>
                        </td>

                        <td>{payment.count}</td>

                        <td>
                          <strong className="report-money-primary">
                            {money(payment.amount)}
                          </strong>
                        </td>

                        <td>
                          <div className="report-bar-wrap">
                            <div
                              className="report-bar"
                              style={{ width: `${percent}%` }}
                            />
                            <span>{percent}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="report-revenue-summary">
            <div>
              <span>{t("reports.summary.cash")}</span>
              <strong className="report-money-success">
                {money(stats.cashRevenue)}
              </strong>
            </div>

            <div>
              <span>{t("reports.summary.bankCard")}</span>
              <strong className="report-money-primary">
                {money(stats.totalRevenue - stats.cashRevenue)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="staff-card">
        <div className="staff-card__header">
          <h2>{t("reports.sections.orderList")}</h2>
          <span className="staff-badge">
            {t("reports.badges.orderCount", {
              count: filteredOrders.length,
            })}
          </span>
        </div>

        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead>
              <tr>
                <th>{t("reports.table.no")}</th>
                <th>{t("reports.table.orderCode")}</th>
                <th>{t("reports.table.customer")}</th>
                <th>{t("reports.table.product")}</th>
                <th>{t("reports.table.total")}</th>
                <th>{t("reports.table.status")}</th>
                <th>{t("reports.table.createdAt")}</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="7">
                    <div className="staff-empty">{t("reports.empty.loading")}</div>
                  </td>
                </tr>
              )}

              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="staff-empty">
                      {t("reports.empty.noOrders")}
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredOrders.slice(0, 50).map((order, index) => {
                  const id = getOrderId(order);
                  const code = `DH${String(id).padStart(3, "0")}`;
                  const details = getOrderDetails(order);
                  const firstDetail = details[0];
                  const status = getOrderStatus(order);
                  const badgeClass = getStatusBadgeClass(status);

                  return (
                    <tr key={id || index}>
                      <td>{index + 1}</td>

                      <td>{code}</td>

                      <td>
                        {getOrderCustomerName(order) ||
                          t("reports.defaults.walkInCustomer")}
                      </td>

                      <td>
                        <span>
                          {firstDetail
                            ? getProductName(
                                firstDetail,
                                t("reports.defaults.product")
                              )
                            : "—"}
                        </span>

                        {details.length > 1 && (
                          <p>
                            {t("reports.table.moreProducts", {
                              count: details.length - 1,
                            })}
                          </p>
                        )}
                      </td>

                      <td>
                        <strong className="report-money-primary">
                          {money(getOrderTotal(order))}
                        </strong>
                      </td>

                      <td>
                        <span className={`staff-badge ${badgeClass}`}>
                          {status || t("reports.defaults.noStatus")}
                        </span>
                      </td>

                      <td className="report-muted-date">
                        {formatDateTime(
                          getOrderDate(order),
                          dateLocale,
                          t("reports.defaults.noDate")
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 50 && (
          <p className="report-limit-note">
            {t("reports.table.limitNote", {
              shown: 50,
              total: filteredOrders.length,
            })}
          </p>
        )}
      </div>

      <div className="staff-card">
        <div className="staff-card__header">
          <h2>{t("reports.sections.shiftClosing")}</h2>

          {shift ? (
            <span className="staff-badge staff-badge--success">
              {t("reports.shift.openShift", {
                id: shift.id || shift.Id,
                staff: shift.staffName || shift.StaffName || t("reports.defaults.staff"),
              })}
            </span>
          ) : (
            <span className="staff-badge staff-badge--warning">
              {t("reports.shift.noOpenShift")}
            </span>
          )}
        </div>

        <div className="staff-report-summary">
          <div>
            <span>{t("reports.summary.openingCash")}</span>
            <strong>{money(stats.openingCash)}</strong>
          </div>

          <div>
            <span>{t("reports.summary.cashRevenue")}</span>
            <strong className="report-money-primary">
              {money(stats.cashRevenue)}
            </strong>
          </div>

          <div>
            <span>{t("reports.summary.bankCardRevenue")}</span>
            <strong>{money(stats.totalRevenue - stats.cashRevenue)}</strong>
          </div>

          <div>
            <span>{t("reports.summary.extraIncome")}</span>
            <strong className="report-money-success">
              +{money(stats.shiftIncome)}
            </strong>
          </div>

          <div>
            <span>{t("reports.summary.expense")}</span>
            <strong className="report-money-danger">
              -{money(stats.shiftExpense)}
            </strong>
          </div>

          <div className="staff-report-summary__total">
            <span>{t("reports.summary.expectedCash")}</span>
            <strong>{money(stats.expectedCash)}</strong>
          </div>
        </div>

        {stats.transactions.length > 0 && (
          <div className="report-tx-history">
            <p className="report-tx-title">
              {t("reports.transactions.title", {
                count: stats.transactions.length,
              })}
            </p>

            <div className="staff-table-wrap">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>{t("reports.transactions.type")}</th>
                    <th>{t("reports.transactions.reason")}</th>
                    <th>{t("reports.transactions.amount")}</th>
                    <th>{t("reports.transactions.time")}</th>
                  </tr>
                </thead>

                <tbody>
                  {stats.transactions.map((transaction, index) => {
                    const type = getTransactionType(transaction);
                    const isIncome = type === "Thu";

                    return (
                      <tr key={transaction.id || transaction.Id || index}>
                        <td>
                          <span
                            className={`staff-badge ${
                              isIncome
                                ? "staff-badge--success"
                                : "staff-badge--danger"
                            }`}
                          >
                            {isIncome
                              ? t("reports.transactions.income")
                              : t("reports.transactions.expense")}
                          </span>
                        </td>

                        <td>
                          {getTransactionReason(transaction) ||
                            t("reports.defaults.noReason")}
                        </td>

                        <td>
                          <strong
                            className={
                              isIncome
                                ? "report-tx-amount-income"
                                : "report-tx-amount-expense"
                            }
                          >
                            {isIncome ? "+" : "-"}
                            {money(getTransactionAmount(transaction))}
                          </strong>
                        </td>

                        <td className="report-muted-date">
                          {formatDateTime(
                            getTransactionDate(transaction),
                            dateLocale,
                            t("reports.defaults.noDate")
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="staff-actions staff-actions--right" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="staff-btn staff-btn--outline"
            onClick={handlePrint}
            style={{ minWidth: 140 }}
          >
            {t("reports.actions.print")}
          </button>

          <button
            type="button"
            className="staff-btn staff-btn--primary"
            onClick={load}
            style={{ minWidth: 140 }}
            disabled={loading}
          >
            {loading
              ? t("reports.toolbar.loading")
              : t("reports.actions.refreshData")}
          </button>
        </div>
      </div>
    </div>
  );
}