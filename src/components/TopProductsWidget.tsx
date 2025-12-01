import {
  Paper,
  Title,
  Text,
  Badge,
  Group,
  Stack,
  Skeleton,
  Tabs,
  ScrollArea,
  Progress,
} from "@mantine/core";
import {
  IconPackage,
  IconTrendingUp,
  IconCashBanknote,
  IconCalendarStats,
} from "@tabler/icons-react";
import { useRecentPerformance } from "../hooks/api/useReports";
import { formatCurrency } from "../utils/currency";
import type { TopItem, InventoryMovementItem } from "../hooks/api";

interface ProductItemProps {
  item: TopItem;
  maxRevenue: number;
}

function TopProductItem({ item, maxRevenue }: ProductItemProps) {
  const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

  return (
    <Paper p="sm" withBorder radius="md">
      <Group justify="space-between" align="flex-start" mb="xs">
        <div style={{ flex: 1 }}>
          <Group gap="xs" align="center">
            <Text fw={500} size="sm" lineClamp={1}>
              {item.name}
            </Text>
            <Badge size="xs" color="blue" variant="light">
              #{item.rank}
            </Badge>
          </Group>

          <Group gap="md" mt="xs">
            <Group gap="xs">
              <IconPackage size={14} color="gray" />
              <Text size="xs" color="dimmed">
                {item.quantity} sold
              </Text>
            </Group>
            <Group gap="xs">
              <IconCashBanknote size={14} color="gray" />
              <Text size="xs" color="dimmed">
                {formatCurrency(item.revenue)}
              </Text>
            </Group>
          </Group>
        </div>
      </Group>

      <Progress value={percentage} size="xs" color="blue" mt="sm" />
    </Paper>
  );
}

interface MovementItemProps {
  item: InventoryMovementItem;
  maxScore: number;
}

function MovementItem({ item, maxScore }: MovementItemProps) {
  const percentage = maxScore > 0 ? (item.movementScore / maxScore) * 100 : 0;

  return (
    <Paper p="sm" withBorder radius="md">
      <Group justify="space-between" align="flex-start" mb="xs">
        <div style={{ flex: 1 }}>
          <Group gap="xs" align="center">
            <Text fw={500} size="sm" lineClamp={1}>
              {item.name}
            </Text>
            <Badge size="xs" color="orange" variant="light">
              #{item.rank}
            </Badge>
          </Group>

          <Group gap="md" mt="xs">
            <Group gap="xs">
              <IconTrendingUp size={14} color="gray" />
              <Text size="xs" color="dimmed">
                {item.quantityMoved} moved
              </Text>
            </Group>
            <Group gap="xs">
              <IconCashBanknote size={14} color="gray" />
              <Text size="xs" color="dimmed">
                {formatCurrency(item.revenue)}
              </Text>
            </Group>
          </Group>
        </div>
      </Group>

      <Progress value={percentage} size="xs" color="orange" mt="sm" />

      <Text size="xs" color="dimmed" mt="xs">
        Score: {item.movementScore.toFixed(1)} | {item.movementCount}{" "}
        transactions
      </Text>
    </Paper>
  );
}

function ProductSkeleton() {
  return (
    <Paper p="sm" withBorder radius="md">
      <Group justify="space-between" mb="xs">
        <div style={{ flex: 1 }}>
          <Skeleton height={16} mb={4} />
          <Group gap="md">
            <Skeleton height={12} width={60} />
            <Skeleton height={12} width={80} />
          </Group>
        </div>
      </Group>
      <Skeleton height={4} mt="sm" />
    </Paper>
  );
}

interface TopProductsWidgetProps {
  startDate?: string;
  endDate?: string;
}

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function TopProductsWidget(props: TopProductsWidgetProps = {}) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const startDate = props.startDate || formatDateLocal(sevenDaysAgo);
  const endDate = props.endDate || formatDateLocal(new Date());
  const { topProducts, fastestMoving } = useRecentPerformance();

  const dateRange = { startDate, endDate };

  const isLoading = topProducts.isLoading || fastestMoving.isLoading;
  const hasError = topProducts.error || fastestMoving.error;

  if (hasError) {
    return (
      <Paper
        p="md"
        withBorder
        style={{ backgroundColor: "var(--mantine-color-orange-0)" }}
      >
        <Group mb="sm" align="center">
          <IconCalendarStats size={18} color="var(--mantine-color-orange-6)" />
          <Title order={4} c="orange.7">
            Top Products (Last 7 Days)
          </Title>
          <Badge variant="light" color="orange" size="sm">
            Fixed Period
          </Badge>
        </Group>
        <Text color="red">Failed to load top products data</Text>
      </Paper>
    );
  }

  const topProductsData = topProducts.data || [];
  const fastestMovingData = fastestMoving.data || [];

  const maxRevenue = Math.max(
    ...topProductsData.map((item) => item.revenue),
    0
  );
  const maxMovementScore = Math.max(
    ...fastestMovingData.map((item) => item.movementScore),
    0
  );

  return (
    <Paper
      p="md"
      withBorder
      radius="md"
      style={{ backgroundColor: "var(--mantine-color-orange-0)" }}
    >
      <Group justify="space-between" align="center" mb="sm">
        <Group align="center">
          <IconCalendarStats size={18} color="var(--mantine-color-orange-6)" />
          <Title order={4} c="orange.7">
            Performance Analytics
          </Title>
          <Badge variant="light" color="orange" size="sm">
            Fixed Period
          </Badge>
        </Group>
        <Text size="xs" color="dimmed">
          Last 7 days ({dateRange.startDate} to {dateRange.endDate})
        </Text>
      </Group>
      <Text size="sm" c="dimmed" mb="md">
        Recent 7-day performance - not affected by date filter selection
      </Text>

      <Tabs defaultValue="topSelling">
        <Tabs.List mb="md">
          <Tabs.Tab
            value="topSelling"
            leftSection={<IconCashBanknote size={16} />}
          >
            Top Selling
          </Tabs.Tab>
          <Tabs.Tab
            value="fastestMoving"
            leftSection={<IconTrendingUp size={16} />}
          >
            Fastest Moving
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="topSelling">
          <ScrollArea h={400}>
            <Stack gap="sm">
              {isLoading
                ? Array(5)
                    .fill(0)
                    .map((_, i) => <ProductSkeleton key={i} />)
                : topProductsData.map((item) => (
                    <TopProductItem
                      key={item.id}
                      item={item}
                      maxRevenue={maxRevenue}
                    />
                  ))}
              {!isLoading && topProductsData.length === 0 && (
                <Text color="dimmed" ta="center" py="xl">
                  No sales data available for this period
                </Text>
              )}
            </Stack>
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="fastestMoving">
          <ScrollArea h={400}>
            <Stack gap="sm">
              {isLoading
                ? Array(5)
                    .fill(0)
                    .map((_, i) => <ProductSkeleton key={i} />)
                : fastestMovingData.map((item) => (
                    <MovementItem
                      key={item.id}
                      item={item}
                      maxScore={maxMovementScore}
                    />
                  ))}
              {!isLoading && fastestMovingData.length === 0 && (
                <Text color="dimmed" ta="center" py="xl">
                  No movement data available for this period
                </Text>
              )}
            </Stack>
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}
