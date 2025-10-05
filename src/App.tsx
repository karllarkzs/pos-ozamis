import { Container, Center, LoadingOverlay } from "@mantine/core";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { createTauriAPI } from "./utils/tauri-api";
import { useEffect } from "react";
import { LoginPage } from "./pages/LoginPage";
import { POSPage } from "./pages/POSPage";
import { AdminPage } from "./pages/AdminPage";
import { UpdateNotification } from "./components/UpdateNotification";
import { ServerDisconnectedOverlay } from "./components/ServerDisconnectedOverlay";
import { ForbiddenPage } from "./components/ForbiddenPage";
import { NotFoundPage } from "./components/NotFoundPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth, useSettings } from "./store/hooks";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  updateActivity,
  getDefaultRouteForRole,
} from "./store/slices/authSlice";
import {
  fetchSettingsStart,
  fetchSettingsSuccess,
  fetchSettingsFailure,
} from "./store/slices/settingsSlice";
import { apiEndpoints } from "./lib/api";

function RoleBasedRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={getDefaultRouteForRole(user.role) || "/"} replace />;
}

function App() {
  const { isAuthenticated, isLoading, tokenExpiresAt, user, dispatch } =
    useAuth();
  const settings = useSettings();

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const initAPI = async () => {
      if (typeof window !== "undefined" && !window.electronAPI) {
        const tauriAPI = await createTauriAPI();
        if (tauriAPI) {
          window.electronAPI = tauriAPI;
        }
      }
    };

    initAPI();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "CLEAR_PERSIST") {
        try {
          localStorage.removeItem("persist:pharmacy-pos-root");
          localStorage.removeItem("auth-token");
          localStorage.removeItem("defaultPrinter");
        } catch (e) {}
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const checkSession = () => {
      if (isAuthenticated && tokenExpiresAt) {
        const now = new Date();
        const expiry = new Date(tokenExpiresAt);

        if (now > expiry) {
          dispatch(logout());
          localStorage.removeItem("persist:pharmacy-pos-root");
          localStorage.removeItem("auth-token");
          return;
        }

        dispatch(updateActivity());
      }
    };

    const handleUnauthorized = () => {
      dispatch(logout());
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    checkSession();
    const interval = setInterval(checkSession, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [isAuthenticated, tokenExpiresAt, dispatch]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSettings = async () => {
      try {
        settings.dispatch(fetchSettingsStart());
        const response = await apiEndpoints.systemSettings.getAll();

        const settingsObj = {
          storeName:
            response.data.find((s) => s.key === "store_name")?.value ||
            "OCT POS",
          storeOwner:
            response.data.find((s) => s.key === "store_owner")?.value || "",
          storeLocation:
            response.data.find((s) => s.key === "store_location")?.value || "",
          storeContact:
            response.data.find((s) => s.key === "store_contact")?.value || "",
          vatAmount: Number(
            response.data.find((s) => s.key === "vat_amount")?.value || 0
          ),
          showVat:
            response.data.find((s) => s.key === "show_vat")?.value === "true",
        };

        settings.dispatch(fetchSettingsSuccess(settingsObj));
      } catch (error: any) {
        settings.dispatch(
          fetchSettingsFailure(
            error.message || "Failed to load system settings"
          )
        );
      }
    };

    fetchSettings();

    const interval = setInterval(fetchSettings, 300000);

    return () => clearInterval(interval);
  }, [isAuthenticated, settings.dispatch]);

  const handleLogin = async (username: string, password: string) => {
    try {
      dispatch(loginStart());

      const loginResponse = await apiEndpoints.auth.login({
        username,
        password,
      });

      if (loginResponse.data.success) {
        const { accessToken, expiresAt, user } = loginResponse.data.data;

        const userRole = (user as any).roleId || user.role;
        const normalizedUser = {
          ...user,
          role: userRole,
        };

        const allowedRoles = [1, 2, 4];
        if (!allowedRoles.includes(userRole)) {
          const errorMessage =
            "Access denied. This account type is not authorized to log in to the POS system.";
          dispatch(loginFailure(errorMessage));
          return { success: false, error: errorMessage };
        }

        dispatch(
          loginSuccess({
            user: normalizedUser,
            accessToken,
            expiresAt,
          })
        );

        try {
          const profileResponse = await apiEndpoints.auth.getCurrentUser();
          if (profileResponse.data.success) {
            const profileUser = profileResponse.data.data;
            const profileUserRole =
              (profileUser as any).roleId || profileUser.role;
            const normalizedProfileUser = {
              ...profileUser,
              role: profileUserRole,
            };
            dispatch(setUser(normalizedProfileUser));
          }
        } catch (profileError) {}

        return { success: true, error: null };
      } else {
        const errorMessage = loginResponse.data.message || "Login failed";
        dispatch(loginFailure(errorMessage));
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      let errorMessage = "Login failed";
      if (error.response?.status === 401) {
        errorMessage =
          error.response?.data?.message || "Invalid username or password";
      } else if (error.response?.status === 403) {
        errorMessage = error.response?.data?.message || "Account is inactive";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      dispatch(loginFailure(errorMessage));
      return { success: false, error: errorMessage };
    }
  };

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  return (
    <>
      <UpdateNotification />
      <ServerDisconnectedOverlay />
      {!isAuthenticated ? (
        <Routes>
          <Route
            path="/"
            element={
              <Container size="sm">
                <LoginPage onLogin={handleLogin} />
              </Container>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route
            path="/pos"
            element={
              <ProtectedRoute requiredAccess="pos">
                <POSPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredAccess="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      )}
    </>
  );
}

export default App;
