import React, { useState } from "react";
import { showToast } from "../components/common/Toast.jsx";
import { apiRequest } from "../services/apiClient";

function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      subject: formData.subject,
      message: formData.message,
    };

    await apiRequest("/ContactMessages", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    showToast("Cám ơn bạn! Tin nhắn của bạn đã được gửi thành công.", "success");

    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
  } catch (err) {
    console.error("Send contact message error:", err);
    showToast("Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.", "error");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="contact-page bg-light min-vh-100 py-5">
      <div className="container">
        {/* Header Section */}
        <div className="text-center mb-5 animate-fade-in">
          <h1 className="fw-bold text-dark display-5 mb-3">Chúng tôi luôn sẵn sàng hỗ trợ bạn</h1>
        </div>

        <div className="row g-4">
          {/* Info Cards */}
          <div className="col-lg-4">
            <div className="d-flex flex-column gap-4 h-100">
              {/* Address */}
              <div className="card border-0 shadow-sm rounded-4 p-4 hover-lift transition-all">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                    <i className="bi bi-geo-alt fs-4"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Địa chỉ của chúng tôi</h6>
                    <p className="text-muted small mb-0">Thành phố Hồ Chí Minh, Việt Nam</p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="card border-0 shadow-sm rounded-4 p-4 hover-lift transition-all">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                    <i className="bi bi-telephone fs-4"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Hotline hỗ trợ</h6>
                    <p className="text-muted small mb-0">1900 1234 - (028) 7300 XXXX</p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="card border-0 shadow-sm rounded-4 p-4 hover-lift transition-all">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                    <i className="bi bi-envelope fs-4"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Email liên hệ</h6>
                    <p className="text-muted small mb-0">bookstore@gmail.com</p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden flex-grow-1 shadow-sm border" style={{ minHeight: '200px' }}>
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4946681007846!2d106.65843061474883!3d10.7711202923253!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752eda3f412571%3A0xe67f9160562e873a!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBCw6FjaCBraG9hIC0gxJDhuqFpIGjhu41jIFF14buRYyBnaWEgVFAuSENN!5e0!3m2!1svi!2s!4v1652330000000!5m2!1svi!2s" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white">
              <h4 className="fw-bold text-dark mb-4">Gửi tin nhắn cho chúng tôi</h4>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Họ và tên của bạn</label>
                    <input 
                      type="text" 
                      name="name" 
                      className="form-control rounded-3 py-2 px-3 border-light bg-light bg-opacity-50 shadow-none focus-primary"
                      placeholder="Nguyễn Văn A" 
                      required
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Địa chỉ Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      className="form-control rounded-3 py-2 px-3 border-light bg-light bg-opacity-50 shadow-none focus-primary"
                      placeholder="example@gmail.com" 
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Số điện thoại</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      className="form-control rounded-3 py-2 px-3 border-light bg-light bg-opacity-50 shadow-none focus-primary"
                      placeholder="09xx xxx xxx" 
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Chủ đề</label>
                    <select 
                      name="subject" 
                      className="form-select rounded-3 py-2 px-3 border-light bg-light bg-opacity-50 shadow-none focus-primary"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                    >
                      <option value="">Chọn chủ đề</option>
                      <option value="Order Support">Hỗ trợ đơn hàng</option>
                      <option value="Product Inquiry">Tư vấn sản phẩm</option>
                      <option value="Feedback">Góp ý dịch vụ</option>
                      <option value="Partnership">Hợp tác kinh doanh</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted">Nội dung tin nhắn</label>
                    <textarea 
                      name="message" 
                      className="form-control rounded-3 py-2 px-3 border-light bg-light bg-opacity-50 shadow-none focus-primary"
                      rows="5" 
                      placeholder="Nhập nội dung bạn muốn gửi..."
                      required
                      value={formData.message}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  <div className="col-12 mt-4 text-end">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-sm d-inline-flex align-items-center gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm"></span>
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          Gửi tin nhắn <i className="bi bi-send-fill small"></i>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ls-wide { letter-spacing: 1px; }
        .hover-lift { transition: transform 0.3s ease; }
        .hover-lift:hover { transform: translateY(-5px); }
        .focus-primary:focus { border-color: #4f46e5 !important; background-color: #fff !important; }
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
export default ContactPage;
