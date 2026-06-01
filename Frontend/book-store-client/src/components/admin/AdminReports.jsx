import React, { useEffect, useMemo, useState } from "react";
import { showToast } from "../common/Toast.jsx";
import "../../styles/admin/AdminReports.css";
import { apiRequest } from "../../services/apiClient.js";

const API_BASE_URL = "http://localhost:5005/api";

const currency = (value) => {
  const number = Number(value || 0);
  return number.toLocaleString("vi-VN") + " đ";
};

const percent = (value) => `${Number(value || 0)}%`;

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
};

function AdminReports() {
  const [dateRange, setDateRange] = useState("week");
  const [dashboardWeeklyRevenue, setDashboardWeeklyRevenue] = useState([]);
  const [reportStats, setReportStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    operatingCost: 0,
    netProfit: 0,
    averageOrder: 0,
    conversionRate: 18.6,
  });
  const [dashboardTopProducts, setDashboardTopProducts] = useState([]);
  const [dashboardOrderRegions, setDashboardOrderRegions] = useState([]);
  const [dashboardOrderStatus, setDashboardOrderStatus] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_reports");
    return saved ? Number(saved) : 6;
  });

  const totalPages = Math.max(1, Math.ceil(reports.length / pageSize));
  const paginatedReports = useMemo(() => {
    const start = (page - 1) * pageSize;
    return reports.slice(start, start + pageSize);
  }, [reports, page, pageSize]);

  const maxRevenue = useMemo(() => {
    return dashboardWeeklyRevenue.length > 0 ? Math.max(...dashboardWeeklyRevenue.map(i => i.revenue)) : 100000;
  }, [dashboardWeeklyRevenue]);

  const maxOrders = useMemo(() => {
    return dashboardWeeklyRevenue.length > 0 ? Math.max(...dashboardWeeklyRevenue.map(i => i.orders)) : 10;
  }, [dashboardWeeklyRevenue]);
  const handleDownloadReport = (report) => {
    const rows = [
      ["Mã báo cáo", report.reportCode],
      ["Tên báo cáo", report.reportName],
      ["Loại báo cáo", report.reportType],
      ["Kỳ báo cáo", report.periodType],
      ["Ngày bắt đầu", report.dateFrom ? formatDate(report.dateFrom) : ""],
      ["Ngày kết thúc", report.dateTo ? formatDate(report.dateTo) : ""],
      ["Doanh thu", report.totalRevenue],
      ["Tổng đơn hàng", report.totalOrders],
      ["Tổng khách hàng", report.totalCustomers],
      ["Tổng sản phẩm", report.totalProducts],
      ["Loại file", report.fileType || ""],
      ["Trạng thái", report.status],
      ["Người tạo", report.createdBy || ""],
      ["Ngày tạo", report.createdAt ? formatDateTime(report.createdAt) : ""],
    ];

    const csvContent =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${report.reportCode || "bao-cao"}.csv`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Đã tải báo cáo", "success");
  };

  const fetchReports = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);

      const res = await fetch(`${API_BASE_URL}/reports`);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Không lấy được báo cáo:", errorText);
        if (!isBackground) showToast("Không tải được báo cáo từ database", "error");
        return;
      }

      const data = await res.json();

      const list = Array.isArray(data) ? data : data.reports || [];

      const mapped = list.map((item) => ({
        id: item.id ?? item.Id,
        reportCode: item.reportCode ?? item.ReportCode,
        reportName: item.reportName ?? item.ReportName,
        reportType: item.reportType ?? item.ReportType,
        periodType: item.periodType ?? item.PeriodType,
        dateFrom: item.dateFrom ?? item.DateFrom,
        dateTo: item.dateTo ?? item.DateTo,
        totalRevenue: Number(item.totalRevenue ?? item.TotalRevenue ?? 0),
        totalOrders: Number(item.totalOrders ?? item.TotalOrders ?? 0),
        totalCustomers: Number(item.totalCustomers ?? item.TotalCustomers ?? 0),
        totalProducts: Number(item.totalProducts ?? item.TotalProducts ?? 0),
        fileType: item.fileType ?? item.FileType,
        fileUrl: item.fileUrl ?? item.FileUrl,
        status: item.status ?? item.Status ?? "created",
        createdBy: item.createdBy ?? item.CreatedBy,
        createdAt: item.createdAt ?? item.CreatedAt,
      }));

      setReports(mapped);
    } catch (error) {
      console.error(error);
      if (!isBackground) showToast("Không kết nối được backend", "error");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const orders = await apiRequest("/orders");
      
      const productMap = {};
      const regionMap = { "Hồ Chí Minh": 0, "Hà Nội": 0, "Đà Nẵng": 0, "Khác": 0 };
      const statusMap = {
        "Completed": { label: "Hoàn thành", count: 0, badge: "bg-success-subtle text-success-emphasis" },
        "Processing": { label: "Đang xử lý", count: 0, badge: "bg-warning-subtle text-warning-emphasis" },
        "Cancelled": { label: "Đã hủy", count: 0, badge: "bg-danger-subtle text-danger-emphasis" },
        "Shipping": { label: "Đang giao", count: 0, badge: "bg-primary-subtle text-primary-emphasis" },
        "Pending": { label: "Chờ xác nhận", count: 0, badge: "bg-secondary-subtle text-secondary-emphasis" },
      };
      
      // Get the start date for filtering based on dateRange
      const todayFilter = new Date();
      let startDate = new Date(0); // Default all time
      if (dateRange === "today") {
        startDate = new Date(todayFilter.setHours(0,0,0,0));
      } else if (dateRange === "week") {
        startDate = new Date(todayFilter.setDate(todayFilter.getDate() - 6));
        startDate.setHours(0,0,0,0);
      } else if (dateRange === "month") {
        startDate = new Date(todayFilter.getFullYear(), todayFilter.getMonth(), 1);
      } else if (dateRange === "quarter") {
        const quarter = Math.floor(todayFilter.getMonth() / 3);
        startDate = new Date(todayFilter.getFullYear(), quarter * 3, 1);
      } else if (dateRange === "year") {
        startDate = new Date(todayFilter.getFullYear(), 0, 1);
      }

      // Filter orders by date range for the 4 overview cards, top products, regions, status
      const filteredOrders = orders.filter(o => {
        const d = new Date(o.orderDate);
        return !isNaN(d.getTime()) && d >= startDate;
      });

      let totalRegionOrders = 0;
      let totalStatusOrders = filteredOrders.length;

      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return {
          date: d,
          day: d.toLocaleDateString("vi-VN", { weekday: "short" }).replace("Th ", "T"),
          revenue: 0,
          orders: 0
        };
      });

      // Calculate last7Days from ALL orders, not filtered
      orders.forEach(order => {
        if (order.status !== "Cancelled" && order.status !== "Đã hủy") {
          const orderDate = new Date(order.orderDate);
          if (!isNaN(orderDate.getTime())) {
             orderDate.setHours(0, 0, 0, 0);
             const dayMatch = last7Days.find(d => d.date.getTime() === orderDate.getTime());
             if (dayMatch) {
               dayMatch.revenue += order.totalAmount || 0;
               dayMatch.orders++;
             }
          }
        }
      });
      setDashboardWeeklyRevenue(last7Days);

      // Calculate stats based on FILTERED orders
      let filteredRev = 0;
      let filteredOrd = 0;
      let completedOrd = 0;

      filteredOrders.forEach(order => {
        const s = order.status || "Pending";
        if (statusMap[s]) statusMap[s].count++;
        else statusMap["Pending"].count++;

        totalRegionOrders++;
        const addr = (order.address || "").toLowerCase();
        if (addr.includes("hồ chí minh") || addr.includes("hcm") || addr.includes("ho chi minh")) regionMap["Hồ Chí Minh"]++;
        else if (addr.includes("hà nội") || addr.includes("ha noi")) regionMap["Hà Nội"]++;
        else if (addr.includes("đà nẵng") || addr.includes("da nang")) regionMap["Đà Nẵng"]++;
        else regionMap["Khác"]++;

        if (s !== "Cancelled" && s !== "Đã hủy") {
          filteredRev += order.totalAmount || 0;
          filteredOrd++;
          if (s === "Completed" || s === "Hoàn thành") completedOrd++;

          (order.orderDetails || []).forEach(detail => {
            const title = detail.productTitle || "Sản phẩm";
            if (!productMap[title]) productMap[title] = { id: detail.bookId || detail.toyId || title, name: title, sold: 0, revenue: 0 };
            productMap[title].sold += detail.quantity;
            productMap[title].revenue += detail.totalPrice;
          });
        }
      });

      const opCost = Math.round(filteredRev * 0.12);
      const np = filteredRev - opCost;
      const avg = filteredOrd > 0 ? Math.round(filteredRev / filteredOrd) : 0;
      const convRate = filteredOrders.length > 0 ? Math.round((completedOrd / filteredOrders.length) * 1000) / 10 : 0;

      setReportStats({
        totalRevenue: filteredRev,
        totalOrders: filteredOrd,
        operatingCost: opCost,
        netProfit: np,
        averageOrder: avg,
        conversionRate: convRate,
      });

      const topProductsData = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);

      const regionData = totalRegionOrders > 0 ? [
        { name: "Hồ Chí Minh", value: Math.round((regionMap["Hồ Chí Minh"] / totalRegionOrders) * 100) },
        { name: "Hà Nội", value: Math.round((regionMap["Hà Nội"] / totalRegionOrders) * 100) },
        { name: "Đà Nẵng", value: Math.round((regionMap["Đà Nẵng"] / totalRegionOrders) * 100) },
        { name: "Khác", value: Math.round((regionMap["Khác"] / totalRegionOrders) * 100) },
      ].filter(r => r.value > 0).sort((a, b) => b.value - a.value) : [];

      const statusData = totalStatusOrders > 0 ? Object.values(statusMap)
        .filter(st => st.count > 0)
        .map(st => ({
          label: st.label,
          value: Math.round((st.count / totalStatusOrders) * 100),
          badge: st.badge
        })).sort((a, b) => b.value - a.value) : [];

      setDashboardTopProducts(topProductsData);
      setDashboardOrderRegions(regionData);
      setDashboardOrderStatus(statusData);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu thống kê đơn hàng:", err);
    }
  };

  useEffect(() => {
    fetchOrderStats();
  }, [dateRange]);

  useEffect(() => {
    fetchReports();
    const intervalId = setInterval(() => {
      fetchReports(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = async () => {
    await fetchReports();
    showToast("Đã làm mới dữ liệu báo cáo", "success");
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportName: "Báo cáo doanh thu",
          reportType: "revenue",
          periodType: dateRange,
          dateFrom: null,
          dateTo: null,
          totalRevenue: reportStats.totalRevenue,
          totalOrders: reportStats.totalOrders,
          totalCustomers: 0,
          totalProducts: dashboardTopProducts.length,
          fileType: "Excel",
          fileUrl: null,
          status: "created",
          createdBy: 1,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Tạo báo cáo thất bại:", errorText);
        showToast("Xuất báo cáo thất bại", "error");
        return;
      }

      await fetchReports();
      showToast("Đã lưu báo cáo vào database", "success");
    } catch (error) {
      console.error(error);
      showToast("Không kết nối được backend", "error");
    }
  };

  const openDeleteConfirm = (report) => {
    setDeleteConfirm(report);
  };

  const handleDeleteReport = async () => {
    if (!deleteConfirm) return;

    try {
      const res = await fetch(`${API_BASE_URL}/reports/${deleteConfirm.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Xóa báo cáo thất bại:", errorText);
        showToast("Xóa báo cáo thất bại", "error");
        return;
      }

      setDeleteConfirm(null);
      await fetchReports();
      showToast("Đã xóa báo cáo", "success");
    } catch (error) {
      console.error(error);
      showToast("Không kết nối được backend", "error");
    }
  };

  return (
    <div className="admin-authors-page container-fluid py-4 animate-fade-in">
      {/* Header */}
      <div className="d-flex justify-content-end align-items-center gap-3 mb-4">
        <select
          className="form-select rounded-pill px-4 w-auto"
          style={{ minWidth: '180px' }}
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="today">Hôm nay</option>
          <option value="week">Tuần này</option>
          <option value="month">Tháng này</option>
          <option value="quarter">Quý này</option>
          <option value="year">Năm nay</option>
        </select>

        <button
          className="btn btn-primary rounded-pill px-4 shadow-sm text-nowrap"
          onClick={handleExport}
        >
          <i className="bi bi-download me-2"></i>
          Xuất báo cáo
        </button>
      </div>

      {/* Main stats */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-uppercase small fw-semibold text-muted mb-2">
                    Tổng doanh thu
                  </div>
                  <h4 className="mb-1">
                    {currency(reportStats.totalRevenue)}
                  </h4>
                </div>
                <div className="rounded-4 bg-primary-subtle text-primary p-3">
                  <i className="bi bi-cash-stack fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-uppercase small fw-semibold text-muted mb-2">
                    Tổng đơn hàng
                  </div>
                  <h4 className="mb-1">{reportStats.totalOrders}</h4>
                </div>
                <div className="rounded-4 bg-warning-subtle text-warning p-3">
                  <i className="bi bi-bag-check fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-uppercase small fw-semibold text-muted mb-2">
                    Trung bình đơn hàng
                  </div>
                  <h4 className="mb-1">
                    {currency(reportStats.averageOrder)}
                  </h4>
                </div>
                <div className="rounded-4 bg-info-subtle text-info p-3">
                  <i className="bi bi-receipt fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-uppercase small fw-semibold text-muted mb-2">
                    Tỷ lệ chuyển đổi
                  </div>
                  <h4 className="mb-1">
                    {reportStats.conversionRate}%
                  </h4>
                </div>
                <div className="rounded-4 bg-success-subtle text-success p-3">
                  <i className="bi bi-bullseye fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Charts and finance summary */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 p-4 d-flex flex-column flex-md-row justify-content-between gap-2">
              <div>
                <h4 className="fw-bold mb-1" style={{ color: "#0b1f44" }}>
                  Doanh thu 7 ngày gần nhất
                </h4>
                <p className="text-muted mb-0">
                  Theo dõi biến động doanh thu và số đơn hàng theo từng ngày.
                </p>
              </div>
              <span className="badge bg-primary-subtle text-primary-emphasis rounded-pill align-self-start px-3 py-2">
                {dateRange === "week" ? "Tuần này" : "Đang lọc"}
              </span>
            </div>

            <div className="card-body p-4 pt-0">
              <div className="rounded-4 bg-light p-4" style={{ minHeight: 330 }}>
                <div
                  className="d-flex align-items-end gap-3 h-100"
                  style={{ minHeight: 260 }}
                >
                  {dashboardWeeklyRevenue.map((item) => {
                    const revenueHeight = Math.max(
                      (item.revenue / maxRevenue) * 220,
                      20
                    );
                    const orderHeight = Math.max(
                      (item.orders / maxOrders) * 160,
                      18
                    );

                    return (
                      <div
                        key={item.day}
                        className="flex-fill d-flex flex-column align-items-center justify-content-end"
                      >
                        <div className="text-muted small mb-2">
                          {currency(item.revenue)}
                        </div>

                        <div className="d-flex align-items-end gap-1">
                          <div
                            className="rounded-top-4 bg-primary"
                            title={`Doanh thu: ${currency(item.revenue)}`}
                            style={{
                              width: 22,
                              height: revenueHeight,
                              opacity: 0.9,
                            }}
                          ></div>

                          <div
                            className="rounded-top-4 bg-warning"
                            title={`Đơn hàng: ${item.orders}`}
                            style={{
                              width: 14,
                              height: orderHeight,
                              opacity: 0.85,
                            }}
                          ></div>
                        </div>

                        <div className="fw-semibold mt-3">{item.day}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="d-flex justify-content-center gap-4 mt-4">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="rounded-circle bg-primary"
                      style={{ width: 12, height: 12 }}
                    ></span>
                    <span className="text-muted small">Doanh thu</span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="rounded-circle bg-warning"
                      style={{ width: 12, height: 12 }}
                    ></span>
                    <span className="text-muted small">Đơn hàng</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Finance summary */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 p-4">
              <h4 className="fw-bold mb-1" style={{ color: "#0b1f44" }}>
                Tổng quan tài chính
              </h4>
              <p className="text-muted mb-0">Tóm tắt chi phí và lợi nhuận.</p>
            </div>

            <div className="card-body p-4 pt-0">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center"
                  style={{ width: 64, height: 64 }}
                >
                  <i className="bi bi-wallet2 fs-3"></i>
                </div>
                <div>
                  <div className="text-uppercase small fw-semibold text-muted">
                    Thu nhập thực tế
                  </div>
                  <h3 className="fw-bold mb-0">
                    {currency(reportStats.totalRevenue)}
                  </h3>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center"
                  style={{ width: 64, height: 64 }}
                >
                  <i className="bi bi-graph-down-arrow fs-3"></i>
                </div>
                <div>
                  <div className="text-uppercase small fw-semibold text-muted">
                    Chi phí vận hành
                  </div>
                  <h3 className="fw-bold mb-0">
                    {currency(reportStats.operatingCost)}
                  </h3>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                  style={{ width: 64, height: 64 }}
                >
                  <i className="bi bi-piggy-bank fs-3"></i>
                </div>
                <div>
                  <div className="text-uppercase small fw-semibold text-muted">
                    Lợi nhuận ròng
                  </div>
                  <h3 className="fw-bold mb-0 text-success">
                    {currency(reportStats.netProfit)}
                  </h3>
                </div>
              </div>

              <hr className="my-4" />

              <div className="p-3 rounded-4 bg-light">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Biên lợi nhuận</span>
                  <span className="fw-bold">73%</span>
                </div>
                <div className="progress rounded-pill" style={{ height: 10 }}>
                  <div className="progress-bar bg-success" style={{ width: "73%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product, region, status */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 p-4">
              <h4 className="fw-bold mb-1" style={{ color: "#0b1f44" }}>
                Sản phẩm bán chạy
              </h4>
              <p className="text-muted mb-0">Top sản phẩm có doanh số cao nhất.</p>
            </div>

            <div className="card-body p-4 pt-0">
              {dashboardTopProducts.map((item, index) => (
                <div
                  key={item.id}
                  className="d-flex align-items-center justify-content-between py-3 border-bottom"
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center"
                      style={{ width: 42, height: 42 }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div>
                      <div className="fw-bold">{item.name}</div>
                      <div className="text-muted small">
                        {currency(item.revenue)}
                      </div>
                    </div>
                  </div>

                  <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                    {item.sold} bán
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 p-4">
              <h4 className="fw-bold mb-1" style={{ color: "#0b1f44" }}>
                Khu vực đặt hàng
              </h4>
              <p className="text-muted mb-0">Tỷ lệ đơn hàng theo khu vực.</p>
            </div>

            <div className="card-body p-4 pt-0">
              {dashboardOrderRegions.map((item) => (
                <div key={item.name} className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold">{item.name}</span>
                    <span className="fw-bold">{percent(item.value)}</span>
                  </div>
                  <div className="progress rounded-pill" style={{ height: 10 }}>
                    <div
                      className="progress-bar"
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              <div className="p-3 rounded-4 bg-light mt-3">
                <i className="bi bi-info-circle me-2 text-primary"></i>
                Hồ Chí Minh đang là khu vực có lượng đơn cao nhất.
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 p-4">
              <h4 className="fw-bold mb-1" style={{ color: "#0b1f44" }}>
                Trạng thái đơn hàng
              </h4>
              <p className="text-muted mb-0">Phân bổ trạng thái đơn hiện tại.</p>
            </div>

            <div className="card-body p-4 pt-0">
              {dashboardOrderStatus.map((item) => (
                <div
                  key={item.label}
                  className="d-flex justify-content-between align-items-center py-3 border-bottom"
                >
                  <div>
                    <span className={`badge rounded-pill px-3 py-2 ${item.badge}`}>
                      {item.label}
                    </span>
                  </div>
                  <div className="fw-bold fs-5">{item.value}%</div>
                </div>
              ))}

              <div className="mt-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Tỷ lệ hoàn thành</span>
                  <span className="fw-bold">58%</span>
                </div>
                <div className="progress rounded-pill" style={{ height: 10 }}>
                  <div className="progress-bar bg-success" style={{ width: "58%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-0 p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: "#0b1f44" }}>
              Báo cáo gần đây
            </h4>
            <p className="text-muted mb-0">
              Danh sách các báo cáo đã tạo trong hệ thống.
            </p>
          </div>

          <button
            className="btn btn-light border rounded-pill px-4"
            onClick={handleExport}
          >
            <i className="bi bi-file-earmark-spreadsheet me-2"></i>
            Tải Excel
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr className="text-uppercase small text-muted">
                <th className="ps-4">STT</th>
                <th>Mã báo cáo</th>
                <th>Tên báo cáo</th>
                <th>Doanh thu</th>
                <th>Đơn hàng</th>
                <th>Trạng thái</th>
                <th className="text-end pe-4">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {paginatedReports.length > 0 ? (
                paginatedReports.map((report, index) => (
                  <tr key={report.id}>
                    <td className="ps-4 fw-medium text-muted">{(page - 1) * pageSize + index + 1}</td>
                    <td>{report.reportCode}</td>

                    <td>
                      <div>{report.reportName}</div>
                      <div className="text-muted small">
                        Tạo lúc: {formatDateTime(report.createdAt)}
                      </div>
                    </td>

                    <td>
                      {currency(report.totalRevenue)}
                    </td>

                    <td>{report.totalOrders}</td>

                    <td>
                      <span
                        className={`badge rounded-pill px-3 py-2 ${report.status === "created"
                          ? "bg-success-subtle text-success-emphasis"
                          : "bg-warning-subtle text-warning-emphasis"
                          }`}
                      >
                        {report.status === "created" ? "Đã tạo" : report.status}
                      </span>
                    </td>

                    <td className="text-end pe-4">
                      <button
                        className="btn btn-light btn-sm border rounded-pill me-2"
                        onClick={() => setSelectedReport(report)}
                      >
                        <i className="bi bi-eye me-1"></i>
                        Xem
                      </button>

                      <button
                        className="btn btn-primary btn-sm rounded-pill me-2"
                        onClick={() => handleDownloadReport(report)}
                      >
                        <i className="bi bi-download me-1"></i>
                        Tải
                      </button>

                      <button
                        className="btn btn-outline-danger btn-sm rounded-pill"
                        onClick={() => openDeleteConfirm(report)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="text-center py-5">
                      <i className="bi bi-file-earmark-bar-graph fs-1 text-secondary"></i>
                      <h5 className="fw-bold mt-3">
                        {loading ? "Đang tải báo cáo..." : "Chưa có báo cáo nào"}
                      </h5>
                      <p className="text-muted mb-0">
                        Bấm “Xuất báo cáo” để tạo báo cáo mới và lưu vào database.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top bg-white">
            <div className="pagination-info fw-bold-700 text-dark">
              Hiển thị {Math.min((page - 1) * pageSize + 1, reports.length)} –{" "}
              {Math.min(page * pageSize, reports.length)} trong tổng số{" "}
              {reports.length} báo cáo
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
                    localStorage.setItem("adminPageSize_reports", newSize);
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
      {selectedReport && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(15,23,42,.65)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header px-4 py-3 border-bottom-0" style={{ backgroundColor: '#f4e6cbff', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
                <div>
                  <h5 className="modal-title fw-bold mb-1 text-dark">
                    <i className="bi bi-file-earmark-bar-graph me-2 text-primary"></i>
                    Chi tiết báo cáo
                  </h5>
                  <small className="text-muted">
                    {selectedReport.reportCode} - {selectedReport.reportName}
                  </small>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedReport(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="card border-0 bg-light rounded-4 h-100">
                      <div className="card-body p-4">
                        <h6 className="fw-bold mb-3">Thông tin báo cáo</h6>

                        <div className="mb-3">
                          <div className="text-muted small">Mã báo cáo</div>
                          <div className="fw-semibold">{selectedReport.reportCode}</div>
                        </div>

                        <div className="mb-3">
                          <div className="text-muted small">Tên báo cáo</div>
                          <div className="fw-semibold">{selectedReport.reportName}</div>
                        </div>

                        <div className="mb-3">
                          <div className="text-muted small">Loại báo cáo</div>
                          <div className="fw-semibold">
                            {{ revenue: "Doanh thu", inventory: "Tồn kho", customer: "Khách hàng", order: "Đơn hàng" }[selectedReport.reportType] || selectedReport.reportType}
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-muted small">Kỳ báo cáo</div>
                          <div className="fw-semibold">
                            {{ today: "Hôm nay", week: "Tuần này", month: "Tháng này", quarter: "Quý này", year: "Năm nay" }[selectedReport.periodType] || selectedReport.periodType}
                          </div>
                        </div>

                        <div>
                          <div className="text-muted small">Trạng thái</div>
                          <span
                            className={`badge rounded-pill px-3 py-2 ${selectedReport.status === "created"
                              ? "bg-success-subtle text-success-emphasis"
                              : "bg-warning-subtle text-warning-emphasis"
                              }`}
                          >
                            {selectedReport.status === "created"
                              ? "Đã tạo"
                              : selectedReport.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card border-0 bg-light rounded-4 h-100">
                      <div className="card-body p-4">
                        <h6 className="fw-bold mb-3">Số liệu thống kê</h6>

                        <div className="mb-3">
                          <div className="text-muted small">Doanh thu</div>
                          <div className="fw-bold fs-5 text-success">
                            {currency(selectedReport.totalRevenue)}
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-muted small">Tổng đơn hàng</div>
                          <div className="fw-semibold">{selectedReport.totalOrders}</div>
                        </div>

                        <div className="mb-3">
                          <div className="text-muted small">Tổng khách hàng</div>
                          <div className="fw-semibold">
                            {selectedReport.totalCustomers}
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-muted small">Tổng sản phẩm</div>
                          <div className="fw-semibold">
                            {selectedReport.totalProducts}
                          </div>
                        </div>

                        <div>
                          <div className="text-muted small">Thời gian tạo</div>
                          <div className="fw-semibold">
                            {formatDateTime(selectedReport.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer px-4 py-3 border-top-0 d-flex gap-3">
                <button
                  className="btn btn-light border rounded-pill flex-fill py-2"
                  onClick={() => setSelectedReport(null)}
                  style={{ fontWeight: '600' }}
                >
                  Đóng
                </button>

                <button
                  className="btn btn-primary rounded-pill flex-fill py-2"
                  onClick={() => handleDownloadReport(selectedReport)}
                  style={{ fontWeight: '600' }}
                >
                  <i className="bi bi-download me-2"></i>
                  Tải báo cáo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {deleteConfirm && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(15, 23, 42, 0.65)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-body p-0">
                <div className="p-4 text-center">
                  <div
                    className="mx-auto mb-3 rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center"
                    style={{ width: 72, height: 72 }}
                  >
                    <i className="bi bi-trash3 fs-2"></i>
                  </div>

                  <h4 className="fw-bold mb-2" style={{ color: "#0b1f44" }}>
                    Xóa báo cáo?
                  </h4>

                  <p className="text-muted mb-3">
                    Bạn có chắc muốn xóa báo cáo này khỏi hệ thống không?
                  </p>

                  <div className="bg-light rounded-4 p-3 text-start mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Mã báo cáo</span>
                      <span className="fw-bold">{deleteConfirm.reportCode}</span>
                    </div>

                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Tên báo cáo</span>
                      <span className="fw-semibold text-end">
                        {deleteConfirm.reportName}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Doanh thu</span>
                      <span className="fw-bold text-success">
                        {currency(deleteConfirm.totalRevenue)}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-light border rounded-pill px-4"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Hủy
                    </button>

                    <button
                      className="btn btn-danger rounded-pill px-4"
                      onClick={handleDeleteReport}
                    >
                      <i className="bi bi-trash3 me-2"></i>
                      Xóa báo cáo
                    </button>
                  </div>
                </div>

                <div className="bg-danger" style={{ height: 5 }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReports;