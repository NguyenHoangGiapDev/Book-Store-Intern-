import React, { useState, useMemo } from "react";
import { apiRequest } from "../../services/apiClient";
import { formatBookPrice, getImageUrl, FALLBACK_BOOK_IMAGE } from "../../utils/bookDisplay";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";
import "../../styles/admin/AdminAuthors.css";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
};

const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const AdminOrders = ({ orders = [], refresh }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderUser, setSelectedOrderUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleOpenDetails = async (order) => {
    setLoadingDetails(true);
    setSelectedOrder(order);
    setSelectedOrderUser(null);
    setShowOrderModal(true);
    try {
      const fullOrder = await apiRequest(`/orders/${order.id}`);
      setSelectedOrder(fullOrder);

      const uId = fullOrder.userId || fullOrder.UserId;
      if (uId) {
        try {
          const user = await apiRequest(`/users/${uId}`);
          setSelectedOrderUser(user);
        } catch (e) {
          const allUsers = await apiRequest("/users").catch(() => []);
          const matched = allUsers.find(u => (u.id || u.Id) === uId);
          setSelectedOrderUser(matched || null);
        }
      }
    } catch (err) {
      console.error("Error loading order details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };
  const [activeTab, setActiveTab] = useState("all");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", message: "", onConfirm: () => {}, type: "warning" });

  const [revMonth, setRevMonth] = useState(new Date().getMonth() + 1);
  const [revQuarter, setRevQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [revYear, setRevYear] = useState(new Date().getFullYear());

  const uniqueYears = useMemo(() => {
    const years = new Set();
    for (let y = 2020; y <= 2030; y++) {
      years.add(y);
    }
    orders.forEach(o => {
      if (o.orderDate) {
        years.add(new Date(o.orderDate).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [orders]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const [filters, setFilters] = useState({ startDate: "", endDate: "", minPrice: "", maxPrice: "", paymentMethod: "all" });

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await apiRequest(`/orders/${orderId}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ Status: newStatus }) });
      showToast(`Cập nhật đơn hàng ORD-${orderId.toString().padStart(5, "0")} thành công`, "success");
      refresh?.();
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status: newStatus });
    } catch (err) { showToast("Lỗi khi cập nhật trạng thái", "error"); }
  };

  const handleDeleteOrder = (orderId) => {
    setConfirmConfig({ title: "Xác nhận xóa đơn hàng", message: `Bạn có chắc chắn muốn xóa đơn hàng ORD-${orderId.toString().padStart(5, "0")}? Thao tác này không thể hoàn tác.`, type: "danger", onConfirm: async () => {
      try {
        await apiRequest(`/orders/${orderId}`, { method: "DELETE" });
        showToast(`Đã xóa đơn hàng ORD-${orderId.toString().padStart(5, "0")} thành công`, "success");
        refresh?.();
        if (selectedOrder?.id === orderId) setShowOrderModal(false);
        setShowConfirm(false);
      } catch (err) { showToast("Lỗi khi xóa đơn hàng", "error"); }
    } });
    setShowConfirm(true);
  };

  const handlePrintInvoice = (order, user) => {
    if (!order) return;

    const orderId = order.id || order.Id || 0;
    const orderDate = order.orderDate || order.OrderDate;
    const detailsList = order.orderDetails || order.OrderDetails || [];
    const customerName = user ? (user.fullName || user.FullName) : (order.customerName || `Khách hàng ${order.userId}`);
    const customerEmail = user ? (user.email || user.Email) : (order.customerEmail || '');
    const customerPhone = user ? (user.phoneNumber || user.PhoneNumber) : (order.customerPhone || '');
    const customerAddress = user ? (user.address || user.Address) : (order.shippingAddress || '');

    const subtotal = Number(order.totalAmount || order.TotalAmount || 0);
    const shipping = subtotal > 200000 ? 0 : 30000;
    const total = subtotal + shipping;

    const itemsHtml = detailsList.map((it) => {
      const title = it.productTitle || it.ProductTitle || 'Sản phẩm';
      const qty = it.quantity || it.Quantity || 0;
      const uPrice = Number(it.unitPrice || it.UnitPrice || 0);
      const tPrice = Number(it.totalPrice || it.TotalPrice || (uPrice * qty));
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e6e6e6">${title}</td>
          <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:center">${qty}</td>
          <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right">${formatBookPrice(uPrice)}</td>
          <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right">${formatBookPrice(tPrice)}</td>
        </tr>
      `;
    }).join('\n');

    const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Hóa đơn ORD-${String(orderId).padStart(5, '0')}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111827; margin:0; padding:24px; background:#fff }
          .invoice { max-width:800px; margin:0 auto; }
          .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px }
          .company { font-weight:800; font-size:18px; color:#111827 }
          .meta { text-align:right; font-size:13px; color:#374151 }
          .section { background:#ffffff; border:1px solid #e6e6e6; border-radius:8px; padding:16px; margin-bottom:16px }
          table { width:100%; border-collapse:collapse; font-size:13px }
          th { text-align:left; padding:8px 8px 10px 8px; color:#374151; font-weight:700; font-size:12px }
          td { font-size:13px }
          .totals { width:100%; margin-top:12px }
          .totals td { padding:6px 8px; font-weight:700 }
          .right { text-align:right }
          @media print { body { margin:0; padding:0 } .no-print { display:none } }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div>
              <div class="company">Book Store</div>
              <div style="font-size:12px;color:#6b7280">Địa chỉ: 123 Đường sách, Quận 1, TP.HCM</div>
              <div style="font-size:12px;color:#6b7280">MST: 0123456789</div>
            </div>
            <div class="meta">
              <div style="font-size:16px;font-weight:800">HÓA ĐƠN BÁN HÀNG</div>
              <div>ORD-${String(orderId).padStart(5, '0')}</div>
              <div>${formatDate(orderDate)} ${formatTime(orderDate)}</div>
            </div>
          </div>

          <div class="section">
            <table>
              <tr>
                <td style="vertical-align:top; width:50%">
                  <div style="font-size:13px;font-weight:800;color:#111827">Thông tin người nhận</div>
                  <div style="margin-top:8px">${customerName}</div>
                  <div style="margin-top:4px;color:#6b7280">${customerPhone}</div>
                  <div style="margin-top:4px;color:#6b7280">${customerEmail}</div>
                  <div style="margin-top:8px;color:#374151">${customerAddress}</div>
                </td>
                <td style="vertical-align:top; width:50%">
                  <div style="font-size:13px;font-weight:800;color:#111827">Thông tin thanh toán</div>
                  <div style="margin-top:8px">Phương thức: ${order.orderType === 'Online' ? 'Chuyển khoản' : 'Tiền mặt (COD)'} </div>
                  <div style="margin-top:4px">Tình trạng: ${order.status || order.Status || 'Pending'}</div>
                </td>
              </tr>
            </table>
          </div>

          <div class="section">
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th style="text-align:center">SL</th>
                  <th style="text-align:right">Đơn giá</th>
                  <th style="text-align:right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <table class="totals">
              <tr>
                <td style="width:70%;color:#374151">Tạm tính</td>
                <td class="right">${formatBookPrice(subtotal)}</td>
              </tr>
              <tr>
                <td style="color:#374151">Phí vận chuyển</td>
                <td class="right">${shipping === 0 ? 'Miễn phí' : formatBookPrice(shipping)}</td>
              </tr>
              <tr>
                <td style="font-size:16px">TỔNG CỘNG</td>
                <td class="right" style="font-size:16px;color:#dc2626">${formatBookPrice(total)}</td>
              </tr>
            </table>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px">
            <div style="font-size:12px;color:#6b7280">Cảm ơn quý khách đã mua hàng. Mọi thắc mắc liên hệ:bookstore@gmail.com</div>
            <div style="text-align:center">
              <div style="font-weight:800;margin-bottom:8px">Người lập hóa đơn</div>
              <div style="height:48px;width:160px;border-bottom:1px solid #e6e6e6"></div>
            </div>
          </div>
        </div>
      </body>
    </html>`;

    const w = window.open('', '_blank', 'width=900,height=900');
    if (!w) {
      showToast('Không thể mở cửa sổ in. Vui lòng cho phép popup cho trang này.', 'error');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); w.close(); } catch (e) { /* ignore */ } }, 600);
  };

  const getStatusBadge = (status) => {
    const config = {
      Pending: { label: "Chờ xác nhận", className: "badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2 fw-bold border border-warning border-opacity-25", icon: "bi-clock" },
      Processing: { label: "Đang đóng gói", className: "badge bg-indigo-subtle text-indigo rounded-pill px-3 py-2 fw-bold border border-indigo-subtle", icon: "bi-box-seam" },
      Shipping: { label: "Đang vận chuyển", className: "badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 fw-bold border border-primary border-opacity-25", icon: "bi-truck" },
      Completed: { label: "Đã giao hàng", className: "badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-bold border border-success border-opacity-25", icon: "bi-check2-circle" },
      Cancelled: { label: "Đã hủy", className: "badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2 fw-bold border border-danger border-opacity-25", icon: "bi-x-circle" },
    };
    const s = config[status] || { label: status, className: "badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-2 fw-bold border border-secondary border-opacity-25", icon: "bi-question-circle" };
    return (<span className={s.className}><i className={`bi ${s.icon} me-1`} />{s.label}</span>);
  };

  const filteredOrders = useMemo(() => orders.filter((o) => {
    const ordString = `ORD-${(o.id || 0).toString().padStart(5, "0")}`.toLowerCase();
    const customerName = (o.customerName || `Khách hàng ${o.userId}`).toLowerCase();
    const matchesSearch = searchTerm === "" || o.id?.toString().includes(searchTerm) || ordString.includes(searchTerm.toLowerCase()) || o.userId?.toString().includes(searchTerm) || customerName.includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || o.status === activeTab;
    const orderDate = new Date(o.orderDate);
    const matchesStartDate = !filters.startDate || orderDate >= new Date(filters.startDate);
    const matchesEndDate = !filters.endDate || orderDate <= new Date(filters.endDate + "T23:59:59");
    const matchesMinPrice = !filters.minPrice || o.totalAmount >= parseFloat(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || o.totalAmount <= parseFloat(filters.maxPrice);
    return matchesSearch && matchesTab && matchesStartDate && matchesEndDate && matchesMinPrice && matchesMaxPrice;
  }), [orders, searchTerm, activeTab, filters]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize; return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }
    for (let i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l > 2) rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };

  const handleExportExcel = () => {
    if (filteredOrders.length === 0) { showToast("Không có dữ liệu để xuất", "warning"); return; }
    const headers = ["Mã đơn", "Khách hàng", "Ngày đặt", "Tổng tiền", "Trạng thái", "Phương thức"];
    const rows = filteredOrders.map((o) => ([`ORD-${o.id.toString().padStart(5, "0")}`, `Khách hàng ${o.userId}`, `${formatDate(o.orderDate)} ${formatTime(o.orderDate)}`, o.totalAmount, o.status, "Chuyển khoản"]));
    const csvContent = "\uFEFF" + [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `Bao_cao_don_hang_${new Date().toLocaleDateString()}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast("Đã xuất file báo cáo thành công", "success");
  };

  const stats = {
    cancelled: orders.filter((o) => o.status === "Cancelled").length,
    pending: orders.filter((o) => o.status === "Pending").length,
    processing: orders.filter((o) => o.status === "Processing").length,
    shipping: orders.filter((o) => o.status === "Shipping").length,
  };

  const revenueStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    let today = 0;
    let month = 0;
    let quarter = 0;
    let year = 0;

    orders.forEach((o) => {
      if (o.status !== "Completed") return;
      const d = new Date(o.orderDate);
      const amt = o.totalAmount || 0;
      const oYear = d.getFullYear();
      const oMonth = d.getMonth() + 1;
      const oQuarter = Math.floor(d.getMonth() / 3) + 1;

      if (d.toDateString() === todayStr) {
        today += amt;
      }

      if (oYear === Number(revYear)) {
        year += amt;

        if (oMonth === Number(revMonth)) {
          month += amt;
        }

        if (oQuarter === Number(revQuarter)) {
          quarter += amt;
        }
      }
    });

    return { today, month, quarter, year };
  }, [orders, revMonth, revQuarter, revYear]);

  return (
    <div className="admin-authors-page animate-fade-in pt-3 mt-2">

      <div className="row g-2 mb-3">
        {[
          { label: "Chờ xác nhận", value: stats.pending, icon: "bi-hourglass-split", color: "#f59e0b" },
          { label: "Đang đóng gói", value: stats.processing, icon: "bi-box-seam", color: "#4f46e5" },
          { label: "Đang giao hàng", value: stats.shipping, icon: "bi-truck", color: "#10b981" },
          { label: "Đơn hàng đã hủy", value: stats.cancelled, icon: "bi-x-circle", color: "#ef4444" },
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

              <div
                className="decoration-bar"
                style={{ background: s.color }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Revenue Summary Widget */}
      <div className="card stationery-table-card border-0 shadow-sm rounded-4 bg-white mb-3 p-3 animate-scale-in">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '52px', height: '52px', backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-wallet2 fs-3"></i>
            </div>
            <div>
              <h5 className="fw-800 text-slate-800 mb-0 fs-5">TỔNG DOANH THU ĐÃ GIAO</h5>
              <span className="text-slate-400 fw-bold text-uppercase ls-1" style={{ fontSize: '11px' }}>Chỉ tính trên đơn hàng đã giao thành công</span>
            </div>
          </div>

          <div className="d-flex align-items-center flex-wrap gap-4">
            <div className="px-3 border-end border-slate-100">
              <div className="text-slate-400 fw-bold text-uppercase mb-1" style={{ fontSize: '12px' }}>Hôm nay</div>
              <div className="fw-800 text-slate-900 fs-5">{formatBookPrice(revenueStats.today)}</div>
            </div>

            <div className="px-3 border-end border-slate-100">
              <div className="mb-1">
                <div className="position-relative d-inline-block">
                  <select
                    value={revMonth}
                    onChange={(e) => setRevMonth(Number(e.target.value))}
                    className="border-0 p-0 fw-bold text-slate-500 bg-transparent"
                    style={{
                      borderBottom: '1px dashed #94a3b8',
                      borderRadius: 0,
                      cursor: 'pointer',
                      boxShadow: 'none',
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      paddingRight: '16px',
                      minWidth: '95px',
                      fontSize: '13px'
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                    ))}
                  </select>
                  <i className="bi bi-chevron-down position-absolute" style={{ right: '4px', top: '55%', transform: 'translateY(-50%)', fontSize: '9px', color: '#64748b', pointerEvents: 'none' }}></i>
                </div>
              </div>
              <div className="fw-800 text-slate-900 fs-5">{formatBookPrice(revenueStats.month)}</div>
            </div>

            <div className="px-3 border-end border-slate-100">
              <div className="mb-1">
                <div className="position-relative d-inline-block">
                  <select
                    value={revQuarter}
                    onChange={(e) => setRevQuarter(Number(e.target.value))}
                    className="border-0 p-0 fw-bold text-slate-500 bg-transparent"
                    style={{
                      borderBottom: '1px dashed #94a3b8',
                      borderRadius: 0,
                      cursor: 'pointer',
                      boxShadow: 'none',
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      paddingRight: '16px',
                      minWidth: '85px',
                      fontSize: '13px'
                    }}
                  >
                    <option value={1}>Quý 1</option>
                    <option value={2}>Quý 2</option>
                    <option value={3}>Quý 3</option>
                    <option value={4}>Quý 4</option>
                  </select>
                  <i className="bi bi-chevron-down position-absolute" style={{ right: '4px', top: '55%', transform: 'translateY(-50%)', fontSize: '9px', color: '#64748b', pointerEvents: 'none' }}></i>
                </div>
              </div>
              <div className="fw-800 text-slate-900 fs-5">{formatBookPrice(revenueStats.quarter)}</div>
            </div>

            <div className="px-3">
              <div className="mb-1">
                <div className="position-relative d-inline-block">
                  <select
                    value={revYear}
                    onChange={(e) => setRevYear(Number(e.target.value))}
                    className="border-0 p-0 fw-bold text-slate-500 bg-transparent"
                    style={{
                      borderBottom: '1px dashed #94a3b8',
                      borderRadius: 0,
                      cursor: 'pointer',
                      boxShadow: 'none',
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      paddingRight: '16px',
                      minWidth: '105px',
                      fontSize: '13px'
                    }}
                  >
                    {uniqueYears.map(y => (
                      <option key={y} value={y}>Năm {y}</option>
                    ))}
                  </select>
                  <i className="bi bi-chevron-down position-absolute" style={{ right: '4px', top: '55%', transform: 'translateY(-50%)', fontSize: '9px', color: '#64748b', pointerEvents: 'none' }}></i>
                </div>
              </div>
              <div className="fw-800 text-emerald fs-4" style={{ color: '#10b981' }}>{formatBookPrice(revenueStats.year)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card stationery-table-card border-0 shadow-sm rounded-4 bg-white">
        <div className="card-header bg-white border-bottom border-slate-100 p-3">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="modern-search-box">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="col-md-3">
              <div className="position-relative">
                <select
                  className="form-select w-100"
                  style={{
                    minHeight: '48px',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a',
                    fontWeight: '600',
                    paddingLeft: '16px',
                    paddingRight: activeTab !== 'all' ? '42px' : '30px'
                  }}
                  value={activeTab}
                  onChange={(e) => {
                    setActiveTab(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Pending">Chờ xác nhận</option>
                  <option value="Processing">Đang đóng gói</option>
                  <option value="Shipping">Đang vận chuyển</option>
                  <option value="Completed">Đã giao hàng</option>
                  <option value="Cancelled">Đã hủy</option>
                </select>
                {activeTab !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("all");
                      setPage(1);
                    }}
                    className="position-absolute border-0 bg-transparent text-slate-400 hover-text-slate-600 p-0"
                    style={{
                      right: '34px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Xóa bộ lọc"
                  >
                    <i className="bi bi-x-circle-fill" style={{ fontSize: '15px', color: '#94a3b8' }}></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-4 text-md-end d-flex gap-2">
              <button
                type="button"
                className="btn btn-primary-premium flex-grow-1 fw-bold h-100 rounded-3 shadow-sm"
                onClick={handleExportExcel}
              >
                <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                Xuất Excel
              </button>
              <button
                type="button"
                className="btn btn-primary flex-grow-1 fw-bold h-100 rounded-3 shadow-sm"
                onClick={handleExportExcel}
              >
                <i className="bi bi-download me-1"></i>
                Xuất báo cáo
              </button>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-scroll-x">
            <table className="table table-modern align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-3" style={{width: '60px'}}>STT</th>
                  <th className="ps-4" style={{ width: '140px' }}>Mã đơn hàng</th>
                  <th>Tên khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th className="action-col" style={{width: '220px'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <i className="bi bi-inbox fs-1 text-slate-200 d-block mb-3" />
                      <p className="text-slate-400 fw-bold">Không tìm thấy đơn hàng phù hợp</p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((o, idx) => (
                    <tr key={o.id}>
                      <td className="ps-3 py-2">{(page - 1) * pageSize + idx + 1}</td>
                      <td className="ps-4">
                        <div className="fw-800 text-indigo fs-6">ORD-{(o.id || 0).toString().padStart(5, '0')}</div>
                      </td>
                      <td>
                        <div className="fw-700 text-slate-900 small">{o.customerName || `Khách hàng ${o.userId}`}</div>
                      </td>
                      <td>
                        <div className="fw-800 text-dark">{formatBookPrice(o.totalAmount)}</div>
                      </td>
                      <td>
                        <div className="small fw-600 text-slate-700">{formatDate(o.orderDate)}</div>
                        <div className="x-small text-slate-400 mt-1">{formatTime(o.orderDate)}</div>
                      </td>
                      <td>{getStatusBadge(o.status)}</td>
                      <td className="action-col" style={{width: '220px'}}>
                        <div className="action-buttons">
                          {o.status === 'Pending' && (
                            <button className="action-btn" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }} title="Duyệt & Đóng gói" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(o.id, 'Processing'); }}><i className="bi bi-check-lg" /></button>
                          )}
                          {o.status === 'Processing' && (
                            <button className="action-btn" style={{ background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' }} title="Giao hàng" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(o.id, 'Shipping'); }}><i className="bi bi-truck" /></button>
                          )}
                          {o.status === 'Shipping' && (
                            <button className="action-btn" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }} title="Xác nhận đã giao" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(o.id, 'Completed'); }}><i className="bi bi-check2-circle" /></button>
                          )}
                          
                          <div className="d-inline-block position-relative" style={{ width: '38px', height: '38px', verticalAlign: 'middle' }}>
                            <select
                              value={o.status}
                              onChange={(e) => { e.stopPropagation(); handleUpdateStatus(o.id, e.target.value); }}
                              onClick={(e) => e.stopPropagation()}
                              title="Cập nhật trạng thái"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                opacity: 0,
                                cursor: 'pointer',
                                zIndex: 2,
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                appearance: 'none'
                              }}
                            >
                              <option value="Pending">Chờ xác nhận</option>
                              <option value="Processing">Đang đóng gói</option>
                              <option value="Shipping">Đang giao hàng</option>
                              <option value="Completed">Đã giao hàng</option>
                              <option value="Cancelled">Đã hủy</option>
                            </select>
                            <button 
                              className="action-btn" 
                              style={{ 
                                background: '#f1f5f9', 
                                color: '#475569', 
                                border: '1px solid #e2e8f0',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 1
                              }}
                            >
                              <i className="bi bi-arrow-repeat"></i>
                            </button>
                          </div>

                          <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); handleOpenDetails(o); }} title="Chi tiết"><i className="bi bi-eye-fill" /></button>
                          <button className="action-btn delete-btn" title="Xóa đơn" onClick={(e) => { e.stopPropagation(); handleDeleteOrder(o.id); }}><i className="bi bi-trash3-fill" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination UI */}
        <div className="pagination-container" style={{ borderTop: 'none' }}>
          <div className="pagination-info fw-bold-700 text-dark">
            Hiển thị {Math.min((page - 1) * pageSize + 1, filteredOrders.length)} –{" "}
            {Math.min(page * pageSize, filteredOrders.length)} trong tổng số{" "}
            {filteredOrders.length} đơn hàng
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
                  localStorage.setItem("adminPageSize_orders", newSize);
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

              {getPageNumbers().map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="pagination-ellipsis px-2 text-slate-400 fw-bold d-inline-flex align-items-center justify-content-center" style={{ minWidth: '38px' }}>...</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`pagination-btn ${page === p ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              )}

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

      {showOrderModal && selectedOrder && (() => {
        const orderId = selectedOrder.id || selectedOrder.Id || 0;
        const orderDate = selectedOrder.orderDate || selectedOrder.OrderDate;
        const orderStatus = selectedOrder.status || selectedOrder.Status || 'Pending';
        const orderAmount = selectedOrder.totalAmount || selectedOrder.TotalAmount || 0;
        const orderType = selectedOrder.orderType || selectedOrder.OrderType || 'Online';
        const detailsList = selectedOrder.orderDetails || selectedOrder.OrderDetails || [];

        const getInitials = (name) => {
          if (!name) return "KH";
          const parts = name.split(" ");
          if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        };

        const userName = selectedOrderUser ? (selectedOrderUser.fullName || selectedOrderUser.FullName) : (selectedOrder.customerName || `Khách hàng ${selectedOrder.userId || selectedOrder.UserId || ''}`);
        const userEmail = selectedOrderUser ? (selectedOrderUser.email || selectedOrderUser.Email) : 'customer@example.com';
        const userPhone = selectedOrderUser ? (selectedOrderUser.phoneNumber || selectedOrderUser.PhoneNumber) : '0912 345 678';
        const userAddress = selectedOrderUser ? (selectedOrderUser.address || selectedOrderUser.Address) : '123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh';
        const userInitials = getInitials(userName);

        // Progress index calculator
        const steps = ["Pending", "Processing", "Shipping", "Completed"];
        const currentIdx = steps.indexOf(orderStatus);

        return (
          <div className="modal-overlay-modern animate-fade-in" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}>
            <div className="animate-scale-in" style={{
              width: '100%',
              maxWidth: '1080px',
              maxHeight: '92vh',
              backgroundColor: '#f8fafc',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.7)'
            }}>
              {/* Modal Header */}
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #faf8f5 100%)',
                padding: '20px 28px',
                borderBottom: '1px solid #eef2f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div className="d-flex align-items-center gap-3">
                  <h4 style={{ margin: 0, fontWeight: 800, color: '#1e293b', fontSize: '20px', fontFamily: 'Bold Time New Roman', letterSpacing: '-0.5px' }}>
                    CHI TIẾT ĐƠN HÀNG
                  </h4>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <button className="btn btn-sm btn-light py-2 px-3 fw-bold rounded-3 shadow-sm border" style={{ fontSize: "13px", color: "#475569", display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handlePrintInvoice(selectedOrder, selectedOrderUser)}>
                    <i className="bi bi-printer fs-6" /> In hóa đơn
                  </button>
                  <button type="button" className="stationery-book-modal-close" style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    border: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    transition: 'all 0.2s'
                  }} onClick={() => setShowOrderModal(false)}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ display: 'block', flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                {/* Visual Status Tracker Timeline */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  marginBottom: '24px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                }}>
                  {orderStatus === 'Cancelled' ? (
                    <div className="d-flex align-items-center justify-content-center gap-3 py-2 text-danger">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#fef2f2' }}>
                        <i className="bi bi-x-circle-fill fs-3"></i>
                      </div>
                      <div>
                        <h6 className="fw-800 mb-0">Đơn hàng này đã bị hủy bỏ</h6>
                        <span className="small text-slate-400 fw-bold">Không thể tiếp tục thực hiện giao dịch</span>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-between position-relative flex-wrap gap-4" style={{ padding: '0 10px' }}>
                      {/* Timeline background bar */}
                      <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '5%',
                        right: '5%',
                        height: '4px',
                        backgroundColor: '#e2e8f0',
                        zIndex: 1
                      }}>
                        <div style={{
                          height: '100%',
                          backgroundColor: '#4338ca',
                          width: `${currentIdx * 33.33}%`,
                          transition: 'width 0.4s ease'
                        }}></div>
                      </div>

                      {[
                        { label: 'Chờ xác nhận', status: 'Pending', icon: 'bi-hourglass-split' },
                        { label: 'Đang đóng gói', status: 'Processing', icon: 'bi-box-seam' },
                        { label: 'Đang giao hàng', status: 'Shipping', icon: 'bi-truck' },
                        { label: 'Hoàn thành', status: 'Completed', icon: 'bi-check2-circle' }
                      ].map((step, idx) => {
                        const isCompleted = idx < currentIdx;
                        const isActive = idx === currentIdx;
                        const isPending = idx > currentIdx;

                        let circleBg = '#e2e8f0';
                        let circleColor = '#94a3b8';
                        let borderStyle = 'none';

                        if (isCompleted) {
                          circleBg = '#10b981';
                          circleColor = '#ffffff';
                        } else if (isActive) {
                          circleBg = '#4338ca';
                          circleColor = '#ffffff';
                          borderStyle = '4px solid #c7d2fe';
                        }

                        return (
                          <div key={idx} className="d-flex flex-column align-items-center text-center position-relative" style={{ zIndex: 2, flex: 1 }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: circleBg,
                              color: circleColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              border: borderStyle,
                              boxShadow: isActive ? '0 0 15px rgba(67, 56, 202, 0.4)' : 'none',
                              transition: 'all 0.3s'
                            }}>
                              {isCompleted ? <i className="bi bi-check-lg"></i> : <i className={`bi ${step.icon}`}></i>}
                            </div>
                            <span className="mt-2 small fw-800" style={{
                              color: isActive ? '#4338ca' : (isCompleted ? '#10b981' : '#64748b'),
                              fontSize: '12px'
                            }}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Main 2-Column Content Grid */}
                <div className="row g-4">
                  {/* Left Column (Items & Workflows) */}
                  <div className="col-lg-7">
                    {/* Products Card */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '20px',
                      border: '1px solid #e2e8f0',
                      padding: '24px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                      marginBottom: '24px'
                    }}>
                      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3" style={{ borderColor: '#f1f5f9' }}>
                        <h6 style={{ margin: 0, fontWeight: 800, color: '#1e293b', fontSize: '15px' }}>
                          <i className="bi bi-box-seam text-indigo me-2" style={{ color: '#4338ca' }}></i>
                          Sản phẩm trong đơn ({detailsList.length})
                        </h6>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>Ngày tạo: {formatDate(orderDate)} {formatTime(orderDate)}</span>
                      </div>

                      {loadingDetails && detailsList.length === 0 ? (
                        <div className="text-center py-5">
                          <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>Đang cập nhật danh sách...</span>
                        </div>
                      ) : detailsList.length === 0 ? (
                        <div className="text-center py-4 fw-bold" style={{ color: '#94a3b8' }}>
                          Không có sản phẩm nào trong đơn hàng này
                        </div>
                      ) : (
                        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                          <table className="table table-borderless align-middle mb-0" style={{ width: '100%', tableLayout: 'auto' }}>
                            <thead className="sticky-top bg-white border-bottom" style={{ zIndex: 5 }}>
                              <tr style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <th className="ps-0 py-2" style={{ color: '#64748b', border: 0 }}>Sản phẩm</th>
                                <th className="text-center py-2" style={{ color: '#64748b', border: 0, width: '60px' }}>SL</th>
                                <th className="text-end py-2" style={{ color: '#64748b', border: 0, width: '90px' }}>Đơn giá</th>
                                <th className="text-end pe-0 py-2" style={{ color: '#64748b', border: 0, width: '110px' }}>Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailsList.map((it, i) => {
                                const title = it.productTitle || it.ProductTitle || 'Sản phẩm';
                                const imgUrl = it.productImageUrl || it.ProductImageUrl;
                                const qty = it.quantity || it.Quantity || 0;
                                const uPrice = it.unitPrice || it.UnitPrice || 0;
                                const tPrice = it.totalPrice || it.TotalPrice || 0;
                                
                                return (
                                  <tr key={i} className="border-bottom" style={{ borderColor: '#f1f5f9' }}>
                                    <td className="ps-0 py-3">
                                      <div className="d-flex align-items-center gap-3">
                                        <div className="shadow-sm border rounded-3 overflow-hidden d-flex align-items-center justify-content-center bg-light" style={{ width: '48px', height: '62px', flexShrink: 0, borderColor: '#e2e8f0' }}>
                                          <img 
                                            src={getImageUrl(imgUrl)} 
                                            alt={title} 
                                            className="w-100 h-100 object-fit-cover" 
                                            onError={(e) => e.target.src = FALLBACK_BOOK_IMAGE} 
                                          />
                                        </div>
                                        <div className="overflow-hidden">
                                          <div className="small text-truncate" style={{ maxWidth: '240px', fontWeight: '800', color: '#1e293b' }} title={title}>{title}</div>
                                          <span className="badge rounded-pill mt-1" style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                                            ID: {it.bookId || it.toyId || it.stationeryId || it.schoolSupplyId || it.accessoryId || it.souvenirId || it.BookId || it.ToyId || 'N/A'}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="text-center">
                                      <span className="badge fw-800 px-2 py-1 rounded" style={{ fontSize: '11px', color: '#1e293b', backgroundColor: '#f1f5f9' }}>
                                        x{qty}
                                      </span>
                                    </td>
                                    <td className="text-end small" style={{ fontWeight: '700', color: '#475569' }}>{formatBookPrice(uPrice)}</td>
                                    <td className="text-end pe-0" style={{ fontWeight: '800', color: '#dc2626' }}>{formatBookPrice(tPrice)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Quick ERP Action Panel */}
                    {orderStatus !== 'Completed' && orderStatus !== 'Cancelled' && (
                      <div style={{
                        background: 'linear-gradient(to right, #ecfdf5 0%, #f0fdf4 100%)',
                        borderRadius: '20px',
                        border: '1px solid #bbf7d0',
                        padding: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'between',
                        flexWrap: 'wrap',
                        gap: '16px'
                      }}>
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center bg-white shadow-sm" style={{ width: '42px', height: '42px', color: '#10b981' }}>
                            <i className="bi bi-lightning-charge-fill fs-5"></i>
                          </div>
                          <div>
                            <h6 className="fw-800 mb-0" style={{ fontSize: '14px', color: '#1e293b' }}>Xử lý nhanh đơn hàng</h6>
                            <span className="small fw-bold" style={{ color: '#64748b' }}>Chuyển trạng thái đơn sang bước tiếp theo</span>
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          {orderStatus === 'Pending' && (
                            <button className="btn fw-bold text-white px-4 py-2 rounded-3 shadow-sm" style={{ backgroundColor: '#10b981', border: 0, fontSize: '13px' }} onClick={() => handleUpdateStatus(orderId, 'Processing')}>
                              <i className="bi bi-check-lg me-1"></i> Duyệt & Đóng gói
                            </button>
                          )}
                          {orderStatus === 'Processing' && (
                            <button className="btn fw-bold text-white px-4 py-2 rounded-3 shadow-sm" style={{ backgroundColor: '#4338ca', border: 0, fontSize: '13px' }} onClick={() => handleUpdateStatus(orderId, 'Shipping')}>
                              <i className="bi bi-truck me-1"></i> Bàn giao vận chuyển
                            </button>
                          )}
                          {orderStatus === 'Shipping' && (
                            <button className="btn fw-bold text-white px-4 py-2 rounded-3 shadow-sm" style={{ backgroundColor: '#16a34a', border: 0, fontSize: '13px' }} onClick={() => handleUpdateStatus(orderId, 'Completed')}>
                              <i className="bi bi-check2-circle me-1"></i> Xác nhận đã giao
                            </button>
                          )}
                          <button className="btn btn-outline-danger fw-bold px-3 py-2 rounded-3 bg-white" style={{ fontSize: '13px' }} onClick={() => handleUpdateStatus(orderId, 'Cancelled')}>
                            Hủy đơn
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column (Customer & Invoice Breakdowns) */}
                  <div className="col-lg-5">
                    {/* Customer Profile Card */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '20px',
                      border: '1px solid #e2e8f0',
                      padding: '24px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                      marginBottom: '24px'
                    }}>
                      <h6 className="mb-3 border-bottom pb-3" style={{ fontWeight: 800, color: '#1e293b', fontSize: '15px', borderColor: '#f1f5f9' }}>
                        <i className="bi bi-person-fill text-indigo me-2" style={{ color: '#4338ca' }}></i>
                        Thông tin khách hàng
                      </h6>

                      <div className="d-flex align-items-center gap-3 mb-4">
                        <div className="rounded-circle d-flex align-items-center justify-content-center fw-800 text-white" style={{
                          width: '54px',
                          height: '54px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                          fontSize: '18px',
                          boxShadow: '0 4px 6px -1px rgba(67, 56, 202, 0.2)'
                        }}>
                          {userInitials}
                        </div>
                        <div>
                          <h6 className="fw-800 mb-0 fs-6" style={{ color: '#1e293b' }}>{userName}</h6>
                          <span className="badge rounded-pill mt-1" style={{ fontSize: '10px', fontWeight: '700', color: '#4f46e5', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}>
                            Thành viên VIP
                          </span>
                        </div>
                      </div>

                      <div className="d-flex flex-column gap-3">
                        <div className="d-flex align-items-start gap-3">
                          <i className="bi bi-telephone fs-5 mt-0.5" style={{ color: '#94a3b8' }}></i>
                          <div>
                            <span className="small fw-bold text-uppercase d-block" style={{ fontSize: '10px', color: '#94a3b8' }}>Số điện thoại</span>
                            <span className="small fw-700" style={{ color: '#334155' }}>{userPhone}</span>
                          </div>
                        </div>

                        <div className="d-flex align-items-start gap-3">
                          <i className="bi bi-envelope fs-5 mt-0.5" style={{ color: '#94a3b8' }}></i>
                          <div>
                            <span className="small fw-bold text-uppercase d-block" style={{ fontSize: '10px', color: '#94a3b8' }}>Địa chỉ Email</span>
                            <span className="small fw-700" style={{ color: '#334155' }}>{userEmail}</span>
                          </div>
                        </div>

                        <div className="d-flex align-items-start gap-3">
                          <i className="bi bi-geo-alt fs-5 mt-0.5" style={{ color: '#94a3b8' }}></i>
                          <div>
                            <span className="small fw-bold text-uppercase d-block" style={{ fontSize: '10px', color: '#94a3b8' }}>Địa chỉ giao hàng</span>
                            <span className="small fw-700 d-block" style={{ color: '#334155', lineHeight: '1.4' }}>{userAddress}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Receipt Details */}
                    <div style={{
                      background: 'linear-gradient(to bottom, #ffffff 0%, #faf9f6 100%)',
                      borderRadius: '20px',
                      border: '1px solid #e2e8f0',
                      padding: '24px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                    }}>
                      <h6 className="mb-3 border-bottom pb-3" style={{ fontWeight: 800, color: '#1e293b', fontSize: '15px', borderColor: '#f1f5f9' }}>
                        <i className="bi bi-receipt text-indigo me-2" style={{ color: '#4338ca' }}></i>
                        Chi tiết thanh toán
                      </h6>

                      <div className="d-flex flex-column gap-2.5 border-bottom pb-3 mb-3" style={{ borderColor: '#f1f5f9' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="small fw-bold" style={{ color: '#64748b' }}>Tổng tiền hàng:</span>
                          <span className="small fw-800" style={{ color: '#1e293b' }}>{formatBookPrice(orderAmount)}</span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                          <span className="small fw-bold" style={{ color: '#64748b' }}>Phí vận chuyển:</span>
                          <span className="small fw-800" style={{ color: '#1e293b' }}>
                            {orderAmount > 200000 ? (
                              <span style={{ color: '#10b981', fontWeight: '800' }}>Miễn phí</span>
                            ) : '30.000 đ'}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                          <span className="small fw-bold" style={{ color: '#64748b' }}>Khuyến mãi coupon:</span>
                          <span className="small fw-800" style={{ color: '#64748b' }}>0 đ</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <span className="fw-800" style={{ fontSize: '14px', color: '#1e293b' }}>TỔNG CỘNG:</span>
                        <span className="fw-800 text-danger fs-4">
                          {formatBookPrice(orderAmount + (orderAmount > 200000 ? 0 : 30000))}
                        </span>
                      </div>

                      {/* Payment Method Details Box */}
                      <div className="p-3 rounded-3" style={{ backgroundColor: '#ffffff', border: '1px dashed #cbd5e1' }}>
                        <div className="d-flex align-items-start gap-2.5">
                          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px', backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                            <i className="bi bi-credit-card-2-front-fill" style={{ fontSize: '14px' }}></i>
                          </div>
                          <div>
                            <span className="small fw-800 d-block" style={{ fontSize: '12px', color: '#334155' }}>
                              {orderType === 'Online' ? 'Chuyển khoản Ngân hàng (Đã xác thực)' : 'Thanh toán tiền mặt (COD)'}
                            </span>
                            <span className="x-small fw-bold d-block mt-0.5" style={{ color: '#94a3b8' }}>
                              {orderType === 'Online' ? 'Giao dịch qua VNPay/VietQR' : 'Thu hộ bởi bưu tá khi nhận'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 28px',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #eef2f6',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button type="button" className="btn btn-outline-slate-modern px-4 py-2 fw-bold rounded-3" style={{ fontSize: '13px' }} onClick={() => setShowOrderModal(false)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      <ConfirmModal show={showConfirm} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} onConfirm={confirmConfig.onConfirm} onCancel={() => setShowConfirm(false)} />
    </div>
  );
};

export default AdminOrders;
