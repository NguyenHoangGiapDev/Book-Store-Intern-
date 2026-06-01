import React, { useState } from "react";
import { apiRequest } from "../services/apiClient";
import { showToast } from "../components/common/Toast.jsx";

function HirePage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyJob = (position) => {
    setFormData({
      ...formData,
      position,
    });

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        message: formData.message,
      };

      await apiRequest("/recruitments", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showToast("Ứng tuyển thành công! Chúng tôi sẽ liên hệ bạn sớm.", "success");

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        position: "",
        message: "",
      });
    } catch (error) {
      console.error("Apply job error:", error);
      showToast("Gửi đơn ứng tuyển thất bại. Vui lòng thử lại.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="hire-page bg-light min-vh-100 py-5">
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="fw-bold text-dark display-5 mb-3">
            Gia nhập đội ngũ Book-Store
          </h1>
          <p className="text-muted fs-5">
            Chúng tôi luôn tìm kiếm những bạn trẻ năng động, trách nhiệm và yêu thích sách.
          </p>
        </div>
        <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white">
          <h3 className="fw-bold mb-4">Gửi thông tin ứng tuyển</h3>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold text-muted small">Họ và tên</label>
                <input
                  type="text"
                  name="fullName"
                  className="form-control rounded-3 py-2"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-muted small">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control rounded-3 py-2"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-muted small">Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control rounded-3 py-2"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09xx xxx xxx"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-muted small">Vị trí ứng tuyển</label>
                <input
                    type="text"
                    name="position"
                    className="form-control rounded-3 py-2"
                    required
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Nhập vị trí muốn ứng tuyển, ví dụ: Nhân viên bán hàng"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-bold text-muted small">
                  Giới thiệu bản thân
                </label>
                <textarea
                  name="message"
                  className="form-control rounded-3 py-2"
                  rows="5"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Hãy giới thiệu ngắn gọn về kinh nghiệm, kỹ năng hoặc lý do bạn muốn ứng tuyển..."
                />
              </div>

              <div className="col-12 text-end mt-4">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg rounded-pill px-5 fw-bold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi đơn ứng tuyển"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default HirePage;