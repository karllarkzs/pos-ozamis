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

