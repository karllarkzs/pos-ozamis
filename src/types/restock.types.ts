import type { Product } from "./product.types";
import type { Reagent } from "./reagent.types";

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


