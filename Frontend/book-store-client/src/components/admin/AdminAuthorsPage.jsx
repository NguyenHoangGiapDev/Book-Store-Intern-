import { useCallback, useEffect, useMemo, useState } from "react";
import "../../styles/admin/AdminAuthors.css";

import { apiRequest } from "../../services/apiClient";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";

const EMPTY_AUTHOR = {
  name: "",
  penName: "",
  hometown: "",
  birthDate: "",
  nationality: "",
  imageUrl: "",
  description: "",
};

const getValue = (item, camelKey, pascalKey, fallback = "") => {
  return item?.[camelKey] ?? item?.[pascalKey] ?? fallback;
};



function AdminAuthorsPage() {
  const [authors, setAuthors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_authors");
    return saved ? Number(saved) : 6;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    item: null,
  });

  const loadAuthors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/authors");
      setAuthors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch authors error:", err);
      setError(err?.message || "Không thể tải danh sách tác giả");
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  const filteredAuthors = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return authors.filter((author) => {
      const name = String(getValue(author, "name", "Name", "")).toLowerCase();

      const description = String(
        getValue(
          author,
          "description",
          "Description",
          getValue(author, "bio", "Bio", "")
        )
      ).toLowerCase();

      return !keyword || name.includes(keyword) || description.includes(keyword);
    });
  }, [authors, searchTerm]);

  const totalPages = Math.ceil(filteredAuthors.length / pageSize);
  const paginatedAuthors = filteredAuthors.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const authorStats = useMemo(() => {
    const hasDescription = authors.filter((author) => {
      const description = getValue(
        author,
        "description",
        "Description",
        getValue(author, "bio", "Bio", "")
      );

      return String(description || "").trim().length > 0;
    }).length;

    const missingDescription = authors.filter((author) => {
      const description = getValue(
        author,
        "description",
        "Description",
        getValue(author, "bio", "Bio", "")
      );

      return String(description || "").trim().length === 0;
    }).length;

    return [
      {
        label: "Tổng tác giả",
        value: authors.length,
        icon: "bi-people-fill",
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
        value: filteredAuthors.length,
        icon: "bi-eye-fill",
        color: "#f59e0b",
      },
    ];
  }, [authors, filteredAuthors.length]);

  const openAddModal = () => {
    setEditingAuthor({ ...EMPTY_AUTHOR });
    setShowModal(true);
  };

  const openEditModal = (author) => {
  setEditingAuthor({
    id: getValue(author, "id", "Id", null),
    name: getValue(author, "name", "Name", ""),
    penName: getValue(author, "penName", "PenName", ""),
    hometown: getValue(author, "hometown", "Hometown", ""),
    birthDate: getValue(author, "birthDate", "BirthDate", ""),
    nationality: getValue(author, "nationality", "Nationality", ""),
    imageUrl: getValue(
      author,
      "imageUrl",
      "ImageUrl",
      getValue(author, "image", "Image", "")
    ),
    description: getValue(
      author,
      "description",
      "Description",
      getValue(author, "bio", "Bio", "")
    ),
  });

  setShowModal(true);
};

  const closeModal = () => {
    setShowModal(false);
    setEditingAuthor(null);
  };

  const openDeleteConfirm = (author) => {
    setConfirmDelete({
      show: true,
      item: author,
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
      Name: String(formData.get("name") || "").trim(),
      PenName: String(formData.get("penName") || "").trim(),
      Hometown: String(formData.get("hometown") || "").trim(),
      BirthDate: editingAuthor?.birthDate && String(editingAuthor.birthDate).trim() !== "" ? String(editingAuthor.birthDate).slice(0, 10) : null,
      Nationality: String(formData.get("nationality") || "").trim(),
      ImageUrl: editingAuthor?.imageUrl || "",
      Description: String(formData.get("description") || "").trim(),
      Bio: String(formData.get("description") || "").trim(),
    };

    if (!payload.Name) {
      showToast("Vui lòng nhập tên tác giả.", "error");
      return;
    }

    try {
      const isUpdate = Boolean(editingAuthor?.id);
      const url = isUpdate ? `/authors/${editingAuthor.id}` : "/authors";
      const method = isUpdate ? "PUT" : "POST";

      await apiRequest(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      showToast(
        isUpdate ? "Cập nhật tác giả thành công" : "Thêm tác giả thành công",
        "success"
      );

      await loadAuthors();
      closeModal();
    } catch (err) {
      console.error("Save author error:", err);
      showToast(err?.message || "Không thể lưu tác giả", "error");
    }
  };

  const executeDelete = async () => {
    const id = getValue(confirmDelete.item, "id", "Id", null);

    if (!id) return;

    try {
      await apiRequest(`/authors/${id}`, {
        method: "DELETE",
      });

      showToast("Đã xóa tác giả thành công", "success");

      await loadAuthors();
      closeDeleteConfirm();
    } catch (err) {
      console.error("Delete author error:", err);
      showToast(err?.message || "Không thể xóa tác giả", "error");
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

          <h5 className="fw-bold mb-0">Đang tải danh sách tác giả...</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning rounded-4 border-0 shadow-sm">
          <strong>Không thể tải danh sách tác giả.</strong> Chi tiết: {error}

          <div className="mt-3">
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4"
              onClick={loadAuthors}
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
        {authorStats.map((stat, index) => (
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
                  placeholder="Tìm theo tên tác giả hoặc mô tả..."
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
                  <th className="ps-4">Tên tác giả</th>
                  <th>Mô tả</th>
                  <th>Bút danh</th>
                  <th className="action-col">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {paginatedAuthors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <i className="bi bi-person-x fs-1 text-slate-200"></i>
                      <p className="text-slate-400 fw-bold mt-2">
                        Không tìm thấy tác giả nào
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedAuthors.map((author, index) => {
                    const id = getValue(author, "id", "Id", index);
                    const name = getValue(author, "name", "Name", "");
                    const penName = getValue(author, "penName", "PenName", "");
                    const imageUrl = getValue(author, "imageUrl", "ImageUrl", getValue(author, "image", "Image", ""));
                    const description = getValue(
                      author,
                      "description",
                      "Description",
                      getValue(author, "bio", "Bio", "Chưa có mô tả")
                    );

                    return (
                      <tr key={id}>
                        <td className="ps-3 py-2">{(page - 1) * pageSize + index + 1}</td>

                        <td className="ps-4 py-2">
                            <div>
                              <div className="fw-800 text-slate-900 mb-0">
                                {name}
                              </div>
                            </div>
                        </td>

                        <td>
                          <div className="text-slate-600 fw-semibold small text-truncate" style={{ maxWidth: '300px' }}>
                            {description || "Chưa có mô tả"}
                          </div>
                        </td>

                        <td>
                          <div className="text-slate-600 fw-semibold small">
                            {penName || "-"}
                          </div>
                        </td>

                        <td className="action-col">
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              onClick={() => openEditModal(author)}
                              title="Sửa tác giả"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>

                            <button
                              type="button"
                              className="action-btn delete-btn"
                              onClick={() => openDeleteConfirm(author)}
                              title="Xóa tác giả"
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
              Hiển thị {Math.min((page - 1) * pageSize + 1, filteredAuthors.length)} –{" "}
              {Math.min(page * pageSize, filteredAuthors.length)} trong tổng số{" "}
              {filteredAuthors.length} tác giả
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
                    localStorage.setItem("adminPageSize_authors", newSize);
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
                        editingAuthor?.id
                          ? "bi-pencil-square"
                          : "bi-plus-circle-fill"
                      } me-2`}
                    ></i>
                    {editingAuthor?.id ? "Cập nhật" : "Thêm  mới"}
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
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-person-badge-fill"></i>
                        TÊN TÁC GIẢ
                      </label>

                      <input
                        type="text"
                        name="name"
                        className="stationery-book-input"
                        defaultValue={editingAuthor?.name || ""}
                        required
                        placeholder="Ví dụ: Nguyễn Nhật Ánh"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-pencil-fill"></i>
                        BÚT DANH
                      </label>

                      <input
                        type="text"
                        name="penName"
                        className="stationery-book-input"
                        defaultValue={editingAuthor?.penName || ""}
                        placeholder="Ví dụ: Anh Bồ Câu"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-geo-alt-fill"></i>
                        QUÊ QUÁN
                      </label>

                      <input
                        type="text"
                        name="hometown"
                        className="stationery-book-input"
                        defaultValue={editingAuthor?.hometown || ""}
                        placeholder="Ví dụ: Quảng Nam"
                      />
                    </div>



                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-globe2"></i>
                        QUỐC TỊCH
                      </label>

                      <input
                        type="text"
                        name="nationality"
                        className="stationery-book-input"
                        defaultValue={editingAuthor?.nationality || ""}
                        placeholder="Ví dụ: Việt Nam"
                      />
                    </div>



                    <div className="col-12">
                      <label className="stationery-book-label">
                        <i className="bi bi-text-paragraph"></i>
                        MÔ TẢ TÓM TẮT
                      </label>

                      <textarea
                        name="description"
                        className="stationery-book-input stationery-book-textarea"
                        rows="5"
                        defaultValue={editingAuthor?.description || ""}
                        placeholder="Nhập nội dung giới thiệu ngắn về tác giả..."
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
        title="Xóa tác giả"
        message={`Bạn có chắc chắn muốn xóa "${
          getValue(confirmDelete.item, "name", "Name", "tác giả này")
        }"? Hành động này không thể hoàn tác.`}
        onConfirm={executeDelete}
        onCancel={closeDeleteConfirm}
        type="danger"
      />
    </div>
  );
}
export default AdminAuthorsPage;