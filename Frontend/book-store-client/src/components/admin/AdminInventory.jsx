import React, { useMemo, useState, useEffect } from "react";
import "../../styles/admin/AdminAuthors.css";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";
import { apiRequest } from "../../services/apiClient";

const EMPTY_PRODUCT = {
  sku: "",
  name: "",
  category: "",
  quantity: "",
  minStock: "",
  price: "",
};

const InventoryManagement = () => {
  const [keyword, setKeyword] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_inventory");
    return saved ? Number(saved) : 6;
  });

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_PRODUCT });

  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    item: null,
  });

  const [stockModal, setStockModal] = useState({
    show: false,
    type: "increase",
    itemId: null,
    dbType: null,
    value: "",
    title: "",
    placeholder: "",
  });

  // Fetch real-time inventory from database
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const endpoints = [
        { path: "/books", category: "Sách", dbType: "books", skuPrefix: "BOOK" },
        { path: "/stationery", category: "Văn phòng phẩm", dbType: "stationery", skuPrefix: "STAT" },
        { path: "/toys", category: "Đồ chơi", dbType: "toys", skuPrefix: "TOY" },
        { path: "/schoolsupplies", category: "Dụng cụ học tập", dbType: "schoolsupplies", skuPrefix: "SUPP" },
        { path: "/accessories", category: "Phụ kiện", dbType: "accessories", skuPrefix: "ACC" },
        { path: "/souvenirs", category: "Quà lưu niệm", dbType: "souvenirs", skuPrefix: "SOUV" }
      ];
 
      const results = await Promise.allSettled(
        endpoints.map(async (ep) => {
          const res = await apiRequest(ep.path);
          return { items: Array.isArray(res) ? res : [], ...ep };
        })
      );
 
      const combined = [];
      results.forEach((res) => {
        if (res.status === "fulfilled" && res.value) {
          const { items, category, dbType, skuPrefix } = res.value;
          items.forEach((item) => {
            const id = item.Id ?? item.id;
            const title = item.Title ?? item.title ?? "Sản phẩm không tên";
            const price = Number(item.Price ?? item.price ?? 0);
            const qty = Number(item.StockQuantity ?? item.stockQuantity ?? 0);
            const sku = item.Sku ?? item.sku ?? `${skuPrefix}-${String(id).padStart(3, "0")}`;
 
            combined.push({
              id,
              sku,
              name: title,
              category: item.Category?.Name ?? item.category?.name ?? category,
              quantity: qty,
              minStock: dbType === "books" ? 10 : (dbType === "stationery" || dbType === "schoolsupplies" ? 15 : 5),
              price,
              dbType,
              rawItem: item
            });
          });
        }
      });

      // Sort by id descending
      combined.sort((a, b) => b.id - a.id);
      setInventory(combined);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      showToast("Lỗi khi tải dữ liệu tồn kho từ máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = useMemo(() => {
    let result = inventory;

    // Filter by type
    if (selectedType !== "all") {
      result = result.filter((item) => item.dbType === selectedType);
    }

    // Filter by keyword
    const value = keyword.trim().toLowerCase();
    if (value) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(value) ||
          item.sku.toLowerCase().includes(value) ||
          item.category.toLowerCase().includes(value)
      );
    }

    return result;
  }, [keyword, selectedType, inventory]);

  const totalPages = Math.ceil(filteredInventory.length / pageSize);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 4) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 2) {
        return [1, 2, 3, "...", totalPages];
      } else if (page >= totalPages - 1) {
        return [1, "...", totalPages - 2, totalPages - 1, totalPages];
      } else {
        return [1, "...", page, page + 1, "...", totalPages];
      }
    }
    return pages;
  };
  const paginatedInventory = useMemo(() => {
    return filteredInventory.slice(
      (page - 1) * pageSize,
      page * pageSize
    );
  }, [filteredInventory, page, pageSize]);

  const getStockStatus = (item) => {
    if (Number(item.quantity) <= 0) {
      return {
        label: "Hết hàng",
        className: "badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-1 text-uppercase fw-bold",
      };
    }

    if (Number(item.quantity) <= Number(item.minStock)) {
      return {
        label: "Sắp hết",
        className: "badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-1 text-uppercase fw-bold",
      };
    }

    return {
      label: "Còn hàng",
      className: "badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-1 text-uppercase fw-bold",
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      minStock: String(item.minStock),
      price: String(item.price),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ ...EMPTY_PRODUCT });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      showToast("Vui lòng nhập tên sản phẩm", "error");
      return;
    }

    const price = Number(formData.price || 0);
    const quantity = Number(formData.quantity || 0);
    const minStock = Number(formData.minStock || 0);

    if (quantity < 0 || minStock < 0 || price < 0) {
      showToast("Số lượng và giá không được âm", "error");
      return;
    }

    if (editingItem) {
      try {
        const { dbType, id, rawItem } = editingItem;

        // Build payload maintaining original property keys and format
        const payload = {
          ...rawItem,
          StockQuantity: quantity
        };

        // Explicitly set keys for backend model bindings
        if (rawItem.Title !== undefined || rawItem.title !== undefined) {
          payload.Title = formData.name.trim();
        }
        if (rawItem.Price !== undefined || rawItem.price !== undefined) {
          payload.Price = price;
        }

        await apiRequest(`/${dbType}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        showToast("Cập nhật thông tin tồn kho thành công", "success");
        fetchInventory();
        closeModal();
      } catch (err) {
        console.error("Update inventory error:", err);
        showToast("Lỗi khi cập nhật sản phẩm", "error");
      }
    }
  };

  const handleIncreaseStock = (id, dbType) => {
    const item = inventory.find((i) => i.id === id && i.dbType === dbType);
    if (!item) return;

    setStockModal({
      show: true,
      type: "increase",
      itemId: id,
      dbType,
      value: "",
      title: ` Nhập kho: ${item.name}`,
      placeholder: "Nhập số lượng cần nhập thêm...",
    });
  };

  const handleDecreaseStock = (id, dbType) => {
    const item = inventory.find((i) => i.id === id && i.dbType === dbType);
    if (!item) return;

    setStockModal({
      show: true,
      type: "decrease",
      itemId: id,
      dbType,
      value: "",
      title: ` Xuất kho: ${item.name}`,
      placeholder: "Nhập số lượng cần xuất kho...",
    });
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(stockModal.value);

    if (isNaN(qty) || qty <= 0) {
      showToast("Số lượng không hợp lệ. Vui lòng nhập số lớn hơn 0.", "error");
      return;
    }

    const item = inventory.find((i) => i.id === stockModal.itemId && i.dbType === stockModal.dbType);
    if (!item) return;

    const newQuantity = stockModal.type === "increase"
      ? item.quantity + qty
      : item.quantity - qty;

    if (newQuantity < 0) {
      showToast("Số lượng xuất vượt quá tồn kho hiện tại", "error");
      return;
    }

    try {
      const { dbType, id, rawItem } = item;

      const payload = {
        ...rawItem,
        StockQuantity: newQuantity
      };

      // Ensure proper PascalCase keys for database binding
      if (rawItem.Title || rawItem.title) payload.Title = rawItem.Title ?? rawItem.title;
      if (rawItem.Price || rawItem.price) payload.Price = Number(rawItem.Price ?? rawItem.price ?? 0);
      if (rawItem.CategoryId || rawItem.categoryId) payload.CategoryId = rawItem.CategoryId ?? rawItem.categoryId;
      if (rawItem.Brand || rawItem.brand) payload.Brand = rawItem.Brand ?? rawItem.brand;

      await apiRequest(`/${dbType}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      showToast(stockModal.type === "increase" ? "Nhập kho thành công!" : "Xuất kho thành công!", "success");
      setStockModal((prev) => ({ ...prev, show: false }));
      fetchInventory();
    } catch (err) {
      console.error("Stock submit error:", err);
      showToast("Lỗi khi cập nhật số lượng tồn kho", "error");
    }
  };

  const handleDeleteConfirm = (item) => {
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

  const executeDelete = async () => {
    const item = confirmDelete.item;
    if (!item) return;

    try {
      const { dbType, id } = item;
      await apiRequest(`/${dbType}/${id}`, { method: "DELETE" });
      showToast("Đã xóa sản phẩm khỏi kho hàng thành công", "success");
      fetchInventory();
      closeDeleteConfirm();
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Lỗi khi xóa sản phẩm khỏi kho hàng", "error");
    }
  };

  const totalProducts = inventory.length;
  const lowStockCount = inventory.filter(
    (item) => item.quantity > 0 && item.quantity <= item.minStock
  ).length;
  const outOfStockCount = inventory.filter((item) => item.quantity <= 0).length;
  const totalStockValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }, [inventory]);

  const stats = [
    {
      label: "Tổng sản phẩm",
      value: totalProducts,
      icon: "bi-box-seam",
      color: "#10b981",
    },
    {
      label: "Sắp hết hàng",
      value: lowStockCount,
      icon: "bi-hourglass-split",
      color: "#f59e0b",
    },
    {
      label: "Hết hàng",
      value: outOfStockCount,
      icon: "bi-exclamation-octagon",
      color: "#ef4444",
    },
    {
      label: "Giá trị tồn kho",
      value: totalStockValue.toLocaleString("vi-VN") + "đ",
      icon: "bi-cash-stack",
      color: "#3b82f6",
    },
  ];

  return (
    <div className="admin-authors-page animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
      </div>

      {/* Thống kê */ }
  <div className="row g-2 mb-3">
    {stats.map((s, idx) => (
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

  {/* Filter + Table */ }
  <div className="card stationery-table-card border-0 shadow-sm rounded-4 bg-white">
    <div className="card-header bg-white border-bottom border-slate-100 p-3">
      <div className="inventory-filter-row">
  <div className="inventory-search-area">
    <div className="modern-search-box inventory-search-box">
      <i className="bi bi-search"></i>
      <input
        type="text"
        placeholder="Tìm theo SKU, tên sản phẩm, danh mục..."
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setPage(1);
        }}
      />
    </div>
  </div>

  <div className="inventory-category-area">
    <div className="inventory-filter-wrapper">
      <select
        className="form-select inventory-filter-select"
        value={categoryFilter}
        onChange={(e) => {
          setCategoryFilter(e.target.value);
          setPage(1);
        }}
      >
        <option value="all">Tất cả sản phẩm</option>
        <option value="book">Sách</option>
        <option value="stationery">Văn phòng phẩm</option>
        <option value="toy">Đồ chơi</option>
        <option value="schoolSupply">Đồ dùng học tập</option>
        <option value="accessory">Phụ kiện</option>
        <option value="souvenir">Quà lưu niệm</option>
      </select>

      {categoryFilter !== "all" && (
        <button
          type="button"
          className="inventory-filter-clear"
          title="Xóa lọc phân loại"
          onClick={() => {
            setCategoryFilter("all");
            setPage(1);
          }}
        >
          <span>×</span>
        </button>
      )}
    </div>
  </div>


      </div>
    </div>

    <div className="card-body p-0">
      <div className="table-scroll-x">
        <table className="table table-modern align-middle mb-0 inventory-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>SKU</th>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th className="text-center">Số lượng</th>
              <th style={{ textAlign: "right" }}>Giá bán</th>
              <th className="text-center">Trạng thái</th>
              <th className="action-col">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-slate-500 fw-bold mt-2">Đang đồng bộ dữ liệu tồn kho từ máy chủ...</p>
                </td>
              </tr>
            ) : paginatedInventory.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-5">
                  <i className="bi bi-box-x-fill fs-1 text-slate-200"></i>
                  <p className="text-slate-400 fw-bold mt-2">
                    Không tìm thấy sản phẩm nào trong kho
                  </p>
                </td>
              </tr>
            ) : (
              paginatedInventory.map((item, index) => {
                const status = getStockStatus(item);

                return (
                  <tr key={`${item.dbType}-${item.id}`}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold text-indigo">{item.sku}</td>
                    <td>
                      <div className="fw-800 text-slate-900 mb-0" style={{ maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.name}
                      </div>
                    </td>
                    <td>
                      <span
                        className="fw-semibold px-2.5 py-1 small"
                        style={{
                          backgroundColor: "#f1f5f9",
                          color: "#475569",
                          borderRadius: "6px",
                          display: "inline-block",
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="fw-800 text-slate-800 text-center">
                      {item.quantity}
                    </td>
                    <td className="fw-800 text-slate-900 text-end">
                      {item.price.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="text-center">
                      <span className={status.className}>
                        {status.label}
                      </span>
                    </td>
                    <td className="action-col">
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="action-btn edit-btn"
                          onClick={() => openEditModal(item)}
                          title="Sửa tồn kho & giá"
                          style={{ background: "#eef0ff", color: "#4f46e5" }}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => handleIncreaseStock(item.id, item.dbType)}
                          title="Nhập kho"
                          style={{
                            background: "#dcfce7",
                            color: "#16a34a",
                            border: "none",
                            borderRadius: "14px",
                            width: "42px",
                            height: "42px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i className="bi bi-box-arrow-in-down" style={{ fontSize: "17px" }}></i>
                        </button>

                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => handleDecreaseStock(item.id, item.dbType)}
                          title="Xuất kho"
                          style={{
                            background: "#fef3c7",
                            color: "#d97706",
                            border: "none",
                            borderRadius: "14px",
                            width: "42px",
                            height: "42px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i className="bi bi-box-arrow-up" style={{ fontSize: "17px" }}></i>
                        </button>

                        <button
                          type="button"
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteConfirm(item)}
                          title="Xóa sản phẩm"
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center p-3">
          <div className="pagination-info">
            Hiển thị {paginatedInventory.length} trong tổng số {filteredInventory.length} sản phẩm
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
                  localStorage.setItem("adminPageSize_inventory", newSize);
                  setPage(1);
                }}
              >
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="pagination-nav">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {getPageNumbers().map((p, idx) => {
                if (p === "...") {
                  return (
                    <span key={`ellipsis-${idx}`} className="pagination-ellipsis px-2 text-slate-400 fw-bold d-inline-flex align-items-center justify-content-center" style={{ minWidth: "38px" }}>
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={p}
                    type="button"
                    className={`pagination-btn ${page === p ? "active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Edit Inventory Modal */ }
  {
    showModal && (
      <div className="modal-overlay-modern">
        <div className="stationery-book-modal-card animate-scale-in">
          <form onSubmit={handleSave} className="stationery-book-modal-form">
            <div className="stationery-book-modal-header">
              <h3 className="stationery-book-modal-title">
                <i className="bi bi-box-seam text-indigo"></i>
                Điều Chỉnh Tồn Kho
              </h3>
              <button
                type="button"
                className="stationery-book-modal-close"
                onClick={closeModal}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="stationery-book-modal-body">
              {/* Left Preview Pane */}
              <div className="stationery-book-preview-pane">
                <span className="stationery-book-label">
                  <i className="bi bi-info-circle-fill"></i>
                  Xem trước tồn kho
                </span>

                <div className="stationery-book-image-preview">
                  <div className="stationery-empty-image">
                    <i className="bi bi-box-seam" style={{ fontSize: "48px" }}></i>
                    <span className="fw-bold mt-2 text-uppercase">{editingItem?.category}</span>
                  </div>
                </div>

                <div className="stationery-preview-note mt-3">
                  Đang điều chỉnh kho cho sản phẩm mã <strong className="text-indigo">{formData.sku}</strong>. Số lượng tồn kho và giá bán sẽ được đồng bộ trực tiếp lên hệ thống.
                </div>
              </div>

              {/* Right Form Pane */}
              <div className="stationery-book-form-pane">
                <div className="row g-3">
                  <div className="col-md-6">
                    <span className="stationery-book-label">
                      <i className="bi bi-tag-fill"></i>
                      Mã SKU
                    </span>
                    <input
                      name="sku"
                      value={formData.sku}
                      className="stationery-book-input bg-light"
                      disabled
                    />
                  </div>

                  <div className="col-md-6">
                    <span className="stationery-book-label">
                      <i className="bi bi-grid-fill"></i>
                      Danh mục
                    </span>
                    <input
                      name="category"
                      value={formData.category}
                      className="stationery-book-input bg-light"
                      disabled
                    />
                  </div>

                  <div className="col-12">
                    <span className="stationery-book-label">
                      <i className="bi bi-chat-left-text-fill"></i>
                      Tên sản phẩm
                    </span>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="stationery-book-input"
                      placeholder="Nhập tên sản phẩm..."
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <span className="stationery-book-label">
                      <i className="bi bi-archive-fill"></i>
                      Số lượng tồn hiện tại
                    </span>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="stationery-book-input"
                      min="0"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <span className="stationery-book-label">
                      <i className="bi bi-currency-dollar"></i>
                      Giá bán (đ)
                    </span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="stationery-book-input"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="stationery-book-modal-footer">
              <button
                type="button"
                className="stationery-book-btn-cancel"
                onClick={closeModal}
              >
                HỦY BỎ
              </button>
              <button type="submit" className="stationery-book-btn-save">
                CẬP NHẬT KHO
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  {/* Confirm Delete Modal */ }
  <ConfirmModal
    show={confirmDelete.show}
    title="XÓA KHỎI KHO HÀNG"
    message={`Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm "${confirmDelete.item?.name}" khỏi cơ sở dữ liệu không? Hành động này không thể hoàn tác.`}
    onConfirm={executeDelete}
    onCancel={closeDeleteConfirm}
    confirmText="XÓA NGAY"
    cancelText="HỦY"
  />

  {/* Modern Custom Stock Modal */ }
  {
    stockModal.show && (
      <div className="modal-overlay-modern">
        <div
          className="stationery-book-modal-card animate-scale-in"
          style={{ maxWidth: "480px", borderRadius: "20px" }}
        >
          <form onSubmit={handleStockSubmit} className="stationery-book-modal-form">
            <div
              className="stationery-book-modal-header"
              style={{
                background: stockModal.type === "increase" ? "#ecfdf5" : "#fffbeb",
                borderBottom: stockModal.type === "increase" ? "1px solid #d1fae5" : "1px solid #fef3c7",
                padding: "18px 24px"
              }}
            >
              <h3 className="stationery-book-modal-title" style={{ fontSize: "18px", fontWeight: "900" }}>
                <i
                  className={`bi ${stockModal.type === "increase" ? "bi-box-arrow-in-down text-success" : "bi-box-arrow-up text-warning"
                    }`}
                ></i>
                {stockModal.title}
              </h3>
              <button
                type="button"
                className="stationery-book-modal-close"
                onClick={() => setStockModal((prev) => ({ ...prev, show: false }))}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="p-4 bg-white">
              <span className="stationery-book-label mb-2">
                <i className="bi bi-hash"></i>
                Số lượng hàng hóa
              </span>
              <input
                type="number"
                className="stationery-book-input"
                placeholder={stockModal.placeholder}
                value={stockModal.value}
                onChange={(e) =>
                  setStockModal((prev) => ({ ...prev, value: e.target.value }))
                }
                min="1"
                required
                autoFocus
              />
            </div>

            <div className="stationery-book-modal-footer" style={{ padding: "12px 24px" }}>
              <button
                type="button"
                className="stationery-book-btn-cancel"
                style={{ minWidth: "100px", minHeight: "44px", fontSize: "14px", borderRadius: "12px" }}
                onClick={() => setStockModal((prev) => ({ ...prev, show: false }))}
              >
                HỦY BỎ
              </button>
              <button
                type="submit"
                className="stationery-book-btn-save"
                style={{
                  minWidth: "120px",
                  minHeight: "44px",
                  fontSize: "14px",
                  borderRadius: "12px",
                  background: stockModal.type === "increase"
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  boxShadow: stockModal.type === "increase"
                    ? "0 10px 20px rgba(16, 185, 129, 0.2)"
                    : "0 10px 20px rgba(245, 158, 11, 0.2)"
                }}
              >
                XÁC NHẬN
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }
    </div >
  );
};

export default InventoryManagement;