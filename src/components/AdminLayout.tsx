import { useState, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppShell,
  Group,
  UnstyledButton,
  Text,
  Avatar,
  ActionIcon,
  Divider,
  Stack,
  Box,
  Tooltip,
  Button,
} from "@mantine/core";
import {
  IconDashboard,
  IconPackage,
  IconReportAnalytics,
  IconUsers,
  IconSettings,
  IconMenu2,
  IconBuildingStore,
  IconLogout,
  IconCash,
} from "@tabler/icons-react";
import { useAuth } from "../store/hooks";
import { logout, getRoleName } from "../store/slices/authSlice";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick: () => void;
}

function NavItem({
  icon,
  label,
  isActive,
  isCollapsed,
  onClick,
}: NavItemProps) {
  const content = (
    <UnstyledButton
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        padding: "12px",
        borderRadius: "8px",
        textDecoration: "none",
        color: isActive ? "var(--mantine-color-blue-6)" : "inherit",
        backgroundColor: isActive
          ? "var(--mantine-color-blue-0)"
          : "transparent",
        border: isActive
          ? "1px solid var(--mantine-color-blue-3)"
          : "1px solid transparent",
      }}
      data-active={isActive || undefined}
    >
      <Group gap="sm" wrap="nowrap">
        {icon}
        {!isCollapsed && (
          <Text size="sm" fw={isActive ? 600 : 400}>
            {label}
          </Text>
        )}
      </Group>
    </UnstyledButton>
  );

  if (isCollapsed) {
    return (
      <Tooltip label={label} position="right" withArrow>
        {content}
      </Tooltip>
    );
  }

  return content;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, dispatch } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const navItems = [
    {
      icon: <IconDashboard size={isCollapsed ? 28 : 20} />,
      label: "Dashboard",
      path: "/admin/dashboard",
    },
    {
      icon: <IconPackage size={isCollapsed ? 28 : 20} />,
      label: "Inventory",
      path: "/admin/inventory",
    },
    {
      icon: <IconReportAnalytics size={isCollapsed ? 28 : 20} />,
      label: "Reports",
      path: "/admin/reports",
    },
    {
      icon: <IconUsers size={isCollapsed ? 28 : 20} />,
      label: "Users",
      path: "/admin/users",
    },
    {
      icon: <IconSettings size={isCollapsed ? 28 : 20} />,
      label: "Settings",
      path: "/admin/settings",
    },
  ];

  return (
    <AppShell
      navbar={{
        width: isCollapsed ? 80 : 250,
        breakpoint: 0,
        collapsed: { mobile: false, desktop: false },
      }}
      style={{
        width: "100vw",
        height: "100vh",
        
        maxHeight: "100%",
        overflow: "auto",
      }}
    >
      <AppShell.Navbar p="md">
        <Stack justify="space-between" h="100%">
          <Stack gap="sm">
            <Group
              justify={isCollapsed ? "center" : "space-between"}
              wrap="nowrap"
            >
              {!isCollapsed && (
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconBuildingStore
                      size={24}
                      color="var(--mantine-color-blue-6)"
                    />
                    <Text fw={600} size="lg">
                      OCT Pharmacy
                    </Text>
                  </Group>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconCash size={14} />}
                    onClick={() => navigate("/")}
                    fullWidth
                  >
                    Go to POS
                  </Button>
                </Stack>
              )}
              <ActionIcon
                variant="subtle"
                onClick={() => setIsCollapsed(!isCollapsed)}
                size="md"
              >
                <IconMenu2 size={isCollapsed ? 24 : 18} />
              </ActionIcon>
            </Group>

            <Divider />

            <Stack gap="xs">
              {navItems.map((item) => (
                <NavItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={location.pathname === item.path}
                  isCollapsed={isCollapsed}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </Stack>
          </Stack>

          <Box>
            <Divider mb="sm" />

            {isCollapsed ? (
              <Group justify="center">
                <Tooltip
                  label={`${user?.profile.firstName} ${user?.profile.lastName}\nClick to logout`}
                  position="right"
                  withArrow
                >
                  <ActionIcon
                    variant="subtle"
                    size="lg"
                    onClick={handleLogout}
                    style={{ borderRadius: "50%" }}
                  >
                    <Avatar size="sm" color="blue">
                      {user?.profile.firstName?.[0]}
                      {user?.profile.lastName?.[0]}
                    </Avatar>
                  </ActionIcon>
                </Tooltip>
              </Group>
            ) : (
              <UnstyledButton
                onClick={handleLogout}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--mantine-color-gray-3)",
                }}
              >
                <Group gap="sm" wrap="nowrap">
                  <Avatar size="sm" color="blue">
                    {user?.profile.firstName?.[0]}
                    {user?.profile.lastName?.[0]}
                  </Avatar>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={500} truncate>
                      {user?.profile.firstName} {user?.profile.lastName}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {user ? getRoleName(user.role) : ""}
                    </Text>
                  </Box>
                  <IconLogout size={16} style={{ opacity: 0.6 }} />
                </Group>
              </UnstyledButton>
            )}
          </Box>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          width: "100%",

          overflow: "auto",
        }}
      >
        <div
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
