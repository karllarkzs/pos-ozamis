import { useEffect, useState } from "react";
import { Notification, Button, Group, Box } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { onUpdateReady, restartApp } from "../utils/tauri-bridge";

export function UpdateNotification() {
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onUpdateReady((version) => {
      setUpdateVersion(version);
    });

    return unsubscribe;
  }, []);

  const handleRestart = async () => {
    try {
      await restartApp();
    } catch (error) {}
  };

  const handleClose = () => {
    setUpdateVersion(null);
  };

  if (!updateVersion) return null;

  return (
    <Box
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        maxWidth: 400,
      }}
    >
      <Notification
        icon={<IconDownload size={20} />}
        color="blue"
        title="Update Available"
        onClose={handleClose}
        withCloseButton
      >
        <Group gap="xs" mt="xs">
          <Button size="xs" onClick={handleRestart}>
            Restart Now
          </Button>
          <Button size="xs" variant="subtle" onClick={handleClose}>
            Later
          </Button>
        </Group>
      </Notification>
    </Box>
  );
}
