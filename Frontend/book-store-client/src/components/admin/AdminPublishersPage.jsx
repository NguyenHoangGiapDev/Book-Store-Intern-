import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/apiClient";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";
import "../../styles/admin/AdminAuthors.css";

const emptyPublisher = {
  name: "",
  address: "",
  phone: "",
  email: "",
};
const getValue = (item, camelKey, pascalKey, fallback = "") => {
  return item?.[camelKey] ?? item?.[pascalKey] ?? fallback;
};
function AdminPublishersPage() {
  const [publishers, setPublishers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_publishers");
    return saved ? Number(saved) : 6;
  });
  const [editingPublisher, setEditingPublisher] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, item: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/publishers");
      setPublishers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch publishers error:", err);
      setError(err?.message || "Không thể tải danh sách nhà xuất bản");
      setPublishers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPublishers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return publishers.filter((publisher) => {
      const name = String(getValue(publisher, "name", "Name", "")).toLowerCase();
      const address = String(getValue(publisher, "address", "Address", "")).toLowerCase();
      const phone = String(getValue(publisher, "phone", "Phone", "")).toLowerCase();
      const email = String(getValue(publisher, "email", "Email", "")).toLowerCase();

      return (
        !keyword ||
        name.includes(keyword) ||
        address.includes(keyword) ||
        phone.includes(keyword) ||
        email.includes(keyword)
      );
    });
  }, [publishers, searchTerm]);

  const totalPages = Math.ceil(filteredPublishers.length / pageSize);
  const paginatedPublishers = filteredPublishers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const openAddModal = () => {
    setEditingPublisher(emptyPublisher);
    setShowModal(true);
  };

  const openEditModal = (publisher) => {
    setEditingPublisher({
      id: getValue(publisher, "id", "Id", null),
      name: getValue(publisher, "name", "Name", ""),
      address: getValue(publisher, "address", "Address", ""),
      phone: getValue(publisher, "phone", "Phone", ""),
      email: getValue(publisher, "email", "Email", ""),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPublisher(null);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
    };

    if (!payload.name) {
      showToast("Vui lòng nhập tên nhà xuất bản.", "error");
      return;
    }

    try {
      const isUpdate = Boolean(editingPublisher?.id);
      const url = isUpdate ? `/publishers/${editingPublisher.id}` : "/publishers";
      const method = isUpdate ? "PUT" : "POST";

      await apiRequest(url, {
        method,
        body: JSON.stringify(payload),
      });

      showToast(
        isUpdate ? "Cập nhật nhà xuất bản thành công" : "Thêm nhà xuất bản thành công",
        "success"
      );

      await loadData();
      closeModal();
    } catch (err) {
      console.error("Save publisher error:", err);
      showToast(err?.message || "Không thể lưu nhà xuất bản", "error");
    }
  };

  const openDeleteConfirm = (publisher) => {
    setConfirmDelete({ show: true, item: publisher });
  };

  const closeDeleteConfirm = () => {
    setConfirmDelete({ show: false, item: null });
  };

  const executeDelete = async () => {
    const id = getValue(confirmDelete.item, "id", "Id", null);

    if (!id) return;

    try {
      await apiRequest(`/publishers/${id}`, {
        method: "DELETE",
      });

      showToast("Đã xóa nhà xuất bản thành công", "success");
      await loadData();
      closeDeleteConfirm();
    } catch (err) {
      console.error("Delete publisher error:", err);
      showToast(err?.message || "Không thể xóa nhà xuất bản", "error");
      closeDeleteConfirm();
    }
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
        <div className="spinner-border text-primary mx-auto mb-3" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <h5 className="fw-bold mb-0">Đang tải danh sách nhà xuất bản...</h5>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning rounded-4 border-0 shadow-sm">
        <strong>Không thể tải danh sách nhà xuất bản.</strong> Chi tiết: {error}
        <div className="mt-3">
          <button type="button" className="btn btn-primary rounded-pill px-4" onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-authors-page animate-fade-in pt-3 mt-2">

      <div className="row g-2 mb-3">
        <div className="col-xl-3 col-md-6 d-flex">
          <div className="stat-card-modern stationery-stat-card p-2 rounded-3 shadow-sm bg-white border-0 position-relative d-flex align-items-center gap-3 w-100 h-100">
            <div className="icon-box-modern rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
              <i className="bi bi-building fs-5"></i>
            </div>
            <div className="flex-grow-1">
              <div className="label fw-bold text-slate-500 x-small text-uppercase mb-0">Tổng nhà xuất bản</div>
              <div className="value fw-800 fs-5 text-slate-900">{publishers.length}</div>
            </div>
            <div className="decoration-bar" style={{ background: "#10b981" }}></div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 d-flex">
          <div className="stat-card-modern stationery-stat-card p-2 rounded-3 shadow-sm bg-white border-0 position-relative d-flex align-items-center gap-3 w-100 h-100">
            <div className="icon-box-modern rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
              <i className="bi bi-eye-fill fs-5"></i>
            </div>
            <div className="flex-grow-1">
              <div className="label fw-bold text-slate-500 x-small text-uppercase mb-0">Đang hiển thị</div>
              <div className="value fw-800 fs-5 text-slate-900">{filteredPublishers.length}</div>
            </div>
            <div className="decoration-bar" style={{ background: "#f59e0b" }}></div>
          </div>
        </div>
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
                  placeholder="Tìm theo tên, địa chỉ, email..."
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
                <i className="bi bi-plus-circle me-1"></i> Thêm mới
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
                  <th className="ps-4">Tên nhà xuất bản</th>
                  <th>Địa chỉ</th>
                  <th>Số điện thoại</th>
                  <th>Email</th>
                  <th className="action-col">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {paginatedPublishers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <i className="bi bi-building-exclamation fs-1 text-slate-200"></i>
                      <p className="text-slate-400 fw-bold mt-2">Không tìm thấy nhà xuất bản nào</p>
                    </td>
                  </tr>
                ) : (
                  paginatedPublishers.map((publisher, index) => {
                    const id = getValue(publisher, "id", "Id", index);
                    const name = getValue(publisher, "name", "Name", "");
                    const address = getValue(publisher, "address", "Address", "Chưa cập nhật");
                    const phone = getValue(publisher, "phone", "Phone", "Chưa cập nhật");
                    const email = getValue(publisher, "email", "Email", "Chưa cập nhật");

                    return (
                      <tr key={id}>
                        <td className="ps-3 py-2 text-slate-500 fw-semibold">{(page - 1) * pageSize + index + 1}</td>
                        <td className="ps-3 py-2">
                          <div className="fw-800 text-slate-900">{name}</div>
                        </td>
                        <td><div className="text-slate-600 small fw-semibold">{address}</div></td>
                        <td><div className="text-slate-600 small fw-semibold">{phone}</div></td>
                        <td><div className="text-slate-600 small fw-semibold">{email}</div></td>
                        <td className="action-col">
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              onClick={() => openEditModal(publisher)}
                              title="Sửa"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              onClick={() => openDeleteConfirm(publisher)}
                              title="Xóa"
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
            <div className="pagination-info">
              Hiển thị {Math.min((page - 1) * pageSize + 1, filteredPublishers.length)} –{" "}
              {Math.min(page * pageSize, filteredPublishers.length)} trong tổng số{" "}
              {filteredPublishers.length} nhà xuất bản
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
                    localStorage.setItem("adminPageSize_publishers", newSize);
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
          <div className="stationery-book-modal-card animate-scale-in" style={{ maxWidth: '620px', width: '95%' }}>
            <form onSubmit={handleSave} className="stationery-book-modal-form">

              {/* Header */}
              <div className="stationery-book-modal-header">
                <div>
                  <h5 className="stationery-book-modal-title">
                    <i className={`bi ${editingPublisher?.id ? "bi-pencil-square" : "bi-plus-circle-fill"}`}></i>
                    {editingPublisher?.id ? "Cập nhật" : "Thêm mới"}
                  </h5>
                </div>
                <button type="button" className="stationery-book-modal-close" onClick={closeModal}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* Body */}
              <div className="stationery-book-modal-body" style={{ display: 'block', padding: '28px 28px 8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Tên NXB - full width */}
                  <div>
                    <label className="stationery-book-label">
                      <i className="bi bi-building-fill"></i> TÊN NHÀ XUẤT BẢN
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="stationery-book-input"
                      defaultValue={editingPublisher?.name || ""}
                      required
                      placeholder="Ví dụ: NXB Trẻ, NXB Kim Đồng..."
                    />
                  </div>

                  {/* Địa chỉ - full width */}
                  <div>
                    <label className="stationery-book-label">
                      <i className="bi bi-geo-alt-fill"></i> ĐỊA CHỈ
                    </label>
                    <input
                      type="text"
                      name="address"
                      className="stationery-book-input"
                      defaultValue={editingPublisher?.address || ""}
                      placeholder="Ví dụ: 161B Lý Chính Thắng, Q.3, TP.HCM"
                    />
                  </div>

                  {/* Phone + Email - 2 cột */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="stationery-book-label">
                        <i className="bi bi-telephone-fill"></i> SỐ ĐIỆN THOẠI
                      </label>
                      <input
                        type="text"
                        name="phone"
                        className="stationery-book-input"
                        defaultValue={editingPublisher?.phone || ""}
                        placeholder="028 3843 xxxx"
                      />
                    </div>
                    <div>
                      <label className="stationery-book-label">
                        <i className="bi bi-envelope-fill"></i> EMAIL
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="stationery-book-input"
                        defaultValue={editingPublisher?.email || ""}
                        placeholder="publisher@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="stationery-book-modal-footer">
                <button type="button" className="stationery-book-btn-cancel" onClick={closeModal}>
                  Hủy bỏ
                </button>
                <button type="submit" className="stationery-book-btn-save">
                  <i className="bi bi-check2-circle me-2"></i> Lưu
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        show={confirmDelete.show}
        title="Xóa nhà xuất bản"
        message={`Bạn có chắc chắn muốn xóa "${
          getValue(confirmDelete.item, "name", "Name", "nhà xuất bản này")
        }"? Hành động này không thể hoàn tác.`}
        onConfirm={executeDelete}
        onCancel={closeDeleteConfirm}
        type="danger"
      />
    </div>
  );
}

export default AdminPublishersPage;