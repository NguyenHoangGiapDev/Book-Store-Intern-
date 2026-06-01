import React, { useState } from "react";
import { apiRequest } from "../../services/apiClient.js";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";
import "../../styles/admin/AdminStationery.css";


const AdminCustomers = ({ users = [], refresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_users");
    return saved ? Number(saved) : 6;
  });
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [showPassword, setShowPassword] = useState(false);

  const filteredUsers = (users || []).filter(u => {
    const name = (u.fullName || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const phone = (u.phoneNumber || "").toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
                          email.includes(searchTerm.toLowerCase()) ||
                          phone.includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "all" || 
                        (filterRole === "admin" && u.roleId === 2) || 
                        (filterRole === "staff" && u.roleId === 3) || 
                        (filterRole === "customer" && u.roleId === 1);
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleDelete = (id) => {
    setConfirmDelete({ show: true, id });
  };

  const executeDelete = async () => {
    try {
      await apiRequest(`/users/${confirmDelete.id}`, { method: "DELETE" });
      showToast("Đã xóa tài khoản thành công", "success");
      setConfirmDelete({ show: false, id: null });
      refresh?.();
    } catch (err) {
      showToast("Lỗi khi xóa tài khoản", "error");
      setConfirmDelete({ show: false, id: null });
    }
  };
  const handleToggleStatus = async (user) => {
    try {
      const payload = {
        FullName: user.fullName,
        Email: user.email,
        PhoneNumber: user.phoneNumber || null,
        Address: user.address || null,
        RoleId: Number(user.roleId) || 1,
        IsActive: !(user.isActive !== false),
      };
      await apiRequest(`/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      showToast(
        user.isActive !== false ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
        "success"
      );
      refresh?.();
    } catch (err) {
      console.error("Toggle User Status Error:", err);
      showToast("Lỗi khi cập nhật trạng thái", "error");
    }
  };
  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setIsAdding(false);
    } else {
      setEditingUser({ fullName: '', email: '', phoneNumber: '', address: '', roleId: 1, password: '', isActive: true });
      setIsAdding(true);
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData.entries());
    
    const payload = {
      FullName: userData.fullName?.trim() || "Người dùng",
      Email: userData.email?.trim(),
      PhoneNumber: userData.phoneNumber?.trim() || null,
      Address: userData.address?.trim() || null,
      RoleId: parseInt(userData.roleId) || 1,
      IsActive: isAdding ? true : editingUser?.isActive !== false
    };

    if (userData.password?.trim()) {
      payload.Password = userData.password.trim();
    }

    try {
      if (isAdding) {
        await apiRequest(`/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        showToast("Thêm tài khoản thành công", "success");
      } else {
        await apiRequest(`/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        // Nếu admin có nhập mật khẩu mới khi cập nhật, gọi thêm API đổi mật khẩu
        if (userData.password?.trim()) {
          await apiRequest(`/users/${editingUser.id}/password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              OldPassword: "admin_override", // Backend không check OldPassword
              NewPassword: userData.password.trim() 
            })
          });
        }
        
        showToast("Cập nhật thành công", "success");
      }
      refresh?.();
      setShowModal(false);
    } catch (err) {
      console.error("User Save Error:", err);
      showToast("Lỗi: Kiểm tra lại Email hoặc thông tin bắt buộc", "error");
    }
  };

  return (
    <div className="admin-stationery-portal animate-fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
      </div>
      {/* Thống kê */}
      <div className="row g-2 mb-3">
        {[
          { label: "Tổng số thành viên", value: users.length, icon: "bi-people", color: "#6366f1" },
          { label: "Đội ngũ quản trị", value: users.filter(u => u.roleId === 2).length, icon: "bi-shield-check", color: "#f43f5e"},
          { label: "Nhân viên vận hành", value: users.filter(u => u.roleId === 3).length, icon: "bi-person-badge", color: "#f59e0b"},
          { label: "Số lượng khách hàng", value: users.filter(u => u.roleId === 1).length, icon: "bi-person-heart", color: "#10b981"}
        ].map((s, idx) => (
          <div className="col-xl-3 col-md-6 d-flex" key={idx}>
            <div className="stat-card-modern stationery-stat-card p-2 rounded-3 shadow-sm bg-white border-0 position-relative d-flex align-items-center gap-3 w-100 h-100">
              <div className="icon-box-modern rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
                <i className={`bi ${s.icon} fs-5`}></i>
              </div>
              <div className="flex-grow-1">
                <div className="label fw-bold text-slate-500 x-small text-uppercase mb-0">{s.label}</div>
                <div className="value fw-800 fs-5 text-slate-900">{s.value}</div>
              </div>
              <div className="decoration-bar" style={{ background: s.color }}></div>
            </div>
          </div>
        ))}
      </div>
      {/* Filter + Table */}
      <div className="card stationery-table-card border-0 shadow-sm rounded-4 bg-white">
        <div className="card-header bg-white border-bottom border-slate-100 p-3">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="modern-search-box">
                <i className="bi bi-search"></i>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Tìm kiếm theo danh tính, email hoặc số điện thoại..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="stationery-filter-select-wrap">
                <select 
                  className="form-select modern-select stationery-filter-select" 
                  value={filterRole} 
                  onChange={(e) => {
                    setFilterRole(e.target.value);
                    setPage(1);
                  }}>
                  <option value="all">Tất cả vai trò</option>
                  <option value="admin">Quản trị viên</option>
                  <option value="staff">Nhân viên hệ thống</option>
                  <option value="customer">Khách hàng</option>
                </select>
                {filterRole !== "all" && (
                  <button 
                    type="button" 
                    className="stationery-filter-clear-btn" 
                    onClick={() => {
                      setFilterRole("all");
                      setPage(1);
                    }}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-3 text-md-end">
              <button
                type="button"
                className="btn btn-primary-premium w-100 fw-bold h-100 rounded-3 shadow-sm"
                onClick={() => openModal()}
              >
                <i className="bi bi-person-plus-fill me-1"></i>
                Cấp tài khoản mới
              </button>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-scroll-x">
            <table className="table table-modern align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-3">STT</th>
                  <th className="ps-4">Thành viên</th>
                  <th>Liên hệ</th>
                  <th>Phân quyền</th>
                  <th>Trạng thái</th>
                  <th className="action-col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <i className="bi bi-person-x fs-1 text-slate-200"></i>
                      <p className="text-slate-400 fw-bold mt-2">Không có dữ liệu người dùng</p>
                    </td>
                  </tr>
                ) : paginatedUsers.map((u, idx) => (
                  <tr key={u.id}>
                    <td className="ps-3 py-2">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="ps-4 py-2">
                      <div>
                        <div className="fw-800 text-slate-900 mb-0">{u.fullName}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-slate-600 fw-semibold small mb-0">{u.email}</div>
                      <div className="small text-slate-400">{u.phoneNumber || 'Không có SĐT'}</div>
                    </td>
                    <td>
                      <span className="cat-badge" style={{ backgroundColor: u.roleId === 2 ? '#fee2e2' : u.roleId === 3 ? '#fef3c7' : '#e0e7ff', color: u.roleId === 2 ? '#ef4444' : u.roleId === 3 ? '#d97706' : '#4f46e5' }}>
                         <i className={`bi ${u.roleId === 2 ? 'bi-shield-fill' : u.roleId === 3 ? 'bi-person-badge-fill' : 'bi-person-fill'} me-1`}></i>
                         {u.roleId === 2 ? 'Quản trị viên' : u.roleId === 3 ? 'Nhân viên' : 'Khách hàng'}
                      </span>
                    </td>
                    <td>
                       <div className="form-check form-switch modern-switch mb-0">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={u.isActive !== false} 
                            onChange={() => handleToggleStatus(u)} 
                          />
                          <span className={`ms-2 small fw-bold ${u.isActive !== false ? 'text-success' : 'text-slate-400'}`}>
                             {u.isActive !== false ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
                          </span>
                       </div>
                    </td>
                    <td className="action-col">
                      <div className="action-buttons">
                        <button type="button" className="action-btn edit-btn" onClick={() => openModal(u)} title="Chỉnh sửa">
                           <i className="bi bi-pencil-square"></i>
                        </button>
                        <button type="button" className="action-btn delete-btn" onClick={() => handleDelete(u.id)} title="Xóa">
                           <i className="bi bi-trash3-fill"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="pagination-container rounded-bottom-4" style={{ borderTop: 'none' }}>
            <div className="pagination-info fw-bold-700 text-dark">
              Hiển thị {Math.min((page - 1) * pageSize + 1, filteredUsers.length)} –{" "}
              {Math.min(page * pageSize, filteredUsers.length)} trong tổng số{" "}
              {filteredUsers.length} người dùng
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
                    localStorage.setItem("adminPageSize_users", newSize);
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay-modern animate-fade-in">
          <div className="stationery-book-modal-card animate-scale-in">
            <form onSubmit={handleSave} className="stationery-book-modal-form">
              <div className="stationery-book-modal-header">
                <div>
                  <h5 className="stationery-book-modal-title">
                    <i className={`bi ${isAdding ? "bi-person-plus-fill" : "bi-pencil-square"} me-2`}></i>
                    {isAdding ? 'Cấp tài khoản mới' : 'Cập nhật'}
                  </h5>
                </div>
                <button type="button" className="stationery-book-modal-close" onClick={() => setShowModal(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="stationery-book-modal-body" style={{ gridTemplateColumns: '1fr' }}>
                <div className="stationery-book-form-pane">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="stationery-book-label"><i className="bi bi-person-lines-fill me-1"></i>Họ và tên đầy đủ</label>
                      <input type="text" name="fullName" className="stationery-book-input" defaultValue={editingUser?.fullName} placeholder="VD: Nguyễn Văn A" required />
                    </div>
                    <div className="col-md-6">
                      <label className="stationery-book-label"><i className="bi bi-envelope-fill me-1"></i>Email đăng nhập</label>
                      <input type="email" name="email" className="stationery-book-input" defaultValue={editingUser?.email} placeholder="email@example.com" required />
                    </div>
                    <div className="col-md-6">
                      <label className="stationery-book-label"><i className="bi bi-telephone-fill me-1"></i>Số điện thoại</label>
                      <input type="text" name="phoneNumber" className="stationery-book-input" defaultValue={editingUser?.phoneNumber} placeholder="0123 456 789" />
                    </div>
                    <div className="col-12">
                      <label className="stationery-book-label"><i className="bi bi-key-fill me-1"></i>{isAdding ? "Thiết lập mật khẩu" : "Cấp lại mật khẩu"}</label>
                      <div className="input-group-modern position-relative">
                        <input type={showPassword ? "text" : "password"} name="password" className="stationery-book-input w-100" style={{ paddingRight: '40px' }} required={isAdding} minLength="6" placeholder={isAdding ? "Tối thiểu 6 ký tự" : "Để trống nếu không đổi mật khẩu"} />
                        <button type="button" className="btn position-absolute end-0 top-50 translate-middle-y border-0" style={{ zIndex: 10, color: '#64748b' }} onClick={() => setShowPassword(!showPassword)}>
                           <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                        </button>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="stationery-book-label"><i className="bi bi-geo-alt-fill me-1"></i>Địa chỉ thường trú</label>
                      <textarea name="address" className="stationery-book-input" rows="2" defaultValue={editingUser?.address} placeholder="Số nhà, tên đường..."></textarea>
                    </div>
                    <div className="col-12">
                      <label className="stationery-book-label"><i className="bi bi-shield-lock-fill me-1"></i>Chọn nhóm vai trò</label>
                      <select name="roleId" className="stationery-book-input" defaultValue={editingUser?.roleId || 1}>
                        <option value="1">Khách hàng</option>
                        <option value="3">Nhân viên hệ thống</option>
                        <option value="2">Quản trị viên</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="stationery-book-modal-footer">
                <button type="button" className="stationery-book-btn-cancel" onClick={() => setShowModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="stationery-book-btn-save">
                  <i className="bi bi-check2-circle me-2"></i> Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      <ConfirmModal 
        show={confirmDelete.show}
        title="Xóa tài khoản"
        message="Hệ thống sẽ xóa vĩnh viễn tài khoản này. Hành động này không thể hoàn tác. Bạn có chắc chắn?"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ show: false, id: null })}
        type="danger"
      />
    </div>
  );
};

export default AdminCustomers;
