import { Container, Title, Text, Button, Stack, Paper } from "@mantine/core";
import { IconError404 } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/hooks";
import { getDefaultRouteForRole } from "../store/slices/authSlice";

export function NotFoundPage() {
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
          <IconError404 size={80} color="var(--mantine-color-gray-6)" />
          <Title order={1}>404 - Page Not Found</Title>
          <Text size="lg" c="dimmed" ta="center">
            The page you're looking for doesn't exist.
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            The URL may be mistyped or the page may have been moved.
          </Text>
          <Button onClick={handleGoBack} size="md">
            Go to Home
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}

