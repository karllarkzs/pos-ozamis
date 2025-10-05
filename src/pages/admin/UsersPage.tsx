import { useState, useMemo } from "react";
import {
  Container,
  Title,
  Group,
  Button,
  Badge,
  Text,
  Loader,
  Center,
  Stack,
} from "@mantine/core";
import {
  IconUserPlus,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import { DataTable, DataTableColumn } from "../../components/DataTable";
import { useUsers } from "../../hooks/api/useUsers";
import { UserModal } from "../../components/UserModal";
import type { User as BaseUser, UserRole } from "../../lib/api";

type User = BaseUser & { roleName?: string };

export function UsersPage() {
  const [userModalOpened, setUserModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const { data: users = [], isLoading, refetch } = useUsers(false);

  const handleAddUser = () => {
    setSelectedUser(null);
    setModalMode("create");
    setUserModalOpened(true);
  };

  const handleRowClick = (user: User) => {
    setSelectedUser(user);
    setModalMode("edit");
    setUserModalOpened(true);
  };

  const handleModalClose = () => {
    setUserModalOpened(false);
    setSelectedUser(null);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "SuperAdmin":
        return "red";
      case "Admin":
        return "blue";
      case "Cashier":
        return "green";
      case "Lab":
        return "violet";
      case "MedTech":
        return "teal";
      default:
        return "gray";
    }
  };

  const columns: DataTableColumn<User>[] = useMemo(
    () => [
      {
        key: "profile.fullName",
        title: "Name",
        sortable: true,
        render: (user: User) => (
          <Text fw={500}>{user.profile?.fullName || user.userName}</Text>
        ),
      },
      {
        key: "userName",
        title: "Username",
        sortable: true,
      },
      {
        key: "email",
        title: "Email",
        sortable: true,
      },
      {
        key: "roleName",
        title: "Role",
        sortable: true,
        render: (user: User) => {
          const validRoles: UserRole[] = [
            "SuperAdmin",
            "Admin",
            "Cashier",
            "Lab",
            "MedTech",
          ];
          const color = getRoleBadgeColor(
            validRoles.includes(user.roleName as UserRole)
              ? (user.roleName as UserRole)
              : "MedTech"
          );
          return (
            <Badge color={color} variant="light">
              {user.roleName || "Unknown"}
            </Badge>
          );
        },
      },
      {
        key: "isActive",
        title: "Status",
        sortable: true,
        render: (user: User) => (
          <Group gap="xs">
            {user.isActive ? (
              <>
                <IconCircleCheck size={16} color="green" />
                <Text size="sm" c="green">
                  Active
                </Text>
              </>
            ) : (
              <>
                <IconCircleX size={16} color="red" />
                <Text size="sm" c="red">
                  Inactive
                </Text>
              </>
            )}
          </Group>
        ),
      },
      {
        key: "lastLoginAt",
        title: "Last Login",
        sortable: true,
        render: (user: User) => (
          <Text size="sm" c="dimmed">
            {user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleDateString()
              : "Never"}
          </Text>
        ),
      },
      {
        key: "createdAt",
        title: "Created",
        sortable: true,
        render: (user: User) => (
          <Text size="sm" c="dimmed">
            {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <Container size="xl" py="md">
        <Center style={{ height: "60vh" }}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Loading users...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container
      px="md"
      py="md"
      style={{
        height: "100%",
        maxWidth: "none",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <Group justify="space-between" mb="md">
          <Title order={2}>User Management</Title>
          <Button
            leftSection={<IconUserPlus size={16} />}
            onClick={handleAddUser}
          >
            Add User
          </Button>
        </Group>
      </div>

      <DataTable
        data={users}
        columns={columns}
        onRowClick={(user: User) => handleRowClick(user)}
        emptyMessage="No users found"
        height="calc(100vh - 200px)"
        stickyHeader
      />

      <UserModal
        opened={userModalOpened}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        user={selectedUser}
        mode={modalMode}
      />
    </Container>
  );
}
