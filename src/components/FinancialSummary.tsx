import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Skeleton,
  Divider,
  RingProgress,
  SimpleGrid,
  Badge,
} from "@mantine/core";
import {
  IconCashBanknote,
  IconCreditCard,
  IconTrendingUp,
  IconReceiptTax,
  IconCalendarEvent,
} from "@tabler/icons-react";
import {
  useTodayMetrics,
  usePaymentMethodBreakdown,
} from "../hooks/api/useReports";
import { formatCurrency } from "../utils/currency";

interface FinancialSummaryProps {
  startDate?: string;
  endDate?: string;
}

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultToday = formatDateLocal(new Date());

export function FinancialSummary({
  startDate = defaultToday,
  endDate = defaultToday,
}: FinancialSummaryProps) {
  const { financial, overview, isLoading, error } = useTodayMetrics();

  const { data: paymentBreakdown, isLoading: paymentLoading } =
    usePaymentMethodBreakdown(startDate, endDate);

  if (error) {
    return (
      <Paper
        p="md"
        withBorder
        style={{ backgroundColor: "var(--mantine-color-blue-0)" }}
      >
        <Group mb="md" align="center">
          <IconCalendarEvent size={18} color="var(--mantine-color-blue-6)" />
          <Title order={4} c="blue.7">
            Today's Financial Summary
          </Title>
          <Badge variant="light" color="blue" size="sm">
            Date Filtered
          </Badge>
        </Group>
        <Text color="red">Failed to load financial data</Text>
      </Paper>
    );
  }

  const financialData = financial.data;
  const overviewData = overview.data;
  const isDataLoading = isLoading || paymentLoading;

  // Calculate payment method percentages
  const totalPayments = paymentBreakdown
    ? Object.values(paymentBreakdown).reduce((sum, value) => sum + value, 0)
    : 0;

  const cashPercentage =
    totalPayments > 0 && paymentBreakdown
      ? ((paymentBreakdown.Cash || 0) / totalPayments) * 100
      : 0;

  const gcashPercentage =
    totalPayments > 0 && paymentBreakdown
      ? ((paymentBreakdown.GCash || 0) / totalPayments) * 100
      : 0;

  return (
    <Paper
      p="md"
      withBorder
      radius="md"
      style={{ backgroundColor: "var(--mantine-color-blue-0)" }}
    >
      <Group justify="space-between" align="center" mb="sm">
        <Group align="center">
          <IconCalendarEvent size={18} color="var(--mantine-color-blue-6)" />
          <Title order={4} c="blue.7">
            Today's Financial Summary
          </Title>
          <Badge variant="light" color="blue" size="sm">
            Date Filtered
          </Badge>
        </Group>
        <Text size="xs" color="dimmed">
          {new Date().toLocaleDateString()}
        </Text>
      </Group>
      <Text size="sm" c="dimmed" mb="md">
        Financial metrics for today - changes with date selection
      </Text>

      {}
      <SimpleGrid cols={2} mb="md">
        <div>
          <Group gap="xs" mb="xs">
            <IconCashBanknote size={16} color="green" />
            <Text size="sm" fw={500}>
              Revenue
            </Text>
          </Group>
          {isDataLoading ? (
            <Skeleton height={24} />
          ) : (
            <Text size="lg" fw={700} color="green">
              {formatCurrency(
                overviewData?.totalRevenue || financialData?.finalRevenue || 0
              )}
            </Text>
          )}
        </div>

        <div>
          <Group gap="xs" mb="xs">
            <IconTrendingUp size={16} color="teal" />
            <Text size="sm" fw={500}>
              Profit
            </Text>
          </Group>
          {isDataLoading ? (
            <Skeleton height={24} />
          ) : (
            <Text size="lg" fw={700} color="teal">
              {formatCurrency(
                overviewData?.totalProfit || financialData?.grossProfit || 0
              )}
            </Text>
          )}
        </div>
      </SimpleGrid>

      <Divider mb="md" />

      {}
      <Group justify="space-between" mb="md">
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500} mb="xs">
            Payment Methods
          </Text>

          <Stack gap="sm">
            <Group justify="space-between">
              <Group gap="xs">
                <IconCashBanknote size={14} />
                <Text size="sm">Cash</Text>
              </Group>
              {isDataLoading ? (
                <Skeleton height={16} width={60} />
              ) : (
                <Text size="sm" fw={500}>
                  {formatCurrency(
                    paymentBreakdown?.Cash || financialData?.cashSales || 0
                  )}
                </Text>
              )}
            </Group>

            <Group justify="space-between">
              <Group gap="xs">
                <IconCreditCard size={14} />
                <Text size="sm">GCash</Text>
              </Group>
              {isDataLoading ? (
                <Skeleton height={16} width={60} />
              ) : (
                <Text size="sm" fw={500}>
                  {formatCurrency(
                    paymentBreakdown?.GCash || financialData?.gcashSales || 0
                  )}
                </Text>
              )}
            </Group>
          </Stack>
        </div>

        {}
        <div style={{ textAlign: "center" }}>
          {isDataLoading ? (
            <Skeleton height={80} width={80} circle />
          ) : totalPayments > 0 ? (
            <RingProgress
              size={80}
              thickness={8}
              sections={[
                {
                  value: cashPercentage,
                  color: "green",
                  tooltip: `Cash: ${cashPercentage.toFixed(1)}%`,
                },
                {
                  value: gcashPercentage,
                  color: "blue",
                  tooltip: `GCash: ${gcashPercentage.toFixed(1)}%`,
                },
              ]}
              label={
                <Text size="xs" ta="center" color="dimmed">
                  Payment
                </Text>
              }
            />
          ) : (
            <Text size="xs" color="dimmed" ta="center">
              No payments yet
            </Text>
          )}
        </div>
      </Group>

      <Divider mb="md" />

      {}
      <SimpleGrid cols={2}>
        <div>
          <Group gap="xs" mb="xs">
            <IconReceiptTax size={16} color="gray" />
            <Text size="sm" fw={500}>
              VAT Collected
            </Text>
          </Group>
          {isDataLoading ? (
            <Skeleton height={20} />
          ) : (
            <Text size="sm" color="dimmed">
              {formatCurrency(financialData?.vatCollected || 0)}
            </Text>
          )}
        </div>

        <div>
          <Group gap="xs" mb="xs">
            <IconTrendingUp size={16} color="violet" />
            <Text size="sm" fw={500}>
              Profit Margin
            </Text>
          </Group>
          {isDataLoading ? (
            <Skeleton height={20} />
          ) : (
            <Text size="sm" color="dimmed">
              {overviewData?.profitMargin?.toFixed(1) ||
                financialData?.profitMargin?.toFixed(1) ||
                "0"}
              %
            </Text>
          )}
        </div>
      </SimpleGrid>
    </Paper>
  );
}
