import { Container, Center, LoadingOverlay } from "@mantine/core";
import { Routes, Route } from "react-router-dom";
import { createTauriAPI } from "./utils/tauri-api";
import { useEffect } from "react";
import { LoginPage } from "./pages/LoginPage";
import { POSPage } from "./pages/POSPage";
import { AdminPage } from "./pages/AdminPage";
import { UpdateNotification } from "./components/UpdateNotification";
import { useAuth, useSettings } from "./store/hooks";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  updateActivity,
} from "./store/slices/authSlice";
import {
  fetchSettingsStart,
  fetchSettingsSuccess,
  fetchSettingsFailure,
} from "./store/slices/settingsSlice";
import { apiEndpoints } from "./lib/api";

function App() {
  const { isAuthenticated, isLoading, tokenExpiresAt, dispatch } = useAuth();
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
          console.log("Tauri API initialized successfully");
        }
      }
    };

    initAPI();

    // Listen for persist clear message from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "CLEAR_PERSIST") {
        console.log("Clearing persisted data on app close");
        // Clear localStorage keys used by redux-persist
        try {
          localStorage.removeItem("persist:pharmacy-pos-root");
          localStorage.removeItem("auth-token");
          localStorage.removeItem("defaultPrinter");
          console.log("Persisted data cleared");
        } catch (e) {
          console.error("Failed to clear localStorage:", e);
        }
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
          console.log("Token expired, logging out");
          dispatch(logout());
          // Also clear persisted data
          localStorage.removeItem("persist:pharmacy-pos-root");
          localStorage.removeItem("auth-token");
          return;
        }

        dispatch(updateActivity());
      }
    };

    // Check session immediately on mount (handles stale data from improper shutdown)
    checkSession();
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, tokenExpiresAt, dispatch]);

  // Fetch system settings on startup and poll every 5 minutes
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        settings.dispatch(fetchSettingsStart());
        const response = await apiEndpoints.systemSettings.getAll();

        // Transform array of settings into flat object structure
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
        console.log("System settings loaded:", settingsObj);
      } catch (error: any) {
        console.error("Failed to fetch system settings:", error);
        settings.dispatch(
          fetchSettingsFailure(
            error.message || "Failed to load system settings"
          )
        );
      }
    };

    // Fetch immediately on startup
    fetchSettings();

    // Poll every 5 minutes (300000ms)
    const interval = setInterval(fetchSettings, 300000);

    return () => clearInterval(interval);
  }, [settings.dispatch]);

  const handleLogin = async (username: string, password: string) => {
    try {
      dispatch(loginStart());

      const loginResponse = await apiEndpoints.auth.login({
        username,
        password,
      });

      if (loginResponse.data.success) {
        const { accessToken, expiresAt, user } = loginResponse.data.data;

        dispatch(
          loginSuccess({
            user,
            accessToken,
            expiresAt,
          })
        );

        try {
          const profileResponse = await apiEndpoints.auth.getCurrentUser();
          if (profileResponse.data.success) {
            dispatch(setUser(profileResponse.data.data));
          }
        } catch (profileError) {
          console.warn("Failed to fetch user profile:", profileError);
        }

        return { success: true, error: null };
      } else {
        const errorMessage = loginResponse.data.message || "Login failed";
        dispatch(loginFailure(errorMessage));
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      console.error("Login error:", error);

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
      {!isAuthenticated ? (
        <Container size="sm" py="xl">
          <Center h="100%" w="100%">
            <LoginPage onLogin={handleLogin} />
          </Center>
        </Container>
      ) : (
        <Routes>
          <Route path="/" element={<POSPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
        </Routes>
      )}
    </>
  );
}

export default App;
