import React, { useState } from "react";
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
  onLogin: (username: string, password: string) => Promise<boolean> | boolean;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const success = await onLogin(username, password);

    if (!success) {
      setError("Invalid username or password");
    }

    setLoading(false);
  };

  const isDesktop =
    typeof window !== "undefined" && (window.electronAPI || window.__TAURI__);
  const isTauri = typeof window !== "undefined" && window.__TAURI__;

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
