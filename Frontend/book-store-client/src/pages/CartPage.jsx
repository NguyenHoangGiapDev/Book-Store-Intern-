import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/apiClient';
import { showToast } from '../components/common/Toast.jsx';
import { getImageUrl, formatBookPrice, FALLBACK_BOOK_IMAGE } from '../utils/bookDisplay.js';

function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCart = async () => {
    try {
      const a = localStorage.getItem('auth');
      if (!a) {
        setError('Bạn cần đăng nhập để xem giỏ hàng.');
        setCart(null);
        return;
      }
      const auth = JSON.parse(a);
      const data = await apiRequest(`/carts/user/${auth.userId}`);
      setCart(data);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    const onCart = () => loadCart();
    window.addEventListener('cartUpdated', onCart);
    return () => window.removeEventListener('cartUpdated', onCart);
  }, []);

  const updateQty = async (cartItemId, qty) => {
    if (qty < 1) return;
    try {
      const a = JSON.parse(localStorage.getItem('auth'));
      await apiRequest(`/carts/user/${a.userId}/items/${cartItemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: qty }),
      });
      await loadCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      showToast(err.message || String(err), 'error');
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      const a = JSON.parse(localStorage.getItem('auth'));
      await apiRequest(`/carts/user/${a.userId}/items/${cartItemId}`, { method: 'DELETE' });
      await loadCart();
      window.dispatchEvent(new Event('cartUpdated'));
      showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'success');
    } catch (err) {
      showToast(err.message || String(err), 'error');
    }
  };

  const clearCart = async () => {
    try {
      const a = JSON.parse(localStorage.getItem('auth'));
      await apiRequest(`/carts/user/${a.userId}/clear`, { method: 'DELETE' });
      await loadCart();
      window.dispatchEvent(new Event('cartUpdated'));
      showToast('Đã làm trống giỏ hàng', 'success');
    } catch (err) {
      showToast(err.message || String(err), 'error');
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted">Đang tải giỏ hàng...</p>
      </div>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <div className="bg-light pb-5 pt-3" style={{ minHeight: '80vh' }}>
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted">Trang chủ</Link></li>
            <li className="breadcrumb-item active fw-medium text-dark" aria-current="page">Giỏ hàng của tôi</li>
          </ol>
        </nav>

        <h2 className="fw-bold mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-cart3 text-primary"></i>
          Giỏ hàng
          {!isEmpty && <span className="badge bg-primary rounded-pill fs-6 ms-2">{cart.items.length}</span>}
        </h2>

        {error && !isEmpty && <div className="alert alert-danger shadow-sm border-0 rounded-3 mb-4">{error}</div>}

        {isEmpty ? (
          <div className="card border-0 shadow-sm rounded-4 text-center p-5">
            <div className="mb-4">
              <i className="bi bi-cart-x text-muted" style={{ fontSize: '100px' }}></i>
            </div>
            <h4 className="fw-bold text-dark mb-3">Giỏ hàng của bạn đang trống</h4>
            <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
              Có vẻ như bạn chưa thêm bất kỳ sản phẩm nào vào giỏ hàng. Hãy khám phá kho sách của chúng tôi nhé!
            </p>
            <div>
              <Link to="/books" className="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-sm">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {/* Cart Items List */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-3">
                <div className="card-header bg-white py-3 border-bottom border-light">
                  <div className="row align-items-center">
                    <div className="col-6 col-md-7 fw-bold text-muted small text-uppercase ls-wide">Sản phẩm</div>
                    <div className="col-3 col-md-2 fw-bold text-muted small text-uppercase ls-wide text-center">Số lượng</div>
                    <div className="col-3 col-md-3 fw-bold text-muted small text-uppercase ls-wide text-end">Thành tiền</div>
                  </div>
                </div>
                <div className="card-body p-0">
                  {cart.items.map((item) => {
                    // Determine the correct link based on product type
                    let productLink = "/";
                    if (item.bookId) productLink = `/books/${item.bookId}`;
                    else if (item.toyId) productLink = `/toys/${item.toyId}`;
                    else if (item.stationeryId) productLink = `/stationery/${item.stationeryId}`;
                    else if (item.schoolSupplyId) productLink = `/school-supplies/${item.schoolSupplyId}`;
                    else if (item.accessoryId) productLink = `/accessories/${item.accessoryId}`;
                    else if (item.souvenirId) productLink = `/souvenirs/${item.souvenirId}`;

                    return (
                      <div key={item.id} className="p-3 p-md-4 border-bottom border-light cart-item-row transition-all hover-bg-light">
                        <div className="row align-items-center">
                          {/* Product Info */}
                          <div className="col-12 col-md-7 mb-3 mb-md-0">
                            <div className="d-flex align-items-center">
                              <Link to={productLink} className="flex-shrink-0 me-3">
                                <img
                                  src={getImageUrl(item.productImageUrl)}
                                  alt={item.productTitle}
                                  className="rounded-3 shadow-sm"
                                  style={{ width: '70px', height: '90px', objectFit: 'cover' }}
                                  onError={(e) => { e.target.src = FALLBACK_BOOK_IMAGE; }}
                                />
                              </Link>
                              <div>
                                <Link to={productLink} className="text-decoration-none text-dark fw-bold mb-1 d-block hover-text-primary">
                                  {item.productTitle}
                                </Link>
                                <div className="text-primary fw-bold small">{formatBookPrice(item.unitPrice)}</div>
                                <button
                                  className="btn btn-link p-0 text-danger text-decoration-none small mt-2 fw-medium d-flex align-items-center gap-1"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <i className="bi bi-trash3"></i> Xóa
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="col-6 col-md-2">
                            <div className="d-flex align-items-center justify-content-center">
                              <div className="input-group input-group-sm quantity-control" style={{ width: '100px' }}>
                                <button
                                  className="btn btn-outline-secondary border-light-subtle rounded-start-pill"
                                  onClick={() => updateQty(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <i className="bi bi-dash"></i>
                                </button>
                                <input
                                  type="text"
                                  className="form-control text-center border-light-subtle fw-bold"
                                  value={item.quantity}
                                  readOnly
                                />
                                <button
                                  className="btn btn-outline-secondary border-light-subtle rounded-end-pill"
                                  onClick={() => updateQty(item.id, item.quantity + 1)}
                                >
                                  <i className="bi bi-plus"></i>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Subtotal */}
                          <div className="col-6 col-md-3 text-end">
                            <div className="fw-bold text-dark fs-5">
                              {formatBookPrice(item.totalPrice)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-4">
                <Link to="/books" className="btn btn-outline-primary rounded-pill px-4 fw-bold">
                  <i className="bi bi-arrow-left me-2"></i> Tiếp tục mua sắm
                </Link>
                <button className="btn btn-link text-muted text-decoration-none fw-medium" onClick={clearCart}>
                  <i className="bi bi-trash3 me-1"></i> Xóa sạch giỏ hàng
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: '100px' }}>
                <h5 className="fw-bold mb-4">Tổng đơn hàng</h5>

                <div className="d-flex justify-content-between mb-3 pb-3 border-bottom border-light">
                  <span className="text-muted">Tạm tính ({cart.items.length} sản phẩm)</span>
                  <span className="fw-bold">{formatBookPrice(cart.totalAmount)}</span>
                </div>

                <div className="d-flex justify-content-between mb-3 pb-3 border-bottom border-light">
                  <span className="text-muted">Phí vận chuyển</span>
                  <span className="text-success fw-bold">Miễn phí</span>
                </div>

                <div className="d-flex justify-content-between mb-4 mt-2">
                  <span className="fs-5 fw-bold text-dark">Tổng tiền</span>
                  <span className="fs-4 fw-bold text-primary">{formatBookPrice(cart.totalAmount)}</span>
                </div>

                {(!JSON.parse(localStorage.getItem('auth')) || JSON.parse(localStorage.getItem('auth')).roleId === 1) ? (
                  <Link to="/checkout" className="btn btn-primary btn-lg w-100 rounded-pill py-3 fw-bold shadow-sm mb-3">
                    Tiến hành thanh toán
                  </Link>
                ) : (
                  <button className="btn btn-secondary btn-lg w-100 rounded-pill py-3 fw-bold shadow-sm mb-3" disabled>
                    Nhân viên không thể thanh toán
                  </button>
                )}
              </div>

              {/* Promo Code Card */}
              <div className="card border-0 shadow-sm rounded-4 p-3 mt-3 bg-white">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-ticket-perforated text-danger fs-4"></i>
                  <div className="flex-grow-1 fw-bold text-dark small">Mã giảm giá / Voucher</div>
                  <button className="btn btn-link p-0 text-decoration-none small fw-bold">Chọn mã</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .cart-item-row:last-child {
          border-bottom: none !important;
        }
        .hover-bg-light:hover {
          background-color: #f8f9fa;
        }
        .hover-text-primary:hover {
          color: var(--bs-primary) !important;
        }
        .ls-wide {
          letter-spacing: 0.5px;
        }
        .quantity-control .btn {
          background-color: white;
        }
        .quantity-control .btn:hover:not(:disabled) {
          background-color: #f0f0f0;
          color: black;
        }
        .quantity-control input {
          background-color: white !important;
        }
      `}</style>
    </div>
  );
}

export default CartPage;