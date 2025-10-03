import { SimpleGrid, Group, Text, Paper, Badge, Stack } from "@mantine/core";
import {
  IconCashBanknote,
  IconShoppingCart,
  IconChartPie3,
  IconPackage,
  IconTrendingUp,
  IconUsers,
  IconTestPipe,
  IconCalendarEvent,
} from "@tabler/icons-react";
import { StatsCard } from "./StatsCard";
import { useDashboardOverview } from "../hooks/api/useReports";
import { formatCurrency } from "../utils/currency";

type PeriodOption =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "thisMonth"
  | "thisYear";

interface ComprehensiveDashboardOverviewProps {
  period?: PeriodOption;
  startDate?: string;
  endDate?: string;
}

export function ComprehensiveDashboardOverview({
  period = "today",
}: ComprehensiveDashboardOverviewProps) {
  const { data: overview, isLoading, error } = useDashboardOverview(period);

  if (error) {
    return (
      <Paper p="md" withBorder>
        <Text color="red">Failed to load dashboard data</Text>
      </Paper>
    );
  }

  
  const getTrendData = (current: number) => {
    if (current === 0) return { value: "0.0%", isPositive: true };
    return {
      value: `+${current > 0 ? current.toFixed(1) : "0.0"}%`,
      isPositive: current >= 0,
    };
  };

  
  const getPeriodText = () => {
    switch (period) {
      case "today":
        return "Today's Performance";
      case "yesterday":
        return "Yesterday's Performance";
      case "thisWeek":
        return "This Week's Performance";
      case "thisMonth":
        return "This Month's Performance";
      case "thisYear":
        return "This Year's Performance";
      default:
        return "Custom Period Performance";
    }
  };

  return (
    <Stack gap="lg">
      {}
      <Paper
        withBorder
        p="md"
        style={{ backgroundColor: "var(--mantine-color-blue-0)" }}
      >
        <Group mb="md" align="center">
          <IconCalendarEvent size={18} color="var(--mantine-color-blue-6)" />
          <Text size="lg" fw={600} c="blue.7">
            {getPeriodText()}
          </Text>
          <Badge variant="light" color="blue" size="sm">
            Date Filtered
          </Badge>
        </Group>

        <Text size="sm" c="dimmed">
          Key business metrics for your selected time period
        </Text>
      </Paper>

      {}
      <Paper withBorder p="md">
        <Group mb="md" align="center">
          <IconCashBanknote size={18} />
          <Text fw={600}>Financial Performance</Text>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(overview?.totalRevenue || 0)}
            trend={
              overview?.totalRevenue
                ? { value: "+10.0%", isPositive: true }
                : undefined
            }
            icon={<IconCashBanknote size={20} />}
            color="green"
            loading={isLoading}
          />

          <StatsCard
            title="Total Profit"
            value={formatCurrency(overview?.totalProfit || 0)}
            trend={
              overview?.totalProfit
                ? { value: "+10.0%", isPositive: true }
                : undefined
            }
            icon={<IconTrendingUp size={20} />}
            color="teal"
            loading={isLoading}
          />

          <StatsCard
            title="Profit Margin"
            value={
              overview?.profitMargin
                ? `${overview.profitMargin.toFixed(1)}%`
                : "0%"
            }
            trend={
              overview?.profitMargin
                ? { value: "+10.0%", isPositive: true }
                : undefined
            }
            icon={<IconChartPie3 size={20} />}
            color="violet"
            loading={isLoading}
          />

          <StatsCard
            title="Avg Transaction"
            value={formatCurrency(overview?.averageTransactionValue || 0)}
            icon={<IconUsers size={20} />}
            color="indigo"
            loading={isLoading}
          />
        </SimpleGrid>
      </Paper>

      {}
      <Paper withBorder p="md">
        <Group mb="md" align="center">
          <IconShoppingCart size={18} />
          <Text fw={600}>Sales Activity</Text>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
          <StatsCard
            title="Transactions"
            value={overview?.transactionsCount || 0}
            trend={
              overview ? getTrendData(overview.transactionsCount) : undefined
            }
            icon={<IconShoppingCart size={20} />}
            color="blue"
            loading={isLoading}
          />

          <StatsCard
            title="Products Sold"
            value={overview?.productsSold || 0}
            icon={<IconPackage size={20} />}
            color="orange"
            loading={isLoading}
          />

          <StatsCard
            title="Tests Performed"
            value={overview?.testsPerformed || 0}
            icon={<IconTestPipe size={20} />}
            color="cyan"
            loading={isLoading}
          />

          <StatsCard
            title="Items per Transaction"
            value={
              overview && overview.transactionsCount > 0
                ? (
                    (overview.productsSold + overview.testsPerformed) /
                    overview.transactionsCount
                  ).toFixed(1)
                : "0"
            }
            icon={<IconPackage size={20} />}
            color="gray"
            loading={isLoading}
            description="Average items per transaction"
          />
        </SimpleGrid>
      </Paper>

      {}
      {overview &&
        (overview.topProducts.length > 0 || overview.topTests.length > 0) && (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {}
            {overview.topProducts.length > 0 && (
              <Paper withBorder p="md">
                <Text fw={600} mb="md">
                  Top Performing Products
                </Text>
                <Stack gap="xs">
                  {overview.topProducts.slice(0, 3).map((product, index) => (
                    <Group key={product.id} justify="space-between">
                      <Group gap="xs">
                        <Badge size="xs" variant="light" color="blue">
                          #{index + 1}
                        </Badge>
                        <Text size="sm" fw={500}>
                          {product.name}
                        </Text>
                      </Group>
                      <Group gap="md">
                        <Text size="xs" c="dimmed">
                          {product.quantity} sold
                        </Text>
                        <Text size="sm" fw={600} c="green">
                          {formatCurrency(product.revenue)}
                        </Text>
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}

            {}
            {overview.topTests.length > 0 && (
              <Paper withBorder p="md">
                <Text fw={600} mb="md">
                  Top Performing Tests
                </Text>
                <Stack gap="xs">
                  {overview.topTests.slice(0, 3).map((test, index) => (
                    <Group key={test.id} justify="space-between">
                      <Group gap="xs">
                        <Badge size="xs" variant="light" color="cyan">
                          #{index + 1}
                        </Badge>
                        <Text size="sm" fw={500}>
                          {test.name}
                        </Text>
                      </Group>
                      <Group gap="md">
                        <Text size="xs" c="dimmed">
                          {test.quantity} performed
                        </Text>
                        <Text size="sm" fw={600} c="green">
                          {formatCurrency(test.revenue)}
                        </Text>
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}
          </SimpleGrid>
        )}
    </Stack>
  );
}
