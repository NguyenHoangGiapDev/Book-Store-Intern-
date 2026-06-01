import React, { useEffect, useMemo, useState } from "react";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";
import "../../styles/admin/AdminAuthors.css";

const API_BASE_URL = "http://localhost:5005/api";

const REVIEW_STATUS = {
  approved: {
    key: "approved",
    label: "Đã phê duyệt",
    badge: "badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-bold border border-success border-opacity-25",
    icon: "bi-check2-circle",
  },
  pending: {
    key: "pending",
    label: "Đang chờ duyệt",
    badge: "badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2 fw-bold border border-warning border-opacity-25",
    icon: "bi-hourglass-split",
  },
  rejected: {
    key: "rejected",
    label: "Đã từ chối",
    badge: "badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2 fw-bold border border-danger border-opacity-25",
    icon: "bi-x-circle",
  },
};

function formatDate(value) {
  if (!value) return "Chưa có ngày";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}



function AdminReviews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_reviews");
    return saved ? Number(saved) : 6;
  });

  const fetchReviews = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await fetch(`${API_BASE_URL}/reviews`);
      if (!res.ok) throw new Error("Không lấy được dữ liệu đánh giá");
      const data = await res.json();
      const reviewList = Array.isArray(data) ? data : data.reviews || [];

      const mapped = reviewList.map((item) => ({
        id: item.id ?? item.Id,
        customerId: item.customerId ?? item.CustomerId,
        bookId: item.bookId ?? item.BookId,
        userName: item.customerName ?? item.CustomerName ?? "Khách hàng",
        productName: item.bookTitle ?? item.BookTitle ?? "Sản phẩm",
        rating: Number(item.rating ?? item.Rating ?? 0),
        content: item.comment ?? item.Comment ?? "",
        status: item.status ?? item.Status ?? "pending",
        createdAt: item.createdAt ?? item.CreatedAt,
      }));

      setReviews(mapped);
    } catch (error) {
      console.error(error);
      if (!isBackground) showToast("Không tải được đánh giá từ database", "error");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    const intervalId = setInterval(() => {
      fetchReviews(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((x) => (x.status || "").toLowerCase() === "pending").length;
    const approved = reviews.filter((x) => (x.status || "").toLowerCase() === "approved").length;
    const rejected = reviews.filter((x) => (x.status || "").toLowerCase() === "rejected").length;
    return { total, pending, approved, rejected };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((item) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchKeyword =
        !keyword ||
        (item.userName || "").toLowerCase().includes(keyword) ||
        (item.productName || "").toLowerCase().includes(keyword) ||
        (item.content || "").toLowerCase().includes(keyword);

      const status = (item.status || "").toLowerCase();
      const matchStatus = statusFilter === "all" || status === statusFilter;
      const matchRating = ratingFilter === "all" || Number(item.rating) === Number(ratingFilter);

      return matchKeyword && matchStatus && matchRating;
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [reviews, searchTerm, statusFilter, ratingFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize));
  const paginatedReviews = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, page, pageSize]);

  const handleRefresh = async () => {
    await fetchReviews();
    showToast("Đã làm mới dữ liệu đánh giá", "success");
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}/approve`, { method: "PUT" });
      if (!res.ok) throw new Error("Duyệt thất bại");
      await fetchReviews();
      setSelectedReview(null);
      showToast("Đã phê duyệt đánh giá", "success");
    } catch (error) {
      console.error(error);
      showToast("Lỗi khi phê duyệt", "error");
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}/reject`, { method: "PUT" });
      if (!res.ok) throw new Error("Từ chối thất bại");
      await fetchReviews();
      setSelectedReview(null);
      showToast("Đã từ chối đánh giá", "success");
    } catch (error) {
      console.error(error);
      showToast("Lỗi khi từ chối", "error");
    }
  };

  const handleDelete = async (id) => {
    setConfirmDelete({ show: true, id });
  };

  const executeDelete = async () => {
    const id = confirmDelete.id;
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa thất bại");
      await fetchReviews();
      setSelectedReview(null);
      setConfirmDelete({ show: false, id: null });
      showToast("Đã xóa đánh giá thành công", "success");
    } catch (error) {
      console.error(error);
      showToast("Lỗi khi xóa đánh giá", "error");
    }
  };

  return (
    <div className="admin-authors-page animate-fade-in pt-3 mt-2">

      {/* Analytics Dashboard */}
      <div className="row g-2 mb-3">
        {[
          { label: "Tổng đánh giá", value: stats.total, icon: "bi-chat-square-text", color: "#4f46e5" },
          { label: "Đang chờ duyệt", value: stats.pending, icon: "bi-hourglass-split", color: "#f59e0b" },
          { label: "Đã phê duyệt", value: stats.approved, icon: "bi-check2-circle", color: "#10b981" },
          { label: "Đã từ chối", value: stats.rejected, icon: "bi-x-circle", color: "#ef4444" }
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

              <div className="decoration-bar" style={{ background: s.color }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Table Area */}
      <div className="card stationery-table-card border-0 shadow-sm rounded-4 bg-white">
        <div className="card-header bg-white border-bottom border-slate-100 p-3">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="modern-search-box">
                <i className="bi bi-search"></i>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Tìm tên khách, sản phẩm, nội dung..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="position-relative d-flex align-items-center w-100 h-100">
                <select 
                  className="form-select w-100 h-100" 
                  style={{ 
                    minHeight: '48px', 
                    borderRadius: '14px', 
                    border: '1px solid #e2e8f0', 
                    color: '#0f172a', 
                    fontWeight: '600', 
                    paddingLeft: '16px',
                    paddingRight: statusFilter !== "all" ? '46px' : '36px'
                  }}
                  value={statusFilter} 
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Đang chờ duyệt</option>
                  <option value="approved">Đã phê duyệt</option>
                  <option value="rejected">Đã từ chối</option>
                </select>
                {statusFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("all");
                      setPage(1);
                    }}
                    className="btn p-0 border-0 position-absolute"
                    style={{
                      right: '34px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#475569'}
                    onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                    title="Xóa lọc"
                  >
                    <i className="bi bi-x-circle-fill" style={{ fontSize: '14px' }}></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <div className="position-relative d-flex align-items-center w-100 h-100">
                <select 
                  className="form-select w-100 h-100" 
                  style={{ 
                    minHeight: '48px', 
                    borderRadius: '14px', 
                    border: '1px solid #e2e8f0', 
                    color: '#0f172a', 
                    fontWeight: '600', 
                    paddingLeft: '16px',
                    paddingRight: ratingFilter !== "all" ? '46px' : '36px'
                  }}
                  value={ratingFilter} 
                  onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
                >
                  <option value="all">Tất cả số sao</option>
                  {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} sao</option>)}
                </select>
                {ratingFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setRatingFilter("all");
                      setPage(1);
                    }}
                    className="btn p-0 border-0 position-absolute"
                    style={{
                      right: '34px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#475569'}
                    onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                    title="Xóa lọc"
                  >
                    <i className="bi bi-x-circle-fill" style={{ fontSize: '14px' }}></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-scroll-x">
            <table className="table table-modern align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-3" style={{width: '60px'}}>STT</th>
                  <th style={{width: '20%'}}>Khách hàng</th>
                  <th style={{width: '20%'}}>Sản phẩm</th>
                  <th style={{width: '15%'}}>Đánh giá</th>
                  <th style={{width: '18%'}}>Nội dung</th>
                  <th style={{width: '15%'}}>Trạng thái</th>
                  <th className="action-col" style={{width: '150px'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReviews.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                       <i className="bi bi-chat-left-dots fs-1 text-slate-200 d-block mb-3"></i>
                       <p className="text-slate-400 fw-bold">Không tìm thấy đánh giá nào</p>
                    </td>
                  </tr>
                ) : paginatedReviews.map((review, idx) => {
                    const statusMeta = REVIEW_STATUS[review.status] || REVIEW_STATUS.pending;
                    return (
                      <tr key={review.id}>
                        <td className="ps-3 py-2">
                           <div className="fw-800 text-slate-900 mb-0">{(page - 1) * pageSize + idx + 1}</div>
                        </td>
                        <td>
                           <div>
                              <div className="fw-800 text-slate-900 mb-0">{review.userName}</div>
                              <div className="small text-slate-400 fw-bold">{formatDate(review.createdAt)}</div>
                           </div>
                        </td>
                        <td><div className="fw-800 text-primary small">{review.productName}</div></td>
                        <td>
                           <div>
                              {[1,2,3,4,5].map(s => (
                                 <i key={s} className={`bi bi-star-fill ${s <= review.rating ? 'text-warning' : 'text-slate-200'} me-1`}></i>
                              ))}
                           </div>
                        </td>
                        <td>
                           <div className="text-truncate text-slate-600 small" style={{maxWidth: '200px'}}>
                             {review.content || "Không có nội dung"}
                           </div>
                        </td>
                        <td>
                          <span className={statusMeta.badge}>
                            <i className={`bi ${statusMeta.icon} me-1`}></i>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="action-col" style={{width: '150px'}}>
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <button className="action-btn flex-shrink-0" style={{ background: '#eef2ff', color: '#4f46e5' }} onClick={() => setSelectedReview(review)} title="Xem chi tiết"><i className="bi bi-eye-fill"></i></button>
                            <div className="dropdown flex-shrink-0">
                              <button className="action-btn edit-btn dropdown-toggle no-caret" data-bs-toggle="dropdown" title="Duyệt / Từ chối">
                                 <i className="bi bi-shield-check"></i>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                                 <li><button className="dropdown-item small fw-bold text-success" onClick={() => handleApprove(review.id)} disabled={review.status === 'approved'}><i className="bi bi-check-lg me-2"></i>Phê duyệt</button></li>
                                 <li><button className="dropdown-item small fw-bold text-warning" onClick={() => handleReject(review.id)} disabled={review.status === 'rejected'}><i className="bi bi-x-lg me-2"></i>Từ chối</button></li>
                              </ul>
                            </div>
                            <button className="action-btn delete-btn flex-shrink-0" onClick={() => handleDelete(review.id)} title="Xóa"><i className="bi bi-trash3-fill"></i></button>
                          </div>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 rounded-bottom-4">
            <div className="pagination-info fw-bold-700 text-dark">
              Hiển thị {Math.min((page - 1) * pageSize + 1, filteredReviews.length)} –{" "}
              {Math.min(page * pageSize, filteredReviews.length)} trong tổng số{" "}
              {filteredReviews.length} đánh giá
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
                    localStorage.setItem("adminPageSize_reviews", newSize);
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

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="modal-overlay-modern animate-fade-in">
          <div className="stationery-book-modal-card animate-scale-in">
            <div className="stationery-book-modal-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="stationery-book-modal-title mb-0">
                  <i className="bi bi-chat-left-quote-fill me-2"></i>
                  Chi tiết đánh giá
                </h5>
              </div>
              <button type="button" className="stationery-book-modal-close" onClick={() => setSelectedReview(null)}><i className="bi bi-x-lg"></i></button>
            </div>

            <div className="stationery-book-modal-body">
              <div className="stationery-book-preview-pane bg-light rounded-4" style={{border: 'none'}}>
                <h6 className="fw-800 text-slate-800 mb-4 text-uppercase x-small ls-1">Thông tin cơ bản</h6>
                
                <div className="mb-4">
                  <div className="text-slate-400 x-small fw-bold text-uppercase mb-1">Khách hàng</div>
                  <div>
                     <div className="fw-800 text-slate-900">{selectedReview.userName}</div>
                     <div className="small text-slate-400 fw-bold">{formatDate(selectedReview.createdAt)}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-slate-400 x-small fw-bold text-uppercase mb-1">Sản phẩm</div>
                  <div className="fw-800 text-primary">{selectedReview.productName}</div>
                </div>

                <div className="mb-4">
                  <div className="text-slate-400 x-small fw-bold text-uppercase mb-1">Số sao</div>
                  <div className="mt-1">
                     {[1,2,3,4,5].map(s => (
                        <i key={s} className={`bi bi-star-fill fs-5 ${s <= selectedReview.rating ? 'text-warning' : 'text-slate-200'} me-1`}></i>
                     ))}
                  </div>
                </div>
              </div>

              <div className="stationery-book-form-pane d-flex flex-column">
                <h6 className="fw-800 text-slate-800 mb-3 text-uppercase x-small ls-1">Nội dung nhận xét</h6>
                <div className="p-4 rounded-4 bg-slate-50 border border-slate-200 flex-grow-1">
                  <p className="text-slate-700 mb-0" style={{lineHeight: '1.6', fontSize: '1rem'}}>
                     "{selectedReview.content || 'Không có nội dung văn bản.'}"
                  </p>
                </div>

                <div className="mt-4 p-3 rounded-4 bg-light d-flex gap-2">
                  <button 
                    className="btn btn-success flex-grow-1 fw-800 rounded-3 py-2" 
                    onClick={() => handleApprove(selectedReview.id)}
                    disabled={selectedReview.status === 'approved'}
                  >
                    <i className="bi bi-check-circle-fill me-2"></i>Phê duyệt
                  </button>
                  <button 
                    className="btn btn-warning flex-grow-1 fw-800 rounded-3 py-2 text-dark" 
                    onClick={() => handleReject(selectedReview.id)}
                    disabled={selectedReview.status === 'rejected'}
                  >
                    <i className="bi bi-x-circle-fill me-2"></i>Từ chối
                  </button>
                </div>
              </div>
            </div>

            <div className="stationery-book-modal-footer">
              <button type="button" className="stationery-book-btn-cancel" onClick={() => setSelectedReview(null)}>Đóng</button>
              <button type="button" className="stationery-book-btn-save bg-danger border-0" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 16px 32px rgba(220, 38, 38, 0.28)' }} onClick={() => { setSelectedReview(null); handleDelete(selectedReview.id); }}>
                <i className="bi bi-trash3-fill me-2"></i> Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        show={confirmDelete.show}
        title="Xóa đánh giá"
        message="Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ show: false, id: null })}
        type="danger"
      />
    </div>
  );
}

export default AdminReviews;