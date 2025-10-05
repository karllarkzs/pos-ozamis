import { useEffect, useState } from "react";
import { Overlay, Paper, Stack, Text, Button, Loader } from "@mantine/core";
import { IconPlugConnectedX } from "@tabler/icons-react";
import { useAuth } from "../store/hooks";
import { logout } from "../store/slices/authSlice";

export function ServerDisconnectedOverlay() {
  const [isDisconnected, setIsDisconnected] = useState(false);
  const { dispatch } = useAuth();

  useEffect(() => {
    const handleServerDisconnected = () => {
      setIsDisconnected(true);
    };

    const handleServerReconnected = () => {
      setIsDisconnected(false);
    };

    window.addEventListener("server:disconnected", handleServerDisconnected);
    window.addEventListener("server:reconnected", handleServerReconnected);

    return () => {
      window.removeEventListener(
        "server:disconnected",
        handleServerDisconnected
      );
      window.removeEventListener("server:reconnected", handleServerReconnected);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("persist:pharmacy-pos-root");
    localStorage.removeItem("defaultPrinter");
    dispatch(logout());
    window.location.href = "/";
  };

  if (!isDisconnected) return null;

  return (
    <Overlay
      fixed
      opacity={0.95}
      color="#000"
      zIndex={9999}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        p="xl"
        radius="md"
        shadow="xl"
        withBorder
        bg="white"
        style={{ maxWidth: 450, width: "90%" }}
      >
        <Stack align="center" gap="lg">
          <IconPlugConnectedX size={80} color="var(--mantine-color-red-6)" />
          <Stack gap="xs" align="center">
            <Text size="xl" fw={700}>
              Server Disconnected
            </Text>
            <Loader size="md" color="red" />
            <Text size="md" c="dimmed" ta="center" fw={500}>
              Attempting to reconnect to the server...
            </Text>
          </Stack>
          <Text size="sm" c="dimmed" ta="center">
            If the connection cannot be restored, please log out and try again
            later.
          </Text>
          <Button
            color="red"
            variant="filled"
            onClick={handleLogout}
            fullWidth
            size="md"
          >
            Log Out
          </Button>
        </Stack>
      </Paper>
    </Overlay>
  );
}
