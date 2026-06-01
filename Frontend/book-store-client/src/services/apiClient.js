const API_BASE_URL =
  import.meta.env.VITE_API_BASE || "http://localhost:5005/api";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Với FormData, tuyệt đối không tự set Content-Type
  // Browser sẽ tự set multipart/form-data kèm boundary
  if (isFormData && headers["Content-Type"]) {
    delete headers["Content-Type"];
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const rawText = await response.text();

  let data = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText;
  }

  if (!response.ok) {
    let message = `HTTP ${response.status} ${response.statusText}`;

    if (typeof data === "string" && data.trim().length > 0) {
      message = data;
    } else if (data) {
      if (data.message) message = data.message;
      else if (data.detail) message = data.detail;
      else if (data.title) message = data.title;
      else if (data.innerError) message = data.innerError;
      else if (data.dbError) message = data.dbError;
      else if (data.errors) {
        const errs = [];

        for (const key of Object.keys(data.errors)) {
          const value = data.errors[key];

          if (Array.isArray(value)) {
            errs.push(...value);
          } else {
            errs.push(String(value));
          }
        }

        if (errs.length > 0) {
          message = errs.join("\n");
        }
      }
    }

    const errorDetails = {
      url,
      status: response.status,
      statusText: response.statusText,
      responseData: data,
      rawText,
      friendlyMessage: message,
    };

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("auth");
      window.dispatchEvent(new Event("authChanged"));
      
      // If we are not on login page, we could redirect, but throwing error is enough 
      // if components handle authChanged or if we just want to force a refresh
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?error=session_expired';
      }
    }

    if (
      response.status === 400 ||
      response.status === 401 ||
      response.status === 403
    ) {
      console.warn("API Expected Client Error:", errorDetails);
    } else {
      console.error("API Error Details:", errorDetails);
    }

    throw new Error(message);
  }

  return data;
}