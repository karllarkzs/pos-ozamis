import { useQuery } from "@tanstack/react-query";
import { getTodayForAPI, getDaysAgoForAPI } from "../../utils/dateFormatting";
import {
  apiEndpoints,
  DashboardOverview,
  FinancialReport,
  InventoryMovementItem,
  InventoryAlert,
  TopItem,
  DailyBreakdown,
  ReportFilters,
} from "../../lib/api";

export const reportKeys = {
  all: ["reports"] as const,
  dashboard: () => [...reportKeys.all, "dashboard"] as const,
  dashboardOverview: (filters: ReportFilters) =>
    [...reportKeys.dashboard(), "overview", filters] as const,

  financial: () => [...reportKeys.all, "financial"] as const,
  financialReport: (filters: any) =>
    [...reportKeys.financial(), "report", filters] as const,
  financialDaily: (date: string) =>
    [...reportKeys.financial(), "daily", date] as const,
  financialWeekly: (date: string) =>
    [...reportKeys.financial(), "weekly", date] as const,
  financialMonthly: (year: number, month: number) =>
    [...reportKeys.financial(), "monthly", year, month] as const,

  inventory: () => [...reportKeys.all, "inventory"] as const,
  inventoryLowStock: () => [...reportKeys.inventory(), "low-stock"] as const,
  inventoryExpiring: (daysAhead: number) =>
    [...reportKeys.inventory(), "expiring", daysAhead] as const,
  inventoryExpired: () => [...reportKeys.inventory(), "expired"] as const,
  inventoryFastestMoving: (filters: any) =>
    [...reportKeys.inventory(), "fastest-moving", filters] as const,

  transactions: () => [...reportKeys.all, "transactions"] as const,
  transactionsTopSelling: (filters: any) =>
    [...reportKeys.transactions(), "top-selling", filters] as const,
  transactionsPaymentBreakdown: (filters: any) =>
    [...reportKeys.transactions(), "payment-breakdown", filters] as const,

  profit: () => [...reportKeys.all, "profit"] as const,
  profitMargin: (filters: any) =>
    [...reportKeys.profit(), "margin", filters] as const,
  profitByProductType: (filters: any) =>
    [...reportKeys.profit(), "by-product-type", filters] as const,

  
  employees: () => [...reportKeys.all, "employees"] as const,
  employeeSales: (filters: any) =>
    [...reportKeys.employees(), "sales", filters] as const,
  employeePerformance: (filters: any) =>
    [...reportKeys.employees(), "performance", filters] as const,
};

export function useDashboardOverview(
  period:
    | "today"
    | "yesterday"
    | "thisWeek"
    | "thisMonth"
    | "thisYear" = "today"
) {
  return useQuery({
    queryKey: reportKeys.dashboardOverview({ period }),
    queryFn: async (): Promise<DashboardOverview> => {
      const response = await apiEndpoints.reports.dashboard.overview({
        period,
      });
      return response.data;
    },
    staleTime: 0, 
    refetchOnMount: "always", 
    refetchOnWindowFocus: true, 
  });
}

export function useDashboardOverviewCustom(startDate: string, endDate: string) {
  return useQuery({
    queryKey: reportKeys.dashboardOverview({ startDate, endDate }),
    queryFn: async (): Promise<DashboardOverview> => {
      const response = await apiEndpoints.reports.dashboard.overview({
        period: "custom",
        startDate,
        endDate,
      });
      return response.data;
    },
    staleTime: 0, 
    refetchOnMount: "always", 
    refetchOnWindowFocus: true, 
    enabled: !!startDate && !!endDate,
  });
}

export function useFinancialReport(
  startDate: string,
  endDate: string,
  groupBy?: "daily" | "weekly" | "monthly"
) {
  return useQuery({
    queryKey: reportKeys.financialReport({ startDate, endDate, groupBy }),
    queryFn: async (): Promise<FinancialReport> => {
      const response = await apiEndpoints.reports.financial.getReport({
        startDate,
        endDate,
        groupBy,
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useDailyFinancialReport(date: string) {
  return useQuery({
    queryKey: reportKeys.financialDaily(date),
    queryFn: async (): Promise<FinancialReport> => {
      const response = await apiEndpoints.reports.financial.daily(date);
      return response.data;
    },
    enabled: !!date,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useMonthlyFinancialReport(year: number, month: number) {
  return useQuery({
    queryKey: reportKeys.financialMonthly(year, month),
    queryFn: async (): Promise<FinancialReport> => {
      const response = await apiEndpoints.reports.financial.monthly(
        year,
        month
      );
      return response.data;
    },
    enabled: !!year && !!month,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useInventoryAlerts() {
  const lowStock = useQuery({
    queryKey: reportKeys.inventoryLowStock(),
    queryFn: async (): Promise<InventoryAlert[]> => {
      const response = await apiEndpoints.reports.inventory.lowStockItems();
      return response.data;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, 
  });

  const expiring = useQuery({
    queryKey: reportKeys.inventoryExpiring(30), 
    queryFn: async (): Promise<InventoryAlert[]> => {
      const response = await apiEndpoints.reports.inventory.expiringItems(30);
      return response.data;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, 
  });

  const expired = useQuery({
    queryKey: reportKeys.inventoryExpired(),
    queryFn: async (): Promise<InventoryAlert[]> => {
      const response = await apiEndpoints.reports.inventory.expiredItems();
      return response.data;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, 
  });

  return { lowStock, expiring, expired };
}

export function useFastestMovingProducts(
  startDate: string,
  endDate: string,
  limit: number = 10
) {
  return useQuery({
    queryKey: reportKeys.inventoryFastestMoving({ startDate, endDate, limit }),
    queryFn: async (): Promise<InventoryMovementItem[]> => {
      const response =
        await apiEndpoints.reports.inventory.fastestMovingProducts({
          startDate,
          endDate,
          limit,
        });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useTopSellingProducts(
  startDate: string,
  endDate: string,
  limit: number = 10
) {
  return useQuery({
    queryKey: reportKeys.transactionsTopSelling({ startDate, endDate, limit }),
    queryFn: async (): Promise<TopItem[]> => {
      const response =
        await apiEndpoints.reports.transactions.topSellingProducts({
          startDate,
          endDate,
          limit,
        });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useTopPerformingTests(
  startDate: string,
  endDate: string,
  limit: number = 10
) {
  return useQuery({
    queryKey: [
      ...reportKeys.transactions(),
      "top-performing-tests",
      { startDate, endDate, limit },
    ],
    queryFn: async (): Promise<TopItem[]> => {
      const response =
        await apiEndpoints.reports.transactions.topPerformingTests({
          startDate,
          endDate,
          limit,
        });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function usePaymentMethodBreakdown(startDate: string, endDate: string) {
  return useQuery({
    queryKey: reportKeys.transactionsPaymentBreakdown({ startDate, endDate }),
    queryFn: async (): Promise<Record<string, number>> => {
      const response =
        await apiEndpoints.reports.transactions.paymentMethodBreakdown({
          startDate,
          endDate,
        });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000,
  });
}

export function useDailySalesPattern(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [
      ...reportKeys.transactions(),
      "daily-pattern",
      { startDate, endDate },
    ],
    queryFn: async (): Promise<DailyBreakdown[]> => {
      const response =
        await apiEndpoints.reports.transactions.dailySalesPattern({
          startDate,
          endDate,
        });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000,
  });
}

export function useProfitMargin(startDate: string, endDate: string) {
  return useQuery({
    queryKey: reportKeys.profitMargin({ startDate, endDate }),
    queryFn: async (): Promise<number> => {
      const response = await apiEndpoints.reports.profit.margin({
        startDate,
        endDate,
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000,
  });
}

export function useProfitByProductType(startDate: string, endDate: string) {
  return useQuery({
    queryKey: reportKeys.profitByProductType({ startDate, endDate }),
    queryFn: async (): Promise<Record<string, number>> => {
      const response = await apiEndpoints.reports.profit.byProductType({
        startDate,
        endDate,
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTodayMetrics() {
  const overview = useDashboardOverview("today");
  const financial = useDailyFinancialReport(getTodayForAPI());

  return {
    overview,
    financial,
    isLoading: overview.isLoading || financial.isLoading,
    error: overview.error || financial.error,
  };
}

export function useCurrentMonthAnalytics() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const overview = useDashboardOverview("thisMonth");
  const financial = useMonthlyFinancialReport(year, month);

  return {
    overview,
    financial,
    isLoading: overview.isLoading || financial.isLoading,
    error: overview.error || financial.error,
  };
}

export function useRecentPerformance() {
  const endDate = getTodayForAPI();
  const startDate = getDaysAgoForAPI(7);

  const topProducts = useTopSellingProducts(startDate, endDate, 5);
  const fastestMoving = useFastestMovingProducts(startDate, endDate, 5);
  const paymentBreakdown = usePaymentMethodBreakdown(startDate, endDate);
  const salesPattern = useDailySalesPattern(startDate, endDate);

  return {
    topProducts,
    fastestMoving,
    paymentBreakdown,
    salesPattern,
    dateRange: { startDate, endDate },
  };
}

export function useEmployeeSales(startDate: string, endDate: string) {
  return useQuery({
    queryKey: reportKeys.employeeSales({ startDate, endDate }),
    queryFn: async (): Promise<
      {
        employeeId: string;
        employeeName: string;
        totalSales: number;
        totalTransactions: number;
        averageTransactionValue: number;
        itemsSold: number;
        transactions: any[];
      }[]
    > => {
      
      
      const response = await apiEndpoints.transactions.getAll({
        startDate,
        endDate,
        pageSize: 1000, 
      });

      
      const employeeMap = new Map();
      response.data.data.forEach((transaction: any) => {
        const key = transaction.processedBy;
        if (!employeeMap.has(key)) {
          employeeMap.set(key, {
            employeeId: key,
            employeeName: key, 
            totalSales: 0,
            totalTransactions: 0,
            itemsSold: 0,
            transactions: [],
          });
        }

        const emp = employeeMap.get(key);
        emp.totalSales += transaction.totalAmount;
        emp.totalTransactions += 1;
        emp.itemsSold += transaction.itemCount;
        emp.transactions.push(transaction);
      });

      
      return Array.from(employeeMap.values())
        .map((emp) => ({
          ...emp,
          averageTransactionValue: emp.totalSales / emp.totalTransactions || 0,
          
        }))
        .sort((a, b) => b.totalSales - a.totalSales);
    },
    enabled: !!startDate && !!endDate,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useExpenseAnalysis(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...reportKeys.financial(), "expenses", { startDate, endDate }],
    queryFn: async (): Promise<{
      totalCOGS: number;
      totalDiscounts: number;
      vatPaid: number;
      operatingExpenses: number;
      expenseBreakdown: {
        category: string;
        amount: number;
        percentage: number;
      }[];
    }> => {
      
      const response = await apiEndpoints.reports.financial.getReport({
        startDate,
        endDate,
        groupBy: "daily",
      });

      const financial = response.data;
      const totalExpenses = financial.totalCOGS + financial.totalDiscounts;

      return {
        totalCOGS: financial.totalCOGS,
        totalDiscounts: financial.totalDiscounts,
        vatPaid: financial.vatCollected, 
        operatingExpenses: totalExpenses,
        expenseBreakdown: [
          {
            category: "Cost of Goods Sold",
            amount: financial.totalCOGS,
            percentage: (financial.totalCOGS / totalExpenses) * 100,
          },
          {
            category: "Customer Discounts",
            amount: financial.totalDiscounts,
            percentage: (financial.totalDiscounts / totalExpenses) * 100,
          },
        ],
      };
    },
    enabled: !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000,
  });
}

export function useExpenseStatistics(
  startDate: string,
  endDate: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["expenses", "statistics", { startDate, endDate }],
    queryFn: async () => {
      const response = await apiEndpoints.expenses.getStatistics({
        startDate,
        endDate,
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate && enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useExpensesByCategory(
  startDate: string,
  endDate: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["expenses", "by-category", { startDate, endDate }],
    queryFn: async () => {
      const response = await apiEndpoints.expenses.getByCategory({
        startDate,
        endDate,
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate && enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useExpensesList(
  startDate: string,
  endDate: string,
  options?: {
    pageNumber?: number;
    pageSize?: number;
    category?: string;
  },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["expenses", "list", { startDate, endDate, ...options }],
    queryFn: async () => {
      const response = await apiEndpoints.expenses.getAll({
        startDate,
        endDate,
        pageNumber: options?.pageNumber || 1,
        pageSize: options?.pageSize || 50,
        category: options?.category,
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate && enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useExpenseCategories(enabled: boolean = true) {
  return useQuery({
    queryKey: ["expenses", "categories"],
    queryFn: async () => {
      const response = await apiEndpoints.expenses.getCategories();
      return response.data;
    },
    enabled: enabled,
    staleTime: 30 * 60 * 1000, 
  });
}

export function useExpensesByPurchaser(
  purchasedBy: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ["expenses", "by-purchaser", { purchasedBy, startDate, endDate }],
    queryFn: async () => {
      const response = await apiEndpoints.expenses.getByPurchaser(purchasedBy, {
        startDate,
        endDate,
      });
      return response.data;
    },
    enabled: !!purchasedBy,
    staleTime: 5 * 60 * 1000,
  });
}
