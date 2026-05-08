import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiEndpoints } from "../../lib/api";
import type {
  LabTest,
  LabTestFilters,
  LabTestCreate,
  LabTestUpdate,
  PaginatedLabTestResponse,
} from "../../types/labtest.types";

export const labTestKeys = {
  all: ["labTests"] as const,
  lists: () => [...labTestKeys.all, "list"] as const,
  list: (filters: any) => [...labTestKeys.lists(), filters] as const,
  infinite: (filters: any) =>
    [...labTestKeys.lists(), "infinite", filters] as const,
  details: () => [...labTestKeys.all, "detail"] as const,
  detail: (id: string) => [...labTestKeys.details(), id] as const,
};

export function useInfiniteLabTests(filters?: Omit<LabTestFilters, "page">) {
  return useInfiniteQuery({
    queryKey: labTestKeys.infinite(filters || {}),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedLabTestResponse> => {
      const filtersWithPage: LabTestFilters = {
        ...filters,
        page: pageParam as number,
        pageSize: filters?.pageSize || 50,
      };
      const response = await apiEndpoints.labTests.getAll(filtersWithPage);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const fetched = lastPage.page * lastPage.pageSize;
      return fetched < lastPage.totalCount ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateLabTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LabTestCreate) => apiEndpoints.labTests.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labTestKeys.lists() });
    },
  });
}

export function useUpdateLabTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LabTestUpdate }) =>
      apiEndpoints.labTests.update(id, data),
    onSuccess: (_res, { id }) => {
      queryClient.invalidateQueries({ queryKey: labTestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: labTestKeys.detail(id) });
    },
  });
}

export function useDeleteLabTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiEndpoints.labTests.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labTestKeys.lists() });
    },
  });
}

export function useToggleLabTestAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiEndpoints.labTests.toggleAvailability(id),
    onSuccess: (response) => {
      const updated: LabTest = response.data;
      queryClient.setQueriesData<InfiniteData<PaginatedLabTestResponse>>(
        { queryKey: labTestKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            })),
          };
        },
      );
    },
  });
}

export type { LabTest, LabTestFilters, LabTestCreate, LabTestUpdate };
