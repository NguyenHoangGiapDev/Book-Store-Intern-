const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api"
).replace(/\/$/, "");

const ORDER_API = "/orders";
const PRODUCT_API = "/products";
const RETURN_API = "/returns";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Lỗi API ${response.status}`);
  }

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.$values)) return value.$values;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.result)) return value.result;
  return [];
}

export async function getDashboardData() {
  const [ordersPayload, productsPayload, returnsPayload] = await Promise.all([
    apiRequest(ORDER_API),
    apiRequest(PRODUCT_API),
    apiRequest(RETURN_API).catch(() => []),
  ]);

  return {
    orders: toArray(ordersPayload),
    products: toArray(productsPayload),
    returns: toArray(returnsPayload),
  };
}