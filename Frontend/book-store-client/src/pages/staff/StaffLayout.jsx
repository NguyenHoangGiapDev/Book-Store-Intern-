import { useState } from "react";
import { Outlet } from "react-router-dom";
import StaffSidebar from "../../components/staff/StaffSidebar";
import StaffHeader from "../../components/staff/StaffHeader";
import "../../styles/staff/staff.css";

function StaffLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`staff-layout ${
        collapsed ? "staff-layout--collapsed" : ""
      }`}
    >
      <StaffSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />

      <main className="staff-main"> 
        <StaffHeader />

        <section className="staff-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
export default StaffLayout;