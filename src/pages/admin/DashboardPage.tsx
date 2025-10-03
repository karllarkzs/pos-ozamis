import { useState } from "react";
import {
  Container,
  Title,
  Stack,
  Alert,
  Paper,
  Group,
  Text,
  Select,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
  IconDashboard,
  IconAlertCircle,
  IconCalendar,
} from "@tabler/icons-react";
import { ComprehensiveDashboardOverview } from "../../components/ComprehensiveDashboardOverview";
import { InventoryAlerts } from "../../components/InventoryAlerts";

export function DashboardPage() {
  
  const [startDate, setStartDate] = useState<Date | null>(new Date()); 
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  
  const [selectedPeriod, setSelectedPeriod] = useState<string>("today");

  
  const formatDateLocal = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  
  const startDateStr = formatDateLocal(startDate);
  const endDateStr = formatDateLocal(endDate);

  
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

    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (
      startDate.getTime() === startOfMonth.getTime() &&
      endDate.getTime() === today.getTime()
    ) {
      return "thisMonth";
    }

    
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    if (
      startDate.getTime() === startOfYear.getTime() &&
      endDate.getTime() === today.getTime()
    ) {
      return "thisYear";
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

      case "thisMonth":
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setEndDate(new Date(now));
        break;

      case "thisYear":
        setStartDate(new Date(now.getFullYear(), 0, 1));
        setEndDate(new Date(now));
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

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        {}
        <Group justify="space-between" align="center">
          <Title order={1}>
            <IconDashboard size={32} style={{ marginRight: "12px" }} />
            Analytics Dashboard
          </Title>
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
                    { value: "thisMonth", label: "This Month" },
                    { value: "thisYear", label: "This Year" },
                    { value: "custom", label: "Custom" },
                  ]}
                  w={140}
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
        <ComprehensiveDashboardOverview
          period={selectedPeriod as any}
          startDate={startDateStr}
          endDate={endDateStr}
        />

        {}
        <Stack gap="xl">
          <InventoryAlerts />
        </Stack>

        {}
        <Alert
          color="blue"
          title="Real-time Data"
          icon={<IconAlertCircle size={16} />}
          variant="light"
        >
          All metrics are calculated in real-time from your live data. Dashboard
          refreshes automatically every 5 minutes to ensure you have the most
          current information.
        </Alert>
      </Stack>
    </Container>
  );
}
