function Footer() {
  return (
    <footer className="footer mt-auto">
      <div className="container py-5">
        <div className="row">
          <div className="col-lg-3 col-md-6 mb-4">
            <h5 className="footer-title">Book-Store</h5>
            <p className="footer-text mb-4">
              Website quản lý và bán sách trực tuyến hàng đầu Việt Nam, hỗ trợ mua hàng online và trực tiếp tại cửa hàng.
            </p>
            <h5 className="footer-title">Chứng nhận</h5>
            <a href="http://online.gov.vn/Home/WebDetails/47432" target="_blank" rel="noopener noreferrer" className="d-inline-block">
              <img 
                src="/logo_bct.png" 
                alt="Đã thông báo Bộ Công Thương" 
                style={{ height: "45px", mixBlendMode: "multiply", opacity: "0.9" }}
              />
            </a>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <h5 className="footer-title">Liên kết nhanh</h5>
            <ul className="list-unstyled">
              <li>
                <a className="footer-link" href="/">
                  Trang chủ
                </a>
              </li>
              <li>
                <a className="footer-link" href="/books">
                  Sách
                </a>
              </li>
              <li>
                <a className="footer-link" href="/stationery">
                  Văn phòng phẩm
                </a>
              </li>
              <li>
                <a className="footer-link" href="/toys">
                  Đồ chơi
                </a>
              </li>
              <li>
                <a className="footer-link" href="/cart">
                  Giỏ hàng
                </a>
              </li>
              <li>
                <a className="footer-link" href="/login">
                  Đăng nhập
                </a>
              </li>
              <li>
                <a className="footer-link" href="/register">
                  Đăng ký
                </a>
              </li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6 mb-4">
            <h5 className="footer-title">Thông tin liên hệ</h5>
            <p className="footer-text mb-2"><i className="bi bi-geo-alt-fill text-muted me-2"></i>Thành phố Hồ Chí Minh, Việt Nam</p>
            <p className="footer-text mb-2"><i className="bi bi-envelope-fill text-muted me-2"></i>bookstore@gmail.com</p>
            <p className="footer-text mb-4"><i className="bi bi-telephone-fill text-muted me-2"></i>0123 456 789</p>
            
            <div className="d-flex gap-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon" title="Facebook">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="mailto:bookstore@gmail.com" className="social-icon" title="Gmail">
                <i className="bi bi-envelope-fill"></i>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="social-icon" title="TikTok">
                <i className="bi bi-tiktok"></i>
              </a>
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="social-icon" title="Google Maps">
                <i className="bi bi-geo-alt-fill"></i>
              </a>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <h5 className="footer-title">Dịch vụ & Thanh toán</h5>
            <ul className="list-unstyled footer-text">
              <li className="mb-3 d-flex align-items-center">
                <i className="bi bi-truck footer-service-icon"></i>
                <span>Giao hàng hỏa tốc 2h</span>
              </li>
              <li className="mb-3 d-flex align-items-center">
                <i className="bi bi-credit-card-2-front footer-service-icon"></i>
                <span>Thanh toán VNPay, Momo</span>
              </li>
              <li className="mb-3 d-flex align-items-center">
                <i className="bi bi-box-seam footer-service-icon"></i>
                <span>Trả tiền mặt khi nhận (COD)</span>
              </li>
              <li className="mb-0 d-flex align-items-center">
                <i className="bi bi-shield-check footer-service-icon"></i>
                <span>Bảo hành 1 đổi 1 (7 ngày)</span>
              </li>
            </ul>
          </div>
        </div>
        <hr className="border-secondary" />
        <div className="text-center footer-text">
          © 2026 BookStore. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;