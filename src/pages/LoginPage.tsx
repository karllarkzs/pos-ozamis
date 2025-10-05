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
  ) => Promise<{ success: boolean; error: string | null }>;
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

      console.log("=== Tauri Detection Debug ===");
      console.log("In iframe:", inIframe);
      console.log("window.__TAURI__:", window.__TAURI__);
      console.log("window.electronAPI:", window.electronAPI);
      console.log("Setting isTauri:", tauri);
      console.log("Setting isDesktop:", desktop);

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

    if (!result.success && result.error) {
      setError(result.error);
    }

    setLoading(false);
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
      <Paper p="xl" shadow="md" radius="md" withBorder>
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
              <Text c="dimmed" size="sm">
                Enter your credentials to continue
              </Text>
            </div>

            {error && (
              <Alert
                color="red"
                icon={<IconAlertCircle size={16} />}
                title="Login Failed"
              >
                {error}
              </Alert>
            )}

            <TextInput
              label="Username / Email"
              placeholder="Enter username or email"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              required
              size="md"
            />

            <PasswordInput
              label="Password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
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
