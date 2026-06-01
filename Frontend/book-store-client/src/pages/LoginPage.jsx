import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient";
import { useNavigate, Link } from "react-router-dom";
import { showToast } from "../components/common/Toast.jsx";
import "../styles/AuthPages.css";
function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam === "account_locked") {
      showToast("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", "error");
      localStorage.removeItem("auth");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    } else if (errorParam === "session_expired") {
      showToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "warning");
      localStorage.removeItem("auth");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

  try {
    const storedAuth = localStorage.getItem("auth") || localStorage.getItem("user");

    if (!storedAuth) return;

    const user = JSON.parse(storedAuth);
    const roleId = Number(user.roleId || 1);

    if (roleId === 2 && window.location.pathname !== "/admin") {
      navigate("/admin", { replace: true });
      return;
    }

    if (roleId === 3 && !window.location.pathname.startsWith("/staff")) {
      navigate("/staff", { replace: true });
      return;
    }

    if (roleId === 1 && window.location.pathname !== "/") {
      navigate("/", { replace: true });
      return;
    }
  } catch {
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }
}, [navigate]);
  const saveLoginAndRedirect = (res) => {
    const userData = res.user || res;
    const roleId = Number( userData.roleId ?? userData.RoleId ?? userData.roleID ?? 0);
    const roleName =
      userData.roleName ||
      userData.RoleName ||
      (roleId === 2 ? "Admin" : roleId === 3 ? "Staff" : "Customer");
    const user = {
      id: userData.userId || userData.id || userData.UserId,
      userId: userData.userId || userData.id || userData.UserId,
      fullName: userData.fullName || userData.FullName || "",
      email: userData.email || userData.Email || "",
      roleId,
      roleName,
    };
    const token =
      res.token ||
      res.accessToken ||
      res.jwtToken ||
      "local-login-token";
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("auth", JSON.stringify(user));
    window.dispatchEvent(new Event("authChanged"));
    window.dispatchEvent(new Event("cartUpdated"));
    if (roleId === 2) {
      navigate("/admin");
    } else if (roleId === 3) {
      navigate("/staff");
    } else {
      navigate("/");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.elements["email"].value.trim();
    const password = form.elements["password"].value.trim();
    if (!email || !password) {
      showToast("Vui lòng nhập đầy đủ email và mật khẩu.", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });
      saveLoginAndRedirect(res);
    } catch (err) {
      const msg = err?.message || String(err);
      showToast("Đăng nhập thất bại: " + msg, "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="register-container">
      <div className="register-card" style={{ maxWidth: "800px" }}>
        <div
          className="register-side-image"
          style={{
            background:
              "linear-gradient(rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.9)), url('https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1000')",
          }}>
          <div>
            <h2>Mừng bạn quay trở lại!</h2>
            <p> Đăng nhập để quản lý đơn hàng, theo dõi các tựa sách yêu thích và nhận thông báo về những ưu đãi mới nhất. </p>
          </div>
        </div>
        <div className="register-form-side">
          <div className="register-header">
            <h3>Đăng nhập</h3>
            <p>Nhập thông tin tài khoản của bạn</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="form-label">Email hoặc Tên đăng nhập</label>
              <div className="input-wrapper">
                <input
                  name="email"
                  type="text"
                  className="form-control-custom"
                  placeholder="name@example.com"
                  required />
                <i className="bi bi-envelope input-icon"></i>
              </div>
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Mật khẩu</label>
              <div className="input-wrapper">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control-custom"
                  placeholder="••••••••"
                  required />
                <i className="bi bi-lock input-icon"></i>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}>
                  <i className={`bi bi-eye${showPassword ? "-slash" : ""}`}></i>
                </button>
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="rememberMe"/>
                <label className="form-check-label text-muted small" htmlFor="rememberMe"> Ghi nhớ đăng nhập </label>
              </div>
                <Link to="/forgot-password" style={{ color: "#4f46e5", fontSize: "0.875rem", fontWeight: "600", textDecoration: "none" }}> Quên mật khẩu? </Link>
              </div>
            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? ( <> <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...</> ) : ( <> <i className="bi bi-box-arrow-in-right"></i> Đăng nhập </> )}
            </button>
            <button type="button" className="google-login-btn" onClick={() => { window.location.href = "http://localhost:5005/api/auth/google"; }} > <i className="bi bi-google"></i> Đăng nhập bằng Google </button>
            <div className="register-footer">
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;