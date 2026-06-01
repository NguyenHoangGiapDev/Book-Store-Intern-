import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/apiClient";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";
import "../../styles/admin/AdminAuthors.css";

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
};

const getToday = () => {
  const today = new Date();
  return today.toISOString().slice(0, 10);
};

const getPromotionStatus = (promotion) => {
  const today = getToday();
  const start = promotion.startDate || promotion.StartDate;
  const end = promotion.endDate || promotion.EndDate;

  if (start && today < start.slice(0, 10)) {
    return "upcoming";
  }

  if (end && today > end.slice(0, 10)) {
    return "expired";
  }

  return "active";
};

const statusMeta = {
  active: {
    label: "Đang chạy",
    className: "badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-bold border border-success border-opacity-25",
    icon: "bi-play-circle-fill",
  },
  expired: {
    label: "Hết hạn",
    className: "badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2 fw-bold border border-danger border-opacity-25",
    icon: "bi-clock-history",
  },
  upcoming: {
    label: "Sắp diễn ra",
    className: "badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2 fw-bold border border-warning border-opacity-25",
    icon: "bi-calendar-event",
  },
};



const AdminPromotions = ({ promotions = [], refresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_promotions");
    return saved ? Number(saved) : 6;
  });
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  const normalizedPromotions = useMemo(() => {
    return (promotions || []).map((item) => ({
      id: item.id ?? item.Id,
      name: item.name ?? item.Name ?? item.title ?? item.Title ?? "",
      code: item.code ?? item.Code ?? "",
      discountPercent:
        item.discountPercent ??
        item.DiscountPercent ??
        item.discount ??
        item.Discount ??
        0,
      startDate: item.startDate ?? item.StartDate ?? "",
      endDate: item.endDate ?? item.EndDate ?? "",
      description: item.description ?? item.Description ?? "",
      isActive: item.isActive ?? item.IsActive ?? true,
    }));
  }, [promotions]);

  const stats = useMemo(() => {
    const active = normalizedPromotions.filter(
      (p) => getPromotionStatus(p) === "active"
    ).length;
    const expired = normalizedPromotions.filter(
      (p) => getPromotionStatus(p) === "expired"
    ).length;
    const upcoming = normalizedPromotions.filter(
      (p) => getPromotionStatus(p) === "upcoming"
    ).length;

    return [
      {
        label: "Tổng chương trình",
        value: normalizedPromotions.length,
        icon: "bi-ticket-perforated",
        color: "#4f46e5",
      },
      {
        label: "Đang chạy",
        value: active,
        icon: "bi-lightning-charge",
        color: "#10b981",
      },
      {
        label: "Sắp diễn ra",
        value: upcoming,
        icon: "bi-calendar-event",
        color: "#f59e0b",
      },
      {
        label: "Đã hết hạn",
        value: expired,
        icon: "bi-hourglass-bottom",
        color: "#e11d48",
      },
    ];
  }, [normalizedPromotions]);

  const filteredPromotions = useMemo(() => {
    return normalizedPromotions.filter((promotion) => {
      const keyword = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !keyword ||
        promotion.name.toLowerCase().includes(keyword) ||
        promotion.code.toLowerCase().includes(keyword) ||
        promotion.description.toLowerCase().includes(keyword);

      const status = getPromotionStatus(promotion);
      const matchesStatus = statusFilter === "all" || statusFilter === status;

      return matchesSearch && matchesStatus;
    });
  }, [normalizedPromotions, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPromotions.length / pageSize);
  const paginatedPromotions = filteredPromotions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const openCreateModal = () => {
    setEditingPromotion(null);
    setShowModal(true);
  };

  const openEditModal = (promotion) => {
    setEditingPromotion(promotion);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPromotion(null);
  };

  const handleDelete = (id) => {
    setConfirmDelete({ show: true, id });
  };

  const closeDeleteConfirm = () => {
    setConfirmDelete({ show: false, id: null });
  };

  const executeDelete = async () => {
    try {
      await apiRequest(`/promotions/${confirmDelete.id}`, {
        method: "DELETE",
      });

      showToast("Đã xóa mã khuyến mãi", "success");
      setConfirmDelete({ show: false, id: null });
      await refresh?.();
    } catch (err) {
      console.error("Delete promotion error:", err);
      showToast("Không thể xóa mã khuyến mãi", "error");
      setConfirmDelete({ show: false, id: null });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const rawData = Object.fromEntries(formData.entries());

    const payload = {
      code: rawData.code?.trim()?.toUpperCase(),
      name: rawData.name?.trim(),
      discountPercent: Number(rawData.discountPercent || 0),
      startDate: rawData.startDate,
      endDate: rawData.endDate,
      description: rawData.description?.trim() || null,
      isActive: true,
      };

    if (!payload.name) {
      showToast("Vui lòng nhập tên chương trình", "error");
      return;
    }

    if (!payload.code) {
      showToast("Vui lòng nhập mã code", "error");
      return;
    }

    if (payload.discountPercent <= 0 || payload.discountPercent > 100) {
      showToast("Giảm giá phải từ 1% đến 100%", "error");
      return;
    }

    if (payload.startDate && payload.endDate && payload.startDate > payload.endDate) {
      showToast("Ngày bắt đầu không được lớn hơn ngày kết thúc", "error");
      return;
    }

    try {
      const isUpdate = Boolean(editingPromotion?.id);
      const url = isUpdate
        ? `/promotions/${editingPromotion.id}`
        : "/promotions";
      const method = isUpdate ? "PUT" : "POST";

      await apiRequest(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      showToast(
        isUpdate ? "Đã cập nhật khuyến mãi" : "Đã tạo mã khuyến mãi mới",
        "success"
      );

      closeModal();
      await refresh?.();
    } catch (err) {
      console.error("Save promotion error:", err);
      showToast(err.message || "Không thể lưu khuyến mãi", "error");
    }
  };

  return (
    <div className="admin-authors-page animate-fade-in pt-3 mt-2">

      <div className="row g-2 mb-3">
        {stats.map((stat, index) => (
          <div className="col-xl-3 col-md-6 d-flex" key={index}>
            <div className="stat-card-modern stationery-stat-card p-2 rounded-3 shadow-sm bg-white border-0 position-relative d-flex align-items-center gap-3 w-100 h-100">
              <div className="icon-box-modern rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
                <i className={`bi ${stat.icon} fs-5`}></i>
              </div>

              <div className="flex-grow-1">
                <div className="label fw-bold text-slate-500 x-small text-uppercase mb-0">
                  {stat.label}
                </div>

                <div className="value fw-800 fs-5 text-slate-900">
                  {stat.value}
                </div>
              </div>

              <div
                className="decoration-bar"
                style={{ background: stat.color }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="card stationery-table-card border-0 shadow-sm rounded-4 bg-white">
        <div className="card-header bg-white border-bottom border-slate-100 p-3">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="modern-search-box">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo tên chương trình, mã code..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="col-md-3">
              <div className="position-relative">
                <select
                  className="form-select w-100"
                  style={{
                    minHeight: '48px',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a',
                    fontWeight: '600',
                    paddingLeft: '16px',
                    paddingRight: statusFilter !== 'all' ? '42px' : '30px'
                  }}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang chạy</option>
                  <option value="upcoming">Sắp diễn ra</option>
                  <option value="expired">Hết hạn</option>
                </select>
                {statusFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("all");
                      setPage(1);
                    }}
                    className="position-absolute border-0 bg-transparent text-slate-400 hover-text-slate-600 p-0"
                    style={{
                      right: '34px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Xóa bộ lọc"
                  >
                    <i className="bi bi-x-circle-fill" style={{ fontSize: '15px', color: '#94a3b8' }}></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-3 text-md-end">
              <button
                type="button"
                className="btn btn-primary-premium w-100 fw-bold h-100 rounded-3 shadow-sm"
                onClick={openCreateModal}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Thêm mới
              </button>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-scroll-x">
            <table className="table table-modern align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-3" style={{width: '80px'}}>STT</th>
                  <th className="ps-4" style={{ width: '280px' }}>Tên chương trình</th>
                  <th style={{ width: '200px' }}>Mã code & Mức giảm</th>
                  <th style={{ width: '180px' }}>Thời hạn</th>
                  <th style={{ width: '150px' }}>Trạng thái</th>
                  <th className="action-col" style={{width: '120px'}}>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {paginatedPromotions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <i className="bi bi-ticket-detailed fs-1 text-slate-200"></i>
                      <p className="text-slate-400 fw-bold mt-2">
                        Không tìm thấy khuyến mãi nào
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedPromotions.map((promotion, index) => {
                    const status = getPromotionStatus(promotion);
                    const meta = statusMeta[status];

                    return (
                      <tr key={promotion.id}>
                        <td className="ps-3 py-2">{(page - 1) * pageSize + index + 1}</td>

                        <td className="ps-3 py-2">
                          <div className="fw-800 text-slate-900 mb-0 text-truncate" style={{ maxWidth: '200px' }}>
                            {promotion.name}
                          </div>
                          <div className="small text-slate-400 fw-bold text-truncate" style={{ maxWidth: '200px' }}>
                            {promotion.description || "Khuyến mãi hệ thống"}
                          </div>
                        </td>

                        <td>
                           <div className="d-flex flex-column align-items-start gap-1">
                              <span className="d-inline-block px-2 py-1 rounded bg-slate-100 text-slate-900 border fw-bold" style={{fontFamily: 'monospace', letterSpacing: '0.5px', fontSize: '12px', lineHeight: '1.2'}}>
                                 {promotion.code}
                              </span>
                              <span className="fw-950 text-danger small">
                                Giảm {promotion.discountPercent}%
                              </span>
                           </div>
                        </td>

                        <td>
                           <div className="text-slate-600 fw-semibold small d-flex flex-column gap-1">
                              <span><i className="bi bi-calendar-event me-1 text-slate-400"></i> {formatDate(promotion.startDate)}</span>
                              <span><i className="bi bi-calendar-x me-1 text-slate-400"></i> {formatDate(promotion.endDate)}</span>
                           </div>
                        </td>

                        <td>
                           <span className={meta.className}>
                              <i className={`bi ${meta.icon} me-1`}></i>
                              {meta.label}
                           </span>
                        </td>

                        <td className="action-col">
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              onClick={() => openEditModal(promotion)}
                              title="Sửa khuyến mãi"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>

                            <button
                              type="button"
                              className="action-btn delete-btn"
                              onClick={() => handleDelete(promotion.id)}
                              title="Xóa khuyến mãi"
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

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 rounded-bottom-4">
            <div className="pagination-info fw-bold-700 text-dark">
              Hiển thị {Math.min((page - 1) * pageSize + 1, filteredPromotions.length)} –{" "}
              {Math.min(page * pageSize, filteredPromotions.length)} trong tổng số{" "}
              {filteredPromotions.length} khuyến mãi
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
                    localStorage.setItem("adminPageSize_promotions", newSize);
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
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pagination-btn ${page === p ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                className="pagination-btn"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay-modern animate-fade-in">
          <div className="stationery-book-modal-card animate-scale-in">
            <form onSubmit={handleSave} className="stationery-book-modal-form">
              <div className="stationery-book-modal-header">
                <div>
                  <h5 className="stationery-book-modal-title">
                    <i
                      className={`bi ${
                        editingPromotion?.id
                          ? "bi-pencil-square"
                          : "bi-plus-circle-fill"
                      } me-2`}
                    ></i>
                    {editingPromotion?.id ? "Cập nhật" : "Tạo mới"}
                  </h5>
                </div>

                <button
                  type="button"
                  className="stationery-book-modal-close"
                  onClick={closeModal}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="stationery-book-modal-body" style={{ gridTemplateColumns: '1fr' }}>
                <div className="stationery-book-form-pane">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="stationery-book-label">
                        <i className="bi bi-bookmark-fill"></i>
                        TÊN CHƯƠNG TRÌNH
                      </label>

                      <input
                        type="text"
                        name="name"
                        className="stationery-book-input"
                        defaultValue={editingPromotion?.name || ""}
                        required
                        placeholder="Ví dụ: Giảm giá mùa hè"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-qr-code"></i>
                        MÃ CODE
                      </label>

                      <input
                        type="text"
                        name="code"
                        className="stationery-book-input text-uppercase fw-800"
                        defaultValue={editingPromotion?.code || ""}
                        required
                        placeholder="SUMMER20"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-percent"></i>
                        GIẢM GIÁ (%)
                      </label>

                      <input
                        type="number"
                        name="discountPercent"
                        className="stationery-book-input fw-800"
                        defaultValue={editingPromotion?.discountPercent || ""}
                        required
                        min="1"
                        max="100"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-calendar-check"></i>
                        NGÀY BẮT ĐẦU
                      </label>

                      <input
                        type="date"
                        name="startDate"
                        className="stationery-book-input"
                        defaultValue={editingPromotion?.startDate ? editingPromotion.startDate.slice(0, 10) : ""}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-calendar-x"></i>
                        NGÀY KẾT THÚC
                      </label>

                      <input
                        type="date"
                        name="endDate"
                        className="stationery-book-input"
                        defaultValue={editingPromotion?.endDate ? editingPromotion.endDate.slice(0, 10) : ""}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="stationery-book-label">
                        <i className="bi bi-text-paragraph"></i>
                        MÔ TẢ CHI TIẾT
                      </label>

                      <textarea
                        name="description"
                        className="stationery-book-input stationery-book-textarea"
                        rows="3"
                        defaultValue={editingPromotion?.description || ""}
                        placeholder="Nội dung khuyến mãi..."
                      ></textarea>
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

      <ConfirmModal
        show={confirmDelete.show}
        title="Xóa khuyến mãi"
        message="Hệ thống sẽ xóa vĩnh viễn mã khuyến mãi này. Bạn có chắc chắn muốn tiếp tục?"
        onConfirm={executeDelete}
        onCancel={closeDeleteConfirm}
        type="danger"
      />
    </div>
  );
};

export default AdminPromotions;