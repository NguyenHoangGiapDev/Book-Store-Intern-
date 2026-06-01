import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../../services/apiClient";
import { showToast } from "../../components/common/Toast.jsx";
import "../../styles/staff/StaffProfile.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api"
).replace(/\/$/, "");

const FILE_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

const DEFAULT_ROLE_ID = 3;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const MODALS = {
  INFO: "info",
  PASSWORD: "password",
  HISTORY: "history",
};

function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value || "null") || fallback;
  } catch {
    return fallback;
  }
}

function pick(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );
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

function getUserId(user) {
  if (!user) return null;

  return user.id || user.Id || user.userId || user.UserId || null;
}

function getImageUrl(path) {
  if (!path) return null;

  const normalizedPath = String(path);

  if (normalizedPath.startsWith("http")) {
    return normalizedPath;
  }

  return `${FILE_BASE_URL}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;
}

function formatDate(value, locale = "vi-VN", fallback = "") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback || String(value);
  }

  return date.toLocaleDateString(locale);
}

function formatTime(value, locale = "vi-VN", fallback = "—") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value, language = "vi") {
  const locale = language?.startsWith("vi") ? "vi-VN" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizeUser(data = {}, currentUser = {}) {
  const roleId = Number(
    pick(data.roleId, data.RoleId, currentUser?.roleId, DEFAULT_ROLE_ID)
  );

  return {
    fullName: pick(
      data.fullName,
      data.FullName,
      data.name,
      data.Name,
      currentUser?.fullName,
      currentUser?.name,
      ""
    ),
    email: pick(data.email, data.Email, currentUser?.email, ""),
    roleId,
    roleName: pick(data.roleName, data.RoleName, currentUser?.roleName, ""),
    phoneNumber: pick(
      data.phoneNumber,
      data.PhoneNumber,
      currentUser?.phoneNumber,
      ""
    ),
    address: pick(data.address, data.Address, currentUser?.address, ""),
    gender: pick(data.gender, data.Gender, currentUser?.gender, "other"),
    dateOfBirth: pick(
      data.dateOfBirth,
      data.DateOfBirth,
      currentUser?.dateOfBirth,
      null
    ),
    avatar: pick(data.avatar, data.Avatar, currentUser?.avatar, null),
    bankName: pick(data.bankName, data.BankName, currentUser?.bankName, null),
    bankAccountName: pick(
      data.bankAccountName,
      data.BankAccountName,
      currentUser?.bankAccountName,
      null
    ),
    bankAccountNumber: pick(
      data.bankAccountNumber,
      data.BankAccountNumber,
      currentUser?.bankAccountNumber,
      null
    ),
    createdAt: pick(data.createdAt, data.CreatedAt, currentUser?.createdAt, null),
  };
}

function getRoleLabel(roleId, roleName, t) {
  if (Number(roleId) === 2) return t("profile.roles.admin");
  if (Number(roleId) === 3) return t("profile.roles.staff");

  return roleName || t("profile.roles.staff");
}

function StaffProfile() {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language?.startsWith("en") ? "en" : "vi";
  const dateLocale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";

  const money = useCallback(
    (value) => formatMoney(value, currentLanguage),
    [currentLanguage]
  );

  const currentUser = useMemo(() => {
    return safeJsonParse(localStorage.getItem("user"), {});
  }, []);

  const staffId = useMemo(() => getUserId(currentUser), [currentUser]);

  const [userData, setUserData] = useState(() =>
    normalizeUser({}, currentUser)
  );

  const [activeModal, setActiveModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [historyShifts, setHistoryShifts] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const displayUser = useMemo(() => {
    const notUpdated = t("profile.defaults.notUpdated");

    return {
      fullName: userData.fullName || t("profile.defaults.staffName"),
      email: userData.email || t("profile.defaults.email"),
      roleId: userData.roleId || DEFAULT_ROLE_ID,
      roleName: getRoleLabel(userData.roleId, userData.roleName, t),
      phoneNumber: userData.phoneNumber || notUpdated,
      address: userData.address || notUpdated,
      createdAt: formatDate(
        userData.createdAt,
        dateLocale,
        t("profile.defaults.joinDate")
      ),
      avatar: userData.avatar,
    };
  }, [userData, t, dateLocale]);

  const displayAvatarText = useMemo(() => {
    return displayUser.fullName.charAt(0).toUpperCase();
  }, [displayUser.fullName]);

  const syncLocalUser = useCallback((data) => {
    const currentStored = safeJsonParse(localStorage.getItem("user"), {});

    const updatedUser = {
      ...currentStored,
      fullName: data.fullName || data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      address: data.address,
      avatar: data.avatar,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    const currentAuth = safeJsonParse(localStorage.getItem("auth"), {});

    const updatedAuth = {
      ...currentAuth,
      fullName: data.fullName || data.name,
      email: data.email,
      avatar: data.avatar,
    };

    localStorage.setItem("auth", JSON.stringify(updatedAuth));
    window.dispatchEvent(new Event("authChanged"));
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!staffId) return;

    try {
      const data = await apiRequest(`/users/${staffId}`);

      if (data) {
        setUserData(normalizeUser(data, currentUser));
        syncLocalUser(data);
      }
    } catch (err) {
      console.error(t("profile.errors.loadProfile"), err);
    }
  }, [staffId, currentUser, syncLocalUser, t]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const openInfoModal = () => {
    setFullName(userData.fullName || "");
    setPhoneNumber(userData.phoneNumber || "");
    setEmail(userData.email || "");
    setAddress(userData.address || "");
    setActiveModal(MODALS.INFO);
  };

  const openPasswordModal = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setActiveModal(MODALS.PASSWORD);
  };

  const fetchHistory = useCallback(async () => {
    if (!staffId) return;

    setLoadingHistory(true);

    try {
      const data = await apiRequest(`/shifts?staffId=${staffId}`);
      const items = toArray(data);

      setHistoryShifts(items.filter((shift) => !shift.isOpen));
    } catch (err) {
      console.error(t("profile.errors.loadHistory"), err);
      setHistoryShifts([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [staffId, t]);

  const openHistoryModal = () => {
    setActiveModal(MODALS.HISTORY);
    fetchHistory();
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE) {
      showToast(t("profile.toasts.avatarTooLarge"), "error");
      event.target.value = "";
      return;
    }

    if (!staffId) {
      showToast(t("profile.toasts.missingStaffId"), "error");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setSaving(true);

    try {
      const token = localStorage.getItem("token") || "";

      const response = await fetch(
        `${API_BASE_URL}/users/${staffId}/upload-avatar`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          t("profile.errors.serverError", { status: response.status })
        );
      }

      const data = await response.json();
      const imageUrl = data.imageUrl || data.Url || data.url;

      if (!imageUrl) {
        throw new Error(t("profile.errors.avatarUrlMissing"));
      }

      setUserData((prev) => ({ ...prev, avatar: imageUrl }));

      const currentStored = safeJsonParse(localStorage.getItem("user"), {});
      localStorage.setItem(
        "user",
        JSON.stringify({ ...currentStored, avatar: imageUrl })
      );

      const currentAuth = safeJsonParse(localStorage.getItem("auth"), {});
      localStorage.setItem(
        "auth",
        JSON.stringify({ ...currentAuth, avatar: imageUrl })
      );

      window.dispatchEvent(new Event("authChanged"));
      showToast(t("profile.toasts.avatarUpdateSuccess"), "success");
    } catch (err) {
      showToast(
        t("profile.toasts.avatarUpdateFailed", { message: err.message }),
        "error"
      );
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const handleUpdateInfoSubmit = async (event) => {
    event.preventDefault();

    if (!staffId) {
      showToast(t("profile.toasts.missingStaffId"), "error");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || null,
        address: address.trim() || null,
        email: email.trim(),
        gender: userData.gender || currentUser?.gender || "other",
        dateOfBirth: userData.dateOfBirth || currentUser?.dateOfBirth || null,
        avatar: userData.avatar || currentUser?.avatar || null,
        bankName: userData.bankName || currentUser?.bankName || null,
        bankAccountName:
          userData.bankAccountName || currentUser?.bankAccountName || null,
        bankAccountNumber:
          userData.bankAccountNumber || currentUser?.bankAccountNumber || null,
        roleId: Number(userData.roleId) || DEFAULT_ROLE_ID,
        isActive: true,
      };

      await apiRequest(`/users/${staffId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      showToast(t("profile.toasts.updateInfoSuccess"), "success");
      await fetchUserData();
      setActiveModal(null);
    } catch (err) {
      showToast(
        t("profile.toasts.updateInfoFailed", { message: err.message }),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!staffId) {
      showToast(t("profile.toasts.missingStaffId"), "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t("profile.toasts.passwordNotMatch"), "error");
      return;
    }

    setSaving(true);

    try {
      await apiRequest(`/users/${staffId}/password`, {
        method: "PUT",
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      showToast(t("profile.toasts.changePasswordSuccess"), "success");
      setActiveModal(null);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(
        t("profile.toasts.changePasswordFailed", { message: err.message }),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="staff-page">
      <div
        className="staff-profile-pro"
        style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}
      >
        <div
          className="staff-profile-pro__header"
          style={{ marginBottom: "80px" }}
        >
          <div
            className="staff-profile-pro__cover"
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #6366f1, #a855f7)",
              height: "220px",
              borderRadius: "24px",
              position: "relative",
              boxShadow: "0 20px 40px rgba(37, 99, 235, 0.15)",
            }}
          >
            <div
              className="staff-profile-pro__avatar-wrapper"
              style={{
                position: "absolute",
                bottom: "-50px",
                left: "40px",
                display: "flex",
                alignItems: "flex-end",
                gap: "24px",
              }}
            >
              <div
                className="staff-profile-pro__avatar"
                style={{
                  width: "140px",
                  height: "140px",
                  borderRadius: "50%",
                  background: "#fff",
                  padding: "6px",
                  boxShadow: "0 16px 36px rgba(0,0,0,0.12)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #2563eb, #6366f1, #a855f7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "56px",
                    color: "#fff",
                    fontWeight: "900",
                    overflow: "hidden",
                  }}
                >
                  {displayUser.avatar ? (
                    <img
                      src={getImageUrl(displayUser.avatar)}
                      alt={t("profile.avatarAlt")}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    displayAvatarText
                  )}
                </div>

                <label
                  htmlFor="staff-avatar-upload"
                  style={{
                    position: "absolute",
                    bottom: "2px",
                    right: "2px",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#2563eb",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    border: "3px solid #ffffff",
                    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.3)",
                    transition: "all 0.2s",
                  }}
                  title={t("profile.actions.uploadAvatar")}
                >
                  <CameraIcon />
                </label>

                <input
                  type="file"
                  id="staff-avatar-upload"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarUpload}
                  disabled={saving}
                />
              </div>

              <div style={{ paddingBottom: "12px" }}>
                <h2
                  style={{
                    fontSize: "32px",
                    margin: 0,
                    color: "#0f172a",
                    fontWeight: "900",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {displayUser.fullName}
                </h2>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "8px",
                  }}
                >
                  <span
                    style={{
                      background: "#eff6ff",
                      color: "#2563eb",
                      padding: "6px 14px",
                      borderRadius: "99px",
                      fontSize: "13px",
                      fontWeight: "800",
                    }}
                  >
                    {displayUser.roleName}
                  </span>

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                      fontWeight: "700",
                    }}
                  >
                    {t("profile.roleId", { id: displayUser.roleId })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "24px",
          }}
        >
          <div
            className="staff-card"
            style={{
              padding: "32px",
              border: "1px solid #eef2f7",
              boxShadow: "0 10px 30px rgba(15,23,42,0.03)",
              borderRadius: "24px",
            }}
          >
            <h2
              style={{
                margin: "0 0 28px",
                fontSize: "22px",
                color: "#0f172a",
                fontWeight: "800",
              }}
            >
              {t("profile.sections.personalInfo")}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <InfoRow
                icon="📧"
                label={t("profile.fields.email")}
                value={displayUser.email}
              />
              <InfoRow
                icon="📞"
                label={t("profile.fields.phone")}
                value={displayUser.phoneNumber}
              />
              <InfoRow
                icon="🏠"
                label={t("profile.fields.address")}
                value={displayUser.address}
                alignRight
              />
              <InfoRow
                icon="📅"
                label={t("profile.fields.joinDate")}
                value={displayUser.createdAt}
                noBorder
              />
            </div>
          </div>

          <div
            className="staff-card"
            style={{
              padding: "32px",
              border: "1px solid #eef2f7",
              boxShadow: "0 10px 30px rgba(15,23,42,0.03)",
              borderRadius: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "28px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  color: "#0f172a",
                  fontWeight: "800",
                }}
              >
                {t("profile.sections.todayShift")}
              </h2>

              <span
                style={{
                  background: "#dcfce7",
                  color: "#16a34a",
                  padding: "8px 16px",
                  borderRadius: "99px",
                  fontSize: "14px",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "1px solid #bbf7d0",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#16a34a",
                    boxShadow: "0 0 0 3px #dcfce7",
                  }}
                />
                {t("profile.online")}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <ShiftMetric
                label={t("profile.shift.startTime")}
                value={t("profile.shift.startTimeSample")}
              />
              <ShiftMetric
                label={t("profile.shift.workingHours")}
                value={t("profile.shift.durationSample")}
              />
              <ShiftMetric
                label={t("profile.shift.completedOrders")}
                value={t("profile.shift.ordersSample", { count: 24 })}
                variant="blue"
              />
              <ShiftMetric
                label={t("profile.shift.revenue")}
                value={money(5860000)}
                variant="red"
              />
            </div>
          </div>
        </div>

        <div
          className="staff-card"
          style={{
            padding: "32px",
            marginTop: "24px",
            border: "1px solid #eef2f7",
            boxShadow: "0 10px 30px rgba(15,23,42,0.03)",
            borderRadius: "24px",
          }}
        >
          <h2
            style={{
              margin: "0 0 24px",
              fontSize: "22px",
              color: "#0f172a",
              fontWeight: "800",
            }}
          >
            {t("profile.sections.security")}
          </h2>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-modern btn-modern-primary"
              style={{ padding: "14px 28px", fontSize: "15px" }}
              onClick={openInfoModal}
            >
              <UserIcon />
              {t("profile.actions.updateInfo")}
            </button>

            <button
              type="button"
              className="btn-modern btn-modern-ghost"
              style={{
                padding: "14px 28px",
                fontSize: "15px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
              onClick={openPasswordModal}
            >
              <LockIcon />
              {t("profile.actions.changePassword")}
            </button>

            <button
              type="button"
              className="btn-modern btn-modern-ghost"
              style={{
                padding: "14px 28px",
                fontSize: "15px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
              onClick={openHistoryModal}
            >
              <ClockIcon />
              {t("profile.actions.history")}
            </button>
          </div>
        </div>

        {activeModal === MODALS.INFO && (
          <div
            className="staff-profile-modal-backdrop"
            onClick={() => setActiveModal(null)}
          >
            <div
              className="staff-profile-modal-card animate-pop-in"
              style={{ maxWidth: "550px" }}
              onClick={(event) => event.stopPropagation()}
            >
              <ModalHeader
                icon={<UserIcon />}
                title={t("profile.modals.infoTitle")}
                iconBg="#eff6ff"
                iconColor="#2563eb"
                onClose={() => setActiveModal(null)}
              />

              <form onSubmit={handleUpdateInfoSubmit}>
                <div className="staff-profile-modal-body">
                  <TextField
                    label={t("profile.fields.fullName")}
                    value={fullName}
                    onChange={setFullName}
                    required
                    placeholder={t("profile.placeholders.fullName")}
                    icon={<UserIcon />}
                  />

                  <TextField
                    label={t("profile.fields.phone")}
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    type="tel"
                    placeholder={t("profile.placeholders.phone")}
                    icon={<PhoneIcon />}
                  />

                  <TextField
                    label={t("profile.fields.email")}
                    value={email}
                    onChange={setEmail}
                    type="email"
                    required
                    placeholder={t("profile.placeholders.email")}
                    icon={<MailIcon />}
                  />

                  <TextAreaField
                    label={t("profile.fields.address")}
                    value={address}
                    onChange={setAddress}
                    placeholder={t("profile.placeholders.address")}
                    icon={<LocationIcon />}
                  />
                </div>

                <div className="staff-profile-modal-footer">
                  <button
                    type="button"
                    className="btn-modern btn-modern-ghost"
                    onClick={() => setActiveModal(null)}
                  >
                    {t("profile.actions.cancel")}
                  </button>

                  <button
                    type="submit"
                    className="btn-modern btn-modern-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : (
                      <>
                        <SaveIcon />
                        {t("profile.actions.save")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeModal === MODALS.PASSWORD && (
          <div
            className="staff-profile-modal-backdrop"
            onClick={() => setActiveModal(null)}
          >
            <div
              className="staff-profile-modal-card animate-pop-in"
              style={{ maxWidth: "500px" }}
              onClick={(event) => event.stopPropagation()}
            >
              <ModalHeader
                icon={<LockIcon />}
                title={t("profile.modals.passwordTitle")}
                iconBg="#fef2f2"
                iconColor="#ef4444"
                onClose={() => setActiveModal(null)}
              />

              <form onSubmit={handleChangePasswordSubmit}>
                <div className="staff-profile-modal-body">
                  <TextField
                    label={t("profile.fields.oldPassword")}
                    value={oldPassword}
                    onChange={setOldPassword}
                    type="password"
                    required
                    placeholder={t("profile.placeholders.oldPassword")}
                    icon={<ShieldIcon />}
                  />

                  <TextField
                    label={t("profile.fields.newPassword")}
                    value={newPassword}
                    onChange={setNewPassword}
                    type="password"
                    required
                    placeholder={t("profile.placeholders.newPassword")}
                    icon={<LockIcon />}
                  />

                  <TextField
                    label={t("profile.fields.confirmPassword")}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    type="password"
                    required
                    placeholder={t("profile.placeholders.confirmPassword")}
                    icon={<CheckUserIcon />}
                  />
                </div>

                <div className="staff-profile-modal-footer">
                  <button
                    type="button"
                    className="btn-modern btn-modern-ghost"
                    onClick={() => setActiveModal(null)}
                  >
                    {t("profile.actions.cancel")}
                  </button>

                  <button
                    type="submit"
                    className="btn-modern btn-modern-primary"
                    style={{
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
                    }}
                    disabled={saving}
                  >
                    {saving ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : (
                      <>
                        <KeyIcon />
                        {t("profile.actions.confirm")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeModal === MODALS.HISTORY && (
          <div
            className="staff-profile-modal-backdrop"
            onClick={() => setActiveModal(null)}
          >
            <div
              className="staff-profile-modal-card staff-profile-modal-card--large animate-pop-in"
              onClick={(event) => event.stopPropagation()}
            >
              <ModalHeader
                icon={<ClockIcon />}
                title={t("profile.modals.historyTitle")}
                iconBg="#f8fafc"
                iconColor="#64748b"
                onClose={() => setActiveModal(null)}
              />

              <div className="staff-profile-modal-body">
                {loadingHistory ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <div
                      className="spinner-border text-primary"
                      role="status"
                      style={{ width: "3rem", height: "3rem" }}
                    >
                      <span className="visually-hidden">
                        {t("profile.history.loading")}
                      </span>
                    </div>

                    <p
                      style={{
                        color: "#64748b",
                        fontWeight: "bold",
                        marginTop: "16px",
                      }}
                    >
                      {t("profile.history.loading")}
                    </p>
                  </div>
                ) : historyShifts.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 0",
                      color: "#94a3b8",
                    }}
                  >
                    <EmptyHistoryIcon />

                    <strong
                      style={{
                        display: "block",
                        fontSize: "18px",
                        color: "#64748b",
                      }}
                    >
                      {t("profile.history.emptyTitle")}
                    </strong>

                    <p style={{ margin: "8px 0 0" }}>
                      {t("profile.history.emptyDesc")}
                    </p>
                  </div>
                ) : (
                  <div
                    className="staff-modal-table-wrap"
                    style={{ marginTop: "24px" }}
                  >
                    <table className="staff-modal-table">
                      <thead>
                        <tr>
                          <th>{t("profile.history.shiftId")}</th>
                          <th>{t("profile.history.openedAt")}</th>
                          <th>{t("profile.history.closedAt")}</th>
                          <th>{t("profile.history.openingCash")}</th>
                          <th>{t("profile.history.transactions")}</th>
                          <th>{t("profile.history.status")}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {historyShifts.map((shift) => {
                          const transactions = toArray(shift.transactions);

                          const openedTime = formatTime(
                            shift.openedAt,
                            dateLocale,
                            "—"
                          );
                          const openedDate = formatDate(
                            shift.openedAt,
                            dateLocale,
                            ""
                          );
                          const closedTime = formatTime(
                            shift.closedAt,
                            dateLocale,
                            "—"
                          );
                          const closedDate = formatDate(
                            shift.closedAt,
                            dateLocale,
                            ""
                          );

                          return (
                            <tr key={shift.id}>
                              <td>
                                <span className="staff-table-id">
                                  {shift.id}
                                </span>
                              </td>

                              <td>
                                <div className="staff-table-time">
                                  <span className="main-time">
                                    {openedTime}
                                  </span>
                                  <span className="sub-date">
                                    {openedDate}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="staff-table-time">
                                  <span className="main-time">
                                    {closedTime}
                                  </span>
                                  <span className="sub-date">
                                    {closedDate}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <strong style={{ color: "#0f172a" }}>
                                  {money(shift.openingCash)}
                                </strong>
                              </td>

                              <td>
                                <span
                                  className="staff-table-badge"
                                  style={{
                                    background: "#eff6ff",
                                    color: "#2563eb",
                                  }}
                                >
                                  {t("profile.history.transactionCount", {
                                    count: transactions.length,
                                  })}
                                </span>
                              </td>

                              <td>
                                <span
                                  className="staff-table-badge"
                                  style={{
                                    background: "#fef2f2",
                                    color: "#ef4444",
                                  }}
                                >
                                  {t("profile.history.closed")}
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

              <div
                className="staff-profile-modal-footer"
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  className="btn-modern btn-modern-primary"
                  style={{ padding: "12px 32px", width: "auto" }}
                  onClick={() => setActiveModal(null)}
                >
                  {t("profile.actions.close")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, alignRight = false, noBorder = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: noBorder ? 0 : "18px",
        borderBottom: noBorder ? "none" : "1px dashed #e2e8f0",
        gap: "16px",
      }}
    >
      <span
        style={{
          color: "#64748b",
          fontWeight: "700",
          fontSize: "15px",
          whiteSpace: "nowrap",
        }}
      >
        {icon} {label}
      </span>

      <strong
        style={{
          color: "#0f172a",
          fontSize: "15px",
          textAlign: alignRight ? "right" : "left",
          maxWidth: alignRight ? "60%" : "none",
          wordBreak: "break-word",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ShiftMetric({ label, value, variant = "default" }) {
  const styleMap = {
    default: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      labelColor: "#64748b",
      valueColor: "#0f172a",
    },
    blue: {
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      labelColor: "#2563eb",
      valueColor: "#1d4ed8",
    },
    red: {
      background: "#fef2f2",
      border: "1px solid #fecaca",
      labelColor: "#dc2626",
      valueColor: "#b91c1c",
    },
  };

  const current = styleMap[variant] || styleMap.default;

  return (
    <div
      style={{
        background: current.background,
        padding: "20px",
        borderRadius: "18px",
        border: current.border,
      }}
    >
      <span
        style={{
          color: current.labelColor,
          fontSize: "13px",
          fontWeight: "800",
          display: "block",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          fontSize: variant === "red" ? "24px" : "26px",
          color: current.valueColor,
          fontWeight: "900",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ModalHeader({ icon, title, iconBg, iconColor, onClose }) {
  return (
    <div className="staff-profile-modal-header">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
          }}
        >
          {icon}
        </div>

        <h3>{title}</h3>
      </div>

      <button
        type="button"
        className="staff-profile-modal-close-btn"
        onClick={onClose}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  required = false,
}) {
  return (
    <div className="staff-modal-form-group">
      <div className="staff-modal-label-row">
        <label>{label}</label>
      </div>

      <div className="staff-modal-input-group">
        <div className="staff-modal-input-icon">{icon}</div>

        <input
          type={type}
          className="staff-modal-input staff-modal-input-with-icon"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, icon }) {
  return (
    <div className="staff-modal-form-group">
      <div className="staff-modal-label-row">
        <label>{label}</label>
      </div>

      <div className="staff-modal-input-group">
        <div
          className="staff-modal-input-icon"
          style={{ top: "14px", alignItems: "flex-start" }}
        >
          {icon}
        </div>

        <textarea
          className="staff-modal-input staff-modal-input-with-icon"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          style={{ paddingTop: "11px", minHeight: "92px", resize: "vertical" }}
        />
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CheckUserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2" />
      <path d="M7.5 13.5a5.5 5.5 0 1 0 3 3L15.5 11.5 18 14l3-3-2.5-2.5L21 6l-3-3-6.5 6.5z" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function EmptyHistoryIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginBottom: "16px", opacity: 0.5 }}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.6" />
      <path d="M16 4.2L22 10.2" />
      <path d="M22 4.2L16 10.2" />
    </svg>
  );
}

export default StaffProfile;