import { SimpleGrid, Group, Text, Paper, Badge } from "@mantine/core";
import {
  IconCashBanknote,
  IconShoppingCart,
  IconChartPie3,
  IconPackage,
  IconTrendingUp,
  IconTestPipe,
  IconCalendarEvent,
  IconCreditCard,
} from "@tabler/icons-react";
import { StatsCard } from "./StatsCard";
import {
  useDashboardOverview,
  useDashboardOverviewCustom,
  usePaymentMethodBreakdown,
} from "../hooks/api/useReports";
import { formatCurrency } from "../utils/currency";

type PeriodOption =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "thisMonth"
  | "thisYear";

interface DashboardOverviewProps {
  period?: PeriodOption;
  startDate?: string;
  endDate?: string;
}

export function DashboardOverview({
  period = "today",
  startDate,
  endDate,
}: DashboardOverviewProps) {
  
  
  const { data: overview, isLoading } =
    startDate && endDate
      ? useDashboardOverviewCustom(startDate, endDate)
      : useDashboardOverview(period);

  
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateLocal(new Date());

  
  const { data: paymentBreakdown, isLoading: paymentLoading } =
    usePaymentMethodBreakdown(startDate || todayStr, endDate || todayStr);

  
  const getTrendData = (current: number) => ({
    value: `+${(((current * 0.1) / current) * 100).toFixed(1)}%`, 
    isPositive: true,
  });

  return (
    <div>
      {}
      <Paper
        withBorder
        p="md"
        mb="lg"
        style={{ backgroundColor: "var(--mantine-color-blue-0)" }}
      >
        <Group mb="md" align="center">
          <IconCalendarEvent size={18} color="var(--mantine-color-blue-6)" />
          <Text size="lg" fw={600} c="blue.7">
            Financial Performance
          </Text>
          <Badge variant="light" color="blue" size="sm">
            Date Filtered
          </Badge>
        </Group>
        <Text size="sm" c="dimmed" mb="md">
          These metrics change based on your selected date range
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="sm">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(overview?.totalRevenue || 0)}
            trend={overview ? getTrendData(overview.totalRevenue) : undefined}
            icon={<IconCashBanknote size={20} />}
            color="green"
            loading={isLoading}
          />

          <StatsCard
            title="Total Profit"
            value={formatCurrency(overview?.totalProfit || 0)}
            trend={overview ? getTrendData(overview.totalProfit) : undefined}
            icon={<IconTrendingUp size={20} />}
            color="teal"
            loading={isLoading}
          />

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
            title="Profit Margin"
            value={overview ? `${overview.profitMargin.toFixed(1)}%` : "0%"}
            trend={overview ? getTrendData(overview.profitMargin) : undefined}
            icon={<IconChartPie3 size={20} />}
            color="violet"
            loading={isLoading}
          />
        </SimpleGrid>
      </Paper>

      {}
      <Paper
        withBorder
        p="md"
        mb="lg"
        style={{ backgroundColor: "var(--mantine-color-blue-0)" }}
      >
        <Group mb="md" align="center">
          <IconCalendarEvent size={18} color="var(--mantine-color-blue-6)" />
          <Text size="lg" fw={600} c="blue.7">
            Sales Activity
          </Text>
          <Badge variant="light" color="blue" size="sm">
            Date Filtered
          </Badge>
        </Group>
        <Text size="sm" c="dimmed" mb="md">
          Activity metrics for your selected time period
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="sm">
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
            title="Cash Payments"
            value={formatCurrency(paymentBreakdown?.Cash || 0)}
            icon={<IconCashBanknote size={20} />}
            color="green"
            loading={paymentLoading}
          />
          <StatsCard
            title="GCash Payments"
            value={formatCurrency(
              paymentBreakdown?.GCash || paymentBreakdown?.Gcash || 0
            )}
            icon={<IconCreditCard size={20} />}
            color="blue"
            loading={paymentLoading}
          />

          {}
          {paymentBreakdown &&
            Object.keys(paymentBreakdown)
              .filter(
                (method) =>
                  method !== "Cash" && method !== "GCash" && method !== "Gcash"
              )
              .slice(0, 2)
              .map((method, index) => (
                <StatsCard
                  key={method}
                  title={`${method} Payments`}
                  value={formatCurrency(paymentBreakdown[method] || 0)}
                  icon={<IconCreditCard size={20} />}
                  color={index === 0 ? "purple" : "teal"}
                  loading={paymentLoading}
                />
              ))}
        </SimpleGrid>
      </Paper>
    </div>
  );
}
