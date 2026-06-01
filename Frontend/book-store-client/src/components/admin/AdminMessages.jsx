import React, { useEffect, useState, useMemo } from "react";
import { apiRequest } from "../../services/apiClient";
import { showToast } from "../common/Toast.jsx";
import ConfirmModal from "../common/ConfirmModal.jsx";
import "../../styles/admin/AdminAuthors.css";
function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [chatThread, setChatThread] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [page, setPage] = useState(1);
  const [replyText, setReplyText] = useState("");
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("adminPageSize_messages");
    return saved ? Number(saved) : 6;
  });

  const fetchMessages = (isBackground = false) => {
    if (!isBackground) setLoading(true);
    apiRequest("/ContactMessages")
      .then(data => setMessages(data))
      .catch(err => console.error(err))
      .finally(() => {
        if (!isBackground) setLoading(false);
      });
  };

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(() => {
      fetchMessages(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const stats = useMemo(() => {
    const total = messages.length;
    const unread = messages.filter(m => !m.isRead).length;
    const read = total - unread;
    return { total, unread, read };
  }, [messages]);

  const filteredMessages = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return messages.filter(m => {
      const matchesSearch = !keyword || 
                           m.name?.toLowerCase().includes(keyword) || 
                           m.email?.toLowerCase().includes(keyword) ||
                           m.subject?.toLowerCase().includes(keyword);
      
      const matchesStatus = filterStatus === "all" || 
                           (filterStatus === "unread" && !m.isRead) ||
                           (filterStatus === "read" && m.isRead);
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.sentAt || 0) - new Date(a.sentAt || 0));
  }, [messages, searchTerm, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / pageSize));
  const paginatedMessages = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMessages.slice(start, start + pageSize);
  }, [filteredMessages, page, pageSize]);

  const handleMarkAsRead = (id) => {
    apiRequest(`/ContactMessages/${id}/read`, { method: "PATCH" })
      .then(() => {
        setMessages(messages.map(m => m.id === id ? { ...m, isRead: true } : m));
      })
      .catch(err => console.error(err));
  };

  const handleDeleteClick = (id) => {
    setConfirmDelete({ show: true, id });
  };

  const executeDelete = async () => {
    try {
      await apiRequest(`/ContactMessages/${confirmDelete.id}`, { method: "DELETE" });
      setMessages(messages.filter(m => m.id !== confirmDelete.id));
      showToast("Đã xóa tin nhắn thành công", "success");
      setConfirmDelete({ show: false, id: null });
      if (selectedMsg?.id === confirmDelete.id) setShowModal(false);
    } catch (err) {
      showToast("Lỗi khi xóa tin nhắn", "error");
      setConfirmDelete({ show: false, id: null });
    }
  };

  const openMessage = async (msg) => {
    setSelectedMsg(msg);
    setShowModal(true);
    setReplyText("");
    setChatThread([msg]); 
    if (!msg.isRead) {
      handleMarkAsRead(msg.id);
    }
    try {
      const thread = await apiRequest(`/ContactMessages/email/${encodeURIComponent(msg.email)}`);
      setChatThread(thread);
    } catch (err) {
      console.error("Lỗi khi tải cuộc trò chuyện", err);
    }
  };

  useEffect(() => {
    let intervalId;
    if (showModal && selectedMsg) {
      intervalId = setInterval(async () => {
        try {
          const thread = await apiRequest(`/ContactMessages/email/${encodeURIComponent(selectedMsg.email)}`);
          setChatThread(thread);
          const unreadFromCustomer = thread.filter(m => m.name !== "Admin" && !m.isRead);
          for (const msg of unreadFromCustomer) {
            await apiRequest(`/ContactMessages/${msg.id}/read`, { method: "PATCH" });
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
          }
        } catch (err) {
          console.error("Lỗi khi tải cuộc trò chuyện (polling)", err);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showModal, selectedMsg]);

  const handleReply = async () => {
    if (!replyText.trim()) {
      showToast("Vui lòng nhập nội dung phản hồi", "warning");
      return;
    }
    try {
      const replyMsg = await apiRequest(`/ContactMessages/${selectedMsg.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ reply: replyText }),
      });
      showToast("Đã gửi phản hồi thành công", "success");
      setReplyText("");
      setChatThread(prev => [...prev, replyMsg]);
      // Also update the main list to show as read if it was unread
      setMessages(messages.map(m => m.id === selectedMsg.id ? { ...m, isRead: true } : m));
    } catch (err) {
      showToast("Lỗi khi gửi phản hồi", "error");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setPage(1);
  };

  return (
    <div className="admin-authors-page animate-fade-in pt-3 mt-2">

      {/* Analytics Dashboard */}
      <div className="row g-2 mb-3">
        {[
          { label: "Tổng tin nhắn", value: stats.total, icon: "bi-envelope-paper", color: "#4f46e5" },
          { label: "Chưa đọc", value: stats.unread, icon: "bi-envelope-exclamation", color: "#e11d48" },
          { label: "Đã xử lý", value: stats.read, icon: "bi-envelope-check", color: "#10b981" },
          { label: "Hỗ trợ", value: "24/7", icon: "bi-headset", color: "#f59e0b" }
        ].map((s, idx) => (
          <div className="col-xl-3 col-md-6 d-flex" key={idx}>
            <div className="stat-card-modern stationery-stat-card p-2 rounded-3 shadow-sm bg-white border-0 position-relative d-flex align-items-center gap-3 w-100 h-100">
              <div className="icon-box-modern rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
                <i className={`bi ${s.icon} fs-5`}></i>
              </div>

              <div className="flex-grow-1">
                <div className="label fw-bold text-slate-500 x-small text-uppercase mb-0">
                  {s.label}
                </div>
                <div className="value fw-800 fs-5 text-slate-900">
                  {s.value}
                </div>
              </div>

              <div className="decoration-bar" style={{ background: s.color }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Table Area */}
      <div className="card stationery-table-card border-0 shadow-sm rounded-4 bg-white">
        <div className="card-header bg-white border-bottom border-slate-100 p-3">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="modern-search-box">
                <i className="bi bi-search"></i>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Tìm theo tên, email, chủ đề..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="position-relative d-flex align-items-center w-100 h-100">
                <select 
                  className="form-select w-100 h-100" 
                  style={{ 
                    minHeight: '48px', 
                    borderRadius: '14px', 
                    border: '1px solid #e2e8f0', 
                    color: '#0f172a', 
                    fontWeight: '600', 
                    paddingLeft: '16px',
                    paddingRight: filterStatus !== "all" ? '46px' : '36px'
                  }}
                  value={filterStatus} 
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                >
                  <option value="all">Tất cả tin nhắn</option>
                  <option value="unread">Chưa xử lý (Mới)</option>
                  <option value="read">Đã xử lý (Cũ)</option>
                </select>
                {filterStatus !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatus("all");
                      setPage(1);
                    }}
                    className="btn p-0 border-0 position-absolute"
                    style={{
                      right: '34px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#475569'}
                    onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                    title="Xóa lọc"
                  >
                    <i className="bi bi-x-circle-fill" style={{ fontSize: '14px' }}></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-scroll-x">
            <table className="table table-modern align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-3" style={{width: '60px'}}>STT</th>
                  <th style={{width: '25%'}}>Khách hàng</th>
                  <th style={{width: '30%'}}>Chủ đề yêu cầu</th>
                  <th style={{width: '15%'}}>Thời gian gửi</th>
                  <th style={{width: '15%'}}>Trạng thái</th>
                  <th className="action-col" style={{width: '110px'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="spinner-border text-primary"></div>
                      <p className="text-slate-400 small fw-bold mt-2">Đang tải dữ liệu...</p>
                    </td>
                  </tr>
                ) : paginatedMessages.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                       <i className="bi bi-envelope-x fs-1 text-slate-200 d-block mb-3"></i>
                       <p className="text-slate-400 fw-bold">Không tìm thấy tin nhắn nào</p>
                    </td>
                  </tr>
                ) : paginatedMessages.map((m, idx) => (
                  <tr key={m.id} onClick={() => openMessage(m)} style={{ cursor: 'pointer' }}>
                    <td className="ps-3 py-2">
                       <div className="fw-800 text-slate-900 mb-0">{(page - 1) * pageSize + idx + 1}</div>
                    </td>
                    <td>
                       <div>
                          <div className="fw-800 text-slate-900 mb-0">{m.name}</div>
                          <div className="small text-slate-400 fw-bold">{m.email}</div>
                       </div>
                    </td>
                    <td>
                      <div className="text-slate-700 fw-800 small text-truncate" style={{maxWidth: '300px'}}>
                        {m.subject}
                      </div>
                    </td>
                    <td>
                      <div className="fw-bold text-slate-500 small">
                        {new Date(m.sentAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td>
                      {m.isRead ? (
                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-bold border border-success border-opacity-25">
                           <i className="bi bi-check2-all me-1"></i> Đã xem
                        </span>
                      ) : (
                        <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2 fw-bold border border-warning border-opacity-25">
                           <i className="bi bi-patch-exclamation-fill me-1"></i> Tin mới
                        </span>
                      )}
                    </td>
                    <td className="action-col" style={{width: '110px'}}>
                       <div className="d-flex align-items-center justify-content-end gap-2">
                          <button 
                            className="action-btn flex-shrink-0" 
                            style={{ background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' }}
                            title="Xem chi tiết" 
                            onClick={(e) => { e.stopPropagation(); openMessage(m); }}
                          >
                            <i className="bi bi-eye-fill"></i>
                          </button>
                          <button 
                            className="action-btn delete-btn flex-shrink-0" 
                            title="Xóa tin nhắn" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(m.id); }}
                          >
                            <i className="bi bi-trash3-fill"></i>
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="pagination-container rounded-bottom-4" style={{ borderTop: "none" }}>
            <div className="pagination-info fw-bold-700 text-dark">
              Hiển thị {Math.min((page - 1) * pageSize + 1, filteredMessages.length)} –{" "}
              {Math.min(page * pageSize, filteredMessages.length)} trong tổng số{" "}
              {filteredMessages.length} tin nhắn
            </div>

            
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="text-slate-800 fw-bold text-uppercase" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>Số dòng:</span>
                <select
                  className="form-select form-select-sm shadow-sm"
                  style={{ width: '70px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    localStorage.setItem("adminPageSize_messages", newSize);
                    setPage(1);
                  }}
                >
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="pagination-nav">
                
              <button
                type="button"
                className="pagination-btn"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pagination-btn ${page === p ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                className="pagination-btn"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedMsg && (
        <div className="modal-overlay-modern animate-fade-in" style={{ backdropFilter: 'blur(4px)' }}>
          <style>
            {`
              .chat-scroll-area::-webkit-scrollbar { width: 6px; }
              .chat-scroll-area::-webkit-scrollbar-track { background: transparent; }
              .chat-scroll-area::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
              .chat-scroll-area::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
            `}
          </style>
          <div className="stationery-book-modal-card animate-scale-in" style={{ maxWidth: '950px', padding: 0, overflow: 'hidden', borderRadius: '1.25rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Header */}
            <div className="px-4 py-3 d-flex justify-content-between align-items-center bg-white border-bottom">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-indigo-subtle text-indigo rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-chat-dots-fill fs-5"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-800 text-slate-800" style={{ letterSpacing: '-0.5px' }}>Chi tiết cuộc trò chuyện</h5>
                  <p className="mb-0 text-slate-500 x-small fw-medium">ID: #{selectedMsg.id} • Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
              <button type="button" className="btn btn-light rounded-circle text-slate-500 hover-bg-slate-200 transition-all d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }} onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="d-flex" style={{ height: '70vh', minHeight: '500px', maxHeight: '700px' }}>
              
              {/* Left Pane - Customer Info */}
              <div className="border-end bg-slate-50 p-4 d-flex flex-column" style={{ width: '320px', flexShrink: 0 }}>
                <h6 className="fw-800 text-slate-800 mb-4 text-uppercase x-small ls-1 text-primary">Thông tin khách hàng</h6>
                
                <div className="d-flex flex-column gap-4">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className="bi bi-person text-slate-400"></i>
                      <div className="text-slate-500 x-small fw-bold text-uppercase">Họ và tên</div>
                    </div>
                    <div className="fw-800 text-slate-900 fs-6 ps-4">{selectedMsg.name}</div>
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className="bi bi-telephone text-slate-400"></i>
                      <div className="text-slate-500 x-small fw-bold text-uppercase">Điện thoại</div>
                    </div>
                    <div className="fw-800 text-slate-700 ps-4">{selectedMsg.phone || 'Chưa cung cấp'}</div>
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className="bi bi-envelope text-slate-400"></i>
                      <div className="text-slate-500 x-small fw-bold text-uppercase">Email liên hệ</div>
                    </div>
                    <div className="fw-bold text-indigo ps-4 text-break">{selectedMsg.email}</div>
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className="bi bi-clock-history text-slate-400"></i>
                      <div className="text-slate-500 x-small fw-bold text-uppercase">Gửi lúc</div>
                    </div>
                    <div className="fw-bold text-slate-600 small ps-4">{new Date(selectedMsg.sentAt).toLocaleString('vi-VN')}</div>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <button type="button" className="btn btn-outline-danger w-100 fw-bold rounded-3 py-2 d-flex align-items-center justify-content-center gap-2 transition-all hover-scale" onClick={() => { setShowModal(false); handleDeleteClick(selectedMsg.id); }}>
                    <i className="bi bi-trash3"></i> Xóa phiên chat
                  </button>
                </div>
              </div>

              {/* Right Pane - Chat Area */}
              <div className="flex-grow-1 d-flex flex-column bg-white position-relative">
                
                {/* Chat Header */}
                <div className="px-4 py-3 border-bottom bg-white d-flex justify-content-between align-items-center shadow-sm" style={{ zIndex: 10 }}>
                   <div>
                      <div className="text-slate-400 x-small fw-bold text-uppercase mb-1">Chủ đề hỗ trợ</div>
                      <div className="fw-800 text-slate-900 fs-5 ls-tight">{selectedMsg.subject}</div>
                   </div>
                   <div className="d-flex align-items-center gap-2 bg-success bg-opacity-10 text-success rounded-pill px-3 py-1 border border-success border-opacity-25 shadow-sm">
                      <div className="rounded-circle bg-success" style={{ width: '8px', height: '8px', animation: 'pulse 2s infinite' }}></div>
                      <span className="fw-bold small">Trực tuyến</span>
                   </div>
                </div>

                {/* Chat Messages */}
                <div className="chat-scroll-area flex-grow-1 overflow-auto p-4 d-flex flex-column gap-4" style={{ backgroundColor: '#f8fafc' }}>
                   {chatThread.map((msgItem, index) => {
                     const isAdmin = msgItem.name === "Admin";
                     // Check if previous message was from the same sender to group them
                     const showAvatar = index === chatThread.length - 1 || chatThread[index + 1]?.name !== msgItem.name;
                     
                     return (
                       <div key={msgItem.id} className={`d-flex flex-column ${isAdmin ? 'align-items-end' : 'align-items-start'}`}>
                          {/* Sender Name & Time */}
                          <div className={`d-flex align-items-center gap-2 mb-1 px-1 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                             <span className="fw-bold text-slate-600" style={{ fontSize: '13px' }}>{isAdmin ? 'Quản trị viên' : msgItem.name}</span>
                             <span className="text-slate-400" style={{ fontSize: '11px' }}>{new Date(msgItem.sentAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          
                          {/* Chat Bubble */}
                          <div className={`d-flex gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                             <div style={{ width: '32px', flexShrink: 0 }} className="d-flex align-items-end">
                               {showAvatar && (
                                 <div className={`${isAdmin ? 'bg-indigo text-white shadow-sm' : 'bg-white text-primary border shadow-sm'} rounded-circle d-flex align-items-center justify-content-center fw-800`} style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                                    {isAdmin ? <i className="bi bi-headset"></i> : msgItem.name?.charAt(0).toUpperCase()}
                                 </div>
                               )}
                             </div>
                             
                             <div 
                                className={`p-3 shadow-sm ${isAdmin ? 'text-white' : 'bg-white text-slate-800 border border-slate-200'}`} 
                                style={{ 
                                  maxWidth: '450px', 
                                  background: isAdmin ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#ffffff',
                                  borderRadius: '1.25rem',
                                  borderBottomRightRadius: isAdmin && showAvatar ? '0.25rem' : '1.25rem',
                                  borderBottomLeftRadius: !isAdmin && showAvatar ? '0.25rem' : '1.25rem',
                                }}
                              >
                                <p className="mb-0" style={{lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                                   {msgItem.message || 'Không có nội dung văn bản.'}
                                </p>
                             </div>
                          </div>
                       </div>
                     );
                   })}
                </div>

                {/* Chat Input */}
                <div className="p-3 bg-white border-top shadow-lg">
                   <div className="position-relative d-flex align-items-center bg-slate-50 border border-slate-200 rounded-pill px-2 py-1 transition-all focus-within-shadow">
                      <button className="btn btn-link text-slate-400 hover-text-primary rounded-circle d-flex align-items-center justify-content-center p-0 ms-1" style={{ width: '40px', height: '40px' }}>
                         <i className="bi bi-paperclip fs-5"></i>
                      </button>
                      
                      <input 
                         type="text" 
                         className="form-control bg-transparent border-0 shadow-none px-3" 
                         placeholder="Nhập tin nhắn hỗ trợ khách hàng..." 
                         style={{ height: '48px' }}
                         value={replyText}
                         onChange={(e) => setReplyText(e.target.value)}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             e.preventDefault();
                             handleReply();
                           }
                         }}
                      />
                      
                      <div className="d-flex gap-1 align-items-center">
                         <button className="btn btn-link text-slate-400 hover-text-warning rounded-circle d-flex align-items-center justify-content-center p-0" style={{ width: '40px', height: '40px' }}>
                            <i className="bi bi-emoji-smile fs-5"></i>
                         </button>
                         <button 
                            className="btn btn-primary rounded-circle shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" 
                            style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }} 
                            onClick={handleReply}
                            disabled={!replyText.trim()}
                         >
                            <i className="bi bi-send-fill text-white ms-1"></i>
                         </button>
                      </div>
                   </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        show={confirmDelete.show}
        title="Xóa tin nhắn"
        message="Dữ liệu tin nhắn này sẽ bị xóa vĩnh viễn khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục?"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ show: false, id: null })}
        type="danger"
      />
    </div>
  );
}

export default AdminMessages;
