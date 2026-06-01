import React, { useState } from "react";
import { apiRequest } from "../services/apiClient";
import { useNavigate, Link } from "react-router-dom";
import { showToast } from "../components/common/Toast.jsx";
import "../styles/AuthPages.css";

function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "", color: "#e2e8f0" });

  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, text: "", color: "#e2e8f0" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd) || /[^a-zA-Z0-9]/.test(pwd)) score += 1;

    if (pwd.length < 6) return { score: 33, text: "Yếu", color: "#ef4444" };
    if (score < 2) return { score: 66, text: "Trung bình", color: "#f59e0b" };
    return { score: 100, text: "Mạnh", color: "#10b981" };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "password") {
      setPasswordStrength(calculateStrength(value));
    }

    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Email không hợp lệ";
    if (formData.phone.length !== 10) newErrors.phone = "Số điện thoại phải có 10 chữ số";
    if (formData.password.length < 8) newErrors.password = "Mật khẩu tối thiểu 8 ký tự";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await apiRequest(`/auth/register`, {
        method: "POST",
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password
        }),
      });

      localStorage.setItem("auth", JSON.stringify({ 
        userId: res.userId, 
        fullName: res.fullName, 
        email: res.email 
      }));

      window.dispatchEvent(new Event('authChanged'));
      window.dispatchEvent(new Event('cartUpdated'));
      showToast("Đăng ký thành công!", "success");
      navigate('/');
    } catch (err) {
      showToast(err.message || "Đăng ký thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Left Side - Image/Info */}
        <div className="register-side-image">
          <div>
            <h2>Chào mừng bạn đến với BookStore</h2>
            <p>Đăng ký tài khoản để trải nghiệm hàng ngàn đầu sách hấp dẫn và nhận nhiều ưu đãi đặc quyền chỉ dành riêng cho thành viên.</p>
            <div className="mt-5">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-check-circle-fill me-3 fs-4 text-white"></i>
                <span>Tích điểm đổi quà hấp dẫn</span>
              </div>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-check-circle-fill me-3 fs-4 text-white"></i>
                <span>Giao hàng nhanh trong 24h</span>
              </div>
              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-3 fs-4 text-white"></i>
                <span>Hỗ trợ đổi trả trong 7 ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="register-form-side">
          <div className="register-header">
            <h3>Tạo tài khoản mới</h3>
            <p>Vui lòng điền đầy đủ thông tin bên dưới</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Họ và tên</label>
                <div className="input-wrapper">
                  <input
                    name="fullName"
                    type="text"
                    className={`form-control-custom ${errors.fullName ? 'border-danger' : ''}`}
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                  <i className="bi bi-person input-icon"></i>
                </div>
                {errors.fullName && <small className="text-danger mt-1 d-block">{errors.fullName}</small>}
              </div>

              <div className="col-md-6">
                <label className="form-label">Email</label>
                <div className="input-wrapper">
                  <input
                    name="email"
                    type="email"
                    className={`form-control-custom ${errors.email ? 'border-danger' : ''}`}
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <i className="bi bi-envelope input-icon"></i>
                </div>
                {errors.email && <small className="text-danger mt-1 d-block">{errors.email}</small>}
              </div>

              <div className="col-md-6">
                <label className="form-label">Số điện thoại</label>
                <div className="input-wrapper">
                  <input
                    name="phone"
                    type="tel"
                    className={`form-control-custom ${errors.phone ? 'border-danger' : ''}`}
                    placeholder="0912345678"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength="10"
                    required
                  />
                  <i className="bi bi-phone input-icon"></i>
                </div>
                {errors.phone && <small className="text-danger mt-1 d-block">{errors.phone}</small>}
              </div>

              <div className="col-md-6">
                <label className="form-label">Mật khẩu</label>
                <div className="input-wrapper">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className={`form-control-custom ${errors.password ? 'border-danger' : ''}`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <i className="bi bi-lock input-icon"></i>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
                <div className="strength-meter">
                  <div 
                    className="strength-bar" 
                    style={{ width: `${passwordStrength.score}%`, backgroundColor: passwordStrength.color }}
                  ></div>
                </div>
                {passwordStrength.text && (
                  <small className="strength-text" style={{ color: passwordStrength.color }}>
                    Mật khẩu {passwordStrength.text}
                  </small>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">Xác nhận mật khẩu</label>
                <div className="input-wrapper">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className={`form-control-custom ${errors.confirmPassword ? 'border-danger' : ''}`}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <i className="bi bi-shield-check input-icon"></i>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
                {errors.confirmPassword && <small className="text-danger mt-1 d-block">{errors.confirmPassword}</small>}
              </div>
            </div>

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus-fill"></i>
                  Đăng ký ngay
                </>
              )}
            </button>

            <div className="register-footer">
              Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;