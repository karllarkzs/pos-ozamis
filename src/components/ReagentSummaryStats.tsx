import { useEffect } from "react";
import { Paper, Group, Text, Skeleton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconFlask,
  IconDroplet,
  IconAlertTriangle,
  IconClock,
  IconCurrencyPeso,
} from "@tabler/icons-react";
import { useReagentSummary } from "../hooks/api/useReagents";
import { formatCurrency } from "../utils/currency";

interface ReagentSummaryStatsProps {
  onFilterClick?: (filterType: string) => void;
}

export function ReagentSummaryStats({
  onFilterClick,
}: ReagentSummaryStatsProps) {
  const { data: summary, isLoading, error } = useReagentSummary();

  
  useEffect(() => {
    if (error) {
      notifications.show({
        title: "Error Loading Reagent Summary",
        message:
          "Failed to load reagent statistics. Please try refreshing the page.",
        color: "red",
      });
    }
  }, [error]);

  if (isLoading || error) {
    return (
      <div style={{ marginTop: "0.5rem" }}>
        <Group gap="xs" wrap="wrap" justify="center">
          <Skeleton height={32} width={120} radius="xl" />
          <Skeleton height={32} width={100} radius="xl" />
          <Skeleton height={32} width={90} radius="xl" />
          <Skeleton height={32} width={110} radius="xl" />
          <Skeleton height={32} width={130} radius="xl" />
          <Skeleton height={32} width={140} radius="xl" />
          <Skeleton height={32} width={120} radius="xl" />
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
        >
          <IconFlask size={16} color="#1971c2" />
          <Text size="sm" fw={500} c="#1971c2">
            {summary?.totalReagents || 0}
          </Text>
          <Text size="xs" c="#495057">
            Total Reagents
          </Text>
        </Paper>

        <Paper
          p="xs"
          radius="xl"
          style={{
            backgroundColor: "#fff4e6",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor:
              (summary?.lowStockReagents ?? 0) > 0 ? "pointer" : "default",
            transition: "transform 0.1s ease",
            opacity: (summary?.lowStockReagents ?? 0) > 0 ? 1 : 0.7,
          }}
          onMouseDown={(e) => {
            if ((summary?.lowStockReagents ?? 0) > 0) {
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
            (summary?.lowStockReagents ?? 0) > 0 && handleChipClick("low-stock")
          }
        >
          <IconAlertTriangle size={16} color="#e8590c" />
          <Text size="sm" fw={500} c="#e8590c">
            {summary?.lowStockReagents || 0}
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
            cursor: (summary?.expiredReagents ?? 0) > 0 ? "pointer" : "default",
            transition: "transform 0.1s ease",
            opacity: (summary?.expiredReagents ?? 0) > 0 ? 1 : 0.7,
          }}
          onMouseDown={(e) => {
            if ((summary?.expiredReagents ?? 0) > 0) {
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
            (summary?.expiredReagents ?? 0) > 0 && handleChipClick("expired")
          }
        >
          <IconAlertTriangle size={16} color="#e03131" />
          <Text size="sm" fw={500} c="#e03131">
            {summary?.expiredReagents || 0}
          </Text>
          <Text size="xs" c="#495057">
            Expired
          </Text>
        </Paper>

        {summary?.expiringSoonReagents !== undefined && (
          <Paper
            p="xs"
            radius="xl"
            style={{
              backgroundColor: "#fff9db",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor:
                (summary?.expiringSoonReagents ?? 0) > 0
                  ? "pointer"
                  : "default",
              transition: "transform 0.1s ease",
              opacity: (summary?.expiringSoonReagents ?? 0) > 0 ? 1 : 0.7,
            }}
            onMouseDown={(e) => {
              if ((summary?.expiringSoonReagents ?? 0) > 0) {
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
              (summary?.expiringSoonReagents ?? 0) > 0 &&
              handleChipClick("expiring-soon")
            }
          >
            <IconClock size={16} color="#f08c00" />
            <Text size="sm" fw={500} c="#f08c00">
              {summary?.expiringSoonReagents || 0}
            </Text>
            <Text size="xs" c="#495057">
              Expiring Soon
            </Text>
          </Paper>
        )}

        <Paper
          p="xs"
          radius="xl"
          style={{
            backgroundColor: "#e3f2fd",
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
          onClick={() => handleChipClick("charge-based")}
        >
          <IconFlask size={16} color="#1976d2" />
          <Text size="sm" fw={500} c="#1976d2">
            {summary?.chargeBasedReagents || 0}
          </Text>
          <Text size="xs" c="#495057">
            Charge-Based
          </Text>
        </Paper>

        <Paper
          p="xs"
          radius="xl"
          style={{
            backgroundColor: "#e0f2f1",
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
          onClick={() => handleChipClick("volume-based")}
        >
          <IconDroplet size={16} color="#388e3c" />
          <Text size="sm" fw={500} c="#388e3c">
            {summary?.volumeBasedReagents || 0}
          </Text>
          <Text size="xs" c="#495057">
            Volume-Based
          </Text>
        </Paper>

        <Paper
          p="xs"
          radius="xl"
          style={{
            backgroundColor: "#e6fcf5",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "default",
          }}
        >
          <IconCurrencyPeso size={16} color="#37b24d" />
          <Text size="sm" fw={500} c="#37b24d">
            {summary ? formatCurrency(summary.totalInventoryValue) : "₱0.00"}
          </Text>
          <Text size="xs" c="#495057">
            Total Value
          </Text>
        </Paper>
      </Group>
    </div>
  );
}
