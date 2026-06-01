import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { adminMenuItems } from "../../constants/adminMenuItems";
import { formatTime } from "../../utils/formatTime";

function getAuth() {
  try {
    const authData = localStorage.getItem("auth");
    return authData ? JSON.parse(authData) : null;
  } catch {
    return null;
  }
}

function AdminHeader() {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  const auth = getAuth();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentPageTitle =
    adminMenuItems.find((item) => item.path === location.pathname)?.label || "Quản trị hệ thống";

  return (
    <header className="admin-top-navbar bg-white shadow-sm py-2 px-4 px-xl-5 d-flex justify-content-between align-items-center w-100">
      <div className="d-flex align-items-center gap-3">
        <h5 className="mb-0 fw-bold d-none d-md-block text-dark text-uppercase">
          {currentPageTitle}
        </h5>
      </div>

      <div className="d-flex align-items-center gap-4">
        <div className="header-time-box admin-time-box d-none d-lg-flex text-dark">
          <i className="bi bi-clock-history"></i>
          <span>{formatTime(currentTime)}</span>
        </div>  

        <div className="d-flex align-items-center gap-3 border-start ps-4">
          <div className="user-info-wrapper d-none d-sm-flex">
            <div className="user-name-premium">{auth?.fullName || "Admin User"}</div>
          </div>

          <div className="avatar-wrapper">
            <div className="avatar-modern">
              {auth?.fullName?.charAt(0) || "A"}
              <div className="status-indicator-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;