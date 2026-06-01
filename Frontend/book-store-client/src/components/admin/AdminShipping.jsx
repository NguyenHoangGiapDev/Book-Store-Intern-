import React, { useEffect, useMemo, useState } from "react";
import { showToast } from "../common/Toast.jsx";
import { getImageUrl, FALLBACK_BOOK_IMAGE } from "../../utils/bookDisplay";
import "../../styles/admin/AdminAuthors.css";

const SHIPPING_STATUS = {
  pending_handover: {
    key: "pending_handover",
    label: "Chờ bàn giao",
    badge: "badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2 fw-bold border border-warning border-opacity-25",
    icon: "bi-hourglass-split",
  },
  shipping: {
    key: "shipping",
    label: "Đang vận chuyển",
    badge: "badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 fw-bold border border-primary border-opacity-25",
    icon: "bi-truck",
  },
  delivered: {
    key: "delivered",
    label: "Đã giao",
    badge: "badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-bold border border-success border-opacity-25",
    icon: "bi-check2-circle",
  },
  failed: {
    key: "failed",
    label: "Giao thất bại",
    badge: "badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2 fw-bold border border-danger border-opacity-25",
    icon: "bi-x-circle",
  },
};



const PROVIDERS = [
  "Giao Hàng Nhanh (GHN)",
  "Giao Hàng Tiết Kiệm (GHTK)",
  "Viettel Post",
  "J&T Express",
  "Shopee Express",
];

function normalizeShippingStatus(order) {
  const raw = (
    order.shippingStatus ||
    order.deliveryStatus ||
    order.shipStatus ||
    order.status ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();

  if (
    raw.includes("cho ban giao") ||
    raw.includes("pending") ||
    raw.includes("processing") ||
    raw.includes("chờ bàn giao")
  ) {
    return "pending_handover";
  }

  if (
    raw.includes("shipping") ||
    raw.includes("transit") ||
    raw.includes("đang vận chuyển") ||
    raw.includes("van chuyen")
  ) {
    return "shipping";
  }

  if (
    raw.includes("delivered") ||
    raw.includes("completed") ||
    raw.includes("đã giao") ||
    raw.includes("giao thành công")
  ) {
    return "delivered";
  }

  if (
    raw.includes("failed") ||
    raw.includes("cancel") ||
    raw.includes("thất bại") ||
    raw.includes("hủy")
  ) {
    return "failed";
  }

  return "pending_handover";
}

function getCustomerName(order) {
  return (
    order.customerName ||
    order.fullName ||
    order.receiverName ||
    order.user?.fullName ||
    order.user?.name ||
    "Khách hàng"
  );
}

function getCustomerPhone(order) {
  return (
    order.phoneNumber ||
    order.receiverPhone ||
    order.user?.phoneNumber ||
    "Chưa có SĐT"
  );
}

function getCustomerAddress(order) {
  return (
    order.shippingAddress ||
    order.address ||
    order.receiverAddress ||
    order.user?.address ||
    "Chưa có địa chỉ"
  );
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return number.toLocaleString("vi-VN") + " đ";
}

function AdminShipping({ refresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState("all");
  // Local state
  const [localRows, setLocalRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const v = localStorage.getItem("adminPageSize_shipping");
    return v ? Number(v) : 6;
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch delivery categories from backend and normalize
  const fetchDeliveryCategories = async () => {
    try {
      const res = await fetch("http://localhost:5005/api/deliverycategories");
      if (!res.ok) throw new Error("Không lấy được dữ liệu giao hàng");
      const data = await res.json();

      const mapped = (data || []).map((item) => {
        const id = item.Id ?? item.id;
        const orderId = item.OrderId ?? item.orderId ?? id;
        const trackingCode = item.TrackingCode ?? item.trackingCode ?? item.TrackingNumber ?? item.trackingNumber ?? "";
        const provider = item.ShippingProvider ?? item.shippingProvider ?? item.Carrier ?? item.carrier ?? "Giao Hàng Nhanh (GHN)";
        const totalAmount = Number(item.TotalAmount ?? item.totalAmount ?? item.CustomTotalAmount ?? 0);

        return {
          id,
          orderId,
          customerName: item.ReceiverName ?? item.receiverName ?? item.customerName ?? "",
          phoneNumber: item.ReceiverPhone ?? item.receiverPhone ?? item.phoneNumber ?? "",
          shippingAddress: item.DeliveryAddress ?? item.deliveryAddress ?? "",
          totalAmount,
          _shippingStatus: normalizeShippingStatus(item),
          _shippingProvider: provider,
          _trackingCode: trackingCode,
          // keep raw payload available
          raw: item,
        };
      });

      setLocalRows(mapped);
    } catch (error) {
      console.error(error);
      showToast("Không tải được dữ liệu giao hàng từ database", "error");
    }
  };

  useEffect(() => {
    fetchDeliveryCategories();
  }, []);

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const stats = useMemo(() => {
    const total = localRows.length;
    const pending = localRows.filter(
      (item) => item._shippingStatus === "pending_handover"
    ).length;
    const shipping = localRows.filter(
      (item) => item._shippingStatus === "shipping"
    ).length;
    const delivered = localRows.filter(
      (item) => item._shippingStatus === "delivered"
    ).length;
    const failed = localRows.filter(
      (item) => item._shippingStatus === "failed"
    ).length;

    return {
      total,
      pending,
      shipping,
      delivered,
      failed,
    };
  }, [localRows]);

  const filteredRows = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return localRows
      .filter((order) => {
        const matchKeyword =
          !keyword ||
          String(order.id).toLowerCase().includes(keyword) ||
          String(order.orderId || "").toLowerCase().includes(keyword) ||
          getCustomerName(order).toLowerCase().includes(keyword) ||
          getCustomerPhone(order).toLowerCase().includes(keyword) ||
          getCustomerAddress(order).toLowerCase().includes(keyword) ||
          String(order._trackingCode || "").toLowerCase().includes(keyword) ||
          String(order._shippingProvider || "").toLowerCase().includes(keyword);

        const matchStatus =
          statusFilter === "all" || order._shippingStatus === statusFilter;

        const matchProvider =
          selectedProvider === "all" ||
          order._shippingProvider === selectedProvider;

        return matchKeyword && matchStatus && matchProvider;
      })
      .sort((a, b) => Number(a.id) - Number(b.id));
  }, [localRows, searchTerm, statusFilter, selectedProvider]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const handleCreateShipment = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const customerName = data.customerName?.trim();
    const phoneNumber = data.phoneNumber?.trim();
    const shippingAddress = data.shippingAddress?.trim();
    const shippingProvider = data.shippingProvider || "Giao Hàng Nhanh (GHN)";
    const trackingCode = data.trackingCode?.trim();
    const totalAmount = Number(data.totalAmount || 0);

    if (!customerName) {
      showToast("Vui lòng nhập tên người nhận", "error");
      return;
    }

    if (!phoneNumber) {
      showToast("Vui lòng nhập số điện thoại", "error");
      return;
    }

    if (!shippingAddress) {
      showToast("Vui lòng nhập địa chỉ giao hàng", "error");
      return;
    }

    try {
      const res = await fetch("http://localhost:5005/api/deliverycategories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: 1,
          receiverName: customerName,
          receiverPhone: phoneNumber,
          deliveryAddress: shippingAddress,
          deliveryStatus: "Processing",
          shippingProvider,
          trackingCode,
          totalAmount,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Tạo vận đơn thất bại:", errorText);
        showToast("Tạo vận đơn thất bại, xem Console", "error");
        return;
      }

      await fetchDeliveryCategories();
      await refresh?.();

      setShowCreateModal(false);
      showToast("Tạo vận đơn thành công", "success");
    } catch (error) {
      console.error("Lỗi khi tạo vận đơn:", error);
      showToast("Không kết nối được backend", "error");
    }
  };

  const handleOpenTracking = (order) => {
    setSelectedOrder(order);
    setShowTrackingModal(true);
  };

  const handleCloseTracking = () => {
    setShowTrackingModal(false);
    setSelectedOrder(null);
  };

  const handlePrintShippingLabel = (order) => {
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(tag => tag.outerHTML)
      .join('\n');

    const printContent = `
      <html>
        <head>
          <title>Phiếu giao hàng #${order.id}</title>
          ${styles}
        </head>
        <body class="print-shipping-body">
          <div class="print-shipping-label">
            <div class="print-shipping-header">
              <div>
                <div class="print-shipping-brand">Book-Store Admin</div>
                <div>Phiếu giao hàng nội bộ</div>
              </div>

              <div class="print-shipping-title">
                MÃ VẬN ĐƠN
                <div class="print-shipping-code">${order._trackingCode}</div>
              </div>
            </div>

            <div class="print-shipping-row">
              <div class="print-shipping-col print-shipping-section">
                <div class="print-shipping-section-title">Người nhận</div>
                <div class="print-shipping-box">
                  <div class="print-shipping-strong">${getCustomerName(order)}</div>
                  <div>${getCustomerPhone(order)}</div>
                </div>
              </div>

              <div class="print-shipping-col print-shipping-section">
                <div class="print-shipping-section-title">Đơn vị vận chuyển</div>
                <div class="print-shipping-box">
                  <div class="print-shipping-strong">${order._shippingProvider}</div>
                  <div>Trạng thái: ${
                    SHIPPING_STATUS[order._shippingStatus]?.label || "-"
                  }</div>
                </div>
              </div>
            </div>

            <div class="print-shipping-section">
              <div class="print-shipping-section-title">Địa chỉ giao hàng</div>
              <div class="print-shipping-box">
                ${getCustomerAddress(order)}
              </div>
            </div>

            <div class="print-shipping-row">
              <div class="print-shipping-col print-shipping-section">
                <div class="print-shipping-section-title">Mã đơn hàng</div>
                <div class="print-shipping-box print-shipping-strong">#${order.id}</div>
              </div>

              <div class="print-shipping-col print-shipping-section">
                <div class="print-shipping-section-title">Giá trị đơn</div>
                <div class="print-shipping-box print-shipping-strong">${formatCurrency(
                  order.totalAmount || order.total || 0
                )}</div>
              </div>
            </div>

            <div class="print-shipping-footer">
              <div>
                <div class="print-shipping-section-title">Người gửi</div>
                <div class="print-shipping-strong">Book-Store</div>
              </div>

              <div>
                <div class="print-shipping-section-title">Ngày in phiếu</div>
                <div>${new Date().toLocaleString("vi-VN")}</div>
              </div>
            </div>
          </div>

          <script>
            setTimeout(function () {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      showToast("Trình duyệt đã chặn cửa sổ in phiếu", "error");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleUpdateStatus = (orderId, nextStatus) => {
    setLocalRows((prev) =>
      prev.map((item) =>
        item.id === orderId ? { ...item, _shippingStatus: nextStatus } : item
      )
    );

    showToast("Cập nhật trạng thái giao hàng thành công", "success");
  };

  const handleRefresh = async () => {
    await fetchDeliveryCategories();
    await refresh?.();
    showToast("Đã làm mới dữ liệu giao hàng từ database", "success");
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSelectedProvider("all");
    setPage(1);
  };

  return (
    <div className="admin-authors-page animate-fade-in pt-3 mt-2">


      <div className="row g-2 mb-3">
        {[
          { label: "Tổng vận đơn", value: stats.total, icon: "bi-box-seam", color: "#4f46e5" },
          { label: "Chờ bàn giao", value: stats.pending, icon: "bi-hourglass-split", color: "#f59e0b" },
          { label: "Đang vận chuyển", value: stats.shipping, icon: "bi-truck", color: "#3b82f6" },
          { label: "Giao thành công", value: stats.delivered, icon: "bi-check2-circle", color: "#10b981" },
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

      <div className="card stationery-table-card border-0 shadow-sm rounded-4 bg-white">
        <div className="card-header bg-white border-bottom border-slate-100 p-3">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="modern-search-box">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Mã đơn, khách hàng, vận đơn..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
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
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending_handover">Chờ bàn giao</option>
                  <option value="shipping">Đang vận chuyển</option>
                  <option value="delivered">Đã giao hàng</option>
                  <option value="failed">Giao thất bại</option>
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
                    paddingRight: selectedProvider !== "all" ? '46px' : '36px'
                  }}
                  value={selectedProvider}
                  onChange={(e) => {
                    setSelectedProvider(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">Tất cả đơn vị vận chuyển</option>
                  {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {selectedProvider !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProvider("all");
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

            <div className="col-md-2 text-md-end d-flex">
              <button
                type="button"
                className="btn btn-primary rounded-3 px-3 fw-800 shadow-sm w-100 d-flex align-items-center justify-content-center"
                style={{ minHeight: '48px', borderRadius: '14px' }}
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-truck me-2 fs-5"></i>
                Thêm vận đơn
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
                  <th style={{width: '20%'}}>Tên khách hàng</th>
                  <th style={{width: '22%'}}>Đơn vị vận chuyển</th>
                  <th style={{width: '13%'}}>Mã vận đơn</th>
                  <th style={{width: '15%'}}>Tổng tiền</th>
                  <th className="text-center" style={{width: '15%'}}>Trạng thái</th>
                  <th className="action-col text-end pe-3" style={{width: '220px'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <i className="bi bi-truck fs-1 text-slate-200 d-block mb-3" />
                      <p className="text-slate-400 fw-bold">Không tìm thấy vận đơn phù hợp</p>
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((order, idx) => {
                    const statusMeta = SHIPPING_STATUS[order._shippingStatus] || SHIPPING_STATUS.pending_handover;
                    
                    return (
                      <tr key={order.id}>
                        <td className="ps-3 py-2">
                           <div className="fw-800 text-slate-900 mb-0">{(page - 1) * pageSize + idx + 1}</div>
                        </td>
                        <td>
                           <div className="fw-800 text-slate-900 mb-0">{getCustomerName(order)}</div>
                           <div className="small text-slate-400 fw-bold">{getCustomerPhone(order)}</div>
                        </td>
                        <td>
                          <span className="border rounded-pill px-3 py-2 small fw-bold text-dark bg-light shadow-sm d-inline-block text-center" style={{minWidth: '150px'}}>
                            {order._shippingProvider}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-indigo-subtle text-indigo border border-indigo-subtle px-2 py-1" style={{fontFamily: 'monospace', letterSpacing: '1px'}}>{order._trackingCode}</span>
                        </td>
                        <td>
                          <div className="fw-800 text-slate-900">{formatCurrency(order.totalAmount)}</div>
                        </td>
                        <td className="text-center">
                          <span className={statusMeta.badge}>
                            <i className={`bi ${statusMeta.icon} me-1`}></i>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="action-col pe-3" style={{ width: '220px' }}>
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <div className="dropdown flex-shrink-0">
                              <button className="action-btn edit-btn dropdown-toggle no-caret" data-bs-toggle="dropdown" title="Cập nhật trạng thái">
                                 <i className="bi bi-arrow-repeat"></i>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                                 <li><button className="dropdown-item small fw-bold" onClick={() => handleUpdateStatus(order.id, 'pending_handover')}>Chờ bàn giao</button></li>
                                 <li><button className="dropdown-item small fw-bold" onClick={() => handleUpdateStatus(order.id, 'shipping')}>Đang vận chuyển</button></li>
                                 <li><button className="dropdown-item small fw-bold" onClick={() => handleUpdateStatus(order.id, 'delivered')}>Đã giao hàng</button></li>
                                 <li><button className="dropdown-item small fw-bold text-danger" onClick={() => handleUpdateStatus(order.id, 'failed')}>Giao thất bại</button></li>
                              </ul>
                            </div>
                            <button className="action-btn flex-shrink-0" style={{ background: '#eef2ff', color: '#4f46e5' }} onClick={() => handleOpenDetail(order)} title="Xem chi tiết"><i className="bi bi-eye-fill"></i></button>
                            <button className="action-btn flex-shrink-0" style={{ background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' }} onClick={() => handleOpenTracking(order)} title="Theo dõi"><i className="bi bi-geo-alt"></i></button>
                            <button className="action-btn flex-shrink-0" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }} onClick={() => handlePrintShippingLabel(order)} title="In phiếu"><i className="bi bi-printer"></i></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 rounded-bottom-4">
            <div className="pagination-info fw-bold-700 text-dark">
              Hiển thị {Math.min((page - 1) * pageSize + 1, filteredRows.length)} –{" "}
              {Math.min(page * pageSize, filteredRows.length)} trong tổng số{" "}
              {filteredRows.length} vận đơn
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
                    localStorage.setItem("adminPageSize_shipping", newSize);
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

      {/* Tracking Modal */}
      {showTrackingModal && selectedOrder && (
        <div className="modal-overlay-modern animate-fade-in">
          <div className="stationery-book-modal-card animate-scale-in">
            <div className="stationery-book-modal-form">
              <div className="stationery-book-modal-header">
                <div>
                  <h5 className="stationery-book-modal-title">
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    Chi tiết hành trình
                  </h5>
                </div>
                <button type="button" className="stationery-book-modal-close" onClick={handleCloseTracking}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="stationery-book-modal-body" style={{ gridTemplateColumns: '1fr' }}>
                <div className="stationery-book-form-pane">
                  <div className="row g-4">
                    {/* Left Column: Shipment Information */}
                    <div className="col-md-5">
                      <div className="p-4 rounded-4 bg-slate-50 border h-100">
                        <h6 className="fw-800 text-slate-800 mb-4 text-uppercase x-small ls-1">
                          <i className="bi bi-truck me-2 text-primary"></i>Thông tin vận chuyển
                        </h6>
                        
                        <div className="mb-3">
                          <label className="stationery-book-label mb-1">
                            <i className="bi bi-person-fill"></i> NGƯỜI NHẬN
                          </label>
                          <input className="stationery-book-input bg-white" value={getCustomerName(selectedOrder)} disabled />
                        </div>

                        <div className="mb-3">
                          <label className="stationery-book-label mb-1">
                            <i className="bi bi-phone-fill"></i> SỐ ĐIỆN THOẠI
                          </label>
                          <input className="stationery-book-input bg-white" value={getCustomerPhone(selectedOrder)} disabled />
                        </div>

                        <div className="mb-3">
                          <label className="stationery-book-label mb-1">
                            <i className="bi bi-geo-alt-fill"></i> ĐỊA CHỈ GIAO HÀNG
                          </label>
                          <textarea className="stationery-book-input bg-white stationery-book-textarea" value={getCustomerAddress(selectedOrder)} disabled rows="2" style={{ minHeight: '80px' }}></textarea>
                        </div>

                        <div>
                          <label className="stationery-book-label mb-1">
                            <i className="bi bi-box-seam"></i> ĐƠN VỊ VẬN CHUYỂN
                          </label>
                          <input className="stationery-book-input bg-white text-primary fw-bold" value={selectedOrder._shippingProvider} disabled />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Internal Timeline */}
                    <div className="col-md-7">
                      <div className="p-4 rounded-4 bg-white border h-100">
                        <h6 className="fw-800 text-slate-800 mb-4 text-uppercase x-small ls-1">
                          <i className="bi bi-clock-history me-2 text-primary"></i>Lịch trình nội bộ
                        </h6>
                        
                        <div className="tracking-timeline ms-2 border-start border-2 border-slate-200 ps-4 position-relative" style={{ paddingLeft: '24px' }}>
                          {[
                            { title: "Đã tạo vận đơn", desc: "Hệ thống đã ghi nhận yêu cầu giao hàng.", active: true, time: new Date().toLocaleString("vi-VN") },
                            { title: "Đã bàn giao vận chuyển", desc: `Đã bàn giao cho đơn vị ${selectedOrder._shippingProvider}`, active: ["shipping", "delivered"].includes(selectedOrder._shippingStatus) },
                            { title: "Đang giao hàng", desc: "Đơn hàng đang trên đường giao tới người nhận.", active: ["shipping", "delivered"].includes(selectedOrder._shippingStatus) },
                            { title: "Giao hàng thành công", desc: "Người nhận đã ký nhận đơn hàng thành công.", active: selectedOrder._shippingStatus === "delivered" }
                          ].map((step, idx) => (
                            <div key={idx} className={`mb-4 position-relative ${step.active ? '' : 'opacity-50'}`}>
                              <div className={`position-absolute rounded-circle ${step.active ? 'bg-primary' : 'bg-slate-300'}`} style={{ width: '14px', height: '14px', left: '-31px', top: '3px', border: '3px solid white', boxShadow: step.active ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none' }}></div>
                              <div className={`fw-800 small ${step.active ? 'text-primary' : 'text-slate-500'}`} style={{ fontSize: '15px' }}>{step.title}</div>
                              <div className="text-slate-500 x-small fw-bold mt-1" style={{ fontSize: '12px' }}>{step.desc}</div>
                              {step.time && <div className="text-slate-400 x-small mt-1" style={{ fontSize: '11px', fontWeight: '600' }}>{step.time}</div>}
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 p-3 rounded-3 bg-indigo-subtle border border-indigo-subtle">
                          <div className="d-flex gap-2 align-items-center x-small fw-800 text-indigo" style={{ fontSize: '12px' }}>
                            <i className="bi bi-info-circle-fill fs-6"></i>
                            Mô phỏng hành trình vận chuyển nội bộ tự động.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="stationery-book-modal-footer">
                <button type="button" className="stationery-book-btn-cancel" onClick={handleCloseTracking}>Đóng</button>
                <button type="button" className="stationery-book-btn-save" onClick={() => handlePrintShippingLabel(selectedOrder)}>
                  <i className="bi bi-printer me-2"></i> In phiếu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay-modern animate-fade-in">
          <div className="stationery-book-modal-card animate-scale-in">
            <div className="stationery-book-modal-form">
              <div className="stationery-book-modal-header">
                <div>
                  <h5 className="stationery-book-modal-title">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Chi tiết vận đơn
                  </h5>
                </div>
                <button type="button" className="stationery-book-modal-close" onClick={() => setShowDetailModal(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="stationery-book-modal-body" style={{ gridTemplateColumns: '1fr' }}>
                <div className="stationery-book-form-pane">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-qr-code"></i> MÃ VẬN ĐƠN
                      </label>
                      <input className="stationery-book-input bg-light" value={selectedOrder._trackingCode || "Chưa cập nhật"} disabled />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-hash"></i> MÃ ĐƠN HÀNG
                      </label>
                      <input className="stationery-book-input bg-light" value={`ORD-${String(selectedOrder.orderId || selectedOrder.id).padStart(5, "0")}`} disabled />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-person-fill"></i> NGƯỜI NHẬN
                      </label>
                      <input className="stationery-book-input bg-light" value={getCustomerName(selectedOrder)} disabled />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-phone-fill"></i> SỐ ĐIỆN THOẠI
                      </label>
                      <input className="stationery-book-input bg-light" value={getCustomerPhone(selectedOrder)} disabled />
                    </div>

                    <div className="col-12">
                      <label className="stationery-book-label">
                        <i className="bi bi-geo-alt-fill"></i> ĐỊA CHỈ NHẬN HÀNG
                      </label>
                      <textarea className="stationery-book-input bg-light stationery-book-textarea" value={getCustomerAddress(selectedOrder)} disabled rows="2"></textarea>
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-truck"></i> ĐƠN VỊ VẬN CHUYỂN
                      </label>
                      <input className="stationery-book-input bg-light" value={selectedOrder._shippingProvider} disabled />
                    </div>

                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-info-circle-fill"></i> TRẠNG THÁI VẬN CHUYỂN
                      </label>
                      <input className="stationery-book-input bg-light fw-bold" value={SHIPPING_STATUS[selectedOrder._shippingStatus]?.label || selectedOrder._shippingStatus} disabled />
                    </div>

                    <div className="col-12 mt-4">
                      <div className="p-3 rounded-4 bg-danger bg-opacity-10 border border-danger border-opacity-25 d-flex justify-content-between align-items-center">
                        <span className="fw-900 text-danger text-uppercase x-small mb-0 d-flex align-items-center gap-2">
                          <i className="bi bi-cash-stack fs-5"></i> TỔNG TIỀN THU HỘ (COD)
                        </span>
                        <span className="fw-900 text-danger fs-4">{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="stationery-book-modal-footer">
                <button type="button" className="stationery-book-btn-cancel" onClick={() => setShowDetailModal(false)}>Đóng</button>
                <button type="button" className="stationery-book-btn-save" onClick={() => handlePrintShippingLabel(selectedOrder)}>
                  <i className="bi bi-printer me-2"></i> In phiếu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Shipment Modal */}
      {showCreateModal && (
        <div className="modal-overlay-modern animate-fade-in">
          <div className="stationery-book-modal-card animate-scale-in">
            <form onSubmit={handleCreateShipment} className="stationery-book-modal-form">
              <div className="stationery-book-modal-header d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="stationery-book-modal-title mb-0">
                    <i className="bi bi-truck me-2"></i>
                    Tạo vận đơn mới
                  </h5>
                </div>
                <button type="button" className="stationery-book-modal-close" onClick={() => setShowCreateModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>

              <div className="stationery-book-modal-body" style={{ gridTemplateColumns: '1fr' }}>
                <div className="stationery-book-form-pane">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-person-fill"></i> NGƯỜI NHẬN
                      </label>
                      <input name="customerName" className="stationery-book-input" placeholder="Nguyễn Văn A" required />
                    </div>
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-phone-fill"></i> SỐ ĐIỆN THOẠI
                      </label>
                      <input name="phoneNumber" className="stationery-book-input" placeholder="09xxxxxxxx" required />
                    </div>
                    <div className="col-12">
                      <label className="stationery-book-label">
                        <i className="bi bi-geo-alt-fill"></i> ĐỊA CHỈ GIAO HÀNG
                      </label>
                      <textarea name="shippingAddress" rows="2" className="stationery-book-input stationery-book-textarea" placeholder="Số nhà, tên đường, phường/xã..." required></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-building-fill"></i> ĐƠN VỊ VẬN CHUYỂN
                      </label>
                      <select name="shippingProvider" className="form-select w-100" style={{height: '46px', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: '600'}}>
                        {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-qr-code"></i> MÃ VẬN ĐƠN
                      </label>
                      <input name="trackingCode" className="form-control stationery-book-input" placeholder="Hệ thống tự tạo nếu để trống" />
                    </div>
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-cash-stack"></i> GIÁ TRỊ ĐƠN HÀNG
                      </label>
                      <input name="totalAmount" type="number" className="stationery-book-input fw-800" placeholder="0" />
                    </div>
                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-info-circle-fill"></i> TRẠNG THÁI
                      </label>
                      <input className="stationery-book-input bg-light" value="Chờ bàn giao" disabled />
                    </div>
                  </div>
                </div>
              </div>

              <div className="stationery-book-modal-footer">
                <button type="button" className="stationery-book-btn-cancel" onClick={() => setShowCreateModal(false)}>Hủy bỏ</button>
                <button type="submit" className="stationery-book-btn-save">
                  <i className="bi bi-check2-circle me-2"></i> Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminShipping;