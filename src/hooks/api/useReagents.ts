import {
  useQuery,
  useQueryClient,
  useMutation,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  apiEndpoints,
  ReagentResponse,
  ReagentFilters,
  Reagent,
  CreateReagentRequest,
  UpdateReagentRequest,
  ReagentSummary,
  UpdateStockRequest,
  MaintenanceConsumptionRequest,
} from "../../lib/api";

export const reagentKeys = {
  all: ["reagents"] as const,
  lists: () => [...reagentKeys.all, "list"] as const,
  list: (filters: any) => [...reagentKeys.lists(), filters] as const,
  infinite: (filters: any) =>
    [...reagentKeys.lists(), "infinite", filters] as const,
  details: () => [...reagentKeys.all, "detail"] as const,
  detail: (id: string) => [...reagentKeys.details(), id] as const,
  summary: () => [...reagentKeys.all, "summary"] as const,
  lowStock: () => [...reagentKeys.all, "lowStock"] as const,
  expired: () => [...reagentKeys.all, "expired"] as const,
  expiringSoon: (days: number) =>
    [...reagentKeys.all, "expiringSoon", days] as const,
  chargeBased: () => [...reagentKeys.all, "chargeBased"] as const,
  volumeBased: () => [...reagentKeys.all, "volumeBased"] as const,
};

export function useReagents(filters?: ReagentFilters) {
  const filtersKey = filters || {};

  return useQuery({
    queryKey: reagentKeys.list(filtersKey),
    queryFn: async (): Promise<ReagentResponse> => {
      const response = await apiEndpoints.reagents.getAll(filters);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, 
    placeholderData: {
      data: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  });
}

export function useInfiniteReagents(filters?: Omit<ReagentFilters, "page">) {
  const filtersKey = filters || {};

  return useInfiniteQuery({
    queryKey: reagentKeys.infinite(filtersKey),
    queryFn: async ({ pageParam = 1 }): Promise<ReagentResponse> => {
      const response = await apiEndpoints.reagents.getAll({
        ...filters,
        page: pageParam,
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: {
      pages: [
        {
          data: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      ],
      pageParams: [1],
    },
  });
}

export function useReagent(id: string) {
  return useQuery({
    queryKey: reagentKeys.detail(id),
    queryFn: async (): Promise<Reagent> => {
      const response = await apiEndpoints.reagents.getById(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, 
  });
}

export function useReagentSummary() {
  return useQuery({
    queryKey: reagentKeys.summary(),
    queryFn: async (): Promise<ReagentSummary> => {
      const response = await apiEndpoints.reagents.getSummary();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, 
  });
}

export function useReagentsForRestock(filters?: {
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: [...reagentKeys.all, "for-restock", filters],
    queryFn: async (): Promise<ReagentResponse> => {
      const response = await apiEndpoints.reagents.getForRestock(filters);
      return {
        ...response.data,
        pageSize: filters?.pageSize || 20,
      };
    },
    staleTime: 1 * 60 * 1000, 
  });
}

export function useInfiniteReagentsForRestock(filters?: { pageSize?: number }) {
  return useInfiniteQuery({
    queryKey: [...reagentKeys.all, "for-restock", "infinite", filters],
    queryFn: async ({ pageParam = 1 }): Promise<ReagentResponse> => {
      const response = await apiEndpoints.reagents.getForRestock({
        ...filters,
        page: pageParam,
        pageSize: filters?.pageSize || 20,
      });
      return {
        ...response.data,
        pageSize: filters?.pageSize || 20,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000,
  });
}

export function useLowStockReagents() {
  return useQuery({
    queryKey: reagentKeys.lowStock(),
    queryFn: async (): Promise<Reagent[]> => {
      const response = await apiEndpoints.reagents.getLowStock();
      return response.data.data;
    },
    staleTime: 1 * 60 * 1000, 
  });
}

export function useExpiredReagents() {
  return useQuery({
    queryKey: reagentKeys.expired(),
    queryFn: async (): Promise<Reagent[]> => {
      const response = await apiEndpoints.reagents.getExpired();
      return response.data.data;
    },
    staleTime: 1 * 60 * 1000, 
  });
}

export function useExpiringSoonReagents(days: number = 30) {
  return useQuery({
    queryKey: reagentKeys.expiringSoon(days),
    queryFn: async (): Promise<Reagent[]> => {
      const response = await apiEndpoints.reagents.getExpiringSoon(days);
      return response.data.data;
    },
    staleTime: 1 * 60 * 1000, 
  });
}

export function useChargeBasedReagents() {
  return useQuery({
    queryKey: reagentKeys.chargeBased(),
    queryFn: async (): Promise<Reagent[]> => {
      const response = await apiEndpoints.reagents.getChargeBased();
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, 
  });
}

export function useVolumeBasedReagents() {
  return useQuery({
    queryKey: reagentKeys.volumeBased(),
    queryFn: async (): Promise<Reagent[]> => {
      const response = await apiEndpoints.reagents.getVolumeBased();
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, 
  });
}

export function useCreateReagent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reagentData: CreateReagentRequest): Promise<Reagent> => {
      const response = await apiEndpoints.reagents.create(reagentData);
      return response.data.data;
    },
    onSuccess: () => {
      
      queryClient.invalidateQueries({ queryKey: reagentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reagentKeys.summary() });
      queryClient.invalidateQueries({ queryKey: reagentKeys.lowStock() });
    },
    onError: (error: any) => {
      console.error("Failed to create reagent:", error);
    },
  });
}

export function useUpdateReagent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reagentData,
    }: {
      id: string;
      reagentData: UpdateReagentRequest;
    }): Promise<Reagent> => {
      const response = await apiEndpoints.reagents.update(id, reagentData);
      return response.data.data;
    },
    onSuccess: (updatedReagent, { id }) => {
      
      queryClient.setQueryData(reagentKeys.detail(id), updatedReagent);

      
      queryClient.invalidateQueries({ queryKey: reagentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reagentKeys.summary() });
      queryClient.invalidateQueries({ queryKey: reagentKeys.lowStock() });
    },
    onError: (error: any) => {
      console.error("Failed to update reagent:", error);
    },
  });
}

export function useDeleteReagent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiEndpoints.reagents.delete(id);
    },
    onSuccess: (_, id) => {
      
      queryClient.removeQueries({ queryKey: reagentKeys.detail(id) });

      
      queryClient.invalidateQueries({ queryKey: reagentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reagentKeys.summary() });
      queryClient.invalidateQueries({ queryKey: reagentKeys.lowStock() });
    },
    onError: (error: any) => {
      console.error("Failed to delete reagent:", error);
    },
  });
}

export function useUpdateReagentStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      stockData,
    }: {
      id: string;
      stockData: UpdateStockRequest;
    }): Promise<Reagent> => {
      const response = await apiEndpoints.reagents.updateStock(id, stockData);
      return response.data.data;
    },
    onSuccess: (updatedReagent, { id }) => {
      
      queryClient.setQueryData(reagentKeys.detail(id), updatedReagent);

      
      queryClient.invalidateQueries({ queryKey: reagentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reagentKeys.summary() });
      queryClient.invalidateQueries({ queryKey: reagentKeys.lowStock() });
    },
    onError: (error: any) => {
      console.error("Failed to update reagent stock:", error);
    },
  });
}

export function useRecordMaintenanceConsumption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      consumptionData: MaintenanceConsumptionRequest
    ): Promise<void> => {
      await apiEndpoints.reagents.recordMaintenanceConsumption(consumptionData);
    },
    onSuccess: () => {
      
      queryClient.invalidateQueries({ queryKey: reagentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reagentKeys.summary() });
      queryClient.invalidateQueries({ queryKey: reagentKeys.lowStock() });
    },
    onError: (error: any) => {
      console.error("Failed to record maintenance consumption:", error);
    },
  });
}

export function useCreateReagentsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiEndpoints.reagents.createBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reagentKeys.all });
      queryClient.invalidateQueries({ queryKey: reagentKeys.summary() });
    },
  });
}

export function useEditReagentsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiEndpoints.reagents.editBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reagentKeys.all });
      queryClient.invalidateQueries({ queryKey: reagentKeys.summary() });
    },
  });
}

export function useDeleteReagentsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiEndpoints.reagents.deleteBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reagentKeys.all });
      queryClient.invalidateQueries({ queryKey: reagentKeys.summary() });
    },
  });
}
