// hooks/api/useExpenses.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiEndpoints } from "../../lib/api";
import type {
  Expense,
  ExpenseListResponse,
  ExpenseStatistics,
  ExpenseByCategory,
  CreateExpenseRequest,
} from "../../lib/api";

const qk = {
  list: (p: {
    startDate: string;
    endDate: string;
    page?: number;
    size?: number;
    category?: string;
  }) => ["expenses", "list", p] as const,
  stats: (p: { startDate: string; endDate: string }) =>
    ["expenses", "statistics", p] as const,
  byCategory: (p: { startDate: string; endDate: string }) =>
    ["expenses", "by-category", p] as const,
  categories: ["expenses", "categories"] as const,
  byId: (id: string) => ["expenses", "by-id", id] as const,
};

export function useExpenseStatistics(
  startDate: string,
  endDate: string,
  enabled = true
) {
  return useQuery({
    queryKey: qk.stats({ startDate, endDate }),
    queryFn: async (): Promise<ExpenseStatistics> => {
      const { data } = await apiEndpoints.expenses.getStatistics({
        startDate,
        endDate,
      });
      return data;
    },
    enabled: !!startDate && !!endDate && enabled,
  });
}

export function useExpensesByCategory(
  startDate: string,
  endDate: string,
  enabled = true
) {
  return useQuery({
    queryKey: qk.byCategory({ startDate, endDate }),
    queryFn: async (): Promise<ExpenseByCategory> => {
      const { data } = await apiEndpoints.expenses.getByCategory({
        startDate,
        endDate,
      });
      return data;
    },
    enabled: !!startDate && !!endDate && enabled,
  });
}

export function useExpenseCategories(enabled = true) {
  return useQuery({
    queryKey: qk.categories,
    queryFn: async (): Promise<{
      categories: string[];
      count: number;
      suggestedCategories: string[];
    }> => {
      const { data } = await apiEndpoints.expenses.getCategories();
      return data;
    },
    enabled,
    staleTime: 30 * 60 * 1000,
  });
}

export function useExpensesList(
  startDate: string,
  endDate: string,
  options?: { pageNumber?: number; pageSize?: number; category?: string },
  enabled = true
) {
  const pageNumber = options?.pageNumber ?? 1;
  const pageSize = options?.pageSize ?? 50;
  const category = options?.category;

  return useQuery({
    queryKey: qk.list({
      startDate,
      endDate,
      page: pageNumber,
      size: pageSize,
      category,
    }),
    queryFn: async (): Promise<ExpenseListResponse> => {
      const { data } = await apiEndpoints.expenses.getAll({
        startDate,
        endDate,
        pageNumber,
        pageSize,
        category,
      });
      return data;
    },
    enabled: !!startDate && !!endDate && enabled,
  });
}

export function useExpenseById(id?: string) {
  return useQuery({
    queryKey: id ? qk.byId(id) : ["expenses", "by-id", "idle"],
    queryFn: async (): Promise<Expense> => {
      const { data } = await apiEndpoints.expenses.getById(id!);
      return data;
    },
    enabled: !!id,
  });
}

// --- CRUD ---
export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateExpenseRequest) =>
      apiEndpoints.expenses.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["reports"] }); // if stats feed sales summary
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      body: Partial<CreateExpenseRequest>;
    }) => apiEndpoints.expenses.update(payload.id, payload.body),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: qk.byId(vars.id) });
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiEndpoints.expenses.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}
