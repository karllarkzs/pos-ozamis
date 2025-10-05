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


