import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/staff/StaffLoyalty.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api"
).replace(/\/$/, "");

const CUSTOMER_API = "/users";
const ORDER_API = "/orders";

const emptyForm = {
  customerId: "",
  pointsToRedeem: 0,
  reason: "",
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
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return values[values.length - 1];
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.$values)) return value.$values;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.result)) return value.result;
  return [];
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
    throw new Error(text || `Lỗi API ${response.status}`);
  }

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeCustomer(customer) {
  const roleName = String(
    customer.roleName ||
      customer.RoleName ||
      customer.role?.name ||
      customer.Role?.Name ||
      ""
  ).toLowerCase();

  const roleId = Number(
    customer.roleId ||
      customer.RoleId ||
      customer.role?.id ||
      customer.Role?.Id ||
      0
  );

  const rawEmail = pick(customer.email, customer.Email, "");

  return {
    id: pick(
      customer.id,
      customer.Id,
      customer.customerId,
      customer.CustomerId,
      customer.userId,
      customer.UserId
    ),
    fullName: pick(
      customer.fullName,
      customer.FullName,
      customer.name,
      customer.Name,
      customer.customerName,
      customer.CustomerName,
      ""
    ),
    phoneNumber: pick(
      customer.phoneNumber,
      customer.PhoneNumber,
      customer.phone,
      customer.Phone,
      ""
    ),
    email:
      rawEmail && String(rawEmail).includes("@khachhang.local")
        ? ""
        : rawEmail,
    roleName,
    roleId,
  };
}

function normalizeOrder(order) {
  const user = order.user || order.User || order.customer || order.Customer || {};

  return {
    userId: pick(
      order.userId,
      order.UserId,
      order.customerId,
      order.CustomerId,
      user.id,
      user.Id
    ),
    total: Number(
      pick(
        order.totalAmount,
        order.TotalAmount,
        order.total,
        order.Total,
        order.finalAmount,
        order.FinalAmount,
        0
      )
    ),
  };
}

function getCustomerRank(earnedPoints) {
  if (earnedPoints > 1000) return "diamond";
  if (earnedPoints > 500) return "gold";
  if (earnedPoints > 100) return "silver";
  return "bronze";
}

function getRankStyle(rank) {
  if (rank === "diamond") {
    return {
      backgroundColor: "#e0e7ff",
      color: "#4f46e5",
    };
  }

  if (rank === "gold") {
    return {
      backgroundColor: "#fef3c7",
      color: "#d97706",
    };
  }

  if (rank === "silver") {
    return {
      backgroundColor: "#f1f5f9",
      color: "#475569",
    };
  }

  return {
    backgroundColor: "#fffbeb",
    color: "#b45309",
  };
}

function StaffLoyalty() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [rankFilter, setRankFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [pageSize, setPageSize] = useState(() =>
    Number(localStorage.getItem("staffPageSize_loyalty") || 6)
  );

  const [currentPage, setCurrentPage] = useState(1);

  const [redeemHistory, setRedeemHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("staff_loyalty_history") || "[]");
    } catch {
      return [];
    }
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [customerPayload, orderPayload] = await Promise.all([
        apiRequest(CUSTOMER_API),
        apiRequest(ORDER_API),
      ]);

      const onlyCustomers = toArray(customerPayload)
        .map(normalizeCustomer)
        .filter((customer) => {
          const roleName = String(customer.roleName || "").toLowerCase();

          return (
            !roleName.includes("admin") &&
            !roleName.includes("staff") &&
            customer.roleId !== 2 &&
            customer.roleId !== 3
          );
        });

      const normalizedOrders = toArray(orderPayload).map(normalizeOrder);

      setCustomers(onlyCustomers);
      setOrders(normalizedOrders);
    } catch (err) {
      setError(t("loyalty.loadError", { message: err.message }));
      setCustomers([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loyaltyData = useMemo(() => {
    return customers
      .map((customer) => {
        const relatedOrders = orders.filter(
          (order) => String(order.userId) === String(customer.id)
        );

        const totalSpent = relatedOrders.reduce(
          (sum, order) => sum + Number(order.total || 0),
          0
        );

        const earnedPoints = Math.floor(totalSpent / 10000);

        const redeemedPoints = redeemHistory
          .filter((history) => String(history.customerId) === String(customer.id))
          .reduce((sum, history) => sum + Number(history.points || 0), 0);

        return {
          ...customer,
          totalSpent,
          earnedPoints,
          redeemedPoints,
          currentPoints: Math.max(0, earnedPoints - redeemedPoints),
          rank: getCustomerRank(earnedPoints),
        };
      })
      .sort((a, b) => b.currentPoints - a.currentPoints);
  }, [customers, orders, redeemHistory]);

  const filteredData = useMemo(() => {
    const searchValue = keyword.trim().toLowerCase();

    const rankMap = {
      kimcuong: "Kim cương",
      vang: "Vàng",
      bac: "Bạc",
      dong: "Đồng",
    };

    return loyaltyData
      .filter((customer) => {
        return (
          !searchValue ||
          customer.fullName?.toLowerCase().includes(searchValue) ||
          customer.phoneNumber?.toLowerCase().includes(searchValue) ||
          customer.email?.toLowerCase().includes(searchValue)
        );
      })
      .filter((customer) => {
        if (rankFilter === "all") return true;
        return customer.rank === rankMap[rankFilter];
      });
  }, [loyaltyData, keyword, rankFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const totalCurrentPoints = loyaltyData.reduce(
    (sum, customer) => sum + Number(customer.currentPoints || 0),
    0
  );

  const vipCount = loyaltyData.filter(
    (customer) => customer.rank === "gold" || customer.rank === "diamond"
  ).length;

  const redeemedTotal = redeemHistory.reduce(
    (sum, history) => sum + Number(history.points || 0),
    0
  );

  const customerHasPoints = loyaltyData.filter(
    (customer) => customer.currentPoints > 0
  ).length;

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);

    setForm({
      customerId: customer.id,
      pointsToRedeem: 0,
      reason: "",
    });
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setForm(emptyForm);
  };

  const handleRedeem = (event) => {
    event.preventDefault();

    if (!selectedCustomer) {
      alert(t("loyalty.alerts.selectCustomer"));
      return;
    }

    const points = Number(form.pointsToRedeem);

    if (points <= 0) {
      alert(t("loyalty.alerts.invalidPoints"));
      return;
    }

    if (points > selectedCustomer.currentPoints) {
      alert(t("loyalty.alerts.insufficientPoints"));
      return;
    }

    if (!form.reason.trim()) {
      alert(t("loyalty.alerts.enterReason"));
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      const newHistory = [
        {
          id: Date.now(),
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.fullName || t("loyalty.defaultCustomerName"),
          points,
          reason: form.reason,
          date: new Date().toISOString(),
        },
        ...redeemHistory,
      ];

      setRedeemHistory(newHistory);
      localStorage.setItem("staff_loyalty_history", JSON.stringify(newHistory));

      setForm(emptyForm);
      setSelectedCustomer(null);
      setProcessing(false);

      alert(t("loyalty.alerts.redeemSuccess", { points, name: selectedCustomer.fullName || t("loyalty.defaultCustomerName") }));
    }, 500);
  };

  const getPaginationItems = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", currentPage, "...", totalPages];
  };

  const startIndex = (currentPage - 1) * pageSize;

  return (
    <div className="staff-page staff-loyalty-page">
      {error && (
        <div className="staff-alert staff-alert--warning">
          <strong>{t("common.loadErrorTitle") || "Error"}:</strong> {error}
        </div>
      )}

      <div className="staff-grid staff-grid--4 staff-stats-compact staff-loyalty-stats">
        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">⭐</div>
          <div>
            <p>{t("loyalty.stats.totalPoints")}</p>
            <h3>{totalCurrentPoints.toLocaleString("vi-VN")}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">🏆</div>
          <div>
            <p>{t("loyalty.stats.vipMembers")}</p>
            <h3>{vipCount}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">🎁</div>
          <div>
            <p>{t("loyalty.stats.pointsRedeemed")}</p>
            <h3>{redeemedTotal.toLocaleString("vi-VN")}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">👥</div>
          <div>
            <p>{t("loyalty.stats.membersWithPoints")}</p>
            <h3>{customerHasPoints}</h3>
          </div>
        </div>
      </div>

      <div
        className="staff-grid staff-grid--2"
        style={{
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
          alignItems: "start",
        }}
      >
        <div className="staff-card">
          <div className="staff-card__header">
            <div>
              <h2>{t("loyalty.redeemForm.title")}</h2>
              <p>{t("loyalty.redeemForm.desc")}</p>
            </div>
          </div>

          <form
            onSubmit={handleRedeem}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px dashed #cbd5e1",
              }}
            >
              {selectedCustomer ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>
                      {selectedCustomer.fullName || t("loyalty.defaultCustomerName")}
                    </strong>

                    <button
                      type="button"
                      onClick={handleClearCustomer}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      {t("loyalty.redeemForm.cancel")}
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      fontSize: "14px",
                      color: "#475569",
                    }}
                  >
                    <p>
                      {t("loyalty.redeemForm.phone")}{" "}
                      <strong>{selectedCustomer.phoneNumber || t("loyalty.redeemForm.noPhone")}</strong>
                    </p>
                    <p>
                      {t("loyalty.redeemForm.rank")}{" "}
                      <strong style={{ color: "#f59e0b" }}>
                        {t(`loyalty.ranks.${selectedCustomer.rank}`)}
                      </strong>
                    </p>
                    <p>
                      {t("loyalty.redeemForm.currentPoints")}{" "}
                      <strong style={{ fontSize: "18px", color: "#10b981" }}>
                        {selectedCustomer.currentPoints.toLocaleString("vi-VN")}
                      </strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "14px",
                    padding: "12px 0",
                  }}
                >
                  {t("loyalty.redeemForm.placeholder")}
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: "6px",
                }}
              >
                {t("loyalty.redeemForm.pointsLabel")}
              </label>

              <input
                type="number"
                className="staff-input"
                placeholder="VD: 50"
                value={form.pointsToRedeem}
                onChange={(event) =>
                  setForm({ ...form, pointsToRedeem: event.target.value })
                }
                disabled={!selectedCustomer}
                min="1"
                max={selectedCustomer ? selectedCustomer.currentPoints : 0}
              />

              {selectedCustomer && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginTop: "4px",
                  }}
                >
                  {t("loyalty.redeemForm.equivalent")}{" "}
                  <strong style={{ color: "#ef4444" }}>
                    {(Number(form.pointsToRedeem) * 1000).toLocaleString("vi-VN")} đ
                  </strong>{" "}
                  {t("loyalty.redeemForm.rateTip")}
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: "6px",
                }}
              >
                {t("loyalty.redeemForm.reasonLabel")}
              </label>

              <textarea
                className="staff-input"
                placeholder="VD: Đổi quà tặng sinh nhật, giảm giá hóa đơn..."
                rows="3"
                value={form.reason}
                onChange={(event) =>
                  setForm({ ...form, reason: event.target.value })
                }
                disabled={!selectedCustomer}
              />
            </div>

            <button
              type="submit"
              className="staff-btn staff-btn--primary"
              disabled={!selectedCustomer || processing}
              style={{ marginTop: "8px" }}
            >
              {processing ? t("loyalty.redeemForm.processing") : t("loyalty.redeemForm.submit")}
            </button>
          </form>
        </div>

        <div
          className="staff-card"
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "32px",
            borderRadius: "22px",
          }}
        >
          <div
            className="staff-card__header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 900 }}>
              {t("loyalty.lookup.title")}
            </h2>

            <button
              className="staff-btn staff-btn--outline"
              type="button"
              onClick={fetchData}
              disabled={loading}
              style={{
                height: "46px",
                padding: "0 24px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {loading ? t("loyalty.lookup.loading") : t("loyalty.lookup.refresh")}
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 190px",
              gap: "16px",
              alignItems: "center",
              width: "100%",
              marginBottom: "30px",
            }}
          >
            <div style={{ position: "relative", width: "100%" }}>
              <span
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "16px",
                  color: "#94a3b8",
                  pointerEvents: "none",
                }}
              >
                🔍
              </span>

              <input
                type="text"
                className="staff-input"
                placeholder={t("loyalty.lookup.searchPlaceholder")}
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  height: "52px",
                  paddingLeft: "48px",
                  paddingRight: "40px",
                  boxSizing: "border-box",
                }}
              />

              {keyword && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword("");
                    setCurrentPage(1);
                  }}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "26px",
                    height: "26px",
                    border: "none",
                    borderRadius: "50%",
                    background: "transparent",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "18px",
                    fontWeight: 800,
                  }}
                >
                  ×
                </button>
              )}
            </div>

            <div style={{ position: "relative", width: "100%" }}>
              <select
                className="staff-input"
                value={rankFilter}
                onChange={(event) => {
                  setRankFilter(event.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  height: "52px",
                  paddingLeft: "16px",
                  paddingRight: "40px",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              >
                <option value="all">{t("loyalty.lookup.rankPlaceholder")}</option>
                <option value="kimcuong">{t("loyalty.ranks.diamond")}</option>
                <option value="vang">{t("loyalty.ranks.gold")}</option>
                <option value="bac">{t("loyalty.ranks.silver")}</option>
                <option value="dong">{t("loyalty.ranks.bronze")}</option>
              </select>

              {rankFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => {
                    setRankFilter("all");
                    setCurrentPage(1);
                  }}
                  style={{
                    position: "absolute",
                    right: "32px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "28px",
                    height: "28px",
                    border: "none",
                    borderRadius: "50%",
                    background: "transparent",
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    zIndex: 2,
                    transition: "all 0.2s ease",
                  }}
                  title={t("loyalty.lookup.clearRankTip")}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="staff-table-wrap" style={{ width: "100%" }}>
            <table className="staff-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "60px", textAlign: "center" }}>{t("loyalty.table.no")}</th>
                  <th>{t("loyalty.table.customer")}</th>
                  <th style={{ textAlign: "center" }}>{t("loyalty.table.rank")}</th>
                  <th style={{ textAlign: "right" }}>{t("loyalty.table.spent")}</th>
                  <th style={{ textAlign: "center" }}>{t("loyalty.table.points")}</th>
                  <th style={{ width: "130px", textAlign: "center" }}>
                    {t("loyalty.table.action")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6">
                      <div className="staff-empty">{t("loyalty.table.loadingData")}</div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  paginatedData.map((customer, index) => (
                    <tr
                      key={customer.id}
                      style={{
                        backgroundColor:
                          selectedCustomer?.id === customer.id
                            ? "#f0fdf4"
                            : "transparent",
                      }}
                    >
                      <td
                        style={{
                          textAlign: "center",
                          color: "#0f172a",
                          fontSize: "15px",
                        }}
                      >
                        {startIndex + index + 1}
                      </td>

                      <td>
                        <div style={{ fontWeight: 500, color: "#0f172a" }}>
                          {customer.fullName || t("loyalty.defaultCustomerName")}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>
                          {customer.phoneNumber || t("loyalty.redeemForm.noPhone")}
                        </div>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span
                          className="staff-badge"
                          style={getRankStyle(customer.rank)}
                        >
                          {t(`loyalty.ranks.${customer.rank}`)}
                        </span>
                      </td>

                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#334155",
                        }}
                      >
                        {customer.totalSpent.toLocaleString("vi-VN")} đ
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "20px",
                            fontWeight: 900,
                            color: "#10b981",
                          }}
                        >
                          {customer.currentPoints.toLocaleString("vi-VN")}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <button
                          className="staff-btn staff-btn--outline staff-btn--small"
                          type="button"
                          onClick={() => handleSelectCustomer(customer)}
                          disabled={customer.currentPoints <= 0}
                        >
                          {t("loyalty.table.selectRedeem")}
                        </button>
                      </td>
                    </tr>
                  ))}

                {!loading && filteredData.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="staff-empty">
                        {t("loyalty.table.noCustomers")}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredData.length > 0 && (
            <div
              style={{
                marginTop: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ fontSize: "14px", color: "#1e293b", fontWeight: 700 }}>
                  {t("loyalty.pagination.displayRange", {
                    start: Math.min(filteredData.length, startIndex + 1),
                    end: Math.min(filteredData.length, currentPage * pageSize),
                    total: filteredData.length,
                  })}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#0f172a", fontWeight: 700, letterSpacing: "0.5px" }}>
                      {t("loyalty.pagination.pageSize")}
                    </span>

                    <select
                      value={pageSize}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setPageSize(value);
                        localStorage.setItem("staffPageSize_loyalty", value);
                        setCurrentPage(1);
                      }}
                      style={{
                        width: "75px",
                        height: "34px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        background: "#ffffff",
                        padding: "0 8px",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#0f172a",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value={6}>6</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      style={{
                        width: "34px",
                        height: "34px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#f8fafc",
                        color: currentPage === 1 ? "#cbd5e1" : "#475569",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>

                    {(() => {
                      const pages = [];
                      const btnStyle = (active) => ({
                        width: "34px",
                        height: "34px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: active ? "#6366f1" : "#f8fafc",
                        color: active ? "#fff" : "#475569",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: active ? "0 10px 22px rgba(99, 102, 241, 0.28)" : "none",
                      });
                      const dots = (k) => (
                        <span
                          key={k}
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            paddingBottom: "5px",
                            color: "#94a3b8",
                            fontWeight: 800,
                            letterSpacing: "2px",
                          }}
                        >
                          ...
                        </span>
                      );

                      if (totalPages <= 5) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(
                            <button key={i} style={btnStyle(currentPage === i)} onClick={() => setCurrentPage(i)}>
                              {i}
                            </button>
                          );
                        }
                      } else {
                        pages.push(
                          <button key={1} style={btnStyle(currentPage === 1)} onClick={() => setCurrentPage(1)}>
                            1
                          </button>
                        );
                        if (currentPage > 3) pages.push(dots("s"));
                        const s = Math.max(2, currentPage - 1),
                          e = Math.min(totalPages - 1, currentPage + 1);
                        for (let i = s; i <= e; i++) {
                          pages.push(
                            <button key={i} style={btnStyle(currentPage === i)} onClick={() => setCurrentPage(i)}>
                              {i}
                            </button>
                          );
                        }
                        if (currentPage < totalPages - 2) pages.push(dots("e"));
                        pages.push(
                          <button
                            key={totalPages}
                            style={btnStyle(currentPage === totalPages)}
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </button>
                        );
                      }
                      return pages;
                    })()}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        width: "34px",
                        height: "34px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#f8fafc",
                        color: currentPage === totalPages ? "#cbd5e1" : "#475569",
                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default StaffLoyalty;