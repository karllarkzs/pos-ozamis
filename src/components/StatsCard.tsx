import { Paper, Group, Text, ThemeIcon, Skeleton } from "@mantine/core";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  color?: string;
  loading?: boolean;
  description?: string;
}

export function StatsCard({
  title,
  value,
  trend,
  icon,
  color = "blue",
  loading = false,
  description,
}: StatsCardProps) {
  if (loading) {
    return (
      <Paper p="md" withBorder>
        <Group justify="space-between">
          <div style={{ flex: 1 }}>
            <Skeleton height={14} mb="xs" />
            <Skeleton height={28} mb="xs" />
            {trend && <Skeleton height={14} width="60%" />}
          </div>
          {icon && <Skeleton height={40} width={40} />}
        </Group>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder radius="md">
      <Group justify="space-between" align="flex-start">
        <div style={{ flex: 1 }}>
          <Text size="xs" color="dimmed" fw={700} tt="uppercase">
            {title}
          </Text>
          <Text size="xl" fw={700} mt={4}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </Text>

          {description && (
            <Text size="xs" color="dimmed" mt={4}>
              {description}
            </Text>
          )}

          {trend && (
            <Group gap={4} mt={8}>
              <ThemeIcon
                size="sm"
                color={trend.isPositive ? "green" : "red"}
                variant="light"
                radius="xl"
              >
                {trend.isPositive ? (
                  <IconTrendingUp size={14} />
                ) : (
                  <IconTrendingDown size={14} />
                )}
              </ThemeIcon>
              <Text
                size="xs"
                fw={500}
                color={trend.isPositive ? "green" : "red"}
              >
                {trend.value}
              </Text>
            </Group>
          )}
        </div>

        {icon && (
          <ThemeIcon color={color} size="lg" radius="md" variant="light">
            {icon}
          </ThemeIcon>
        )}
      </Group>
    </Paper>
  );
}
