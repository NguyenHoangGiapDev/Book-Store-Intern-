import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/apiClient";

function GoogleLoginSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const handleGoogleSuccess = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const userString = params.get("user");

        if (!userString) {
          if (isMounted) navigate("/login", { replace: true });
          return;
        }

        const googleUser = JSON.parse(userString);
        const userId = googleUser.userId || googleUser.id;

        let user = {
          id: userId,
          userId,
          fullName: googleUser.fullName || googleUser.name || "",
          username: googleUser.fullName || googleUser.name || "",
          email: googleUser.email || "",
          phoneNumber: googleUser.phoneNumber || "",
          avatar: googleUser.avatar || googleUser.avatarUrl || "",
          roleId: Number(googleUser.roleId || 1),
          roleName: googleUser.roleName || "Customer",
        };

        try {
          const dbUser = await apiRequest(`/users/${userId}`);

          user = {
            ...user,
            id: dbUser.id || user.id,
            userId: dbUser.userId || dbUser.id || user.userId,
            fullName: dbUser.fullName || user.fullName,
            username: dbUser.fullName || user.username,
            email: dbUser.email || user.email,
            phoneNumber: dbUser.phoneNumber || user.phoneNumber,
            avatar: dbUser.avatar || dbUser.avatarUrl || dbUser.imageUrl || user.avatar || "",
            roleId: Number(dbUser.roleId || user.roleId || 1),
            roleName: dbUser.roleName || user.roleName || "Customer",
          };
        } catch {
          // Nếu không lấy được user database thì vẫn dùng user Google
        }

        localStorage.setItem("token", "google-login-token");
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("auth", JSON.stringify(user));

        window.dispatchEvent(new Event("authChanged"));
        window.dispatchEvent(new Event("cartUpdated"));

        if (isMounted) {
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Google login success error:", error);

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("auth");

        if (isMounted) {
          navigate("/login", { replace: true });
        }
      }
    };

    handleGoogleSuccess();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <h3>Đang đăng nhập bằng Google...</h3>
    </div>
  );
}

export default GoogleLoginSuccess;