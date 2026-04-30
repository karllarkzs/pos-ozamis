import { useState } from "react";
import { useForm } from "@mantine/form";
import {
  Modal,
  PasswordInput,
  Button,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useChangePassword } from "../hooks/api/useUsers";

interface Props {
  opened: boolean;
  onClose: () => void;
  userId: string;
}

export default function ResetPasswordModal({ opened, onClose, userId }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validate: {
      newPassword: (value: string) =>
        !value || value.length < 6
          ? "Password must be at least 6 characters"
          : null,
      confirmPassword: (value: string, values: any) =>
        value !== values.newPassword ? "Passwords do not match" : null,
    },
  });

  const changePassword = useChangePassword();

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setIsSubmitting(true);
      await changePassword.mutateAsync({
        userId,
        newPassword: values.newPassword,
      });
      onClose();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error?.response?.data?.message || "Failed to change password",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
      form.reset();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>Change Password</Text>}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <PasswordInput
            label="New Password"
            placeholder="Enter new password"
            required
            {...form.getInputProps("newPassword")}
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Re-enter new password"
            required
            {...form.getInputProps("confirmPassword")}
          />

          <Group position="right" mt="md">
            <Button variant="subtle" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Change Password
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
