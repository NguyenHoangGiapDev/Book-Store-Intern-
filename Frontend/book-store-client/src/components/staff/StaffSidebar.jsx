import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";
import { useTranslation } from "react-i18next";
const menuItems = [
  { labelKey: "staff.menu.pos", path: "/staff/pos", icon: "🛒" },
  { labelKey: "staff.menu.orders", path: "/staff/orders", icon: "📦" },
  { labelKey: "staff.menu.products", path: "/staff/products", icon: "📚" },
  { labelKey: "staff.menu.customers", path: "/staff/customers", icon: "👥" },
  { labelKey: "staff.menu.returns", path: "/staff/returns", icon: "🔄" },
  { labelKey: "staff.menu.shift", path: "/staff/shift", icon: "💰" },
  { labelKey: "staff.menu.reports", path: "/staff/reports", icon: "📈" },
  { labelKey: "staff.menu.promotions", path: "/staff/promotions", icon: "🎁" },
  { labelKey: "staff.menu.loyalty", path: "/staff/loyalty", icon: "⭐" },
];
function StaffSidebar({ collapsed, onToggle }) {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleAuthChange = () => {
      try {
        setCurrentUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setCurrentUser(null);
      }
    };
    window.addEventListener("authChanged", handleAuthChange);
    return () => window.removeEventListener("authChanged", handleAuthChange);
  }, []);

  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("auth");
  localStorage.removeItem("role");

  window.dispatchEvent(new Event("authChanged"));

  setShowLogoutConfirm(false);

  showToast(
    t("staff.logoutSuccess", { defaultValue: "Đăng xuất thành công" }),
    "success"
  );

  navigate("/login", { replace: true });
};

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const API_BASE_URL = (import.meta.env.VITE_API_BASE || "http://localhost:5005/api").replace(/\/api$/, "");
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <aside className={collapsed ? "staff-sidebar staff-sidebar--collapsed" : "staff-sidebar"}>
      <div className="staff-sidebar__brand">
        <div className="staff-sidebar__brand-text">
          <h2>{t("staff.brand")}</h2>
        </div>
          <button
            type="button"
            className="staff-sidebar__toggle"
            onClick={onToggle}
            title={collapsed ? t("staff.expandSidebar") : t("staff.collapseSidebar")}
          >
            {collapsed ? (
              <svg
                className="staff-sidebar__toggle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            ) : (
              <svg
                className="staff-sidebar__toggle-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            )}
          </button>
      </div>
      <nav className="staff-sidebar__nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              isActive
                ? "staff-sidebar__link staff-sidebar__link--active"
                : "staff-sidebar__link"
            }
          >
            <span className="staff-sidebar__icon">{item.icon}</span>
            <span className="staff-sidebar__text">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="staff-sidebar__footer">
        <button
          type="button"
          className="staff-sidebar__user staff-sidebar__user--clickable"
          onClick={() => navigate("/staff/profile")}
          title={t("staff.menu.profile")}
        >
          <div className="staff-sidebar__avatar-container">
            <div className="staff-sidebar__avatar">
              {currentUser?.avatar ? (
                <img src={getImageUrl(currentUser.avatar)} alt={t("staff.avatarAlt")} />
              ) : (
                currentUser?.fullName?.charAt(0)?.toUpperCase() ||
                currentUser?.name?.charAt(0)?.toUpperCase() ||
                "S"
              )}
            </div>
            <span className="staff-sidebar__online-badge"></span>
          </div>

          <div className="staff-sidebar__user-info">
            <strong>{currentUser?.fullName || currentUser?.name || "Staff01"}</strong>
            <p>{t("staff.online")}</p>
          </div>
        </button>
       <div className="staff-sidebar__logout-wrap">
  <button
    type="button"
    className="staff-sidebar__logout"
    onClick={handleLogoutClick}
    title={t("common.logout")}
    aria-label={t("common.logout")}>
    <svg
      className="staff-sidebar__logout-svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M10 17L15 12L10 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
    <span className="staff-sidebar__logout-text">{t("common.logout")}</span>
  </button>
</div>
      </div>
            <ConfirmModal
  show={showLogoutConfirm}
  titleKey="common.logout"
  messageKey="staff.logoutConfirmMessage"
  cancelTextKey="common.cancel"
  confirmTextKey="common.logout"
  onConfirm={handleConfirmLogout}
  onCancel={handleCancelLogout}
  type="warning"
/>
    </aside>
  );
}
export default StaffSidebar;