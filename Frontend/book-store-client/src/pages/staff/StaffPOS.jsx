import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/staff/staff.css";
import { useTranslation } from "react-i18next";
import { getImageUrl } from "../../utils/bookDisplay";
const API_BASE_URL = ( import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api").replace(/\/$/, "");
const RETAIL_CUSTOMER = "__RETAIL_CUSTOMER__";
const DEFAULT_STAFF = "__DEFAULT_STAFF__";
const PRODUCT_SOURCES = [
  { type: "book", labelKey: "pos.categories.books", endpoint: "/books",},
  { type: "stationery", labelKey: "pos.categories.stationery", endpoint: "/stationery",},
  { type: "toy", labelKey: "pos.categories.toys", endpoint: "/toys",},
  { type: "accessory", labelKey: "pos.categories.accessories", endpoint: "/accessories",},
  { type: "schoolSupply", labelKey: "pos.categories.schoolSupplies", endpoint: "/school-supplies",},
  { type: "souvenir", labelKey: "pos.categories.souvenirs", endpoint: "/souvenirs",},
];
const PROMOTION_API = "/promotions";
const PAYMENT_METHODS = [
  { value: "cash", labelKey: "pos.paymentMethods.cash", backendLabel: "Tiền mặt", icon: "💵" },
  { value: "bank", labelKey: "pos.paymentMethods.bank", backendLabel: "Chuyển khoản", icon: "🏦" },
  { value: "card", labelKey: "pos.paymentMethods.card", backendLabel: "Thẻ", icon: "💳" },
  { value: "wallet", labelKey: "pos.paymentMethods.wallet", backendLabel: "Ví điện tử", icon: "📱" },
];
const BACKEND_ORDER_STATUS = { delivered: "Đã giao hàng", success: "Thành công", paid: "Đã thanh toán", none: "Không có", offline: "Offline", noPhone: "Chưa có", };
function getToken() { return localStorage.getItem("token") || localStorage.getItem("accessToken") || ""; }
function getUserId() { try { const raw = localStorage.getItem("user") || localStorage.getItem("userData") || "{}"; const u = JSON.parse(raw); return u.id || u.Id || u.userId || u.UserId || 1; } catch { return 1; }}
function getStaffName() { try { const a = localStorage.getItem("auth"); if (a) { const auth = JSON.parse(a); return auth.fullName || auth.username || DEFAULT_STAFF; } } catch {} return DEFAULT_STAFF; }
function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.$values)) return value.$values;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.Items)) return value.Items;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.Data)) return value.Data;
  if (Array.isArray(value.result)) return value.result;
  if (Array.isArray(value.Result)) return value.Result;
  return [];
}

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function formatCurrency(value, locale = "vi-VN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getProductTypeKey(type) {
  if (type === "book") return "books";
  if (type === "toy") return "toys";
  if (type === "accessory") return "accessories";
  if (type === "schoolSupply") return "schoolSupplies";
  if (type === "souvenir") return "souvenirs";
  return type; // "stationery" remains "stationery"
}

function normalizeProduct(item, source, nameFallback = "—", authorFallback = "—") {
  const id = pick(item.id, item.Id, item.productId, item.ProductId);
  const name = pick(item.title, item.Title, item.name, item.Name, item.productName, nameFallback);
  const authorOrBrand = pick(item.author, item.Author, item.brand, item.Brand, item.manufacturer, item.publisher, authorFallback);
  const category = pick(item.categoryName, item.CategoryName, item.category?.name, item.type, source.type);
  const price = Number(pick(item.price, item.Price, item.salePrice, 0));
  const stock = Number(pick(item.stock, item.Stock, item.stockQuantity, item.Quantity, 0));
  const imageUrl = pick(item.imageUrl, item.ImageUrl, item.thumbnail, item.coverImage, "");
  return { id: `${source.type}-${id}`, rawId: id, type: source.type, name, authorOrBrand, category, price, stock, imageUrl, barcode: `${source.type.substring(0, 3).toUpperCase()}${id.toString().padStart(6, "0")}` }};
function getCustomerPoint(user) { return Number( pick( user.points, user.Points, user.loyaltyPoints, user.LoyaltyPoints, user.totalPoints, user.TotalPoints, 0 ) ); }
function getCustomerId(user) { return pick(user.id, user.Id, user.userId, user.UserId); }
function getCustomerPhone(user) {
  return String(
    pick(
      user.phoneNumber,
      user.PhoneNumber,
      user.phone,
      user.Phone,
      ""
    )
  ).trim();
}
function getCustomerName(user) {
  return String(
    pick(
      user.fullName,
      user.FullName,
      user.name,
      user.Name,
      user.userName,
      user.UserName,
      ""
    )
  ).trim();
}
function normalizeDateOnly(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const dateOnly = value.split("T")[0];
    const [year, month, day] = dateOnly.split("-").map(Number);

    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getTodayDateOnly() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}
function normalizePromotion(promo) {
  return {
    id: pick(promo.id, promo.Id, promo.promotionId, promo.PromotionId),
    code: String(pick(promo.code, promo.Code, promo.promotionCode, promo.PromotionCode, "")).trim(),
    name: pick(promo.name, promo.Name, promo.title, promo.Title, ""),
    discountPercent: Number(
      pick(
        promo.discountPercent,
        promo.DiscountPercent,
        promo.discount,
        promo.Discount,
        promo.value,
        promo.Value,
        0
      )
    ),
    startDate: pick(
      promo.startDate,
      promo.StartDate,
      promo.validFrom,
      promo.ValidFrom,
      promo.fromDate,
      promo.FromDate,
      ""
    ),
    endDate: pick(
      promo.endDate,
      promo.EndDate,
      promo.validTo,
      promo.ValidTo,
      promo.toDate,
      promo.ToDate,
      ""
    ),
    isActive:
      promo.isActive !== undefined
        ? Boolean(promo.isActive)
        : promo.IsActive !== undefined
          ? Boolean(promo.IsActive)
          : promo.active !== undefined
            ? Boolean(promo.active)
            : promo.Active !== undefined
              ? Boolean(promo.Active)
              : true,
  };
}

function isPromotionUsableToday(promo) {
  const today = getTodayDateOnly();
  const startDate = normalizeDateOnly(promo.startDate);
  const endDate = normalizeDateOnly(promo.endDate);

  if (!promo.isActive) {
    return {
      ok: false,
      messageKey: "pos.couponInactiveAlert",
      defaultValue: "Mã khuyến mãi chưa được kích hoạt.",
    };
  }

  if (startDate && today < startDate) {
    return {
      ok: false,
      messageKey: "pos.couponUpcomingAlert",
      defaultValue: "Mã khuyến mãi chưa đến ngày sử dụng.",
    };
  }

  if (endDate && today > endDate) {
    return {
      ok: false,
      messageKey: "pos.couponExpiredAlert",
      defaultValue: "Mã khuyến mãi đã hết hạn.",
    };
  }

  if (!promo.discountPercent || promo.discountPercent <= 0) {
    return {
      ok: false,
      messageKey: "pos.invalidCouponAlert",
      defaultValue: "Mã không hợp lệ.",
    };
  }

  return {
    ok: true,
    messageKey: "",
    defaultValue: "",
  };
}
async function apiRequest(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login?error=session_expired';
    }
    throw new Error(text || `HTTP Error ${response.status}`);
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const paymentMethods = PAYMENT_METHODS.map((m) => ({
  value: m.value,
  label: m.backendLabel,
  icon: m.icon,
}));

export default function StaffPOS() {
  const searchInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";
  const money = useCallback(
    (value) => formatCurrency(value, dateLocale),
    [dateLocale]
  );

  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState(RETAIL_CUSTOMER);
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerPaid, setCustomerPaid] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("amount");
  const [voucherCode, setVoucherCode] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [draftOrders, setDraftOrders] = useState([]);
  const [successOrder, setSuccessOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pendingQR, setPendingQR] = useState(null);

  // -- Advanced Barcode Scanner States --
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState("camera"); // "camera" | "manual"
  const [scannerLogs, setScannerLogs] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [scannerKeyword, setScannerKeyword] = useState("");
  const [flashActive, setFlashActive] = useState(false);
  const [globalScanFeedback, setGlobalScanFeedback] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionTimeoutRef = useRef(null);

  // Web Audio POS Beep
  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime); // Realistic high POS beep
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (err) {
      console.log("Audio POS feedback blocked or not supported:", err);
    }
  }, []);

  const handleProductScanned = useCallback((product) => {
    // 1. Add to POS cart
    setCart((prev) => {
      const existed = prev.find((item) => item.id === product.id);
      if (existed) {
        if (existed.quantity >= product.stock) {
          showToast(t("pos.stockMaxAlert"));
          return prev;
        }
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    // 2. Play beep
    playBeep();
    
    // 3. Visual scan indicator
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);
    
    // 4. Update logs inside modal
    const logItem = {
      id: `${product.id}-${Date.now()}`,
      name: product.name,
      price: product.price,
      barcode: product.barcode,
      imageUrl: product.imageUrl,
      type: product.type,
      timestamp: new Date().toLocaleTimeString(i18n.language === "vi" ? "vi-VN" : "en-US")
    };
    setScannerLogs(prev => [logItem, ...prev].slice(0, 8));
  }, [playBeep, t, i18n.language]);

  // ── Load Products ──────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const nameFallback = t("pos.noName", "—");
      const authorFallback = t("pos.noAuthor", "—");
      const results = await Promise.allSettled(
        PRODUCT_SOURCES.map(async (source) => {
          const data = await apiRequest(source.endpoint);
          return toArray(data).map((item) => normalizeProduct(item, source, nameFallback, authorFallback));
        })
      );
      const allProducts = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value);
      setProducts(allProducts);
    } catch (err) {
      showToast(t("pos.loadErrorAlert", { defaultValue: "Lỗi tải dữ liệu: {{message}}", message: err.message }));
    } finally {
      setLoading(false);
    }
  }, [t]);
  const fetchPromotions = useCallback(async () => {
  try {
    const data = await apiRequest(PROMOTION_API);
    const promotionList = toArray(data).map(normalizePromotion);

    console.log("Loaded promotions:", promotionList);

    setPromotions(promotionList);
  } catch (err) {
    console.error("Load promotions failed:", err);
    setPromotions([]);
  }
}, []);
  useEffect(() => {
  fetchProducts();
  fetchPromotions();

  const savedDrafts = JSON.parse(
    localStorage.getItem("staff_pos_drafts") || "[]"
  );

  setDraftOrders(savedDrafts);
}, [fetchProducts, fetchPromotions]);
  // Query camera devices
  const loadCameraDevices = async () => {
    try {
      const initStream = await navigator.mediaDevices.getUserMedia({ video: true });
      initStream.getTracks().forEach(track => track.stop()); // stop immediately
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedCameraId((prev) => prev || videoDevices[0].deviceId);
      }
      setCameraError("");
    } catch (err) {
      console.warn("Camera access failed or no camera found:", err);
      setCameraError(t("pos.noCameraFound"));
    }
  };

  // Trigger camera startup when modal opens and camera mode is chosen
  useEffect(() => {
    if (isScannerOpen && scannerMode === "camera") {
      loadCameraDevices();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
      setScannerActive(false);
    }
  }, [isScannerOpen, scannerMode]);

  // Handle active camera streaming
  useEffect(() => {
    let isMounted = true;
    
    const startWebcam = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (!isScannerOpen || scannerMode !== "camera" || cameraError) return;

      try {
        const constraints = selectedCameraId 
          ? { video: { deviceId: { exact: selectedCameraId } } }
          : { video: { facingMode: "environment" } };
          
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.log("Video play interrupted:", e));
          setScannerActive(true);
        }
      } catch (err) {
        console.error("Error starting camera stream:", err);
        if (isMounted) {
          setCameraError(t("pos.noCameraFound"));
        }
      }
    };

    if (isScannerOpen && scannerMode === "camera") {
      startWebcam();
    }

    return () => {
      isMounted = false;
    };
  }, [isScannerOpen, scannerMode, selectedCameraId, cameraError, t]);

  // Scanner Active Loop using BarcodeDetector if available
  useEffect(() => {
    if (!scannerActive || !videoRef.current) return;
    
    let active = true;
    let detector = null;
    
    if ("BarcodeDetector" in window) {
      try {
        detector = new window.BarcodeDetector({ formats: ["code_128", "ean_13", "qr_code"] });
      } catch (e) {
        console.log("BarcodeDetector configuration is not supported in this browser:", e);
      }
    }

    const runDetection = async () => {
      if (!active || !videoRef.current) return;
      
      if (detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0 && active) {
            const code = barcodes[0].rawValue;
            const matched = products.find(p => p.barcode === code.trim());
            if (matched) {
              handleProductScanned(matched);
              // Wait 1.5s before scanning again to avoid accidental double scans
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
        } catch (err) {
          // Ignore canvas read frames errors
        }
      }
      
      if (active) {
        detectionTimeoutRef.current = setTimeout(runDetection, 300);
      }
    };

    runDetection();

    return () => {
      active = false;
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [scannerActive, products, handleProductScanned]);

  // Autocomplete manual search suggestions
  const filteredManualProducts = useMemo(() => {
    const term = scannerKeyword.trim().toLowerCase();
    if (!term) return [];
    return products.filter(p => 
      p.barcode.toLowerCase().includes(term) || 
      p.name.toLowerCase().includes(term)
    ).slice(0, 5);
  }, [scannerKeyword, products]);

  const handleManualInputSubmit = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = scannerKeyword.trim();
      if (!code) return;
      const matched = products.find(p => p.barcode === code || p.barcode.toLowerCase() === code.toLowerCase());
      if (matched) {
        handleProductScanned(matched);
        setScannerKeyword("");
      } else {
        showToast(t("pos.barcodeNotFoundAlert"));
      }
    }
  };
  // ── Computeds ─────────────────────────────
  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.type)));
    return ["all", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const val = keyword.trim().toLowerCase();
    return products.filter((p) => {
      const matchKey = !val || p.name.toLowerCase().includes(val) || p.authorOrBrand.toLowerCase().includes(val) || p.barcode.toLowerCase().includes(val);
      const matchCat = selectedCategory === "all" || p.type === selectedCategory;
      return matchKey && matchCat;
    }).slice(0, 50); // limit for performance
  }, [keyword, selectedCategory, products]);

  const subtotal = useMemo(() => cart.reduce((t, i) => t + i.price * i.quantity, 0), [cart]);
  const discountValue = useMemo(() => {
    const raw = Number(discount || 0);
    if (raw <= 0) return 0;
    if (discountType === "percent") return Math.min((subtotal * raw) / 100, subtotal);
    return Math.min(raw, subtotal);
  }, [discount, discountType, subtotal]);

  const total = Math.max(subtotal - discountValue, 0);
  const customerPaidNumber = Number(customerPaid || 0);
  const change = Math.max(customerPaidNumber - total, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ── Handlers ───────────────────────────────
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2200);
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      showToast(t("pos.outOfStockAlert"));
      return;
    }
    setCart((prev) => {
      const existed = prev.find((item) => item.id === product.id);
      if (existed) {
        if (existed.quantity >= product.stock) {
          showToast(t("pos.stockMaxAlert"));
          return prev;
        }
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, type) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;
        const nextQ = type === "increase" ? item.quantity + 1 : item.quantity - 1;
        if (nextQ > item.stock) { showToast(t("pos.exceedStockAlert")); return item; }
        return { ...item, quantity: nextQ };
      }).filter((item) => item.quantity > 0)
    );
  };

  const changeQuantityByInput = (productId, value) => {
    const q = Math.max(Number(value || 1), 1);
    setCart((prev) => prev.map((item) => (item.id === productId ? { ...item, quantity: Math.min(q, item.stock) } : item)));
  };

  const removeItem = (productId) => setCart((prev) => prev.filter((item) => item.id !== productId));

  const clearCart = useCallback(() => {
    setCart([]);
    setCustomerPaid("");
    setDiscount(0);
    setDiscountType("amount");
    setVoucherCode("");
    setCustomerName(RETAIL_CUSTOMER);
    setCustomerPhone("");
    setOrderNote("");
  }, []);

  const handleBarcodeScan = () => {
    setScannerLogs([]);
    setScannerKeyword("");
    setIsScannerOpen(true);
  };

  const applyVoucher = () => {
  const code = voucherCode.trim().toUpperCase();

  if (!code) {
    showToast(t("pos.enterCouponAlert"));
    return;
  }

  if (!promotions.length) {
    showToast(
      t("pos.promotionLoadEmptyAlert", {
        defaultValue: "Chưa tải được danh sách khuyến mãi. Vui lòng bấm Làm mới hoặc thử lại.",
      })
    );
    return;
  }

  const matchedPromotion = promotions.find((promo) => {
    return String(promo.code || "").trim().toUpperCase() === code;
  });

  if (!matchedPromotion) {
    showToast(t("pos.invalidCouponAlert"));
    return;
  }

  const check = isPromotionUsableToday(matchedPromotion);

  if (!check.ok) {
    showToast(
      t(check.messageKey, {
        defaultValue: check.defaultValue,
      })
    );
    return;
  }

  setDiscountType("percent");
  setDiscount(matchedPromotion.discountPercent);
  setVoucherCode(code);

  showToast(
    t("pos.couponAppliedAlert", {
      code,
      percent: matchedPromotion.discountPercent,
      defaultValue: `Đã áp dụng mã ${code}, giảm ${matchedPromotion.discountPercent}%.`,
    })
  );
};
  const saveDraftOrder = useCallback(() => {
    if (cart.length === 0) { showToast(t("pos.noProductsInCartAlert")); return; }
    const draft = {
      id: `DRAFT-${Date.now()}`,
      customerName,
      customerPhone,
      cart,
      discount,
      discountType,
      voucherCode,
      orderNote,
      createdAt: new Date().toISOString(),
    };
    const nextDrafts = [draft, ...draftOrders].slice(0, 5);
    setDraftOrders(nextDrafts);
    localStorage.setItem("staff_pos_drafts", JSON.stringify(nextDrafts));
    showToast(t("pos.savedDraftAlert"));
    clearCart();
  }, [cart, customerName, customerPhone, discount, discountType, voucherCode, orderNote, draftOrders, clearCart, t]);

  const loadDraftOrder = (draft) => {
    setCustomerName(draft.customerName || RETAIL_CUSTOMER);
    setCustomerPhone(draft.customerPhone || "");
    setCart(draft.cart || []);
    setDiscount(draft.discount || 0);
    setDiscountType(draft.discountType || "amount");
    setVoucherCode(draft.voucherCode || "");
    setOrderNote(draft.orderNote || "");
    showToast(t("pos.loadedDraftAlert"));
  };

  const deleteDraftOrder = (draftId) => {
    const nextDrafts = draftOrders.filter((draft) => draft.id !== draftId);
    setDraftOrders(nextDrafts);
    localStorage.setItem("staff_pos_drafts", JSON.stringify(nextDrafts));
  };
  const addOnePointForCustomer = useCallback(
  async (customerId) => {
    if (!customerId) return;

    try {
      const usersPayload = await apiRequest("/users");
      const userList = toArray(usersPayload);

      const customer = userList.find(
        (user) => String(getCustomerId(user)) === String(customerId)
      );

      if (!customer) {
        console.warn("Không tìm thấy khách hàng để cộng điểm:", customerId);
        return;
      }

      const currentPoints = getCustomerPoint(customer);
      const nextPoints = currentPoints + 1;

      try {
        await apiRequest(`/users/${customerId}`, {
          method: "PATCH",
          body: JSON.stringify({
            points: nextPoints,
            Points: nextPoints,
            loyaltyPoints: nextPoints,
            LoyaltyPoints: nextPoints,
            totalPoints: nextPoints,
            TotalPoints: nextPoints,
          }),
        });
      } catch (patchError) {
        await apiRequest(`/users/${customerId}`, {
          method: "PUT",
          body: JSON.stringify({
            ...customer,
            points: nextPoints,
            Points: nextPoints,
            loyaltyPoints: nextPoints,
            LoyaltyPoints: nextPoints,
            totalPoints: nextPoints,
            TotalPoints: nextPoints,
          }),
        });
      }

      showToast(
        t("pos.loyaltyPointAdded", {
          defaultValue: "Đã cộng 1 điểm tích lũy cho khách hàng.",
        })
      );
    } catch (error) {
      console.error("Lỗi cộng điểm tích lũy:", error);
      showToast(
        t("pos.loyaltyPointAddFailed", {
          defaultValue:
            "Thanh toán thành công nhưng chưa cộng được điểm tích lũy.",
        })
      );
    }
  },
  [t]
);
const findOrCreateCustomerForOrder = useCallback(async () => {
  const phone = customerPhone.trim();
  const name = customerName === RETAIL_CUSTOMER ? "" : customerName.trim();

  if (!phone || phone.length < 8) {
    return {
      customerId: getUserId(),
      customerNameForOrder: t("pos.retailCustomer"),
      customerPhoneForOrder: "",
      pointCustomerId: null,
    };
  }

  const usersPayload = await apiRequest("/users");
  const userList = toArray(usersPayload);

  const found = userList.find((user) => getCustomerPhone(user) === phone);

  if (found) {
    const foundId = getCustomerId(found);

    return {
      customerId: foundId || getUserId(),
      customerNameForOrder:
        getCustomerName(found) || name || t("pos.retailCustomer"),
      customerPhoneForOrder: phone,
      pointCustomerId: foundId || null,
    };
  }

  if (!name) {
    return {
      customerId: getUserId(),
      customerNameForOrder: t("pos.retailCustomer"),
      customerPhoneForOrder: phone,
      pointCustomerId: null,
    };
  }

  const newCustomerPayload = {
    fullName: name,
    phoneNumber: phone,
    email: `${phone}@khachhang.local`,
    password: "Password123!",
    roleId: 1,
    isActive: true,
    points: 0,
    loyaltyPoints: 0,
    totalPoints: 0,
  };

  const created = await apiRequest("/users", {
    method: "POST",
    body: JSON.stringify(newCustomerPayload),
  });

  const createdId = getCustomerId(created);

  showToast(t("pos.savedNewCustomerAlert"));

  return {
    customerId: createdId || getUserId(),
    customerNameForOrder: name,
    customerPhoneForOrder: phone,
    pointCustomerId: createdId || null,
  };
}, [customerPhone, customerName, t]);
  // ── Checkout Logic ─────────────────────────
  const completeCheckoutProcess = async ( orderId, amount, cName, note, methodValue, pointCustomerId ) => {
    setProcessing(true);
    try {
      const updatePayload = {
        orderStatus: "Đã giao hàng",
        shippingStatus: "Thành công",
        paymentStatus: "Đã thanh toán",
        issue: note || "Không có"
      };
      await apiRequest(`/orders/${orderId}/staff-update`, { method: "PUT", body: JSON.stringify(updatePayload) });
      const paymentPayload = {
        orderId: orderId,
        amount: amount,
        paymentMethod: paymentMethods.find(m => m.value === methodValue)?.label || "Tiền mặt"
      };
      await apiRequest("/payments", {
        method: "POST",
        body: JSON.stringify(paymentPayload),
      });
      if (pointCustomerId) { await addOnePointForCustomer(pointCustomerId); }
      setSuccessOrder({
        orderCode: `DH${String(orderId).padStart(3, "0")}`,
        staffName: getStaffName(),
        customerName: cName,
        total: amount,
        paymentMethod: paymentMethods.find(m => m.value === methodValue)?.label,
        change: methodValue === "cash" ? change : 0,
        cart: [...cart],
        subtotal: subtotal,
        discountValue: discountValue,
        customerPaidNumber: methodValue === "cash" ? customerPaidNumber : amount,
        createdAt: new Date().toISOString()
      });
      clearCart();
      fetchProducts();
      setPendingQR(null);
    } catch (err) {
      showToast(t("pos.checkoutErrorAlert", { defaultValue: "Lỗi hoàn tất thanh toán: {{message}}", message: err.message }));
    } finally {
      setProcessing(false);
    }
  };
  const handlePayment = useCallback(async () => {
  if (cart.length === 0) {
    showToast(t("pos.noProductsInCartAlert"));
    return;
  }

  if (paymentMethod === "cash" && customerPaidNumber < total) {
    showToast(t("pos.notEnoughPaidAlert"));
    return;
  }

  setProcessing(true);

  try {
    const items = cart.map((item) => {
      const dto = { quantity: item.quantity };

      if (item.type === "book") dto.bookId = item.rawId;
      else if (item.type === "toy") dto.toyId = item.rawId;
      else if (item.type === "stationery") dto.stationeryId = item.rawId;
      else if (item.type === "schoolSupply") dto.schoolSupplyId = item.rawId;
      else if (item.type === "accessory") dto.accessoryId = item.rawId;
      else if (item.type === "souvenir") dto.souvenirId = item.rawId;

      return dto;
    });

    const {
      customerId,
      customerNameForOrder,
      customerPhoneForOrder,
      pointCustomerId,
    } = await findOrCreateCustomerForOrder();

    const orderPayload = {
      userId: customerId,
      orderType: "Offline",
      items,
      customerName: customerNameForOrder,
      phone: customerPhoneForOrder,
    };

    const orderRes = await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(orderPayload),
    });

    const orderId = orderRes.id || orderRes.Id;

    if (paymentMethod === "bank") {
      setProcessing(false);
      setPendingQR({
        orderId,
        total,
        customerName: customerNameForOrder,
        orderNote,
        pointCustomerId,
      });
      return;
    }

    await completeCheckoutProcess(
      orderId,
      total,
      customerNameForOrder,
      orderNote,
      paymentMethod,
      pointCustomerId
    );
  } catch (err) {
    showToast(
      t("pos.paymentErrorAlert", {
        defaultValue: "Lỗi thanh toán: {{message}}",
        message: err.message,
      })
    );
    setProcessing(false);
  }
}, [
  cart,
  paymentMethod,
  customerPaidNumber,
  total,
  orderNote,
  t,
  findOrCreateCustomerForOrder,
]);

  useEffect(() => {
    const handleShortcuts = (event) => {
      if (event.key === "F2") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "F3") {
        event.preventDefault();
        setIsScannerOpen((prev) => !prev);
      }
      if (event.key === "F5") {
        event.preventDefault();
        handlePayment();
      }
      if (event.key === "F6") {
        event.preventDefault();
        saveDraftOrder();
      }
      if (event.key === "Escape") {
        if (isScannerOpen) {
          event.preventDefault();
          setIsScannerOpen(false);
        } else if (!successOrder && !pendingQR) {
          event.preventDefault();
          clearCart();
        }
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [isScannerOpen, successOrder, pendingQR, clearCart, handlePayment, saveDraftOrder]);

  // Tự động tìm kiếm và hiển thị tên khách hàng thành viên khi nhập số điện thoại (quay lại lần 2, 3...)
  useEffect(() => {
    const phone = customerPhone.trim();
    if (!phone) {
      setCustomerName(RETAIL_CUSTOMER);
      return;
    }
    if (phone.length >= 8) {
      const lookupCustomer = async () => {
        try {
          const users = await apiRequest("/users");
          const userList = toArray(users);
          const found = userList.find(u => {
            const uPhone = String(u.phoneNumber || u.PhoneNumber || u.phone || "").trim();
            return uPhone === phone;
          });
          if (found) {
            const name = found.fullName || found.name || found.Name || "Khách hàng";
            setCustomerName(name);
            showToast(t("pos.foundMemberAlert", { defaultValue: "Đã tìm thấy khách hàng thành viên: {{name}}", name }));
          }
        } catch (err) {
          console.error("Lỗi khi tự động tìm khách hàng:", err);
        }
      };
      
      const timer = setTimeout(lookupCustomer, 350); // debounce 350ms
      return () => clearTimeout(timer);
    }
  }, [customerPhone, t]);

  // Global Hardware Barcode Scanner Listener
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyPress = (e) => {
      // Ignore keypresses if focus is in a normal text input or textarea
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.contentEditable === "true") &&
        activeEl.id !== "staff-pos-search" && // let it scan when focused on main POS search
        activeEl.id !== "staff-scanner-search-input" // let it scan when focused on modal search
      ) {
        return;
      }

      const currentTime = Date.now();
      
      // If time since last key is more than 50ms, it's manual slow typing, reset buffer
      if (currentTime - lastKeyTime > 50) {
        buffer = "";
      }
      lastKeyTime = currentTime;

      if (e.key === "Enter") {
        if (buffer.trim().length >= 4) {
          const barcode = buffer.trim();
          const matchedProduct = products.find(p => p.barcode === barcode || p.barcode.toLowerCase() === barcode.toLowerCase());
          if (matchedProduct) {
            // Success! Add to cart with beep and show popup
            addToCart(matchedProduct);
            playBeep();
            
            // Show global visual popup feedback
            setGlobalScanFeedback(matchedProduct);
            const timer = setTimeout(() => setGlobalScanFeedback(null), 2200);
            
            buffer = "";
            e.preventDefault();
            return () => clearTimeout(timer);
          } else {
            showToast(t("pos.scannedButNotFoundAlert", { defaultValue: "Quét mã [{{barcode}}] thành công nhưng không tìm thấy sản phẩm.", barcode }));
          }
        }
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [products, addToCart, playBeep, t]);

  // Helper for Payment Method Translation — uses the canonical labelKey from PAYMENT_METHODS
  const getPaymentMethodTranslation = (methodLabel) => {
    const original = PAYMENT_METHODS.find(m => m.backendLabel === methodLabel);
    if (original) return t(original.labelKey);
    return methodLabel;
  };

  return (
    <div className="staff-pos staff-pos-pro">
      {toastMessage && <div className="staff-pos-toast">{toastMessage}</div>}
      <div className="staff-pos__left">
        <div className="staff-card staff-pos-search-card">
          <div className="staff-pos__toolbar">
            <div className="staff-pos-search">
              <input
                id="staff-pos-search"
                ref={searchInputRef}
                className="staff-input"
                placeholder={t("pos.searchPlaceholder")}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
            <button className="staff-btn staff-btn--primary staff-pos-scan-btn" onClick={handleBarcodeScan}>
              {t("pos.scanBarcode")}
            </button>
            <button className="staff-btn staff-btn--outline" onClick={fetchProducts} disabled={loading}>
              {loading ? t("pos.loading") : t("common.refresh")}
            </button>
          </div>
          <div className="staff-pos-category-list">
            {categories.map((cat) => (
              <button
                key={cat}
                className={selectedCategory === cat ? "staff-pos-category staff-pos-category--active" : "staff-pos-category"}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === "all" ? t("pos.all") : t("pos.categories." + getProductTypeKey(cat))}
              </button>
            ))}
          </div>
          <div
            className="staff-product-list staff-product-list--pro"
            style={{
              display: "grid",
              gridTemplateRows: "repeat(3, auto)",
              gridTemplateColumns: "none",
              gridAutoFlow: "column",
              gridAutoColumns: "250px",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "12px",
            }}
          >
            {loading ? (
              <div className="staff-empty" style={{ gridColumn: "1 / -1", height: 100 }}>{t("pos.loadingFromDb")}</div>
            ) : filteredProducts.length === 0 ? (
              <div className="staff-empty" style={{ gridColumn: "1 / -1", height: 100 }}>{t("pos.noProductsFound")}</div>
            ) : (
              filteredProducts.map((p) => (
                <button
                  key={p.id}
                  className={p.stock <= 0 ? "staff-product-item staff-product-item--disabled" : "staff-product-item"}
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                  style={{ padding: "10px 12px", gap: "8px", alignItems: "center", width: "100%", boxSizing: "border-box", minWidth: "250px", height: "100%", margin: 0 }}
                >
                  <div className="staff-product-item__main" style={{ gap: "10px", flex: "1 1 auto", overflow: "hidden", minWidth: 0 }}>
                    <div className="staff-product-item__cover" style={{ width: "38px", height: "48px", flexShrink: 0 }}>
                      {p.imageUrl ? <img src={getImageUrl(p.imageUrl, p.name)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} /> : <span style={{ fontSize: "14px" }}>{p.name.charAt(0)}</span>}
                    </div>
                    <div style={{ overflow: "hidden", textAlign: "left", flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: "13px", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#0f172a" }}>{p.name}</strong>
                      <p style={{ fontSize: "11px", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#64748b" }}>{p.authorOrBrand}</p>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>{t("pos.categories." + getProductTypeKey(p.type))}</span>
                    </div>
                  </div>
                  <div className="staff-product-item__meta" style={{ flexShrink: 0, minWidth: "70px", alignItems: "flex-end", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <strong style={{ fontSize: "13px", color: "#2563eb", whiteSpace: "nowrap" }}>{money(p.price)}</strong>
                    <span className={p.stock <= 3 ? "staff-stock staff-stock--low" : "staff-stock"} style={{ fontSize: "10px", padding: "3px 6px" }}>
                      {p.stock > 0 ? `${t("common.stock")}: ${p.stock}` : t("pos.outOfStock")}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="staff-card staff-cart-card">
          <div className="staff-card__header">
            <div>
              <h2>{t("pos.orderProducts")}</h2>
              <p className="staff-card-subtitle">
                {cart.length > 0 ? `${cart.length} ${t("pos.itemsLines")}, ${totalItems} ${t("pos.itemsCount")}` : t("pos.cartEmptyTitle")}
              </p>
            </div>
            <button className="staff-btn staff-btn--danger-light" onClick={clearCart} disabled={cart.length === 0}>
              {t("common.deleteAll")}
            </button>
          </div>
          {cart.length === 0 ? (
            <div className="staff-cart-empty">
              <div></div>
              <strong>{t("pos.cartEmptyTitle")}</strong>
              <p>{t("pos.cartEmptyDesc")}</p>
            </div>
          ) : (
            <div className="staff-cart-list">
              {cart.map((item) => (
                <div className="staff-cart-item" key={item.id}>
                  <div className="staff-cart-item__info">
                    <div className="staff-cart-item__cover">
                      {item.imageUrl ? <img src={getImageUrl(item.imageUrl, item.name)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : item.name.charAt(0)}
                    </div>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{t("pos.categories." + getProductTypeKey(item.type))}</p>
                      <span>{t("pos.codeLabel")} {item.rawId}</span>
                    </div>
                  </div>
                  <div className="staff-cart-item__price">{money(item.price)}</div>
                  <div className="staff-qty staff-qty--pro">
                    <button onClick={() => updateQuantity(item.id, "decrease")}>-</button>
                    <input value={item.quantity} onChange={(e) => changeQuantityByInput(item.id, e.target.value)} />
                    <button onClick={() => updateQuantity(item.id, "increase")}>+</button>
                  </div>
                  <div className="staff-cart-item__total">{money(item.price * item.quantity)}</div>
                  <button className="staff-icon-btn" onClick={() => removeItem(item.id)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="staff-pos__right">
        <div className="staff-card staff-payment staff-payment--pro">
          <div className="staff-payment__title">
            <div>
              <h2>{t("pos.paymentTitle")}</h2>
            </div>
            <span className="staff-payment__badge">{cart.length > 0 ? t("pos.selling") : t("pos.noOrder")}</span>
          </div>
          <div className="staff-customer-box">
            <div className="staff-form-group">
              <label>{t("pos.customerPhone")}</label>
              <input className="staff-input" placeholder={t("pos.phonePlaceholder")} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div className="staff-form-group">
              <label>{t("pos.customerName")}</label>
              <input 
                className="staff-input" 
                placeholder={t("pos.namePlaceholder")} 
                value={customerName === RETAIL_CUSTOMER ? t("pos.retailCustomer") : customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
              />
            </div>
          </div>
          <div className="staff-voucher-row">
            <input className="staff-input" placeholder={t("pos.couponPlaceholder")} value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} />
            <button className="staff-btn staff-btn--outline" onClick={applyVoucher}>{t("common.apply")}</button>
          </div>
          <div className="staff-payment__summary">
            <div><span>{t("pos.subtotal")}</span><strong>{money(subtotal)}</strong></div>
            <div>
              <span>{t("pos.discountType")}</span>
              <select className="staff-input staff-input--small" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                <option value="amount">{t("pos.discountAmount")}</option>
                <option value="percent">{t("pos.discountPercent")}</option>
              </select>
            </div>
            <div>
              <span>{t("pos.discountValue")}</span>
              <input className="staff-input staff-input--small" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div><span>{t("pos.discounted")}</span><strong>{money(discountValue)}</strong></div>
            <div className="staff-payment__total"><span>{t("pos.totalPayment")}</span><strong>{money(total)}</strong></div>
          </div>
          <div className="staff-form-group">
            <label>{t("pos.paymentMethod")}</label>
            <div className="staff-payment-methods staff-payment-methods--pro" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {paymentMethods.map((m) => (
                <button
                  key={m.value}
                  className={`staff-payment-method ${paymentMethod === m.value ? "staff-payment-method--active" : ""}`}
                  style={{ padding: "10px 12px", fontSize: "13px", height: "auto", minHeight: "40px", borderRadius: "8px", border: paymentMethod === m.value ? "1.5px solid #2563eb" : "1px solid #e2e8f0", backgroundColor: paymentMethod === m.value ? "#eff6ff" : "#ffffff", color: paymentMethod === m.value ? "#1d4ed8" : "#475569", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  onClick={() => setPaymentMethod(m.value)}
                >
                  <span>{m.icon}</span>{t(PAYMENT_METHODS.find(pm => pm.value === m.value)?.labelKey || ("pos." + m.value))}
                </button>
              ))}
            </div>
          </div>
          {paymentMethod === "cash" && (
            <>
              <div className="staff-form-group">
                <label>{t("pos.customerPaid")}</label>
                <input
                  className="staff-input"
                  type="number"
                  placeholder={t("pos.customerPaidPlaceholder")}
                  value={customerPaid}
                  onChange={(e) => setCustomerPaid(e.target.value)}
                />
              </div>
              <div className="staff-quick-cash" style={{ marginTop: "12px", marginBottom: "20px" }}>
                {[100000, 200000, 500000, 1000000].map((amt) => (
                  <button key={amt} onClick={() => setCustomerPaid(String(amt))}>{money(amt)}</button>
                ))}
              </div>
              <div className="staff-payment__change">
                <span>{t("pos.change")}</span><strong>{money(change)}</strong>
              </div>
            </>
          )}
          <div className="staff-form-group">
            <label>{t("pos.notes")}</label>
            <textarea className="staff-textarea staff-order-note" placeholder={t("pos.notesPlaceholder")} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} />
          </div>

          <button className="staff-btn staff-btn--primary staff-btn--full staff-payment-main-btn" onClick={handlePayment} disabled={processing}>
            {processing ? t("pos.processing") : t("common.payment")}
          </button>
          <button className="staff-btn staff-btn--outline staff-btn--full" onClick={saveDraftOrder}>{t("pos.saveDraft", "Lưu đơn tạm")}</button>
        </div>
        <div className="staff-card staff-draft-card">
          <div className="staff-card__header">
            <h2>{t("pos.draftOrders")}</h2>
            <span>{draftOrders.length}/5</span>
          </div>
          {draftOrders.length === 0 ? (
            <p className="staff-draft-empty">{t("pos.noDraftOrders")}</p>
          ) : (
            <div className="staff-draft-list">
              {draftOrders.map((draft) => (
                <div className="staff-draft-item" key={draft.id}>
                  <div>
                    <strong>{draft.customerName === RETAIL_CUSTOMER ? t("pos.retailCustomer") : draft.customerName}</strong>
                    <p>{draft.cart?.length || 0} {t("pos.itemsCount")}</p>
                  </div>
                  <div className="staff-draft-actions">
                    <button onClick={() => loadDraftOrder(draft)}>{t("pos.open")}</button>
                    <button onClick={() => deleteDraftOrder(draft.id)}>{t("pos.delete")}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {pendingQR && (
        <div className="staff-invoice-modal" style={{ background: "rgba(15, 23, 42, 0.75)" }}>
          <div className="staff-invoice" style={{ textAlign: "center", maxWidth: "420px", padding: "32px" }}>
            <div className="staff-invoice__header" style={{ borderBottom: "none", paddingBottom: 0, justifyContent: "center" }}>
              <div style={{ width: "100%" }}>
                <h2 style={{ color: "#2563eb", marginBottom: "8px", fontSize: "24px", fontWeight: "900" }}>{t("pos.scanToPay")}</h2>
              </div>
            </div>
            <div style={{ padding: "24px 0" }}>
              <div style={{ background: "#fff", padding: "16px", borderRadius: "20px", display: "inline-block", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
                <img
                  src={`https://img.vietqr.io/image/970422-0333241234-compact2.png?amount=${pendingQR.total}&addInfo=Thanh toan DH${pendingQR.orderId}&accountName=BOOKSTORE`}
                  alt="QR Code"
                  style={{ width: "220px", height: "220px", borderRadius: "12px" }}
                />
              </div>
              <p style={{ marginTop: "24px", fontSize: "28px", fontWeight: "900", color: "#0f172a" }}>{money(pendingQR.total)}</p>
            </div>
            <div className="staff-invoice__actions" style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "none", paddingTop: 0 }}>
              <button
                className="staff-btn staff-btn--primary"
                onClick={() =>
  completeCheckoutProcess(
    pendingQR.orderId,
    pendingQR.total,
    pendingQR.customerName,
    pendingQR.orderNote,
    "bank",
    pendingQR.pointCustomerId)}
                disabled={processing}
                style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "16px" }}
              >
                {processing ? t("pos.processing") : t("pos.confirmReceived")}
              </button>
              <button
                className="staff-btn staff-btn--outline"
                onClick={() => setPendingQR(null)}
                disabled={processing}
                style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "16px", border: "none", background: "#f1f5f9", color: "#64748b" }}
              >
                {t("pos.close")}
              </button>
            </div>
          </div>
        </div>
      )}
      {successOrder && (
        <div className="staff-invoice-modal" style={{ background: "rgba(15, 23, 42, 0.85)", overflowY: "auto", padding: "40px 20px" }}>
          <div className="staff-invoice" style={{ maxWidth: "420px", margin: "0 auto", padding: 0, borderRadius: "12px", overflow: "hidden", background: "#f8fafc", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>            
            {/* The Printable Receipt */}
            <div id="print-receipt" style={{ background: "#ffffff", padding: "30px 24px", color: "#000", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <div style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "16px", marginBottom: "16px" }}>
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "900", letterSpacing: "1px" }}>BOOKSTORE</h2>
                <p style={{ margin: "6px 0 0", fontSize: "13px" }}>{t("pos.address")}</p>
                <p style={{ margin: "2px 0 0", fontSize: "13px" }}>Hotline: 1900 6868</p>
                <h3 style={{ margin: "20px 0 0", fontSize: "18px", fontWeight: "bold" }}>{t("pos.salesInvoice")}</h3>
              </div>
              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{t("pos.staffNameLabel")}</span> <strong>{successOrder.staffName === DEFAULT_STAFF ? t("pos.staff") : successOrder.staffName}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{t("pos.invoiceIdLabel")}</span>  <strong>{successOrder.orderCode}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{t("pos.invoiceDateLabel")}</span> <strong>{`${new Date(successOrder.createdAt).toLocaleTimeString(dateLocale)} | ${new Date(successOrder.createdAt).toLocaleDateString(dateLocale)}`}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{t("pos.customerNameLabel")}</span> <strong>{successOrder.customerName === RETAIL_CUSTOMER ? t("pos.retailCustomer") : successOrder.customerName}</strong></div>
              </div>
              <div style={{ borderTop: "1px dashed #cbd5e1", borderBottom: "1px dashed #cbd5e1", padding: "12px 0", marginBottom: "16px" }}>
                <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", paddingBottom: "8px", fontWeight: "bold" }}>{t("pos.productNameCol")}</th>
                      <th style={{ textAlign: "center", paddingBottom: "8px", fontWeight: "bold" }}>{t("pos.qtyCol")}</th>
                      <th style={{ textAlign: "right", paddingBottom: "8px", fontWeight: "bold" }}>{t("pos.totalCol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {successOrder.cart.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ paddingBottom: "8px", paddingRight: "8px" }}>
                          <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{item.name}</div>
                          <div style={{ fontSize: "11px", color: "#475569" }}>{money(item.price)}</div>
                        </td>
                        <td style={{ textAlign: "center", paddingBottom: "8px", verticalAlign: "top" }}>{item.quantity}</td>
                        <td style={{ textAlign: "right", paddingBottom: "8px", fontWeight: 600, verticalAlign: "top" }}>{money(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px", borderBottom: "1px dashed #cbd5e1", paddingBottom: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{t("pos.subtotalLabel")}</span> <strong>{money(successOrder.subtotal)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{t("pos.discountValue")}:</span> <strong>-{money(successOrder.discountValue)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", marginTop: "4px" }}>
                  <strong>{t("pos.totalPaymentLabel")}</strong> 
                  <strong style={{ color: "#000" }}>{money(successOrder.total)}</strong>
                </div>
              </div>
              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{t("pos.methodLabel")}</span> <strong>{getPaymentMethodTranslation(successOrder.paymentMethod)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{t("pos.customerPaidLabel")}</span> <strong>{money(successOrder.customerPaidNumber)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{t("pos.changeLabel")}</span> <strong>{money(successOrder.change)}</strong></div>
              </div>
              <div style={{ textAlign: "center", fontSize: "13px", fontStyle: "italic", color: "#1e293b" }}>
                {t("pos.thankYou")}
              </div>
            </div>
            {/* Actions */}
            <div className="staff-invoice__actions" style={{ padding: "24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
              <p style={{ fontWeight: 600, color: "#475569", textAlign: "center", margin: "0 0 16px", fontSize: "15px" }}>
                {t("pos.printAsk")}
              </p>
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <button className="staff-btn staff-btn--outline" style={{ flex: 1, padding: "14px", background: "#fff" }} onClick={() => window.print()}>
                  {t("pos.printYes")}
                </button>
                <button className="staff-btn staff-btn--primary" style={{ flex: 1, padding: "14px" }} onClick={() => setSuccessOrder(null)}>
                  {t("pos.printNo")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Hardware Scan Floating Notification */}
      {globalScanFeedback && (
        <div className="global-barcode-toast">
          <div className="global-barcode-toast__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <div className="global-barcode-toast__body">
            <div className="global-barcode-toast__title">{t("pos.barcodeScanned")}</div>
            <h4 className="global-barcode-toast__name">{globalScanFeedback.name}</h4>
            <div className="global-barcode-toast__meta">
              <span>{t("pos.codeLabel")} {globalScanFeedback.barcode}</span>
              <strong>{money(globalScanFeedback.price)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen High-Tech Barcode Scanner Modal */}
      {isScannerOpen && (
        <div className="staff-scanner-modal" onClick={() => setIsScannerOpen(false)}>
          <div className="staff-scanner-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="staff-scanner-header">
              <div className="staff-scanner-header__title">
                <h2>{t("pos.scanProductBarcode")}</h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button className="staff-scanner-header__close" onClick={() => setIsScannerOpen(false)}>×</button>
              </div>
            </div>

            {/* Tab menu */}
            <div className="staff-scanner-tabs">
              <button 
                className={`staff-scanner-tab ${scannerMode === "camera" ? "staff-scanner-tab--active" : ""}`}
                onClick={() => setScannerMode("camera")}
              >
                {t("pos.scanViaCamera")}
              </button>
              <button 
                className={`staff-scanner-tab ${scannerMode === "manual" ? "staff-scanner-tab--active" : ""}`}
                onClick={() => setScannerMode("manual")}
              >
                {t("pos.enterManually")}
              </button>
            </div>

            {/* Body */}
            <div className="staff-scanner-body">
              
              {/* Left Column: Viewfinder */}
              <div className="staff-scanner-viewport-col">
                {scannerMode === "camera" && (
                  <>
                    <div className="staff-scanner-camera-controls">
                      <span>{t("pos.selectCamera")}</span>
                      {cameras.length > 0 ? (
                        <select 
                          className="staff-scanner-camera-select"
                          value={selectedCameraId}
                          onChange={(e) => setSelectedCameraId(e.target.value)}
                        >
                          {cameras.map(c => (
                            <option key={c.deviceId} value={c.deviceId}>
                              {c.label || `Camera ${cameras.indexOf(c) + 1}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>{t("pos.noCameraFound")}</span>
                      )}
                    </div>

                    <div className="staff-scanner-viewfinder">
                      <div className={`staff-scanner-flash ${flashActive ? "flash-active" : ""}`}></div>
                      
                      {!cameraError ? (
                        <>
                          <video 
                            ref={videoRef}
                            className="staff-scanner-video"
                            playsInline
                            muted
                          ></video>
                          
                          {/* Pulsating green laser line & frames */}
                          <div className="staff-scanner-overlay">
                            <div className="staff-scanner-target">
                              <div className="staff-scanner-target-corners"></div>
                              <div className="staff-scanner-laser"></div>
                            </div>
                          </div>
                          
                          <div className="staff-scanner-guide">
                            {t("pos.alignBarcode")}
                          </div>
                        </>
                      ) : (
                        /* Beautiful interactive simulator inside the viewfinder */
                        <div className="staff-scanner-sim-box">
                          <div className="staff-scanner-sim-header">
                            <h3>{t("pos.scannerSimTitle")}</h3>
                            <p>{t("pos.scannerSimDesc")}</p>
                          </div>
                          
                          <div className="staff-scanner-sim-list">
                            {products.slice(0, 16).map(p => (
                              <button 
                                key={p.id}
                                className="staff-scanner-sim-item"
                                onClick={() => handleProductScanned(p)}
                              >
                                {p.imageUrl ? (
                                  <img src={getImageUrl(p.imageUrl, p.name)} alt={p.name} />
                                ) : (
                                  <div className="staff-scanner-sim-item__placeholder">
                                    {p.name.charAt(0)}
                                  </div>
                                )}
                                <div className="staff-scanner-sim-item__info">
                                  <h4 className="staff-scanner-sim-item__name">{p.name}</h4>
                                  <div className="staff-scanner-sim-item__code">{p.barcode}</div>
                                  <span className={`staff-scanner-sim-item__stock ${p.stock > 0 ? "staff-scanner-sim-item__stock--ok" : ""}`}>
                                    {p.stock > 0 ? `${t("common.stock")}: ${p.stock}` : t("pos.outOfStock")}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {scannerMode === "manual" && (
                  <div className="staff-scanner-viewfinder" style={{ background: "#020617", flexDirection: "column", padding: "30px", textAlign: "center" }}>
                    <div style={{ fontSize: "52px", marginBottom: "16px" }}>⌨️</div>
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#38bdf8", margin: "0 0 8px 0" }}>{t("pos.manualScannerTitle")}</h3>
                    <p style={{ fontSize: "13px", color: "#94a3b8", maxWidth: "300px", margin: "0 auto 24px auto", lineHeight: "1.4" }}>
                      {t("pos.manualScannerDesc")}
                    </p>
                    <div style={{ padding: "8px 16px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.2)", color: "#38bdf8", fontSize: "12px", display: "inline-block" }}>
                      {t("pos.manualScannerTip")}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Scan Workspace */}
              <div className="staff-scanner-workspace-col">
                
                {/* Search suggestion input */}
                <div className="staff-scanner-manual-section">
                  <label htmlFor="staff-scanner-search-input">{t("pos.quickSearchLabel")}</label>
                  <div className="staff-scanner-manual-input-box">
                    <input
                      id="staff-scanner-search-input"
                      className="staff-input staff-scanner-manual-input"
                      placeholder={t("pos.quickSearchPlaceholder")}
                      value={scannerKeyword}
                      onChange={(e) => setScannerKeyword(e.target.value)}
                      onKeyDown={handleManualInputSubmit}
                      autoFocus
                    />
                  </div>

                  {/* Dynamic suggestions overlay */}
                  {filteredManualProducts.length > 0 && (
                    <div className="staff-scanner-suggestions">
                      {filteredManualProducts.map(p => (
                        <div 
                          key={p.id}
                          className="staff-scanner-suggestion-item"
                          onClick={() => {
                            handleProductScanned(p);
                            setScannerKeyword("");
                          }}
                        >
                          {p.imageUrl ? (
                            <img src={getImageUrl(p.imageUrl, p.name)} alt={p.name} />
                          ) : (
                            <div style={{ width: "28px", height: "36px", background: "#cbd5e1", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700" }}>{p.name.charAt(0)}</div>
                          )}
                          <div className="staff-scanner-suggestion-item__info">
                            <h4 className="staff-scanner-suggestion-item__name">{p.name}</h4>
                            <div className="staff-scanner-suggestion-item__meta">
                              <span>{t("pos.codeLabel")} {p.barcode}</span>
                              <span>{t("common.stock")}: {p.stock}</span>
                              <strong className="staff-scanner-suggestion-item__price">{formatCurrency(p.price)}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scan list session history feed */}
                <div className="staff-scanner-logs-section">
                  <h3>
                    {t("pos.recentlyScanned")} 
                    <span>{scannerLogs.length} {t("pos.scannedTimes")}</span>
                  </h3>
                  
                  {scannerLogs.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", gap: "10px" }}>
                      <span style={{ fontSize: "36px" }}>🏷️</span>
                      <p style={{ fontSize: "13px", margin: 0 }}>{t("pos.noRecentScans")}</p>
                    </div>
                  ) : (
                    <div className="staff-scanner-logs-list">
                      {scannerLogs.map(log => (
                        <div key={log.id} className="staff-scanner-log-item">
                          {log.imageUrl ? (
                            <img src={getImageUrl(log.imageUrl, log.name)} alt={log.name} />
                          ) : (
                            <div style={{ width: "32px", height: "40px", background: "#e2e8f0", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", color: "#64748b" }}>{log.name.charAt(0)}</div>
                          )}
                          <div className="staff-scanner-log-item__info">
                            <h4 className="staff-scanner-log-item__name">{log.name}</h4>
                            <div className="staff-scanner-log-item__meta">
                              <span>{t("pos.codeLabel")} {log.barcode}</span>
                              <span style={{ color: "#64748b" }}>{log.timestamp}</span>
                            </div>
                          </div>
                          <div className="staff-scanner-log-item__qty">+1</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="staff-scanner-footer">
              <div className="staff-scanner-footer-summary">
                <div>
                  {t("pos.scannedProductsCount")} <strong>{Array.from(new Set(scannerLogs.map(l => l.barcode))).length}</strong>
                </div>
                <div>
                  {t("pos.totalOrderPrice")} <strong className="total-price">{money(total)}</strong>
                </div>
              </div>
              <button 
                className="staff-btn staff-btn--primary staff-scanner-footer-btn"
                onClick={() => setIsScannerOpen(false)}
              >
                {t("pos.doneAndClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}