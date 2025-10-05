import React, { useState, useEffect } from "react";
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Alert,
  Badge,
  Group,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconLogin,
  IconAlertCircle,
  IconDeviceDesktop,
  IconWorldWww,
} from "@tabler/icons-react";

interface LoginPageProps {
  onLogin: (
    username: string,
    password: string
  ) => Promise<{
    success: boolean;
    error: string | null;
    errors?: Record<string, string[]>;
  }>;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTauri, setIsTauri] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkTauri = async () => {
      if (!mounted) return;

      const inIframe = window.self !== window.top;
      const hasDirectTauri =
        typeof window !== "undefined" && !!window.__TAURI__;
      const hasAPI = typeof window !== "undefined" && !!window.electronAPI;

      const tauri = hasDirectTauri || (inIframe && hasAPI);
      const desktop = hasDirectTauri || hasAPI;

      if (tauri !== isTauri) setIsTauri(tauri);
      if (desktop !== isDesktop) setIsDesktop(desktop);
    };

    checkTauri();

    const interval = setInterval(checkTauri, 100);
    const timeout = setTimeout(() => clearInterval(interval), 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isTauri, isDesktop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await onLogin(username, password);
    setLoading(false);
    let errorMsg = result.error || "Login Failed";
    // Check for validation error on password
    if (result.errors && Array.isArray(result.errors.Password)) {
      errorMsg = "Invalid username or password";
    } else if (!result.success && errorMsg !== "Invalid username or password") {
      errorMsg = "Invalid username or password";
    }
    if (
      !result.success ||
      (result.errors && Array.isArray(result.errors.Password))
    ) {
      setError(errorMsg);
      notifications.show({
        title: "Login Failed",
        message: errorMsg,
        color: "red",
        autoClose: 4000,
      });
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#f8f9fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        p="xl"
        shadow="md"
        radius="md"
        withBorder
        style={{ minWidth: 340, maxWidth: 400, width: "100%" }}
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <div style={{ textAlign: "center" }}>
              <Group justify="center" mb="xs" display={"flex"} dir={"column"}>
                <Title order={2}>OCT POS Login</Title>
                <Badge
                  color={isDesktop ? "blue" : "gray"}
                  variant="light"
                  leftSection={
                    isDesktop ? (
                      <IconDeviceDesktop size={12} />
                    ) : (
                      <IconWorldWww size={12} />
                    )
                  }
                >
                  {isTauri ? "Tauri" : isDesktop ? "Desktop" : "Browser"}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" mt={-4}>
                Enter your credentials to continue
              </Text>
            </div>
            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" mb="xs">
                {error}
              </Alert>
            )}
            <TextInput
              label="Username / Email"
              required
              placeholder="Enter username or email"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              size="md"
            />
            <PasswordInput
              label="Password"
              required
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              size="md"
            />
            <Button
              type="submit"
              leftSection={<IconLogin size={16} />}
              size="md"
              loading={loading}
              fullWidth
            >
              Login
            </Button>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}
