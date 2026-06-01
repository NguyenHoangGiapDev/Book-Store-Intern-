import React, { useEffect, useMemo, useState } from "react";
import "../../styles/admin/AdminStationery.css";

import { apiRequest } from "../../services/apiClient";
import { formatBookPrice, getImageUrl, FALLBACK_BOOK_IMAGE } from "../../utils/bookDisplay";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";



const formatNumber = (value) => {
  return Number(value || 0).toLocaleString("vi-VN");
};

const formatDateTime = (value) => {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleString("vi-VN");
};

// Component chính cho quản lý sách
const AdminBooks = ({ books = [], categories = [], refresh }) => {
  const [publishers, setPublishers] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [salesSummary, setSalesSummary] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_books");
    return saved ? Number(saved) : 6;
  });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5005/api/books/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      setEditingBook((prev) => ({
        ...(prev || {}),
        imageUrl: result.imageUrl,
      }));
      showToast("Tải ảnh lên thành công!", "success");
    } catch (err) {
      console.error("Error uploading image:", err);
      showToast("Tải ảnh lên thất bại. Vui lòng thử lại!", "error");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
  const loadAuthors = async () => {
    try {
      const data = await apiRequest("/authors");
      setAuthors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load authors error:", err);
      setAuthors([]);
    }
  };

  loadAuthors();
}, []);

useEffect(() => {
  const loadPublishers = async () => {
    try {
      const data = await apiRequest("/publishers");
      setPublishers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load publishers error:", err);
      setPublishers([]);
    }
  };

  loadPublishers();
}, []);

  // Logic phân loại sách
  const isBookCategory = (cat) => {
    if (cat.type === "sach") return true;
    if (cat.type && cat.type !== "sach") return false;
    const n = (cat.name || "").toLowerCase();
    const excludeKeywords = ["văn phòng", "vpp", "đồ chơi", "dụng cụ", "phụ kiện", "quà lưu niệm"];
    if (excludeKeywords.some(k => n.includes(k))) return false;
    
    return n.includes("sách") || n.includes("truyện") || n.includes("văn học") || 
           n.includes("kiến thức") || n.includes("tạp chí") || n.includes("báo");
  };

    // lọc sách
  const bookListOnly = useMemo(() => {
    return books.filter(b => {
      // Find the category object to check its type/name properly
      const catObj = categories.find(c => c.id === b.categoryId || c.name === b.categoryName);
      if (catObj) return isBookCategory(catObj);
      
      const catName = (b.categoryName || "").toLowerCase();
      return catName.includes("sách") || catName.includes("truyện");
    });
  }, [books, categories]);

  // lọc danh mục sách
  const bookCategoriesOnly = useMemo(() => {
    return categories.filter(c => isBookCategory(c));
  }, [categories]);

  // Thống kê
  const stats = useMemo(() => {
    const totalBooks = bookListOnly.length;
    const outOfStock = bookListOnly.filter(b => b.stockQuantity === 0).length;
    const lowStock = bookListOnly.filter(b => b.stockQuantity > 0 && b.stockQuantity <= 10).length;
    const totalValue = bookListOnly.reduce((sum, b) => sum + (b.price * b.stockQuantity), 0);
    return { totalBooks, outOfStock, lowStock, totalValue };
  }, [bookListOnly]);

  // Lọc sách theo tìm kiếm và danh mục
  const filteredBooks = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return bookListOnly.filter((book) => {
      const matchesSearch =
        !keyword ||
        book.title?.toLowerCase().includes(keyword) ||
        book.author?.toLowerCase().includes(keyword);

      const matchesCategory =
        filterCategory === "all" ||
        Number(book.categoryId) === Number(filterCategory);

      return matchesSearch && matchesCategory;
    });
  }, [bookListOnly, searchTerm, filterCategory]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredBooks.length / pageSize);
  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBooks.slice(startIndex, startIndex + pageSize);
  }, [filteredBooks, currentPage, pageSize]);

  // Reset to first page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);
  // Thêm sách hoặc cập nhật sách
  const handleEdit = (book = null) => {
    setEditingBook(book);
    setShowEditModal(true);
  };

  const handleViewDetail = async (book) => {
  setSelectedBook(book);
  setShowDetailModal(true);
  setSalesSummary(null);
  setSalesLoading(true);

  try {
    const data = await apiRequest(`/books/${book.id}/sales-summary`);
    setSalesSummary(data);
  } catch (err) {
    console.error("Load book sales summary error:", err);

    setSalesSummary({
      totalSold: 0,
      soldToday: 0,
      soldThisMonth: 0,
      soldThisQuarter: 0,
      soldThisYear: 0,
      totalRevenue: 0,
      totalOrders: 0,
      totalBuyers: 0,
      onlineOrders: 0,
      offlineOrders: 0,
      topCustomers: [],
      recentPurchases: [],
    });
  } finally {
    setSalesLoading(false);
  }
};

const closeDetailModal = () => {
  setSelectedBook(null);
  setShowDetailModal(false);
};

  // Lưu sách
  const handleSaveBook = async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const bookData = Object.fromEntries(formData.entries());

  const categoryId = parseInt(
    bookData.categoryId || editingBook?.categoryId, 10
  );

  if (!categoryId) {
    showToast("Vui lòng chọn danh mục sách trước khi lưu", "error");
    return;
  }

  const price = parseFloat(bookData.price);
  const stockQuantity = parseInt(bookData.stockQuantity, 10);

  const payload = {
    Title: bookData.title?.trim() || "Sách mới",
    Author: bookData.author?.trim() || "Chưa có tác giả",
    Publisher: bookData.publisher?.trim() || null,
    Description: bookData.description?.trim() || null,
    ImageUrl: bookData.imageUrl?.trim() || null,
    Price: isNaN(price) ? 1000 : Math.max(0.01, price),
    StockQuantity: isNaN(stockQuantity) ? 0 : Math.max(0, stockQuantity),
    CategoryId: categoryId,
    Status: "Available"
  };

  console.log("Saving Book Payload:", payload);

  try {
    if (editingBook?.id) {
      await apiRequest(`/books/${editingBook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      showToast("Cập nhật thông tin sách thành công", "success");
    } else {
      await apiRequest("/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      showToast("Đã thêm đầu sách mới", "success");
    }

    await refresh?.();
    setShowEditModal(false);
    setEditingBook(null);
  } catch (err) {
    console.error("Book Save Error:", err);
    showToast("Lỗi hệ thống: Vui lòng kiểm tra các trường bắt buộc", "error");
  }
};
  // Xóa sách
  const handleDelete = (id) => {
    setConfirmDelete({ show: true, id });
  };
  // Thực hiện xóa sách
  const executeDelete = async () => {
    try {
      await apiRequest(`/books/${confirmDelete.id}`, { method: "DELETE" });
      showToast("Đã xóa sách thành công", "success");
      setConfirmDelete({ show: false, id: null });
      await refresh?.();
    } catch (err) {
      showToast("Không thể xóa sách do có ràng buộc dữ liệu", "error");
      setConfirmDelete({ show: false, id: null });
    }
  };
  return (
    <div className="admin-stationery-portal animate-fade-in">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-3">
      </div>

      {/* Thống kê sách */}
      <div className="row g-2 mb-3">
        {[
          { label: "Tổng đầu sách", value: stats.totalBooks, icon: "bi-book-half", color: "#10b981" },
          { label: "Hết hàng", value: stats.outOfStock, icon: "bi-exclamation-octagon", color: "#ef4444" },
          { label: "Sắp hết hàng", value: stats.lowStock, icon: "bi-hourglass-split", color: "#f59e0b" },
          { label: "Giá trị tồn kho", value: formatBookPrice(stats.totalValue), icon: "bi-cash-stack", color: "#3b82f6" }
        ].map((s, idx) => (
          <div className="col-xl-3 col-md-6 d-flex" key={idx}>
            <div className="stat-card-modern stationery-stat-card p-2 rounded-3 shadow-sm bg-white border-0 position-relative d-flex align-items-center gap-3 w-100 h-100">
               <div className="icon-box-modern rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
                  <i className={`bi ${s.icon} fs-5`}></i>
               </div>
               <div className="flex-grow-1">
                  <div className="label fw-bold text-slate-500 x-small text-uppercase mb-0">{s.label}</div>
                  <div className="value fw-800 fs-5 text-slate-900">{s.value}</div>
               </div>
               <div className="decoration-bar" style={{ background: s.color}}></div>
            </div>
          </div>
        ))}
      </div>
      {/* Khu vực lọc và bảng */}
      <div className="card stationery-table-card border-0 shadow-sm rounded-4 bg-white">
        <div className="card-header bg-white border-bottom border-slate-100 p-3">
           <div className="row g-3">
              <div className="col-md-5">
                 <div className="modern-search-box">
                    <i className="bi bi-search"></i>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Tìm theo tiêu đề, tác giả..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
              </div>
              <div className="col-md-4">
                <div className="stationery-filter-select-wrap">
                  <select
                    className="form-select modern-select stationery-filter-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">Tất cả danh mục</option>
                    {bookCategoriesOnly.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
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
                    className="btn btn-primary-premium w-100 fw-bold h-100 rounded-3 shadow-sm"
                    onClick={() => handleEdit()}
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
                  <th className="ps-4">Sản phẩm</th>
                  <th>Nhà xuất bản</th>
                  <th>Danh mục</th>
                  <th>Giá niêm yết</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th className="action-col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bookCategoriesOnly.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-4 bg-warning bg-opacity-10">
                       <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                       <span className="fw-bold text-dark">Cảnh báo: Chưa có danh mục sách. Vui lòng tạo danh mục trước khi thêm sách!</span>
                    </td>
                  </tr>
                )}
                {filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                       <i className="bi bi-journal-x fs-1 text-slate-200"></i>
                       <p className="text-slate-400 fw-bold mt-2">Không tìm thấy đầu sách nào</p>
                    </td>
                  </tr>
                ) : paginatedBooks.map((b, index) => (
                  <tr key={b.id}>
                    <td className="ps-3 py-2">
                       {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="ps-4 py-2">
                       <div className="d-flex align-items-center gap-3">
                          <div className="item-preview shadow-sm rounded-2 overflow-hidden border">
                             {b.imageUrl ? (
                               <img 
                                 src={getImageUrl(b.imageUrl, b.title)} 
                                 alt="" 
                                 onError={(e) => { e.currentTarget.src = FALLBACK_BOOK_IMAGE; }}
                               />
                             ) : (
                               <i className="bi bi-book text-slate-300"></i>
                             )}
                          </div>
                          <div>
                             <div className="fw-800 text-slate-900 mb-0">{b.title}</div>
                             <div className="small text-slate-400 fw-bold">{b.author}</div>
                          </div>
                       </div>
                    </td>
                     <td>
                        <div className="text-slate-600 fw-semibold small">{b.publisher || "Chưa cập nhật"}</div>
                     </td>
                     <td><span className="cat-badge">{b.categoryName}</span></td>
                    <td><div className="fw-800 text-indigo">{formatBookPrice(b.price)}</div></td>
                    <td>
                       <span
                          className={`fw-800 ${
                            b.stockQuantity === 0
                              ? "stock-text-danger"
                              : b.stockQuantity <= 10
                              ? "stock-text-warning"
                              : "stock-text-success"
                          }`}
                        >
                          {b.stockQuantity}
                        </span>
                    </td>
                    <td>
                    {b.stockQuantity === 0 ? (
                      <span className="status-pill out">HẾT HÀNG</span>
                    ) : b.stockQuantity <= 10 ? (
                      <span className="status-pill low">SẮP HẾT HÀNG</span>
                    ) : (
                      <span className="status-pill available">SẴN HÀNG</span>
                    )}
                  </td>
                  <td className="action-col">
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="action-btn view-btn"
                        onClick={() => handleViewDetail(b)}
                        title="Xem chi tiết"
                      >
                        <i className="bi bi-eye-fill"></i>
                      </button>

                      <button
                        type="button"
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(b)}
                        title="Sửa"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>

                      <button
                        type="button"
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(b.id)}
                        title="Xóa"
                      >
                        <i className="bi bi-trash3-fill"></i>
                      </button>
                    </div>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top border-slate-100 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="pagination-info fw-bold-700 text-dark">
                Hiển thị {Math.min(filteredBooks.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredBooks.length, currentPage * pageSize)} trong tổng số {filteredBooks.length} đầu sách
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
                    localStorage.setItem("adminPageSize_books", newSize);
                    setCurrentPage(1);
                  }}
                >
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <nav>
                <ul className="pagination pagination-modern mb-0 gap-2">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link rounded-3 border-0 shadow-sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                      <button className="page-link rounded-3 border-0 shadow-sm px-3" onClick={() => setCurrentPage(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link rounded-3 border-0 shadow-sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
            </div>
          </div>
        )}
      </div>

     {/* Edit Modal */}
{showEditModal && (
  <div className="modal-overlay-modern animate-fade-in">
    <div className="stationery-book-modal-card animate-scale-in">
      <form onSubmit={handleSaveBook} className="stationery-book-modal-form">
        <div className="stationery-book-modal-header">
          <div>
            <h5 className="stationery-book-modal-title">
              <i
                className={`bi ${
                  editingBook ? "bi-pencil-square" : "bi-plus-circle-fill"
                } me-2`}
              ></i>
              {editingBook ? "Cập nhật" : "Thêm mới"}
            </h5>
          </div>

          <button
            type="button"
            className="stationery-book-modal-close"
            onClick={() => {
              setShowEditModal(false);
              setEditingBook(null);
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="stationery-book-modal-body">
          <div className="stationery-book-preview-pane">
            <label className="stationery-book-label">
              <i className="bi bi-eye-fill"></i>
              Xem trước bìa sách
            </label>

            <div className="stationery-book-image-preview">
              {editingBook?.imageUrl ? (
                <img
                  src={getImageUrl(editingBook.imageUrl, editingBook.title)}
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
              Ảnh sẽ tự động hiển thị khi bạn nhập URL hoặc dán dữ liệu ảnh.
            </p>
          </div>

          <div className="stationery-book-form-pane">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="stationery-book-label">
                  <i className="bi bi-bookmark-fill"></i>
                  Tên đầu sách
                </label>

                <input
                  type="text"
                  name="title"
                  className="stationery-book-input"
                  defaultValue={editingBook?.title || ""}
                  required
                  placeholder="Ví dụ: Đắc Nhân Tâm"
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
                  defaultValue={editingBook?.categoryId || ""}
                  required
                >
                  <option value="" disabled>Chọn danh mục</option>
                  {bookCategoriesOnly.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="stationery-book-label">
                  <i className="bi bi-person-badge-fill"></i>
                  Tác giả
                </label>

                <select
                  name="author"
                  className="stationery-book-input"
                  defaultValue={editingBook?.author || ""}
                  required
                >
                  <option value="">Chọn tác giả</option>

                  {authors.map((author) => {
                    const id = author.id ?? author.Id;
                    const name = author.name ?? author.Name;

                    return (
                      <option key={id} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="col-md-6">
                <label className="stationery-book-label">
                  <i className="bi bi-building-fill"></i>
                  Nhà xuất bản
                </label>

                <select
                  name="publisher"
                  className="stationery-book-input"
                  defaultValue={editingBook?.publisher || ""}
                  required
                >
                  <option value="">Chọn nhà xuất bản</option>

                  {publishers.map((publisher) => {
                    const id = publisher.id ?? publisher.Id;
                    const name = publisher.name ?? publisher.Name;

                    return (
                      <option key={id} value={name}>
                        {name}
                      </option>
                    );
                  })}
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
                    defaultValue={editingBook?.price ?? ""}
                    required
                    min="0"
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
                  defaultValue={editingBook?.stockQuantity ?? ""}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>
              <div className="col-12">
                <label className="stationery-book-label">
                  <i className="bi bi-image"></i>
                  URL hình ảnh bìa sách
                </label>
                <div className="position-relative">
                  <span className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted" style={{ fontSize: "13px" }}>URL:</span>
                  <input
                    type="text"
                    name="imageUrl"
                    className="stationery-book-input w-100"
                    style={{ paddingLeft: "50px" }}
                    value={editingBook?.imageUrl || ""}
                    placeholder="Nhập hoặc dán địa chỉ liên kết ảnh tại đây..."
                    onChange={(event) =>
                      setEditingBook((prev) => ({
                        ...(prev || {}),
                        imageUrl: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="col-12">
                <label className="stationery-book-label">
                  <i className="bi bi-text-paragraph"></i>
                  Mô tả tóm tắt
                </label>

                <textarea
                  name="description"
                  className="stationery-book-input stationery-book-textarea"
                  rows="4"
                  defaultValue={editingBook?.description || ""}
                  placeholder="Nhập nội dung giới thiệu ngắn về sách..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="stationery-book-modal-footer">
          <button
            type="button"
            className="stationery-book-btn-cancel"
            onClick={() => {
              setShowEditModal(false);
              setEditingBook(null);
            }}
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
{showDetailModal && selectedBook && (
  <div className="modal-overlay-modern animate-fade-in">
    <div className="stationery-detail-modal animate-scale-in">
      <div className="stationery-detail-header">
        <div>
          <h5 className="stationery-detail-title">
            <i className="bi bi-eye-fill me-2"></i>
            Xem chi tiết
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
        <div className="stationery-detail-image-box">
          {selectedBook.imageUrl ? (
            <img src={getImageUrl(selectedBook.imageUrl, selectedBook.title)} alt={selectedBook.title} />
          ) : (
            <div className="stationery-detail-empty-image">
              <i className="bi bi-image"></i>
              <span>Chưa có ảnh</span>
            </div>
          )}
        </div>

        <div className="stationery-detail-info">
          <h3 className="stationery-detail-name">{selectedBook.title}</h3>

          <div className="stationery-detail-grid">
            <div className="stationery-detail-item">
              <span className="stationery-detail-label">Tác giả</span>
              <strong>{selectedBook.author || "Chưa cập nhật"}</strong>
            </div>

            <div className="stationery-detail-item">
              <span className="stationery-detail-label">Nhà xuất bản</span>
              <strong>{selectedBook.publisher || "Chưa cập nhật"}</strong>
            </div>

            <div className="stationery-detail-item">
              <span className="stationery-detail-label">Danh mục</span>
              <strong>{selectedBook.categoryName || "Chưa cập nhật"}</strong>
            </div>

            <div className="stationery-detail-item">
              <span className="stationery-detail-label">Giá bán</span>
              <strong className="text-indigo">
                {formatBookPrice(selectedBook.price)}
              </strong>
            </div>

            <div className="stationery-detail-item">
              <span className="stationery-detail-label">Tồn kho</span>
              <strong
                className={
                  selectedBook.stockQuantity === 0
                    ? "stock-text-danger"
                    : selectedBook.stockQuantity <= 10
                    ? "stock-text-warning"
                    : "stock-text-success"
                }
              >
                {selectedBook.stockQuantity}
              </strong>
            </div>

            <div className="stationery-detail-item">
              <span className="stationery-detail-label">Trạng thái</span>
              {selectedBook.stockQuantity === 0 ? (
                <span className="status-pill out">HẾT HÀNG</span>
              ) : selectedBook.stockQuantity <= 10 ? (
                <span className="status-pill low">SẮP HẾT HÀNG</span>
              ) : (
                <span className="status-pill available">SẴN HÀNG</span>
              )}
            </div>
          </div>

          <div className="stationery-detail-description">
            <span className="stationery-detail-label">Mô tả</span>
            <p>
              {selectedBook.description ||
                selectedBook.Description ||
                "Chưa có mô tả cho sản phẩm này."}
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

            {salesLoading ? (
              <div className="stationery-sales-loading">
                Đang tải thống kê bán hàng...
              </div>
            ) : (
              <div className="stationery-sales-grid">
                <div className="stationery-sales-card">
                  <span>Đã bán hôm nay</span>
                  <strong>{formatNumber(salesSummary?.soldToday)}</strong>
                </div>

                <div className="stationery-sales-card">
                  <span>Đã bán tháng này</span>
                  <strong>{formatNumber(salesSummary?.soldThisMonth)}</strong>
                </div>

                <div className="stationery-sales-card">
                  <span>Đã bán quý này</span>
                  <strong>{formatNumber(salesSummary?.soldThisQuarter)}</strong>
                </div>

                <div className="stationery-sales-card">
                  <span>Đã bán năm nay</span>
                  <strong>{formatNumber(salesSummary?.soldThisYear)}</strong>
                </div>

                <div className="stationery-sales-card">
                  <span>Tổng đã bán</span>
                  <strong>{formatNumber(salesSummary?.totalSold)}</strong>
                </div>

                <div className="stationery-sales-card">
                  <span>Tổng doanh thu</span>
                  <strong>{formatBookPrice(salesSummary?.totalRevenue || 0)}</strong>
                </div>

                <div className="stationery-sales-card">
                  <span>Số đơn hàng</span>
                  <strong>{formatNumber(salesSummary?.totalOrders)}</strong>
                </div>

                <div className="stationery-sales-card">
                  <span>Số người mua</span>
                  <strong>{formatNumber(salesSummary?.totalBuyers)}</strong>
                </div>

                <div className="stationery-sales-card">
                  <span>Đơn online</span>
                  <strong>{formatNumber(salesSummary?.onlineOrders)}</strong>
                </div>

                <div className="stationery-sales-card">
                  <span>Đơn offline</span>
                  <strong>{formatNumber(salesSummary?.offlineOrders)}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="stationery-customer-section">
            <h4>
              <i className="bi bi-people-fill me-2"></i>
              Khách hàng mua nhiều
            </h4>

            {salesSummary?.topCustomers?.length > 0 ? (
              <div className="stationery-customer-list">
                {salesSummary.topCustomers.map((customer, index) => (
                  <div
                    className="stationery-customer-row"
                    key={`${customer.customerId || index}-${customer.customerName}`}
                  >
                    <div>
                      <strong>{customer.customerName || "Khách lẻ"}</strong>
                      <span>
                        {customer.mainChannel || "Online"} ·{" "}
                        {formatNumber(customer.purchaseCount)} lần mua
                      </span>
                    </div>

                    <div className="text-end">
                      <strong>{formatNumber(customer.totalQuantity)}</strong>
                      <span>{formatBookPrice(customer.totalAmount || 0)}</span>
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

            {salesSummary?.recentPurchases?.length > 0 ? (
              <div className="stationery-history-list">
                {salesSummary.recentPurchases.map((purchase, index) => (
                  <div
                    className="stationery-history-row"
                    key={`${purchase.orderId || index}-${purchase.orderDate}`}
                  >
                    <div>
                      <strong>{purchase.customerName || "Khách lẻ"}</strong>
                      <span>{formatDateTime(purchase.orderDate)}</span>
                    </div>

                    <div className="text-end">
                      <strong>
                        {formatNumber(purchase.quantity)} sản phẩm ·{" "}
                        {purchase.channel || "Online"}
                      </strong>
                      <span>{formatBookPrice(purchase.totalAmount || 0)}</span>
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
            closeDetailModal();
            handleEdit(selectedBook);
          }}
        >
          <i className="bi bi-pencil-square me-2"></i>
          Sửa
        </button>
      </div>
    </div>
  </div>
)}

      {/* Custom Confirm Modal */}
      <ConfirmModal 
        show={confirmDelete.show}
        title="Xóa sách"
        message="Hệ thống sẽ xóa vĩnh viễn đầu sách này khỏi kho dữ liệu. Bạn có chắc chắn muốn tiếp tục?"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ show: false, id: null })}
        type="danger"
      />
    </div>
  );
};
export default AdminBooks;
