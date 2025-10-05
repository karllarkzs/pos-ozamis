import {
  Modal,
  Stack,
  Text,
  Paper,
  Group,
  Badge,
  Button,
  Alert,
  Loader,
} from "@mantine/core";
import { IconPrinter, IconCheck, IconAlertCircle } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useSettings } from "../store/hooks";

interface PrinterSettingsModalProps {
  opened: boolean;
  onClose: () => void;
}

export function PrinterSettingsModal({
  opened,
  onClose,
}: PrinterSettingsModalProps) {
  const { settings } = useSettings();
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(false);

  const inIframe = typeof window !== "undefined" && window.self !== window.top;
  const isTauri =
    typeof window !== "undefined" &&
    (!!window.__TAURI__ || !!window.electronAPI);
  const hasElectronAPI = typeof window !== "undefined" && !!window.electronAPI;

  useEffect(() => {
    const checkAPI = async () => {
      const maxAttempts = 20;
      for (let i = 0; i < maxAttempts; i++) {
        if (window.electronAPI?.hardware?.getPrinters) {
          console.log("Printer API found!");
          setApiReady(true);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      console.log("Printer API not found after retries");
      setApiReady(false);
    };

    if (opened) {
      checkAPI();

      const saved = localStorage.getItem("defaultPrinter");
      if (saved) {
        setSelectedPrinter(saved);
      }
    }
  }, [opened]);

  useEffect(() => {
    if (opened && apiReady) {
      loadPrinters();
    }
  }, [opened, apiReady]);

  const loadPrinters = async () => {
    setLoading(true);
    setError(null);

    try {
      if (window.electronAPI?.hardware?.getPrinters) {
        console.log("Calling getPrinters...");
        const printerList = await window.electronAPI.hardware.getPrinters();
        console.log("Printers received:", printerList);
        setPrinters(printerList);
      } else {
        console.log("electronAPI not available");
        setError("Printer API not available. Running in browser mode.");
      }
    } catch (err: any) {
      console.error("Failed to load printers - Full error:", err);
      setError(`Failed to load printers: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrinter = (printerName: string) => {
    setSelectedPrinter(printerName);
    localStorage.setItem("defaultPrinter", printerName);
  };

  const handleTestPrint = async (printerName: string) => {
    try {
      if (window.electronAPI?.hardware?.printEscposReceipt) {
        const { generateTestReceiptESCPOS } = await import("../utils/escpos");
        const escposData = generateTestReceiptESCPOS(settings);
        const dataArray = Array.from(escposData);

        const result = await window.electronAPI.hardware.printEscposReceipt(
          printerName,
          dataArray
        );
        console.log("Test print result:", result);
        alert(`✅ ${result}`);
      } else {
        setError("Test print not available in browser mode");
      }
    } catch (err: any) {
      console.error("Test print failed:", err);
      setError(err.message || "Test print failed");
      alert(`❌ Test print failed: ${err.message || err}`);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconPrinter size={20} />
          <Text fw={600}>Printer Settings</Text>
        </Group>
      }
      size="md"
    >
      <Stack gap="md">
        {!isTauri && (
          <Alert color="blue" icon={<IconAlertCircle size={16} />}>
            Printer management is only available in desktop mode (Tauri).
            Running in browser mode.
          </Alert>
        )}

        {isTauri && !apiReady && (
          <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
            Initializing printer API...
          </Alert>
        )}

        {error && (
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        <div>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              Available Printers
            </Text>
            <Button
              size="xs"
              variant="light"
              onClick={loadPrinters}
              loading={loading}
              disabled={!isTauri || !apiReady}
            >
              Refresh
            </Button>
          </Group>

          {loading ? (
            <Group justify="center" p="xl">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Loading printers...
              </Text>
            </Group>
          ) : printers.length === 0 ? (
            <Paper p="md" withBorder>
              <Text size="sm" c="dimmed" ta="center">
                {isTauri && apiReady
                  ? "No printers found"
                  : "Printer detection not available in browser mode"}
              </Text>
            </Paper>
          ) : (
            <Stack gap="xs">
              {printers.map((printer) => (
                <Paper
                  key={printer}
                  p="md"
                  withBorder
                  style={{
                    cursor: "pointer",
                    borderColor:
                      selectedPrinter === printer
                        ? "var(--mantine-color-blue-6)"
                        : undefined,
                    borderWidth: selectedPrinter === printer ? 2 : 1,
                  }}
                  onClick={() => handleSelectPrinter(printer)}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm">
                      <IconPrinter
                        size={20}
                        color={
                          selectedPrinter === printer
                            ? "var(--mantine-color-blue-6)"
                            : undefined
                        }
                      />
                      <div>
                        <Text size="sm" fw={500}>
                          {printer}
                        </Text>
                        {selectedPrinter === printer && (
                          <Badge
                            size="xs"
                            color="blue"
                            leftSection={<IconCheck size={10} />}
                          >
                            Default
                          </Badge>
                        )}
                      </div>
                    </Group>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestPrint(printer);
                      }}
                    >
                      Test
                    </Button>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </div>

        {selectedPrinter && (
          <Alert color="green" icon={<IconCheck size={16} />}>
            <Text size="sm">
              <strong>{selectedPrinter}</strong> is set as your default receipt
              printer
            </Text>
          </Alert>
        )}
      </Stack>
    </Modal>
  );
}
