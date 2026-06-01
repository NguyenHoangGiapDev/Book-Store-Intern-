import React from "react";
import { formatBookPrice } from "../../utils/bookDisplay";

const AdminInvoices = ({ orders }) => {
  const completedOrders = orders.filter(o => o.status === "Completed");

  return (
    <div className="animate-fade-in">
       <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white py-4 px-4 d-flex justify-content-between align-items-center">
             <h5 className="fw-bold mb-0">Quản lý Hóa đơn & Chứng từ</h5>
             <button className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm">
                <i className="bi bi-download me-2"></i>Xuất báo cáo tháng
             </button>
          </div>
          <div className="card-body p-0">
             <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                   <thead className="bg-light text-muted small text-uppercase fw-bold ls-wide">
                      <tr>
                         <th className="ps-4">Số hóa đơn</th>
                         <th>Ngày tạo</th>
                         <th>Khách hàng</th>
                         <th>Hình thức thanh toán</th>
                         <th>Tổng tiền</th>
                         <th className="text-end pe-4">Thao tác</th>
                      </tr>
                   </thead>
                   <tbody>
                      {completedOrders.length === 0 ? (
                         <tr>
                            <td colSpan="6" className="text-center py-5 text-muted italic">Chưa có hóa đơn nào được hoàn tất.</td>
                         </tr>
                      ) : completedOrders.map(o => (
                         <tr key={o.id}>
                            <td className="ps-4 fw-bold text-primary">INV-{o.id.toString().padStart(6, '0')}</td>
                            <td>{new Date().toLocaleDateString('vi-VN')}</td>
                            <td>{o.userId === 0 ? 'Khách lẻ (tại quầy)' : `Khách hàng #${o.userId}`}</td>
                            <td>
                               <span className="badge bg-light text-dark border rounded-pill px-3">
                                  {o.userId === 0 ? 'Tiền mặt' : 'Chuyển khoản'}
                               </span>
                            </td>
                            <td className="fw-bold text-success">{formatBookPrice(o.totalAmount)}</td>
                            <td className="text-end pe-4">
                               <button className="btn btn-sm btn-outline-dark rounded-pill px-3 fw-bold border">
                                  <i className="bi bi-printer me-2"></i>In hóa đơn
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

export default AdminInvoices;
