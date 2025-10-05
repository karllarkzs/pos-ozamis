import { Container, Title, Text, Button, Stack, Paper } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/hooks";
import { getDefaultRouteForRole } from "../store/slices/authSlice";

export function ForbiddenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (user) {
      const defaultRoute = getDefaultRouteForRole(user.role);
      navigate(defaultRoute);
    } else {
      navigate("/");
    }
  };

  return (
    <Container size="sm" style={{ marginTop: "10rem" }}>
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" gap="lg">
          <IconLock size={80} color="var(--mantine-color-red-6)" />
          <Title order={1}>403 - Access Denied</Title>
          <Text size="lg" c="dimmed" ta="center">
            You don't have permission to access this page.
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            This area is restricted to authorized personnel only.
          </Text>
          <Button onClick={handleGoBack} size="md">
            Go to Home
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
