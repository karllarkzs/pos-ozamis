import {
  Paper,
  Title,
  Alert,
  Text,
  Badge,
  Group,
  Stack,
  Skeleton,
  Tabs,
  ScrollArea,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconClock,
  IconPackageOff,
  IconExclamationCircle,
  IconCheck,
  IconDatabase,
} from "@tabler/icons-react";
import { useInventoryAlerts } from "../hooks/api/useReports";

interface InventoryAlertItemProps {
  name: string;
  currentStock: number;
  minimumStock?: number;
  daysUntilExpiry?: number;
  status: string;
  recommendation: string;
}

function InventoryAlertItem({
  name,
  currentStock,
  minimumStock,
  daysUntilExpiry,
  status,
  recommendation,
}: InventoryAlertItemProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "low stock":
        return "yellow";
      case "no stock":
        return "red";
      case "expiring":
        return "orange";
      case "expired":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "low stock":
        return <IconAlertTriangle size={16} />;
      case "no stock":
        return <IconPackageOff size={16} />;
      case "expiring":
      case "expired":
        return <IconClock size={16} />;
      default:
        return <IconExclamationCircle size={16} />;
    }
  };

  return (
    <Paper p="sm" withBorder radius="md">
      <Group justify="space-between" align="flex-start" mb="xs">
        <div style={{ flex: 1 }}>
          <Text fw={500} size="sm">
            {name}
          </Text>
          <Group gap="xs" mt={4}>
            <Badge
              size="xs"
              color={getStatusColor(status)}
              leftSection={getStatusIcon(status)}
            >
              {status}
            </Badge>
            {minimumStock && (
              <Text size="xs" color="dimmed">
                {currentStock}/{minimumStock} stock
              </Text>
            )}
            {daysUntilExpiry !== undefined && (
              <Text size="xs" color="dimmed">
                {daysUntilExpiry > 0
                  ? `${daysUntilExpiry} days left`
                  : "Expired"}
              </Text>
            )}
          </Group>
        </div>
      </Group>

      <Text size="xs" color="dimmed" mt="xs">
        {recommendation}
      </Text>
    </Paper>
  );
}

function AlertSkeleton() {
  return (
    <Paper p="sm" withBorder radius="md">
      <Group justify="space-between" mb="xs">
        <div style={{ flex: 1 }}>
          <Skeleton height={16} mb={4} />
          <Group gap="xs">
            <Skeleton height={20} width={80} />
            <Skeleton height={12} width={60} />
          </Group>
        </div>
      </Group>
      <Skeleton height={12} mt="xs" />
    </Paper>
  );
}

export function InventoryAlerts() {
  const { lowStock, expiring, expired } = useInventoryAlerts();

  const isLoading =
    lowStock.isLoading || expiring.isLoading || expired.isLoading;
  const hasError = lowStock.error || expiring.error || expired.error;

  if (hasError) {
    return (
      <Paper
        p="md"
        withBorder
        style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
      >
        <Group mb="sm" align="center">
          <IconDatabase size={18} color="var(--mantine-color-gray-6)" />
          <Title order={4} c="gray.7">
            Inventory Alerts
          </Title>
          <Badge variant="light" color="gray" size="sm">
            Real-time
          </Badge>
        </Group>
        <Alert color="red" title="Error">
          Failed to load inventory alerts. Please try again later.
        </Alert>
      </Paper>
    );
  }

  const lowStockCount = lowStock.data?.length || 0;
  const expiringCount = expiring.data?.length || 0;
  const expiredCount = expired.data?.length || 0;

  return (
    <Paper
      p="md"
      withBorder
      radius="md"
      style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
    >
      <Group justify="space-between" align="center" mb="sm">
        <Group align="center">
          <IconDatabase size={18} color="var(--mantine-color-gray-6)" />
          <Title order={4} c="gray.7">
            Inventory Alerts
          </Title>
          <Badge variant="light" color="gray" size="sm">
            Real-time
          </Badge>
        </Group>
        <Group gap="xs">
          {expiredCount > 0 && (
            <Badge color="red" variant="filled">
              {expiredCount} Expired
            </Badge>
          )}
          {lowStockCount > 0 && (
            <Badge color="yellow" variant="light">
              {lowStockCount} Low Stock
            </Badge>
          )}
          {expiringCount > 0 && (
            <Badge color="orange" variant="light">
              {expiringCount} Expiring (30d)
            </Badge>
          )}
        </Group>
      </Group>
      <Text size="sm" c="dimmed" mb="md">
        Current inventory status - updates in real-time, not affected by date
        filters
      </Text>

      {!isLoading &&
      lowStockCount === 0 &&
      expiringCount === 0 &&
      expiredCount === 0 ? (
        <Alert color="green" title="All Good!" icon={<IconCheck size={16} />}>
          No inventory alerts at this time. All items are well-stocked and
          fresh.
        </Alert>
      ) : (
        <Tabs defaultValue="expired">
          <Tabs.List mb="md">
            <Tabs.Tab
              value="expired"
              leftSection={<IconExclamationCircle size={16} />}
            >
              Expired ({expiredCount})
            </Tabs.Tab>
            <Tabs.Tab
              value="lowStock"
              leftSection={<IconAlertTriangle size={16} />}
            >
              Low Stock ({lowStockCount})
            </Tabs.Tab>
            <Tabs.Tab value="expiring" leftSection={<IconClock size={16} />}>
              Expiring (30 days) ({expiringCount})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="expired">
            <ScrollArea h={300}>
              <Stack gap="sm">
                {isLoading
                  ? Array(3)
                      .fill(0)
                      .map((_, i) => <AlertSkeleton key={i} />)
                  : expired.data?.map((item) => (
                      <InventoryAlertItem
                        key={item.id}
                        name={item.name}
                        currentStock={item.currentStock}
                        minimumStock={item.minimumStock}
                        daysUntilExpiry={item.daysUntilExpiry}
                        status={item.status}
                        recommendation={item.recommendation}
                      />
                    ))}
                {!isLoading && expired.data?.length === 0 && (
                  <Text size="sm" c="dimmed">
                    No expired items
                  </Text>
                )}
              </Stack>
            </ScrollArea>
          </Tabs.Panel>

          <Tabs.Panel value="lowStock">
            <ScrollArea h={300}>
              <Stack gap="sm">
                {isLoading
                  ? Array(3)
                      .fill(0)
                      .map((_, i) => <AlertSkeleton key={i} />)
                  : lowStock.data?.map((item) => (
                      <InventoryAlertItem
                        key={item.id}
                        name={item.name}
                        currentStock={item.currentStock}
                        minimumStock={item.minimumStock}
                        status={item.status}
                        recommendation={item.recommendation}
                      />
                    ))}
                {!isLoading && lowStockCount === 0 && (
                  <Text color="dimmed" ta="center" py="xl">
                    No low stock items
                  </Text>
                )}
              </Stack>
            </ScrollArea>
          </Tabs.Panel>

          <Tabs.Panel value="expiring">
            <ScrollArea h={300}>
              <Stack gap="sm">
                {isLoading
                  ? Array(3)
                      .fill(0)
                      .map((_, i) => <AlertSkeleton key={i} />)
                  : expiring.data?.map((item) => (
                      <InventoryAlertItem
                        key={item.id}
                        name={item.name}
                        currentStock={item.currentStock}
                        daysUntilExpiry={item.daysUntilExpiry}
                        status={item.status}
                        recommendation={item.recommendation}
                      />
                    ))}
                {!isLoading && expiringCount === 0 && (
                  <Text color="dimmed" ta="center" py="xl">
                    No items expiring in the next 30 days
                  </Text>
                )}
              </Stack>
            </ScrollArea>
          </Tabs.Panel>
        </Tabs>
      )}
    </Paper>
  );
}
