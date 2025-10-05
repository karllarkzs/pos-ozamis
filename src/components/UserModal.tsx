import { useState, useEffect } from "react";
import { useForm } from "@mantine/form";
import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Divider,
  Badge,
  PasswordInput,
  Switch,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconUser,
  IconDeviceFloppy,
  IconTrash,
  IconAlertCircle,
} from "@tabler/icons-react";
import type {
  User,
  UserRole,
  CreateUserRequest,
  UpdateUserRequest,
} from "../lib/api";
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "../hooks/api/useUsers";
import { useRoles } from "../hooks/api";
import { modals } from "@mantine/modals";

interface UserModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
  mode: "create" | "edit";
}

interface UserFormValues {
  userName: string;
  email: string;
  password: string;
  role: number;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

const createEmptyFormValues = (): UserFormValues => ({
  userName: "",
  email: "",
  password: "",
  role: 2,
  firstName: "",
  lastName: "",
  isActive: true,
});

export function UserModal({
  opened,
  onClose,
  onSuccess,
  user,
  mode,
}: UserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const { data: roles, isLoading: rolesLoading } = useRoles();

  const form = useForm<UserFormValues>({
    initialValues: createEmptyFormValues(),
    validate: {
      userName: (value) =>
        !value || value.trim().length < 3
          ? "Username must be at least 3 characters"
          : value.trim().length > 50
          ? "Username must be less than 50 characters"
          : null,
      email: (value) => {
        if (!value || !value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Invalid email format";
        if (value.length > 255) return "Email must be less than 255 characters";
        return null;
      },
      password: (value) =>
        mode === "create" && (!value || value.length < 6)
          ? "Password must be at least 6 characters"
          : null,
      role: (value) => (!value ? "Role is required" : null),
      firstName: (value) =>
        !value || value.trim().length < 1
          ? "First name is required"
          : value.trim().length > 100
          ? "First name must be less than 100 characters"
          : null,
      lastName: (value) =>
        !value || value.trim().length < 1
          ? "Last name is required"
          : value.trim().length > 100
          ? "Last name must be less than 100 characters"
          : null,
    },
  });

  useEffect(() => {
    if (mode === "edit" && user && roles) {
      const userRoleObj = roles.find((r) => r.name === user.role);
      const roleId = userRoleObj ? userRoleObj.id : 2;

      form.setValues({
        userName: user.userName || "",
        email: user.email || "",
        password: "",
        role: roleId,
        firstName: user.profile?.firstName || "",
        lastName: user.profile?.lastName || "",
        isActive: user.isActive,
      });
    }
  }, [user, mode, roles]);

  const handleSubmit = async (values: UserFormValues) => {
    try {
      setIsSubmitting(true);

      if (mode === "create") {
        const userData: CreateUserRequest = {
          userName: values.userName.trim(),
          email: values.email.trim(),
          password: values.password,
          role: values.role,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
        };

        await createUserMutation.mutateAsync(userData);
        notifications.show({
          title: "Success",
          message: "User created successfully",
          color: "green",
        });
      } else if (user) {
        const userData: UpdateUserRequest = {
          userName: values.userName.trim(),
          email: values.email.trim(),
          role: values.role,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          isActive: values.isActive,
        };

        await updateUserMutation.mutateAsync({
          id: user.id,
          userData,
        });
        notifications.show({
          title: "Success",
          message: "User updated successfully",
          color: "green",
        });
      }

      handleClose();
      onSuccess();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          `Failed to ${mode} user`,
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!user) return;

    modals.openConfirmModal({
      title: "Deactivate User",
      children: (
        <Text size="sm">
          Are you sure you want to deactivate{" "}
          <strong>{user.profile?.fullName || user.userName}</strong>? They will
          no longer be able to log in.
        </Text>
      ),
      labels: { confirm: "Deactivate", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteUserMutation.mutateAsync(user.id);
          handleClose();
          onSuccess();
        } catch (error: any) {
          notifications.show({
            title: "Error",
            message:
              error?.response?.data?.error || "Failed to deactivate user",
            color: "red",
          });
        }
      },
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  const getRoleBadgeColor = (roleId: number) => {
    const role = roles?.find((r) => r.id === roleId);
    if (!role) return "gray";

    switch (role.name) {
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

  const getRoleName = (roleId: number) => {
    const role = roles?.find((r) => r.id === roleId);
    return role ? role.name : "Unknown";
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconUser size={20} />
          <Text fw={600}>
            {mode === "create" ? "Add New User" : "Edit User"}
          </Text>
        </Group>
      }
      size="lg"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={500} size="sm">
                  Basic Information
                </Text>
                <Badge
                  color={getRoleBadgeColor(form.values.role)}
                  variant="light"
                  size="sm"
                >
                  {getRoleName(form.values.role)}
                </Badge>
              </Group>
              <Divider />

              <Group grow>
                <TextInput
                  label="First Name"
                  placeholder="Enter first name"
                  required
                  {...form.getInputProps("firstName")}
                />
                <TextInput
                  label="Last Name"
                  placeholder="Enter last name"
                  required
                  {...form.getInputProps("lastName")}
                />
              </Group>

              <Group grow>
                <TextInput
                  label="Username"
                  placeholder="Enter username"
                  required
                  {...form.getInputProps("userName")}
                />
                <Select
                  label="Role"
                  placeholder="Select role"
                  required
                  disabled={rolesLoading}
                  data={
                    roles?.map((role) => ({
                      value: role.id.toString(),
                      label: `${role.name} - ${role.description}`,
                    })) || []
                  }
                  value={form.values.role.toString()}
                  onChange={(value) =>
                    form.setFieldValue("role", value ? parseInt(value) : 2)
                  }
                />
              </Group>
            </Stack>
          </Paper>

          <Paper p="md" withBorder>
            <Stack gap="md">
              <Text fw={500} size="sm">
                Account Information
              </Text>
              <Divider />

              <TextInput
                label="Email"
                placeholder="user@example.com"
                type="email"
                required
                {...form.getInputProps("email")}
              />

              {mode === "create" && (
                <>
                  <PasswordInput
                    label="Password"
                    placeholder="Enter password"
                    required
                    description="Minimum 6 characters"
                    {...form.getInputProps("password")}
                  />
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    color="blue"
                    variant="light"
                  >
                    Password requirements: minimum 6 characters, at least one
                    digit recommended
                  </Alert>
                </>
              )}

              {mode === "edit" && (
                <Switch
                  label="Active"
                  description={
                    form.values.isActive
                      ? "User can log in"
                      : "User cannot log in"
                  }
                  {...form.getInputProps("isActive", { type: "checkbox" })}
                />
              )}
            </Stack>
          </Paper>

          {mode === "edit" && user && (
            <Paper p="md" withBorder>
              <Stack gap="md">
                <Text fw={500} size="sm">
                  User Details
                </Text>
                <Divider />

                <Group grow>
                  <div>
                    <Text size="xs" c="dimmed">
                      Created
                    </Text>
                    <Text size="sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Last Login
                    </Text>
                    <Text size="sm">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString()
                        : "Never"}
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Paper>
          )}

          <Group justify="space-between" mt="lg">
            {mode === "edit" && user?.isActive && (
              <Button
                leftSection={<IconTrash size={16} />}
                color="red"
                variant="light"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                Deactivate
              </Button>
            )}
            <Group ml="auto">
              <Button
                variant="subtle"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {mode === "create" ? "Create User" : "Update User"}
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
