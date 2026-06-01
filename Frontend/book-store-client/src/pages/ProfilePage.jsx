import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiRequest } from "../services/apiClient";
import { notificationService } from "../services/notificationService";
import { showToast } from "../components/common/Toast.jsx";
import { getImageUrl, FALLBACK_BOOK_IMAGE } from "../utils/bookDisplay";

function ProfilePage() {
  const location = useLocation();
  const [auth, setAuth] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [globalNotifs, setGlobalNotifs] = useState(notificationService.getNotifications());
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    avatar: "",
    phoneNumber: "",
    address: "",
    gender: "Khác",
    dateOfBirth: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    roleId: 1,
    roleName: "Khách hàng",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);

  const [supportMessages, setSupportMessages] = useState([]);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [replyText, setReplyText] = useState("");

  const [readNotifications, setReadNotifications] = useState(() => {
    const saved = localStorage.getItem('read_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
      window.scrollTo(0, 0);
    }
  }, [location]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onNotif = () => setGlobalNotifs(notificationService.getNotifications());
    window.addEventListener('notificationsUpdated', onNotif);
    return () => window.removeEventListener('notificationsUpdated', onNotif);
  }, []);

  useEffect(() => {
    try {
      const a = localStorage.getItem("auth");
      if (a) {
        const parsedAuth = JSON.parse(a);
        setAuth(parsedAuth);
        fetchUserData(parsedAuth.userId);
      } else {
        window.location.href = "/login";
      }
    } catch {
      window.location.href = "/login";
    }
  }, []);

  const fetchMyApplications = async () => {
  try {
    setIsLoadingApplications(true);

    const storedAuth = JSON.parse(localStorage.getItem("auth") || "{}");

    const email =
      userData.email ||
      auth?.email ||
      storedAuth.email ||
      "";

    if (!email) {
      showToast("Không tìm thấy email tài khoản.", "error");
      return;
    }

    const data = await apiRequest(
      `/recruitments/my?email=${encodeURIComponent(email)}`
    );

    setMyApplications(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Fetch my applications error:", error);
    showToast("Không thể tải hồ sơ ứng tuyển.", "error");
  } finally {
    setIsLoadingApplications(false);
  }
};

useEffect(() => {
  if (activeTab === "applications" && (userData.email || auth?.email)) {
    fetchMyApplications();
  }
  
  let intervalId;
  if (activeTab === "support" && (userData.email || auth?.email)) {
    fetchSupportMessages(); // Load ban đầu
    // Polling ngầm mỗi 3 giây
    intervalId = setInterval(() => {
      fetchSupportMessages(true);
    }, 3000);
  }
  
  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}, [activeTab, userData.email, auth?.email]);

const fetchSupportMessages = async (isBackground = false) => {
  try {
    if (!isBackground) setLoadingSupport(true);
    const email = userData.email || auth?.email || JSON.parse(localStorage.getItem("auth") || "{}").email;
    if (!email) return;
    
    const data = await apiRequest(`/ContactMessages/email/${encodeURIComponent(email)}`);
    setSupportMessages(data);
    
    // Mark any unread messages from admin as read
    const unreadFromAdmin = data.filter(m => m.name === "Admin" && !m.isRead);
    for (const msg of unreadFromAdmin) {
      await apiRequest(`/ContactMessages/${msg.id}/read`, { method: "PATCH" });
    }
  } catch (err) {
    console.error("Lỗi khi tải tin nhắn hỗ trợ:", err);
  } finally {
    if (!isBackground) setLoadingSupport(false);
  }
};

const handleSendSupportMessage = async () => {
  if (!replyText.trim()) return;
  try {
    const email = userData.email || auth?.email;
    const phone = userData.phoneNumber || "";
    // Send as a new contact message
    // Note: since it's a thread, any subject works, but if there's an existing thread, we can copy the subject
    const subject = supportMessages.length > 0 ? supportMessages[0].subject : "Yêu cầu hỗ trợ";
    
    const newMsg = await apiRequest("/ContactMessages", {
      method: "POST",
      body: JSON.stringify({
        name: userData.fullName || auth?.fullName || "Khách hàng",
        email: email,
        phone: phone,
        subject: subject,
        message: replyText
      })
    });
    setSupportMessages([...supportMessages, newMsg]);
    setReplyText("");
    showToast("Đã gửi tin nhắn", "success");
  } catch (err) {
    showToast("Lỗi khi gửi tin nhắn", "error");
  }
};

  const fetchUserData = async (userId) => {
  try {
    setLoading(true);

    const data = await apiRequest(`/users/${userId}`);

    const avatarValue =
      data.avatar ||
      data.avatarUrl ||
      data.imageUrl ||
      data.url ||
      "";

    const newUserData = {
      fullName: data.fullName || "",
      email: data.email || "",
      avatar: avatarValue,
      phoneNumber: data.phoneNumber || "",
      address: data.address || "",
      gender: data.gender || "Khác",
      dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
      bankName: data.bankName || "",
      bankAccountName: data.bankAccountName || "",
      bankAccountNumber: data.bankAccountNumber || "",
      roleId: data.roleId || 1,
      roleName: data.roleName || "Khách hàng",
      password: data.password || "",
    };

    setUserData(newUserData);

    const currentAuthRaw =
      localStorage.getItem("auth") || localStorage.getItem("user");

    const currentAuth = currentAuthRaw ? JSON.parse(currentAuthRaw) : {};

    const updatedAuth = {
      ...currentAuth,
      id: data.id || currentAuth.id || userId,
      userId: data.userId || data.id || currentAuth.userId || userId,
      fullName: newUserData.fullName,
      username: newUserData.fullName,
      email: newUserData.email,
      avatar: avatarValue,
      phoneNumber: newUserData.phoneNumber,
      roleId: newUserData.roleId,
      roleName: newUserData.roleName,
    };

    setAuth(updatedAuth);
    localStorage.setItem("auth", JSON.stringify(updatedAuth));
    localStorage.setItem("user", JSON.stringify(updatedAuth));

    window.dispatchEvent(new Event("authChanged"));

    fetchUserOrders(userId);
  } catch (err) {
    setMessage({
      type: "danger",
      text: "Không thể tải thông tin người dùng. Vui lòng thử lại sau.",
    });
  } finally {
    setLoading(false);
  }
};

  const fetchUserOrders = async (userId) => {
    try {
      setLoadingOrders(true);
      const data = await apiRequest(`/orders/user/${userId}`);
      setOrders(data);
    } catch (err) {
      console.error("Lỗi khi tải đơn hàng:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleAvatarChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!auth?.userId && !auth?.id) {
    setMessage({
      type: "danger",
      text: "Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.",
    });
    return;
  }

  if (!file.type.startsWith("image/")) {
    setMessage({
      type: "danger",
      text: "Vui lòng chọn file ảnh hợp lệ.",
    });
    return;
  }

  const maxSizeInMB = 5;
const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

if (file.size > maxSizeInBytes) {
  setMessage({
    type: "danger",
    text: `Dung lượng file tối đa là ${maxSizeInMB}MB!`,
  });
  return;
}

  const userId = auth.userId || auth.id;

  const formData = new FormData();
  formData.append("file", file);

  setSaving(true);
  setMessage({ type: "", text: "" });

  try {
    const data = await apiRequest(`/users/${userId}/upload-avatar`, {
      method: "POST",
      body: formData,
    });

    const avatarUrl =
      data?.avatarUrl ||
      data?.imageUrl ||
      data?.url ||
      data?.avatar ||
      "";

    if (!avatarUrl) {
      throw new Error("Backend không trả về đường dẫn ảnh.");
    }

    const updatedUserData = {
      ...userData,
      avatar: avatarUrl,
    };

    const updatedAuth = {
      ...auth,
      avatar: avatarUrl,
    };

    setUserData(updatedUserData);
    setAuth(updatedAuth);

    localStorage.setItem("auth", JSON.stringify(updatedAuth));
    localStorage.setItem("user", JSON.stringify(updatedAuth));

    window.dispatchEvent(new Event("authChanged"));

    setMessage({
      type: "success",
      text: "Ảnh đại diện đã được cập nhật!",
    });
  } catch (err) {
    console.error("Upload avatar error:", err);
    setMessage({
      type: "danger",
      text: "Lỗi khi upload ảnh: " + (err.message || "Vui lòng thử lại."),
    });
  } finally {
    setSaving(false);
    e.target.value = "";
  }
};
  const handleChange = (e) => {
  const { name, value } = e.target;

  setUserData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

const handleSaveUser = async (e) => {
  e.preventDefault();

  if (!auth?.userId && !auth?.id) {
    setMessage({
      type: "danger",
      text: "Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.",
    });
    return;
  }

  const userId = auth.userId || auth.id;

  setSaving(true);
  setMessage({ type: "", text: "" });

  try {
    const payload = {
      fullName: userData.fullName?.trim() || "Người dùng",
      email: userData.email?.trim(),
      phoneNumber: userData.phoneNumber?.trim() || "",
      address: userData.address?.trim() || "",
      gender: userData.gender || "Khác",
      dateOfBirth: userData.dateOfBirth || null,
      avatar: userData.avatar || "",
      bankName: userData.bankName || "",
      bankAccountName: userData.bankAccountName || "",
      bankAccountNumber: userData.bankAccountNumber || "",
      roleId: Number(userData.roleId) || 1,
      isActive: true,
    };

    await apiRequest(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    const updatedAuth = {
      ...auth,
      userId,
      id: userId,
      fullName: payload.fullName,
      email: payload.email,
      avatar: payload.avatar,
      roleId: payload.roleId,
      roleName: userData.roleName,
    };

    setAuth(updatedAuth);
    localStorage.setItem("auth", JSON.stringify(updatedAuth));
    localStorage.setItem("user", JSON.stringify(updatedAuth));

    window.dispatchEvent(new Event("authChanged"));

    setMessage({
      type: "success",
      text: "Cập nhật thông tin thành công!",
    });

    setIsEditing(false);
  } catch (err) {
    console.error("Save user error:", err);
    setMessage({
      type: "danger",
      text: "Lỗi khi cập nhật thông tin: " + (err.message || "Vui lòng thử lại."),
    });
  } finally {
    setSaving(false);
  }
};
  const handleCancelOrder = async (orderId) => {
    setLoadingOrders(true);
    try {
      await apiRequest(`/orders/${orderId}`, {
        method: "DELETE"
      });

      notificationService.addNotification({
        title: "Đã xóa đơn hàng",
        message: `Đơn hàng ${orderId} của bạn đã được xóa khỏi hệ thống.`,
        type: "danger",
        icon: "bi-trash"
      });

      // Refresh orders
      const data = await apiRequest(`/orders/user/${auth.userId}`);
      setOrders(data || []);
      setShowOrderModal(false);
      setShowCancelConfirm(false);
      setOrderToCancel(null);
    } catch (err) {
      showToast("Lỗi khi hủy đơn hàng: " + err.message, "error");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "danger", text: "Mật khẩu xác nhận không khớp!" });
      setSaving(false);
      return;
    }

    try {
      await apiRequest(`/users/${auth.userId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        }),
      });

      notificationService.addNotification({
        title: "Bảo mật tài khoản",
        message: "Mật khẩu của bạn vừa được thay đổi thành công.",
        type: "warning",
        icon: "bi-shield-lock"
      });

      setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "danger", text: "Lỗi khi đổi mật khẩu: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-success mt-5" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const getTabClass = (tabName) => {
    return activeTab === tabName
      ? "text-decoration-none text-primary fw-bold py-2 ps-3 rounded bg-primary bg-opacity-10 border-start border-primary border-3 w-100 text-start bg-transparent text-start border-0 border-start border-primary border-3 bg-primary bg-opacity-10" // added bg and border
      : "text-decoration-none text-muted py-2 ps-3 rounded hover-bg-light transition-all border-start border-transparent border-3 w-100 text-start bg-transparent border-0";
  };

  // The rest of the component will be rendered conditionally based on activeTab
  return (
    <div className="bg-light pb-5 pt-3" style={{ minHeight: "80vh" }}>
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted">Trang chủ</Link></li>
            <li className="breadcrumb-item active fw-medium text-dark" aria-current="page">Thông tin cá nhân</li>
          </ol>
        </nav>

        <div className="row">
          {/* Left Sidebar Menu */}
          <div className="col-12 col-lg-3 mb-4 mb-lg-0">
            <div className="d-flex align-items-center mb-4 pb-3 border-bottom border-secondary-subtle">
              {userData.avatar ? (
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm overflow-hidden border"
                  style={{ width: "50px", height: "50px", borderColor: "rgba(0,0,0,0.08)" }}
                >
                  <img src={getImageUrl(userData.avatar)} alt="Avatar" className="w-100 h-100 object-fit-cover" />
                </div>
              ) : (() => {
                const name = userData.fullName || userData.email || "Tài khoản";
                const initials = name.trim().split(" ").pop().substring(0, 2).toUpperCase();
                return (
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm fw-bold text-white"
                    style={{
                      width: "50px",
                      height: "50px",
                      background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                      fontSize: "16px",
                      letterSpacing: "0.5px"
                    }}
                  >
                    {initials}
                  </div>
                );
              })()}
              <div className="ms-3">
                <div className="fw-bold text-truncate text-dark" style={{ maxWidth: "160px" }}>{userData.fullName || userData.email || "Tài khoản"}</div>
                <div className="text-muted small" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab("profile"); setIsEditing(true); }}><i className="bi bi-pencil me-1"></i>Sửa hồ sơ</div>
              </div>
            </div>

            <div className="list-group list-group-flush bg-transparent">
              {/* Account Section */}
              <div className="list-group-item bg-transparent border-0 px-0 d-flex align-items-center mb-1">
                <i className="bi bi-person-lines-fill fs-5 me-2 text-primary"></i>
                <span className="fw-bold">{userData.roleId === 2 ? "TÀI KHOẢN QUẢN TRỊ" : "TÀI KHOẢN KHÁCH HÀNG"}</span>
              </div>
              <div className="d-flex flex-column mb-3 gap-1">
                <button 
                  onClick={() => { setActiveTab("profile"); setIsEditing(false); setMessage({type:"",text:""}); }}
                  className={activeTab === "profile" 
                    ? "text-decoration-none text-primary fw-bold py-2 ps-3 rounded bg-primary bg-opacity-10 border-start border-primary border-3 text-start" 
                    : "text-decoration-none text-muted py-2 ps-3 rounded bg-transparent border-0 border-start border-transparent border-3 text-start hover-bg-light transition-all"}
                >
                  Hồ sơ
                </button>
                <button 
                  onClick={() => { setActiveTab("password"); setIsEditing(false); setMessage({type:"",text:""}); }}
                  className={activeTab === "password" 
                    ? "text-decoration-none text-primary fw-bold py-2 ps-3 rounded bg-primary bg-opacity-10 border-start border-primary border-3 text-start" 
                    : "text-decoration-none text-muted py-2 ps-3 rounded bg-transparent border-0 border-start border-transparent border-3 text-start hover-bg-light transition-all"}
                >
                  Đổi mật khẩu
                </button>
              </div>

              {/* Orders Section */}
              <button 
                onClick={() => { setActiveTab("orders"); setIsEditing(false); setMessage({type:"",text:""}); }}
                className={`list-group-item bg-transparent border-0 px-0 d-flex align-items-center mb-2 text-decoration-none rounded w-100 text-start ${activeTab === "orders" ? "bg-light" : "hover-bg-light"}`}
              >
                <i className="bi bi-box-seam fs-5 me-2 text-success"></i>
                <span className={activeTab === "orders" ? "fw-bold text-dark" : "fw-medium text-dark"}>ĐƠN HÀNG CỦA TÔI</span>
              </button>

              {/* Notifications Section */}
              <button 
                onClick={() => { setActiveTab("notifications"); setIsEditing(false); setMessage({type:"",text:""}); }}
                className={`list-group-item bg-transparent border-0 px-0 d-flex align-items-center text-decoration-none rounded w-100 text-start ${activeTab === "notifications" ? "bg-light" : "hover-bg-light"}`}
              >
                <i className="bi bi-bell fs-5 me-2 text-warning"></i>
                <span className={activeTab === "notifications" ? "fw-bold text-dark" : "fw-medium text-dark"}>THÔNG BÁO</span>
              </button>

              {/* Applications Section */}
              <button 
                onClick={() => { 
                  setActiveTab("applications"); 
                  setIsEditing(false); 
                  setMessage({ type: "", text: "" }); 
                }}
                className={`list-group-item bg-transparent border-0 px-0 d-flex align-items-center text-decoration-none rounded w-100 text-start mt-2 ${activeTab === "applications" ? "bg-light" : "hover-bg-light"}`}
              >
                <i className="bi bi-file-earmark-person fs-5 me-2 text-primary"></i>
                <span className={activeTab === "applications" ? "fw-bold text-dark" : "fw-medium text-dark"}>
                  HỒ SƠ ỨNG TUYỂN
                </span>
              </button>

              {/* Support Section */}
              <button 
                onClick={() => { setActiveTab("support"); setIsEditing(false); setMessage({type:"",text:""}); }}
                className={`list-group-item bg-transparent border-0 px-0 d-flex align-items-center text-decoration-none rounded w-100 text-start mt-2 ${activeTab === "support" ? "bg-light" : "hover-bg-light"}`}
              >
                <i className="bi bi-chat-dots fs-5 me-2 text-info"></i>
                <span className={activeTab === "support" ? "fw-bold text-dark" : "fw-medium text-dark"}>HỖ TRỢ TRỰC TUYẾN</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-12 col-lg-9">
            <div className="card border-0 shadow-sm rounded-3 h-100">
              <div className="card-header bg-white border-bottom py-4 px-4 px-lg-5 d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.5px" }}>
                    {activeTab === "profile" && (userData.roleId === 2 ? "HỒ SƠ QUẢN TRỊ VIÊN" : "THÔNG TIN CÁ NHÂN")}
                    {activeTab === "password" && "ĐỔI MẬT KHẨU"}
                    {activeTab === "orders" && "ĐƠN HÀNG CỦA TÔI"}
                    {activeTab === "notifications" && "THÔNG BÁO"}
                    {activeTab === "applications" && "HỒ SƠ ỨNG TUYỂN"}
                    {activeTab === "support" && "HỖ TRỢ TRỰC TUYẾN"}
                  </h4>
                  <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                    {activeTab === "profile" && "Quản lý thông tin hồ sơ để bảo mật tài khoản"}
                    {activeTab === "password" && "Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác"}
                    {activeTab === "orders" && "Theo dõi trạng thái và lịch sử đơn hàng của bạn"}
                    {activeTab === "notifications" && "Cập nhật những thông tin mới nhất từ hệ thống"}
                    {activeTab === "applications" && "Theo dõi trạng thái các hồ sơ ứng tuyển của bạn"}
                    {activeTab === "support" && "Trò chuyện trực tiếp với quản trị viên để được hỗ trợ"}
                  </p>
                </div>
                {!isEditing && activeTab === "profile" && (
                  <button 
                    className="btn btn-primary rounded-pill px-4 py-2 fw-medium shadow-sm d-flex align-items-center transition-all"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="bi bi-pencil-square me-2"></i>
                    Chỉnh sửa
                  </button>
                )}
              </div>
              
              <div className="card-body p-4 p-lg-5">
                {message.text && (
                  <div className={`alert alert-${message.type} alert-dismissible fade show rounded-3`} role="alert">
                    {message.type === 'success' ? <i className="bi bi-check-circle-fill me-2"></i> : <i className="bi bi-exclamation-triangle-fill me-2"></i>}
                    {message.text}
                    <button type="button" className="btn-close" onClick={() => setMessage({ type: "", text: "" })}></button>
                  </div>
                )}

                <div className="row">
                  <div className={`col-12 ${activeTab === "profile" ? "col-xl-9" : "col-xl-12"}`}>
                    
                    {/* TAB: PROFILE */}
                    {activeTab === "profile" && (
                      !isEditing ? (
                        <div className="profile-details pe-xl-4">
                          <div className="row mb-4 align-items-center">
                            <div className="col-sm-4 text-muted fw-medium text-sm-end pe-sm-4"><i className="bi bi-person text-primary me-2"></i>Họ và tên</div>
                            <div className="col-sm-8 fw-bold text-dark fs-5">{userData.fullName || <span className="badge bg-light text-secondary border fw-normal">Chưa cập nhật</span>}</div>
                          </div>
                          <div className="row mb-4 align-items-center">
                            <div className="col-sm-4 text-muted fw-medium text-sm-end pe-sm-4"><i className="bi bi-envelope text-success me-2"></i>Email</div>
                            <div className="col-sm-8 text-dark fw-medium">{userData.email} <span className="badge bg-success bg-opacity-10 text-success ms-2 border border-success border-opacity-25 rounded-pill px-2">Đã xác minh</span></div>
                          </div>
                          <div className="row mb-4 align-items-center">
                            <div className="col-sm-4 text-muted fw-medium text-sm-end pe-sm-4"><i className="bi bi-telephone text-warning me-2"></i>Số điện thoại</div>
                            <div className="col-sm-8 fw-medium text-dark">
                              {userData.phoneNumber || <span className="badge bg-light text-secondary border fw-normal">Chưa cập nhật</span>}
                              {userData.phoneNumber && (
                                <span className="badge bg-success bg-opacity-10 text-success ms-2 border border-success border-opacity-25 rounded-pill px-2" style={{ fontSize: "11px" }}>Đã xác minh</span>
                              )}
                            </div>
                          </div>
                          <div className="row mb-4 align-items-center">
                            <div className="col-sm-4 text-muted fw-medium text-sm-end pe-sm-4"><i className="bi bi-gender-ambiguous text-info me-2"></i>Giới tính</div>
                            <div className="col-sm-8 fw-medium text-dark">{userData.gender}</div>
                          </div>
                          <div className="row mb-4 align-items-center">
                            <div className="col-sm-4 text-muted fw-medium text-sm-end pe-sm-4"><i className="bi bi-calendar-date text-primary me-2"></i>Ngày sinh</div>
                            <div className="col-sm-8 fw-medium text-dark">{userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString('vi-VN') : <span className="badge bg-light text-secondary border fw-normal">Chưa cập nhật</span>}</div>
                          </div>
                          <div className="row mb-4 align-items-start">
                            <div className="col-sm-4 text-muted fw-medium text-sm-end pe-sm-4 mt-1"><i className="bi bi-geo-alt text-danger me-2"></i>Địa chỉ</div>
                            <div className="col-sm-8 fw-medium text-dark" style={{ lineHeight: "1.6" }}>{userData.address || <span className="badge bg-light text-secondary border fw-normal">Chưa cập nhật</span>}</div>
                          </div>
                          <div className="row mb-4 align-items-center">
                            <div className="col-sm-4 text-muted fw-medium text-sm-end pe-sm-4"><i className="bi bi-shield-lock text-secondary me-2"></i>Mật khẩu</div>
                            <div className="col-sm-8 fw-medium text-dark d-flex align-items-center gap-3">
                               <span className="font-monospace">{showPassword ? userData.password : "********"}</span>
                               <button 
                                 type="button"
                                 className="btn btn-link p-0 text-decoration-none text-muted" 
                                 onClick={() => setShowPassword(!showPassword)}
                                 title={showPassword ? "Hiện/Ẩn mật khẩu" : ""}
                               >
                                 <i className={`bi bi-eye${showPassword ? "-slash" : ""}`}></i>
                               </button>
                               <span className="text-secondary opacity-25">|</span>
                               <button className="btn btn-link p-0 text-decoration-none" onClick={() => setActiveTab("password")}>Thay đổi</button>
                            </div>
                          </div>
                          <div className="row mb-2 align-items-center">
                            <div className="col-sm-4 text-muted fw-medium text-sm-end pe-sm-4"><i className="bi bi-person-badge text-primary me-2"></i>Vai trò</div>
                            <div className="col-sm-8 fw-bold text-dark">
                              {userData.roleName === "Customer" ? "Khách hàng" : 
                               userData.roleName === "Admin" ? "Quản trị viên" : userData.roleName}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveUser}>
                          <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label text-sm-end text-muted fw-medium">Họ và tên</label>
                            <div className="col-sm-9">
                              <input type="text" className="form-control focus-ring" name="fullName" value={userData.fullName} onChange={handleChange} required placeholder="Nhập họ và tên..." />
                            </div>
                          </div>
                          <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label text-sm-end text-muted fw-medium">Email</label>
                            <div className="col-sm-9">
                              <input type="email" className="form-control focus-ring" name="email" value={userData.email} onChange={handleChange} required disabled placeholder="Nhập địa chỉ email..." />
                            </div>
                          </div>
                          <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label text-sm-end text-muted fw-medium">Số điện thoại</label>
                            <div className="col-sm-9">
                              <input type="tel" className="form-control focus-ring" name="phoneNumber" value={userData.phoneNumber} onChange={handleChange} placeholder="Nhập số điện thoại..." />
                            </div>
                          </div>
                          <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label text-sm-end text-muted fw-medium">Giới tính</label>
                            <div className="col-sm-9 d-flex gap-4">
                              <div className="form-check">
                                <input className="form-check-input" type="radio" name="gender" id="genderMale" value="Nam" checked={userData.gender === "Nam"} onChange={handleChange} />
                                <label className="form-check-label" htmlFor="genderMale">Nam</label>
                              </div>
                              <div className="form-check">
                                <input className="form-check-input" type="radio" name="gender" id="genderFemale" value="Nữ" checked={userData.gender === "Nữ"} onChange={handleChange} />
                                <label className="form-check-label" htmlFor="genderFemale">Nữ</label>
                              </div>
                              <div className="form-check">
                                <input className="form-check-input" type="radio" name="gender" id="genderOther" value="Khác" checked={userData.gender === "Khác"} onChange={handleChange} />
                                <label className="form-check-label" htmlFor="genderOther">Khác</label>
                              </div>
                            </div>
                          </div>
                          <div className="row mb-3 align-items-center">
                            <label className="col-sm-3 col-form-label text-sm-end text-muted fw-medium">Ngày sinh</label>
                            <div className="col-sm-9">
                              <input type="date" className="form-control focus-ring" name="dateOfBirth" value={userData.dateOfBirth} onChange={handleChange} />
                            </div>
                          </div>
                          <div className="row mb-4">
                            <label className="col-sm-3 col-form-label text-sm-end text-muted fw-medium pt-2">Địa chỉ</label>
                            <div className="col-sm-9">
                              <textarea className="form-control focus-ring" name="address" value={userData.address} onChange={handleChange} rows="3" placeholder="Nhập địa chỉ giao hàng chi tiết của bạn..."></textarea>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-sm-9 offset-sm-3 d-flex gap-2">
                              <button type="button" className="btn btn-light px-4 py-2 fw-bold" onClick={() => { setIsEditing(false); fetchUserData(auth.userId); }} disabled={saving}>Hủy</button>
                              <button type="submit" className="btn btn-primary px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2" disabled={saving}>
                                {saving ? <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang lưu...</> : "Lưu"}
                              </button>
                            </div>
                          </div>
                        </form>
                      )
                    )}

                    {/* TAB: PASSWORD */}
                    {activeTab === "password" && (
                      <form onSubmit={handleSavePassword}>
                        <div className="row mb-3 align-items-center">
                          <label className="col-sm-4 col-form-label text-sm-end text-muted fw-medium">Mật khẩu hiện tại</label>
                          <div className="col-sm-6">
                            <input type="password" className="form-control focus-ring" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} required placeholder="Nhập mật khẩu hiện tại" />
                          </div>
                        </div>
                        <div className="row mb-3 align-items-center">
                          <label className="col-sm-4 col-form-label text-sm-end text-muted fw-medium">Mật khẩu mới</label>
                          <div className="col-sm-6">
                            <input type="password" className="form-control focus-ring" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required placeholder="Nhập mật khẩu mới" />
                          </div>
                        </div>
                        <div className="row mb-4 align-items-center">
                          <label className="col-sm-4 col-form-label text-sm-end text-muted fw-medium">Xác nhận mật khẩu mới</label>
                          <div className="col-sm-6">
                            <input type="password" className="form-control focus-ring" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required placeholder="Nhập lại mật khẩu mới" />
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-sm-6 offset-sm-4 d-flex gap-2">
                            <button type="button" className="btn btn-light px-4 py-2 fw-bold" onClick={() => { setPasswordData({oldPassword:"",newPassword:"",confirmPassword:""}); setActiveTab("profile"); }} disabled={saving}>Hủy</button>
                            <button type="submit" className="btn btn-primary px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2" disabled={saving}>
                              {saving ? <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang lưu...</> : "Xác nhận"}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* TAB: ORDERS */}
                    {activeTab === "orders" && (
                      <div className="orders-list">
                        {loadingOrders ? (
                          <div className="text-center py-5">
                            <div className="spinner-border text-success" role="status"></div>
                            <p className="mt-2 text-muted">Đang tải danh sách đơn hàng...</p>
                          </div>
                        ) : orders.length === 0 ? (
                          <div className="text-center py-5 bg-light rounded-4">
                            <i className="bi bi-box2 text-muted" style={{ fontSize: "48px" }}></i>
                            <h5 className="fw-bold mt-3">Bạn chưa có đơn hàng nào</h5>
                            <p className="text-muted">Hãy khám phá các sản phẩm tuyệt vời của chúng tôi nhé!</p>
                            <Link to="/books" className="btn btn-primary rounded-pill px-4 mt-2">Mua sắm ngay</Link>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover align-middle border-0">
                              <thead className="bg-light">
                                <tr>
                                  <th className="border-0 rounded-start-3 ps-3">Mã đơn</th>
                                  <th className="border-0">Ngày đặt</th>
                                  <th className="border-0">Tổng tiền</th>
                                  <th className="border-0">Trạng thái</th>
                                  <th className="border-0 rounded-end-3 text-end pe-3">Thao tác</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orders.map((o) => (
                                  <tr key={o.id}>
                                    <td className="ps-3 fw-bold">{o.id}</td>
                                    <td className="text-muted small">
                                      {new Date(o.orderDate).toLocaleDateString('vi-VN', { 
                                        day: '2-digit', month: '2-digit', year: 'numeric' 
                                      })}
                                    </td>
                                    <td className="fw-bold text-dark">
                                      {new Intl.NumberFormat("vi-VN").format(o.totalAmount)} đ
                                    </td>
                                    <td>
                                      <span className={`badge rounded-pill px-3 py-2 ${
                                        o.status === "Pending" ? "bg-warning text-dark bg-opacity-25 border border-warning border-opacity-50" : 
                                        o.status === "Processing" ? "bg-info text-dark bg-opacity-25 border border-info border-opacity-50" :
                                        o.status === "Shipping" ? "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" :
                                        o.status === "Completed" ? "bg-success bg-opacity-10 text-success border border-success border-opacity-25" :
                                        "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25"
                                      }`}>
                                        {o.status === "Pending" ? "Chờ xác nhận" : 
                                         o.status === "Processing" ? "Đang đóng gói" :
                                         o.status === "Shipping" ? "Đang giao hàng" :
                                         o.status === "Completed" ? "Đã giao hàng" :
                                         o.status === "Cancelled" ? "Đã hủy" : o.status}
                                      </span>
                                    </td>
                                    <td className="text-end pe-3">
                                      <button 
                                        className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold"
                                        onClick={() => { setSelectedOrder(o); setShowOrderModal(true); }}
                                      >
                                        Chi tiết
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB: NOTIFICATIONS */}
                    {activeTab === "notifications" && (
                      <div className="notifications-list">
                         {globalNotifs.length === 0 ? (
                            <div className="text-center py-5">
                               <i className="bi bi-bell-slash text-muted" style={{ fontSize: "48px" }}></i>
                               <h5 className="fw-bold mt-3">Không có thông báo mới</h5>
                               <p className="text-muted">Chúng tôi sẽ thông báo cho bạn khi có cập nhật mới.</p>
                            </div>
                         ) : (
                            <div className="space-y-3">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold mb-0 text-muted">Gần đây</h6>
                                <button 
                                  className="btn btn-link text-decoration-none small p-0 fw-bold"
                                  onClick={() => notificationService.markAllAsRead()}
                                >
                                  Đánh dấu tất cả đã đọc
                                </button>
                              </div>

                              {globalNotifs.map((n) => (
                                <div 
                                  key={n.id} 
                                  className={`card border-0 shadow-sm rounded-4 p-3 mb-3 hover-bg-light transition-all border-start border-4 ${n.isRead ? 'border-light' : `border-${n.type || 'primary'} ${n.type === 'success' ? 'bg-success bg-opacity-10' : n.type === 'warning' ? 'bg-warning bg-opacity-10' : 'bg-primary bg-opacity-10'}`}`}
                                  onClick={() => notificationService.markAsRead(n.id)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div className="d-flex align-items-center gap-3">
                                    <div className={`${n.isRead ? 'bg-light text-muted' : `bg-${n.type || 'primary'} bg-opacity-10 text-${n.type || 'primary'}`} rounded-circle p-2`}>
                                      <i className={`bi ${n.isRead ? 'bi-check2-all' : (n.icon || 'bi-bell-fill')} fs-4`}></i>
                                    </div>
                                    <div className="flex-grow-1">
                                      <div className={`fw-bold ${n.isRead ? 'text-muted' : 'text-dark'}`}>{n.title}</div>
                                      <div className={`${n.isRead ? 'text-muted opacity-75' : 'text-muted'} small`}>{n.message}</div>
                                      <div className="text-muted x-small mt-1 fw-bold" style={{fontSize:'12px'}}>
                                        <i className="bi bi-clock me-1"></i>
                                        {new Date(n.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(n.timestamp).toLocaleDateString('vi-VN')}
                                      </div>
                                    </div>
                                    {!n.isRead && <div className="dot bg-primary rounded-circle" style={{width:'8px', height:'8px'}}></div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                         )}
                      </div>
                    )}

                    {/* TAB: APPLICATIONS */}
                    {activeTab === "applications" && (
                      <div className="applications-list">
                        {isLoadingApplications ? (
                          <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-muted">Đang tải hồ sơ ứng tuyển...</p>
                          </div>
                        ) : myApplications.length === 0 ? (
                          <div className="text-center py-5 bg-light rounded-4">
                            <i className="bi bi-file-earmark-person text-muted" style={{ fontSize: "48px" }}></i>
                            <h5 className="fw-bold mt-3">Bạn chưa có hồ sơ ứng tuyển nào</h5>
                            <p className="text-muted">Hãy ứng tuyển vào các vị trí phù hợp tại Book-Store.</p>
                            <Link to="/hire" className="btn btn-primary rounded-pill px-4 mt-2">
                              Xem tuyển dụng
                            </Link>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover align-middle border-0">
                              <thead className="bg-light">
                                <tr>
                                  <th className="border-0 rounded-start-3 ps-3">STT</th>
                                  <th className="border-0">Vị trí</th>
                                  <th className="border-0">Nội dung</th>
                                  <th className="border-0">Ngày gửi</th>
                                  <th className="border-0 rounded-end-3">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody>
                                {myApplications.map((item, index) => {
                                  const id = item.id || item.Id;
                                  const position = item.position || item.Position || "Không rõ";
                                  const message = item.message || item.Message || "";
                                  const status = item.status || item.Status || "pending";
                                  const createdAt = item.createdAt || item.CreatedAt;

                                  const statusLabel = {
                                    pending: "Chờ xử lý",
                                    reviewing: "Đang xem xét",
                                    accepted: "Đã nhận",
                                    rejected: "Từ chối",
                                  }[status] || "Không rõ";

                                  const statusClass = {
                                    pending: "bg-warning text-dark bg-opacity-25 border border-warning border-opacity-50",
                                    reviewing: "bg-info text-dark bg-opacity-25 border border-info border-opacity-50",
                                    accepted: "bg-success bg-opacity-10 text-success border border-success border-opacity-25",
                                    rejected: "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25",
                                  }[status] || "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25";

                                  return (
                                    <tr key={id}>
                                      <td className="ps-3 fw-bold">{index + 1}</td>
                                      <td className="fw-bold text-dark">{position}</td>
                                      <td style={{ maxWidth: "360px" }}>
                                        <div className="text-muted small">{message || "Không có nội dung"}</div>
                                      </td>
                                      <td className="text-muted small">
                                        {createdAt
                                          ? new Date(createdAt).toLocaleDateString("vi-VN", {
                                              day: "2-digit",
                                              month: "2-digit",
                                              year: "numeric",
                                            })
                                          : "Không rõ"}
                                      </td>
                                      <td>
                                        <span className={`badge rounded-pill px-3 py-2 ${statusClass}`}>
                                          {statusLabel}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB: SUPPORT */}
                    {activeTab === "support" && (
                      <div className="support-chat d-flex flex-column bg-white rounded-4 border shadow-sm overflow-hidden" style={{ height: "600px" }}>
                        {/* Chat Header */}
                        <div className="bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
                           <div className="d-flex align-items-center gap-3">
                              <div className="position-relative">
                                 <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '48px', height: '48px', fontSize: '20px' }}>
                                    <i className="bi bi-headset"></i>
                                 </div>
                                 <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-2 border-white rounded-circle"></span>
                              </div>
                              <div>
                                 <h6 className="fw-bold mb-0 text-dark">Hỗ trợ trực tuyến</h6>
                                 <div className="d-flex align-items-center gap-1">
                                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill" style={{fontSize: "10px"}}>
                                      <i className="bi bi-circle-fill me-1" style={{fontSize: "6px"}}></i>Đang hoạt động
                                    </span>
                                 </div>
                              </div>
                           </div>
                           <div>
                              <button className="btn btn-light rounded-circle text-muted"><i className="bi bi-three-dots-vertical"></i></button>
                           </div>
                        </div>

                        {/* Chat Messages Area */}
                        <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3 bg-light bg-opacity-50" style={{ scrollBehavior: 'smooth' }}>
                          <div className="text-center mb-4">
                             <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-1 fw-normal">Hôm nay</span>
                          </div>

                          {loadingSupport ? (
                            <div className="text-center py-5 my-auto">
                              <div className="spinner-border text-primary" role="status"></div>
                            </div>
                          ) : supportMessages.length === 0 ? (
                            <div className="text-center my-auto">
                              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                                 <i className="bi bi-chat-dots text-primary display-5"></i>
                              </div>
                              <h5 className="fw-bold text-dark">Bắt đầu trò chuyện</h5>
                              <p className="text-muted small">Quản trị viên sẽ phản hồi bạn trong thời gian sớm nhất.</p>
                            </div>
                          ) : (
                            supportMessages.map((msgItem, index) => {
                              const isCustomer = msgItem.name !== "Admin";
                              const showAvatar = index === 0 || supportMessages[index - 1].name !== msgItem.name;
                              
                              return (
                                <div key={msgItem.id} className={`d-flex gap-2 ${isCustomer ? 'flex-row-reverse' : ''} align-items-end`}>
                                   <div style={{ width: '36px' }} className="flex-shrink-0">
                                      {showAvatar && (
                                         <div className={`${isCustomer ? 'bg-secondary' : 'bg-primary'} text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm mx-auto`} style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                                            {isCustomer ? <i className="bi bi-person"></i> : <i className="bi bi-robot"></i>}
                                         </div>
                                      )}
                                   </div>
                                   
                                   <div className={`d-flex flex-column ${isCustomer ? 'align-items-end' : 'align-items-start'}`} style={{ maxWidth: '75%' }}>
                                     {showAvatar && (
                                       <span className="text-muted mb-1 fw-medium" style={{ fontSize: "11px", padding: "0 4px" }}>
                                          {isCustomer ? 'Bạn' : 'Hệ thống hỗ trợ'} • {new Date(msgItem.sentAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                       </span>
                                     )}
                                     <div 
                                        className={`p-3 shadow-sm ${isCustomer ? 'bg-primary text-white' : 'bg-white text-dark border border-light-subtle'}`} 
                                        style={{ 
                                           borderRadius: "20px", 
                                           borderBottomRightRadius: isCustomer ? (showAvatar ? '4px' : '20px') : '20px',
                                           borderBottomLeftRadius: !isCustomer ? (showAvatar ? '4px' : '20px') : '20px',
                                           lineHeight: '1.5',
                                           fontSize: '15px'
                                        }}
                                     >
                                       {msgItem.message || 'Không có nội dung văn bản.'}
                                     </div>
                                   </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                        
                        {/* Chat Input Area */}
                        <div className="bg-white p-3 border-top">
                           <div className="d-flex align-items-end gap-2 bg-light rounded-4 p-2 border focus-ring-primary transition-all">
                              <button className="btn btn-light bg-transparent border-0 rounded-circle flex-shrink-0 text-muted fs-5" style={{ width: '44px', height: '44px' }}>
                                 <i className="bi bi-emoji-smile"></i>
                              </button>
                              <button className="btn btn-light bg-transparent border-0 rounded-circle flex-shrink-0 text-muted fs-5" style={{ width: '44px', height: '44px' }}>
                                 <i className="bi bi-paperclip"></i>
                              </button>
                              <textarea 
                                 className="form-control bg-transparent border-0 shadow-none px-2 py-2 text-dark" 
                                 placeholder="Nhập tin nhắn để bắt đầu..." 
                                 rows="1"
                                 style={{ resize: 'none', maxHeight: '120px', fontSize: '15px' }}
                                 value={replyText}
                                 onChange={(e) => {
                                    setReplyText(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
                                 }}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' && !e.shiftKey) {
                                     e.preventDefault();
                                     handleSendSupportMessage();
                                     e.target.style.height = 'auto';
                                   }
                                 }}
                              />
                              <button 
                                 className={`btn rounded-circle flex-shrink-0 shadow-sm transition-all d-flex align-items-center justify-content-center ${replyText.trim() ? 'btn-primary' : 'btn-secondary bg-opacity-25 border-0 text-muted'}`} 
                                 style={{ width: '44px', height: '44px' }} 
                                 onClick={() => {
                                    handleSendSupportMessage();
                                    const ta = document.querySelector('.support-chat textarea');
                                    if(ta) ta.style.height = 'auto';
                                 }}
                                 disabled={!replyText.trim()}
                              >
                                 <i className="bi bi-send-fill fs-5"></i>
                              </button>
                           </div>
                           <div className="text-center mt-2">
                              <small className="text-muted" style={{ fontSize: '11px' }}>Nhấn <kbd className="bg-light text-dark border">Enter</kbd> để gửi, <kbd className="bg-light text-dark border">Shift + Enter</kbd> để xuống dòng</small>
                           </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Decorative Right Image/Avatar Area for larger screens (Only show on profile tab) */}
                  {activeTab === "profile" && (
                    <div className="col-12 col-xl-3 d-none d-xl-flex flex-column align-items-center pt-3 pb-4" style={{ borderLeft: "1px solid #f1f5f9" }}>
                        <div 
                          className="position-relative mb-4"
                          style={{ width: "130px", height: "130px" }}
                        >
                          <div 
                            className="rounded-circle shadow-md d-flex align-items-center justify-content-center overflow-hidden border border-4 border-white"
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)"
                            }}
                          >
                            {userData.avatar ? (
                              <img src={getImageUrl(userData.avatar)} alt="Avatar" className="w-100 h-100 object-fit-cover" />
                            ) : (() => {
                              const name = userData.fullName || userData.email || "Tài khoản";
                              const initials = name.trim().split(" ").pop().substring(0, 2).toUpperCase();
                              return (
                                <div 
                                  className="w-100 h-100 d-flex align-items-center justify-content-center fw-bold text-white"
                                  style={{
                                    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                                    fontSize: "42px",
                                    letterSpacing: "1px",
                                    textShadow: "0 2px 4px rgba(0,0,0,0.15)"
                                  }}
                                >
                                  {initials}
                                </div>
                              );
                            })()}
                          </div>
                          <label 
                            htmlFor="avatarInput" 
                            className="position-absolute bottom-0 end-0 bg-white border rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                            style={{ 
                              width: "36px", 
                              height: "36px", 
                              borderColor: "#e2e8f0",
                              cursor: "pointer",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                            }}
                            title="Tải ảnh lên"
                          >
                            <i className="bi bi-camera-fill" style={{ fontSize: "15px", color: "#6366f1" }}></i>
                          </label>
                        </div>
                        <input 
                          type="file" 
                          id="avatarInput" 
                          className="d-none" 
                          accept="image/*" 
                          onChange={handleAvatarChange}
                        />
                        <button 
                          type="button"
                          className="btn fw-bold rounded-pill px-4 shadow-sm transition-all"
                          style={{ 
                            fontSize: "13px",
                            border: "1px solid #cbd5e1",
                            color: "#475569",
                            backgroundColor: "#ffffff",
                            padding: "8px 20px"
                          }}
                          onClick={() => document.getElementById('avatarInput').click()}
                        >
                          Thay đổi ảnh đại diện
                        </button>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

                {/* Order Detail Modal */}
          {showOrderModal && selectedOrder && (
            <div className="modal-backdrop fade show" style={{ zIndex: 9998 }}></div>
          )}
          {showOrderModal && selectedOrder && (
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 9999 }}>
              <div className="modal-dialog modal-lg modal-dialog-centered" style={{ marginTop: "100px" }}>
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                  <div className="modal-header bg-white py-3 border-bottom">
                    <h5 className="modal-title fw-bold text-dark">Chi tiết đơn hàng</h5>
                <button type="button" className="btn-close" onClick={() => setShowOrderModal(false)}></button>
              </div>
              <div className="modal-body p-0 bg-white">
                <div className="row g-0">
                  {/* Left Side: Items List (Scrollable) */}
                  <div className="col-lg-7 border-end p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                    <h6 className="fw-bold mb-4 d-flex align-items-center gap-2">
                       <i className="bi bi-cart3 text-primary"></i>
                       Sản phẩm trong đơn ({selectedOrder.orderDetails?.length || 0})
                    </h6>
                    <div className="order-items-container">
                      {selectedOrder.orderDetails?.map((item, idx) => (
                        <div key={idx} className="d-flex align-items-center gap-3 mb-3 p-2 rounded-3 hover-bg-light transition-all border">
                          <div className="bg-light rounded-3 overflow-hidden flex-shrink-0 shadow-sm" style={{ width: "65px", height: "65px" }}>
                             <img 
                               src={getImageUrl(item.productImageUrl || item.ProductImageUrl)} 
                               alt={item.productTitle || item.ProductTitle}
                               className="w-100 h-100 object-fit-cover"
                               onError={(e) => e.target.src = FALLBACK_BOOK_IMAGE}
                             />
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-bold text-dark small mb-1 line-clamp-1">{item.productTitle || item.ProductTitle}</div>
                            <div className="text-muted extra-small d-flex align-items-center gap-2" style={{fontSize: '11px'}}>
                              <span className="badge bg-light text-dark border fw-normal">x{item.quantity}</span>
                              <span>{new Intl.NumberFormat("vi-VN").format(item.unitPrice)} đ</span>
                            </div>
                          </div>
                          <div className="text-end flex-shrink-0">
                            <div className="fw-bold text-primary small">{new Intl.NumberFormat("vi-VN").format(item.totalPrice)} đ</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Side: Order Info & Summary */}
                  <div className="col-lg-5 p-4 bg-light bg-opacity-50">
                    {/* Status Section */}
                    <div className="mb-4 pb-4 border-bottom">
                       <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="text-muted small fw-bold">TRẠNG THÁI</span>
                          <span className={`badge rounded-pill px-3 py-2 ${
                            selectedOrder.status === "Pending" ? "bg-warning text-dark" : 
                            selectedOrder.status === "Processing" ? "bg-info text-dark" :
                            selectedOrder.status === "Shipping" ? "bg-primary" :
                            selectedOrder.status === "Completed" ? "bg-success" : "bg-secondary"
                          }`}>
                            {selectedOrder.status === "Pending" ? "Chờ xác nhận" : 
                             selectedOrder.status === "Processing" ? "Đang đóng gói" :
                             selectedOrder.status === "Shipping" ? "Đang giao hàng" :
                             selectedOrder.status === "Completed" ? "Đã giao hàng" :
                             selectedOrder.status === "Cancelled" ? "Đã hủy" : selectedOrder.status}
                          </span>
                       </div>
                       <div className="d-flex justify-content-between">
                          <span className="text-muted small fw-bold">NGÀY ĐẶT</span>
                          <span className="fw-bold small">{new Date(selectedOrder.orderDate).toLocaleDateString('vi-VN')}</span>
                       </div>
                    </div>

                    {/* Summary Section */}
                    <div className="mb-4">
                       <h6 className="fw-bold mb-3 small text-muted">TỔNG CỘNG</h6>
                       <div className="p-3 bg-white rounded-4 border shadow-sm">
                          <div className="d-flex justify-content-between mb-2 small">
                            <span className="text-muted">Tạm tính</span>
                            <span className="fw-bold">{new Intl.NumberFormat("vi-VN").format(selectedOrder.totalAmount)} đ</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2 small">
                            <span className="text-muted">Phí giao hàng</span>
                            <span className="text-success fw-bold">Miễn phí</span>
                          </div>
                          <div className="d-flex justify-content-between pt-2 border-top mt-2">
                            <span className="fw-bold">Thành tiền</span>
                            <span className="fw-bold text-primary fs-5">{new Intl.NumberFormat("vi-VN").format(selectedOrder.totalAmount)} đ</span>
                          </div>
                       </div>
                    </div>

                    {/* Actions */}
                    <div className="d-grid gap-2">
                       {selectedOrder.status === "Pending" && (
                         <button 
                           className="btn btn-danger rounded-pill fw-bold py-2 shadow-sm"
                           onClick={() => { setOrderToCancel(selectedOrder.id); setShowCancelConfirm(true); }}
                         >
                           <i className="bi bi-x-circle me-2"></i> Hủy đơn hàng
                         </button>
                       )}
                       <button className="btn btn-outline-secondary rounded-pill fw-bold py-2" onClick={() => setShowOrderModal(false)}>
                          Đóng
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* CUSTOM CONFIRM MODAL */}
      {showCancelConfirm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm" style={{ maxWidth: '400px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-body p-4 text-center">
                <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                  <i className="bi bi-exclamation-triangle fs-1"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Xác nhận hủy đơn</h5>
                <p className="text-muted mb-4 px-3">Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.</p>
                <div className="d-flex gap-3 justify-content-center">
                  <button 
                    className="btn btn-light rounded-pill px-4 flex-grow-1 fw-bold" 
                    onClick={() => { setShowCancelConfirm(false); setOrderToCancel(null); }}
                    disabled={loadingOrders}
                  >
                    Quay lại
                  </button>
                  <button 
                    className="btn btn-danger rounded-pill px-4 flex-grow-1 fw-bold"
                    onClick={() => handleCancelOrder(orderToCancel)}
                    disabled={loadingOrders}
                  >
                    {loadingOrders ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : null}
                    Đồng ý hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
  .ls-wide { letter-spacing: 0.5px; }
  .bg-light-subtle { background-color: #f8f9fa !important; }
  .cursor-pointer { cursor: pointer; }

  .order-summary-box {
    max-width: 420px;
    width: 100%;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    padding: 20px;
  }

  .order-items-container {
    border-radius: 18px !important;
  }

  .modal-content.rounded-4 {
    border-radius: 22px !important;
  }

  .modal-header {
    padding-left: 24px;
    padding-right: 24px;
  }

  .modal-body {
    padding: 28px !important;
  }

  .modal-footer {
    padding-left: 28px !important;
    padding-right: 28px !important;
  }
`}</style>
    </div>
  );
}

export default ProfilePage;
