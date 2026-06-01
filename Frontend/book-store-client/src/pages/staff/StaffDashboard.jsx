import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getDashboardData } from "../../services/staffDashboardService";

function formatCurrency(value, language = "vi") {
  const locale = language === "vi" ? "vi-VN" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatTime(value, locale = "vi-VN") {
  if (!value) return "--:--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(value) {
  if (!value) return false;

  const date = new Date(value);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function getOrderId(order) {
  return order.id || order.Id || order.orderId || order.OrderId || "N/A";
}

function getOrderCustomer(order, t) {
  const name =
    order.customerName ||
    order.CustomerName ||
    order.user?.fullName ||
    order.User?.FullName ||
    order.user?.name ||
    order.User?.Name;

  if (!name) return t ? t("dashboard.customerWalkin") : "Khách lẻ";
  return name;
}

function getOrderTotal(order) {
  return Number(
    order.totalAmount ||
      order.TotalAmount ||
      order.total ||
      order.Total ||
      order.finalAmount ||
      order.FinalAmount ||
      0
  );
}

function getOrderStatus(order, t) {
  const status =
    order.status ||
    order.Status ||
    order.paymentStatus ||
    order.PaymentStatus;

  if (!status) return t ? t("dashboard.pendingPayment") : "Chờ thanh toán";
  return status;
}

function getOrderDate(order) {
  return (
    order.orderDate ||
    order.OrderDate ||
    order.createdAt ||
    order.CreatedAt ||
    order.createdDate ||
    order.CreatedDate ||
    ""
  );
}

function getProductStock(product) {
  return Number(
    product.stockQuantity ||
      product.StockQuantity ||
      product.quantity ||
      product.Quantity ||
      product.stock ||
      product.Stock ||
      0
  );
}

const quickActions = [
  { labelKey: "dashboard.actionPos", path: "/staff/pos", icon: "🛒" },
  { labelKey: "dashboard.actionCustomers", path: "/staff/customers", icon: "👥" },
  { labelKey: "dashboard.actionOrders", path: "/staff/orders", icon: "📦" },
  { labelKey: "dashboard.actionShift", path: "/staff/shift", icon: "🔐" },
];

function StaffDashboard() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const currentLanguage = i18n.language?.startsWith("en") ? "en" : "vi";

  const money = useCallback(
    (value) => formatCurrency(value, currentLanguage),
    [currentLanguage]
  );

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getDashboardData();

      setOrders(data.orders);
      setProducts(data.products);
      setReturns(data.returns);
    } catch (err) {
      setError(t("dashboard.loadError", { message: err.message }));
      setOrders([]);
      setProducts([]);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const dashboardData = useMemo(() => {
    const todayOrders = orders.filter((order) => isToday(getOrderDate(order)));

    const paidTodayOrders = todayOrders.filter((order) => {
      const status = String(getOrderStatus(order)).toLowerCase();
      return (
        status.includes("đã thanh toán") ||
        status.includes("paid") ||
        status.includes("completed") ||
        status.includes("hoàn thành")
      );
    });

    const todayRevenue = paidTodayOrders.reduce(
      (sum, order) => sum + getOrderTotal(order),
      0
    );

    const soldBooks = paidTodayOrders.reduce((sum, order) => {
      const details =
        order.orderDetails ||
        order.OrderDetails ||
        order.items ||
        order.Items ||
        [];

      if (!Array.isArray(details)) return sum;

      return (
        sum +
        details.reduce((itemSum, item) => {
          return itemSum + Number(item.quantity || item.Quantity || 0);
        }, 0)
      );
    }, 0);

    const lowStockProducts = products.filter(
      (product) => getProductStock(product) > 0 && getProductStock(product) <= 3
    );

    const recentOrders = [...orders]
      .sort((a, b) => new Date(getOrderDate(b)) - new Date(getOrderDate(a)))
      .slice(0, 5)
      .map((order) => ({
        id: getOrderId(order),
        customer: getOrderCustomer(order, t),
        total: money(getOrderTotal(order)),
        status: getOrderStatus(order, t),
        time: formatTime(getOrderDate(order), dateLocale),
      }));

    const stats = [
      {
        label: t("dashboard.todayOrders"),
        value: todayOrders.length,
        icon: "📦",
        note: t("dashboard.todayOrdersDesc"),
      },
      {
        label: t("dashboard.todayRevenue"),
        value: money(todayRevenue),
        icon: "💰",
        note: t("dashboard.todayRevenueDesc"),
      },
      {
        label: t("dashboard.soldBooks"),
        value: soldBooks,
        icon: "📚",
        note: t("dashboard.soldBooksDesc"),
      },
      {
        label: t("dashboard.returns"),
        value: returns.length,
        icon: "🔄",
        note: t("dashboard.returnsDesc"),
      },
    ];

    return {
      stats,
      recentOrders,
      lowStockProducts,
    };
  }, [orders, products, returns, money, t, dateLocale]);

  return (
    <div className="staff-page">
      {error && (
        <div className="staff-alert staff-alert--warning">
          <strong>{t("dashboard.loadErrorTitle")}</strong>
          <p>{error}</p>
        </div>
      )}

      <div className="staff-grid staff-grid--4 staff-stats-compact">
        {dashboardData.stats.map((item) => (
          <div className="staff-card staff-stat" key={item.label}>
            <div className="staff-stat__icon">{item.icon}</div>
            <div>
              <p>{item.label}</p>
              <h3>{loading ? "..." : item.value}</h3>
              <span>{item.note}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="staff-grid staff-grid--2">
        <div className="staff-card">
          <div className="staff-card__header">
            <h2>{t("dashboard.quickActions")}</h2>
          </div>

          <div className="staff-quick-actions">
            {quickActions.map((item) => (
              <Link
                to={item.path}
                className="staff-quick-action"
                key={item.path}
              >
                <span>{item.icon}</span>
                <strong>{t(item.labelKey)}</strong>
              </Link>
            ))}
          </div>
        </div>

        <div className="staff-card">
          <div className="staff-card__header">
            <h2>{t("dashboard.notifications")}</h2>
          </div>

          <div className="staff-alert-list">
            {dashboardData.lowStockProducts.length > 0 ? (
              <div className="staff-alert staff-alert--warning">
                <strong>{t("dashboard.lowStockWarningTitle")}</strong>
                <p>
                  {t("dashboard.lowStockWarningDesc", {
                    count: dashboardData.lowStockProducts.length,
                  })}
                </p>
              </div>
            ) : (
              <div className="staff-alert staff-alert--success">
                <strong>{t("dashboard.stableStockTitle")}</strong>
                <p>{t("dashboard.stableStockDesc")}</p>
              </div>
            )}

            <div className="staff-alert staff-alert--info">
              <strong>{t("dashboard.todayOrdersAlertTitle")}</strong>
              <p>
                {t("dashboard.todayOrdersAlertDesc", {
                  count: dashboardData.stats[0].value,
                })}
              </p>
            </div>

            <div className="staff-alert staff-alert--success">
              <strong>{t("dashboard.shiftOpenTitle")}</strong>
              <p>{t("dashboard.shiftOpenDesc")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="staff-card">
        <div className="staff-card__header">
          <h2>{t("dashboard.recentOrders")}</h2>
          <Link to="/staff/orders" className="staff-link">
            {t("dashboard.viewAll")}
          </Link>
        </div>

        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead>
              <tr>
                <th>{t("dashboard.tableOrderId")}</th>
                <th>{t("dashboard.tableCustomer")}</th>
                <th>{t("dashboard.tableTotal")}</th>
                <th>{t("dashboard.tableStatus")}</th>
                <th>{t("dashboard.tableTime")}</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5">
                    <div className="staff-empty">{t("dashboard.loading")}</div>
                  </td>
                </tr>
              )}

              {!loading &&
                dashboardData.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.total}</td>
                    <td>
                      <span
                        className={
                          String(order.status).toLowerCase().includes("chờ") ||
                          String(order.status).toLowerCase().includes("pending") ||
                          String(order.status).toLowerCase().includes("wait")
                            ? "staff-badge staff-badge--warning"
                            : "staff-badge staff-badge--success"
                        }
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>{order.time}</td>
                  </tr>
                ))}

              {!loading && dashboardData.recentOrders.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="staff-empty">{t("dashboard.noOrders")}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default StaffDashboard;