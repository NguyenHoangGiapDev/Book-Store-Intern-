import { Navigate, Outlet } from "react-router-dom";

function StaffProtectedRoute() {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const roleId = Number(
    user?.roleId ??
    user?.RoleId ??
    user?.roleID ??
    0
  );

  const roleName = String(
    user?.roleName ??
    user?.RoleName ??
    user?.role ??
    ""
  ).toLowerCase();

  const isStaff =
    roleId === 3 ||
    roleName === "staff";

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isStaff) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default StaffProtectedRoute;