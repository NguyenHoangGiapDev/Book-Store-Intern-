import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { apiRequest } from "../services/apiClient";
import { formatBookPrice } from "../utils/bookDisplay.js";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function OrderConfirmationPage() {
  const q = useQuery();
  const orderId = q.get("orderId");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      apiRequest(`/orders/${orderId}`)
        .then(data => setOrder(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId]);

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-7">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              {/* Top Banner / Celebration */}
              <div className="bg-success bg-gradient py-5 text-center text-white position-relative overflow-hidden">
                <div className="celebration-circles"></div>
                <div className="position-relative z-1">
                  <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-4 shadow" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-check2 text-success fs-1"></i>
                  </div>
                  <h2 className="fw-bold mb-2">Đặt hàng thành công!</h2>
                  <p className="opacity-75 mb-0">Cám ơn bạn đã tin tưởng lựa chọn Book-Store</p>
                </div>
              </div>

              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-5">
                  <h5 className="text-muted mb-1">Mã đơn hàng của bạn là</h5>
                  <h3 className="fw-bold text-dark mb-0">{orderId || 'N/A'}</h3>
                </div>

                <div className="row g-4 mb-5">
                  <div className="col-sm-6">
                    <div className="p-3 border rounded-4 h-100 bg-light-subtle">
                      <div className="text-muted small text-uppercase fw-bold mb-2 ls-wide">Trạng thái</div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-warning text-dark rounded-pill px-3 py-2">Đang chờ xác nhận</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded-4 h-100 bg-light-subtle">
                      <div className="text-muted small text-uppercase fw-bold mb-2 ls-wide">Ngày đặt hàng</div>
                      <div className="fw-bold text-dark">
                        {order ? new Date(order.orderDate).toLocaleDateString('vi-VN', { 
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                        }) : 'Vừa xong'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracking Steps */}
                <div className="order-tracking mb-5">
                  <h6 className="fw-bold mb-4 text-center">Tiến trình đơn hàng</h6>
                  <div className="d-flex justify-content-between position-relative px-2">
                    <div className="tracking-line"></div>
                    <div className="tracking-step active">
                      <div className="step-dot"></div>
                      <span className="step-label">Đã đặt</span>
                    </div>
                    <div className="tracking-step">
                      <div className="step-dot"></div>
                      <span className="step-label text-muted">Đang đóng gói</span>
                    </div>
                    <div className="tracking-step">
                      <div className="step-dot"></div>
                      <span className="step-label text-muted">Đang vận chuyển</span>
                    </div>
                    <div className="tracking-step">
                      <div className="step-dot"></div>
                      <span className="step-label text-muted">Đã giao hàng</span>
                    </div>
                  </div>
                </div>

                {order && (
                  <div className="border-top pt-4 mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Chi tiết thanh toán</h6>
                      <span className="text-muted small">{order.orderDetails?.length || 0} sản phẩm</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Tổng cộng</span>
                      <span className="fw-bold text-dark">{formatBookPrice(order.totalAmount)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Phí vận chuyển</span>
                      <span className="text-success fw-bold">Miễn phí</span>
                    </div>
                    <div className="d-flex justify-content-between pt-2 mt-2 border-top border-light">
                      <span className="fs-5 fw-bold text-dark">Tổng tiền đã thanh toán</span>
                      <span className="fs-5 fw-bold text-primary">{formatBookPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                )}

                <div className="alert alert-info border-0 rounded-4 d-flex align-items-center gap-3 py-3 px-4 mb-5">
                  <i className="bi bi-info-circle-fill fs-4"></i>
                  <div className="small">
                    Chúng tôi đã gửi một email xác nhận kèm chi tiết đơn hàng đến hộp thư của bạn. Vui lòng kiểm tra (cả hòm thư Spam nếu cần).
                  </div>
                </div>

                <div className="d-grid d-md-flex justify-content-center gap-3">
                  <Link to="/profile?tab=orders" className="btn btn-outline-primary btn-lg rounded-pill px-5 fw-bold shadow-sm">
                    Xem đơn hàng
                  </Link>
                  <Link to="/" className="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-sm">
                    Về trang chủ
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-muted small mb-0">
                Bạn cần hỗ trợ? <Link to="/contact" className="text-decoration-none fw-bold">Liên hệ với chúng tôi</Link> hoặc gọi <strong>1900 1234</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ls-wide {
          letter-spacing: 0.5px;
        }
        .bg-success.bg-gradient {
          background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%) !important;
        }
        .celebration-circles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 20%),
                            radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 20%);
          opacity: 0.6;
        }
        .order-tracking {
          padding: 20px 0;
        }
        .tracking-line {
          position: absolute;
          top: 8px;
          left: 5%;
          right: 5%;
          height: 3px;
          background-color: #e9ecef;
          z-index: 0;
        }
        .tracking-step {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 25%;
        }
        .step-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: #dee2e6;
          border: 4px solid #fff;
          box-shadow: 0 0 0 1px #dee2e6;
          margin-bottom: 8px;
        }
        .tracking-step.active .step-dot {
          background-color: #28a745;
          box-shadow: 0 0 0 1px #28a745;
        }
        .step-label {
          font-size: 12px;
          font-weight: bold;
        }
        .tracking-step.active .step-label {
          color: #28a745;
        }
        .bg-light-subtle {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </div>
  );
}

export default OrderConfirmationPage;
