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
  itemName: string;
  itemType: "Product";
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

    subTotal: number;
    regularDiscount: number;
    specialDiscount: number;
    discountAmount: number;
    vatAmount: number;

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
