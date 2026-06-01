import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/apiClient";
import { showToast } from "../components/common/Toast.jsx";
import {
  FALLBACK_BOOK_IMAGE,
  formatBookPrice,
  getImageUrl,
  bookCategoryId,
  bookCategoryName,
  shopSignals,
} from "../utils/bookDisplay.js";

function formatDate(value) {
  if (!value) return "Chưa có ngày";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function renderStars(value = 4.5) {
  const rating = Number(value || 0);

  return (
    <div className="d-flex align-items-center gap-1 text-warning">
      {[1, 2, 3, 4, 5].map((star) => {
        if (rating >= star) {
          return <i key={star} className="bi bi-star-fill"></i>;
        }

        if (rating >= star - 0.5) {
          return <i key={star} className="bi bi-star-half"></i>;
        }

        return <i key={star} className="bi bi-star"></i>;
      })}
    </div>
  );
}

export default function AccessoryDetailPage() {
  const { id: idParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const backHref = typeof location.state?.fromList === "string" ? location.state.fromList : "/accessories";

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tempRating, setTempRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewsList, setReviewsList] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const data = await apiRequest(`/reviews/product/${idParam}`);
      const mapped = (data || []).map((r) => ({
        id: r.id ?? r.Id,
        userName: r.customerName ?? r.CustomerName ?? "Khách hàng",
        rating: Number(r.rating ?? r.Rating ?? 5),
        text: r.comment ?? r.Comment ?? "",
        date: formatDate(r.createdAt ?? r.CreatedAt),
      }));
      setReviewsList(mapped);
    } catch (err) {
      console.error("Lỗi khi tải đánh giá:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    const a = localStorage.getItem("auth");
    if (!a) {
      showToast("Vui lòng đăng nhập để gửi đánh giá!", "warning");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
      return;
    }
    const auth = JSON.parse(a);
    const userId = Number(auth.userId);

    if (!userId || userId <= 0 || !Number.isInteger(userId)) {
      showToast("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại!", "error");
      localStorage.removeItem("auth");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
      return;
    }

    if (!comment.trim()) {
      showToast("Vui lòng nhập nội dung đánh giá!", "error");
      return;
    }

    try {
      const reviewPayload = {
        customerId: userId,
        customerName: auth.fullName || auth.username || "Khách hàng",
        bookId: Number(idParam),
        productTitle: item?.title || item?.name || "Phụ kiện",
        rating: tempRating,
        comment: comment,
      };

      await apiRequest(`/reviews`, {
        method: "POST",
        body: JSON.stringify(reviewPayload),
      });

      setComment("");
      setTempRating(5);
      showToast("Đánh giá của bạn đã được gửi và đang chờ phê duyệt!", "success");
      fetchReviews();
    } catch (err) {
      const msg = err.message || "Gửi đánh giá thất bại";
      if (msg.includes("đăng nhập lại")) {
        showToast(msg, "error");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        showToast(msg, "error");
      }
    }
  };

  const handleAddToCart = async () => {
    if (!item) return;

    const a = localStorage.getItem('auth');
    if (!a) {
      window.location.href = '/login';
      return;
    }
    const auth = JSON.parse(a);
    if (auth.roleId !== 1) {
      showToast('Tài khoản nhân viên/quản trị không thể mua hàng trực tuyến', 'error');
      return;
    }

    try {
      const payload = {
        UserId: Number(auth.userId),
        AccessoryId: Number(item.id || item.Id),
        Quantity: 1,
      };
      await apiRequest(`/carts/items`, { method: 'POST', body: JSON.stringify(payload) });
      window.dispatchEvent(new Event('cartUpdated'));
      showToast(`Đã thêm "${item.title || item.name}" vào giỏ hàng!`, "success");
    } catch (err) {
      showToast(err.message || "Không thể thêm vào giỏ hàng", "error");
    }
  };

  const idNum = Number(idParam);
  const idValid = Number.isFinite(idNum) && idNum > 0;

  useEffect(() => {
    if (!idValid) {
      setLoading(false);
      setError("Mã phụ kiện không hợp lệ.");
      setItem(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiRequest(`/accessories/${idNum}`)
      .then((data) => {
        if (!cancelled) {
          setItem(data);
          fetchReviews();
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItem(null);
          setError("Không tìm thấy phụ kiện hoặc không kết nối được máy chủ.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idNum, idValid]);

  if (loading) {
    return (
      <div className="books-page bg-light pb-5">
        <div className="container py-5">
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
            <div className="spinner-border text-success mx-auto mb-3"></div>
            <h5 className="fw-bold mb-0">Đang tải chi tiết phụ kiện...</h5>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="books-page bg-light pb-5">
        <div className="container py-4">
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-dark fw-medium">Trang chủ</Link></li>
              <li className="breadcrumb-item"><Link to={backHref} className="text-decoration-none text-dark fw-medium">Phụ kiện</Link></li>
              <li className="breadcrumb-item active text-truncate" style={{ maxWidth: "220px" }} aria-current="page">Chi tiết</li>
            </ol>
          </nav>

          <button type="button" className="btn btn-link text-success fw-bold p-0 mb-4 text-decoration-none" onClick={() => navigate(backHref)}>
            <i className="bi bi-arrow-left me-2"></i> Quay lại danh sách phụ kiện
          </button>

          <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
            <i className="bi bi-box-seam display-4 text-muted mb-3" />
            <h3 className="fw-bold mb-2">{error || "Không tìm thấy phụ kiện hoặc không kết nối được máy chủ."}</h3>
            <p className="text-muted mb-4">URL: /accessories/{idParam}</p>
            <Link to={backHref} className="btn btn-success rounded-pill px-5 fw-bold">Về danh sách phụ kiện</Link>
          </div>
        </div>
      </div>
    );
  }

  const { rating, reviews } = shopSignals(item);
  const title = item.title || item.name || "Sản phẩm phụ kiện";
  const stockQuantity = Number(item?.stockQuantity || 0);
  const outOfStock = stockQuantity === 0;
  const isAvailable = stockQuantity > 0;
  const categoryId = bookCategoryId(item);
  const categoryName = bookCategoryName(item) || "Phụ kiện";
  const brand = item.brand || item.manufacturer || item.author || item.vendor || "Đang cập nhật";

  return (
    <div className="books-page bg-light pb-5">
      <div className="container py-4">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-dark fw-medium">Trang chủ</Link></li>
            <li className="breadcrumb-item"><Link to={backHref} className="text-decoration-none text-dark fw-medium">Phụ kiện</Link></li>
            <li className="breadcrumb-item active text-truncate" style={{ maxWidth: "220px" }} aria-current="page">{title}</li>
          </ol>
        </nav>

        <button type="button" className="btn btn-link text-success fw-bold p-0 mb-4 text-decoration-none" onClick={() => navigate(backHref)}>
          <i className="bi bi-arrow-left me-2"></i> Quay lại danh sách phụ kiện
        </button>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
          <div className="row g-0">
            <div className="col-lg-5 bg-white p-4 p-lg-5 border-end">
              <div className="position-relative">
                {item.imageUrl ? (
                  <img
                    src={getImageUrl(item.imageUrl, title)}
                    alt={title}
                    className="w-100 rounded-4 shadow-sm"
                    onError={(e) => { e.currentTarget.src = FALLBACK_BOOK_IMAGE; }}
                    style={{
                      maxHeight: "560px",
                      objectFit: "cover",
                      background: "#f8f9fa",
                    }}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center bg-light rounded-4" style={{ height: "520px" }}>
                    <i className="bi bi-box-seam display-1 text-muted"></i>
                  </div>
                )}

                {stockQuantity > 0 && stockQuantity <= 5 && (
                  <span className="position-absolute top-0 start-0 m-3 badge rounded-pill bg-warning text-dark fw-bold px-3 py-2 shadow-sm">Sắp hết · {stockQuantity}</span>
                )}
                {outOfStock && (
                  <span className="position-absolute top-0 start-0 m-3 badge bg-secondary rounded-pill px-3 py-2 fw-bold shadow-sm">Hết hàng</span>
                )}

                <button type="button" className="btn btn-light rounded-circle shadow-sm position-absolute top-0 end-0 m-3" title="Yêu thích">
                  <i className="bi bi-heart"></i>
                </button>
              </div>
            </div>

            <div className="col-lg-7 p-4 p-lg-5 bg-white">
              <div className="mb-3">
                <span className="badge bg-success-subtle text-success-emphasis rounded-pill px-3 py-2 text-uppercase">
                  {categoryName}
                </span>
              </div>

              <h1 className="fw-bold mb-3 text-dark">{title}</h1>

              <div className="text-muted mb-3 d-flex flex-wrap gap-4">
                <div>
                  <i className="bi bi-tag me-2"></i>
                  Thương hiệu: <span className="fw-semibold text-dark">{brand}</span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 mb-4">
                {renderStars(rating)}
                <span className="fw-bold text-dark">{rating}</span>
                <span className="text-muted">({reviewsList.length} đánh giá)</span>
              </div>

              <div className="display-5 fw-bold text-success mb-1">
                {formatBookPrice(item.price)}
              </div>
              <div className="text-muted fw-semibold mb-4">ĐÃ GỒM VAT</div>

              <div className={`alert rounded-4 fw-bold mb-4 ${isAvailable ? "alert-success border-success-subtle" : "alert-danger border-danger-subtle"}`}>
                {isAvailable ? (
                  <><i className="bi bi-check-circle me-2"></i>Còn {stockQuantity} sản phẩm trong kho — giao nhanh 2–4 ngày</>
                ) : (
                  <><i className="bi bi-x-circle me-2"></i>Sản phẩm hiện đang hết hàng</>
                )}
              </div>

              <div className="d-flex flex-wrap gap-3 mb-4">
                <button type="button" className="btn btn-success rounded-pill px-5 fw-bold" disabled={!isAvailable} onClick={handleAddToCart}>
                  <i className="bi bi-cart-plus me-2"></i> Thêm vào giỏ
                </button>
                <button type="button" className="btn btn-outline-dark rounded-pill px-5 fw-bold" disabled={!isAvailable}>
                  Mua ngay
                </button>
              </div>

              <div className="text-success small fw-semibold mb-2">
                <i className="bi bi-truck me-2"></i> Freeship đơn từ <strong>199k</strong>
              </div>
              <div className="text-success small fw-semibold mb-4">
                <i className="bi bi-arrow-repeat me-2"></i> Đổi trả trong <strong>7 ngày</strong> nếu lỗi nhà sản xuất
              </div>

              <hr className="my-4" />

              <div>
                <h4 className="fw-bold mb-3">Thông tin mô tả</h4>
                <p className="text-muted mb-0" style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {item.description || item.Description || "Sản phẩm phụ kiện chất lượng cao."}
                </p>
              </div>

              <hr className="my-4" />

              <div>
                <h4 className="fw-bold mb-3">Thông tin chi tiết</h4>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <div className="text-muted small">Danh mục</div>
                      <div className="fw-bold">{categoryName}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <div className="text-muted small">Thương hiệu</div>
                      <div className="fw-bold">{brand}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <div className="text-muted small">Tồn kho</div>
                      <div className="fw-bold">{stockQuantity} sản phẩm</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <div className="text-muted small">Trạng thái</div>
                      <div className="fw-bold">{isAvailable ? "Sẵn hàng" : "Hết hàng"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-5" />

              <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-4">
                <h3 className="fw-bold mb-0">Đánh giá từ khách hàng</h3>
                <div className="d-flex align-items-center gap-2">
                  {renderStars(rating)}
                  <span className="fw-bold fs-5">{rating}/5</span>
                  <span className="text-muted">({reviewsList.length} đánh giá)</span>
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="bg-light rounded-4 p-4 shadow-sm mb-5">
                <h5 className="fw-bold mb-4">Viết đánh giá của bạn</h5>
                <div className="mb-3">
                  <div className="text-muted mb-2">Chất lượng sản phẩm</div>
                  <div className="d-flex gap-2 fs-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" className="btn p-0 border-0 bg-transparent" onClick={() => setTempRating(star)}>
                        <i className={`bi ${star <= tempRating ? "bi-star-fill text-warning" : "bi-star text-warning"}`}></i>
                      </button>
                    ))}
                  </div>
                </div>
                <textarea className="form-control border-0 rounded-4 p-3 mb-3" rows="4" placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..." value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
                <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold">Gửi đánh giá</button>
              </form>

              <div className="d-flex flex-column gap-4">
                {loadingReviews ? (
                  <div className="text-center py-4 bg-light rounded-4">
                    <div className="spinner-border text-success" />
                  </div>
                ) : reviewsList.length === 0 ? (
                  <div className="text-center py-4 bg-light rounded-4">
                    <p className="text-muted mb-0">Chưa có đánh giá nào cho sản phẩm này.</p>
                  </div>
                ) : (
                  reviewsList.map((rev) => (
                    <div key={rev.id || Math.random()} className="d-flex gap-3 pb-4 border-bottom last-border-0">
                      <div className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 50, height: 50 }}>
                        {(rev.userName || "K").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between gap-3 align-items-start mb-1">
                          <div>
                            <h6 className="fw-bold mb-1">{rev.userName || "Khách hàng"}</h6>
                            <div className="text-warning small">{renderStars(rev.rating)}</div>
                          </div>
                          <div className="text-muted" style={{ fontSize: "0.85rem" }}>{rev.date}</div>
                        </div>
                        <p className="text-slate-600 mb-0 mt-2 small">{rev.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
      <style>{` .cursor-pointer { cursor: pointer; } .last-border-0:last-child { border-bottom: 0 !important; } `}</style>
    </div>
  );
}
