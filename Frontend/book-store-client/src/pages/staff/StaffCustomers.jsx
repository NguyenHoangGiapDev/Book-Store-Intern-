import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/staff/StaffCustomers.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api"
).replace(/\/$/, "");

const CUSTOMER_API = "/users";
const ORDER_API = "/orders";

const emptyForm = {
  fullName: "",
  phoneNumber: "",
  email: "",
  address: "",
  gender: "",
  dateOfBirth: "",
};
const CUSTOMER_RANKS = {
  ALL: "all",
  VIP: "vip",
  REGULAR: "regular",
  PURCHASED: "purchased",
  NEW: "new",
};

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function pick(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
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
function formatCurrency(value, language = "vi") {
  const locale = language === "vi" ? "vi-VN" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value, locale = "vi-VN", fallback = "") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(locale);
}

function getCustomerRank(totalSpent) {
  const value = Number(totalSpent || 0);
  if (value >= 5000000) return CUSTOMER_RANKS.VIP;
  if (value >= 2000000) return CUSTOMER_RANKS.REGULAR;
  if (value > 0) return CUSTOMER_RANKS.PURCHASED;
  return CUSTOMER_RANKS.NEW;
}
function getRankClass(rank) {
  if (rank === CUSTOMER_RANKS.VIP) return "staff-badge staff-badge--danger";
  if (rank === CUSTOMER_RANKS.REGULAR) return "staff-badge staff-badge--success";
  if (rank === CUSTOMER_RANKS.PURCHASED) return "staff-badge staff-badge--warning";
  return "staff-badge";
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

function normalizeCustomer(rawCustomer) {
  const rawEmail = pick(rawCustomer.email, rawCustomer.Email, "");
  const email =
    rawEmail && rawEmail.includes("@khachhang.local") ? "" : rawEmail;

  const roleName = String(
    rawCustomer.roleName ||
      rawCustomer.RoleName ||
      rawCustomer.role?.name ||
      rawCustomer.Role?.Name ||
      ""
  ).toLowerCase();

  const roleId = Number(
    rawCustomer.roleId ||
      rawCustomer.RoleId ||
      rawCustomer.role?.id ||
      rawCustomer.Role?.Id ||
      0
  );

  return {
    id: pick(
      rawCustomer.id,
      rawCustomer.Id,
      rawCustomer.customerId,
      rawCustomer.CustomerId,
      rawCustomer.userId,
      rawCustomer.UserId
    ),
    fullName: pick(
      rawCustomer.fullName,
      rawCustomer.FullName,
      rawCustomer.name,
      rawCustomer.Name,
      rawCustomer.customerName,
      rawCustomer.CustomerName,
      ""
    ),
    phoneNumber: pick(
      rawCustomer.phoneNumber,
      rawCustomer.PhoneNumber,
      rawCustomer.phone,
      rawCustomer.Phone,
      ""
    ),
    email,
    address: pick(
      rawCustomer.address,
      rawCustomer.Address,
      rawCustomer.shippingAddress,
      rawCustomer.ShippingAddress,
      ""
    ),
    gender: pick(rawCustomer.gender, rawCustomer.Gender, ""),
    dateOfBirth: pick(
      rawCustomer.dateOfBirth,
      rawCustomer.DateOfBirth,
      rawCustomer.birthday,
      rawCustomer.Birthday,
      ""
    ),
    createdAt: pick(
      rawCustomer.createdAt,
      rawCustomer.CreatedAt,
      rawCustomer.createdDate,
      rawCustomer.CreatedDate,
      ""
    ),
    isActive: pick(
      rawCustomer.isActive,
      rawCustomer.IsActive,
      rawCustomer.status,
      rawCustomer.Status,
      true
    ),
    roleName,
    roleId,
  };
}

function normalizeOrder(rawOrder) {
  const user = pick(
    rawOrder.user,
    rawOrder.User,
    rawOrder.customer,
    rawOrder.Customer,
    {}
  );

  return {
    id: pick(rawOrder.id, rawOrder.Id, rawOrder.orderId, rawOrder.OrderId),
    userId: pick(
      rawOrder.userId,
      rawOrder.UserId,
      rawOrder.customerId,
      rawOrder.CustomerId,
      user.id,
      user.Id
    ),
    customerName: pick(
      rawOrder.customerName,
      rawOrder.CustomerName,
      user.fullName,
      user.FullName,
      user.name,
      user.Name,
      ""
    ),
    phoneNumber: pick(
      rawOrder.phoneNumber,
      rawOrder.PhoneNumber,
      rawOrder.phone,
      rawOrder.Phone,
      user.phoneNumber,
      user.PhoneNumber,
      ""
    ),
    email: pick(rawOrder.email, rawOrder.Email, user.email, user.Email, ""),
    total: Number(
      pick(
        rawOrder.totalAmount,
        rawOrder.TotalAmount,
        rawOrder.total,
        rawOrder.Total,
        rawOrder.finalAmount,
        rawOrder.FinalAmount,
        0
      )
    ),
    createdAt: pick(
      rawOrder.orderDate,
      rawOrder.OrderDate,
      rawOrder.createdAt,
      rawOrder.CreatedAt
    ),
  };
}

function buildCustomerStats(customers, orders) {
  return customers.map((customer) => {
    const relatedOrders = orders.filter((order) => {
      const matchId =
        customer.id &&
        order.userId &&
        String(customer.id) === String(order.userId);

      const matchPhone =
        customer.phoneNumber &&
        order.phoneNumber &&
        String(customer.phoneNumber) === String(order.phoneNumber);

      const matchEmail =
        customer.email &&
        order.email &&
        String(customer.email).toLowerCase() ===
          String(order.email).toLowerCase();

      const matchName =
        customer.fullName &&
        order.customerName &&
        String(customer.fullName).toLowerCase() ===
          String(order.customerName).toLowerCase();

      return matchId || matchPhone || matchEmail || matchName;
    });

    const totalSpent = relatedOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    return {
      ...customer,
      ordersCount: relatedOrders.length,
      totalSpent,
      lastOrderDate: relatedOrders[0]?.createdAt || "",
      rank: getCustomerRank(totalSpent),
    };
  });
}

function StaffCustomers() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const currentLanguage = i18n.language?.startsWith("en") ? "en" : "vi";

  const money = useCallback(
    (value) => formatCurrency(value, currentLanguage),
    [currentLanguage]
  );

  const getRankTranslation = (rank) => {
    if (rank === CUSTOMER_RANKS.VIP) return t("customers.rankVip");
    if (rank === CUSTOMER_RANKS.REGULAR) return t("customers.rankRegular");
    if (rank === CUSTOMER_RANKS.PURCHASED) return t("customers.rankPurchased");
    if (rank === CUSTOMER_RANKS.NEW) return t("customers.rankNew");
    return t("customers.rankFilterAll");
  };

  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [rankFilter, setRankFilter] = useState(CUSTOMER_RANKS.ALL);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [pageSize, setPageSize] = useState(() =>
    Number(localStorage.getItem("staffPageSize_customers") || 10)
  );

  const [currentPage, setCurrentPage] = useState(1);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [customerPayload, orderPayload] = await Promise.all([
        apiRequest(CUSTOMER_API),
        apiRequest(ORDER_API),
      ]);

      const allUsers = toArray(customerPayload)
        .map(normalizeCustomer)
        .filter((user) => {
          const roleName = String(user.roleName || "").toLowerCase();

          return (
            !roleName.includes("admin") &&
            !roleName.includes("staff") &&
            user.roleId !== 2 &&
            user.roleId !== 3
          );
        });

      setCustomers(allUsers);
      setOrders(toArray(orderPayload).map(normalizeOrder));
    } catch (err) {
      setError(t("customers.alertLoadError", { message: err.message }));
      setCustomers([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const customersWithStats = useMemo(() => {
    return buildCustomerStats(customers, orders);
  }, [customers, orders]);

  const filteredCustomers = useMemo(() => {
    const searchValue = keyword.trim().toLowerCase();

    return customersWithStats.filter((customer) => {
      const matchKeyword =
        !searchValue ||
        customer.fullName?.toLowerCase().includes(searchValue) ||
        customer.phoneNumber?.toLowerCase().includes(searchValue) ||
        customer.email?.toLowerCase().includes(searchValue) ||
        customer.address?.toLowerCase().includes(searchValue);

      const matchRank =
        rankFilter === CUSTOMER_RANKS.ALL || customer.rank === rankFilter;

      return matchKeyword && matchRank;
    });
  }, [customersWithStats, keyword, rankFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / pageSize)
  );

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const stats = useMemo(() => {
    const totalCustomers = customersWithStats.length;

    const activeCustomers = customersWithStats.filter(
      (customer) => customer.ordersCount > 0
    ).length;

    const vipCustomers = customersWithStats.filter(
      (customer) => customer.rank === CUSTOMER_RANKS.VIP
    ).length;

    const totalRevenue = customersWithStats.reduce(
      (sum, customer) => sum + Number(customer.totalSpent || 0),
      0
    );

    return {
      totalCustomers,
      activeCustomers,
      vipCustomers,
      totalRevenue,
    };
  }, [customersWithStats]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingCustomer(null);
  };

  const validateForm = () => {
    if (!form.fullName.trim()) {
      alert(t("customers.alertFillName"));
      return false;
    }

    if (!form.phoneNumber.trim()) {
      alert(t("customers.alertFillPhone"));
      return false;
    }

    if (form.email.trim() && !form.email.includes("@")) {
      alert(t("customers.alertInvalidEmail"));
      return false;
    }

    return true;
  };

  const buildCustomerPayload = (isUpdate = false) => {
    const defaultEmail = form.phoneNumber.trim()
      ? `${form.phoneNumber.trim()}@khachhang.local`
      : `kh_${Date.now()}@khachhang.local`;

    const payload = {
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim() || defaultEmail,
      address: form.address.trim(),
      gender: form.gender,
      dateOfBirth: form.dateOfBirth || null,
      roleId: 1,
      isActive: true,
    };

    if (!isUpdate) {
      payload.password = "Password123!";
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      if (editingCustomer) {
        await apiRequest(`${CUSTOMER_API}/${editingCustomer.id}`, {
          method: "PUT",
          body: JSON.stringify(buildCustomerPayload(true)),
        });

        showToast(t("customers.toastUpdateSuccess"));
      } else {
        await apiRequest(CUSTOMER_API, {
          method: "POST",
          body: JSON.stringify(buildCustomerPayload(false)),
        });

        showToast(t("customers.toastSaveSuccess"));
      }

      resetForm();
      await fetchData();
    } catch (err) {
      showToast(t("customers.toastSaveFailed", { message: err.message }), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);

    setForm({
      fullName: customer.fullName || "",
      phoneNumber: customer.phoneNumber || "",
      email: customer.email || "",
      address: customer.address || "",
      gender: customer.gender || "",
      dateOfBirth: customer.dateOfBirth
        ? String(customer.dateOfBirth).slice(0, 10)
        : "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSelectForPOS = (customer) => {
    localStorage.setItem(
      "staff_selected_customer",
      JSON.stringify({
        id: customer.id,
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
        address: customer.address,
      })
    );

    navigate("/staff/pos");
  };

  return (
    <div className="staff-page staff-customers-page">
      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 20px",
            borderRadius: "16px",
            background:
              toast.type === "error"
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#ffffff",
            fontWeight: 700,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}
        >
          <span>{toast.type === "error" ? "❌" : "✅"}</span>
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            style={{
              border: "none",
              background: "rgba(255,255,255,0.2)",
              color: "#ffffff",
              borderRadius: "8px",
              width: "26px",
              height: "26px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="staff-alert staff-alert--warning">
          <strong>{t("customers.loadErrorTitle")}</strong>
          <p>{error}</p>
        </div>
      )}

      <div className="staff-grid staff-grid--4 staff-stats-compact">
        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">👥</div>
          <div>
            <p>{t("customers.totalCustomers")}</p>
            <h3>{stats.totalCustomers}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">🛒</div>
          <div>
            <p>{t("customers.activeCustomers")}</p>
            <h3>{stats.activeCustomers}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">⭐</div>
          <div>
            <p>{t("customers.vipCustomers")}</p>
            <h3>{stats.vipCustomers}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">💰</div>
          <div>
            <p>{t("customers.totalSpent")}</p>
            <h3>{money(stats.totalRevenue)}</h3>
          </div>
        </div>
      </div>

      <div className="staff-grid staff-grid--2">
        <div className="staff-card staff-customer-form-card">
          <div className="staff-card__header">
            <div>
              <h2>{editingCustomer ? t("customers.updateCustomer") : t("customers.addCustomer")}</h2>
              <p className="staff-card-subtitle">
                {t("customers.formDesc")}
              </p>
            </div>

            {editingCustomer && (
              <button
                type="button"
                className="staff-btn staff-btn--outline staff-btn--small"
                onClick={resetForm}
              >
                {t("customers.cancelEdit")}
              </button>
            )}
          </div>

          <form className="staff-form staff-customer-form" onSubmit={handleSubmit}>
            <div className="staff-form-group">
              <label>{t("customers.fullName")}</label>
              <input
                className="staff-input"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder={t("customers.fullNamePlaceholder")}
              />
            </div>

            <div className="staff-form-group">
              <label>{t("customers.phone")}</label>
              <input
                className="staff-input"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder={t("customers.phonePlaceholder")}
              />
            </div>

            <div className="staff-form-group">
              <label>{t("customers.email")}</label>
              <input
                className="staff-input"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t("customers.emailPlaceholder")}
              />
            </div>

            <div className="staff-form-group">
              <label>{t("customers.address")}</label>
              <input
                className="staff-input"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder={t("customers.addressPlaceholder")}
              />
            </div>

            <div className="staff-form-row">
              <div className="staff-form-group">
                <label>{t("customers.gender")}</label>
                <select
                  className="staff-input"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">{t("customers.genderPlaceholder")}</option>
                  <option value="male">{t("customers.genderMale")}</option>
                  <option value="female">{t("customers.genderFemale")}</option>
                  <option value="other">{t("customers.genderOther")}</option>
                </select>
              </div>

              <div className="staff-form-group">
                <label>{t("customers.dateOfBirth")}</label>
                <input
                  className="staff-input"
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              className="staff-btn staff-btn--primary staff-btn--full"
              type="submit"
              disabled={saving}
            >
              {saving
                ? t("customers.saving")
                : editingCustomer
                ? t("customers.updateCustomer")
                : t("customers.addCustomer")}
            </button>
          </form>
        </div>

        <div className="staff-card staff-customer-note-card">
          <div className="staff-card__header">
            <h2>{t("customers.roleTitle")}</h2>
          </div>

          <div className="staff-alert staff-alert--info">
            <strong>{t("customers.roleNoteTitle")}</strong>
            <p>
              {t("customers.roleNoteDesc")}
            </p>
          </div>

          <div className="staff-customer-rank-box">
            <div>
              <span className="staff-badge staff-badge--danger">{t("customers.rankVip")}</span>
              <p>{t("customers.vipDesc")}</p>
            </div>

            <div>
              <span className="staff-badge staff-badge--success">{t("customers.rankRegular")}</span>
              <p>{t("customers.regularDesc")}</p>
            </div>

            <div>
              <span className="staff-badge staff-badge--warning">{t("customers.rankPurchased")}</span>
              <p>{t("customers.newDesc")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="staff-card staff-customers-card">
        <div className="staff-page__toolbar staff-customers-toolbar">
          <input
            className="staff-input"
            placeholder={t("customers.searchPlaceholder")}
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setCurrentPage(1);
            }}
          />

          <div
            className={`staff-select-wrap ${
              rankFilter !== CUSTOMER_RANKS.ALL ? "has-clear" : ""
            }`}
          >
            <select
              className="staff-input"
              value={rankFilter}
              onChange={(event) => {
                setRankFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value={CUSTOMER_RANKS.ALL}>{t("customers.rankFilterAll")}</option>
              <option value={CUSTOMER_RANKS.VIP}>{t("customers.rankVip")}</option>
              <option value={CUSTOMER_RANKS.REGULAR}>{t("customers.rankRegular")}</option>
              <option value={CUSTOMER_RANKS.PURCHASED}>{t("customers.rankPurchased")}</option>
              <option value={CUSTOMER_RANKS.NEW}>{t("customers.rankNew")}</option>
            </select>

            {rankFilter !== CUSTOMER_RANKS.ALL && (
              <button
                type="button"
                className="staff-select-clear"
                title={t("customers.modalClose")}
                onClick={() => {
                  setRankFilter(CUSTOMER_RANKS.ALL);
                  setCurrentPage(1);
                }}
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            className="staff-btn staff-btn--outline"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? t("customers.loading") : t("customers.refresh")}
          </button>
        </div>

        <div className="staff-table-wrap">
          <table className="staff-table staff-customers-table">
            <thead>
              <tr>
                <th style={{ width: "52px", textAlign: "center" }}>{t("customers.tableNo")}</th>
                <th>{t("customers.tableName")}</th>
                <th>{t("customers.tableContact")}</th>
                <th>{t("customers.tableAddress")}</th>
                <th>{t("customers.tableOrders")}</th>
                <th>{t("customers.tableSpent")}</th>
                <th>{t("customers.tableRank")}</th>
                <th>{t("customers.tableLastOrder")}</th>
                <th style={{ width: "120px", textAlign: "center" }}>{t("customers.tableAction")}</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="9">
                    <div className="staff-empty">
                      {t("customers.loadingFromDb")}
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedCustomers.map((customer, index) => (
                  <tr key={customer.id || customer.phoneNumber}>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: 400,
                        color: "#0f172a",
                        fontSize: "15px",
                      }}
                    >
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

                    <td>
                      <div className="staff-customer-cell">
                        <strong>{customer.fullName}</strong>
                      </div>
                    </td>

                    <td>
                      <strong>{customer.phoneNumber || t("customers.noPhone")}</strong>
                      <p>{customer.email || t("customers.noEmail")}</p>
                    </td>

                    <td>{customer.address || t("customers.notUpdated")}</td>

                    <td>
                      <strong>{customer.ordersCount}</strong>
                    </td>

                    <td>
                      <strong>{money(customer.totalSpent)}</strong>
                    </td>

                    <td>
                      <span className={getRankClass(customer.rank)}>
                        {getRankTranslation(customer.rank)}
                      </span>
                    </td>

                    <td>{formatDate(customer.lastOrderDate, dateLocale, t("customers.none"))}</td>

                    <td>
                      <div className="staff-actions">
                        <button
                          type="button"
                          className="staff-btn staff-btn--small staff-btn--outline"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          {t("customers.actionDetail")}
                        </button>

                        <button
                          type="button"
                          className="staff-btn staff-btn--small"
                          onClick={() => handleEdit(customer)}
                        >
                          {t("customers.actionEdit")}
                        </button>

                        <button
                          type="button"
                          className="staff-btn staff-btn--small staff-btn--primary"
                          onClick={() => handleSelectForPOS(customer)}
                        >
                          {t("customers.actionSelect")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="staff-empty">
                      {t("customers.noProductsFound")}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="card-footer bg-white p-3" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 700 }}>
                {t("customers.displayRange", {
                  start: Math.min(filteredCustomers.length, (currentPage - 1) * pageSize + 1),
                  end: Math.min(filteredCustomers.length, currentPage * pageSize),
                  total: filteredCustomers.length
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#334155', fontWeight: 700, letterSpacing: '0.5px' }}>{t("customers.pageSizeLabel")}</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: '75px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', border: '1px solid #e2e8f0', padding: '4px 8px', cursor: 'pointer' }}
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); localStorage.setItem('staffPageSize_customers', e.target.value); setCurrentPage(1); }}
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
                    if (totalPages <= 5) {
                      for (let i = 1; i <= totalPages; i++) pages.push(<button key={i} style={btnStyle(currentPage === i)} onClick={() => setCurrentPage(i)}>{i}</button>);
                    } else {
                      pages.push(<button key={1} style={btnStyle(currentPage === 1)} onClick={() => setCurrentPage(1)}>1</button>);
                      if (currentPage > 3) pages.push(dots('s'));
                      const s = Math.max(2, currentPage - 1), e = Math.min(totalPages - 1, currentPage + 1);
                      for (let i = s; i <= e; i++) pages.push(<button key={i} style={btnStyle(currentPage === i)} onClick={() => setCurrentPage(i)}>{i}</button>);
                      if (currentPage < totalPages - 2) pages.push(dots('e'));
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

      {selectedCustomer && (
        <div
          className="staff-invoice-modal"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="staff-invoice staff-customer-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="staff-invoice__header">
              <div>
                <h2>{t("customers.modalTitle")}</h2>
                <p>{selectedCustomer.fullName}</p>
              </div>

              <button type="button" onClick={() => setSelectedCustomer(null)}>
                {t("customers.modalClose")}
              </button>
            </div>

            <div className="staff-customer-profile">
              <div className="staff-customer-profile__avatar">
                {selectedCustomer.fullName?.charAt(0).toUpperCase() || "K"}
              </div>

              <div>
                <h3>{selectedCustomer.fullName}</h3>
                <span className={getRankClass(selectedCustomer.rank)}>
                  {getRankTranslation(selectedCustomer.rank)}
                </span>
              </div>
            </div>

            <div className="staff-invoice__body">
              <div>
                <span>{t("customers.phone")}</span>
                <strong>{selectedCustomer.phoneNumber || t("customers.noPhone")}</strong>
              </div>

              <div>
                <span>{t("customers.email")}</span>
                <strong>{selectedCustomer.email || t("customers.noEmail")}</strong>
              </div>

              <div>
                <span>{t("customers.address")}</span>
                <strong>{selectedCustomer.address || t("customers.notUpdated")}</strong>
              </div>

              <div>
                <span>{t("customers.tableOrders")}</span>
                <strong>{selectedCustomer.ordersCount}</strong>
              </div>

              <div>
                <span>{t("customers.tableSpent")}</span>
                <strong>{money(selectedCustomer.totalSpent)}</strong>
              </div>

              <div>
                <span>{t("customers.tableLastOrder")}</span>
                <strong>{formatDate(selectedCustomer.lastOrderDate, dateLocale, t("customers.none"))}</strong>
              </div>

              <div>
                <span>{t("customers.modalCreatedDate")}</span>
                <strong>{formatDate(selectedCustomer.createdAt, dateLocale, t("customers.none"))}</strong>
              </div>
            </div>

            <div className="staff-invoice__actions">
              <button
                type="button"
                className="staff-btn staff-btn--outline"
                onClick={() => {
                  handleEdit(selectedCustomer);
                  setSelectedCustomer(null);
                }}
              >
                {t("customers.updateCustomer")}
              </button>

              <button
                type="button"
                className="staff-btn staff-btn--primary"
                onClick={() => handleSelectForPOS(selectedCustomer)}
              >
                {t("customers.modalSelectForOrder")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default StaffCustomers;