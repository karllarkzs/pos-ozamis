import { useEffect } from "react";
import { Paper, Group, Text, Skeleton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconPackage,
  IconPackageOff,
  IconExclamationMark,
  IconClock,
  IconCurrencyPeso,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useProductSummary } from "../hooks/api/useProducts";
import { formatCurrency } from "../utils/currency";

interface ProductSummaryStatsProps {
  onFilterClick?: (filterType: string) => void;
}

export function ProductSummaryStats({
  onFilterClick,
}: ProductSummaryStatsProps) {
  const { data: summary, isLoading, error } = useProductSummary();

  useEffect(() => {
    if (error) {
      notifications.show({
        title: "Error Loading Product Summary",
        message:
          "Failed to load product statistics. Please try refreshing the page.",
        color: "red",
      });
    }
  }, [error]);

  if (isLoading || error) {
    return (
      <div style={{ marginTop: "0.5rem" }}>
        <Group gap="xs" wrap="wrap" justify="center">
          <Skeleton height={32} width={140} radius="xl" />
          <Skeleton height={32} width={120} radius="xl" />
          <Skeleton height={32} width={100} radius="xl" />
          <Skeleton height={32} width={90} radius="xl" />
          <Skeleton height={32} width={110} radius="xl" />
          <Skeleton height={32} width={130} radius="xl" />
          <Skeleton height={32} width={160} radius="xl" />
        </Group>
      </div>
    );
  }

  const handleChipClick = (filterType: string) => {
    if (onFilterClick) {
      onFilterClick(filterType);
    }
  };

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <Group gap="xs" wrap="wrap" justify="center">
        <Paper
          p="xs"
          radius="xl"
          style={{
            backgroundColor: "#e7f5ff",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            transition: "transform 0.1s ease",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.98)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onClick={() => handleChipClick("all")}
        >
          <IconPackage size={16} color="#1971c2" />
          <Text size="sm" fw={500} c="#1971c2">
            {summary?.totalProducts || 0}
          </Text>
          <Text size="xs" c="#495057">
            Total Products
          </Text>
        </Paper>

        <Paper
          p="xs"
          radius="xl"
          style={{
            backgroundColor: "#fef3c7",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor:
              (summary?.lowStockProducts ?? 0) > 0 ? "pointer" : "default",
            transition: "transform 0.1s ease",
            opacity: (summary?.lowStockProducts ?? 0) > 0 ? 1 : 0.7,
          }}
          onMouseDown={(e) => {
            if ((summary?.lowStockProducts ?? 0) > 0) {
              e.currentTarget.style.transform = "scale(0.98)";
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onClick={() =>
            (summary?.lowStockProducts ?? 0) > 0 && handleChipClick("low-stock")
          }
        >
          <IconExclamationMark size={16} color="#d97706" />
          <Text size="sm" fw={500} c="#d97706">
            {summary?.lowStockProducts || 0}
          </Text>
          <Text size="xs" c="#495057">
            Low Stock
          </Text>
        </Paper>

        <Paper
          p="xs"
          radius="xl"
          style={{
            backgroundColor: "#ffe8e8",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: (summary?.noStockProducts ?? 0) > 0 ? "pointer" : "default",
            transition: "transform 0.1s ease",
            opacity: (summary?.noStockProducts ?? 0) > 0 ? 1 : 0.7,
          }}
          onMouseDown={(e) => {
            if ((summary?.noStockProducts ?? 0) > 0) {
              e.currentTarget.style.transform = "scale(0.98)";
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onClick={() =>
            (summary?.noStockProducts ?? 0) > 0 && handleChipClick("no-stock")
          }
        >
          <IconPackageOff size={16} color="#e03131" />
          <Text size="sm" fw={500} c="#e03131">
            {summary?.noStockProducts || 0}
          </Text>
          <Text size="xs" c="#495057">
            No Stock
          </Text>
        </Paper>

        <Paper
          p="xs"
          radius="xl"
          style={{
            backgroundColor: "#fee2e2",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: (summary?.expiredProducts ?? 0) > 0 ? "pointer" : "default",
            transition: "transform 0.1s ease",
            opacity: (summary?.expiredProducts ?? 0) > 0 ? 1 : 0.7,
          }}
          onMouseDown={(e) => {
            if ((summary?.expiredProducts ?? 0) > 0) {
              e.currentTarget.style.transform = "scale(0.98)";
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onClick={() =>
            (summary?.expiredProducts ?? 0) > 0 && handleChipClick("expired")
          }
        >
          <IconAlertCircle size={16} color="#dc2626" />
          <Text size="sm" fw={500} c="#dc2626">
            {summary?.expiredProducts || 0}
          </Text>
          <Text size="xs" c="#495057">
            Expired
          </Text>
        </Paper>

        <Paper
          p="xs"
          radius="xl"
          style={{
            backgroundColor: "#fed7aa",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor:
              (summary?.expiringSoonProducts ?? 0) > 0 ? "pointer" : "default",
            transition: "transform 0.1s ease",
            opacity: (summary?.expiringSoonProducts ?? 0) > 0 ? 1 : 0.7,
          }}
          onMouseDown={(e) => {
            if ((summary?.expiringSoonProducts ?? 0) > 0) {
              e.currentTarget.style.transform = "scale(0.98)";
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onClick={() =>
            (summary?.expiringSoonProducts ?? 0) > 0 &&
            handleChipClick("expiring-soon")
          }
        >
          <IconClock size={16} color="#ea580c" />
          <Text size="sm" fw={500} c="#ea580c">
            {summary?.expiringSoonProducts || 0}
          </Text>
          <Text size="xs" c="#495057">
            Expiring Soon
          </Text>
        </Paper>
      </Group>
    </div>
  );
}
