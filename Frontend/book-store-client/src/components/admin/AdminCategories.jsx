import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { apiRequest } from "../../services/apiClient";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";

import { categoryNameIsSouvenir } from "../../utils/souvenirsCatalog";
import { categoryNameIsAccessory } from "../../utils/accessoriesCatalog";
import { categoryNameIsToys } from "../../utils/toysCatalog";
import { categoryNameIsSchoolSupply } from "../../utils/schoolSuppliesCatalog";
import "../../styles/admin/AdminCategories.css";

const CATEGORY_TYPE_MAP = {
  books: "sach",
  stationery: "van-phong-pham",
  toys: "do-choi",
  souvenirs: "qua-luu-niem",
  school: "do-dung-hoc-tap",
  accessories: "phu-kien",
};

const TYPE_TO_TAB_MAP = {
  sach: "books",
  "van-phong-pham": "stationery",
  "do-choi": "toys",
  "qua-luu-niem": "souvenirs",
  "do-dung-hoc-tap": "school",
  "phu-kien": "accessories",
};

const TYPE_OPTIONS = [
  { value: "sach", label: "Sách" },
  { value: "van-phong-pham", label: "Văn phòng phẩm" },
  { value: "do-choi", label: "Đồ chơi" },
  { value: "qua-luu-niem", label: "Quà lưu niệm" },
  { value: "do-dung-hoc-tap", label: "Đồ dùng học tập" },
  { value: "phu-kien", label: "Phụ kiện" },
];

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const normalizeCategoryItem = (item) => ({
  ...item,
  id: item?.id ?? item?.Id,
  name: item?.name ?? item?.Name ?? "",
  description: item?.description ?? item?.Description ?? "",
  type: item?.type ?? item?.Type ?? "",
  createdAt: item?.createdAt ?? item?.CreatedAt,
  updatedAt: item?.updatedAt ?? item?.UpdatedAt,
  imageUrl: item?.imageUrl ?? item?.ImageUrl,
});

const AdminCategories = ({ categories = [], refresh }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get("tab") || "books";

  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    category: null,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_categories");
    return saved ? Number(saved) : 6;
  });

  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentType, setCurrentType] = useState(
    CATEGORY_TYPE_MAP[initialTab] || "sach"
  );

  const getCategoryGroup = (category) => {
    const item = normalizeCategoryItem(category);
    const type = normalizeText(item.type);
    const name = normalizeText(item.name);

    if (type === "sach" || type === "book" || type === "books") {
      return "books";
    }

    if (type === "van-phong-pham" || type === "stationery") {
      return "stationery";
    }

    if (type === "do-choi" || type === "toy" || type === "toys") {
      return "toys";
    }

    if (
      type === "qua-luu-niem" ||
      type === "souvenir" ||
      type === "souvenirs"
    ) {
      return "souvenirs";
    }

    if (
      type === "do-dung-hoc-tap" ||
      type === "school" ||
      type === "school-supplies"
    ) {
      return "school";
    }

    if (
      type === "phu-kien" ||
      type === "accessory" ||
      type === "accessories"
    ) {
      return "accessories";
    }

    const bookKeywords = [
      "sách",
      "truyện",
      "tham khảo",
      "ngoại ngữ",
      "từ điển",
      "tạp chí",
      "báo",
      "văn học",
      "kinh tế",
      "lập trình",
      "kỹ năng sống",
      "thiếu nhi",
      "tình cảm",
    ];

    if (bookKeywords.some((keyword) => name.includes(keyword))) {
      return "books";
    }

    if (categoryNameIsToys(name)) return "toys";
    if (categoryNameIsSouvenir(name)) return "souvenirs";
    if (categoryNameIsSchoolSupply(name)) return "school";
    if (categoryNameIsAccessory(name)) return "accessories";

    const stationeryKeywords = [
      "văn phòng phẩm",
      "văn phòng",
      "vpp",
      "sổ",
      "bút",
      "giấy",
      "sticker",
      "nhãn",
      "hộp bút",
      "băng keo",
      "hồ dán",
      "bìa",
      "file",
      "tài liệu",
      "hồ sơ",
      "kẹp",
      "ghim",
    ];

    if (stationeryKeywords.some((keyword) => name.includes(keyword))) {
      return "stationery";
    }

    return "books";
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchParams({ tab });
  };

  const removeDuplicateCategories = (list) => {
    const seen = new Map();

    for (const rawItem of list || []) {
      const item = normalizeCategoryItem(rawItem);
      const nameKey = normalizeText(item.name);

      if (!nameKey) continue;

      const group = getCategoryGroup(item);
      const key = `${group}-${nameKey}`;
      const existing = seen.get(key);

      if (!existing) {
        seen.set(key, item);
        continue;
      }

      const existingId = Number(existing.id || 0);
      const currentId = Number(item.id || 0);

      if (!existing.type && item.type) {
        seen.set(key, item);
        continue;
      }

      if (currentId > 0 && (existingId <= 0 || currentId < existingId)) {
        seen.set(key, item);
      }
    }

    return Array.from(seen.values());
  };

  const baseCategories = useMemo(() => {
    return removeDuplicateCategories(categories || []);
  }, [categories]);

  const filteredCategories = useMemo(() => {
    let list = [...baseCategories];

    if (activeTab !== "all") {
      list = list.filter((category) => getCategoryGroup(category) === activeTab);
    }

    const keyword = normalizeText(searchTerm);

    if (keyword) {
      list = list.filter((category) =>
        normalizeText(category.name).includes(keyword)
      );
    }

    return list;
  }, [baseCategories, searchTerm, activeTab]);

  const stats = useMemo(() => {
    const counts = {
      books: 0,
      stationery: 0,
      toys: 0,
      souvenirs: 0,
      school: 0,
      accessories: 0,
    };

    baseCategories.forEach((category) => {
      const group = getCategoryGroup(category);

      if (counts[group] !== undefined) {
        counts[group] += 1;
      } else {
        counts.books += 1;
      }
    });

    return {
      ...counts,
      total: baseCategories.length,
    };
  }, [baseCategories]);

  const redirectByCategoryType = (type) => {
    const nextTab = TYPE_TO_TAB_MAP[type] || "all";

    navigate(`/admin/categories?tab=${nextTab}`);
    setActiveTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

  const openCreateModal = () => {
    const defaultType = CATEGORY_TYPE_MAP[activeTab] || "sach";

    setEditingCat(null);
    setCurrentType(defaultType);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    const item = normalizeCategoryItem(category);

    setEditingCat(item);
    setCurrentType(item.type || CATEGORY_TYPE_MAP[activeTab] || "sach");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCat(null);
    setCurrentType(CATEGORY_TYPE_MAP[activeTab] || "sach");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.target);

      const payload = {
        Name: formData.get("name")?.trim() || "",
        Description: formData.get("description")?.trim() || "",
        Type: currentType || CATEGORY_TYPE_MAP[activeTab] || "sach",
      };

      if (!payload.Name) {
        showToast("Tên danh mục không được để trống", "error");
        return;
      }

      if (editingCat?.id) {
        await apiRequest(`/categories/${editingCat.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        showToast("Cập nhật danh mục thành công", "success");
      } else {
        await apiRequest("/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        showToast("Thêm danh mục thành công", "success");
      }

      closeModal();
      await refresh?.();
      redirectByCategoryType(payload.Type);
    } catch (error) {
      console.error("Save Category API Error:", error);
      showToast(error?.message || "Không thể lưu danh mục", "error");
    }
  };

  const handleDelete = (category) => {
    setConfirmDelete({
      show: true,
      category: normalizeCategoryItem(category),
    });
  };

  const executeDelete = async () => {
    try {
      const category = confirmDelete.category;

      if (!category?.id) {
        setConfirmDelete({ show: false, category: null });
        return;
      }

      await apiRequest(`/categories/${category.id}`, {
        method: "DELETE",
      });

      showToast("Đã xóa danh mục thành công", "success");
      await refresh?.();
    } catch (error) {
      console.error("Delete Category API Error:", error);
      showToast(
        "Không thể xóa danh mục này do có ràng buộc dữ liệu",
        "error"
      );
    } finally {
      setConfirmDelete({ show: false, category: null });
    }
  };

  useEffect(() => {
    if (!showModal) return;

    if (editingCat) {
      setCurrentType(editingCat.type || "sach");
    } else {
      setCurrentType(CATEGORY_TYPE_MAP[activeTab] || "sach");
    }
  }, [showModal, editingCat, activeTab]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeTab]);

  const formatDate = (dateStr) => {
    if (!dateStr || String(dateStr).includes("-infinity")) {
      return "Chưa cập nhật";
    }

    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const sortedCategories = useMemo(() => {
    const list = [...filteredCategories];

    list.sort((a, b) => {
      let first = a?.[sortKey] ?? "";
      let second = b?.[sortKey] ?? "";

      if (sortKey === "id") {
        first = Number(first || 0);
        second = Number(second || 0);
      } else if (typeof first === "string" && typeof second === "string") {
        first = first.toLowerCase();
        second = second.toLowerCase();
      }

      if (first < second) return sortDir === "asc" ? -1 : 1;
      if (first > second) return sortDir === "asc" ? 1 : -1;

      return 0;
    });

    return list;
  }, [filteredCategories, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedCategories.length / pageSize));

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

  const paginated = sortedCategories.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="admin-categories-portal animate-fade-in">
      <div className="pt-3 mt-2 px-4 pb-4">
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
          <div className="row align-items-center g-3">
            <div className="col-12">
              <div className="category-tabs-wrapper">
                <div className="category-tabs">
                  <button
                    type="button"
                    className={`btn-tab ${activeTab === "books" ? "active" : ""}`}
                    onClick={() => changeTab("books")}
                  >
                    Sách ({stats.books})
                  </button>

                  <button
                    type="button"
                    className={`btn-tab ${activeTab === "stationery" ? "active" : ""}`}
                    onClick={() => changeTab("stationery")}
                  >
                    Văn phòng phẩm ({stats.stationery})
                  </button>

                  <button
                    type="button"
                    className={`btn-tab ${activeTab === "toys" ? "active" : ""}`}
                    onClick={() => changeTab("toys")}
                  >
                    Đồ chơi ({stats.toys})
                  </button>

                  <button
                    type="button"
                    className={`btn-tab ${activeTab === "souvenirs" ? "active" : ""}`}
                    onClick={() => changeTab("souvenirs")}
                  >
                    Quà lưu niệm ({stats.souvenirs})
                  </button>

                  <button
                    type="button"
                    className={`btn-tab ${activeTab === "school" ? "active" : ""}`}
                    onClick={() => changeTab("school")}
                  >
                    Đồ dùng học tập ({stats.school})
                  </button>

                  <button
                    type="button"
                    className={`btn-tab ${activeTab === "accessories" ? "active" : ""}`}
                    onClick={() => changeTab("accessories")}
                  >
                    Phụ kiện ({stats.accessories})
                  </button>

                  <button
                    type="button"
                    className={`btn-tab ${activeTab === "all" ? "active" : ""}`}
                    onClick={() => changeTab("all")}
                  >
                    Tất cả ({stats.total})
                  </button>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="modern-search-box">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm nhanh danh mục..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card stationery-table-card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-5">
          <div className="card-body p-0">
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom bg-light bg-opacity-50">
              <div className="d-flex align-items-center gap-2">
                <span className="sort-label text-dark">SẮP XẾP</span>

                <select
                  className="modern-select-blue"
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value)}
                >
                  <option value="name">Tên</option>
                  <option value="id">Mã ID</option>
                </select>

                <button
                  type="button"
                  className="btn-action-modern edit ms-1"
                  onClick={() =>
                    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                >
                  <i
                    className={`bi ${
                      sortDir === "asc"
                        ? "bi-sort-alpha-down"
                        : "bi-sort-alpha-up-alt"
                    }`}
                  ></i>
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary-premium rounded-3 px-4 py-2 fw-800 shadow-sm"
                onClick={openCreateModal}
              >
                <i className="bi bi-plus-circle me-2 fs-5"></i>
                Thêm mới
              </button>
            </div>

            <div className="table-scroll-x">
              <table className="table table-modern align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }} className="ps-4">STT</th>
                    <th style={{ width: '250px' }}>TÊN DANH MỤC</th>
                    <th style={{ width: '400px' }}>MÔ TẢ</th>
                    <th style={{ width: '120px' }} className="text-end pe-4">THAO TÁC</th>
                  </tr>
                </thead>

                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-5">
                        <i className="bi bi-folder-x fs-1 text-slate-200"></i>
                        <p className="text-slate-400 fw-800 mt-2">
                          KHÔNG TÌM THẤY DANH MỤC
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((category, index) => (
                      <tr key={`${category.id ?? "cat"}-${index}`}>
                        <td className="ps-4">
                          <div className="text-slate-900 mb-0">
                            {(page - 1) * pageSize + index + 1}
                          </div>
                        </td>

                        <td>
                          <div className="text-slate-900 mb-0">
                            {category.name}
                          </div>
                        </td>

                        <td>
                          <div
                            className="text-slate-600 fw-semibold small"
                            style={{
                              maxWidth: "400px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {category.description || "-"}
                          </div>
                        </td>

                        <td className="text-end pe-4">
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-action-modern edit"
                              onClick={() => openEditModal(category)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>

                            <button
                              type="button"
                              className="btn btn-action-modern delete"
                              onClick={() => handleDelete(category)}
                            >
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center p-4">
              <div className="pagination-info fw-bold-700 text-dark">
                Hiển thị {Math.min((page - 1) * pageSize + 1, filteredCategories.length)} –{" "}
                {Math.min(page * pageSize, filteredCategories.length)} trong tổng số{" "}
                {filteredCategories.length} danh mục
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
                      localStorage.setItem("adminPageSize_categories", newSize);
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
                    disabled={page === totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay-modern animate-fade-in">
          <div className="modal-content-modern animate-scale-in" style={{ width: '550px' }}>
            <form onSubmit={handleSave}>
              <div className="modal-header-modern px-4 py-3">
                <h5 className="modal-title text-dark mb-0 fw-900 d-flex align-items-center">
                  <i
                    className={`bi ${
                      editingCat ? "bi-pencil-square" : "bi-plus-circle-fill"
                    } me-3 text-primary`}
                  ></i>
                  {editingCat ? "Cập nhật" : "Thêm mới"}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>

              <div className="modal-body-modern p-4">
                <div className="row g-4">
                  <div className="col-12">
                    <label className="label-modern">
                      <i className="bi bi-tag-fill"></i>
                      Tên danh mục
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="form-control-modern"
                      defaultValue={editingCat?.name || ""}
                      required
                      placeholder="Ví dụ: Thước kẻ, Bút chữ A..."
                    />
                  </div>

                  <div className="col-12">
                    <label className="label-modern">
                      <i className="bi bi-grid-fill"></i>
                      Phân loại hàng
                    </label>
                    <select
                      name="type"
                      className="form-control-modern"
                      value={currentType}
                      onChange={(event) => setCurrentType(event.target.value)}
                    >
                      {TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="label-modern">
                      <i className="bi bi-text-paragraph"></i>
                      Mô tả tóm tắt
                    </label>
                    <textarea
                      name="description"
                      className="form-control-modern"
                      rows="4"
                      defaultValue={editingCat?.description || ""}
                      placeholder="Nhập mô tả ngắn gọn về nhóm sản phẩm này..."
                    ></textarea>
                  </div>
                </div>

                <div className="d-flex gap-3 mt-4">
                  <button
                    type="button"
                    className="btn btn-slate-modern flex-grow-1"
                    onClick={closeModal}
                  >
                    HỦY BỎ
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary-modern flex-grow-1"
                  >
                    <i className="bi bi-check2-circle me-2"></i>
                    LƯU 
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        show={confirmDelete.show}
        title="Xóa danh mục"
        message="Xóa danh mục này có thể ảnh hưởng đến hiển thị của các sản phẩm liên quan. Bạn có chắc chắn muốn thực hiện?"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ show: false, category: null })}
        type="danger"
      />
    </div>
  );
};

export default AdminCategories;