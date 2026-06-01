import { useCallback, useEffect, useMemo, useState } from "react";
import "../../styles/admin/AdminAuthors.css";

import { apiRequest } from "../../services/apiClient";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";

const DEFAULT_MANUFACTURER = {
  name: "",
  description: "",
  address: "",
  phone: "",
  email: "",
};

const getValue = (item, camelKey, pascalKey, fallback = "") => {
  return item?.[camelKey] ?? item?.[pascalKey] ?? fallback;
};



function AdminManufacturers() {
  const [manufacturers, setManufacturers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_manufacturers");
    return saved ? Number(saved) : 6;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    item: null,
  });

  const loadManufacturers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/manufacturers");
      setManufacturers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch manufacturers error:", err);
      setError(err?.message || "Không thể tải danh sách nhà sản xuất");
      setManufacturers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManufacturers();
  }, [loadManufacturers]);

  const filteredManufacturers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return manufacturers.filter((item) => {
      const name = String(getValue(item, "name", "Name", "")).toLowerCase();
      const description = String(
        getValue(item, "description", "Description", "")
      ).toLowerCase();
      const address = String(
        getValue(item, "address", "Address", "")
      ).toLowerCase();
      const phone = String(getValue(item, "phone", "Phone", "")).toLowerCase();
      const email = String(getValue(item, "email", "Email", "")).toLowerCase();

      return (
        !keyword ||
        name.includes(keyword) ||
        description.includes(keyword) ||
        address.includes(keyword) ||
        phone.includes(keyword) ||
        email.includes(keyword)
      );
    });
  }, [manufacturers, searchTerm]);

  const totalPages = Math.ceil(filteredManufacturers.length / pageSize);
  const paginatedManufacturers = filteredManufacturers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const manufacturerStats = useMemo(() => {
    const hasContact = manufacturers.filter((m) => {
      const email = getValue(m, "email", "Email", "");
      const phone = getValue(m, "phone", "Phone", "");
      return String(email || "").trim().length > 0 || String(phone || "").trim().length > 0;
    }).length;

    const missingContact = manufacturers.filter((m) => {
      const email = getValue(m, "email", "Email", "");
      const phone = getValue(m, "phone", "Phone", "");
      return String(email || "").trim().length === 0 && String(phone || "").trim().length === 0;
    }).length;

    return [
      {
        label: "Tổng NSX",
        value: manufacturers.length,
        icon: "bi-building",
        color: "#10b981",
      },
      {
        label: "Có liên hệ",
        value: hasContact,
        icon: "bi-telephone-check",
        color: "#3b82f6",
      },
      {
        label: "Thiếu liên hệ",
        value: missingContact,
        icon: "bi-exclamation-octagon",
        color: "#ef4444",
      },
      {
        label: "Đang hiển thị",
        value: filteredManufacturers.length,
        icon: "bi-eye-fill",
        color: "#f59e0b",
      },
    ];
  }, [manufacturers, filteredManufacturers.length]);

  const openAddModal = () => {
    setEditingManufacturer({ ...DEFAULT_MANUFACTURER });
    setShowModal(true);
  };

  const openEditModal = (manufacturer) => {
    setEditingManufacturer({
      id: getValue(manufacturer, "id", "Id", null),
      name: getValue(manufacturer, "name", "Name", ""),
      description: getValue(manufacturer, "description", "Description", ""),
      address: getValue(manufacturer, "address", "Address", ""),
      phone: getValue(manufacturer, "phone", "Phone", ""),
      email: getValue(manufacturer, "email", "Email", ""),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingManufacturer(null);
  };

  const openDeleteConfirm = (manufacturer) => {
    setConfirmDelete({
      show: true,
      item: manufacturer,
    });
  };

  const closeDeleteConfirm = () => {
    setConfirmDelete({
      show: false,
      item: null,
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
    };

    if (!payload.name) {
      showToast("Vui lòng nhập tên nhà sản xuất.", "error");
      return;
    }

    try {
      const isUpdate = Boolean(editingManufacturer?.id);
      const url = isUpdate ? `/manufacturers/${editingManufacturer.id}` : "/manufacturers";
      const method = isUpdate ? "PUT" : "POST";

      await apiRequest(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      showToast(
        isUpdate ? "Cập nhật nhà sản xuất thành công" : "Thêm nhà sản xuất thành công",
        "success"
      );

      await loadManufacturers();
      closeModal();
    } catch (err) {
      console.error("Save manufacturer error:", err);
      showToast(err?.message || "Không thể lưu nhà sản xuất", "error");
    }
  };

  const executeDelete = async () => {
    const id = getValue(confirmDelete.item, "id", "Id", null);

    if (!id) return;

    try {
      await apiRequest(`/manufacturers/${id}`, {
        method: "DELETE",
      });

      showToast("Đã xóa nhà sản xuất thành công", "success");

      await loadManufacturers();
      closeDeleteConfirm();
    } catch (err) {
      console.error("Delete manufacturer error:", err);
      showToast(err?.message || "Không thể xóa nhà sản xuất", "error");
      closeDeleteConfirm();
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
          <div className="spinner-border text-primary mx-auto mb-3" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>

          <h5 className="fw-bold mb-0">Đang tải danh sách nhà sản xuất...</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning rounded-4 border-0 shadow-sm">
          <strong>Không thể tải danh sách nhà sản xuất.</strong> Chi tiết: {error}

          <div className="mt-3">
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4"
              onClick={loadManufacturers}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-authors-page animate-fade-in pt-3 mt-2">

      <div className="row g-2 mb-3">
        {manufacturerStats.map((stat, index) => (
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
            <div className="col-md-9">
              <div className="modern-search-box">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo tên, địa chỉ, số điện thoại, email..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="col-md-3 text-md-end">
              <button
                type="button"
                className="btn btn-primary-premium w-100 fw-bold h-100 rounded-3 shadow-sm"
                onClick={openAddModal}
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
                  <th className="ps-3">STT</th>
                  <th className="ps-4">Tên nhà sản xuất</th>
                  <th>Mô tả</th>
                  <th>Liên hệ</th>
                  <th className="action-col">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {paginatedManufacturers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <i className="bi bi-building-x fs-1 text-slate-200"></i>
                      <p className="text-slate-400 fw-bold mt-2">
                        Không tìm thấy nhà sản xuất nào
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedManufacturers.map((manufacturer, index) => {
                    const id = getValue(manufacturer, "id", "Id", index);
                    const name = getValue(manufacturer, "name", "Name", "");
                    const description = getValue(manufacturer, "description", "Description", "Chưa có mô tả");
                    const address = getValue(manufacturer, "address", "Address", "");
                    const phone = getValue(manufacturer, "phone", "Phone", "");
                    const email = getValue(manufacturer, "email", "Email", "");

                    return (
                      <tr key={id}>
                        <td className="ps-3 py-2">{(page - 1) * pageSize + index + 1}</td>

                        <td className="ps-3 py-2">
                          <div className="fw-800 text-slate-900 mb-0">{name}</div>
                          {address && (
                            <div className="small text-slate-400 fw-bold text-truncate" style={{ maxWidth: '200px' }}>
                              <i className="bi bi-geo-alt-fill me-1"></i>
                              {address}
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="text-slate-600 fw-semibold small text-truncate" style={{ maxWidth: '250px' }}>
                            {description || "Chưa có mô tả"}
                          </div>
                        </td>

                        <td>
                           <div className="d-flex flex-column gap-1">
                              {phone && (
                                <div className="small text-slate-600 fw-semibold">
                                  <i className="bi bi-telephone-fill me-1 text-slate-400"></i> {phone}
                                </div>
                              )}
                              {email && (
                                <div className="small text-slate-600 fw-semibold">
                                  <i className="bi bi-envelope-fill me-1 text-slate-400"></i> {email}
                                </div>
                              )}
                              {!phone && !email && (
                                <span className="small text-slate-400 fst-italic">Chưa có liên hệ</span>
                              )}
                           </div>
                        </td>

                        <td className="action-col">
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              onClick={() => openEditModal(manufacturer)}
                              title="Sửa nhà sản xuất"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>

                            <button
                              type="button"
                              className="action-btn delete-btn"
                              onClick={() => openDeleteConfirm(manufacturer)}
                              title="Xóa nhà sản xuất"
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
              Hiển thị {Math.min((page - 1) * pageSize + 1, filteredManufacturers.length)} –{" "}
              {Math.min(page * pageSize, filteredManufacturers.length)} trong tổng số{" "}
              {filteredManufacturers.length} nhà sản xuất
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
                    localStorage.setItem("adminPageSize_manufacturers", newSize);
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
          <div className="stationery-book-modal-card animate-scale-in" style={{ maxWidth: '800px' }}>
            <form onSubmit={handleSave} className="stationery-book-modal-form">
              <div className="stationery-book-modal-header">
                <div>
                  <h5 className="stationery-book-modal-title">
                    <i
                      className={`bi ${
                        editingManufacturer?.id
                          ? "bi-pencil-square"
                          : "bi-plus-circle-fill"
                      } me-2`}
                    ></i>
                    {editingManufacturer?.id ? "Cập nhật" : "Thêm mới"}
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

              <div className="stationery-book-modal-body" style={{ display: "block", flex: 1, overflowY: "auto" }}>
                 <div className="stationery-book-form-pane">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-building-fill"></i>
                        TÊN NHÀ SẢN XUẤT
                      </label>

                      <input
                        type="text"
                        name="name"
                        className="stationery-book-input"
                        defaultValue={editingManufacturer?.name || ""}
                        required
                        placeholder="Ví dụ: Thiên Long"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-telephone-fill"></i>
                        SỐ ĐIỆN THOẠI
                      </label>

                      <input
                        type="text"
                        name="phone"
                        className="stationery-book-input"
                        defaultValue={editingManufacturer?.phone || ""}
                        placeholder="Ví dụ: 0900000000"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-envelope-fill"></i>
                        EMAIL
                      </label>

                      <input
                        type="email"
                        name="email"
                        className="stationery-book-input"
                        defaultValue={editingManufacturer?.email || ""}
                        placeholder="Ví dụ: contact@thienlong.vn"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-geo-alt-fill"></i>
                        ĐỊA CHỈ
                      </label>

                      <input
                        type="text"
                        name="address"
                        className="stationery-book-input"
                        defaultValue={editingManufacturer?.address || ""}
                        placeholder="Ví dụ: Việt Nam"
                      />
                    </div>

                    <div className="col-12">
                      <label className="stationery-book-label">
                        <i className="bi bi-text-paragraph"></i>
                        MÔ TẢ
                      </label>

                      <textarea
                        name="description"
                        className="stationery-book-input stationery-book-textarea"
                        rows="4"
                        defaultValue={editingManufacturer?.description || ""}
                        placeholder="Nhập nội dung mô tả nhà sản xuất..."
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
        title="Xóa nhà sản xuất"
        message={`Bạn có chắc chắn muốn xóa "${
          getValue(confirmDelete.item, "name", "Name", "nhà sản xuất này")
        }"? Hành động này không thể hoàn tác.`}
        onConfirm={executeDelete}
        onCancel={closeDeleteConfirm}
        type="danger"
      />
    </div>
  );
}

export default AdminManufacturers;