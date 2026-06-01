import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getImageUrl } from "../../utils/bookDisplay";
import "../../styles/staff/StaffProducts.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api"
).replace(/\/$/, "");

const LOW_STOCK_LIMIT = 5;
const FILTER_ALL = "all";

const PRODUCT_STATUS = {
  IN_STOCK: "inStock",
  LOW_STOCK: "lowStock",
  OUT_OF_STOCK: "outOfStock",
};

const PRODUCT_SOURCES = [
  { type: "book", endpoint: "/books" },
  { type: "stationery", endpoint: "/stationery" },
  { type: "toy", endpoint: "/toys" },
  { type: "accessory", endpoint: "/accessories" },
  { type: "schoolSupply", endpoint: "/school-supplies" },
  { type: "souvenir", endpoint: "/souvenirs" },
];

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
  const locale = language?.startsWith("vi") ? "vi-VN" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getProductStatusCode(stock) {
  const quantity = Number(stock || 0);

  if (quantity <= 0) return PRODUCT_STATUS.OUT_OF_STOCK;
  if (quantity <= LOW_STOCK_LIMIT) return PRODUCT_STATUS.LOW_STOCK;

  return PRODUCT_STATUS.IN_STOCK;
}

function getBadgeClass(statusCode) {
  if (statusCode === PRODUCT_STATUS.IN_STOCK) {
    return "staff-badge staff-badge--success";
  }

  if (statusCode === PRODUCT_STATUS.LOW_STOCK) {
    return "staff-badge staff-badge--warning";
  }

  return "staff-badge staff-badge--danger";
}

function normalizeProduct(item, source) {
  const id = pick(item.id, item.Id, item.productId, item.ProductId);

  const name = pick(
    item.title,
    item.Title,
    item.name,
    item.Name,
    item.productName,
    item.ProductName,
    ""
  );

  const authorOrBrand = pick(
    item.author,
    item.Author,
    item.brand,
    item.Brand,
    item.manufacturer,
    item.Manufacturer,
    item.publisher,
    item.Publisher,
    ""
  );

  const category = pick(
    item.categoryName,
    item.CategoryName,
    item.category?.name,
    item.Category?.Name,
    item.bookCategory?.name,
    item.BookCategory?.Name,
    item.type,
    item.Type,
    ""
  );

  const price = Number(
    pick(item.price, item.Price, item.salePrice, item.SalePrice, 0)
  );

  const stock = Number(
    pick(
      item.stock,
      item.Stock,
      item.stockQuantity,
      item.StockQuantity,
      item.quantity,
      item.Quantity,
      0
    )
  );

  const imageUrl = pick(
    item.imageUrl,
    item.ImageUrl,
    item.thumbnail,
    item.Thumbnail,
    item.coverImage,
    item.CoverImage,
    ""
  );

  return {
    id: `${source.type}-${id || Math.random().toString(36).slice(2)}`,
    rawId: id,
    type: source.type,
    name,
    authorOrBrand,
    category,
    price,
    stock,
    statusCode: getProductStatusCode(stock),
    imageUrl,
    raw: item,
  };
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

  if (!text) return [];

  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

function StaffProducts() {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language?.startsWith("en") ? "en" : "vi";

  const money = useCallback(
    (value) => formatCurrency(value, currentLanguage),
    [currentLanguage]
  );

  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const [pageSize, setPageSize] = useState(() =>
    Number(localStorage.getItem("staffPageSize_products") || 10)
  );

  const [currentPage, setCurrentPage] = useState(1);

  const getTypeLabel = useCallback(
    (type) => t(`products.types.${type}`),
    [t]
  );

  const getStatusLabel = useCallback(
    (statusCode) => t(`products.status.${statusCode}`),
    [t]
  );

  const getDisplayName = useCallback(
    (product) => product.name || t("products.defaults.noName"),
    [t]
  );

  const getDisplayAuthorOrBrand = useCallback(
    (product) => product.authorOrBrand || t("products.defaults.unknown"),
    [t]
  );

  const getDisplayCategory = useCallback(
    (product) => product.category || getTypeLabel(product.type),
    [getTypeLabel]
  );

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled(
        PRODUCT_SOURCES.map(async (source) => {
          const payload = await apiRequest(source.endpoint);
          const list = toArray(payload);

          return list.map((item) => normalizeProduct(item, source));
        })
      );

      const successfulProducts = results
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value);

      const failedSources = results
        .map((result, index) =>
          result.status === "rejected"
            ? getTypeLabel(PRODUCT_SOURCES[index].type)
            : null
        )
        .filter(Boolean);

      setProducts(successfulProducts);

      if (failedSources.length > 0) {
        setError(
          t("products.alerts.loadPartialError", {
            sources: failedSources.join(", "),
          })
        );
      }
    } catch (err) {
      setProducts([]);
      setError(t("products.alerts.loadError", { message: err.message }));
    } finally {
      setLoading(false);
    }
  }, [getTypeLabel, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (showReportModal || selectedProduct) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showReportModal, selectedProduct]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, typeFilter, statusFilter, pageSize]);

  const filteredProducts = useMemo(() => {
    const searchValue = keyword.trim().toLowerCase();

    return products.filter((product) => {
      const productName = getDisplayName(product);
      const authorOrBrand = getDisplayAuthorOrBrand(product);
      const category = getDisplayCategory(product);
      const typeLabel = getTypeLabel(product.type);
      const statusLabel = getStatusLabel(product.statusCode);

      const matchKeyword =
        !searchValue ||
        productName.toLowerCase().includes(searchValue) ||
        authorOrBrand.toLowerCase().includes(searchValue) ||
        category.toLowerCase().includes(searchValue) ||
        typeLabel.toLowerCase().includes(searchValue) ||
        statusLabel.toLowerCase().includes(searchValue);

      const matchType =
        typeFilter === FILTER_ALL || product.type === typeFilter;

      const matchStatus =
        statusFilter === FILTER_ALL || product.statusCode === statusFilter;

      return matchKeyword && matchType && matchStatus;
    });
  }, [
    products,
    keyword,
    typeFilter,
    statusFilter,
    getDisplayName,
    getDisplayAuthorOrBrand,
    getDisplayCategory,
    getTypeLabel,
    getStatusLabel,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / pageSize)
  );

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const stats = useMemo(() => {
    const total = products.length;

    const inStock = products.filter(
      (product) => product.statusCode === PRODUCT_STATUS.IN_STOCK
    ).length;

    const lowStock = products.filter(
      (product) => product.statusCode === PRODUCT_STATUS.LOW_STOCK
    ).length;

    const outOfStock = products.filter(
      (product) => product.statusCode === PRODUCT_STATUS.OUT_OF_STOCK
    ).length;

    const totalValue = products.reduce(
      (sum, product) =>
        sum + Number(product.price || 0) * Number(product.stock || 0),
      0
    );

    return {
      total,
      inStock,
      lowStock,
      outOfStock,
      totalValue,
    };
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products
      .filter((product) => product.stock <= LOW_STOCK_LIMIT)
      .sort((a, b) => a.stock - b.stock);
  }, [products]);

  const exportLowStockReport = () => {
    if (lowStockProducts.length === 0) {
      alert(t("products.modal.noItems"));
      return;
    }

    setShowReportModal(true);
  };

  const copyLowStockReport = async () => {
    const content = lowStockProducts
      .map((item, index) => {
        return `${index + 1}. ${getDisplayName(item)} (${getTypeLabel(
          item.type
        )}) - ${t("products.table.stock")}: ${item.stock} - ${t(
          "products.table.status"
        )}: ${getStatusLabel(item.statusCode)}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(content);
      alert(t("products.alerts.copySuccess"));
    } catch {
      alert(t("products.alerts.copyFailed", { defaultValue: "Copy failed." }));
    }
  };

  const renderPaginationButtons = () => {
    const pages = [];

    const addPageButton = (page) => {
      pages.push(
        <button
          key={page}
          type="button"
          className={`staff-products-page-btn ${
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
        <span key={key} className="staff-products-pagination-dots">
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
    <div className="staff-page staff-products-page">
      {error && (
        <div className="staff-alert staff-alert--warning">
          <strong>{t("products.alerts.dataTitle")}</strong>
          <p>{error}</p>
        </div>
      )}

      <div className="staff-grid staff-grid--4 staff-stats-compact">
        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">📦</div>
          <div>
            <p>{t("products.stats.total")}</p>
            <h3>{stats.total}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">✅</div>
          <div>
            <p>{t("products.stats.inStock")}</p>
            <h3>{stats.inStock}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">⚠️</div>
          <div>
            <p>{t("products.stats.lowStock")}</p>
            <h3>{stats.lowStock}</h3>
          </div>
        </div>

        <div className="staff-card staff-stat">
          <div className="staff-stat__icon">💰</div>
          <div>
            <p>{t("products.stats.totalValue")}</p>
            <h3>{money(stats.totalValue)}</h3>
          </div>
        </div>
      </div>

      <div className="staff-card staff-products-card">
        <div className="staff-page__toolbar staff-products-toolbar">
          <input
            className="staff-input staff-products-search"
            placeholder={t("products.toolbar.searchPlaceholder")}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <div className="staff-products-filter-wrap">
            <select
              className={`staff-input staff-products-select ${
                typeFilter !== FILTER_ALL ? "has-clear" : ""
              }`}
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value={FILTER_ALL}>{t("products.toolbar.all")}</option>

              {PRODUCT_SOURCES.map((source) => (
                <option key={source.type} value={source.type}>
                  {getTypeLabel(source.type)}
                </option>
              ))}
            </select>

            {typeFilter !== FILTER_ALL && (
              <button
                type="button"
                className="staff-products-clear-filter"
                onClick={() => {
                  setTypeFilter(FILTER_ALL);
                  setCurrentPage(1);
                }}
                title={t("products.toolbar.clearFilter")}
              >
                ×
              </button>
            )}
          </div>

          <div className="staff-products-filter-wrap">
            <select
              className={`staff-input staff-products-select ${
                statusFilter !== FILTER_ALL ? "has-clear" : ""
              }`}
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value={FILTER_ALL}>{t("products.toolbar.all")}</option>
              <option value={PRODUCT_STATUS.IN_STOCK}>
                {getStatusLabel(PRODUCT_STATUS.IN_STOCK)}
              </option>
              <option value={PRODUCT_STATUS.LOW_STOCK}>
                {getStatusLabel(PRODUCT_STATUS.LOW_STOCK)}
              </option>
              <option value={PRODUCT_STATUS.OUT_OF_STOCK}>
                {getStatusLabel(PRODUCT_STATUS.OUT_OF_STOCK)}
              </option>
            </select>

            {statusFilter !== FILTER_ALL && (
              <button
                type="button"
                className="staff-products-clear-filter"
                onClick={() => {
                  setStatusFilter(FILTER_ALL);
                  setCurrentPage(1);
                }}
                title={t("products.toolbar.clearFilter")}
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            className="staff-btn staff-btn--outline staff-products-refresh-btn"
            onClick={fetchProducts}
            disabled={loading}
          >
            {loading
              ? t("products.toolbar.loading", {
                  defaultValue: t("pos.loading"),
                })
              : t("products.toolbar.refresh")}
          </button>

          <button
            type="button"
            className="staff-btn staff-btn--primary staff-products-report-btn"
            onClick={exportLowStockReport}
          >
            {t("products.toolbar.outOfStockReport")}
          </button>
        </div>

        <div className="staff-table-wrap">
          <table className="staff-table staff-products-table">
            <thead>
              <tr>
                <th className="staff-products-index-head">
                  {t("products.table.no")}
                </th>
                <th>{t("products.table.name")}</th>
                <th>{t("products.table.type")}</th>
                <th>{t("products.table.authorBrand")}</th>
                <th>{t("products.table.category")}</th>
                <th>{t("products.table.price")}</th>
                <th>{t("products.table.stock")}</th>
                <th>{t("products.table.status")}</th>
                <th>{t("products.table.action")}</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="9">
                    <div className="staff-empty">
                      {t("products.alerts.loading")}
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedProducts.map((product, index) => {
                  const productName = getDisplayName(product);

                  return (
                    <tr key={product.id}>
                      <td className="staff-products-index">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      <td>
                        <div className="staff-product-cell">
                          <div className="staff-product-cell__image">
                            {product.imageUrl ? (
                              <img src={getImageUrl(product.imageUrl, product.title || product.name)} alt={productName} />
                            ) : (
                              <span>{productName.charAt(0)}</span>
                            )}
                          </div>

                          <div>
                            <strong>{productName}</strong>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="staff-product-type">
                          {getTypeLabel(product.type)}
                        </span>
                      </td>

                      <td>{getDisplayAuthorOrBrand(product)}</td>

                      <td>{getDisplayCategory(product)}</td>

                      <td>{money(product.price)}</td>

                      <td>{product.stock}</td>

                      <td>
                        <span className={getBadgeClass(product.statusCode)}>
                          {getStatusLabel(product.statusCode)}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="staff-btn staff-btn--small staff-btn--outline staff-products-action-btn"
                          onClick={() => setSelectedProduct(product)}
                        >
                          {t("products.actions.detail")}
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="staff-empty">
                      {t("products.alerts.noFound")}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="staff-products-pagination-footer">
            <div className="staff-products-pagination-bar">
              <div className="staff-products-pagination-info">
                {t("products.pagination.displayRange", {
                  start: Math.min(
                    filteredProducts.length,
                    (currentPage - 1) * pageSize + 1
                  ),
                  end: Math.min(filteredProducts.length, currentPage * pageSize),
                  total: filteredProducts.length,
                })}
              </div>

              <div className="staff-products-pagination-controls">
                <div className="staff-products-page-size">
                  <span className="staff-products-page-size-label">
                    {t("products.pagination.pageSize")}
                  </span>

                  <select
                    className="staff-products-page-size-select"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      localStorage.setItem(
                        "staffPageSize_products",
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

                <div className="staff-products-pagination-list">
                  <button
                    type="button"
                    className={`staff-products-page-btn ${
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
                    className={`staff-products-page-btn ${
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

      {selectedProduct && (
        <div
          className="staff-invoice-modal"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="staff-invoice"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="staff-invoice__header">
              <div>
                <h2>{t("products.modal.detailTitle")}</h2>
                <p>{getTypeLabel(selectedProduct.type)}</p>
              </div>

              <button type="button" onClick={() => setSelectedProduct(null)}>
                ×
              </button>
            </div>

            <div className="staff-product-detail">
              <div className="staff-product-detail__image">
                {selectedProduct.imageUrl ? (
                  <img
                    src={getImageUrl(selectedProduct.imageUrl, selectedProduct.title || selectedProduct.name)}
                    alt={getDisplayName(selectedProduct)}
                  />
                ) : (
                  <span>{getDisplayName(selectedProduct).charAt(0)}</span>
                )}
              </div>

              <div className="staff-invoice__body">
                <div>
                  <span>{t("products.table.name")}</span>
                  <strong>{getDisplayName(selectedProduct)}</strong>
                </div>

                <div>
                  <span>{t("products.modal.id")}</span>
                  <strong>{selectedProduct.rawId || "-"}</strong>
                </div>

                <div>
                  <span>{t("products.table.authorBrand")}</span>
                  <strong>{getDisplayAuthorOrBrand(selectedProduct)}</strong>
                </div>

                <div>
                  <span>{t("products.table.category")}</span>
                  <strong>{getDisplayCategory(selectedProduct)}</strong>
                </div>

                <div>
                  <span>{t("products.table.price")}</span>
                  <strong>{money(selectedProduct.price)}</strong>
                </div>

                <div>
                  <span>{t("products.table.stock")}</span>
                  <strong>{selectedProduct.stock}</strong>
                </div>

                <div>
                  <span>{t("products.table.status")}</span>
                  <strong>{getStatusLabel(selectedProduct.statusCode)}</strong>
                </div>
              </div>
            </div>

            <div className="staff-invoice__actions">
              <button
                type="button"
                className="staff-btn staff-btn--outline"
                onClick={() => setSelectedProduct(null)}
              >
                {t("products.actions.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div
          className="staff-invoice-modal"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="staff-invoice staff-products-report-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="staff-invoice__header">
              <div>
                <h2 className="staff-products-report-title">
                  {t("products.modal.reportTitle")}
                </h2>

                <p className="staff-products-report-subtitle">
                  {t("products.modal.reportSummary", {
                    count: lowStockProducts.length,
                  })}
                </p>
              </div>

              <button
                type="button"
                className="staff-products-report-close"
                onClick={() => setShowReportModal(false)}
              >
                ×
              </button>
            </div>

            <div className="staff-invoice__body staff-products-report-body">
              <table className="staff-table staff-products-report-table">
                <thead>
                  <tr>
                    <th className="staff-products-report-index-head">
                      {t("products.table.no")}
                    </th>
                    <th>{t("products.table.name")}</th>
                    <th>{t("products.table.type")}</th>
                    <th className="staff-products-report-stock-head">
                      {t("products.table.stock")}
                    </th>
                    <th>{t("products.table.status")}</th>
                  </tr>
                </thead>

                <tbody>
                  {lowStockProducts.map((item, index) => (
                    <tr key={item.id}>
                      <td className="staff-products-report-index">
                        {index + 1}
                      </td>

                      <td>
                        <strong className="staff-products-report-product-name">
                          {getDisplayName(item)}
                        </strong>

                        <div className="staff-products-report-product-code">
                          {t("products.modal.id")}: {item.rawId || "-"}
                        </div>
                      </td>

                      <td>{getTypeLabel(item.type)}</td>

                      <td
                        className={`staff-products-report-stock ${
                          item.stock === 0 ? "is-empty" : "is-low"
                        }`}
                      >
                        <strong>{item.stock}</strong>
                      </td>

                      <td>
                        <span className={getBadgeClass(item.statusCode)}>
                          {getStatusLabel(item.statusCode)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="staff-products-report-actions">
              <button
                type="button"
                className="staff-btn staff-btn--outline"
                onClick={() => setShowReportModal(false)}
              >
                {t("products.actions.close")}
              </button>

              <button
                type="button"
                className="staff-btn staff-btn--primary"
                onClick={copyLowStockReport}
              >
                {t("products.actions.copyList")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffProducts;