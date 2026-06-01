import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/staff/StaffShifts.css";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { Toast } from "../../components/ui/Toast";
import "../../styles/staff/ui-kit.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api"
).replace(/\/$/, "");

const TAB_KEYS = {
  CURRENT: "current",
  HISTORY: "history",
};

const TRANSACTION_TYPES = {
  INCOME: "Thu",
  EXPENSE: "Chi",
};

const CANCELLED_STATUS = "Bị hủy";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

function getUserId() {
  try {
    const raw =
      localStorage.getItem("user") ||
      localStorage.getItem("userData") ||
      localStorage.getItem("currentUser") ||
      "{}";

    const user = JSON.parse(raw);

    return user.id || user.Id || user.userId || user.UserId || null;
  } catch {
    return null;
  }
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.$values)) return value.$values;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.result)) return value.result;
  return [];
}

function formatCurrency(value, language = "vi") {
  const locale = language?.startsWith("vi") ? "vi-VN" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value, locale = "vi-VN", fallback = "—") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(locale);
}

function getOrderDate(order) {
  return order.orderDate || order.OrderDate || order.createdAt || order.CreatedAt;
}

function getOrderStatus(order) {
  return order.status || order.Status || "";
}

function getOrderPaymentMethod(order) {
  return order.paymentMethod || order.PaymentMethod || "";
}

function getOrderTotal(order) {
  return Number(
    order.totalAmount ||
      order.TotalAmount ||
      order.total ||
      order.Total ||
      order.grandTotal ||
      order.GrandTotal ||
      0
  );
}

function getShiftId(shift) {
  return shift?.id || shift?.Id;
}

function getShiftStaffName(shift, fallback) {
  return shift?.staffName || shift?.StaffName || fallback;
}

function getShiftOpeningCash(shift) {
  return Number(shift?.openingCash || shift?.OpeningCash || 0);
}

function getShiftOpenedAt(shift) {
  return shift?.openedAt || shift?.OpenedAt;
}

function getShiftClosedAt(shift) {
  return shift?.closedAt || shift?.ClosedAt;
}

function getTransactionId(transaction) {
  return transaction.id || transaction.Id;
}

function getTransactionType(transaction) {
  return transaction.type || transaction.Type || "";
}

function getTransactionReason(transaction) {
  return transaction.reason || transaction.Reason || "";
}

function getTransactionAmount(transaction) {
  return Number(transaction.amount || transaction.Amount || 0);
}

function getTransactionCreatedAt(transaction) {
  return transaction.createdAt || transaction.CreatedAt || transaction.date || transaction.Date;
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
    throw new Error(text || `API error ${response.status}`);
  }

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fetchTodayRevenue() {
  try {
    const orders = toArray(await apiRequest("/orders"));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((order) => {
      const orderDate = new Date(getOrderDate(order) || 0);
      return orderDate >= today && getOrderStatus(order) !== CANCELLED_STATUS;
    });

    const cash = todayOrders
      .filter((order) => {
        const paymentMethod = getOrderPaymentMethod(order).toLowerCase();
        return (
          paymentMethod === "cash" ||
          paymentMethod === "tiền mặt" ||
          paymentMethod === "tien mat" ||
          paymentMethod === ""
        );
      })
      .reduce((sum, order) => sum + getOrderTotal(order), 0);

    const bank = todayOrders
      .filter((order) => {
        const paymentMethod = getOrderPaymentMethod(order).toLowerCase();
        return (
          paymentMethod !== "" &&
          paymentMethod !== "cash" &&
          paymentMethod !== "tiền mặt" &&
          paymentMethod !== "tien mat"
        );
      })
      .reduce((sum, order) => sum + getOrderTotal(order), 0);

    return {
      cash,
      bank,
      totalOrders: todayOrders.length,
      totalRevenue: cash + bank,
    };
  } catch {
    return {
      cash: 0,
      bank: 0,
      totalOrders: 0,
      totalRevenue: 0,
    };
  }
}

export default function StaffShift() {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language?.startsWith("en") ? "en" : "vi";
  const dateLocale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";

  const money = useCallback(
    (value) => formatCurrency(value, currentLanguage),
    [currentLanguage]
  );

  const staffId = useMemo(() => getUserId(), []);

  const [shift, setShift] = useState(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [errorShift, setErrorShift] = useState("");

  const [revenue, setRevenue] = useState({
    cash: 0,
    bank: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [openingCash, setOpeningCash] = useState(1000000);
  const [openingShift, setOpeningShift] = useState(false);

  const [txForm, setTxForm] = useState({
    type: TRANSACTION_TYPES.EXPENSE,
    reason: "",
    amount: "",
  });

  const [savingTx, setSavingTx] = useState(false);
  const [deletingTx, setDeletingTx] = useState(null);
  const [closingShift, setClosingShift] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState(null);

  const [historyShifts, setHistoryShifts] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_KEYS.CURRENT);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimer.current);

    setToast({ message, type });

    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  useEffect(() => {
    return () => clearTimeout(toastTimer.current);
  }, []);

  const loadCurrentShift = useCallback(async () => {
    setLoadingShift(true);
    setErrorShift("");

    try {
      const url = staffId ? `/shifts/open?staffId=${staffId}` : "/shifts/open";
      const data = await apiRequest(url);

      setShift(data);
    } catch (err) {
      if (
        err.message?.includes("404") ||
        err.message?.toLowerCase().includes("không có") ||
        err.message?.toLowerCase().includes("not found")
      ) {
        setShift(null);
      } else {
        setErrorShift(t("shift.alerts.loadShiftError", { message: err.message }));
      }
    } finally {
      setLoadingShift(false);
    }
  }, [staffId, t]);

  const loadRevenue = useCallback(async () => {
    setLoadingRevenue(true);

    try {
      const data = await fetchTodayRevenue();
      setRevenue(data);
    } finally {
      setLoadingRevenue(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);

    try {
      const url = staffId ? `/shifts?staffId=${staffId}` : "/shifts";
      const data = toArray(await apiRequest(url));

      setHistoryShifts(data.filter((item) => !item.isOpen && !item.IsOpen));
    } catch {
      setHistoryShifts([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [staffId]);

  useEffect(() => {
    loadCurrentShift();
    loadRevenue();
  }, [loadCurrentShift, loadRevenue]);

  useEffect(() => {
    if (activeTab === TAB_KEYS.HISTORY) {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const transactions = useMemo(() => {
    return toArray(shift?.transactions || shift?.Transactions);
  }, [shift]);

  const totalIncome = useMemo(() => {
    return transactions
      .filter((transaction) => getTransactionType(transaction) === TRANSACTION_TYPES.INCOME)
      .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((transaction) => getTransactionType(transaction) === TRANSACTION_TYPES.EXPENSE)
      .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);
  }, [transactions]);

  const expectedCash = useMemo(() => {
    if (!shift) return 0;

    return getShiftOpeningCash(shift) + revenue.cash + totalIncome - totalExpense;
  }, [shift, revenue.cash, totalIncome, totalExpense]);

  const openCloseShiftConfirm = () => {
    setConfirmPayload({
      action: "closeShift",
      title: t("shift.confirm.closeTitle"),
      message: t("shift.confirm.closeMessage", {
        amount: money(expectedCash),
      }),
    });

    setConfirmOpen(true);
  };

  const openDeleteTransactionConfirm = (transactionId) => {
    setConfirmPayload({
      action: "deleteTransaction",
      transactionId,
      title: t("shift.confirm.deleteTransactionTitle"),
      message: t("shift.confirm.deleteTransactionMessage"),
    });

    setConfirmOpen(true);
  };

  const handleOpenShift = async () => {
    if (!staffId) {
      showToast(t("shift.alerts.missingStaff"), "error");
      return;
    }

    setOpeningShift(true);

    try {
      const data = await apiRequest("/shifts", {
        method: "POST",
        body: JSON.stringify({
          staffId: Number(staffId),
          openingCash: Number(openingCash || 0),
        }),
      });

      setShift(data);
      showToast(t("shift.alerts.openSuccess"));
    } catch (err) {
      showToast(t("shift.alerts.openFailed", { message: err.message }), "error");
    } finally {
      setOpeningShift(false);
    }
  };

  const handleCloseShift = () => {
    if (!getShiftId(shift)) return;
    openCloseShiftConfirm();
  };

  const handleAddTransaction = async (event) => {
    event.preventDefault();

    if (!txForm.reason.trim()) {
      showToast(t("shift.alerts.requiredReason"), "error");
      return;
    }

    if (!txForm.amount || Number(txForm.amount) <= 0) {
      showToast(t("shift.alerts.invalidAmount"), "error");
      return;
    }

    if (!getShiftId(shift)) return;

    setSavingTx(true);

    try {
      const newTransaction = await apiRequest(
        `/shifts/${getShiftId(shift)}/transactions`,
        {
          method: "POST",
          body: JSON.stringify({
            type: txForm.type,
            reason: txForm.reason.trim(),
            amount: Number(txForm.amount),
          }),
        }
      );

      setShift((prev) => ({
        ...prev,
        transactions: [newTransaction, ...toArray(prev?.transactions || prev?.Transactions)],
      }));

      showToast(
        t("shift.alerts.addTransactionSuccess", {
          type:
            txForm.type === TRANSACTION_TYPES.INCOME
              ? t("shift.transaction.income")
              : t("shift.transaction.expense"),
          amount: money(txForm.amount),
        })
      );

      setTxForm({
        type: TRANSACTION_TYPES.EXPENSE,
        reason: "",
        amount: "",
      });
    } catch (err) {
      showToast(
        t("shift.alerts.addTransactionFailed", { message: err.message }),
        "error"
      );
    } finally {
      setSavingTx(false);
    }
  };

  const handleDeleteTransaction = (transactionId) => {
    openDeleteTransactionConfirm(transactionId);
  };

  const handleConfirmAction = async () => {
    const payload = confirmPayload;

    setConfirmOpen(false);
    setConfirmPayload(null);

    if (!payload) return;

    if (payload.action === "closeShift") {
      setClosingShift(true);

      try {
        await apiRequest(`/shifts/${getShiftId(shift)}/close`, {
          method: "PUT",
        });

        setShift(null);
        showToast(t("shift.alerts.closeSuccess"));
        loadRevenue();
      } catch (err) {
        showToast(
          t("shift.alerts.closeFailed", { message: err.message }),
          "error"
        );
      } finally {
        setClosingShift(false);
      }

      return;
    }

    if (payload.action === "deleteTransaction") {
      const transactionId = payload.transactionId;

      setDeletingTx(transactionId);

      try {
        await apiRequest(
          `/shifts/${getShiftId(shift)}/transactions/${transactionId}`,
          {
            method: "DELETE",
          }
        );

        setShift((prev) => ({
          ...prev,
          transactions: toArray(prev?.transactions || prev?.Transactions).filter(
            (transaction) => getTransactionId(transaction) !== transactionId
          ),
        }));

        showToast(t("shift.alerts.deleteTransactionSuccess"));
      } catch (err) {
        showToast(
          t("shift.alerts.deleteTransactionFailed", { message: err.message }),
          "error"
        );
      } finally {
        setDeletingTx(null);
      }
    }
  };

  const renderTransactionTypeLabel = (type) => {
    return type === TRANSACTION_TYPES.INCOME
      ? t("shift.transaction.income")
      : t("shift.transaction.expense");
  };

  const renderTransactionTypeText = (type) => {
    return type === TRANSACTION_TYPES.INCOME
      ? t("shift.transaction.incomeText")
      : t("shift.transaction.expenseText");
  };

  return (
    <div className="staff-page staff-shift-page">
      <Toast
        open={!!toast}
        message={toast?.message}
        type={toast?.type === "error" ? "error" : "success"}
        onClose={() => setToast(null)}
      />

      <ConfirmModal
        open={confirmOpen}
        title={confirmPayload?.title}
        message={confirmPayload?.message}
        confirmText={t("shift.confirm.confirm")}
        cancelText={t("shift.confirm.cancel")}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmPayload(null);
        }}
        onConfirm={handleConfirmAction}
      />

      <div className="shift-tabs">
        <button
          type="button"
          className={`shift-tab-btn ${
            activeTab === TAB_KEYS.CURRENT ? "active" : ""
          }`}
          onClick={() => setActiveTab(TAB_KEYS.CURRENT)}
        >
          {t("shift.tabs.current")}
        </button>

        <button
          type="button"
          className={`shift-tab-btn ${
            activeTab === TAB_KEYS.HISTORY ? "active" : ""
          }`}
          onClick={() => setActiveTab(TAB_KEYS.HISTORY)}
        >
          {t("shift.tabs.history")}
        </button>
      </div>

      {activeTab === TAB_KEYS.CURRENT && (
        <>
          {errorShift && (
            <div className="staff-alert staff-alert--warning">
              <strong>{t("shift.alerts.errorTitle")}</strong>
              <p>{errorShift}</p>
            </div>
          )}

          {loadingShift && (
            <div className="staff-card staff-shift-loading-card">
              <div className="shift-spinner" />
              <p className="staff-shift-loading-text">
                {t("shift.loading.currentShift")}
              </p>
            </div>
          )}

          {!loadingShift && !shift && (
            <div className="shift-open-card">
              <div className="shift-open-icon">🔓</div>

              <h2>{t("shift.open.noShiftTitle")}</h2>
              <p>{t("shift.open.noShiftDesc")}</p>

              <div className="shift-open-form">
                <div className="staff-form-group">
                  <label>{t("shift.open.openingCash")}</label>

                  <input
                    id="opening-cash-input"
                    className="staff-input"
                    type="number"
                    value={openingCash}
                    onChange={(event) => setOpeningCash(event.target.value)}
                    placeholder={t("shift.open.openingCashPlaceholder")}
                    min={0}
                  />
                </div>

                <button
                  id="open-shift-btn"
                  type="button"
                  className="staff-btn staff-btn--primary staff-btn--full"
                  onClick={handleOpenShift}
                  disabled={openingShift}
                >
                  {openingShift
                    ? t("shift.open.opening")
                    : t("shift.open.openButton")}
                </button>
              </div>
            </div>
          )}

          {!loadingShift && shift && (
            <>
              <div className="staff-grid staff-grid--4 staff-stats-compact">
                <div className="staff-card staff-stat">
                  <div className="staff-stat__icon staff-shift-icon--success">
                    🔓
                  </div>

                  <div>
                    <p>{t("shift.stats.status")}</p>
                    <h3 className="staff-shift-value--success">
                      {t("shift.stats.open")}
                    </h3>
                  </div>
                </div>

                <div className="staff-card staff-stat">
                  <div className="staff-stat__icon">💵</div>

                  <div>
                    <p>{t("shift.stats.openingCash")}</p>
                    <h3>{money(getShiftOpeningCash(shift))}</h3>
                  </div>
                </div>

                <div className="staff-card staff-stat">
                  <div className="staff-stat__icon staff-shift-icon--warning">
                    🧾
                  </div>

                  <div>
                    <p>{t("shift.stats.todayRevenue")}</p>
                    <h3 className="staff-shift-value--warning">
                      {loadingRevenue ? "..." : money(revenue.totalRevenue)}
                    </h3>
                  </div>
                </div>

                <div className="staff-card staff-stat">
                  <div className="staff-stat__icon staff-shift-icon--primary">
                    ✅
                  </div>

                  <div>
                    <p>{t("shift.stats.expectedCash")}</p>
                    <h3 className="staff-shift-value--primary">
                      {money(expectedCash)}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="staff-grid staff-grid--2 staff-shift-info-grid">
                <div className="staff-card">
                  <div className="staff-card__header">
                    <h2>{t("shift.current.infoTitle")}</h2>

                    <span className="staff-shift-card-subtitle">
                      {t("shift.current.shiftLabel", {
                        id: getShiftId(shift),
                        staff: getShiftStaffName(
                          shift,
                          t("shift.defaults.staff")
                        ),
                      })}
                    </span>
                  </div>

                  <div className="staff-payment__summary">
                    <div>
                      <span>{t("shift.summary.openingCash")}</span>
                      <strong>{money(getShiftOpeningCash(shift))}</strong>
                    </div>

                    <div>
                      <span>{t("shift.summary.cashRevenue")}</span>
                      <strong>
                        {loadingRevenue ? "..." : money(revenue.cash)}
                      </strong>
                    </div>

                    <div>
                      <span>{t("shift.summary.bankRevenue")}</span>
                      <strong>
                        {loadingRevenue ? "..." : money(revenue.bank)}
                      </strong>
                    </div>

                    <div>
                      <span>{t("shift.summary.totalIncome")}</span>
                      <strong className="staff-shift-amount-income">
                        +{money(totalIncome)}
                      </strong>
                    </div>

                    <div>
                      <span>{t("shift.summary.totalExpense")}</span>
                      <strong className="staff-shift-amount-expense">
                        -{money(totalExpense)}
                      </strong>
                    </div>

                    <div className="staff-payment__total">
                      <span>{t("shift.summary.expectedCash")}</span>
                      <strong className="staff-shift-amount-expected">
                        {money(expectedCash)}
                      </strong>
                    </div>
                  </div>

                  <button
                    id="close-shift-btn"
                    type="button"
                    className="staff-btn staff-btn--danger staff-shift-action-btn"
                    onClick={handleCloseShift}
                    disabled={closingShift}
                  >
                    {closingShift
                      ? t("shift.actions.closing")
                      : t("shift.actions.closeShift")}
                  </button>

                  <button
                    type="button"
                    className="staff-btn staff-btn--outline staff-shift-action-btn staff-shift-action-btn--small-gap"
                    onClick={loadRevenue}
                    disabled={loadingRevenue}
                  >
                    {loadingRevenue
                      ? t("shift.actions.updatingRevenue")
                      : t("shift.actions.updateRevenue")}
                  </button>
                </div>

                <div
                  className="staff-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    gap: "20px",
                  }}
                >
                  <div className="staff-card__header" style={{ marginBottom: 0 }}>
                    <h2>{t("shift.transactionForm.title")}</h2>
                  </div>

                  <form
                    className="staff-form"
                    onSubmit={handleAddTransaction}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      justifyContent: "flex-start",
                    }}
                  >
                    <div className="shift-tx-type-row">
                      {[TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE].map(
                        (type) => (
                          <button
                            key={type}
                            type="button"
                            className={`shift-tx-type-btn ${
                              txForm.type === type
                                ? type === TRANSACTION_TYPES.INCOME
                                  ? "active-income"
                                  : "active-expense"
                                : ""
                            }`}
                            onClick={() =>
                              setTxForm((prev) => ({ ...prev, type }))
                            }
                          >
                            {renderTransactionTypeLabel(type)}
                          </button>
                        )
                      )}
                    </div>

                    <div className="staff-form-group">
                      <label>{t("shift.transactionForm.reason")}</label>

                      <input
                        id="tx-reason-input"
                        className="staff-input"
                        value={txForm.reason}
                        onChange={(event) =>
                          setTxForm((prev) => ({
                            ...prev,
                            reason: event.target.value,
                          }))
                        }
                        placeholder={
                          txForm.type === TRANSACTION_TYPES.INCOME
                            ? t("shift.transactionForm.incomeReasonPlaceholder")
                            : t("shift.transactionForm.expenseReasonPlaceholder")
                        }
                      />
                    </div>

                    <div className="staff-form-group">
                      <label>{t("shift.transactionForm.amount")}</label>

                      <input
                        id="tx-amount-input"
                        className="staff-input"
                        type="number"
                        min={1}
                        value={txForm.amount}
                        onChange={(event) =>
                          setTxForm((prev) => ({
                            ...prev,
                            amount: event.target.value,
                          }))
                        }
                        placeholder={t("shift.transactionForm.amountPlaceholder")}
                      />
                    </div>

                    <button
                      id="add-tx-btn"
                      className={`staff-btn ${
                        txForm.type === TRANSACTION_TYPES.INCOME
                          ? "staff-btn--primary"
                          : "staff-btn--danger"
                      } staff-btn--full`}
                      type="submit"
                      disabled={savingTx}
                    >
                      {savingTx
                        ? t("shift.actions.saving")
                        : t("shift.actions.saveTransaction")}
                    </button>
                  </form>
                </div>
              </div>

              <div className="staff-card">
                <div className="staff-card__header">
                  <h2>{t("shift.transactions.title")}</h2>

                  <span className="staff-badge">
                    {t("shift.transactions.count", {
                      count: transactions.length,
                    })}
                  </span>
                </div>

                <div className="staff-table-wrap">
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>{t("shift.transactions.no")}</th>
                        <th>{t("shift.transactions.type")}</th>
                        <th>{t("shift.transactions.reason")}</th>
                        <th>{t("shift.transactions.amount")}</th>
                        <th>{t("shift.transactions.time")}</th>
                        <th>{t("shift.transactions.actions")}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan="6">
                            <div className="staff-empty">
                              {t("shift.transactions.empty")}
                            </div>
                          </td>
                        </tr>
                      )}

                      {transactions.map((transaction, index) => {
                        const type = getTransactionType(transaction);
                        const isIncome = type === TRANSACTION_TYPES.INCOME;
                        const transactionId = getTransactionId(transaction);

                        return (
                          <tr key={transactionId || index}>
                            <td className="staff-shift-table-index">
                              {index + 1}
                            </td>

                            <td>
                              <span
                                className={
                                  isIncome
                                    ? "staff-badge staff-badge--success"
                                    : "staff-badge staff-badge--danger"
                                }
                              >
                                {renderTransactionTypeLabel(type)}
                              </span>
                            </td>

                            <td>
                              {getTransactionReason(transaction) ||
                                t("shift.defaults.noReason")}
                            </td>

                            <td>
                              <strong
                                className={
                                  isIncome
                                    ? "staff-shift-amount-income"
                                    : "staff-shift-amount-expense"
                                }
                              >
                                {isIncome ? "+" : "-"}
                                {money(getTransactionAmount(transaction))}
                              </strong>
                            </td>

                            <td className="staff-shift-table-date">
                              {formatDate(
                                getTransactionCreatedAt(transaction),
                                dateLocale,
                                t("shift.defaults.noDate")
                              )}
                            </td>

                            <td>
                              <button
                                type="button"
                                className="staff-btn staff-btn--small staff-btn--danger-light"
                                onClick={() =>
                                  handleDeleteTransaction(transactionId)
                                }
                                disabled={deletingTx === transactionId}
                              >
                                {deletingTx === transactionId
                                  ? "..."
                                  : t("shift.actions.delete")}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {transactions.length > 0 && (
                  <div className="shift-summary-row">
                    <span>
                      {t("shift.transactions.totalIncome")}:{" "}
                      <strong className="staff-shift-amount-income">
                        {money(totalIncome)}
                      </strong>
                    </span>

                    <span>
                      {t("shift.transactions.totalExpense")}:{" "}
                      <strong className="staff-shift-amount-expense">
                        {money(totalExpense)}
                      </strong>
                    </span>

                    <span>
                      {t("shift.transactions.difference")}:{" "}
                      <strong
                        className={
                          Number(totalIncome - totalExpense) >= 0
                            ? "staff-shift-amount-income"
                            : "staff-shift-amount-expense"
                        }
                      >
                        {money(totalIncome - totalExpense)}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === TAB_KEYS.HISTORY && (
        <div className="staff-card">
          <div className="staff-card__header">
            <h2>{t("shift.history.title")}</h2>

            <button
              type="button"
              className="staff-btn staff-btn--outline"
              onClick={loadHistory}
              disabled={loadingHistory}
            >
              {loadingHistory
                ? t("shift.actions.loading")
                : t("shift.actions.refresh")}
            </button>
          </div>

          <div className="staff-table-wrap">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>{t("shift.history.shift")}</th>
                  <th>{t("shift.history.staff")}</th>
                  <th>{t("shift.history.openedAt")}</th>
                  <th>{t("shift.history.closedAt")}</th>
                  <th>{t("shift.history.openingCash")}</th>
                  <th>{t("shift.history.income")}</th>
                  <th>{t("shift.history.expense")}</th>
                  <th>{t("shift.history.transactions")}</th>
                </tr>
              </thead>

              <tbody>
                {loadingHistory && (
                  <tr>
                    <td colSpan="8">
                      <div className="staff-empty">
                        {t("shift.history.loading")}
                      </div>
                    </td>
                  </tr>
                )}

                {!loadingHistory && historyShifts.length === 0 && (
                  <tr>
                    <td colSpan="8">
                      <div className="staff-empty">
                        {t("shift.history.empty")}
                      </div>
                    </td>
                  </tr>
                )}

                {!loadingHistory &&
                  historyShifts.map((historyShift) => {
                    const transactionList = toArray(
                      historyShift.transactions || historyShift.Transactions
                    );

                    const income = transactionList
                      .filter(
                        (transaction) =>
                          getTransactionType(transaction) ===
                          TRANSACTION_TYPES.INCOME
                      )
                      .reduce(
                        (sum, transaction) =>
                          sum + getTransactionAmount(transaction),
                        0
                      );

                    const expense = transactionList
                      .filter(
                        (transaction) =>
                          getTransactionType(transaction) ===
                          TRANSACTION_TYPES.EXPENSE
                      )
                      .reduce(
                        (sum, transaction) =>
                          sum + getTransactionAmount(transaction),
                        0
                      );

                    return (
                      <tr key={getShiftId(historyShift)}>
                        <td>
                          <strong>{getShiftId(historyShift)}</strong>
                        </td>

                        <td>
                          {getShiftStaffName(
                            historyShift,
                            t("shift.defaults.staff")
                          )}
                        </td>

                        <td className="staff-shift-history-date">
                          {formatDate(
                            getShiftOpenedAt(historyShift),
                            dateLocale,
                            t("shift.defaults.noDate")
                          )}
                        </td>

                        <td className="staff-shift-history-date">
                          {formatDate(
                            getShiftClosedAt(historyShift),
                            dateLocale,
                            t("shift.defaults.noDate")
                          )}
                        </td>

                        <td>{money(getShiftOpeningCash(historyShift))}</td>

                        <td>
                          <span className="staff-shift-history-income">
                            +{money(income)}
                          </span>
                        </td>

                        <td>
                          <span className="staff-shift-history-expense">
                            -{money(expense)}
                          </span>
                        </td>

                        <td>
                          <span className="staff-badge">
                            {t("shift.history.transactionCount", {
                              count: transactionList.length,
                            })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}