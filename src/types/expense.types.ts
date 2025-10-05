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

