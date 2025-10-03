import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiEndpoints,
  RestockBatch,
  RestockBatchFilters,
  RestockBatchSummary,
  CreateRestockBatchRequest,
  RestockBatchResponse,
} from "../../lib/api";

export const restockBatchKeys = {
  all: ["restockBatches"] as const,
  lists: () => [...restockBatchKeys.all, "list"] as const,
  list: (filters: RestockBatchFilters) =>
    [...restockBatchKeys.lists(), { filters }] as const,
  details: () => [...restockBatchKeys.all, "detail"] as const,
  detail: (id: string) => [...restockBatchKeys.details(), id] as const,
  summary: () => [...restockBatchKeys.all, "summary"] as const,
  summaryWithFilters: (filters: { from?: string; to?: string }) =>
    [...restockBatchKeys.summary(), filters] as const,
  recent: (filters: { days?: number } & RestockBatchFilters) =>
    [...restockBatchKeys.all, "recent", filters] as const,
  companies: () => [...restockBatchKeys.all, "companies"] as const,
  receivedByUsers: () => [...restockBatchKeys.all, "receivedByUsers"] as const,
  topByValue: (limit: number) =>
    [...restockBatchKeys.all, "topByValue", limit] as const,
};

export function useRestockBatches(filters?: RestockBatchFilters) {
  return useQuery({
    queryKey: restockBatchKeys.list(filters || {}),
    queryFn: async (): Promise<RestockBatchResponse> => {
      const response = await apiEndpoints.restockBatches.getAll(filters);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, 
    refetchInterval: 5 * 60 * 1000, 
  });
}

export function useRestockBatch(id: string) {
  return useQuery({
    queryKey: restockBatchKeys.detail(id),
    queryFn: async (): Promise<RestockBatch> => {
      const response = await apiEndpoints.restockBatches.getById(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, 
  });
}

export function useRestockBatchSummary(filters?: {
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: restockBatchKeys.summaryWithFilters(filters || {}),
    queryFn: async (): Promise<RestockBatchSummary> => {
      const response = await apiEndpoints.restockBatches.getSummary(filters);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, 
    refetchInterval: 10 * 60 * 1000, 
  });
}

export function useRecentRestockBatches(
  params?: { days?: number } & RestockBatchFilters
) {
  return useQuery({
    queryKey: restockBatchKeys.recent(params || {}),
    queryFn: async (): Promise<RestockBatchResponse> => {
      const response = await apiEndpoints.restockBatches.getRecent(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, 
    refetchInterval: 5 * 60 * 1000, 
  });
}

export function useTopRestockBatches(limit: number = 10) {
  return useQuery({
    queryKey: restockBatchKeys.topByValue(limit),
    queryFn: async (): Promise<RestockBatch[]> => {
      const response = await apiEndpoints.restockBatches.getTopByValue(limit);
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000, 
  });
}

export function useRestockBatchCompanies() {
  return useQuery({
    queryKey: restockBatchKeys.companies(),
    queryFn: async (): Promise<string[]> => {
      const response = await apiEndpoints.restockBatches.getCompanies();
      return response.data;
    },
    staleTime: 30 * 60 * 1000, 
  });
}

export function useRestockBatchReceivedByUsers() {
  return useQuery({
    queryKey: restockBatchKeys.receivedByUsers(),
    queryFn: async (): Promise<string[]> => {
      const response = await apiEndpoints.restockBatches.getReceivedByUsers();
      return response.data;
    },
    staleTime: 30 * 60 * 1000, 
  });
}

export function useCreateRestockBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      batch: CreateRestockBatchRequest
    ): Promise<RestockBatch> => {
      const response = await apiEndpoints.restockBatches.create(batch);
      return response.data.data;
    },
    onSuccess: (data) => {
      
      queryClient.invalidateQueries({ queryKey: restockBatchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: restockBatchKeys.summary() });
      queryClient.invalidateQueries({ queryKey: restockBatchKeys.recent({}) });

      
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reagents"] });
      queryClient.invalidateQueries({ queryKey: ["productSummary"] });
      queryClient.invalidateQueries({ queryKey: ["reagentSummary"] });

      
      queryClient.setQueryData(restockBatchKeys.detail(data.id), data);
    },
    onError: (error) => {
      console.error("Create restock batch error:", error);
    },
  });
}

export function useUpdateRestockBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { notes?: string; supplierReference?: string };
    }): Promise<RestockBatch> => {
      const response = await apiEndpoints.restockBatches.update(id, updates);
      return response.data.data;
    },
    onSuccess: (data) => {
      
      queryClient.setQueryData(restockBatchKeys.detail(data.id), data);

      
      queryClient.invalidateQueries({ queryKey: restockBatchKeys.lists() });
    },
    onError: (error) => {
      console.error("Update restock batch error:", error);
    },
  });
}

export function useDeleteRestockBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiEndpoints.restockBatches.delete(id);
    },
    onSuccess: (_, id) => {
      
      queryClient.removeQueries({ queryKey: restockBatchKeys.detail(id) });

      
      queryClient.invalidateQueries({ queryKey: restockBatchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: restockBatchKeys.summary() });
      queryClient.invalidateQueries({ queryKey: restockBatchKeys.recent({}) });
    },
    onError: (error) => {
      console.error("Delete restock batch error:", error);
    },
  });
}

