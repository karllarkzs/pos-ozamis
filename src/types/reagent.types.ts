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

