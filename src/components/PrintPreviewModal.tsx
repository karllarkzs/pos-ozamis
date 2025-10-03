import { useState } from "react";
import {
  Modal,
  Stack,
  Group,
  Button,
  Select,
  Paper,
  Text,
  Center,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPrinter, IconFileDownload } from "@tabler/icons-react";

interface PrintPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  type: "products" | "reagents";
}

export function PrintPreviewModal({
  opened,
  onClose,
  type,
}: PrintPreviewModalProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const filterOptions = [
    { value: "all", label: "All Items" },
    { value: "expiring", label: "Expiring/Expired" },
    { value: "low-stock", label: "Low/No Stock" },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);

    notifications.show({
      title: "Print Preview",
      message: "Print API endpoint not yet implemented",
      color: "blue",
    });

    setIsGenerating(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconPrinter size={20} />
          <Text fw={600}>
            Print {type === "products" ? "Products" : "Reagents"}
          </Text>
        </Group>
      }
      size="xl"
      centered
    >
      <Stack gap="md">
        {/* Filter Controls */}
        <Group>
          <Select
            placeholder="Select filter"
            value={filterType}
            onChange={(value) => setFilterType(value || "all")}
            data={filterOptions}
            style={{ flex: 1 }}
          />
          <Button
            leftSection={<IconFileDownload size={16} />}
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={isGenerating}
          >
            Generate
          </Button>
        </Group>

        {/* Document Preview */}
        <Paper
          withBorder
          p="xl"
          style={{
            minHeight: "842px", // A4 height in pixels (approx)
            width: "100%",
            backgroundColor: "white",
          }}
        >
          <Center h="100%">
            <Stack align="center" gap="md">
              <IconPrinter size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="sm">
                Document preview will appear here
              </Text>
              <Text c="dimmed" size="xs">
                Click "Generate" to create the print preview
              </Text>
            </Stack>
          </Center>
        </Paper>

        {/* Actions */}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
          <Button
            leftSection={<IconPrinter size={16} />}
            onClick={() => window.print()}
            disabled
          >
            Print
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
