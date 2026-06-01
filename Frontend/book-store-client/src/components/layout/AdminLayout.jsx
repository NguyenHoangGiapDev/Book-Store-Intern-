import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../common/Toast.jsx";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "../../styles/admin/AdminLayout.css";

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("authChanged"));
    showToast("Đã đăng xuất khỏi hệ thống quản trị", "success");
    navigate("/login");
  };

  useEffect(() => {
    const checkModals = () => {
      const hasModal = document.querySelector(
        ".modal-overlay-modern, .modal-confirm-backdrop, .modal-overlay, .stationery-book-modal-card"
      );

      if (hasModal) {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    };

    checkModals();

    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="admin-wrapper d-flex min-vh-100 bg-light">
      <AdminSidebar
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      <main
        className={`admin-main-content flex-grow-1 ${
          isSidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"
        }`}
      >
        <AdminHeader />

        <div className="admin-page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;