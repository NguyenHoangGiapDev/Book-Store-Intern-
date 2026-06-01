import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiRequest } from "../../services/apiClient";
import { notificationService } from "../../services/notificationService";
import { fetchAllProducts, getImageUrl } from "../../utils/bookDisplay";

function CustomerHeader() {
  const [keyword, setKeyword] = useState("");
  const [auth, setAuth] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();

    const searchText = keyword.trim();

    if (searchText === "") {
      return;
    }

    const params = new URLSearchParams(location.pathname === "/books" ? location.search : "");
    params.set("search", searchText);
    navigate({ pathname: "/books", search: params.toString() });
  };

  useEffect(() => {
    fetchAllProducts().then(data => {
      setAllProducts(data || []);
    }).catch(err => console.error("Header suggestions load error:", err));
  }, []);

  const handleInputChange = (val) => {
    setKeyword(val);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const filtered = allProducts.filter(p => 
      p.title?.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 6);
    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  useEffect(() => {
  const loadAuth = () => {
    try {
      const a = localStorage.getItem("auth") || localStorage.getItem("user");
      setAuth(a ? JSON.parse(a) : null);
    } catch {
      setAuth(null);
    }
  };

  loadAuth();

  setUnreadNotifCount(notificationService.getUnreadCount());
  setNotifications(notificationService.getNotifications());
}, []);

  // Listen for auth/cart changes from other pages (login, add-to-cart, etc.)
  useEffect(() => {
    const onAuthChanged = () => {
  try {
    const a = localStorage.getItem("auth") || localStorage.getItem("user");
    setAuth(a ? JSON.parse(a) : null);
  } catch {
    setAuth(null);
  }
};

    const onCartUpdated = () => {
      try {
        const a = localStorage.getItem('auth');
        const parsed = a ? JSON.parse(a) : null;
        if (!parsed?.userId) {
          setCartCount(0);
          return;
        }
        apiRequest(`/carts/user/${parsed.userId}`)
          .then((c) => {
            setCartCount((c?.items || []).reduce((s, it) => s + (it.quantity || 0), 0));
          })
          .catch(() => setCartCount(0));
      } catch {
        setCartCount(0);
      }
    };

    const onNotifUpdated = () => {
      setUnreadNotifCount(notificationService.getUnreadCount());
      setNotifications(notificationService.getNotifications());
    };

    window.addEventListener('authChanged', onAuthChanged);
    window.addEventListener('cartUpdated', onCartUpdated);
    window.addEventListener('notificationsUpdated', onNotifUpdated);

    // Close notifications on click outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notif-dropdown-container')) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('authChanged', onAuthChanged);
      window.removeEventListener('cartUpdated', onCartUpdated);
      window.removeEventListener('notificationsUpdated', onNotifUpdated);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!auth?.userId) return;
    apiRequest(`/carts/user/${auth.userId}`).then((c) => {
      setCartCount((c?.items || []).reduce((s, it) => s + (it.quantity || 0), 0));
    }).catch(() => setCartCount(0));
  }, [auth]);

  const handleLogout = async () => {
  try {
    // Gọi backend để xóa cookie
    await apiRequest("/auth/logout", { method: "POST" });

    // Xóa localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("auth");
    localStorage.removeItem("cart");
    localStorage.removeItem("cartItems");

    // Dispatch sự kiện để Header tự cập nhật
    window.dispatchEvent(new Event("authChanged"));

    // Điều hướng về trang login
    window.location.href = "/login";
  } catch (err) {
    console.error("Logout error:", err);
  }
};

  const handleMarkAsRead = (id) => {
    notificationService.markAsRead(id);
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };
  const getAvatarUrl = (avatar) => {
  if (!avatar) return "";

  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  return `http://localhost:5005${avatar}`;
};

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return "Vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return new Date(timestamp).toLocaleDateString("vi-VN");
  };

  return (
    <header className="site-header">
      {/* Tầng 1: Logo, Thanh tìm kiếm, Giỏ hàng, Tài khoản */}
      <div className="container-fluid px-4 px-lg-5 py-3 border-bottom" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
        <div className="row align-items-center">
          {/* Logo */}
          <div className="col-12 col-md-3 col-lg-2 mb-3 mb-md-0">
            <Link to="/" className="site-logo text-nowrap d-flex align-items-center gap-2">
              <i className="bi bi-journal-text fs-2"></i>
              <span className="fs-3">Book-Store</span>
            </Link>
          </div>

          {/* Search Bar (Trung tâm) */}
          <div className="col-12 col-md-5 col-lg-6 mb-3 mb-md-0">
            <form className="header-search w-100 position-relative" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Tìm kiếm hàng ngàn cuốn sách, đồ chơi, văn phòng phẩm..."
                value={keyword}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => { if (keyword.trim()) setShowSuggestions(true); }}
                onBlur={() => { setTimeout(() => setShowSuggestions(false), 250); }}
                className="header-search-input w-100"
                style={{ paddingRight: "50px", height: "45px" }}
              />
              <button type="submit" className="header-search-button position-absolute end-0 top-50 translate-middle-y me-1" title="Tìm kiếm" style={{ height: "35px", width: "40px", borderRadius: "20px" }}>
                <i className="bi bi-search"></i>
              </button>

              {/* Advanced Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions-dropdown shadow-lg rounded-3 position-absolute start-0 w-100 bg-white border border-slate-100 overflow-hidden mt-1" style={{ zIndex: 99999 }}>
                  {suggestions.map((p) => {
                    let path = "/books";
                    if (p.originTable === "stationery") path = "/stationery";
                    else if (p.originTable === "toys") path = "/toys";
                    else if (p.originTable === "souvenirs") path = "/souvenirs";
                    else if (p.originTable === "accessories") path = "/accessories";
                    else if (p.originTable === "school-supplies") path = "/school-supplies";
                    
                    return (
                      <Link 
                        key={`${p.originTable}-${p.id}`} 
                        to={`${path}/${p.id}`}
                        className="suggestion-item d-flex align-items-center gap-3 p-2 text-decoration-none text-dark hover-bg-slate-50 border-bottom border-slate-50"
                        onClick={() => {
                          setKeyword("");
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="suggestion-thumb rounded overflow-hidden flex-shrink-0" style={{ width: "40px", height: "40px" }}>
                          <img 
                            src={getImageUrl(p.imageUrl, p.title)} 
                            alt="" 
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200&auto=format&fit=crop"; }}
                          />
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="fw-bold text-slate-800 text-truncate small mb-0 text-start">{p.title}</div>
                          <div className="x-small text-muted text-uppercase text-start" style={{ fontSize: "10px" }}>{p.categoryName || p.originTable}</div>
                        </div>
                        <div className="fw-bold text-success small flex-shrink-0">
                          {Number(p.price || 0).toLocaleString("vi-VN")}đ
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </form>
          </div>

          {/* User Actions */}
          <div className="col-12 col-md-4 col-lg-4">
            <div className="d-flex align-items-center justify-content-md-end justify-content-center gap-3 text-nowrap">
              {(!auth || auth.roleId === 1) && (
                <Link to="/cart" className="cart-icon-wrapper d-flex align-items-center gap-2 text-decoration-none text-dark me-2" title="Giỏ hàng">
                  <div className="position-relative">
                    <i className="bi bi-cart3 fs-3"></i>
                    <span className="cart-badge">{cartCount}</span>
                  </div>
                  <span className="fw-bold d-none d-xl-inline">Giỏ hàng</span>
                </Link>
              )}

              {/* Notification Bell */}
              <div className="position-relative notif-dropdown-container">
                <div 
                  className="d-flex align-items-center gap-2 text-dark me-2 cursor-pointer" 
                  title="Thông báo"
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                >
                  <div className="position-relative">
                    <i className="bi bi-bell fs-3"></i>
                    {unreadNotifCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white" style={{ fontSize: '10px', padding: '3px 6px', zIndex: 11 }}>
                        {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                      </span>
                    )}
                  </div>
                </div>

                {showNotifDropdown && (
                  <div className="notification-dropdown shadow-lg bg-white position-absolute end-0 mt-3 border border-slate-100 animate-fade-in" style={{ width: '380px', borderRadius: '20px', zIndex: 1000, top: '100%', overflow: 'hidden' }}>
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white">
                      <h6 className="mb-0 fw-800 text-slate-800" style={{ fontSize: '18px' }}>Thông báo</h6>
                      {unreadNotifCount > 0 && (
                        <button className="btn btn-link btn-sm text-primary text-decoration-none p-0 x-small fw-bold" onClick={handleMarkAllRead}>
                          Đọc tất cả
                        </button>
                      )}
                    </div>
                    <div className="notification-items-scroll" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={`p-3 border-bottom transition-all position-relative ${!n.isRead ? 'bg-light-notif' : 'hover-bg-slate-50'}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleMarkAsRead(n.id)}
                          >
                            {!n.isRead && <div className="unread-dot"></div>}
                            <div className="d-flex gap-3">
                              <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-${n.type || 'info'}-soft`} style={{ width: '45px', height: '45px', backgroundColor: n.type === 'success' ? '#ecfdf5' : n.type === 'warning' ? '#fffbeb' : n.type === 'danger' ? '#fef2f2' : '#eff6ff' }}>
                                <i className={`bi ${n.icon} text-${n.type || 'info'}`} style={{ fontSize: '20px', color: n.type === 'success' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : n.type === 'danger' ? '#ef4444' : '#3b82f6' }}></i>
                              </div>
                              <div className="flex-grow-1 overflow-hidden">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <span className={`small fw-bold text-truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-500'}`} style={{ maxWidth: '180px' }}>{n.title}</span>
                                  <span className="text-slate-400" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{getTimeAgo(n.timestamp)}</span>
                                </div>
                                <p className={`small mb-0 line-clamp-2 ${!n.isRead ? 'text-slate-700' : 'text-slate-400'}`} style={{ lineHeight: '1.5', fontSize: '13px' }}>{n.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-5 text-center">
                          <div className="mb-3 opacity-20">
                            <i className="bi bi-メガホン text-slate-200" style={{ fontSize: '50px' }}></i>
                          </div>
                          <p className="text-slate-400 fw-medium">Bạn chưa có thông báo mới</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-top text-center bg-slate-50">
                      <Link to="/profile?tab=notifications" className="text-primary text-decoration-none fw-800 small" onClick={() => setShowNotifDropdown(false)}>
                        Xem tất cả thông báo
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Staff Management Link (Role 2 is Admin, Role 3 is Staff) */}
              {auth && (auth.roleId === 2 || auth.roleId === 3) && (
                <Link to="/admin" className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2" title="Quản trị hệ thống">
                  <i className="bi bi-speedometer2"></i>
                  <span className="d-none d-md-inline">Quản trị</span>
                </Link>
              )}

              {auth ? (
                <div className="dropdown header-user-dropdown">
                  <a
                    className="d-flex align-items-center text-dark text-decoration-none gap-2 px-2"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {auth.avatar ? (
                    <div
                      className="rounded-circle overflow-hidden shadow-sm border d-flex align-items-center justify-content-center"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderColor: "rgba(0,0,0,0.08)",
                        backgroundColor: "#fff",
                      }}
                    >
                      <img
                        src={getAvatarUrl(auth.avatar)}
                        alt="Avatar"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ) : (() => {
                      const name = auth.fullName || auth.username || auth.email || "Tài khoản";
                      const initials = name.trim().split(" ").pop().substring(0, 2).toUpperCase();
                      return (
                        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" style={{
                          width: "36px",
                          height: "36px",
                          background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                          fontSize: "12px",
                          letterSpacing: "0.5px"
                        }}>
                          {initials}
                        </div>
                      );
                    })()}
                    <span className="fw-bold d-none d-xl-inline text-truncate" style={{ maxWidth: "150px", fontSize: "14px", color: "#1f2937", fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                      {auth.fullName || auth.username || auth.email || "Tài khoản"}
                    </span>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2 p-2" style={{ minWidth: "200px", borderRadius: "8px" }}>
                    <li>
                      <Link className="dropdown-item py-2 px-3 rounded text-dark fw-medium" to="/profile" style={{ fontSize: "15px" }}>
                        Thông tin cá nhân
                      </Link>
                    </li>
                    {(auth.roleId === 2 || auth.roleId === 3) && (
                      <li>
                        <Link className="dropdown-item py-2 px-3 rounded text-dark fw-medium" to="/admin" style={{ fontSize: "15px" }}>
                          Quản trị hệ thống
                        </Link>
                      </li>
                    )}
                    <li>
                      <button className="dropdown-item py-2 px-3 rounded text-dark fw-medium mt-1" onClick={() => setShowLogoutModal(true)} style={{ fontSize: "15px" }}>
                        Đăng xuất
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline-dark rounded-pill px-4 fw-bold border-2">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="btn btn-dark rounded-pill px-4 fw-bold">
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "400px" }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "15px" }}>
              <div className="modal-body p-4 text-center">
                <div className="mb-3 text-warning">
                  <i className="bi bi-exclamation-circle" style={{ fontSize: "60px" }}></i>
                </div>
                <h5 className="fw-bold mb-3">Xác nhận đăng xuất</h5>
                <p className="text-muted mb-4">Bạn có chắc chắn muốn đăng xuất khỏi tài khoản của mình không?</p>
                <div className="d-flex gap-2 justify-content-center">
                  <button type="button" className="btn btn-light px-4 py-2 fw-bold rounded-pill" onClick={() => setShowLogoutModal(false)} style={{ minWidth: "120px" }}>Hủy</button>
                  <button type="button" className="btn btn-danger px-4 py-2 fw-bold rounded-pill shadow-sm" onClick={handleLogout} style={{ minWidth: "120px" }}>Đăng xuất</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tầng 2: Menu Danh mục & Điều hướng */}
      <div className="container-fluid position-relative" style={{ backgroundColor: "#cce874", borderTop: "1px solid rgba(0,0,0,0.03)" }}>
        <div className="d-flex align-items-center justify-content-center">
          {/* Menu Links */}
          <nav className="site-header-nav d-flex align-items-center justify-content-center gap-5 d-none d-lg-flex w-100">
            <Link to="/" className="nav-link text-nowrap py-2 fw-bold text-uppercase" style={{ fontSize: "14px", letterSpacing: "0.5px" }}>Trang chủ</Link>
            <Link to="/books" className="nav-link text-nowrap py-2 fw-bold text-uppercase" style={{ fontSize: "14px", letterSpacing: "0.5px" }}>Sách</Link>
            <Link to="/stationery" className="nav-link text-nowrap py-2 fw-bold text-uppercase" style={{ fontSize: "14px", letterSpacing: "0.5px" }}>Văn phòng phẩm</Link>
            <Link to="/toys" className="nav-link text-nowrap py-2 fw-bold text-uppercase" style={{ fontSize: "14px", letterSpacing: "0.5px" }}>Đồ chơi</Link>

            <div className="dropdown">
              <a 
                className="nav-link dropdown-toggle text-nowrap py-2 fw-bold text-uppercase" 
                href="#" 
                role="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
                style={{ fontSize: "14px", letterSpacing: "0.5px" }}
              >
                Danh mục khác
              </a>
              <ul className="dropdown-menu shadow border-0 mt-0 rounded-bottom-3 rounded-top-0">
                <li><Link className="dropdown-item py-2 fw-medium" to="/souvenirs"><i className="bi bi-gift me-2 text-info"></i>QUÀ LƯU NIỆM</Link></li>
                <li><Link className="dropdown-item py-2 fw-medium" to="/school-supplies"><i className="bi bi-pencil me-2 text-success"></i>ĐỒ DÙNG HỌC TẬP</Link></li>
                <li><Link className="dropdown-item py-2 fw-medium" to="/accessories"><i className="bi bi-usb-drive me-2 text-secondary"></i>PHỤ KIỆN</Link></li>
              </ul>
            </div>
            
            <Link to="/contact" className="nav-link text-nowrap py-2 fw-bold text-uppercase" style={{ fontSize: "14px", letterSpacing: "0.5px" }}>Liên hệ</Link>
            <Link to="/support" className="nav-link text-nowrap py-2 fw-bold text-uppercase" style={{ fontSize: "14px", letterSpacing: "0.5px" }}>Hỗ trợ</Link>
            <Link to="/hire" className="nav-link text-nowrap py-2 fw-bold text-uppercase" style={{ fontSize: "14px", letterSpacing: "0.5px" }}>Tuyển dụng</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
export default CustomerHeader;