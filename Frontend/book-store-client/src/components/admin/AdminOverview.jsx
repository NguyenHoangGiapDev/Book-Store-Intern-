import React from "react";
import { useNavigate } from "react-router-dom";
import { formatBookPrice } from "../../utils/bookDisplay";
import "../../styles/admin/AdminAuthors.css";

const AdminOverview = ({ data }) => {
  const navigate = useNavigate();
  const { stats, orders, books, users } = data;
  const auth = JSON.parse(localStorage.getItem("auth") || "{}");

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case "pending": return <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2 fw-bold border border-warning border-opacity-25"><i className="bi bi-hourglass-split me-1"></i>Chờ xác nhận</span>;
      case "processing": return <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-3 py-2 fw-bold border border-info border-opacity-25"><i className="bi bi-arrow-repeat me-1"></i>Đang xử lý</span>;
      case "shipping": return <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 fw-bold border border-primary border-opacity-25"><i className="bi bi-truck me-1"></i>Đang giao</span>;
      case "completed": return <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-bold border border-success border-opacity-25"><i className="bi bi-check2-circle me-1"></i>Thành công</span>;
      case "cancelled": return <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2 fw-bold border border-danger border-opacity-25"><i className="bi bi-x-circle me-1"></i>Đã hủy</span>;
      default: return <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-2 fw-bold border border-secondary border-opacity-25">{status}</span>;
    }
  };
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "Chào buổi sáng";
    if (hour >= 11 && hour < 14) return "Chào buổi trưa";
    if (hour >= 14 && hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <div className="admin-authors-page animate-fade-in px-2">
      {/* Welcome Banner - Premium Glassmorphism & Gradient */}
      <div className="welcome-card rounded-4 p-5 mb-4 position-relative overflow-hidden shadow-lg border-0 admin-overview-welcome-card">
        {/* Floating Shapes for Premium Feel */}
        <div className="position-absolute rounded-circle admin-overview-shape-1"></div>
        <div className="position-absolute rounded-circle admin-overview-shape-2"></div>
        
        <div className="position-relative z-1">
           <h2 className="fw-900 mb-2 ls-tight" style={{ fontSize: '2.2rem' }}>{getGreeting()}, <span className="text-dark" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{auth.fullName || 'Admin'}</span>! 👋</h2>
           <p className="opacity-75 mb-4 fs-5 fw-medium">Hệ thống đang hoạt động ổn định. Bạn có <span className="text-dark fw-bold text-decoration-underline">5 đơn hàng mới</span> cần xử lý trong hôm nay.</p>
           <div className="d-flex gap-3">
              <button onClick={() => navigate('/admin/shipping')} className="btn btn-outline-dark rounded-pill px-4 py-2 fw-800 d-flex align-items-center gap-2" style={{ border: '2px solid rgba(15,23,42,0.2)' }}>
                <i className="bi bi-cart-check-fill fs-5"></i> Xem đơn hàng
              </button>
              <button onClick={() => window.print()} className="btn btn-outline-dark rounded-pill px-4 py-2 fw-800 d-flex align-items-center gap-2" style={{ border: '2px solid rgba(15,23,42,0.2)' }}>
                <i className="bi bi-file-earmark-bar-graph fs-5"></i> Tạo báo cáo
              </button>
           </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
         {/* Main Chart Area */}
         <div className="col-lg-8">
            <div className="card stationery-table-card border-0 shadow-sm rounded-4 mb-4 h-100">
               <div className="card-header bg-white py-4 px-4 d-flex justify-content-between align-items-center border-bottom border-slate-100">
                  <h5 className="fw-800 mb-0 text-slate-800 d-flex align-items-center gap-2">
                     <i className="bi bi-bar-chart-line-fill text-primary"></i> Biểu đồ doanh thu theo tuần
                  </h5>
                  <div className="dropdown">
                     <button className="btn btn-light btn-sm rounded-pill px-3 fw-bold text-slate-600 d-flex align-items-center gap-2 shadow-sm admin-overview-date-picker" type="button">
                       7 ngày qua <i className="bi bi-chevron-down x-small"></i>
                     </button>
                  </div>
               </div>
               <div className="card-body px-4 pb-4 pt-5">
                  <div className="chart-wrapper rounded-4 p-4 d-flex align-items-end justify-content-around position-relative admin-overview-chart-container">
                     {/* Horizontal grid lines */}
                     <div className="position-absolute w-100 border-top border-slate-200" style={{ top: '25%' }}></div>
                     <div className="position-absolute w-100 border-top border-slate-200" style={{ top: '50%' }}></div>
                     <div className="position-absolute w-100 border-top border-slate-200" style={{ top: '75%' }}></div>

                     {[40, 65, 35, 90, 55, 80, 70].map((h, i) => (
                        <div key={i} className="bar-group d-flex flex-column align-items-center gap-2 position-relative z-1 admin-overview-bar-group">
                           <div className="bar-val x-small fw-900 text-primary bg-indigo-subtle px-2 py-1 rounded-2 shadow-sm transition-all admin-overview-bar-val">
                             {((h / 100) * 1200000).toLocaleString('vi-VN')} đ
                           </div>
                           <div className="bar bg-primary rounded-top-3 transition-all cursor-pointer admin-overview-bar" 
                                style={{ height: `${h}%`, width: '100%' }}>
                           </div>
                           <span className="small text-slate-500 fw-bold mt-2">{i === 6 ? 'CN' : `T${i+2}`}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar Area */}
         <div className="col-lg-4">
            <div className="card stationery-table-card border-0 shadow-sm rounded-4 h-100 p-4 d-flex flex-column">
               <h5 className="fw-800 mb-4 text-slate-800 d-flex align-items-center gap-2">
                 <i className="bi bi-pie-chart-fill text-warning"></i> Phân tích mục tiêu
               </h5>
               <div className="d-flex flex-column align-items-center mb-5 mt-2">
                  <div className="position-relative admin-overview-circular-wrapper">
                     <svg viewBox="0 0 36 36" className="circular-chart primary w-100 h-100 drop-shadow-md">
                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="circle" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                     </svg>
                     <div className="position-absolute top-50 start-50 translate-middle text-center">
                        <div className="fw-900 text-slate-900" style={{ fontSize: '2.5rem', letterSpacing: '-1px' }}>75%</div>
                        <div className="x-small text-slate-400 fw-800 ls-1">DOANH THU</div>
                     </div>
                  </div>
               </div>
               <div className="d-flex flex-column gap-4 flex-grow-1 justify-content-center">
                  {[
                    { label: "Sách & Tài liệu", val: 45, color: "#4f46e5" },
                    { label: "Văn phòng phẩm", val: 30, color: "#10b981" },
                    { label: "Sản phẩm khác", val: 25, color: "#f59e0b" }
                  ].map((item, idx) => (
                    <div key={idx}>
                       <div className="d-flex justify-content-between small mb-2">
                          <span className="text-slate-600 fw-bold d-flex align-items-center gap-2">
                             <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color, display: 'inline-block' }}></span>
                             {item.label}
                          </span>
                          <span className="fw-900 text-slate-800">{item.val}%</span>
                       </div>
                       <div className="progress rounded-pill bg-slate-100" style={{ height: '8px' }}>
                          <div className="progress-bar rounded-pill" style={{ width: `${item.val}%`, background: item.color }}></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Recent Orders Table */}
      <div className="card stationery-table-card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
         <div className="card-header bg-white py-4 px-4 d-flex justify-content-between align-items-center border-bottom border-slate-100">
            <h5 className="fw-800 mb-0 text-slate-800 d-flex align-items-center gap-2">
               <i className="bi bi-clock-history text-indigo"></i> Giao dịch gần đây
            </h5>
            <button className="btn btn-light btn-sm fw-bold text-indigo px-3 rounded-pill shadow-sm" style={{ border: '1px solid #e0e7ff', backgroundColor: '#eef2ff' }}>
              Xem tất cả <i className="bi bi-arrow-right ms-1"></i>
            </button>
         </div>
         <div className="card-body p-0">
            <div className="table-scroll-x">
              <table className="table table-modern table-dashboard align-middle mb-0">
                <thead>
                  <tr>
                    <th className="ps-4">STT</th>
                    <th>ID Đơn</th>
                    <th>Khách hàng</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th className="text-end pe-4">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders && orders.length > 0 ? orders.slice(0, 5) : [
                     { id: '1001', userId: 45, totalAmount: 450000, status: 'Pending' },
                     { id: '1002', userId: 12, totalAmount: 1250000, status: 'Completed' },
                     { id: '1003', userId: 88, totalAmount: 320000, status: 'Shipping' },
                     { id: '1004', userId: 3, totalAmount: 85000, status: 'Processing' },
                     { id: '1005', userId: 19, totalAmount: 650000, status: 'Cancelled' }
                  ]).map((o, idx) => (
                    <tr key={o.id}>
                      <td className="ps-4">
                        <div className="fw-800 text-slate-900">{idx + 1}</div>
                      </td>
                      <td>
                        <div className="fw-900 text-slate-900 bg-slate-50 d-inline-block px-2 py-1 rounded-2 border border-slate-200">
                          {o.id}
                        </div>
                      </td>
                      <td>
                         <div>
                            <div className="fw-800 text-slate-900">Khách hàng {o.userId}</div>
                         </div>
                      </td>
                      <td><div className="fw-900 text-indigo">{formatBookPrice(o.totalAmount)}</div></td>
                      <td>{getStatusBadge(o.status)}</td>
                      <td className="text-end pe-4">
                        <button className="btn btn-action-modern edit d-inline-flex" title="Chi tiết" style={{ backgroundColor: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                           <i className="bi bi-eye-fill"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>
      </div>
      
    </div>
  );
};

export default AdminOverview;
