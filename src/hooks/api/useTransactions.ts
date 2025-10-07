import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  apiEndpoints,
  Transaction,
  TransactionFilters,
  CreateTransactionRequest,
  VoidTransactionRequest,
  TransactionStatistics,
} from "../../lib/api";

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.lists(), filters] as const,
  infinite: (filters: Omit<TransactionFilters, "pageNumber">) =>
    [...transactionKeys.lists(), "infinite", filters] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  receipt: (receiptNumber: string) =>
    [...transactionKeys.all, "receipt", receiptNumber] as const,
  statistics: (params?: { startDate?: string; endDate?: string }) =>
    [...transactionKeys.all, "statistics", params] as const,
};

export function useInfiniteTransactions(
  filters?: Omit<TransactionFilters, "pageNumber">
) {
  return useInfiniteQuery({
    queryKey: transactionKeys.infinite(filters || {}),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiEndpoints.transactions.getAll({
        ...filters,
        pageNumber: pageParam,
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage
        ? lastPage.pagination.pageNumber + 1
        : undefined;
    },
    staleTime: 30 * 1000,
    refetchOnMount: "always",
  });
}

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters || {}),
    queryFn: async () => {
      const response = await apiEndpoints.transactions.getAll(filters);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useTransaction(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: async () => {
      const response = await apiEndpoints.transactions.getById(id);
      return response.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
    staleTime: 60 * 1000,
  });
}

export function useTransactionByReceipt(receiptNumber: string) {
  return useQuery({
    queryKey: transactionKeys.receipt(receiptNumber),
    queryFn: async () => {
      const response = await apiEndpoints.transactions.getByReceiptNumber(
        receiptNumber
      );
      return response.data;
    },
    enabled: !!receiptNumber,
    staleTime: 60 * 1000,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      transaction: CreateTransactionRequest
    ): Promise<Transaction> => {
      const response = await apiEndpoints.transactions.create(transaction);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

export function useVoidTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      voidRequest,
    }: {
      id: string;
      voidRequest: VoidTransactionRequest;
    }): Promise<Transaction> => {
      const response = await apiEndpoints.transactions.void(id, voidRequest);
      return response.data.data || response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

export function useTransactionStatistics(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: transactionKeys.statistics(params),
    queryFn: async (): Promise<TransactionStatistics> => {
      const response = await apiEndpoints.transactions.getStatistics(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
