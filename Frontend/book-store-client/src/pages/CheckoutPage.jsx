import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../services/apiClient";
import { getImageUrl, formatBookPrice, FALLBACK_BOOK_IMAGE } from "../utils/bookDisplay.js";
import { showToast } from "../components/common/Toast.jsx";

function CheckoutPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [cart, setCart] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Shipping Info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  
  // Payment Info
  const [paymentMethod, setPaymentMethod] = useState("COD");
  
  const [error, setError] = useState(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      const a = JSON.parse(auth);
      if (a?.userId) {
        if (a.roleId !== 1) {
          showToast("Tài khoản nhân viên/quản trị không thể mua hàng trực tuyến", "error");
          navigate("/");
          return;
        }
        setUserId(a.userId);
      }
    } else {
      navigate("/login?redirect=/checkout");
    }
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [cartData, userData] = await Promise.all([
          apiRequest(`/carts/user/${userId}`),
          apiRequest(`/users/${userId}`)
        ]);
        
        setCart(cartData);
        setUser(userData);
        
        // Pre-fill form from user profile
        setFullName(userData.fullName || "");
        setPhone(userData.phoneNumber || "");
        setAddress(userData.address || "");
        
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const placeOrder = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    if (!fullName || !phone || !address) {
      showToast("Vui lòng nhập đầy đủ thông tin giao hàng", "error");
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      showToast("Giỏ hàng của bạn đang trống", "error");
      return;
    }

    setPlacing(true);
    setError(null);

    try {
      // 1. Create Order
      const orderPayload = {
        userId: userId,
        orderType: "Online",
        items: cart.items.map((it) => ({ 
          bookId: it.bookId, 
          toyId: it.toyId,
          stationeryId: it.stationeryId,
          schoolSupplyId: it.schoolSupplyId,
          accessoryId: it.accessoryId,
          souvenirId: it.souvenirId,
          quantity: it.quantity 
        })),
      };

      const createdOrder = await apiRequest(`/orders`, {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      // 2. Create Payment (Using the selected method)
      const paymentPayload = {
        orderId: createdOrder.id,
        amount: cart.totalAmount || 0,
        paymentMethod: paymentMethod, // COD, Bank, etc.
      };

      const createdPayment = await apiRequest(`/payments`, {
        method: "POST",
        body: JSON.stringify(paymentPayload),
      });

      // 3. Clear cart
      await apiRequest(`/carts/user/${userId}/clear`, { method: "DELETE" });
      window.dispatchEvent(new Event('cartUpdated'));

      showToast("Đặt hàng thành công!", "success");
      
      // Redirect to confirmation
      navigate(`/order-confirmation?orderId=${createdOrder.id}&paymentId=${createdPayment.id}`);
    } catch (err) {
      setError(err.message || String(err));
      showToast("Có lỗi xảy ra: " + err.message, "error");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted">Đang chuẩn bị đơn hàng...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h3 className="fw-bold mb-4">Giỏ hàng trống</h3>
        <Link to="/books" className="btn btn-primary rounded-pill px-4">Tiếp tục mua sắm</Link>
      </div>
    );
  }

  return (
    <div className="bg-light pb-5 pt-4">
      <div className="container">
        <div className="row g-4">
          {/* Main Content */}
          <div className="col-lg-8">
            <h2 className="fw-bold mb-4">Thanh toán đơn hàng</h2>
            
            {/* Step Indicators */}
            <div className="d-flex align-items-center mb-4 text-primary small fw-bold text-uppercase ls-wide">
              <span className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center me-2" style={{width:'24px', height:'24px'}}>1</span>
              Thông tin giao hàng
              <div className="flex-grow-1 border-bottom mx-3 border-primary opacity-25"></div>
              <span className="bg-white text-primary border border-primary rounded-circle d-inline-flex align-items-center justify-content-center me-2" style={{width:'24px', height:'24px'}}>2</span>
              Thanh toán & Hoàn tất
            </div>

            {/* Shipping Info Card */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-geo-alt text-primary"></i>
                Địa chỉ giao hàng
              </h5>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Họ và tên người nhận</label>
                  <input 
                    type="text" 
                    className="form-control bg-light border-0 py-2 rounded-3" 
                    placeholder="Nhập tên người nhận..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Số điện thoại</label>
                  <input 
                    type="tel" 
                    className="form-control bg-light border-0 py-2 rounded-3" 
                    placeholder="Nhập số điện thoại..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small">Địa chỉ nhận hàng</label>
                  <textarea 
                    className="form-control bg-light border-0 py-2 rounded-3" 
                    rows="2"
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  ></textarea>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small">Ghi chú cho đơn hàng (tùy chọn)</label>
                  <input 
                    type="text" 
                    className="form-control bg-light border-0 py-2 rounded-3" 
                    placeholder="VD: Giao giờ hành chính, gọi trước khi đến..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-credit-card text-primary"></i>
                Phương thức thanh toán
              </h5>
              
              <div className="payment-methods">
                <div 
                  className={`payment-method-item border rounded-4 p-3 mb-3 d-flex align-items-center cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-primary bg-primary-subtle' : 'border-light-subtle'}`}
                  onClick={() => setPaymentMethod('COD')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="form-check m-0">
                    <input 
                      className="form-check-input" 
                      type="radio" 
                      checked={paymentMethod === 'COD'} 
                      onChange={() => setPaymentMethod('COD')}
                    />
                  </div>
                  <div className="ms-3 d-flex align-items-center flex-grow-1">
                    <div className="bg-white rounded-3 p-2 me-3 shadow-sm border">
                      <i className="bi bi-cash-stack text-success fs-4"></i>
                    </div>
                    <div>
                      <div className="fw-bold">Thanh toán khi nhận hàng (COD)</div>
                      <div className="text-muted small">Thanh toán bằng tiền mặt khi shipper giao hàng đến</div>
                    </div>
                  </div>
                </div>

                <div 
                  className={`payment-method-item border rounded-4 p-3 mb-3 d-flex align-items-center cursor-pointer transition-all ${paymentMethod === 'Bank' ? 'border-primary bg-primary-subtle' : 'border-light-subtle'}`}
                  onClick={() => setPaymentMethod('Bank')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="form-check m-0">
                    <input 
                      className="form-check-input" 
                      type="radio" 
                      checked={paymentMethod === 'Bank'}
                      onChange={() => setPaymentMethod('Bank')}
                    />
                  </div>
                  <div className="ms-3 d-flex align-items-center flex-grow-1">
                    <div className="bg-white rounded-3 p-2 me-3 shadow-sm border">
                      <i className="bi bi-bank text-primary fs-4"></i>
                    </div>
                    <div>
                      <div className="fw-bold">Chuyển khoản ngân hàng</div>
                      <div className="text-muted small">Chuyển khoản qua ứng dụng ngân hàng hoặc quét mã QR</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Review (Mobile only/Secondary) */}
            <div className="card border-0 shadow-sm rounded-4 p-4 d-lg-none mb-4">
              <h5 className="fw-bold mb-3">Sản phẩm đã chọn</h5>
              {cart.items.map(item => (
                <div key={item.id} className="d-flex align-items-center gap-3 mb-3">
                  <img 
                    src={getImageUrl(item.productImageUrl)} 
                    alt={item.productTitle} 
                    className="rounded-2 border"
                    style={{width:'50px', height:'65px', objectFit:'cover'}}
                    onError={e => e.target.src = FALLBACK_BOOK_IMAGE}
                  />
                  <div className="flex-grow-1">
                    <div className="fw-bold small text-truncate" style={{maxWidth:'200px'}}>{item.productTitle}</div>
                    <div className="text-muted small">x{item.quantity}</div>
                  </div>
                  <div className="fw-bold small">{formatBookPrice(item.totalPrice)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="col-lg-4">
            <div className="sticky-top" style={{ top: '100px' }}>
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                <h5 className="fw-bold mb-4">Tóm tắt đơn hàng</h5>
                
                {/* Desktop Order Items List */}
                <div className="order-items-scroll mb-4 d-none d-lg-block" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {cart.items.map(item => (
                    <div key={item.id} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom border-light">
                      <div className="position-relative">
                        <img 
                          src={getImageUrl(item.productImageUrl)} 
                          alt={item.productTitle} 
                          className="rounded-3 border shadow-sm"
                          style={{width:'50px', height:'65px', objectFit:'cover'}}
                          onError={e => e.target.src = FALLBACK_BOOK_IMAGE}
                        />
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary border border-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-bold small text-truncate">{item.productTitle}</div>
                        <div className="text-primary fw-bold small">{formatBookPrice(item.unitPrice)}</div>
                      </div>
                      <div className="fw-bold small ms-2">{formatBookPrice(item.totalPrice)}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Tạm tính ({cart.items.length} sản phẩm)</span>
                    <span className="fw-bold">{formatBookPrice(cart.totalAmount)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phí vận chuyển</span>
                    <span className="text-success fw-bold">Miễn phí</span>
                  </div>
                  <div className="d-flex justify-content-between mb-4 pt-3 border-top border-light">
                    <span className="fs-5 fw-bold">Tổng thanh toán</span>
                    <span className="fs-4 fw-bold text-primary">{formatBookPrice(cart.totalAmount)}</span>
                  </div>
                </div>

                <button 
                  className="btn btn-primary btn-lg w-100 rounded-pill py-3 fw-bold shadow-sm mb-3 d-flex align-items-center justify-content-center gap-2"
                  onClick={placeOrder}
                  disabled={placing}
                >
                  {placing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-check"></i>
                      Xác nhận đặt hàng
                    </>
                  )}
                </button>
                
                <p className="text-muted text-center x-small mb-0 mt-2" style={{fontSize:'12px'}}>
                  Bằng việc nhấn "Xác nhận đặt hàng", bạn đồng ý với các <a href="#" className="text-decoration-none">Điều khoản & Điều kiện</a> của chúng tôi.
                </p>
              </div>

              {/* Security Badge */}
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
                <div className="d-flex align-items-center justify-content-center gap-2 text-success small fw-bold">
                  <i className="bi bi-shield-lock-fill"></i>
                  Thanh toán an toàn & bảo mật 100%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .bg-primary-subtle {
          background-color: #f0f7ff !important;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .transition-all {
          transition: all 0.2s ease-in-out;
        }
        .payment-method-item:hover {
          border-color: var(--bs-primary) !important;
        }
        .order-items-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .order-items-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .order-items-scroll::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .ls-wide {
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}

export default CheckoutPage;
