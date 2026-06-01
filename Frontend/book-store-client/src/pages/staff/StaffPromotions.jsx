import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/staff/StaffPromotions.css";

const API_BASE_URL = ( import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api" ).replace(/\/$/, "");

const PROMOTION_API = "/promotions";
const FILTER_STATUS = {
  ALL: "all",
  ONGOING: "ongoing",
  UPCOMING: "upcoming",
  ENDING_SOON: "endingSoon",
  EXPIRED: "expired",
};

const ENDING_SOON_DAYS = 7;

function createDefaultForm() {
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    code: "",
    name: "",
    discountPercent: 10,
    startDate: today.toISOString().split("T")[0],
    endDate: nextMonth.toISOString().split("T")[0],
    description: "",
    isActive: true,
  };
}

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

function formatDate(value, locale = "vi-VN", fallback = "—") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(locale);
}
function normalizeDateOnly(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const dateOnly = value.split("T")[0];
    const [year, month, day] = dateOnly.split("-").map(Number);

    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getTodayDateOnly() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function getPromotionRuntimeStatus(promo) {
  const today = getTodayDateOnly();
  const startDate = normalizeDateOnly(promo.startDate);
  const endDate = normalizeDateOnly(promo.endDate);

  if (startDate && today < startDate) {
    return {
      value: FILTER_STATUS.UPCOMING,
      labelKey: "promotions.status.upcoming",
      className: "staff-promotion-status-badge--upcoming",
    };
  }

  if (endDate && today > endDate) {
    return {
      value: FILTER_STATUS.EXPIRED,
      labelKey: "promotions.status.expired",
      className: "staff-promotion-status-badge--expired",
    };
  }

  if (endDate) {
    const diffDays = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays >= 1 && diffDays <= ENDING_SOON_DAYS) {
      return {
        value: FILTER_STATUS.ENDING_SOON,
        labelKey: "promotions.status.endingSoon",
        className: "staff-promotion-status-badge--ending-soon",
      };
    }
  }
  return {
    value: FILTER_STATUS.ONGOING,
    labelKey: "promotions.status.ongoing",
    className: "staff-promotion-status-badge--ongoing",
  };
}
function normalizePromotion(promo) {
  return {
    id: promo.id || promo.Id || promo.promotionId || promo.PromotionId,
    code: promo.code || promo.Code || "",
    name: promo.name || promo.Name || "",
    discountPercent: Number(
      promo.discountPercent || promo.DiscountPercent || promo.discount || 0
    ),
    startDate: promo.startDate || promo.StartDate || "",
    endDate: promo.endDate || promo.EndDate || "",
    description: promo.description || promo.Description || "",
    isActive: Boolean(
      promo.isActive !== undefined ? promo.isActive : promo.IsActive
    ),
    raw: promo,
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

function StaffPromotions() {
  const { t, i18n } = useTranslation();

  const dateLocale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";

  const [promotions, setPromotions] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState(FILTER_STATUS.ALL);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => createDefaultForm());
  const [editingPromo, setEditingPromo] = useState(null);

  const [pageSize, setPageSize] = useState(() =>
    Number(localStorage.getItem("staffPageSize_promotions") || 10)
  );

  const [currentPage, setCurrentPage] = useState(1);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const payload = await apiRequest(PROMOTION_API);
      const data = toArray(payload).map(normalizePromotion);

      setPromotions(data);
    } catch (err) {
      setError(t("promotions.alerts.loadError", { message: err.message }));
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, pageSize]);

  const filteredPromotions = useMemo(() => {
  const searchValue = keyword.trim().toLowerCase();

  return promotions.filter((promo) => {
    const matchSearch =
      !searchValue ||
      promo.name.toLowerCase().includes(searchValue) ||
      promo.code.toLowerCase().includes(searchValue);

    const runtimeStatus = getPromotionRuntimeStatus(promo);

    const matchStatus =
      statusFilter === FILTER_STATUS.ALL || runtimeStatus.value === statusFilter;

    return matchSearch && matchStatus;
  });
}, [promotions, keyword, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPromotions.length / pageSize)
  );

  const paginatedPromotions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredPromotions.slice(start, start + pageSize);
  }, [filteredPromotions, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const resetForm = () => {
    setForm(createDefaultForm());
    setEditingPromo(null);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const discountPercent = Number(form.discountPercent);

    if (!form.code.trim()) {
      alert(t("promotions.alerts.requiredCode"));
      return false;
    }

    if (!form.name.trim()) {
      alert(t("promotions.alerts.requiredName"));
      return false;
    }

    if (discountPercent <= 0 || discountPercent > 100) {
      alert(t("promotions.alerts.invalidDiscount"));
      return false;
    }

    if (new Date(form.startDate) > new Date(form.endDate)) {
      alert(t("promotions.alerts.invalidDateRange"));
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim(),
        discountPercent: Number(form.discountPercent),
      };

      if (editingPromo) {
        await apiRequest(`${PROMOTION_API}/${editingPromo.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest(PROMOTION_API, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      alert(
        editingPromo
          ? t("promotions.alerts.updateSuccess")
          : t("promotions.alerts.createSuccess")
      );

      resetForm();
      await fetchPromotions();
    } catch (err) {
      alert(t("promotions.alerts.saveFailed", { message: err.message }));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);

    setForm({
      code: promo.code || "",
      name: promo.name || "",
      discountPercent: promo.discountPercent || 10,
      startDate: promo.startDate ? promo.startDate.split("T")[0] : "",
      endDate: promo.endDate ? promo.endDate.split("T")[0] : "",
      description: promo.description || "",
      isActive: Boolean(promo.isActive),
    });
  };

  const renderPaginationButtons = () => {
    const pages = [];

    const addPageButton = (page) => {
      pages.push(
        <button
          key={page}
          type="button"
          className={`staff-promotion-page-btn ${
            currentPage === page ? "active" : ""
          }`}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </button>
      );
    };

    const addDots = (key) => {
      pages.push(
        <span key={key} className="staff-promotion-page-dots">
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

  return (
    <div className="staff-page staff-promotions-page">
      {error && (
        <div className="staff-promotion-error">
          <strong>{t("promotions.alerts.loadErrorTitle")}</strong>
          <span> {error}</span>
        </div>
      )}

      <div className="staff-grid staff-grid--2">
        <div className="staff-card">
          <div className="staff-card__header">
            <div>
              <h2>
                {editingPromo
                  ? t("promotions.form.editTitle")
                  : t("promotions.form.addTitle")}
              </h2>
              <p>{t("promotions.form.description")}</p>
            </div>
          </div>

          <form className="staff-promotion-form" onSubmit={handleSubmit}>
            <div className="staff-promotion-form-group">
              <label className="staff-promotion-label">
                {t("promotions.form.code")}
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                className="staff-input staff-promotion-code-input"
                placeholder={t("promotions.form.codePlaceholder")}
              />
            </div>

            <div className="staff-promotion-form-group">
              <label className="staff-promotion-label">
                {t("promotions.form.name")}
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="staff-input"
                placeholder={t("promotions.form.namePlaceholder")}
              />
            </div>

            <div className="staff-promotion-form-group">
              <label className="staff-promotion-label">
                {t("promotions.form.discountPercent")}
              </label>
              <input
                type="number"
                name="discountPercent"
                value={form.discountPercent}
                onChange={handleChange}
                className="staff-input"
                min="1"
                max="100"
              />
            </div>

            <div className="staff-promotion-date-row">
              <div className="staff-promotion-form-group">
                <label className="staff-promotion-label">
                  {t("promotions.form.startDate")}
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="staff-input"
                />
              </div>

              <div className="staff-promotion-form-group">
                <label className="staff-promotion-label">
                  {t("promotions.form.endDate")}
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="staff-input"
                />
              </div>
            </div>

            <div className="staff-promotion-form-group">
              <label className="staff-promotion-label">
                {t("promotions.form.descriptionLabel")}
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="staff-input"
                placeholder={t("promotions.form.descriptionPlaceholder")}
                rows="3"
              />
            </div>

            <label className="staff-promotion-checkbox">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              <span>{t("promotions.form.active")}</span>
            </label>

            <div className="staff-promotion-form-actions">
              <button
                type="submit"
                className="staff-btn staff-btn--primary staff-promotion-submit-btn"
                disabled={saving}
              >
                {saving
                  ? t("promotions.form.processing")
                  : editingPromo
                    ? t("promotions.form.updateButton")
                    : t("promotions.form.createButton")}
              </button>

              {editingPromo && (
                <button
                  type="button"
                  className="staff-btn staff-btn--outline"
                  onClick={resetForm}
                >
                  {t("promotions.form.cancel")}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="staff-card staff-promotion-list-card">
          <div className="staff-card__header">
            <h2>{t("promotions.list.title")}</h2>
          </div>

          <div className="staff-promotion-toolbar">
            <div className="staff-promotion-search">
              <span className="staff-promotion-search__icon">🔍</span>
              <input
                type="text"
                className="staff-input staff-promotion-search__input"
                placeholder={t("promotions.list.searchPlaceholder")}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>

            <div style={{ position: "relative", display: "inline-block" }}>
              <select
                className="staff-input staff-promotion-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={{ paddingRight: "48px" }}>
                <option value={FILTER_STATUS.ALL}>
                  {t("promotions.status.all")}
                </option>
                <option value={FILTER_STATUS.ONGOING}>
                  {t("promotions.status.ongoing")}
                </option>
                <option value={FILTER_STATUS.UPCOMING}>
                  {t("promotions.status.upcoming")}
                </option>
                <option value={FILTER_STATUS.ENDING_SOON}>
                  {t("promotions.status.endingSoon")}
                </option>
                <option value={FILTER_STATUS.EXPIRED}>
                  {t("promotions.status.expired")}
                </option>
<option value={FILTER_STATUS.UPCOMING}>
  {t("promotions.status.upcoming")}
</option>
<option value={FILTER_STATUS.ENDING_SOON}>
  {t("promotions.status.endingSoon")}
</option>
<option value={FILTER_STATUS.EXPIRED}>
  {t("promotions.status.expired")}
</option>
              </select>

              {statusFilter !== FILTER_STATUS.ALL && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(FILTER_STATUS.ALL)}
                  aria-label={t("promotions.list.clearStatusFilter")}
                  title={t("promotions.list.clearStatusFilter")}
                  style={{
                    position: "absolute",
                    right: 36,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 16,
                    color: "#64748b",
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="button"
              className="staff-btn staff-btn--outline staff-promotion-refresh"
              onClick={fetchPromotions}
              disabled={loading}
            >
              {loading
                ? t("promotions.list.loadingShort")
                : t("promotions.list.refresh")}
            </button>
          </div>

          <div className="staff-table-wrap">
            <table className="staff-table">
              <thead>
                <tr>
                  <th className="staff-promotion-col-index">
                    {t("promotions.table.no")}
                  </th>
                  <th>{t("promotions.table.program")}</th>
                  <th className="staff-promotion-col-discount">
                    {t("promotions.table.discount")}
                  </th>
                  <th>{t("promotions.table.period")}</th>
                  <th className="staff-promotion-col-status">
                    {t("promotions.table.status")}
                  </th>
                  <th className="staff-promotion-col-action">
                    {t("promotions.table.actions")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6">
                      <div className="staff-empty">
                        {t("promotions.table.loading")}
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
  paginatedPromotions.map((promo, index) => {
    const runtimeStatus = getPromotionRuntimeStatus(promo);

    return (
      <tr key={promo.id || promo.code}>
        <td className="staff-promotion-index">
          {(currentPage - 1) * pageSize + index + 1}
        </td>

        <td>
          <div className="staff-promotion-name">
            {promo.name || t("promotions.defaults.noName")}
          </div>
          <div className="staff-promotion-code">
            {t("promotions.table.code")}:{" "}
            {promo.code || t("promotions.defaults.noCode")}
          </div>
        </td>

        <td className="staff-promotion-col-discount">
          <span className="staff-promotion-discount">
            -{promo.discountPercent}%
          </span>
        </td>

        <td>
          <div className="staff-promotion-date">
            {t("promotions.table.from")}:{" "}
            <strong>
              {formatDate(
                promo.startDate,
                dateLocale,
                t("promotions.defaults.noDate")
              )}
            </strong>
          </div>

          <div className="staff-promotion-date">
            {t("promotions.table.to")}:{" "}
            <strong>
              {formatDate(
                promo.endDate,
                dateLocale,
                t("promotions.defaults.noDate")
              )}
            </strong>
          </div>
        </td>

        <td className="staff-promotion-col-status">
          <span
            className={`staff-promotion-status-badge ${runtimeStatus.className}`}
          >
            {t(runtimeStatus.labelKey)}
          </span>
        </td>

        <td className="staff-promotion-col-action">
          <div className="staff-actions staff-actions--right">
            <button
              type="button"
              className="staff-btn staff-btn--outline staff-btn--small"
              onClick={() => handleEdit(promo)}
            >
              {t("promotions.table.edit")}
            </button>
          </div>
        </td>
      </tr>
    );
  })}

                {!loading && filteredPromotions.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="staff-empty">
                        {t("promotions.table.empty")}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="staff-promotion-pagination">
              <div className="staff-promotion-pagination-inner">
                <div className="staff-promotion-pagination-info">
                  {t("promotions.pagination.displayRange", {
                    start: Math.min(
                      filteredPromotions.length,
                      (currentPage - 1) * pageSize + 1
                    ),
                    end: Math.min(
                      filteredPromotions.length,
                      currentPage * pageSize
                    ),
                    total: filteredPromotions.length,
                  })}
                </div>

                <div className="staff-promotion-pagination-actions">
                  <div className="staff-promotion-page-size">
                    <span>{t("promotions.pagination.pageSize")}</span>

                    <select
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        localStorage.setItem(
                          "staffPageSize_promotions",
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

                  <div className="staff-promotion-page-list">
                    <button
                      type="button"
                      className="staff-promotion-page-btn"
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
                      className="staff-promotion-page-btn"
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalPages, page + 1)
                        )
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
      </div>
    </div>
  );
}
export default StaffPromotions;