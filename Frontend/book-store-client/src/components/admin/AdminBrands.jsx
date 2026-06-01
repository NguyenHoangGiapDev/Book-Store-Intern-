import { useCallback, useEffect, useMemo, useState } from "react";
import "../../styles/admin/AdminAuthors.css";

import { apiRequest } from "../../services/apiClient";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";

const EMPTY_BRAND = {
  name: "",
  description: "",
  phone: "",
  country: "",
  email: "",
};

const getValue = (item, camelKey, pascalKey, fallback = "") => {
  return item?.[camelKey] ?? item?.[pascalKey] ?? fallback;
};



function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_brands");
    return saved ? Number(saved) : 6;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    item: null,
  });

  const loadBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/brands");
      setBrands(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch brands error:", err);
      setError(err?.message || "Không thể tải danh sách thương hiệu");
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const filteredBrands = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return brands.filter((brand) => {
      const name = String(getValue(brand, "name", "Name", "")).toLowerCase();
      const description = String(
        getValue(brand, "description", "Description", "")
      ).toLowerCase();

      return !keyword || name.includes(keyword) || description.includes(keyword);
    });
  }, [brands, searchTerm]);

  const totalPages = Math.ceil(filteredBrands.length / pageSize);

  const paginatedBrands = filteredBrands.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const brandStats = useMemo(() => {
    const hasDescription = brands.filter((brand) => {
      const description = getValue(brand, "description", "Description", "");
      return String(description || "").trim().length > 0;
    }).length;

    const missingDescription = brands.filter((brand) => {
      const description = getValue(brand, "description", "Description", "");
      return String(description || "").trim().length === 0;
    }).length;

    return [
      {
        label: "Tổng thương hiệu",
        value: brands.length,
        icon: "bi-tags-fill",
        color: "#10b981",
      },
      {
        label: "Đã cập nhật",
        value: hasDescription,
        icon: "bi-card-checklist",
        color: "#3b82f6",
      },
      {
        label: "Cần bổ sung",
        value: missingDescription,
        icon: "bi-exclamation-octagon",
        color: "#ef4444",
      },
      {
        label: "Đang hiển thị",
        value: filteredBrands.length,
        icon: "bi-eye-fill",
        color: "#f59e0b",
      },
    ];
  }, [brands, filteredBrands.length]);

  const openAddModal = () => {
    setEditingBrand({ ...EMPTY_BRAND });
    setShowModal(true);
  };

  const openEditModal = (brand) => {
    setEditingBrand({
      id: getValue(brand, "id", "Id", null),
      name: getValue(brand, "name", "Name", ""),
      description: getValue(brand, "description", "Description", ""),
      phone: getValue(brand, "phone", "Phone", ""),
      country: getValue(brand, "country", "Country", ""),
      email: getValue(brand, "email", "Email", ""),
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBrand(null);
  };

  const openDeleteConfirm = (brand) => {
    setConfirmDelete({
      show: true,
      item: brand,
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
      phone: String(formData.get("phone") || "").trim(),
      country: String(formData.get("country") || "").trim(),
      email: String(formData.get("email") || "").trim(),
    };

    if (!payload.name) {
      showToast("Vui lòng nhập tên thương hiệu.", "error");
      return;
    }

    try {
      const isUpdate = Boolean(editingBrand?.id);
      const url = isUpdate ? `/brands/${editingBrand.id}` : "/brands";
      const method = isUpdate ? "PUT" : "POST";

      await apiRequest(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      showToast(
        isUpdate
          ? "Cập nhật thương hiệu thành công"
          : "Thêm thương hiệu thành công",
        "success"
      );

      await loadBrands();
      closeModal();
    } catch (err) {
      console.error("Save brand error:", err);
      showToast(err?.message || "Không thể lưu thương hiệu", "error");
    }
  };

  const executeDelete = async () => {
    const id = getValue(confirmDelete.item, "id", "Id", null);

    if (!id) return;

    try {
      await apiRequest(`/brands/${id}`, {
        method: "DELETE",
      });

      showToast("Đã xóa thương hiệu thành công", "success");

      await loadBrands();
      closeDeleteConfirm();
    } catch (err) {
      console.error("Delete brand error:", err);
      showToast(err?.message || "Không thể xóa thương hiệu", "error");
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

          <h5 className="fw-bold mb-0">Đang tải danh sách thương hiệu...</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning rounded-4 border-0 shadow-sm">
          <strong>Không thể tải danh sách thương hiệu.</strong> Chi tiết: {error}

          <div className="mt-3">
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4"
              onClick={loadBrands}
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
        {brandStats.map((stat, index) => (
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
                  placeholder="Tìm theo tên thương hiệu hoặc mô tả..."
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
                  <th className="ps-4">Tên thương hiệu</th>
                  <th>Mô tả</th>
                  <th>Quốc gia</th>
                  <th className="action-col">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {paginatedBrands.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <i className="bi bi-tags fs-1 text-slate-200"></i>
                      <p className="text-slate-400 fw-bold mt-2">
                        Không tìm thấy thương hiệu nào
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedBrands.map((brand, index) => {
                    const id = getValue(brand, "id", "Id", index);
                    const name = getValue(brand, "name", "Name", "");
                    const description = getValue(
                      brand,
                      "description",
                      "Description",
                      "Chưa có mô tả"
                    );
                    const createdAt = getValue(
                      brand,
                      "createdAt",
                      "CreatedAt",
                      ""
                    );

                    return (
                      <tr key={id}>
                        <td className="ps-3 py-2">
                          {(page - 1) * pageSize + index + 1}
                        </td>

                        <td className="ps-3 py-2">
                          <div className="fw-800 text-slate-900">{name}</div>
                        </td>

                        <td>
                          <div
                            className="text-slate-600 fw-semibold small text-truncate"
                            style={{ maxWidth: "360px" }}
                          >
                            {description || "Chưa có mô tả"}
                          </div>
                        </td>

                        <td>
                          <div className="text-slate-600 fw-semibold small">
                            {getValue(brand, "country", "Country", "Chưa cập nhật") || "Chưa cập nhật"}
                          </div>
                        </td>

                        <td className="action-col">
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              onClick={() => openEditModal(brand)}
                              title="Sửa thương hiệu"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>

                            <button
                              type="button"
                              className="action-btn delete-btn"
                              onClick={() => openDeleteConfirm(brand)}
                              title="Xóa thương hiệu"
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

        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 rounded-bottom-4">
            <div className="pagination-info">
              Hiển thị{" "}
              {Math.min(
                (page - 1) * pageSize + 1,
                filteredBrands.length
              )}{" "}
              – {Math.min(page * pageSize, filteredBrands.length)} trong
              tổng số {filteredBrands.length} thương hiệu
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
                    localStorage.setItem("adminPageSize_brands", newSize);
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
                        editingBrand?.id
                          ? "bi-pencil-square"
                          : "bi-plus-circle-fill"
                      } me-2`}
                    ></i>
                    {editingBrand?.id
                      ? "Cập nhật"
                      : "Thêm mới"}
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
                    {/* Hàng 1: Tên thương hiệu + Quốc gia */}
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-tag-fill"></i>
                        TÊN THƯƠNG HIỆU
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="stationery-book-input"
                        defaultValue={editingBrand?.name || ""}
                        required
                        placeholder="Ví dụ: Thiên Long, LEGO..."
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-globe2"></i>
                        QUỐC GIA
                      </label>
                      <input
                        type="text"
                        name="country"
                        className="stationery-book-input"
                        defaultValue={editingBrand?.country || ""}
                        placeholder="Ví dụ: Việt Nam, Nhật Bản..."
                      />
                    </div>

                    {/* Hàng 2: Số điện thoại + Email */}
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-telephone-fill"></i>
                        SỐ ĐIỆN THOẠI
                      </label>
                      <input
                        type="text"
                        name="phone"
                        className="stationery-book-input"
                        defaultValue={editingBrand?.phone || ""}
                        placeholder="Ví dụ: 028 3843 xxxx"
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
                        defaultValue={editingBrand?.email || ""}
                        placeholder="brand@example.com"
                      />
                    </div>

                    {/* Hàng 3: Mô tả - full width */}
                    <div className="col-12">
                      <label className="stationery-book-label">
                        <i className="bi bi-text-paragraph"></i>
                        MÔ TẢ
                      </label>
                      <textarea
                        name="description"
                        className="stationery-book-input stationery-book-textarea"
                        rows="3"
                        defaultValue={editingBrand?.description || ""}
                        placeholder="Nhập mô tả thương hiệu..."
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
        title="Xóa thương hiệu"
        message={`Bạn có chắc chắn muốn xóa "${
          getValue(confirmDelete.item, "name", "Name", "thương hiệu này")
        }"? Hành động này không thể hoàn tác.`}
        onConfirm={executeDelete}
        onCancel={closeDeleteConfirm}
        type="danger"
      />
    </div>
  );
}

export default AdminBrands;