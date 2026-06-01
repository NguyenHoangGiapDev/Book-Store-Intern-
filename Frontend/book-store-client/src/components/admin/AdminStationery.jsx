import React, { useEffect, useMemo, useState } from "react";
import "../../styles/admin/AdminStationery.css";


import { apiRequest } from "../../services/apiClient";
import { formatBookPrice, getImageUrl, FALLBACK_BOOK_IMAGE } from "../../utils/bookDisplay";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";



const DEFAULT_ITEM = {
  title: "",
  brand: "",
  manufacturer: "",
  description: "",
  imageUrl: "",
  price: "",
  stockQuantity: "",
  status: "Available",
  categoryId: "",
};

const EMPTY_SALES_SUMMARY = {
  soldToday: 0,
  soldThisMonth: 0,
  soldThisQuarter: 0,
  soldThisYear: 0,
  totalSold: 0,
  totalRevenue: 0,
  totalOrders: 0,
  totalBuyers: 0,
  onlineOrders: 0,
  offlineOrders: 0,
  topCustomers: [],
  recentPurchases: [],
};

const normalizeImageUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) {
    return raw;
  }
  return null;
};

const getValue = (item, camelKey, pascalKey, fallback = "") => {
  return item?.[camelKey] ?? item?.[pascalKey] ?? fallback;
};

const normalizeCategory = (category) => {
  const id = category?.id ?? category?.Id;
  const name = category?.name ?? category?.Name;

  if (id == null || !name) return null;

  return {
    ...category,
    id: Number(id),
    name,
    type: category?.type ?? category?.Type,
  };
};

const getStockStatus = (stockQuantity) => {
  if (stockQuantity === 0) {
    return {
      text: "HẾT HÀNG",
      className: "out",
      stockClassName: "stock-text-danger",
    };
  }

  if (stockQuantity <= 10) {
    return {
      text: "SẮP HẾT HÀNG",
      className: "low",
      stockClassName: "stock-text-warning",
    };
  }

  return {
    text: "SẴN HÀNG",
    className: "available",
    stockClassName: "stock-text-success",
  };
};

function AdminStationery({
  items = [],
  categories = [],
  brands = [],
  manufacturers = [],
  refresh,

  productType = "stationery",
  apiEndpoint = "/stationery",
  pageTitle = "QUẢN LÝ VĂN PHÒNG PHẨM",
  addButtonText = "Thêm mới",
  totalLabel = "Tổng văn phòng phẩm",
  searchPlaceholder = "Tìm theo tên, thương hiệu văn phòng phẩm...",
  categoryWarning = "Cảnh báo: Chưa có danh mục văn phòng phẩm.",
  emptyText = "Không tìm thấy sản phẩm nào",

  editModalTitle = "Cập nhật",
  addModalTitle = "Thêm mới",
  deleteTitle = "Xóa",
  detailModalTitle = "Xem chi tiết",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [salesSummary, setSalesSummary] = useState(null);
  const [loadingSalesSummary, setLoadingSalesSummary] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    item: null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_stationery");
    return saved ? Number(saved) : 6;
  });

  const normalizedBrands = useMemo(() => {
    return (brands || [])
      .map((brand) => ({
        id: brand.id ?? brand.Id,
        name: brand.name ?? brand.Name,
        description: brand.description ?? brand.Description,
      }))
      .filter((brand) => brand.id && brand.name);
  }, [brands]);

  const normalizedManufacturers = useMemo(() => {
  return (manufacturers || [])
    .map((manufacturer) => ({
      id: manufacturer.id ?? manufacturer.Id,
      name: manufacturer.name ?? manufacturer.Name,
      description: manufacturer.description ?? manufacturer.Description,
      address: manufacturer.address ?? manufacturer.Address,
      phone: manufacturer.phone ?? manufacturer.Phone,
      email: manufacturer.email ?? manufacturer.Email,
    }))
    .filter((manufacturer) => manufacturer.id && manufacturer.name);
}, [manufacturers]);

  const normalizedCategories = useMemo(() => {
    return (categories || []).map(normalizeCategory).filter(Boolean);
  }, [categories]);

  const firstCategoryId = normalizedCategories[0]?.id ?? "";

  const getDisplayCategoryName = (item) => {
    const categoryId = Number(getValue(item, "categoryId", "CategoryId", 0));

    const matchedCategory = normalizedCategories.find(
      (category) => Number(category.id) === categoryId
    );

    return (
      matchedCategory?.name ||
      item?.categoryName ||
      item?.CategoryName ||
      "Chưa phân loại"
    );
  };

  const getValidCategoryId = (item) => {
    const categoryId = Number(getValue(item, "categoryId", "CategoryId", 0));

    const exists = normalizedCategories.some(
      (category) => Number(category.id) === categoryId
    );

    return exists ? categoryId : firstCategoryId;
  };

  const stationeryItemsOnly = useMemo(() => {
  return items || [];
}, [items]);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return stationeryItemsOnly.filter((item) => {
      const title = String(getValue(item, "title", "Title", "")).toLowerCase();
      const brand = String(getValue(item, "brand", "Brand", "")).toLowerCase();
      const description = String(
        getValue(item, "description", "Description", "")
      ).toLowerCase();
      const categoryName = String(getDisplayCategoryName(item)).toLowerCase();

      const matchesSearch =
        !keyword ||
        title.includes(keyword) ||
        brand.includes(keyword) ||
        description.includes(keyword) ||
        categoryName.includes(keyword);

      const matchesCategory =
        filterCategory === "all" ||
        Number(getValue(item, "categoryId", "CategoryId", 0)) ===
          Number(filterCategory);

      return matchesSearch && matchesCategory;
    });
  }, [stationeryItemsOnly, searchTerm, filterCategory, normalizedCategories]);

  const stats = useMemo(() => {
    const total = stationeryItemsOnly.length;

    const outOfStock = stationeryItemsOnly.filter((item) => {
      const stock = Number(getValue(item, "stockQuantity", "StockQuantity", 0));
      return stock === 0;
    }).length;

    const lowStock = stationeryItemsOnly.filter((item) => {
      const stock = Number(getValue(item, "stockQuantity", "StockQuantity", 0));
      return stock > 0 && stock <= 10;
    }).length;

    const totalValue = stationeryItemsOnly.reduce((sum, item) => {
      const price = Number(getValue(item, "price", "Price", 0));
      const stock = Number(getValue(item, "stockQuantity", "StockQuantity", 0));
      return sum + price * stock;
    }, 0);

    return {
      total,
      outOfStock,
      lowStock,
      totalValue,
    };
  }, [stationeryItemsOnly]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);

  const openAddModal = () => {
  setEditingItem({
    ...DEFAULT_ITEM,
    categoryId: "",
  });
  setShowEditModal(true);
};

  const openEditModal = (item) => {
    setEditingItem({
      id: item.id ?? item.Id,
      title: getValue(item, "title", "Title", ""),
      brand: getValue(item, "brand", "Brand", ""),
      manufacturer: getValue(item, "manufacturer", "Manufacturer", ""),
      description: getValue(item, "description", "Description", ""),
      imageUrl: getValue(item, "imageUrl", "ImageUrl", ""),
      price: getValue(item, "price", "Price", ""),
      stockQuantity: getValue(item, "stockQuantity", "StockQuantity", ""),
      status: getValue(item, "status", "Status", "Available"),
      categoryId: getValidCategoryId(item),
    });

    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingItem(null);
  };

  const openDetailModal = async (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
    setSalesSummary(EMPTY_SALES_SUMMARY);

    const itemId = getValue(item, "id", "Id", null);

    if (!itemId) return;

    try {
      setLoadingSalesSummary(true);

      const data = await apiRequest(`${apiEndpoint}/${itemId}/sales-summary`);

      setSalesSummary({
        ...EMPTY_SALES_SUMMARY,
        ...(data || {}),
        topCustomers: Array.isArray(data?.topCustomers)
          ? data.topCustomers
          : [],
        recentPurchases: Array.isArray(data?.recentPurchases)
          ? data.recentPurchases
          : [],
      });
    } catch (error) {
      console.error("Fetch stationery sales summary error:", error);
      setSalesSummary(EMPTY_SALES_SUMMARY);
    } finally {
      setLoadingSalesSummary(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
    setSalesSummary(null);
    setLoadingSalesSummary(false);
  };

  const openDeleteConfirm = (item) => {
    setConfirmDelete({
      show: true,
      item,
    });
  };

  const closeDeleteConfirm = () => {
    setConfirmDelete({
      show: false,
      item: null,
    });
  };

  const buildPayload = (formData) => {
    const itemData = Object.fromEntries(formData.entries());

    const price = Number(itemData.price);
    const stockQuantity = Number.parseInt(itemData.stockQuantity, 10);
    const categoryId = Number.parseInt(itemData.categoryId, 10);

    if (
      Number.isNaN(price) ||
      Number.isNaN(stockQuantity) ||
      Number.isNaN(categoryId) ||
      categoryId <= 0
    ) {
      throw new Error("Vui lòng kiểm tra lại Giá, Tồn kho và Danh mục.");
    }

    if (price <= 0) {
      throw new Error("Giá bán phải lớn hơn 0.");
    }

    if (stockQuantity < 0) {
      throw new Error("Tồn kho không được nhỏ hơn 0.");
    }

    const selectedCategory = normalizedCategories.find(
      (category) => Number(category.id) === categoryId
    );

    if (!selectedCategory) {
      throw new Error("Danh mục không hợp lệ. Vui lòng chọn lại danh mục.");
    }

    return {
      Title: itemData.title?.trim() || "Sản phẩm mới",
      Brand: itemData.brand?.trim() || "Book-Store",
      Type: productType,
      Manufacturer: itemData.manufacturer?.trim() || null,
      Description: itemData.description?.trim() || null,
      ImageUrl: normalizeImageUrl(itemData.imageUrl),
      Price: price,
      StockQuantity: stockQuantity,
      CategoryId: categoryId,
      Status: itemData.status?.trim() || "Available",
    };
  };

  const handleSave = async (event) => {
    event.preventDefault();

    let payload;

    try {
      payload = buildPayload(new FormData(event.currentTarget));
    } catch (err) {
      showToast(err.message, "error");
      return;
    }

    try {
      const isUpdate = Boolean(editingItem?.id);
      const url = isUpdate ? `${apiEndpoint}/${editingItem.id}` : apiEndpoint;
const method = isUpdate ? "PUT" : "POST";

console.log("API endpoint:", url);
console.log("API method:", method);
console.log("Payload gửi lên:", payload);

await apiRequest(url, {
  method,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

      showToast(
        isUpdate
          ? "Cập nhật văn phòng phẩm thành công"
          : "Đã thêm văn phòng phẩm mới",
        "success"
      );

      await refresh?.();
      closeEditModal();
    } catch (err) {
      console.error("Stationery save error:", err);
      showToast(
        err?.message || "Không thể lưu dữ liệu. Vui lòng thử lại.",
        "error"
      );
    }
  };

  const executeDelete = async () => {
    const item = confirmDelete.item;
    const id = item?.id ?? item?.Id;

    if (!id) return;

    try {
      await apiRequest(`${apiEndpoint}/${id}`, {
        method: "DELETE",
      });

      showToast("Đã xóa văn phòng phẩm thành công", "success");
      await refresh?.();
      closeDeleteConfirm();
    } catch (err) {
      console.error("Stationery delete error:", err);
      showToast(err?.message || "Không thể xóa văn phòng phẩm", "error");
      closeDeleteConfirm();
    }
  };

  return (
    <div className="admin-stationery-portal animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
      </div>

      {/* Thống kê */}
      <div className="row g-2 mb-3">
        {[
          {
            label: totalLabel,
            value: stats.total,
            icon: "bi-box-seam",
            color: "#10b981",
          },
          {
            label: "Hết hàng",
            value: stats.outOfStock,
            icon: "bi-exclamation-octagon",
            color: "#ef4444",
          },
          {
            label: "Sắp hết hàng",
            value: stats.lowStock,
            icon: "bi-hourglass-split",
            color: "#f59e0b",
          },
          {
            label: "Giá trị tồn kho",
            value: formatBookPrice(stats.totalValue),
            icon: "bi-cash-stack",
            color: "#3b82f6",
          },
        ].map((s, idx) => (
          <div className="col-xl-3 col-md-6 d-flex" key={idx}>
            <div className="stat-card-modern stationery-stat-card p-2 rounded-3 shadow-sm bg-white border-0 position-relative d-flex align-items-center gap-3 w-100 h-100">
              <div className="icon-box-modern rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
                <i className={`bi ${s.icon} fs-5`}></i>
              </div>

              <div className="flex-grow-1">
                <div className="label fw-bold text-slate-500 x-small text-uppercase mb-0">
                  {s.label}
                </div>

                <div className="value fw-800 fs-5 text-slate-900">
                  {s.value}
                </div>
              </div>

              <div
                className="decoration-bar"
                style={{ background: s.color }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Table */}
      <div className="card stationery-table-card border-0 shadow-sm rounded-4 bg-white">
        <div className="card-header bg-white border-bottom border-slate-100 p-3">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="modern-search-box">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="stationery-filter-select-wrap">
                <select
                  className="form-select modern-select stationery-filter-select"
                  value={filterCategory}
                  onChange={(event) => setFilterCategory(event.target.value)}
                >
                  <option value="all">Tất cả danh mục</option>
                  {normalizedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {filterCategory !== "all" && (
                  <button
                    type="button"
                    className="stationery-filter-clear-btn"
                    onClick={() => setFilterCategory("all")}
                    title="Bỏ lọc danh mục"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-3 text-md-end">
              <button
                type="button"
                className="btn btn-primary-premium w-100 fw-bold h-100 rounded-3 shadow-sm"
                onClick={openAddModal}
              >
                <i className="bi bi-plus-circle me-1"></i>
                {addButtonText}
              </button>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-scroll-x">
            <table className="table table-modern align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-3">STT</th>
                  <th className="ps-4">Sản phẩm</th>
                  <th>Thương hiệu</th>
                  <th>Danh mục</th>
                  <th>Giá niêm yết</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th className="action-col">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {normalizedCategories.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center py-4 bg-warning bg-opacity-10"
                    >
                      <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                      <span className="fw-bold text-dark">
                        {categoryWarning}
                      </span>
                    </td>
                  </tr>
                )}

                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <i className="bi bi-box-x fs-1 text-slate-200"></i>
                      <p className="text-slate-400 fw-bold mt-2">
                        {emptyText}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, index) => {
                    const id = item.id ?? item.Id;
                    const title = getValue(item, "title", "Title", "");
                    const brand = getValue(item, "brand", "Brand", "N/A");
                    const imageUrl = normalizeImageUrl(
                      getValue(item, "imageUrl", "ImageUrl", "")
                    );
                    const price = Number(getValue(item, "price", "Price", 0));
                    const stockQuantity = Number(
                      getValue(item, "stockQuantity", "StockQuantity", 0)
                    );
                    const categoryName = getDisplayCategoryName(item);
                    const status = getStockStatus(stockQuantity);

                    return (
                      <tr key={id}>
                        <td className="ps-3 py-2">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>

                        <td className="ps-4 py-2">
                          <div className="d-flex align-items-center gap-3">
                            <div className="item-preview shadow-sm rounded-2 overflow-hidden border">
                              {imageUrl ? (
                                <img 
                                  src={getImageUrl(imageUrl, title)} 
                                  alt={title} 
                                  onError={(e) => { e.currentTarget.src = FALLBACK_BOOK_IMAGE; }}
                                />
                              ) : (
                                <i className="bi bi-box text-slate-300"></i>
                              )}
                            </div>

                            <div>
                              <div className="fw-800 text-slate-900 mb-0">
                                {title}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="text-slate-600 fw-semibold small">
                            {brand}
                          </div>
                        </td>

                        <td>
                          <span className="cat-badge">{categoryName}</span>
                        </td>

                        <td>
                          <div className="fw-800 text-indigo">
                            {formatBookPrice(price)}
                          </div>
                        </td>

                        <td>
                          <span className={`fw-800 ${status.stockClassName}`}>
                            {stockQuantity}
                          </span>
                        </td>

                        <td>
                          <span className={`status-pill ${status.className}`}>
                            {status.text}
                          </span>
                        </td>

                       <td className="action-col">
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="action-btn view-btn"
                              title="Xem chi tiết"
                              onClick={() => openDetailModal(item)}
                            >
                              <i className="bi bi-eye-fill"></i>
                            </button>

                            <button
                              type="button"
                              className="action-btn edit-btn"
                              title="Sửa"
                              onClick={() => openEditModal(item)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>

                            <button
                              type="button"
                              className="action-btn delete-btn"
                              title="Xóa sản phẩm"
                              onClick={() => openDeleteConfirm(item)}
                            >
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {filteredItems.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3 p-3 bg-white rounded-bottom-4">
            <div className="pagination-info fw-bold-700 text-dark">
              Hiển thị {Math.min(filteredItems.length, (currentPage - 1) * pageSize + 1)} – {Math.min(filteredItems.length, currentPage * pageSize)} trong tổng số {filteredItems.length} sản phẩm
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="text-slate-800 fw-bold text-uppercase" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>Số dòng:</span>
                <select
                  className="form-select form-select-sm shadow-sm"
                  style={{ width: '70px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    localStorage.setItem("adminPageSize_stationery", newSize);
                    setCurrentPage(1);
                  }}
                >
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              {totalPages > 1 && (
                <nav>
                  <ul className="pagination pagination-modern mb-0 gap-2">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button
                        type="button"
                        className="page-link rounded-3 border-0 shadow-sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>

                    {[...Array(totalPages)].map((_, index) => (
                      <li
                        key={index}
                        className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                      >
                        <button
                          type="button"
                          className="page-link rounded-3 border-0 shadow-sm px-3"
                          onClick={() => setCurrentPage(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}

                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button
                        type="button"
                        className="page-link rounded-3 border-0 shadow-sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal thêm / sửa văn phòng phẩm */}
      {showEditModal && (
        <div className="modal-overlay-modern animate-fade-in">
          <div className="stationery-book-modal-card animate-scale-in">
            <form onSubmit={handleSave} className="stationery-book-modal-form">
              <div className="stationery-book-modal-header">
                <div>
                  <h5 className="stationery-book-modal-title">
                    <i
                      className={`bi ${
                        editingItem?.id
                          ? "bi-pencil-square"
                          : "bi-plus-circle-fill"
                      } me-2`}
                    ></i>
                    {editingItem?.id ? editModalTitle : addModalTitle}
                  </h5>
                </div>

                <button
                  type="button"
                  className="stationery-book-modal-close"
                  onClick={closeEditModal}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="stationery-book-modal-body">
                <div className="stationery-book-preview-pane">
                  <label className="stationery-book-label">
                    <i className="bi bi-eye-fill"></i>
                    Xem trước hình ảnh
                  </label>

                  <div className="stationery-book-image-preview">
                    {editingItem?.imageUrl ? (
                      <img
                        src={getImageUrl(editingItem.imageUrl, editingItem.title)}
                        alt="Preview"
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_BOOK_IMAGE;
                        }}
                        onLoad={(event) => {
                          event.currentTarget.style.display = "block";
                        }}
                      />
                    ) : (
                      <div className="stationery-empty-image">
                        <i className="bi bi-image-fill"></i>
                        <span>Chưa có ảnh</span>
                      </div>
                    )}
                  </div>

                  <p className="stationery-preview-note">
                    Ảnh sẽ tự động hiển thị khi bạn nhập URL hoặc dán dữ liệu
                    ảnh.
                  </p>
                </div>

                <div className="stationery-book-form-pane">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-bookmark-fill"></i>
                        Tên sản phẩm
                      </label>

                      <input
                        type="text"
                        name="title"
                        className="stationery-book-input"
                        defaultValue={editingItem?.title || ""}
                        required
                        placeholder="Ví dụ: Băng keo dán"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-grid-fill"></i>
                        Danh mục
                      </label>

                      <select
  className="stationery-book-input"
  name="categoryId"
  defaultValue={editingItem?.categoryId || ""}
  required
>
  <option value="">Chọn danh mục</option>

  {normalizedCategories.map((category) => (
    <option key={category.id} value={category.id}>
      {category.name}
    </option>
  ))}
</select>
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-person-badge-fill"></i>
                        Thương hiệu
                      </label>

                      <select
                        name="brand"
                        className="stationery-book-input"
                        defaultValue={editingItem?.brand || ""}
                        required
                      >
                        <option value="">Chọn thương hiệu</option>

                        {normalizedBrands.map((brand) => (
                          <option key={brand.id} value={brand.name}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
  <label className="stationery-book-label">
    <i className="bi bi-building-fill"></i>
    Nhà sản xuất
  </label>

  <select
    name="manufacturer"
    className="stationery-book-input"
    defaultValue={editingItem?.manufacturer || ""}
    required
  >
    <option value="">Chọn nhà sản xuất</option>

    {normalizedManufacturers.map((manufacturer) => (
      <option key={manufacturer.id} value={manufacturer.name}>
        {manufacturer.name}
      </option>
    ))}
  </select>
</div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-tag-fill"></i>
                        Giá bán
                      </label>

                      <div className="stationery-price-input-wrap">
                        <input
                          type="number"
                          name="price"
                          className="stationery-book-input stationery-price-input"
                          defaultValue={editingItem?.price ?? ""}
                          min="0"
                          step="1"
                          required
                          placeholder="0"
                        />
                        <span>VNĐ</span>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-stack"></i>
                        Tồn kho
                      </label>

                      <input
                        type="number"
                        name="stockQuantity"
                        className="stationery-book-input"
                        defaultValue={editingItem?.stockQuantity ?? ""}
                        min="0"
                        required
                        placeholder="0"
                      />
                    </div>

                    <div className="col-12">
                      <label className="stationery-book-label">
                        <i className="bi bi-link-45deg"></i>
                        Hình ảnh
                      </label>

                      <input
                        type="text"
                        name="imageUrl"
                        className="stationery-book-input"
                        value={editingItem?.imageUrl || ""}
                        placeholder="https://... hoặc dán dữ liệu ảnh"
                        onChange={(event) =>
                          setEditingItem((prev) => ({
                            ...(prev || {}),
                            imageUrl: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-12">
                      <label className="stationery-book-label">
                        <i className="bi bi-text-paragraph"></i>
                        Mô tả sản phẩm
                      </label>

                      <textarea
                        name="description"
                        className="stationery-book-input stationery-book-textarea"
                        rows="4"
                        defaultValue={editingItem?.description || ""}
                        placeholder="Mô tả chất liệu, công dụng..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div className="stationery-book-modal-footer">
                <button
                  type="button"
                  className="stationery-book-btn-cancel"
                  onClick={closeEditModal}
                >
                  Hủy bỏ
                </button>

                <button type="submit" className="stationery-book-btn-save">
                  <i className="bi bi-check2-circle me-2"></i>
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal chi tiết văn phòng phẩm */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay-modern animate-fade-in">
          <div className="stationery-detail-modal animate-scale-in">
            <div className="stationery-detail-header">
              <div>
                <h5 className="stationery-detail-title">
                  <i className="bi bi-eye-fill me-2"></i>
                  {detailModalTitle}
                </h5>
              </div>

              <button
                type="button"
                className="stationery-detail-close"
                onClick={closeDetailModal}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="stationery-detail-body">
              {(() => {
                const title = getValue(selectedItem, "title", "Title", "");
                const brand = getValue(
                  selectedItem,
                  "brand",
                  "Brand",
                  "Chưa cập nhật"
                );
                const manufacturer = getValue(
                  selectedItem,
                  "manufacturer",
                  "Manufacturer",
                  "Chưa cập nhật"
                );
                const description = getValue(
                  selectedItem,
                  "description",
                  "Description",
                  "Chưa có mô tả cho sản phẩm này."
                );
                const imageUrl = normalizeImageUrl(
                  getValue(selectedItem, "imageUrl", "ImageUrl", "")
                );
                const price = Number(
                  getValue(selectedItem, "price", "Price", 0)
                );
                const stockQuantity = Number(
                  getValue(selectedItem, "stockQuantity", "StockQuantity", 0)
                );
                const categoryName = getDisplayCategoryName(selectedItem);
                const status = getStockStatus(stockQuantity);
                const summary = salesSummary || EMPTY_SALES_SUMMARY;

                return (
                  <>
                    <div className="stationery-detail-image-box">
                      {imageUrl ? (
                        <img 
                          src={getImageUrl(imageUrl, title)} 
                          alt={title} 
                          onError={(e) => { e.currentTarget.src = FALLBACK_BOOK_IMAGE; }}
                        />
                      ) : (
                        <div className="stationery-detail-empty-image">
                          <i className="bi bi-image"></i>
                          <span>Chưa có ảnh</span>
                        </div>
                      )}
                    </div>

                    <div className="stationery-detail-info">
                      <h3 className="stationery-detail-name">{title}</h3>

                      <div className="stationery-detail-grid">
                        <div className="stationery-detail-item">
                          <span className="stationery-detail-label">
                            Thương hiệu
                          </span>
                          <strong>{brand || "Chưa cập nhật"}</strong>
                        </div>

                        <div className="stationery-detail-item">
                          <span className="stationery-detail-label">
                            Nhà sản xuất
                          </span>
                          <strong>{manufacturer || "Chưa cập nhật"}</strong>
                        </div>

                        <div className="stationery-detail-item">
                          <span className="stationery-detail-label">
                            Danh mục
                          </span>
                          <strong>{categoryName || "Chưa phân loại"}</strong>
                        </div>

                        <div className="stationery-detail-item">
                          <span className="stationery-detail-label">
                            Giá bán
                          </span>
                          <strong className="text-indigo">
                            {formatBookPrice(price)}
                          </strong>
                        </div>

                        <div className="stationery-detail-item">
                          <span className="stationery-detail-label">
                            Tồn kho
                          </span>
                          <strong className={status.stockClassName}>
                            {stockQuantity}
                          </strong>
                        </div>

                        <div className="stationery-detail-item">
                          <span className="stationery-detail-label">
                            Trạng thái
                          </span>
                          <span className={`status-pill ${status.className}`}>
                            {status.text}
                          </span>
                        </div>
                      </div>

                      <div className="stationery-detail-description">
                        <span className="stationery-detail-label">Mô tả</span>
                        <p>
                          {description || "Chưa có mô tả cho sản phẩm này."}
                        </p>
                      </div>

                      <div className="stationery-sales-section">
                        <div className="stationery-sales-heading">
                          <h4>
                            <i className="bi bi-bar-chart-fill me-2"></i>
                            Thống kê bán hàng
                          </h4>
                          <p>Theo dữ liệu đơn hàng của sản phẩm này</p>
                        </div>

                        {loadingSalesSummary ? (
                          <div className="stationery-sales-loading">
                            Đang tải thống kê bán hàng...
                          </div>
                        ) : (
                          <div className="stationery-sales-grid">
                            <div className="stationery-sales-card">
                              <span>Đã bán hôm nay</span>
                              <strong>{summary.soldToday || 0}</strong>
                            </div>

                            <div className="stationery-sales-card">
                              <span>Đã bán tháng này</span>
                              <strong>{summary.soldThisMonth || 0}</strong>
                            </div>

                            <div className="stationery-sales-card">
                              <span>Đã bán quý này</span>
                              <strong>{summary.soldThisQuarter || 0}</strong>
                            </div>

                            <div className="stationery-sales-card">
                              <span>Đã bán năm nay</span>
                              <strong>{summary.soldThisYear || 0}</strong>
                            </div>

                            <div className="stationery-sales-card">
                              <span>Tổng đã bán</span>
                              <strong>{summary.totalSold || 0}</strong>
                            </div>

                            <div className="stationery-sales-card">
                              <span>Tổng doanh thu</span>
                              <strong>
                                {formatBookPrice(summary.totalRevenue || 0)}
                              </strong>
                            </div>

                            <div className="stationery-sales-card">
                              <span>Số đơn hàng</span>
                              <strong>{summary.totalOrders || 0}</strong>
                            </div>

                            <div className="stationery-sales-card">
                              <span>Số người mua</span>
                              <strong>{summary.totalBuyers || 0}</strong>
                            </div>

                            <div className="stationery-sales-card">
                              <span>Đơn online</span>
                              <strong>{summary.onlineOrders || 0}</strong>
                            </div>

                            <div className="stationery-sales-card">
                              <span>Đơn offline</span>
                              <strong>{summary.offlineOrders || 0}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="stationery-customer-section">
                        <h4>
                          <i className="bi bi-people-fill me-2"></i>
                          Khách hàng mua nhiều
                        </h4>

                        {summary.topCustomers?.length > 0 ? (
                          <div className="stationery-customer-list">
                            {summary.topCustomers.map((customer, index) => (
                              <div
                                className="stationery-customer-row"
                                key={`${customer.customerId || index}-${
                                  customer.customerName
                                }`}
                              >
                                <div>
                                  <strong>
                                    {customer.customerName || "Khách lẻ"}
                                  </strong>
                                  <span>
                                    {customer.mainChannel || "Online"} ·{" "}
                                    {customer.purchaseCount || 0} lần mua
                                  </span>
                                </div>

                                <div className="text-end">
                                  <strong>
                                    {customer.totalQuantity || 0}
                                  </strong>
                                  <span>
                                    {formatBookPrice(
                                      customer.totalAmount || 0
                                    )}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="stationery-empty-panel">
                            Chưa có khách hàng nào mua sản phẩm này.
                          </div>
                        )}
                      </div>

                      <div className="stationery-history-section">
                        <h4>
                          <i className="bi bi-clock-history me-2"></i>
                          Lịch sử mua gần đây
                        </h4>

                        {summary.recentPurchases?.length > 0 ? (
                          <div className="stationery-history-list">
                            {summary.recentPurchases.map((purchase, index) => (
                              <div
                                className="stationery-history-row"
                                key={`${purchase.orderId || index}-${
                                  purchase.orderDate
                                }`}
                              >
                                <div>
                                  <strong>
                                    {purchase.customerName || "Khách lẻ"}
                                  </strong>
                                  <span>
                                    {purchase.orderDate
                                      ? new Date(
                                          purchase.orderDate
                                        ).toLocaleString("vi-VN")
                                      : "Chưa có ngày mua"}
                                  </span>
                                </div>

                                <div className="text-end">
                                  <strong>
                                    {purchase.quantity || 0} sản phẩm ·{" "}
                                    {purchase.channel || "Online"}
                                  </strong>
                                  <span>
                                    {formatBookPrice(
                                      purchase.totalAmount || 0
                                    )}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="stationery-empty-panel">
                            Chưa có lịch sử mua gần đây.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="stationery-detail-footer">
              <button
                type="button"
                className="stationery-detail-btn-cancel"
                onClick={closeDetailModal}
              >
                Đóng
              </button>

              <button
                type="button"
                className="stationery-detail-btn-edit"
                onClick={() => {
                  const item = selectedItem;
                  closeDetailModal();
                  openEditModal(item);
                }}
              >
                <i className="bi bi-pencil-square me-2"></i>
                Sửa
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={confirmDelete.show}
        title={deleteTitle}
        message={`Bạn có chắc chắn muốn xóa "${
          confirmDelete.item?.title ||
          confirmDelete.item?.Title ||
          "sản phẩm này"
        }"? Hành động này không thể hoàn tác.`}
        onConfirm={executeDelete}
        onCancel={closeDeleteConfirm}
        type="danger"
      />
    </div>
  );
}

export default AdminStationery;