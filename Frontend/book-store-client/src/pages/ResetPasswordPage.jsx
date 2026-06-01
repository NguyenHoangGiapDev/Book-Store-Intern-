import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../services/apiClient.js";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp.");
      return;
    }

    if (!token) {
      setError("Token không hợp lệ hoặc không tồn tại.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password })
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err?.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #f0f4fd 0%, #c2e5ff 100%)", minHeight: "calc(100vh - 90px)", display: "flex", alignItems: "center", width: "100%" }}>
      <div className="container py-5 animate-fade-in-up" style={{ maxWidth: "500px" }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary">ĐẶT LẠI MẬT KHẨU</h2>
          <p className="text-muted mt-2">
            Vui lòng nhập mật khẩu mới của bạn.
          </p>
        </div>

        <div className="card border-0 shadow-lg" style={{ borderRadius: "20px" }}>
          {success ? (
            <div className="p-4 p-md-5 text-center">
              <div className="alert alert-success">Đặt lại mật khẩu thành công!</div>
              <p>Đang chuyển hướng về trang đăng nhập...</p>
              <Link to="/login" className="btn btn-primary mt-3">Đến trang đăng nhập</Link>
            </div>
          ) : (
            <form className="p-4 p-md-5" onSubmit={handleSubmit}>
              {error && <div className="alert alert-danger">{error}</div>}
              {!token && <div className="alert alert-warning">Không tìm thấy mã xác thực. Vui lòng kiểm tra lại liên kết trong email.</div>}
              
              <div className="mb-3">
                <label className="form-label fw-semibold">Mật khẩu mới</label>
                <input 
                  type="password" 
                  className="form-control py-2 bg-light border-0" 
                  placeholder="Nhập mật khẩu mới" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  className="form-control py-2 bg-light border-0" 
                  placeholder="Nhập lại mật khẩu mới" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={loading || !token} className="btn btn-primary w-100 py-3 fw-bold fs-5 mb-4" style={{ borderRadius: "12px" }}>
                {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>

              <p className="text-center text-muted mb-0">
                <Link to="/login" className="text-primary fw-bold text-decoration-none">Quay lại đăng nhập</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
