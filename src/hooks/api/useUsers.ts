import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  apiEndpoints,
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from "../../lib/api";
import { notifications } from "@mantine/notifications";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (includeInactive: boolean) =>
    [...userKeys.lists(), includeInactive] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export function useUsers(includeInactive: boolean = false) {
  return useQuery({
    queryKey: userKeys.list(includeInactive),
    queryFn: async (): Promise<User[]> => {
      const response = await apiEndpoints.users.getAll(includeInactive);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async (): Promise<User> => {
      const response = await apiEndpoints.users.getById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUserRequest) => {
      const response = await apiEndpoints.users.create(userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      userData,
    }: {
      id: string;
      userData: UpdateUserRequest;
    }) => {
      const response = await apiEndpoints.users.update(id, userData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiEndpoints.users.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      notifications.show({
        title: "Success",
        message: "User deactivated successfully",
        color: "green",
      });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiEndpoints.users.activate(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      notifications.show({
        title: "Success",
        message: "User activated successfully",
        color: "green",
      });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiEndpoints.users.deactivate(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      notifications.show({
        title: "Success",
        message: "User deactivated successfully",
        color: "green",
      });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({
      userId,
      newPassword,
    }: {
      userId: string;
      newPassword: string;
    }) => {
      const response = await apiEndpoints.users.changePassword(
        userId,
        newPassword
      );
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: "Success",
        message: "Password changed successfully",
        color: "green",
      });
    },
  });
}

