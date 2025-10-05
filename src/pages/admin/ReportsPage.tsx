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
  Progress,
  SimpleGrid,
  Loader,
  Alert,
  Center,
  ThemeIcon,
  RingProgress,
  Select,
  Accordion,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
  IconCalendar,
  IconTrendingUp,
  IconUsers,
  IconPackage,
  IconTestPipe,
  IconCurrencyPeso,
  IconFileText,
  IconDownload,
  IconChartPie,
  IconReceipt,
} from "@tabler/icons-react";
import { Global } from "@emotion/react";
import {
  useTopSellingProducts,
  useTopPerformingTests,
  useEmployeeSales,
  useExpenseStatistics,
  useExpensesByCategory,
  useExpensesList,
  useExpenseCategories,
  useSalesSummary,
} from "../../hooks/api/useReports";
import { formatCurrency } from "../../utils/currency";
import { useReactToPrint } from "react-to-print";
import { IconPrinter } from "@tabler/icons-react";

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<string | null>("overview");
  const tabLabelMap: Record<string, string> = {
    overview: "Sales Overview",
    products: "Sales by Product",
    tests: "Sales by Tests",
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
  const testsQuery = useTopPerformingTests(startDateStr, endDateStr, 50);
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

    const maxRevenue = Math.max(...products.map((p) => p.revenue));

    return (
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Total Products Sold
                </Text>
                <Text fw={700} size="xl">
                  {products.reduce((sum, p) => sum + p.quantity, 0)}
                </Text>
              </div>
              <ThemeIcon color="blue" variant="light" size="xl">
                <IconPackage size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Product Revenue
                </Text>
                <Text fw={700} size="xl">
                  {formatCurrency(
                    products.reduce((sum, p) => sum + p.revenue, 0)
                  )}
                </Text>
              </div>
              <ThemeIcon color="green" variant="light" size="xl">
                <IconCurrencyPeso size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Average Revenue per Product
                </Text>
                <Text fw={700} size="xl">
                  {formatCurrency(
                    products.reduce((sum, p) => sum + p.revenue, 0) /
                      products.length
                  )}
                </Text>
              </div>
              <ThemeIcon color="teal" variant="light" size="xl">
                <IconTrendingUp size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Top Selling Product
                </Text>
                <Text fw={700} size="lg">
                  {products[0]?.name}
                </Text>
                <Text size="sm" c="dimmed">
                  {products[0]?.quantity} units sold
                </Text>
              </div>
              <ThemeIcon color="orange" variant="light" size="xl">
                <IconChartPie size="1.8rem" />
              </ThemeIcon>
            </Group>
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
                <Table.Th>Performance</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {products.map((product, index) => (
                <Table.Tr key={product.id}>
                  <Table.Td>
                    <Badge color={index < 3 ? "gold" : "gray"} variant="light">
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
                  <Table.Td>
                    <Progress
                      value={(product.revenue / maxRevenue) * 100}
                      size="sm"
                      color={index < 3 ? "green" : "blue"}
                    />
                    <Text size="xs" c="dimmed" mt={4}>
                      {((product.revenue / maxRevenue) * 100).toFixed(1)}%
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    );
  };

  const TestsTab = () => {
    const { data: tests, isLoading, error } = testsQuery;

    if (isLoading) {
      return (
        <Center py="xl">
          <Loader />
        </Center>
      );
    }

    if (error) {
      return (
        <Alert color="red" title="Error loading tests">
          {error.message}
        </Alert>
      );
    }

    if (!tests || tests.length === 0) {
      return (
        <Alert color="blue" title="No Data">
          No test performance data found for the selected date range.
        </Alert>
      );
    }

    const maxRevenue = Math.max(...tests.map((t: any) => t.revenue));

    return (
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Total Tests Performed
                </Text>
                <Text fw={700} size="xl">
                  {tests.reduce((sum: number, t: any) => sum + t.quantity, 0)}
                </Text>
              </div>
              <ThemeIcon color="purple" variant="light" size="xl">
                <IconTestPipe size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Test Revenue
                </Text>
                <Text fw={700} size="xl">
                  {formatCurrency(tests.reduce((sum, t) => sum + t.revenue, 0))}
                </Text>
              </div>
              <ThemeIcon color="green" variant="light" size="xl">
                <IconCurrencyPeso size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Average Revenue per Test
                </Text>
                <Text fw={700} size="xl">
                  {formatCurrency(
                    tests.reduce((sum, t) => sum + t.revenue, 0) / tests.length
                  )}
                </Text>
              </div>
              <ThemeIcon color="teal" variant="light" size="xl">
                <IconTrendingUp size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Top Performing Test
                </Text>
                <Text fw={700} size="lg">
                  {tests[0]?.name}
                </Text>
                <Text size="sm" c="dimmed">
                  {tests[0]?.quantity} tests performed
                </Text>
              </div>
              <ThemeIcon color="indigo" variant="light" size="xl">
                <IconChartPie size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>
        </SimpleGrid>

        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Rank</Table.Th>
                <Table.Th>Test Name</Table.Th>
                <Table.Th>Tests Performed</Table.Th>
                <Table.Th>Revenue</Table.Th>
                <Table.Th>Performance</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tests.map((test, index) => (
                <Table.Tr key={test.id}>
                  <Table.Td>
                    <Badge color={index < 3 ? "gold" : "gray"} variant="light">
                      #{index + 1}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{test.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{test.quantity} tests</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{formatCurrency(test.revenue)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Progress
                      value={(test.revenue / maxRevenue) * 100}
                      size="sm"
                      color={index < 3 ? "purple" : "blue"}
                    />
                    <Text size="xs" c="dimmed" mt={4}>
                      {((test.revenue / maxRevenue) * 100).toFixed(1)}%
                    </Text>
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

    const maxSales = Math.max(...employees.map((e) => e.totalSales));
    const totalSales = employees.reduce((sum, e) => sum + e.totalSales, 0);

    return (
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Active Employees
                </Text>
                <Text fw={700} size="xl">
                  {employees.length}
                </Text>
              </div>
              <ThemeIcon color="blue" variant="light" size="xl">
                <IconUsers size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Total Employee Sales
                </Text>
                <Text fw={700} size="xl">
                  {formatCurrency(totalSales)}
                </Text>
              </div>
              <ThemeIcon color="green" variant="light" size="xl">
                <IconCurrencyPeso size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Average Sales per Employee
                </Text>
                <Text fw={700} size="xl">
                  {formatCurrency(totalSales / employees.length)}
                </Text>
              </div>
              <ThemeIcon color="teal" variant="light" size="xl">
                <IconTrendingUp size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Top Performer
                </Text>
                <Text fw={700} size="lg">
                  {employees[0]?.employeeName}
                </Text>
                <Text size="sm" c="dimmed">
                  {formatCurrency(employees[0]?.totalSales)}
                </Text>
              </div>
              <ThemeIcon color="orange" variant="light" size="xl">
                <IconChartPie size="1.8rem" />
              </ThemeIcon>
            </Group>
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
                        color={index < 3 ? "gold" : "gray"}
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
                      <div style={{ minWidth: "100px" }}>
                        <Progress
                          value={(employee.totalSales / maxSales) * 100}
                          size="md"
                          color={index < 3 ? "orange" : "blue"}
                        />
                        <Text size="xs" c="dimmed" ta="center" mt={2}>
                          {((employee.totalSales / maxSales) * 100).toFixed(1)}%
                          of top
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
                                  <Badge size="sm" variant="light" color="blue">
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

  const ExpensesTab = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    const {
      data: expensesList,
      isLoading: listLoading,
      error: listError,
    } = useExpensesList(startDateStr, endDateStr, {
      category: selectedCategory || undefined,
      pageSize: 20,
    });

    const expenseStats = expenseStatsQuery.data;
    const expensesByCategory = expensesByCategoryQuery.data;
    const categories = expenseCategoriesQuery.data;

    const isLoading =
      expenseStatsQuery.isLoading ||
      expensesByCategoryQuery.isLoading ||
      listLoading;
    const error =
      expenseStatsQuery.error || expensesByCategoryQuery.error || listError;

    if (isLoading) {
      return (
        <Center py="xl">
          <Loader />
        </Center>
      );
    }

    if (error) {
      return (
        <Alert color="red" title="Error loading expense data">
          {error.message}
        </Alert>
      );
    }

    if (!expenseStats || !expensesByCategory) {
      return (
        <Alert color="blue" title="No Data">
          No expense data found for the selected date range.
        </Alert>
      );
    }

    return (
      <Stack gap="md">
        {}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Total Expenses
                </Text>
                <Text fw={700} size="xl">
                  {formatCurrency(expenseStats.totals.totalAmount)}
                </Text>
              </div>
              <ThemeIcon color="red" variant="light" size="xl">
                <IconCurrencyPeso size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Total Transactions
                </Text>
                <Text fw={700} size="xl">
                  {expenseStats.totals.transactionCount}
                </Text>
              </div>
              <ThemeIcon color="blue" variant="light" size="xl">
                <IconReceipt size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Average Expense
                </Text>
                <Text fw={700} size="xl">
                  {formatCurrency(expenseStats.totals.averageExpense)}
                </Text>
              </div>
              <ThemeIcon color="green" variant="light" size="xl">
                <IconTrendingUp size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper p="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Categories
                </Text>
                <Text fw={700} size="xl">
                  {expensesByCategory.categories.length}
                </Text>
              </div>
              <ThemeIcon color="purple" variant="light" size="xl">
                <IconChartPie size="1.8rem" />
              </ThemeIcon>
            </Group>
          </Paper>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {}
          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Expense Categories
            </Text>
            <Center mb="md">
              <RingProgress
                size={200}
                thickness={20}
                sections={expensesByCategory.categories
                  .slice(0, 5)
                  .map((category, index) => ({
                    value: category.percentage,
                    color:
                      ["red", "orange", "yellow", "blue", "purple"][index] ||
                      "gray",
                    tooltip: `${category.category}: ${formatCurrency(
                      category.amount
                    )} (${category.percentage.toFixed(1)}%)`,
                  }))}
                label={
                  <Text c="dimmed" fw={700} ta="center" size="sm">
                    Total
                    <br />
                    {formatCurrency(expensesByCategory.totalAmount)}
                  </Text>
                }
              />
            </Center>
            <Stack gap="sm">
              {expensesByCategory.categories
                .slice(0, 6)
                .map((category, index) => (
                  <Group key={category.category} justify="space-between">
                    <Group gap="xs">
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: `var(--mantine-color-${
                            [
                              "red",
                              "orange",
                              "yellow",
                              "blue",
                              "purple",
                              "gray",
                            ][index] || "gray"
                          }-6)`,
                        }}
                      />
                      <Text size="sm" fw={500}>
                        {category.category}
                      </Text>
                    </Group>
                    <Text size="sm" fw={600}>
                      {formatCurrency(category.amount)}
                    </Text>
                  </Group>
                ))}
            </Stack>
          </Paper>

          {}
          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Category Details
            </Text>
            <Select
              label="Filter by Category"
              placeholder="All categories"
              data={[
                { value: "", label: "All Categories" },
                ...(categories?.categories.map((cat) => ({
                  value: cat,
                  label: cat,
                })) || []),
              ]}
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value || "")}
              mb="md"
            />
            <Stack gap="sm">
              {expensesByCategory.categories.map((category, index) => (
                <Paper
                  key={category.category}
                  p="sm"
                  withBorder
                  style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
                >
                  <Group justify="space-between" mb="xs">
                    <Text fw={500}>{category.category}</Text>
                    <Badge
                      variant="light"
                      color={
                        ["red", "orange", "yellow", "blue", "purple", "gray"][
                          index
                        ] || "gray"
                      }
                    >
                      {category.percentage.toFixed(1)}%
                    </Badge>
                  </Group>
                  <Text
                    size="lg"
                    fw={700}
                    c={
                      ["red", "orange", "yellow", "blue", "purple", "gray"][
                        index
                      ] || "gray"
                    }
                  >
                    {formatCurrency(category.amount)}
                  </Text>
                  <Progress
                    value={category.percentage}
                    size="xs"
                    color={
                      ["red", "orange", "yellow", "blue", "purple", "gray"][
                        index
                      ] || "gray"
                    }
                    mt="xs"
                  />
                </Paper>
              ))}
            </Stack>
          </Paper>
        </SimpleGrid>

        {}
        <Paper withBorder>
          <Group p="md" justify="space-between" align="center">
            <Text fw={600} size="lg">
              Recent Expenses
              {selectedCategory && ` - ${selectedCategory}`}
            </Text>
            <Text size="sm" c="dimmed">
              Showing {expensesList?.data.length || 0} of{" "}
              {expensesList?.pagination.totalRecords || 0} expenses
            </Text>
          </Group>

          {expensesList && expensesList.data.length > 0 ? (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Purchased By</Table.Th>
                  <Table.Th>Payment Method</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Items</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {expensesList.data.map((expense) => (
                  <Table.Tr key={expense.id}>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(expense.date).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500} size="sm">
                        {expense.reason}
                      </Text>
                      {expense.reference && (
                        <Text size="xs" c="dimmed">
                          Ref: {expense.reference}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm">
                        {expense.category}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{expense.purchasedBy}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="outline"
                        size="sm"
                        color={
                          expense.paymentMethod === "Cash" ? "green" : "blue"
                        }
                      >
                        {expense.paymentMethod}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600} size="sm">
                        {formatCurrency(expense.total)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="gray" size="xs">
                        {expense.itemCount} items
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Center p="xl">
              <Stack align="center">
                <IconFileText size="3rem" color="var(--mantine-color-gray-5)" />
                <Text c="dimmed">
                  No expenses found for the selected period
                </Text>
              </Stack>
            </Center>
          )}
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

    return (
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text fw={600} size="lg">
            {data.periodLabel}
          </Text>
          <Badge variant="light" color="gray">
            {new Date(data.startDate).toLocaleDateString()} –{" "}
            {new Date(data.endDate).toLocaleDateString()}
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

              <Group justify="space-between">
                <Text c="dimmed" size="sm" fw={700}>
                  Net Sales
                </Text>
                <Text fw={800} c="green">
                  {formatCurrency(data.netSales)}
                </Text>
              </Group>
            </Stack>
          </Paper>

          {/* RIGHT: Payment methods with totals row */}
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
        </SimpleGrid>

        {/* BOTTOM: transactions column only */}
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
      </Stack>
    );
  };

  return (
    <>
      <Global
        styles={`
          @page { size: A4; margin: 14mm; }

          @media print {
            html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-size: 12.5px; }           /* restores the tighter, cleaner type */
            .no-print { display: none !important; }
            .only-print { display: block !important; }

            /* keep the in-app look */
            .print-container { max-width: 1200px !important; margin: 0 auto !important; padding: 0 24px !important; }
            .mantine-Paper-root { background: #fff !important; border: 1px solid var(--mantine-color-gray-3) !important; box-shadow: none !important; }
            .mantine-Table-table, .mantine-Table-thead, .mantine-Table-tbody, .mantine-Table-tfoot,
            .mantine-Table-tr, .mantine-Table-th, .mantine-Table-td { border-color: var(--mantine-color-gray-3) !important; }
            .mantine-Tabs-list { display: none !important; }
            h1,h2,h3,h4,h5,h6 { break-after: avoid; }
            .avoid-break { break-inside: avoid; page-break-inside: avoid; }

            /* ---- PRINT HEADER (company + report title + dates) ---- */
            .print-company { text-align: center; font-weight: 800; font-size: 18px; letter-spacing: .3px; margin: 0 0 4px; }
            .print-title   { text-align: center; font-weight: 700; font-size: 16px; margin: 0 0 4px; }
            .print-subtitle{ text-align: center; color: var(--mantine-color-gray-7); margin-bottom: 12px; }

            /* ---- SIGNATURES pinned to bottom (safe for page 1) ---- */
            .signature-fixed {
              position: fixed;
              left: 14mm; right: 14mm; bottom: 14mm;   /* aligns to @page margins */
              break-inside: avoid; page-break-inside: avoid;
            }

            /* Reserve space so fixed footer won't overlap content */
            .signature-spacer {
              height: 44mm;                             /* tune if you change footer height */
              display: flex; align-items: flex-end; justify-content: center;
            }

            /* “Nothing Follows” styling */
            .nothing-follows {
              font-size: 11px; color: var(--mantine-color-gray-7);
              text-align: center; width: 100%;
              display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
            }
            .nothing-follows::before, .nothing-follows::after {
              content: ""; flex: 1; height: 1px; background: var(--mantine-color-gray-4);
            }

            /* Signature grid */
            .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            .sig-box  { padding-top: 8px; }
            .sig-line { border-top: 1px solid var(--mantine-color-gray-6); margin-top: 22px; }
            .sig-label{ font-size: 12px; color: var(--mantine-color-gray-7); }
          }

          .only-print { display: none; }
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
              <div className="print-title">
                Reports &amp; Analytics — {activeTabLabel}
              </div>
              <div className="print-subtitle">
                {startDate ? new Date(startDate).toLocaleDateString() : ""} –{" "}
                {endDate ? new Date(endDate).toLocaleDateString() : ""}
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
                  value="products"
                  leftSection={<IconPackage size={16} />}
                >
                  Sales by Product
                </Tabs.Tab>
                <Tabs.Tab
                  value="tests"
                  leftSection={<IconTestPipe size={16} />}
                >
                  Sales by Tests
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

              <Tabs.Panel value="products" pt="md">
                <ProductsTab />
              </Tabs.Panel>

              <Tabs.Panel value="tests" pt="md">
                <TestsTab />
              </Tabs.Panel>

              <Tabs.Panel value="employees" pt="md">
                <EmployeesTab />
              </Tabs.Panel>

              <Tabs.Panel value="expenses" pt="md">
                <ExpensesTab />
              </Tabs.Panel>
            </Tabs>

            <div className="only-print signature-spacer">
              <div className="nothing-follows">— Nothing Follows —</div>
            </div>
            <div className="only-print signature-fixed">
              <div className="signature-grid">
                <div className="sig-box">
                  <div className="sig-line"></div>
                  <Text className="sig-label">Reported by:</Text>
                </div>
                <div className="sig-box">
                  <div className="sig-line"></div>
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
