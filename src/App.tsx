import { Container, Center, LoadingOverlay } from "@mantine/core";
import { Routes, Route } from "react-router-dom";
import { createTauriAPI } from "./utils/tauri-api";
import { useEffect } from "react";
import { LoginPage } from "./pages/LoginPage";
import { POSPage } from "./pages/POSPage";
import { AdminPage } from "./pages/AdminPage";
import { UpdateNotification } from "./components/UpdateNotification";
import { useAuth } from "./store/hooks";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  updateActivity,
} from "./store/slices/authSlice";
import { apiEndpoints } from "./lib/api";

function App() {
  const { isAuthenticated, isLoading, tokenExpiresAt, dispatch } = useAuth();

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
      if (
        typeof window !== "undefined" &&
        window.__TAURI__ &&
        !window.electronAPI
      ) {
        const tauriAPI = await createTauriAPI();
        if (tauriAPI) {
          window.electronAPI = tauriAPI;
        }
      }
    };

    initAPI();
  }, []);

  useEffect(() => {
    const checkSession = () => {
      if (isAuthenticated && tokenExpiresAt) {
        const now = new Date();
        const expiry = new Date(tokenExpiresAt);

        if (now > expiry) {
          console.log("Token expired, logging out");
          dispatch(logout());
          return;
        }

        dispatch(updateActivity());
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, tokenExpiresAt, dispatch]);

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

        return true;
      } else {
        dispatch(loginFailure(loginResponse.data.message || "Login failed"));
        return false;
      }
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage = "Login failed";
      if (error.response?.status === 401) {
        errorMessage = "Invalid username or password";
      } else if (error.response?.status === 403) {
        errorMessage = "Account is inactive";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      dispatch(loginFailure(errorMessage));
      return false;
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
