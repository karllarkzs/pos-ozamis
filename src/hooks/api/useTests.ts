import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TestFilters,
  CreateTestRequest,
  UpdateTestRequest,
  PerformTestRequest,
} from "../../types/global";
import { apiEndpoints } from "../../lib/api";

export const testKeys = {
  all: ["tests"] as const,
  lists: () => [...testKeys.all, "list"] as const,
  list: (filters: TestFilters) => [...testKeys.lists(), filters] as const,
  details: () => [...testKeys.all, "detail"] as const,
  detail: (id: string) => [...testKeys.details(), id] as const,
  cannotPerform: (filters?: TestFilters) =>
    [...testKeys.all, "cannot-perform", filters] as const,
  withReagents: (filters?: TestFilters) =>
    [...testKeys.all, "with-reagents", filters] as const,
  summary: () => [...testKeys.all, "summary"] as const,
};

export function useTests(filters?: TestFilters) {
  return useQuery({
    queryKey: testKeys.list(filters ?? {}),
    queryFn: async () => {
      const response = await apiEndpoints.tests.getAll(filters);
      return response.data;
    },
  });
}

export function useTest(id: string) {
  return useQuery({
    queryKey: testKeys.detail(id),
    queryFn: async () => {
      const response = await apiEndpoints.tests.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (test: CreateTestRequest) => {
      const response = await apiEndpoints.tests.create(test);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testKeys.summary() });
    },
  });
}

export function useUpdateTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTestRequest) => {
      const { id, ...updateData } = data;
      const response = await apiEndpoints.tests.update(id, updateData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: testKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: testKeys.summary() });
    },
  });
}

export function useDeleteTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiEndpoints.tests.delete(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testKeys.summary() });
    },
  });
}

export function usePerformTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: PerformTestRequest & { id: string }) => {
      const response = await apiEndpoints.tests.perform(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: testKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: testKeys.summary() });
    },
  });
}

export function useTestSummary() {
  return useQuery({
    queryKey: testKeys.summary(),
    queryFn: async () => {
      const response = await apiEndpoints.tests.getSummary();
      return response.data;
    },
  });
}

export function useCannotPerformTests(filters?: TestFilters) {
  return useQuery({
    queryKey: testKeys.cannotPerform(filters),
    queryFn: async () => {
      const response = await apiEndpoints.tests.getCannotPerform(filters);
      return response.data;
    },
  });
}

export function useTestsWithReagents(filters?: TestFilters) {
  return useQuery({
    queryKey: testKeys.withReagents(filters),
    queryFn: async () => {
      const response = await apiEndpoints.tests.getWithReagents(filters);
      return response.data;
    },
  });
}

export function useCanPerformTest(id: string) {
  return useQuery({
    queryKey: [...testKeys.all, "canPerform", id],
    queryFn: async () => {
      const response = await apiEndpoints.tests.canPerform(id);
      return response.data;
    },
    enabled: !!id,
  });
}
