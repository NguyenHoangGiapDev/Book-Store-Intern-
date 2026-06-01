import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/apiClient.js";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setMessage(response?.message || "Nếu email hợp lệ, link khôi phục mật khẩu sẽ được gửi đến hòm thư của bạn.");
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
          <h2 className="fw-bold text-primary">QUÊN MẬT KHẨU</h2>
          <p className="text-muted mt-2">
            Vui lòng nhập email của bạn. Chúng tôi sẽ gửi một liên kết để bạn có thể tạo lại mật khẩu mới.
          </p>
        </div>

        <div className="card border-0 shadow-lg" style={{ borderRadius: "20px" }}>
          <form className="p-4 p-md-5" onSubmit={handleSubmit}>
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="mb-4">
              <label className="form-label fw-semibold">Địa chỉ Email</label>
              <input 
                type="email" 
                className="form-control py-2 bg-light border-0" 
                placeholder="example@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-100 py-3 fw-bold fs-5 mb-4" style={{ borderRadius: "12px" }}>
              {loading ? "Đang gửi..." : "Gửi liên kết khôi phục"}
            </button>

            <p className="text-center text-muted mb-0">
              Nhớ lại mật khẩu? <Link to="/login" className="text-primary fw-bold text-decoration-none">Quay lại đăng nhập</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
