const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://localhost:5001/api";

const getToken = () => {
  return localStorage.getItem("token");
};

const request = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = "Có lỗi xảy ra khi gọi API.";

    try {
      const errorData = await response.json();
      message = errorData.message || errorData.title || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const staffService = {
  getDashboard() {
    return request("/staff/dashboard");
  },

  getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/staff/products${query ? `?${query}` : ""}`);
  },

  getProductByBarcode(barcode) {
    return request(`/staff/products/barcode/${barcode}`);
  },

  createPosOrder(payload) {
    return request("/staff/pos/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/staff/orders${query ? `?${query}` : ""}`);
  },

  getOrderDetail(orderId) {
    return request(`/staff/orders/${orderId}`);
  },

  cancelOrder(orderId, reason) {
    return request(`/staff/orders/${orderId}/cancel`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    });
  },

  getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/staff/customers${query ? `?${query}` : ""}`);
  },

  createCustomer(payload) {
    return request("/staff/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateCustomer(customerId, payload) {
    return request(`/staff/customers/${customerId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  createReturnRequest(payload) {
    return request("/staff/returns", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getReturnRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/staff/returns${query ? `?${query}` : ""}`);
  },

  openShift(payload) {
    return request("/staff/shifts/open", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  closeShift(payload) {
    return request("/staff/shifts/close", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getCurrentShift() {
    return request("/staff/shifts/current");
  },

  createCashTransaction(payload) {
    return request("/staff/shifts/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getShiftReport(shiftId) {
    return request(`/staff/reports/shift/${shiftId}`);
  },
};

export default staffService;