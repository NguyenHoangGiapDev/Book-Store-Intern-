import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { adminMenuItems } from "../../constants/adminMenuItems";
function AdminSidebar({ isSidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const toggleGroup = (id) => {
    setOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const handleAdminLogout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("auth");
      localStorage.removeItem("cart");
      localStorage.removeItem("cartItems");
      sessionStorage.clear();
      window.dispatchEvent(new Event("authChanged"));
      window.dispatchEvent(new Event("cartUpdated"));
      window.location.href = "/login";
    } catch (error) {
      console.error("Admin logout error:", error);
      window.location.href = "/login";
    }
  };
  return (
    <>
      <aside
        className={`admin-sidebar transition-all shadow-lg ${
          isSidebarOpen ? "expanded" : "collapsed"
        }`}>
        <div className="sidebar-header p-4 d-flex align-items-center justify-content-between">
          {isSidebarOpen && (
            <Link
              to="/admin"
              className="text-dark text-decoration-none d-flex align-items-center gap-2"
            >
              <i className="bi bi-journal-text fs-3 text-dark"></i>
              <span className="fw-bold fs-5 ls-tight">Book-Store Admin</span>
            </Link>
          )}

          <button
            type="button"
            className="btn btn-link text-dark p-0 border-0"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
          >
            <i
              className={`bi ${
                isSidebarOpen ? "bi-chevron-left" : "bi-list fs-3"
              }`}
            ></i>
          </button>
        </div>

        <div className="sidebar-menu flex-grow-1 overflow-y-auto custom-scrollbar p-3">
          <nav className="nav flex-column gap-1">
            {adminMenuItems.map((item) => (
              <div key={item.id} className="nav-item-wrapper">
                {item.children ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.id)}
                      className={`nav-link admin-menu-parent d-flex align-items-center justify-content-between py-2 px-3 rounded-3 transition-all text-white-50 hover-bg-dark mb-1 w-100 border-0 bg-transparent text-start ${
                        location.pathname.startsWith(item.path)
                          ? "text-white"
                          : ""
                      }`}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <i className={`bi ${item.icon} fs-5`}></i>
                        {isSidebarOpen && (
                          <span className="fw-medium">{item.label}</span>
                        )}
                      </div>

                      {isSidebarOpen && (
                        <i
                          className={`bi bi-chevron-${
                            openGroups[item.id] ? "down" : "right"
                          } small opacity-50`}
                        ></i>
                      )}
                    </button>

                    {isSidebarOpen && openGroups[item.id] && (
                      <div className="nav flex-column gap-1 ps-4 mb-2 animate-fade-in">
                        {item.children.map((child) => (
                          <Link
                            key={child.id}
                            to={child.path}
                            className={`nav-link py-2 px-3 rounded-3 transition-all small ${
                              location.pathname === child.path
                                ? "bg-primary text-white active-shadow"
                                : "text-white-50 hover-bg-dark"
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`nav-link d-flex align-items-center gap-3 py-2 px-3 rounded-3 transition-all mb-1 ${
                      location.pathname === item.path
                        ? "bg-primary text-white active-shadow"
                        : "text-white-50 hover-bg-dark"
                    }`}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <i className={`bi ${item.icon} fs-5`}></i>
                    {isSidebarOpen && (
                      <span className="fw-medium">{item.label}</span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer p-3 position-absolute bottom-0 w-100">
          <button
            type="button"
            className="btn btn-outline-danger rounded-pill fw-bold w-100 py-3 d-flex align-items-center justify-content-center gap-2"
            onClick={() => setShowLogoutModal(true)}
            title="Đăng xuất"
          >
            <i className="bi bi-box-arrow-right"></i>
            {isSidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {showLogoutModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            zIndex: 9999,
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content border-0 shadow-lg"
              style={{
                borderRadius: "22px",
                overflow: "hidden",
              }}
            >
              <div className="modal-body text-center p-5">
                <div
                  className="mx-auto mb-4 d-flex align-items-center justify-content-center"
                  style={{
                    width: "76px",
                    height: "76px",
                    borderRadius: "50%",
                    background: "rgba(239, 68, 68, 0.12)",
                    color: "#ef4444",
                  }}
                >
                  <i
                    className="bi bi-box-arrow-right"
                    style={{ fontSize: "38px" }}
                  ></i>
                </div>

                <h4 className="fw-bold mb-2">Xác nhận đăng xuất</h4>

                <p className="text-muted mb-4">
                  Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị không?
                </p>

                <div className="d-flex gap-3 justify-content-center">
  <button
    type="button"
    className="btn btn-light rounded-pill py-2 fw-bold"
    style={{
      width: "150px",
      height: "48px",
    }}
    onClick={() => setShowLogoutModal(false)}
  >
    Hủy
  </button>

  <button
    type="button"
    className="btn btn-danger rounded-pill py-2 fw-bold"
    style={{
      width: "150px",
      height: "48px",
    }}
    onClick={handleAdminLogout}
  >
    Đăng xuất
  </button>
</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default AdminSidebar;