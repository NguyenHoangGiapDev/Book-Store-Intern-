import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { staffTitleMap } from "../../constants/staffTitleMap";
import { formatTime } from "../../utils/formatTime";
import "../../styles/staff/StaffHeader.css";
import { useTranslation } from "react-i18next";

function StaffHeader() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  const titleKey = staffTitleMap[location.pathname];
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="staff-header">
      <div className="staff-header__left">
        {titleKey && <h1>{t(titleKey)}</h1>}
      </div>
      <div className="staff-header__right">
        <div className="header-time-box staff-header__time">
          <i className="bi bi-clock-history"></i>
          <span>{formatTime(currentTime)}</span>
        </div>  
        <div className="staff-header__notification-wrap">
          <button
            type="button"
            className="staff-header__notification"
            onClick={() => setShowNotifications((prev) => !prev)}
          >
            🔔
            <span>3</span>
          </button>
          {showNotifications && (
            <div className="staff-header__notification-box">
              <h4>{t("header.quickNotifications")}</h4>
              <div className="staff-header__notice-item">
                <strong>{t("dashboard.lowStockWarningTitle")}</strong>
                <p>{t("header.lowStockDesc")}</p>
              </div>
              <div className="staff-header__notice-item">
                <strong>{t("pos.draftOrders")}</strong>
                <p>{t("header.draftsDesc")}</p>
              </div>
              <div className="staff-header__notice-item">
                <strong>{t("dashboard.shiftOpenTitle")}</strong>
                <p>{t("header.shiftDesc")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
export default StaffHeader;