import { useState, useRef } from "react";
import {
  Container,
  Title,
  Tabs,
  Group,
  Button,
  Paper,
  Stack,
  Text,
  Table,
  Badge,
  SimpleGrid,
  Loader,
  Alert,
  Center,
  ThemeIcon,
  RingProgress,
  Select,
  Accordion,
  ScrollArea,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
  IconCalendar,
  IconTrendingUp,
  IconUsers,
  IconPackage,
  IconCurrencyPeso,
  IconFileText,
  IconDownload,
  IconChartPie,
  IconClipboardText,
  IconReceipt,
} from "@tabler/icons-react";
import { Global } from "@emotion/react";
import {
  useTopSellingProducts,
  useEmployeeSales,
  useSalesSummary,
} from "../../hooks/api/useReports";
import { formatCurrency } from "../../utils/currency";
import { useReactToPrint } from "react-to-print";
import { IconPrinter } from "@tabler/icons-react";
import { TransactionsTab } from "../../components/reports/TransactionTable";
import {
  useExpenseCategories,
  useExpensesByCategory,
  useExpensesList,
  useExpenseStatistics,
} from "../../hooks/api/useExpenses";
import ExpensesTab from "../../components/reports/ExpensesTab";

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<string | null>("overview");
  const tabLabelMap: Record<string, string> = {
    overview: "Sales Overview",
    products: "Sales by Product",
    employees: "Sales by Employee",
    expenses: "Expenses",
  };
  const activeTabLabel = activeTab ? tabLabelMap[activeTab] ?? activeTab : "";

  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const [selectedPeriod, setSelectedPeriod] = useState<string>("today");

  const printRef = useRef<HTMLDivElement>(null);

  const formatDateLocal = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const startDateStr = formatDateLocal(startDate);
  const endDateStr = formatDateLocal(endDate);

  const productsQuery = useTopSellingProducts(startDateStr, endDateStr, 50);
  const employeeQuery = useEmployeeSales(startDateStr, endDateStr);

  const expenseStatsQuery = useExpenseStatistics(startDateStr, endDateStr);
  const expensesByCategoryQuery = useExpensesByCategory(
    startDateStr,
    endDateStr
  );
  const expenseCategoriesQuery = useExpenseCategories();

  const detectPeriodFromDates = (
    start: Date | null,
    end: Date | null
  ): string => {
    if (!start || !end) return "custom";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    if (
      startDate.getTime() === today.getTime() &&
      endDate.getTime() === today.getTime()
    ) {
      return "today";
    }

    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    const startOfWeekDate = new Date(
      startOfWeek.getFullYear(),
      startOfWeek.getMonth(),
      startOfWeek.getDate()
    );

    if (
      startDate.getTime() === startOfWeekDate.getTime() &&
      endDate.getTime() === today.getTime()
    ) {
      return "thisWeek";
    }

    const prevWeekEnd = new Date(now);
    prevWeekEnd.setDate(now.getDate() - now.getDay() - 1);
    const prevWeekEndDate = new Date(
      prevWeekEnd.getFullYear(),
      prevWeekEnd.getMonth(),
      prevWeekEnd.getDate()
    );
    const prevWeekStart = new Date(prevWeekEnd);
    prevWeekStart.setDate(prevWeekEnd.getDate() - 6);
    const prevWeekStartDate = new Date(
      prevWeekStart.getFullYear(),
      prevWeekStart.getMonth(),
      prevWeekStart.getDate()
    );

    if (
      startDate.getTime() === prevWeekStartDate.getTime() &&
      endDate.getTime() === prevWeekEndDate.getTime()
    ) {
      return "previousWeek";
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (
      startDate.getTime() === startOfMonth.getTime() &&
      endDate.getTime() === today.getTime()
    ) {
      return "thisMonth";
    }

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevMonthStartDate = new Date(
      prevMonthStart.getFullYear(),
      prevMonthStart.getMonth(),
      prevMonthStart.getDate()
    );
    const prevMonthEndDate = new Date(
      prevMonthEnd.getFullYear(),
      prevMonthEnd.getMonth(),
      prevMonthEnd.getDate()
    );

    if (
      startDate.getTime() === prevMonthStartDate.getTime() &&
      endDate.getTime() === prevMonthEndDate.getTime()
    ) {
      return "previousMonth";
    }

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    if (
      startDate.getTime() === startOfYear.getTime() &&
      endDate.getTime() === today.getTime()
    ) {
      return "thisYear";
    }

    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31);
    const prevYearStartDate = new Date(
      prevYearStart.getFullYear(),
      prevYearStart.getMonth(),
      prevYearStart.getDate()
    );
    const prevYearEndDate = new Date(
      prevYearEnd.getFullYear(),
      prevYearEnd.getMonth(),
      prevYearEnd.getDate()
    );

    if (
      startDate.getTime() === prevYearStartDate.getTime() &&
      endDate.getTime() === prevYearEndDate.getTime()
    ) {
      return "previousYear";
    }

    return "custom";
  };

  const handlePeriodChange = (period: string | null) => {
    if (!period) return;

    setSelectedPeriod(period);

    if (period === "custom") return;

    const now = new Date();

    switch (period) {
      case "today":
        setStartDate(new Date(now));
        setEndDate(new Date(now));
        break;

      case "thisWeek":
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        setStartDate(startOfWeek);
        setEndDate(new Date(now));
        break;

      case "previousWeek":
        const prevWeekEnd = new Date(now);
        prevWeekEnd.setDate(now.getDate() - now.getDay() - 1);
        const prevWeekStart = new Date(prevWeekEnd);
        prevWeekStart.setDate(prevWeekEnd.getDate() - 6);
        setStartDate(prevWeekStart);
        setEndDate(prevWeekEnd);
        break;

      case "thisMonth":
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setEndDate(new Date(now));
        break;

      case "previousMonth":
        const prevMonthStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        setStartDate(prevMonthStart);
        setEndDate(prevMonthEnd);
        break;

      case "thisYear":
        setStartDate(new Date(now.getFullYear(), 0, 1));
        setEndDate(new Date(now));
        break;

      case "previousYear":
        const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
        const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31);
        setStartDate(prevYearStart);
        setEndDate(prevYearEnd);
        break;

      default:
        break;
    }
  };

  const handleDateChange = (date: Date | null, isStartDate: boolean) => {
    if (isStartDate) {
      setStartDate(date);
    } else {
      setEndDate(date);
    }

    const newStartDate = isStartDate ? date : startDate;
    const newEndDate = isStartDate ? endDate : date;
    const detectedPeriod = detectPeriodFromDates(newStartDate, newEndDate);
    setSelectedPeriod(detectedPeriod);
  };

  const pageStyles = `
  @page { size: A4; margin: 14mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
    .print-container { max-width: 100% !important; padding: 0 !important; }
    .mantine-Paper-root { box-shadow: none !important; }
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  }
`;

  const handlePrint = useReactToPrint({
    contentRef: printRef, // <-- v3 API
    pageStyle: pageStyles,
  });

  const ProductsTab = () => {
    const { data: products, isLoading, error } = productsQuery;

    if (isLoading) {
      return (
        <Center py="xl">
          <Loader />
        </Center>
      );
    }

    if (error) {
      return (
        <Alert color="red" title="Error loading products">
          {error.message}
        </Alert>
      );
    }

    if (!products || products.length === 0) {
      return (
        <Alert color="blue" title="No Data">
          No product sales found for the selected date range.
        </Alert>
      );
    }

    return (
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <Paper p="md" withBorder>
            <ThemeIcon color="blue" variant="light" size="xl" mb="md">
              <IconPackage size="1.8rem" />
            </ThemeIcon>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb={4}>
              Total Products Sold
            </Text>
            <Text fw={700} size="xl">
              {products.reduce((sum, p) => sum + p.quantity, 0)}
            </Text>
          </Paper>

          <Paper p="md" withBorder>
            <ThemeIcon color="green" variant="light" size="xl" mb="md">
              <IconCurrencyPeso size="1.8rem" />
            </ThemeIcon>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb={4}>
              Product Revenue
            </Text>
            <Text fw={700} size="xl">
              {formatCurrency(products.reduce((sum, p) => sum + p.revenue, 0))}
            </Text>
          </Paper>

          <Paper p="md" withBorder>
            <ThemeIcon color="teal" variant="light" size="xl" mb="md">
              <IconTrendingUp size="1.8rem" />
            </ThemeIcon>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb={4}>
              Avg. Revenue per Product
            </Text>
            <Text fw={700} size="xl">
              {formatCurrency(
                products.reduce((sum, p) => sum + p.revenue, 0) /
                  products.length
              )}
            </Text>
          </Paper>

          <Paper p="md" withBorder>
            <ThemeIcon color="orange" variant="light" size="xl" mb="md">
              <IconChartPie size="1.8rem" />
            </ThemeIcon>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb={4}>
              Top Selling Product
            </Text>
            <Text fw={700} size="lg">
              {products[0]?.name}
            </Text>
            <Text size="sm" c="dimmed">
              {products[0]?.quantity} units sold
            </Text>
          </Paper>
        </SimpleGrid>

        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Rank</Table.Th>
                <Table.Th>Product Name</Table.Th>
                <Table.Th>Quantity Sold</Table.Th>
                <Table.Th>Revenue</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {products.map((product, index) => (
                <Table.Tr key={product.id}>
                  <Table.Td>
                    <Badge
                      color={index < 3 ? "orange" : "gray"}
                      variant="light"
                    >
                      #{index + 1}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{product.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{product.quantity} units</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{formatCurrency(product.revenue)}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    );
  };

  const EmployeesTab = () => {
    const { data: employees, isLoading, error } = employeeQuery;

    if (isLoading) {
      return (
        <Center py="xl">
          <Loader />
        </Center>
      );
    }

    if (error) {
      return (
        <Alert color="red" title="Error loading employee data">
          {error.message}
        </Alert>
      );
    }

    if (!employees || employees.length === 0) {
      return (
        <Alert color="blue" title="No Data">
          No employee sales data found for the selected date range.
        </Alert>
      );
    }

    const totalSales = employees.reduce((sum, e) => sum + e.totalSales, 0);

    return (
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <Paper p="md" withBorder>
            <ThemeIcon color="blue" variant="light" size="xl" mb="md">
              <IconUsers size="1.8rem" />
            </ThemeIcon>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb={4}>
              Active Employees
            </Text>
            <Text fw={700} size="xl">
              {employees.length}
            </Text>
          </Paper>

          <Paper p="md" withBorder>
            <ThemeIcon color="green" variant="light" size="xl" mb="md">
              <IconCurrencyPeso size="1.8rem" />
            </ThemeIcon>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb={4}>
              Total Employee Sales
            </Text>
            <Text fw={700} size="xl">
              {formatCurrency(totalSales)}
            </Text>
          </Paper>

          <Paper p="md" withBorder>
            <ThemeIcon color="teal" variant="light" size="xl" mb="md">
              <IconTrendingUp size="1.8rem" />
            </ThemeIcon>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb={4}>
              Average Sales per Employee
            </Text>
            <Text fw={700} size="xl">
              {formatCurrency(totalSales / employees.length)}
            </Text>
          </Paper>

          <Paper p="md" withBorder>
            <ThemeIcon color="orange" variant="light" size="xl" mb="md">
              <IconChartPie size="1.8rem" />
            </ThemeIcon>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb={4}>
              Top Performer
            </Text>
            <Text fw={700} size="lg">
              {employees[0]?.employeeName}
            </Text>
            <Text size="sm" c="dimmed">
              {formatCurrency(employees[0]?.totalSales)}
            </Text>
          </Paper>
        </SimpleGrid>

        {}
        <Paper withBorder>
          <Text fw={600} size="lg" p="md" pb="xs">
            Employee Performance Details
          </Text>
          <Accordion variant="separated">
            {employees.map((employee, index) => (
              <Accordion.Item
                key={employee.employeeId}
                value={employee.employeeId}
              >
                <Accordion.Control>
                  <Group justify="space-between" align="center">
                    <Group align="center" gap="md">
                      <Badge
                        color={index < 3 ? "orange" : "gray"}
                        variant="light"
                        size="lg"
                      >
                        #{index + 1}
                      </Badge>
                      <div>
                        <Text fw={600} size="md">
                          {employee.employeeName}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {employee.totalTransactions} transactions •{" "}
                          {employee.itemsSold} items sold
                        </Text>
                      </div>
                    </Group>
                    <Group align="center" gap="lg">
                      <div style={{ textAlign: "right" }}>
                        <Text fw={700} size="lg" c="green">
                          {formatCurrency(employee.totalSales)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Avg:{" "}
                          {formatCurrency(employee.averageTransactionValue)}
                        </Text>
                      </div>
                    </Group>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    <Group justify="space-between" align="center">
                      <Text fw={500} size="sm">
                        Individual Transactions ({employee.transactions.length})
                      </Text>
                      <Text size="xs" c="dimmed">
                        Showing transactions for {employee.employeeName}
                      </Text>
                    </Group>

                    {employee.transactions.length > 0 ? (
                      <ScrollArea.Autosize mah={500} type="auto">
                        <Table striped highlightOnHover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Date & Time</Table.Th>
                              <Table.Th>Receipt Number</Table.Th>
                              <Table.Th>Items</Table.Th>
                              <Table.Th>Payment Method</Table.Th>
                              <Table.Th>Total Amount</Table.Th>
                              <Table.Th>Status</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {employee.transactions
                              .sort(
                                (a: any, b: any) =>
                                  new Date(b.transactionDate).getTime() -
                                  new Date(a.transactionDate).getTime()
                              )
                              .map((transaction: any) => (
                                <Table.Tr key={transaction.id}>
                                  <Table.Td>
                                    <div>
                                      <Text size="sm" fw={500}>
                                        {new Date(
                                          transaction.transactionDate
                                        ).toLocaleDateString()}
                                      </Text>
                                      <Text size="xs" c="dimmed">
                                        {new Date(
                                          transaction.transactionDate
                                        ).toLocaleTimeString()}
                                      </Text>
                                    </div>
                                  </Table.Td>
                                  <Table.Td>
                                    <Text size="xs" ff="monospace" c="dimmed">
                                      {transaction.receiptNumber}
                                    </Text>
                                  </Table.Td>
                                  <Table.Td>
                                    <Badge
                                      size="sm"
                                      variant="light"
                                      color="blue"
                                    >
                                      {transaction.itemCount} items
                                    </Badge>
                                  </Table.Td>
                                  <Table.Td>
                                    <Badge
                                      size="sm"
                                      variant="outline"
                                      color={
                                        transaction.paymentMethod === "Cash"
                                          ? "green"
                                          : "blue"
                                      }
                                    >
                                      {transaction.paymentMethod}
                                    </Badge>
                                  </Table.Td>
                                  <Table.Td>
                                    <Text fw={600} c="green">
                                      {formatCurrency(transaction.totalAmount)}
                                    </Text>
                                  </Table.Td>
                                  <Table.Td>
                                    {transaction.isVoided ? (
                                      <Badge
                                        size="sm"
                                        color="dark"
                                        variant="filled"
                                        style={{ backgroundColor: "#5f3dc4" }}
                                      >
                                        Voided
                                      </Badge>
                                    ) : (
                                      <Badge
                                        size="sm"
                                        color="green"
                                        variant="light"
                                      >
                                        Completed
                                      </Badge>
                                    )}
                                  </Table.Td>
                                </Table.Tr>
                              ))}
                          </Table.Tbody>
                        </Table>
                      </ScrollArea.Autosize>
                    ) : (
                      <Center py="md">
                        <Text c="dimmed" size="sm">
                          No transactions found for this employee
                        </Text>
                      </Center>
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Paper>
      </Stack>
    );
  };

  const SalesOverviewTab = () => {
    const { data, isLoading, error } = useSalesSummary(
      selectedPeriod,
      startDateStr,
      endDateStr
    );

    // recent expenses for the selected range (top 5)
    const {
      data: expensesResp,
      isLoading: expLoading,
      error: expError,
    } = useExpensesList(startDateStr, endDateStr, {
      pageNumber: 1,
      pageSize: 100000,
    });

    if (isLoading) {
      return (
        <Center py="xl">
          <Loader />
        </Center>
      );
    }

    if (error) {
      return (
        <Alert color="red" title="Error loading sales summary">
          {(error as any).message || "Failed to load"}
        </Alert>
      );
    }

    if (!data) {
      return (
        <Alert color="blue" title="No Data">
          No sales summary found for the selected date range.
        </Alert>
      );
    }

    // payment method totals
    const totalPmTx =
      (data.cashTransactions || 0) +
      (data.gcashTransactions || 0) +
      (data.mayaTransactions || 0) +
      (data.goTymeTransactions || 0);

    const totalPmAmt =
      (data.cashSales || 0) +
      (data.gcashSales || 0) +
      (data.mayaSales || 0) +
      (data.goTymeSales || 0);

    // your hook returns the full object; the array is at .data
    const expenses: Array<{
      id: string;
      purchasedBy: string;
      date: string;
      reason: string;
      total: number;
      category: string | null;
      paymentMethod: "Cash" | "GCash" | "Maya" | "GoTyme" | string;
      reference?: string | null;
      itemCount?: number;
      recordedBy?: string;
    }> = expensesResp?.data ?? [];

    const paymentColor = (pm: string) => {
      switch (pm?.toLowerCase()) {
        case "cash":
          return "green";
        case "gcash":
          return "blue";
        case "maya":
          return "indigo";
        case "gotyme":
          return "violet";
        default:
          return "gray";
      }
    };
    const fmtDate = (d: string | Date) =>
      new Date(d).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: "Asia/Manila", // <- your local TZ
      });

    return (
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text fw={600} size="lg">
            {
              selectedPeriod === "today"
                ? `Today (${fmtDate(new Date())})`
                : data.periodLabel /* or build labels locally for all periods */
            }
          </Text>

          <Badge variant="light" color="gray">
            {fmtDate(data.startDate)} – {fmtDate(data.endDate)}
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {/* LEFT: Overall totals */}
          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text c="dimmed" size="sm" fw={700}>
                  Gross Sales
                </Text>
                <Text fw={800}>{formatCurrency(data.grossSales)}</Text>
              </Group>

              <Group justify="space-between">
                <Text c="dimmed" size="sm" fw={700}>
                  Discounts
                </Text>
                <Text fw={800} c="red">
                  {formatCurrency(data.totalDiscounts)}
                </Text>
              </Group>

              <Group justify="space-between">
                <Text c="dimmed" size="sm" fw={700}>
                  Total Expenses
                </Text>
                <Text fw={800} c="red">
                  {formatCurrency(data.totalExpenses)}
                </Text>
              </Group>

              <Group justify="space-between" className="no-print">
                <Text c="dimmed" size="sm" fw={700}>
                  Net Sales
                </Text>
                <Text fw={800} c={data.netSales >= 0 ? "green" : "red"}>
                  {formatCurrency(data.netSales)}
                </Text>
              </Group>
              <Group
                justify="space-between"
                className="only-print print-totals-row"
              >
                <Text size="sm" fw={800}>
                  Net Sales
                </Text>
                <Text fw={900}>{formatCurrency(data.netSales)}</Text>
              </Group>
            </Stack>
          </Paper>

          {/* RIGHT: Payment methods + Recent expenses */}
          <Stack gap="md">
            <Paper p="md" withBorder>
              <Text fw={600} mb="sm">
                Payment Methods
              </Text>
              <Table withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Method</Table.Th>
                    <Table.Th ta="right">Transactions</Table.Th>
                    <Table.Th ta="right">Amount</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {[
                    {
                      label: "Cash",
                      tx: data.cashTransactions,
                      amt: data.cashSales,
                      color: "green",
                    },
                    {
                      label: "GCash",
                      tx: data.gcashTransactions,
                      amt: data.gcashSales,
                      color: "blue",
                    },
                    {
                      label: "Maya",
                      tx: data.mayaTransactions,
                      amt: data.mayaSales,
                      color: "indigo",
                    },
                    {
                      label: "GoTyme",
                      tx: data.goTymeTransactions,
                      amt: data.goTymeSales,
                      color: "violet",
                    },
                  ].map((row) => (
                    <Table.Tr key={row.label}>
                      <Table.Td>
                        <Badge variant="outline" color={row.color}>
                          {row.label}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={600}>{row.tx ?? 0}</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={700}>{formatCurrency(row.amt ?? 0)}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
                <Table.Tfoot>
                  <Table.Tr>
                    <Table.Th>Total</Table.Th>
                    <Table.Th ta="right">
                      <Text fw={700}>{totalPmTx.toLocaleString()}</Text>
                    </Table.Th>
                    <Table.Th ta="right">
                      <Text fw={800}>{formatCurrency(totalPmAmt)}</Text>
                    </Table.Th>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>
            </Paper>

            <Paper p="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Recent Expenses</Text>
                <Group gap={8}>
                  <Badge variant="light">{expenses?.length ?? 0} shown</Badge>
                  <span className="print-chip print-chip--danger">
                    Total:{" "}
                    {formatCurrency(
                      expenses.reduce((s, e) => s + (e.total ?? 0), 0)
                    )}
                  </span>
                </Group>
              </Group>

              {expError ? (
                <Alert color="red" title="Error loading expenses">
                  {(expError as any).message || "Failed to load"}
                </Alert>
              ) : expLoading ? (
                <Center py="sm">
                  <Loader size="sm" />
                </Center>
              ) : expenses && expenses.length > 0 ? (
                <Table striped highlightOnHover withRowBorders={false}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Reason / Category</Table.Th>
                      <Table.Th>Purchased By</Table.Th>
                      <Table.Th>Payment</Table.Th>
                      <Table.Th ta="right">Amount</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {expenses.map((exp) => (
                      <Table.Tr key={exp.id}>
                        <Table.Td>
                          <Text size="sm">
                            {new Date(exp.date).toLocaleDateString()}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Group gap={6} wrap="nowrap">
                            <Text size="sm" fw={500}>
                              {exp.reason || "—"}
                            </Text>
                            {exp.category ? (
                              <Badge size="xs" variant="light">
                                {exp.category}
                              </Badge>
                            ) : null}
                          </Group>
                          {exp.recordedBy ? (
                            <Text size="xs" c="dimmed">
                              Recorded by: {exp.recordedBy}
                            </Text>
                          ) : null}
                        </Table.Td>

                        <Table.Td>
                          <Text size="sm">{exp.purchasedBy || "—"}</Text>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            variant="outline"
                            color={paymentColor(exp.paymentMethod)}
                          >
                            {exp.paymentMethod || "—"}
                          </Badge>
                        </Table.Td>

                        <Table.Td ta="right">
                          <Text fw={700}>{formatCurrency(exp.total ?? 0)}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text c="dimmed" size="sm">
                  No expenses found for this range.
                </Text>
              )}
            </Paper>
          </Stack>
        </SimpleGrid>

        {/* BOTTOM: transaction counters */}
        <div className="no-print">
          <Stack gap="md">
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <Text c="dimmed" fw={700} size="sm">
                  Total Sales Transactions
                </Text>
                <Text fw={800}>{data.nonDiscountedTransactions}</Text>
              </Group>
            </Paper>

            <Paper p="md" withBorder>
              <Group justify="space-between">
                <Text c="dimmed" fw={700} size="sm">
                  Discounted Transactions
                </Text>
                <Text fw={800}>{data.discountedTransactions}</Text>
              </Group>
            </Paper>

            <Paper p="md" withBorder>
              <Group justify="space-between">
                <Text c="dimmed" fw={700} size="sm">
                  Voided Transactions
                </Text>
                <Text fw={800}>{data.voidedTransactions}</Text>
              </Group>
            </Paper>

            <Paper p="md" withBorder>
              <Group justify="space-between">
                <Text c="dimmed" fw={700} size="sm">
                  Overall Transactions
                </Text>
                <Text fw={800}>{data.totalTransactions}</Text>
              </Group>
            </Paper>
          </Stack>
        </div>
        <div className="only-print">
          <Table className="avoid-break">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Metric</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Count</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>Total Sales Transactions</Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  {data.nonDiscountedTransactions}
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Discounted Transactions</Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  {data.discountedTransactions}
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Voided Transactions</Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  {data.voidedTransactions}
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <b>Overall Transactions</b>
                </Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  <b>{data.totalTransactions}</b>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </div>
      </Stack>
    );
  };

  return (
    <>
      <Global
        styles={`
    @page { size: A4; margin: 6mm; }

    /* Hide print-only bits on screen only */
    @media screen {
      .only-print { display: none !important; }
    }

    @media print {
      html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

      /* One base size everywhere */
      .print-container, .print-container * {
        font-size: 9px !important;
        line-height: 1.24 !important;
      }

      /* Show print-only bits; hide screen-only */
      .only-print { display: block !important; }
      .no-print   { display: none  !important; }

      /* Header (bigger than body and centered) */
      .print-company {
        text-align: center !important;
        font-weight: 800;
        font-size: 12px !important;
        letter-spacing: .2px;
        margin: 0 0 2px !important;
        width: 100%;
      }
      .print-title {
        text-align: center !important;
        font-weight: 700;
        font-size: 10.5px !important;
        margin: 0 0 6px !important;
        width: 100%;
      }

      /* Compact layout + thin separators (no boxes) */
      .print-container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
      .mantine-Tabs-list { display: none !important; }
      .print-container .mantine-Paper-root {
        border: 0 !important; box-shadow: none !important; background: transparent !important;
        padding: 0 !important; margin: 0 0 2px !important;
        border-top: .45px solid var(--mantine-color-gray-4) !important; border-radius: 0 !important;
      }
      .print-container .mantine-Paper-root:first-of-type { border-top: 0 !important; }
      .print-container .mantine-Stack-root { gap: 2px !important; }
      .print-container .mantine-Group-root { gap: 1px !important; }
      .print-container .mantine-SimpleGrid-root { gap: 4px !important; }
      h1,h2,h3,h4,h5,h6 { margin: 0 0 2px !important; break-after: avoid; }

      /* Tables: match body size; tiny padding */
      .print-container .mantine-Table-table { border-collapse: collapse !important; border: 0 !important; }
      .print-container .mantine-Table-th,
      .print-container .mantine-Table-td {
        border: 0 !important; border-bottom: .45px solid var(--mantine-color-gray-4) !important;
        padding: 1px 2px !important; font-size: 9px !important; line-height: 1.22 !important;
      }
      .print-container .mantine-Table-thead .mantine-Table-th {
        border-bottom: .6px solid var(--mantine-color-gray-6) !important;
        font-weight: 700 !important; font-size: 9.2px !important;
      }

      .avoid-break { break-inside: avoid; page-break-inside: avoid; }

      /* Signature block: push further down */
      .signature-section { margin-top: 14mm !important; break-inside: avoid; }
      .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .sig-line  { border-top: .6px solid var(--mantine-color-gray-6); margin-top: 10px; height: 0; }
      .sig-label { font-size: 9px !important; color: var(--mantine-color-gray-7); text-align: center; }

      .kpi-row { 
        display: grid; 
        grid-template-columns: repeat(3, 1fr); 
        gap: 6px; 
        margin: 4px 0 8px; 
      }
      .kpi {
        border: .6px solid #c7c7c7;
        border-radius: 4px;
        padding: 6px 8px;
        background: #f7f7f7;
      }
      .kpi label {
        display:block; 
        font-weight: 700; 
        font-size: 9.2px; 
        color:#555; 
        margin-bottom:2px;
      }
      .kpi strong {
        font-size: 12px; 
        line-height:1.1;
      }

      /* Net Sales emphasis */
      .kpi--net.pos { background:#e6f4ea; border-color:#8bcf9a; color:#0b6a34; }
      .kpi--net.neg { background:#fde8e8; border-color:#f5b5b5; color:#a31212; }

      /* Subtle highlight for totals inside the left totals card */
      .print-totals-row { background: #49fa38f5; border-radius:3px; padding:2px 4px; }

      /* Tiny chip used on expenses card */
      .print-chip {
        display:inline-block;
        padding:2px 6px; 
        border-radius:999px; 
        border:.6px solid #c7c7c7; 
        background:#fffdf5; 
        font-weight:700;
      }
      .print-chip--danger { background:#fff0f0; border-color:#f1b0b0; color:#a31212; }

    }
  `}
      />

      <Container size="xl" py="md" className="print-container">
        <Stack gap="lg">
          {/* Top row */}
          <Group justify="space-between" align="center">
            <Title order={1}>Reports & Analytics</Title>
            <Button
              leftSection={<IconPrinter size={16} />}
              variant="light"
              onClick={handlePrint}
              className="no-print"
            >
              Print Report
            </Button>
          </Group>

          {}
          <Paper withBorder p="md">
            <Group justify="space-between" align="center" wrap="wrap">
              <Group align="center" gap="md">
                <Group align="center" gap="sm">
                  <IconCalendar size={20} />
                  <Text fw={500}>Period:</Text>
                  <Select
                    value={selectedPeriod}
                    onChange={handlePeriodChange}
                    data={[
                      { value: "today", label: "Today" },
                      { value: "thisWeek", label: "This Week" },
                      { value: "previousWeek", label: "Previous Week" },
                      { value: "thisMonth", label: "This Month" },
                      { value: "previousMonth", label: "Previous Month" },
                      { value: "thisYear", label: "This Year" },
                      { value: "previousYear", label: "Previous Year" },
                      { value: "custom", label: "Custom" },
                    ]}
                    w={160}
                    size="sm"
                  />
                </Group>

                <Group align="center" gap="sm">
                  <Text fw={500} c="dimmed">
                    Date Range:
                  </Text>
                  <DatePickerInput
                    placeholder="Start date"
                    value={startDate}
                    onChange={(date) => handleDateChange(date, true)}
                    maxDate={endDate || undefined}
                    w={120}
                    size="sm"
                    valueFormat="MMM D, YYYY"
                  />
                  <Text c="dimmed">to</Text>
                  <DatePickerInput
                    placeholder="End date"
                    value={endDate}
                    onChange={(date) => handleDateChange(date, false)}
                    minDate={startDate || undefined}
                    maxDate={new Date()}
                    w={120}
                    size="sm"
                    valueFormat="MMM D, YYYY"
                  />
                </Group>
              </Group>
            </Group>
          </Paper>

          {}
          <div ref={printRef}>
            <div className="only-print">
              <div className="print-company">
                OCT PHARMA AND GENERAL MERCHANISE
              </div>
              <div className="print-title">
                Reports &amp; Analytics — {activeTabLabel}
              </div>
            </div>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List grow>
                <Tabs.Tab
                  value="overview"
                  leftSection={<IconTrendingUp size={16} />}
                >
                  Sales Overview
                </Tabs.Tab>

                <Tabs.Tab
                  value="transactions"
                  leftSection={<IconClipboardText size={16} />}
                >
                  Transactions
                </Tabs.Tab>

                <Tabs.Tab
                  value="products"
                  leftSection={<IconPackage size={16} />}
                >
                  Sales by Product
                </Tabs.Tab>

                <Tabs.Tab
                  value="employees"
                  leftSection={<IconUsers size={16} />}
                >
                  Sales by Employee
                </Tabs.Tab>
                <Tabs.Tab
                  value="expenses"
                  leftSection={<IconFileText size={16} />}
                >
                  Expenses
                </Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="overview" pt="md">
                <SalesOverviewTab />
              </Tabs.Panel>
              <Tabs.Panel value="transactions" pt="md">
                <TransactionsTab
                  startDateStr={startDateStr}
                  endDateStr={endDateStr}
                />
              </Tabs.Panel>
              <Tabs.Panel value="products" pt="md">
                <ProductsTab />
              </Tabs.Panel>

              <Tabs.Panel value="employees" pt="md">
                <EmployeesTab />
              </Tabs.Panel>

              <Tabs.Panel value="expenses" pt="md">
                <ExpensesTab
                  startDateStr={startDateStr}
                  endDateStr={endDateStr}
                />
              </Tabs.Panel>
            </Tabs>

            <div className="only-print signature-section">
              <div className="signature-grid">
                <div>
                  <div className="sig-line" />
                  <Text className="sig-label">Reported by:</Text>
                </div>
                <div>
                  <div className="sig-line" />
                  <Text className="sig-label">Received by:</Text>
                </div>
              </div>
            </div>
          </div>
        </Stack>
      </Container>
    </>
  );
}
