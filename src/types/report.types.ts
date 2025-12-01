export interface DashboardOverview {
  generatedAt: string;
  period: string;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  transactionsCount: number;
  averageTransactionValue: number;
  totalProducts: number;
  lowStockProducts: number;
  expiringProducts: number;
  inventoryValue: number;
  productsSold: number;
  restockBatches: number;
  topProducts: TopItem[];
}

export interface TopItem {
  id: string;
  name: string;
  itemType: "Product";
  quantity: number;
  revenue: number;
  profit: number;
  rank: number;
}

export interface FinancialReport {
  startDate: string;
  endDate: string;
  reportType: string;
  grossSales: number;
  totalDiscounts: number;
  netSales: number;
  vatCollected: number;
  finalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  profitMargin: number;
  cashSales: number;
  gcashSales: number;
  paymentMethodBreakdown: Record<string, number>;
  productRevenue: number;
  productsSold: number;
  totalTransactions: number;
  voidedTransactions: number;
  averageTransactionValue: number;
  dailyBreakdown?: DailyBreakdown[];
}

export interface DailyBreakdown {
  date: string;
  revenue: number;
  profit: number;
  transactions: number;
  itemsSold: number;
}

export interface InventoryMovementItem {
  id: string;
  name: string;
  itemType: "Product" | "Reagent";
  quantityMoved: number;
  revenue: number;
  movementCount: number;
  movementScore: number;
  rank: number;
}

export interface InventoryAlert {
  id: string;
  name: string;
  itemType: "Product" | "Reagent";
  currentStock: number;
  minimumStock: number;
  expirationDate?: string;
  daysUntilExpiry?: number;
  status: string;
  recommendation: string;
}

export interface ReportFilters {
  period?: "today" | "yesterday" | "thisWeek" | "thisMonth" | "thisYear";
  startDate?: string;
  endDate?: string;
  groupBy?: "daily" | "weekly" | "monthly";
  limit?: number;
  daysAhead?: number;
}

export interface SalesSummary {
  startDate: string;
  endDate: string;
  periodLabel: string;

  totalTransactions: number;
  voidedTransactions: number;
  discountedTransactions: number;
  nonDiscountedTransactions: number;
  voidRate: number;

  grossSales: number;
  totalDiscounts: number;
  amountVoided: number;
  netSales: number;
  vatCollected: number;

  totalExpenses: number;
  netSalesAfterExpenses: number;
  totalCost: number;
  grossProfit: number;
  grossProfitMargin: number;

  cashSales: number;
  gcashSales: number;
  mayaSales: number;
  goTymeSales: number;

  cashTransactions: number;
  gcashTransactions: number;
  mayaTransactions: number;
  goTymeTransactions: number;

  dailyBreakdown: any[];
}

export interface SalesSummaryResponse {
  data: SalesSummary;
  filters: { period?: string; startDate?: string; endDate?: string };
  generatedAt: string;
  generatedBy?: string;
}
