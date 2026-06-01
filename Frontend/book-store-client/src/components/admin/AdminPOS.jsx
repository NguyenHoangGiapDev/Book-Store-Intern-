import React, { useState } from "react";
import { formatBookPrice } from "../../utils/bookDisplay";
import { showToast } from "../common/Toast.jsx";

const AdminPOS = ({ books, stationery = [] }) => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const allProducts = [...(books || []), ...(stationery || [])];

  const filteredProducts = searchTerm.trim() === "" ? [] : allProducts.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const addToCart = (book) => {
    if (book.stockQuantity <= 0) {
      showToast("Sách này đã hết hàng trong kho!", "error");
      return;
    }
    const existing = cart.find(item => item.id === book.id);
    if (existing) {
      setCart(cart.map(item => item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...book, quantity: 1 }]);
    }
    setSearchTerm("");
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCheckout = () => {
    showToast("Đã in hóa đơn và cập nhật kho hàng thành công!", "success");
    setCart([]);
  };

  return (
    <div className="animate-fade-in">
       <div className="row g-4">
          <div className="col-lg-8">
             <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="card-header bg-white py-4 px-4">
                   <h5 className="fw-bold mb-4">Lập hóa đơn bán hàng tại quầy</h5>
                   <div className="position-relative">
                      <div className="input-group input-group-lg shadow-sm rounded-pill border overflow-hidden">
                         <span className="input-group-text bg-white border-0 ps-4"><i className="bi bi-search text-primary"></i></span>
                         <input 
                           type="text" 
                           className="form-control border-0 shadow-none ps-2" 
                           placeholder="Tìm tên sách hoặc quét mã vạch..." 
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                         />
                      </div>
                      
                      {filteredProducts.length > 0 && (
                        <div className="position-absolute w-100 mt-2 shadow-lg rounded-4 bg-white border z-3 overflow-hidden">
                           {filteredProducts.map(p => (
                             <div 
                               key={p.id} 
                               className="p-3 d-flex justify-content-between align-items-center hover-bg-light cursor-pointer border-bottom"
                               onClick={() => addToCart(p)}
                             >
                                <div className="d-flex align-items-center gap-3">
                                   <div className="bg-light rounded p-2" style={{width:'40px'}}><i className="bi bi-box"></i></div>
                                   <div>
                                      <div className="fw-bold text-dark">{p.title}</div>
                                      <div className="x-small text-muted">{p.author || p.brand} • Tồn: {p.stockQuantity}</div>
                                   </div>
                                </div>
                                <div className="fw-bold text-primary">{formatBookPrice(p.price)}</div>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                </div>
                <div className="card-body p-0">
                   <div className="table-responsive" style={{ minHeight: '450px' }}>
                      <table className="table table-hover align-middle mb-0">
                         <thead className="bg-light text-muted small text-uppercase fw-bold ls-wide">
                            <tr>
                               <th className="ps-4">Sản phẩm</th>
                               <th>Đơn giá</th>
                               <th>Số lượng</th>
                               <th>Thành tiền</th>
                               <th className="text-end pe-4">Xóa</th>
                            </tr>
                         </thead>
                         <tbody>
                            {cart.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="text-center py-5 text-muted">
                                   <i className="bi bi-cart-x display-1 opacity-10 mb-3 d-block"></i>
                                   <p className="fs-5">Giỏ hàng đang trống. Hãy tìm sản phẩm phía trên.</p>
                                </td>
                              </tr>
                            ) : cart.map(item => (
                              <tr key={item.id}>
                                 <td className="ps-4">
                                    <div className="fw-bold">{item.title}</div>
                                    <div className="x-small text-muted">ID: {item.id}</div>
                                 </td>
                                 <td>{formatBookPrice(item.price)}</td>
                                 <td>
                                    <div className="d-flex align-items-center gap-2">
                                       <button className="btn btn-sm btn-light border rounded-circle p-1" style={{width:'24px',height:'24px'}} onClick={() => updateQuantity(item.id, -1)}>-</button>
                                       <span className="fw-bold" style={{width:'30px', textAlign:'center'}}>{item.quantity}</span>
                                       <button className="btn btn-sm btn-light border rounded-circle p-1" style={{width:'24px',height:'24px'}} onClick={() => updateQuantity(item.id, 1)}>+</button>
                                    </div>
                                 </td>
                                 <td className="fw-bold text-dark">{formatBookPrice(item.price * item.quantity)}</td>
                                 <td className="text-end pe-4">
                                    <button className="btn btn-link text-danger p-0" onClick={() => removeItem(item.id)}><i className="bi bi-trash fs-5"></i></button>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          </div>
          <div className="col-lg-4">
             <div className="card border-0 shadow-lg rounded-4 bg-white h-100 position-sticky" style={{ top: '100px' }}>
                <div className="card-body p-4 d-flex flex-column">
                   <h6 className="fw-bold mb-4 border-bottom pb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-receipt text-primary"></i> CHI TIẾT THANH TOÁN
                   </h6>
                   <div className="flex-grow-1">
                      <div className="d-flex justify-content-between mb-3 text-muted">
                         <span>Tạm tính</span>
                         <span className="fw-bold">{formatBookPrice(subtotal)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-4 text-muted">
                         <span>Thuế (VAT 8%)</span>
                         <span className="fw-bold">{formatBookPrice(tax)}</span>
                      </div>
                      <div className="p-3 bg-primary bg-opacity-10 rounded-4 mb-4">
                         <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-primary">TỔNG CỘNG</span>
                            <span className="h3 fw-bold text-primary mb-0">{formatBookPrice(total)}</span>
                         </div>
                      </div>
                      
                      <div className="mb-4">
                         <label className="form-label small fw-bold text-muted text-uppercase mb-3">Phương thức thanh toán</label>
                         <div className="row g-2">
                            <div className="col-6">
                               <button className="btn btn-outline-primary w-100 py-3 rounded-4 active"><i className="bi bi-cash-coin d-block fs-4 mb-1"></i>Tiền mặt</button>
                            </div>
                            <div className="col-6">
                               <button className="btn btn-outline-primary w-100 py-3 rounded-4"><i className="bi bi-qr-code d-block fs-4 mb-1"></i>Chuyển khoản</button>
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="d-grid gap-3 mt-auto">
                      <button 
                        className="btn btn-primary btn-lg rounded-pill fw-bold py-3 shadow-lg" 
                        disabled={cart.length === 0}
                        onClick={handleCheckout}
                      >
                         <i className="bi bi-printer me-2"></i>THANH TOÁN & IN HÓA ĐƠN
                      </button>
                      <button className="btn btn-outline-secondary rounded-pill py-2 border-0" onClick={() => setCart([])}>Hủy giỏ hàng</button>
                   </div>
                </div>
             </div>
          </div>
       </div>
       <style>{`
         .cursor-pointer { cursor: pointer; }
         .hover-bg-light:hover { background-color: #f8f9fa; }
       `}</style>
    </div>
  );
};

export default AdminPOS;
