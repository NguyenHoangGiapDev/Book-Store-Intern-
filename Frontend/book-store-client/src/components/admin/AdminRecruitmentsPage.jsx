import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/apiClient";
import { showToast } from "../../components/common/Toast.jsx";

function AdminRecruitmentsPage() {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchApplications = async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      const data = await apiRequest("/recruitments");
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch recruitments error:", error);
      if (!isBackground) showToast("Không thể tải danh sách ứng tuyển.", "error");
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const intervalId = setInterval(() => {
      fetchApplications(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await apiRequest(`/recruitments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setApplications((prev) =>
        prev.map((item) => {
          const itemId = item.id || item.Id;
          return itemId === id ? { ...item, status } : item;
        })
      );

      showToast("Cập nhật trạng thái thành công.", "success");
    } catch (error) {
      console.error("Update recruitment status error:", error);
      showToast("Cập nhật trạng thái thất bại.", "error");
    }
  };

  const deleteApplication = async (id) => {
    const ok = window.confirm("Bạn có chắc muốn xóa đơn ứng tuyển này?");
    if (!ok) return;

    try {
      await apiRequest(`/recruitments/${id}`, {
        method: "DELETE",
      });

      setApplications((prev) => prev.filter((item) => item.id !== id));
      showToast("Xóa đơn ứng tuyển thành công.", "success");
    } catch (error) {
      console.error("Delete recruitment error:", error);
      showToast("Xóa đơn ứng tuyển thất bại.", "error");
    }
  };

  const filteredApplications = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return applications.filter((item) => {
      const fullName = item.fullName || item.FullName || "";
      const email = item.email || item.Email || "";
      const phone = item.phone || item.Phone || "";
      const position = item.position || item.Position || "";
      const status = item.status || item.Status || "pending";

      const matchesSearch =
        !keyword ||
        fullName.toLowerCase().includes(keyword) ||
        email.toLowerCase().includes(keyword) ||
        phone.toLowerCase().includes(keyword) ||
        position.toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const getStatus = (item) => item.status || item.Status || "pending";

    return {
      total: applications.length,
      pending: applications.filter((x) => getStatus(x) === "pending").length,
      reviewing: applications.filter((x) => getStatus(x) === "reviewing").length,
      accepted: applications.filter((x) => getStatus(x) === "accepted").length,
      rejected: applications.filter((x) => getStatus(x) === "rejected").length,
    };
  }, [applications]);

  useEffect(() => {
    setCurrentPage(1);
    }, [searchTerm, statusFilter, rowsPerPage]);

    const totalPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / rowsPerPage)
    );

    const safeCurrentPage = Math.min(currentPage, totalPages);

    const firstItemIndex =
    filteredApplications.length === 0
        ? 0
        : (safeCurrentPage - 1) * rowsPerPage;

    const lastItemIndex = Math.min(
    firstItemIndex + rowsPerPage,
    filteredApplications.length
    );

    const paginatedApplications = filteredApplications.slice(
    firstItemIndex,
    lastItemIndex
    );

    const visiblePages = useMemo(() => {
    const maxVisiblePages = 5;
    const pages = [];

    let startPage = Math.max(
        1,
        safeCurrentPage - Math.floor(maxVisiblePages / 2)
    );

    let endPage = Math.min(
        totalPages,
        startPage + maxVisiblePages - 1
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page += 1) {
        pages.push(page);
    }

    return pages;
    }, [safeCurrentPage, totalPages]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "Không rõ";

    return new Date(dateValue).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "reviewing":
        return "Đang xem xét";
      case "accepted":
        return "Đã nhận";
      case "rejected":
        return "Từ chối";
      default:
        return "Không rõ";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-warning-subtle text-warning";
      case "reviewing":
        return "bg-info-subtle text-info";
      case "accepted":
        return "bg-success-subtle text-success";
      case "rejected":
        return "bg-danger-subtle text-danger";
      default:
        return "bg-secondary-subtle text-secondary";
    }
  };

  const statusOptions = [
    { value: "pending", label: "Chờ xử lý" },
    { value: "reviewing", label: "Đang xem xét" },
    { value: "accepted", label: "Đã nhận" },
    { value: "rejected", label: "Từ chối" },
  ];

  const renderStatCard = ({ icon, label, value, color, barColor }) => (
    <div className="col-xl-3 col-md-6">
      <div className="stat-card-modern stationery-stat-card h-100 p-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="icon-box-modern rounded-4 d-flex align-items-center justify-content-center"
            style={{ color }}
          >
            <i className={`bi ${icon}`}></i>
          </div>

          <div>
            <div className="label text-muted fw-bold text-uppercase">
              {label}
            </div>
            <div className="value fw-black">{value}</div>
          </div>
        </div>

        <div
          className="decoration-bar"
          style={{ background: barColor || color }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="admin-authors-page admin-recruitments-page animate-fade-in pt-3 mt-2">
      <div className="row g-3 mb-4 admin-recruitments-stats-row">
        {renderStatCard({
          icon: "bi-people-fill",
          label: "Tổng đơn",
          value: stats.total,
          color: "#4f46e5",
          barColor: "#6366f1",
        })}

        {renderStatCard({
          icon: "bi-hourglass-split",
          label: "Chờ xử lý",
          value: stats.pending,
          color: "#f59e0b",
          barColor: "#f59e0b",
        })}

        {renderStatCard({
          icon: "bi-person-check-fill",
          label: "Đã nhận",
          value: stats.accepted,
          color: "#10b981",
          barColor: "#10b981",
        })}

        {renderStatCard({
          icon: "bi-person-x-fill",
          label: "Từ chối",
          value: stats.rejected,
          color: "#e11d48",
          barColor: "#e11d48",
        })}
      </div>

      <div className="stationery-table-card stat-card-modern bg-white animate-scale-in admin-recruitments-table-card">
        <div className="p-4 border-bottom">
            <div className="row g-3 align-items-center">
                <div className="col-lg-8">
                <div className="modern-search-box">
                    <i className="bi bi-search"></i>
                    <input
                    type="text"
                    placeholder="Tìm theo tên, email, số điện thoại, vị trí..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    />
                </div>
                </div>

                <div className="col-lg-4">
                <div className="status-filter-wrapper">
                    <select
                    className="stationery-book-input status-filter-select"
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    >
                    <option value="all">Tất cả trạng thái</option>
                    {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                        {status.label}
                        </option>
                    ))}
                    </select>

                    {statusFilter !== "all" && (
                    <button
                        type="button"
                        className="status-filter-clear"
                        title="Xóa lọc trạng thái"
                        onClick={() => {
                        setStatusFilter("all");
                        setCurrentPage(1);
                        }}
                    >
                        <span>×</span>
                    </button>
                    )}
                </div>
                </div>
            </div>
            </div>

        <div className="table-scroll-x">
          <table className="table table-modern recruitments-table align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: "70px" }}>STT</th>
                <th style={{ width: "270px" }}>Ứng viên</th>
                <th style={{ width: "190px" }}>Vị trí</th>
                <th style={{ width: "340px", textAlign: "left" }}>Nội dung</th>
                <th style={{ width: "180px" }}>Thời gian</th>
                <th style={{ width: "160px" }}>Trạng thái</th>
                <th className="action-col">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 fw-bold text-muted">
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted fw-bold">
                    <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                    Không tìm thấy đơn ứng tuyển nào
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((item, index) => {
                  const id = item.id || item.Id;
                  const fullName = item.fullName || item.FullName || "Không rõ";
                  const email = item.email || item.Email || "";
                  const phone = item.phone || item.Phone || "";
                  const position = item.position || item.Position || "Không rõ";
                  const message = item.message || item.Message || "";
                  const status = item.status || item.Status || "pending";
                  const createdAt = item.createdAt || item.CreatedAt;

                  return (
                    <tr key={id}>
                      <td>{ firstItemIndex + index + 1}</td>

                      <td>
                        <div className="fw-black text-dark">{fullName}</div>
                        <div className="text-muted small fw-semibold">
                          <i className="bi bi-envelope me-1"></i>
                          {email}
                        </div>
                        <div className="text-muted small fw-semibold">
                          <i className="bi bi-telephone me-1"></i>
                          {phone}
                        </div>
                      </td>

                      <td>
                        <span className="badge bg-indigo-subtle rounded-pill px-3 py-2 fw-bold">
                          {position}
                        </span>
                      </td>

                      <td style={{ textAlign: "left" }}>
                        <div
                          className="text-muted fw-semibold"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                          title={message}
                        >
                          {message || "Không có nội dung"}
                        </div>
                      </td>

                      <td className="fw-semibold">{formatDate(createdAt)}</td>

                      <td>
                        <span
                          className={`badge rounded-pill px-3 py-2 fw-bold ${getStatusClass(
                            status
                          )}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </td>

                      <td className="action-col">
                        <div className="action-buttons">
                          <select
                            className="stationery-book-input status-select"
                            value={status}
                            onChange={(e) => updateStatus(id, e.target.value)}
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="action-btn delete-btn"
                            title="Xóa đơn ứng tuyển"
                            onClick={() => deleteApplication(id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

                      </table>
        </div>

        <div className="pagination-container" style={{ borderTop: "none" }}>
          <div className="pagination-info fw-bold-700 text-dark">
            {filteredApplications.length === 0
              ? "Không có đơn ứng tuyển"
              : `Hiển thị ${firstItemIndex + 1} – ${lastItemIndex} trong tổng số ${filteredApplications.length} đơn ứng tuyển`}
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="text-slate-800 fw-bold text-uppercase" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>Số dòng:</span>
              <select
                className="form-select form-select-sm shadow-sm"
                style={{ width: '70px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
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
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {visiblePages.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`pagination-btn ${safeCurrentPage === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="pagination-btn"
                disabled={safeCurrentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRecruitmentsPage;