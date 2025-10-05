import axios from "axios";
import type {
  Test,
  TestResponse,
  TestFilters,
  TestSummary,
  CreateTestRequest,
  UpdateTestRequest,
  PerformTestRequest,
} from "../types/global";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5288/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new CustomEvent("server:reconnected"));
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("auth-token");
      localStorage.removeItem("persist:pharmacy-pos-root");

      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    if (!error.response) {
      console.error("Network error:", error.message);
      window.dispatchEvent(new CustomEvent("server:disconnected"));
    }

    return Promise.reject(error);
  }
);

export interface CatalogItem {
  id: string;
  itemType: "Product" | "Test";
  name: string;
  price: number;
  formulation: string | null;
  category: string;
  productType: string | null;
  location: string | null;
  quantity: number;
  isLow: boolean;
  isDiscountable: boolean;
  isPhilHealth: boolean;
}

export interface Product {
  id: string;
  barcode?: string | null;
  generic?: string | null;
  brand: string;
  type?: string | null;
  formulation?: string | null;
  category?: string | null;
  batchNumber?: string | null;
  retailPrice: number;
  wholesalePrice: number;
  quantity: number;
  minimumStock: number;
  location?: string | null;
  expirationDate?: string | null;
  isDiscountable: boolean;
  isPhilHealth: boolean;
  isLowStock: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  createdAt: string;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface ProductResponse {
  data: Product[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductFilters {
  page?: number;
  pageSize?: number;

  searchTerm?: string;
  barcode?: string;
  brand?: string;
  generic?: string;
  company?: string;
  location?: string;
  batchNumber?: string;

  category?: string;
  formulation?: string;
  type?: string;

  isDiscountable?: boolean;
  isPhilHealth?: boolean;
  isLowStock?: boolean;
  isNoStock?: boolean;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  isDeleted?: boolean;

  minRetailPrice?: number;
  maxRetailPrice?: number;
  minWholesalePrice?: number;
  maxWholesalePrice?: number;

  minQuantity?: number;
  maxQuantity?: number;
  minMinimumStock?: number;
  maxMinimumStock?: number;

  expirationDateFrom?: string;
  expirationDateTo?: string;
  createdFrom?: string;
  createdTo?: string;

  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export type ReagentType =
  | "ChargeBased"
  | "VolumeBased"
  | "charge-based"
  | "volume-based"
  | 0
  | 1;

export interface Reagent {
  id: string;
  name: string;
  reagentType: ReagentType;
  reagentTypeName: string;
  quantity: number;
  minimumStock: number;
  unitCost: number;
  expirationDate?: string | null;
  batchNumber?: string | null;
  currentCharges?: number;
  initialCharges?: number;
  totalCharges?: number;
  chargesPerUnit?: number;
  currentVolume?: number;
  initialVolume?: number;
  totalVolume?: number;
  volume?: number;
  unitOfMeasure?: string;
  isLowStock: boolean;
  isExpired: boolean;
  isExpiringSoon?: boolean;
  availableAmount: number;
  totalAvailableAmount?: number;
  displayUnit: string;
  usagePercentage?: number;
  createdAt: string;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface ReagentResponse {
  data: Reagent[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ReagentFilters {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  reagentType?: ReagentType;
  batchNumber?: string;
  isLowStock?: boolean;
  isExpired?: boolean;
  minUnitCost?: number;
  maxUnitCost?: number;
  expiringSoonDays?: number;

  sortBy?:
    | "name"
    | "reagentType"
    | "quantity"
    | "unitCost"
    | "expirationDate"
    | "availableAmount"
    | "minimumStock";
  sortDirection?: "asc" | "desc";
}

export interface CreateReagentRequest {
  name: string;
  reagentType: ReagentType;

  quantity: number;
  minimumStock: number;
  unitCost: number;
  expirationDate?: string;
  batchNumber?: string;

  currentCharges?: number;
  initialCharges?: number;

  chargesPerUnit?: number;

  currentVolume?: number;
  initialVolume?: number;

  volume?: number;
  unitOfMeasure?: string;
}

export interface UpdateReagentRequest extends CreateReagentRequest {
  id?: string;
}

export interface ReagentSummary {
  totalReagents: number;
  chargeBasedReagents: number;
  volumeBasedReagents: number;
  lowStockReagents: number;
  expiredReagents: number;
  expiringSoonReagents: number;
  totalInventoryValue: number;
}

export interface UpdateStockRequest {
  quantityChange?: number;
  currentChargesChange?: number;
  currentVolumeChange?: number;
  volumeChange?: number;
  reason?: string;
  batchNumber?: string;
}

export interface ReagentConsumption {
  reagentId: string;
  consumedAmount: number;
}

export interface MaintenanceConsumptionRequest {
  maintenanceType: string;
  performedBy: string;
  reagentConsumption: ReagentConsumption[];
}

export interface TestReagentRequirement {
  reagentId: string;
  requiredAmount: number;
}

export interface ProductSummary {
  totalProducts: number;
  lowStockProducts: number;
  noStockProducts: number;
  expiredProducts: number;
  expiringSoonProducts: number;
  totalInventoryValue: number;
  categoriesCount: number;
  productsByType: Record<string, number>;
}

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
  testsPerformed: number;
  restockBatches: number;
  topProducts: TopItem[];
  topTests: TopItem[];
}

export interface TopItem {
  id: string;
  name: string;
  itemType: "Product" | "Test";
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
  testRevenue: number;
  productsSold: number;
  testsPerformed: number;
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
  itemType: "Product" | "Test";
  quantityMoved: number;
  revenue: number;
  movementCount: number;
  movementScore: number;
  rank: number;
}

export interface InventoryAlert {
  id: string;
  name: string;
  itemType: "Product" | "Test";
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

export interface ExpenseItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  brand?: string;
  unit?: string;
  description?: string;
}

export interface Expense {
  id: string;
  purchasedBy: string;
  date: string;
  reason: string;
  total: number;
  category: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  calculatedTotal: number;
  items: ExpenseItem[];
}

export interface ExpenseListResponse {
  data: Expense[];
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    startDate?: string;
    endDate?: string;
    category?: string;
  };
}

export interface ExpenseStatistics {
  period: {
    startDate: string;
    endDate: string;
  };
  totals: {
    totalAmount: number;
    transactionCount: number;
    averageExpense: number;
  };
  categories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  generatedAt: string;
}

export interface ExpenseByCategory {
  period: {
    startDate: string;
    endDate: string;
  };
  totalAmount: number;
  categories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  generatedAt: string;
}

export interface CreateExpenseRequest {
  purchasedBy: string;
  date: string;
  reason: string;
  total: number;
  category: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  items?: {
    name: string;
    quantity: number;
    unitPrice: number;
    brand?: string;
    unit?: string;
    description?: string;
  }[];
}

export type UserRole = "SuperAdmin" | "Admin" | "Cashier" | "Lab" | "MedTech";

export interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface User {
  id: string;
  userName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  photoUrl?: string | null;
  hasPhoto: boolean;
  profile: UserProfile;
}

export interface CreateUserRequest {
  userName: string;
  email: string;
  password: string;
  role: number;
  firstName: string;
  lastName: string;
}

export interface UpdateUserRequest {
  userName?: string;
  email?: string;
  role?: number;
  isActive?: boolean;
  firstName?: string;
  lastName?: string;
}

export interface CatalogResponse {
  data: CatalogItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  sortBy?: string;
  sortDirection?: string;
}

export interface CatalogFilters {
  itemType?: "Product" | "Test" | null;
  search?: string;
  productType?: string;
  formulation?: string;
  location?: string;
  category?: string;
  isLowStock?: boolean;
  isNoStock?: boolean;
  isDiscountable?: boolean;
  isPhilHealth?: boolean;
  sortBy?:
    | "name"
    | "formulation"
    | "price"
    | "quantity"
    | "category"
    | "location"
    | "itemtype";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
  itemType: "Product" | "Test";
  isDiscountable: boolean;
}

export interface CreateTransactionItem {
  itemId: string;
  quantity: number;
}

export interface CreateTransactionRequest {
  paymentMethod: "Cash" | "GCash" | "Maya" | "GoTyme";
  referenceNumber?: string | null;
  cashInHand?: number | null;
  seniorId?: string | null;
  specialDiscount: number;
  regularDiscount: number;
  subtotal: number;
  vat: number;
  totalAmount: number;
  items: CreateTransactionItem[];
}

export interface TransactionItemResponse {
  id: string;
  itemId: string;
  productId?: string | null;
  testId?: string | null;
  itemName: string;
  itemType: "Product" | "Test";
  barcode?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  batchNumber?: string | null;
  expirationDate?: string | null;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  transactionDate: string;
  processedBy: string;
  cashierId: string;
  cashierName: string;
  subTotal: number;
  regularDiscount: number;
  specialDiscount: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: "Cash" | "GCash" | "Maya" | "GoTyme";
  referenceNumber?: string | null;
  cashInHand?: number | null;
  changeAmount: number;
  isVoided: boolean;
  voidReason?: string | null;
  voidedAt?: string | null;
  voidedBy?: string | null;
  items?: TransactionItemResponse[];
  itemCount: number;
  netSales: number;
}

export interface TransactionListResponse {
  data: {
    id: string;
    receiptNumber: string;
    transactionDate: string;
    processedBy: string;
    cashierId: string;
    cashierName: string;

    // --- NEW discount-related fields coming from backend list endpoint ---
    subTotal: number;
    regularDiscount: number;
    specialDiscount: number;
    discountAmount: number;
    vatAmount: number;
    // ---------------------------------------------------

    totalAmount: number;
    paymentMethod: "Cash" | "GCash" | "Maya" | "GoTyme";
    referenceNumber?: string | null;
    isVoided: boolean;
    itemCount: number;
  }[];
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    startDate?: string | null;
    endDate?: string | null;
  };
}

export interface TransactionStatistics {
  period: {
    startDate: string;
    endDate: string;
  };
  sales: {
    totalSales: number;
    totalVoided: number;
    netSales: number;
  };
  transactions: {
    total: number;
    voided: number;
    completed: number;
    voidRate: number;
  };
  averageTransactionValue: number;
  generatedAt: string;
}

export interface VoidTransactionRequest {
  voidReason: string;
}

export interface Discount {
  id: string;
  discountName: string;
  percent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface DiscountRequest {
  discountName: string;
  percent: number;
  isActive?: boolean;
}

export interface RestockBatchItem {
  id: string;
  itemType: "Product" | "Reagent";
  productId?: string | null;
  reagentId?: string | null;
  quantity: number;
  wholesalePrice: number;
  retailPrice: number;
  expirationDate?: string | null;
  supplierBatchNumber?: string | null;
  notes?: string | null;
  wasNewItemCreated: boolean;

  productGeneric?: string | null;
  productBrand?: string | null;
  productType?: string | null;

  reagentName?: string | null;
  reagentTypeName?: string | null;
  chargesPerUnit?: number | null;
  volume?: number | null;
  unitOfMeasure?: string | null;
}

export interface RestockBatch {
  id: string;
  batchReference: string;
  receiveDate: string;
  receivedBy: string;
  company: string;
  supplierReference?: string | null;
  notes?: string | null;
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  items: RestockBatchItem[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateRestockBatchRequest {
  receiveDate: string;
  receivedBy: string;
  company: string;
  supplierReference?: string | null;
  notes?: string | null;
  items: CreateRestockBatchItemRequest[];
}

export interface CreateRestockBatchItemRequest {
  itemType: "Product" | "Reagent";

  productId?: string | null;
  reagentId?: string | null;

  generic?: string;
  brand?: string;
  barcode?: string;
  type?: string;
  formulation?: string;
  category?: string;
  location?: string;
  minimumStock?: number;
  isDiscountable?: boolean;

  reagentName?: string;
  reagentType?: 0 | 1;
  unitOfMeasure?: string;
  chargesPerUnit?: number;
  volume?: number;

  quantity: number;
  wholesalePrice: number;
  retailPrice: number;
  expirationDate?: string | null;
  supplierBatchNumber?: string | null;
  notes?: string | null;
}

export interface RestockBatchResponse {
  data: RestockBatch[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

export interface RestockBatchFilters {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  batchReference?: string;
  company?: string;
  receivedBy?: string;
  receiveDateFrom?: string;
  receiveDateTo?: string;
  minTotalValue?: number;
  maxTotalValue?: number;
  sortBy?:
    | "batchReference"
    | "receiveDate"
    | "receivedBy"
    | "company"
    | "totalValue";
  sortDirection?: "asc" | "desc";
}

export interface RestockBatchSummary {
  totalBatches: number;
  totalItemsRestocked: number;
  totalQuantityRestocked: number;
  totalValueRestocked: number;
  averageBatchValue: number;
  batchesByCompany: Record<string, number>;
  batchesByReceivedBy: Record<string, number>;
}

export interface RestockQueueItem {
  id: string;
  itemType: "Product" | "Reagent";
  originalItem: Product | Reagent;

  quantity: number;
  retailPrice: number;
  wholesalePrice: number;
  expirationDate?: string | null;
  supplierBatchNumber?: string | null;
  notes?: string | null;

  hasFieldChanges: boolean;
  shouldCreateNew: boolean;
}

export interface TransactionFilters {
  pageNumber?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  cashierId?: string;
  includeVoided?: boolean;
  todayOnly?: boolean;
  sortBy?:
    | "transactionDate"
    | "totalAmount"
    | "receiptNumber"
    | "paymentMethod"
    | "cashierName";
  sortDirection?: "asc" | "desc";
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

const buildQueryString = (filters: CatalogFilters): string => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  return params.toString();
};

export const apiEndpoints = {
  health: {
    check: () => api.get<{ status: string; timestamp: string }>("/health"),
  },

  tests: {
    getAll: (filters?: TestFilters) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      return api.get<TestResponse>(
        `/tests/list${queryString ? `?${queryString}` : ""}`
      );
    },

    getById: (id: string) =>
      api.get<{ success: boolean; message: string; data: Test }>(
        `/tests/${id}`
      ),

    create: (test: CreateTestRequest) =>
      api.post<{ success: boolean; message: string; data: Test }>(
        "/tests",
        test
      ),

    update: (id: string, test: CreateTestRequest) =>
      api.put<{ success: boolean; message: string; data: Test }>(
        `/tests/${id}`,
        test
      ),

    delete: (id: string) =>
      api.delete<{ success: boolean; message: string }>(`/tests/${id}`),

    canPerform: (id: string) =>
      api.get<{
        success: boolean;
        message: string;
        data: { testId: string; canPerform: boolean };
      }>(`/tests/${id}/can-perform`),

    perform: (id: string, data: PerformTestRequest) =>
      api.post<{ success: boolean; message: string; data: Test }>(
        `/tests/${id}/perform`,
        data
      ),

    getSummary: () =>
      api.get<{ success: boolean; message: string; data: TestSummary }>(
        "/tests/summary"
      ),

    getCannotPerform: (filters?: TestFilters) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      return api.get<TestResponse>(
        `/tests/cannot-perform${queryString ? `?${queryString}` : ""}`
      );
    },

    getWithReagents: (filters?: TestFilters) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      return api.get<TestResponse>(
        `/tests/with-reagents${queryString ? `?${queryString}` : ""}`
      );
    },
  },
  catalog: {
    getAll: (filters?: CatalogFilters, config?: { signal?: AbortSignal }) => {
      const queryString = filters ? buildQueryString(filters) : "";
      return api.get<CatalogResponse>(
        `/catalog${queryString ? `?${queryString}` : ""}`,
        config
      );
    },
    getById: (id: string, config?: { signal?: AbortSignal }) =>
      api.get<CatalogItem>(`/catalog/${id}`, config),
    checkExists: (id: string, config?: { signal?: AbortSignal }) =>
      api.get<{ itemId: string; exists: boolean }>(
        `/catalog/${id}/exists`,
        config
      ),
  },

  auth: {
    login: (credentials: { username: string; password: string }) =>
      api.post<{
        success: boolean;
        message: string;
        data: {
          accessToken: string;
          expiresAt: string;
          user: {
            id: string;
            userName: string;
            email: string;
            role: number;
            isActive: boolean;
            lastLoginAt: string;
            createdAt: string;
            photoUrl: string | null;
            hasPhoto: boolean;
            profile: {
              id: string;
              firstName: string;
              lastName: string;
              fullName: string;
            };
          };
        };
      }>("/auth/login", credentials),
    getCurrentUser: () =>
      api.get<{
        success: boolean;
        message: string;
        data: {
          id: string;
          userName: string;
          email: string;
          role: number;
          isActive: boolean;
          lastLoginAt: string;
          createdAt: string;
          photoUrl: string | null;
          hasPhoto: boolean;
          profile: {
            id: string;
            firstName: string;
            lastName: string;
            fullName: string;
          };
        };
      }>("/auth/me"),
    uploadPhoto: (photo: FormData) =>
      api.post<{
        id: string;
        userName: string;
        email: string;
        role: string;
        isActive: boolean;
        photoUrl: string;
        hasPhoto: boolean;
        lastLoginAt: string;
        createdAt: string;
        profile: {
          id: string;
          firstName: string;
          lastName: string;
          fullName: string;
        };
      }>("/auth/photo", photo, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    deletePhoto: () => api.delete("/auth/photo"),
  },

  products: {
    getAll: (filters?: ProductFilters) => {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }

      const queryString = params.toString();
      return api.get<ProductResponse>(
        `/products/list${queryString ? `?${queryString}` : ""}`
      );
    },

    getById: (id: string) =>
      api.get<{ success: boolean; message: string; data: Product }>(
        `/products/${id}`
      ),
    create: (product: Partial<Product>) =>
      api.post<{ success: boolean; message: string; data: Product }>(
        "/products",
        product
      ),
    update: (id: string, product: Partial<Product>) =>
      api.put<{ success: boolean; message: string; data: Product }>(
        `/products/${id}`,
        product
      ),
    delete: (id: string) =>
      api.delete<{ success: boolean; message: string }>(`/products/${id}`),

    adjustStock: (
      id: string,
      data: {
        quantityChange: number;
        adjustmentType: string;
        reason: string;
      }
    ) =>
      api.post<{
        id: string;
        productId: string;
        productName: string;
        productBarcode: string;
        quantityChange: number;
        quantityBefore: number;
        quantityAfter: number;
        adjustmentType: string;
        reason: string;
        adjustedBy: string;
        adjustedById: string;
        createdAt: string;
      }>(`/products/${id}/adjust-stock`, data),

    getStockHistory: (id: string) =>
      api.get<
        Array<{
          id: string;
          productId: string;
          productName: string;
          productBarcode: string;
          quantityChange: number;
          quantityBefore: number;
          quantityAfter: number;
          adjustmentType: string;
          reason: string;
          adjustedBy: string;
          adjustedById: string;
          createdAt: string;
        }>
      >(`/products/${id}/stock-history`),

    getByBarcode: (barcode: string) =>
      api.get<{ success: boolean; message: string; data: Product }>(
        `/products/by-barcode/${barcode}`
      ),
    getAllByBarcode: (barcode: string) =>
      api.get<Product[]>(`/products/by-barcode/${barcode}/all`),

    getSummary: () => api.get<ProductSummary>("/products/summary"),

    getLowStock: (filters?: ProductFilters) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      return api.get<ProductResponse>(
        `/products/low-stock${queryString ? `?${queryString}` : ""}`
      );
    },

    getNoStock: (filters?: ProductFilters) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      return api.get<ProductResponse>(
        `/products/no-stock${queryString ? `?${queryString}` : ""}`
      );
    },

    getExpired: (filters?: ProductFilters) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      return api.get<ProductResponse>(
        `/products/expired${queryString ? `?${queryString}` : ""}`
      );
    },

    getExpiringSoon: (filters?: ProductFilters) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      return api.get<ProductResponse>(
        `/products/expiring-soon${queryString ? `?${queryString}` : ""}`
      );
    },

    getForRestock: (filters?: ProductFilters) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      return api.get<ProductResponse>(
        `/products/for-restock${queryString ? `?${queryString}` : ""}`
      );
    },

    getLowStockSimple: () => api.get<Product[]>("/products/low-stock/simple"),
    getNoStockSimple: () => api.get<Product[]>("/products/no-stock/simple"),
    getExpiredSimple: () => api.get<Product[]>("/products/expired/simple"),
    getExpiringSoonSimple: () =>
      api.get<Product[]>("/products/expiring-soon/simple"),

    updateStock: (id: string, data: { quantity: number; reason?: string }) =>
      api.patch<{ success: boolean; message: string; data: Product }>(
        `/products/${id}/stock`,
        data
      ),

    updateStockBulk: (data: {
      updates: Array<{ productId: string; quantity: number }>;
      reason?: string;
    }) =>
      api.patch<{
        success: boolean;
        message: string;
        totalRequested: number;
        totalUpdated: number;
        totalFailed: number;
        results: Array<{
          productId: string;
          productName: string;
          status: string;
          updatedAt: string;
        }>;
        errors: Array<{
          productId: string;
          error: string;
        }>;
      }>("/products/stock/bulk", data),

    checkExists: (criteria: {
      barcode?: string;
      brand?: string;
      generic?: string;
      type?: string;
      formulation?: string;
      category?: string;
      location?: string;
      expirationDate?: string;
      excludeId?: string;
    }) => {
      return api.post<{
        exists: boolean;
        count: number;
        matchingProducts?: Array<{
          id: string;
          barcode?: string;
          brand?: string;
          generic?: string;
          type?: string;
          createdAt: string;
        }>;
      }>(`/products/check-exists`, criteria);
    },

    createBatch: (data: {
      products: Array<Partial<Product>>;
      validateDuplicates?: boolean;
      continueOnError?: boolean;
    }) => {
      return api.post<{
        success: boolean;
        message: string;
        totalRequested: number;
        totalCreated: number;
        totalFailed: number;
        createdProducts: Array<{
          index: number;
          product: Product;
        }>;
        failedProducts: Array<{
          index: number;
          errors: string[];
          originalProduct: Partial<Product>;
        }>;
      }>("/products/batch", data);
    },

    deleteBatch: (data: { productIds: string[]; reason?: string }) => {
      return api.delete<{
        totalRequested: number;
        totalDeleted: number;
        totalFailed: number;
        success: boolean;
        message: string;
        results: Array<{
          productId: string;
          productName: string;
          status: string;
          deletedAt: string;
        }>;
        errors: Array<{
          productId: string;
          productName: string;
          error: string;
          errorType: string;
        }>;
      }>("/products/batch", { data });
    },

    getProductTypes: () => api.get<string[]>("/products/types"),
    getFormulations: () => api.get<string[]>("/products/formulations"),
    getCategories: () => api.get<string[]>("/products/categories"),
    getLocations: () => api.get<string[]>("/products/locations"),
  },

  reports: {
    dashboard: {
      overview: (filters?: {
        period?: string;
        startDate?: string;
        endDate?: string;
      }) => {
        const params = new URLSearchParams();
        if (filters?.period) {
          params.append("period", filters.period);
        }
        if (filters?.startDate) {
          params.append("startDate", filters.startDate);
        }
        if (filters?.endDate) {
          params.append("endDate", filters.endDate);
        }
        const queryString = params.toString();
        return api.get<DashboardOverview>(
          `/reports/dashboard/overview${queryString ? `?${queryString}` : ""}`
        );
      },
    },

    financial: {
      getReport: (filters: {
        startDate: string;
        endDate: string;
        groupBy?: string;
      }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        return api.get<FinancialReport>(
          `/reports/financial?${params.toString()}`
        );
      },
      daily: (date: string) =>
        api.get<FinancialReport>(`/reports/financial/daily/${date}`),
      weekly: (date: string) =>
        api.get<FinancialReport>(`/reports/financial/weekly/${date}`),
      monthly: (year: number, month: number) =>
        api.get<FinancialReport>(`/reports/financial/monthly/${year}/${month}`),
    },

    inventory: {
      movement: (filters: { startDate: string; endDate: string }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        return api.get(`/reports/inventory/movement?${params.toString()}`);
      },
      fastestMovingProducts: (filters: {
        startDate: string;
        endDate: string;
        limit?: number;
      }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });
        return api.get<InventoryMovementItem[]>(
          `/reports/inventory/fastest-moving-products?${params.toString()}`
        );
      },
      fastestMovingTests: (filters: {
        startDate: string;
        endDate: string;
        limit?: number;
      }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });
        return api.get<InventoryMovementItem[]>(
          `/reports/inventory/fastest-moving-tests?${params.toString()}`
        );
      },
      mostConsumedReagents: (filters: {
        startDate: string;
        endDate: string;
        limit?: number;
      }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });
        return api.get<InventoryMovementItem[]>(
          `/reports/inventory/most-consumed-reagents?${params.toString()}`
        );
      },
      lowStockItems: () =>
        api.get<InventoryAlert[]>("/reports/inventory/low-stock-items"),
      expiringItems: (daysAhead: number = 30) =>
        api.get<InventoryAlert[]>(
          `/reports/inventory/expiring-items?daysAhead=${daysAhead}`
        ),
      expiredItems: () =>
        api.get<InventoryAlert[]>("/reports/inventory/expired-items"),
      overstockItems: () =>
        api.get<InventoryAlert[]>("/reports/inventory/overstock-items"),
    },

    transactions: {
      topSellingProducts: (filters: {
        startDate: string;
        endDate: string;
        limit?: number;
      }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });
        return api.get<TopItem[]>(
          `/reports/transactions/top-selling-products?${params.toString()}`
        );
      },
      topPerformingTests: (filters: {
        startDate: string;
        endDate: string;
        limit?: number;
      }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });
        return api.get<TopItem[]>(
          `/reports/transactions/top-performing-tests?${params.toString()}`
        );
      },
      paymentMethodBreakdown: (filters: {
        startDate: string;
        endDate: string;
      }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        return api.get<Record<string, number>>(
          `/reports/transactions/payment-method-breakdown?${params.toString()}`
        );
      },
      dailySalesPattern: (filters: { startDate: string; endDate: string }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        return api.get<DailyBreakdown[]>(
          `/reports/transactions/daily-sales-pattern?${params.toString()}`
        );
      },
    },

    profit: {
      margin: (filters: { startDate: string; endDate: string }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        return api.get<number>(`/reports/profit/margin?${params.toString()}`);
      },
      averageTransactionValue: (filters: {
        startDate: string;
        endDate: string;
      }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        return api.get<number>(
          `/reports/profit/average-transaction-value?${params.toString()}`
        );
      },
      byProductType: (filters: { startDate: string; endDate: string }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        return api.get<Record<string, number>>(
          `/reports/profit/by-product-type?${params.toString()}`
        );
      },
    },
  },

  businessReports: {
    salesSummary: (filters?: {
      period?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.period) params.append("period", filters.period);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      const qs = params.toString();
      return api.get<SalesSummaryResponse>(
        `/business-reports/sales-summary${qs ? `?${qs}` : ""}`
      );
    },
  },

  reagents: {
    getAll: (filters?: ReagentFilters) => {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }

      const queryString = params.toString();
      return api.get<ReagentResponse>(
        `/reagents/list${queryString ? `?${queryString}` : ""}`
      );
    },

    getById: (id: string) =>
      api.get<{ success: boolean; message: string; data: Reagent }>(
        `/reagents/${id}`
      ),

    getByName: (name: string) =>
      api.get<{ success: boolean; message: string; data: Reagent }>(
        `/reagents/by-name/${encodeURIComponent(name)}`
      ),

    create: (reagent: CreateReagentRequest) =>
      api.post<{ success: boolean; message: string; data: Reagent }>(
        "/reagents",
        reagent
      ),

    update: (id: string, reagent: UpdateReagentRequest) =>
      api.put<{ success: boolean; message: string; data: Reagent }>(
        `/reagents/${id}`,
        reagent
      ),

    delete: (id: string) =>
      api.delete<{ success: boolean; message: string }>(`/reagents/${id}`),

    updateStock: (id: string, stockData: UpdateStockRequest) =>
      api.post<{ success: boolean; message: string; data: Reagent }>(
        `/reagents/${id}/update-stock`,
        stockData
      ),

    getLowStock: () =>
      api.get<{ success: boolean; data: Reagent[] }>("/reagents/low-stock"),

    getExpired: () =>
      api.get<{ success: boolean; data: Reagent[] }>("/reagents/expired"),

    getExpiringSoon: (days: number = 30) =>
      api.get<{ success: boolean; data: Reagent[] }>(
        `/reagents/expiring-soon?days=${days}`
      ),

    getChargeBased: () =>
      api.get<{ success: boolean; data: Reagent[] }>("/reagents/charge-based"),

    getVolumeBased: () =>
      api.get<{ success: boolean; data: Reagent[] }>("/reagents/volume-based"),

    getSummary: () => api.get<ReagentSummary>("/reagents/summary"),

    getForRestock: (filters?: { page?: number; pageSize?: number }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      return api.get<{
        data: Reagent[];
        page: number;
        totalCount: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      }>(`/reagents/for-restock${queryString ? `?${queryString}` : ""}`);
    },

    createBatch: (data: {
      reagents: Array<{
        name: string;
        reagentType: "charge-based" | "volume-based";
        quantity?: number;
        chargesPerUnit?: number;
        volume?: number;
        unitOfMeasure?: string;
        minimumStock: number;
        unitCost: number;
        expirationDate?: string;
        batchNumber?: string;
      }>;
      validateDuplicates?: boolean;
      continueOnError?: boolean;
    }) => {
      return api.post<{
        success: boolean;
        message: string;
        totalRequested: number;
        totalCreated: number;
        totalFailed: number;
        createdReagents: Array<{
          index: number;
          reagent: Reagent;
        }>;
        failedReagents: Array<{
          index: number;
          errors: string[];
          originalReagent: any;
        }>;
      }>("/reagents/batch", data);
    },

    editBatch: (data: {
      reagentUpdates: Record<
        string,
        {
          unitCost?: number;
          minimumStock?: number;
          expirationDate?: string;
        }
      >;
      reason?: string;
      continueOnError?: boolean;
    }) => {
      return api.put<{
        success: boolean;
        message: string;
        totalRequested: number;
        totalUpdated: number;
        totalFailed: number;
        updatedReagents: Array<{
          reagentId: string;
          reagentName: string;
          status: string;
          updatedAt: string;
        }>;
        failedReagents: Array<{
          reagentId: string;
          reagentName: string;
          error: string;
          errorType: string;
        }>;
      }>("/reagents/batch", data);
    },

    deleteBatch: (data: { reagentIds: string[]; reason?: string }) => {
      return api.delete<{
        success: boolean;
        message: string;
        totalRequested: number;
        totalDeleted: number;
        totalFailed: number;
        deletedReagents: Array<{
          reagentId: string;
          reagentName: string;
          status: string;
          deletedAt: string;
        }>;
        failedReagents: Array<{
          reagentId: string;
          reagentName: string;
          error: string;
          errorType: string;
        }>;
      }>("/reagents/batch", { data });
    },

    recordMaintenanceConsumption: (data: MaintenanceConsumptionRequest) =>
      api.post<{ success: boolean; message: string }>(
        "/reagents/maintenance-consumption",
        data
      ),
  },

  expenses: {
    getAll: (params?: {
      pageNumber?: number;
      pageSize?: number;
      startDate?: string;
      endDate?: string;
      category?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
      }
      const queryString = searchParams.toString();
      return api.get<ExpenseListResponse>(
        `/expenses${queryString ? `?${queryString}` : ""}`
      );
    },

    getById: (id: string) => api.get<Expense>(`/expenses/${id}`),

    create: (expense: CreateExpenseRequest) =>
      api.post<Expense>("/expenses", expense),

    update: (id: string, expense: Partial<CreateExpenseRequest>) =>
      api.put<Expense>(`/expenses/${id}`, expense),

    delete: (id: string) => api.delete(`/expenses/${id}`),

    getStatistics: (params?: { startDate?: string; endDate?: string }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
      }
      const queryString = searchParams.toString();
      return api.get<ExpenseStatistics>(
        `/expenses/statistics${queryString ? `?${queryString}` : ""}`
      );
    },

    getByCategory: (params?: { startDate?: string; endDate?: string }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
      }
      const queryString = searchParams.toString();
      return api.get<ExpenseByCategory>(
        `/expenses/by-category${queryString ? `?${queryString}` : ""}`
      );
    },

    getCategories: () =>
      api.get<{
        categories: string[];
        count: number;
        suggestedCategories: string[];
      }>("/expenses/categories"),

    getByUser: (
      userId: string,
      params?: { startDate?: string; endDate?: string }
    ) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
      }
      const queryString = searchParams.toString();
      return api.get<{
        userId: string;
        period: { startDate: string; endDate: string };
        expenses: Expense[];
        summary: {
          count: number;
          totalAmount: number;
          categories: { category: string; count: number; amount: number }[];
        };
      }>(`/expenses/by-user/${userId}${queryString ? `?${queryString}` : ""}`);
    },

    getByPurchaser: (
      purchasedBy: string,
      params?: { startDate?: string; endDate?: string }
    ) => {
      const searchParams = new URLSearchParams();
      searchParams.append("purchasedBy", purchasedBy);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
      }
      const queryString = searchParams.toString();
      return api.get<{
        purchasedBy: string;
        period: { startDate?: string; endDate?: string };
        expenses: Expense[];
        summary: {
          count: number;
          totalAmount: number;
          categories: { category: string; count: number; amount: number }[];
        };
      }>(`/expenses/by-purchaser${queryString ? `?${queryString}` : ""}`);
    },
  },

  restockBatches: {
    create: (batch: CreateRestockBatchRequest) =>
      api.post<{
        success: boolean;
        message: string;
        data: RestockBatch;
      }>("/restock-batches", batch),

    getAll: (filters?: RestockBatchFilters) => {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }

      const queryString = params.toString();
      return api.get<RestockBatchResponse>(
        `/restock-batches${queryString ? `?${queryString}` : ""}`
      );
    },

    getById: (id: string) =>
      api.get<{
        success: boolean;
        message: string;
        data: RestockBatch;
      }>(`/restock-batches/${id}`),

    getByReference: (batchReference: string) =>
      api.get<{
        success: boolean;
        message: string;
        data: RestockBatch;
      }>(`/restock-batches/by-reference/${batchReference}`),

    update: (
      id: string,
      updates: { notes?: string; supplierReference?: string }
    ) =>
      api.put<{
        success: boolean;
        message: string;
        data: RestockBatch;
      }>(`/restock-batches/${id}`, updates),

    delete: (id: string) => api.delete(`/restock-batches/${id}`),

    getItems: (id: string) =>
      api.get<{
        success: boolean;
        message: string;
        data: RestockBatchItem[];
      }>(`/restock-batches/${id}/items`),

    getSummary: (params?: { from?: string; to?: string }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, String(value));
          }
        });
      }

      const queryString = queryParams.toString();
      return api.get<{
        success: boolean;
        data: RestockBatchSummary;
      }>(`/restock-batches/summary${queryString ? `?${queryString}` : ""}`);
    },

    getRecent: (params?: { days?: number } & RestockBatchFilters) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, String(value));
          }
        });
      }

      const queryString = queryParams.toString();
      return api.get<RestockBatchResponse>(
        `/restock-batches/recent${queryString ? `?${queryString}` : ""}`
      );
    },

    getTopByValue: (limit: number = 10) =>
      api.get<{
        success: boolean;
        data: RestockBatch[];
      }>(`/restock-batches/top-by-value?limit=${limit}`),

    getCompanies: () => api.get<string[]>("/restock-batches/companies"),

    getReceivedByUsers: () =>
      api.get<string[]>("/restock-batches/received-by-users"),

    getByCompany: (company: string) =>
      api.get<{
        success: boolean;
        data: RestockBatch[];
      }>(`/restock-batches/by-company/${encodeURIComponent(company)}`),
  },

  transactions: {
    getAll: (filters?: TransactionFilters) => {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }

      const queryString = params.toString();
      return api.get<TransactionListResponse>(
        `/transactions${queryString ? `?${queryString}` : ""}`
      );
    },

    getById: (id: string) => api.get<Transaction>(`/transactions/${id}`),

    getByReceiptNumber: (receiptNumber: string) =>
      api.get<Transaction>(`/transactions/receipt/${receiptNumber}`),

    create: (transaction: CreateTransactionRequest) =>
      api.post<{
        success: boolean;
        message: string;
        data: Transaction;
      }>("/transactions", transaction),

    void: (id: string, voidRequest: VoidTransactionRequest) =>
      api.post<{
        success: boolean;
        message: string;
        data: Transaction;
      }>(`/transactions/${id}/void`, voidRequest),

    getStatistics: (params?: { startDate?: string; endDate?: string }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, String(value));
          }
        });
      }

      const queryString = queryParams.toString();
      return api.get<TransactionStatistics>(
        `/transactions/statistics${queryString ? `?${queryString}` : ""}`
      );
    },
  },

  roles: {
    getAll: () => api.get<Role[]>("/roles"),
  },

  users: {
    getAll: (includeInactive: boolean = false) =>
      api.get<User[]>(`/users?includeInactive=${includeInactive}`),

    getById: (id: string) => api.get<User>(`/users/${id}`),

    create: (userData: CreateUserRequest) => api.post<User>("/users", userData),

    update: (id: string, userData: UpdateUserRequest) =>
      api.put<User>(`/users/${id}`, userData),

    delete: (id: string) => api.delete(`/users/${id}`),

    activate: (id: string) => api.patch<User>(`/users/${id}/activate`),

    deactivate: (id: string) => api.patch<User>(`/users/${id}/deactivate`),

    changePassword: (id: string, newPassword: string) =>
      api.put<{ message: string }>(`/users/${id}/password`, { newPassword }),
  },

  systemSettings: {
    getAll: () =>
      api.get<
        Array<{
          id: string;
          key: string;
          displayName: string;
          value: string;
          dataType: string;
          description: string;
          category: string;
          isRequired: boolean;
          isActive: boolean;
          parsedValue: string | number | boolean;
          defaultValue: string;
          validationRules: string | null;
          sortOrder: number;
          createdAt: string;
          updatedAt: string;
          createdBy: string;
          updatedBy: string;
        }>
      >("/systemsettings"),

    updateSetting: (key: string, value: string) =>
      api.patch<{ message: string }>(`/systemsettings/${key}`, { key, value }),

    toggleSetting: (key: string) =>
      api.patch<{ message: string; key: string; isActive: boolean }>(
        `/systemsettings/${key}/toggle`
      ),

    seed: () =>
      api.post<{ message: string; count: number }>("/systemsettings/seed"),
  },

  discounts: {
    getAll: (includeInactive: boolean = false) =>
      api.get<Discount[]>(`/discounts?includeInactive=${includeInactive}`),

    getActive: () => api.get<Discount[]>("/discounts/active"),

    getById: (id: string) => api.get<Discount>(`/discounts/${id}`),

    create: (data: DiscountRequest) => api.post<Discount>("/discounts", data),
  },
};
