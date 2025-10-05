export interface DesktopAPI {
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
  };

  hardware: {
    getPrinters: () => Promise<string[]>;
    testPrintReceipt: (printerName: string) => Promise<string>;
    printEscposReceipt: (
      printerName: string,
      escposData: number[]
    ) => Promise<string>;
    printReceipt: (data: any) => Promise<string>;
  };

  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };

  ui: {
    showAlert: (title: string, message: string) => Promise<string>;
  };
}

declare global {
  interface Window {
    electronAPI?: DesktopAPI;
    __TAURI__?: any;
  }
}

export interface ReagentRequirement {
  reagentId: string;
  requiredAmount: number;
  reagentType: "ChargeBased" | "VolumeBased";
  reagentName?: string;
  reagentAvailableAmount?: number;
  reagentUnit?: string;
  reagentIsLowStock?: boolean;
  notes?: string;
}

export interface Test {
  id: string;
  name: string;
  price: number;
  canPerform: boolean;
  availableQuantity: number;
  reagentRequirements: ReagentRequirement[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface TestResponse {
  data: Test[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TestFilters {
  page?: number;
  pageSize?: number;

  searchTerm?: string;
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  canPerform?: boolean;
  includeDeleted?: boolean;

  sortBy?: "name" | "price" | "createdAt";
  sortDirection?: "asc" | "desc";
}

export interface CreateTestRequest {
  name: string;
  price: number;
  reagentRequirements: {
    reagentId: string;
    requiredAmount: number;
  }[];
}

export interface UpdateTestRequest extends CreateTestRequest {
  id: string;
}

export interface TestSummary {
  totalTests: number;
  performableTests: number;
  unperformableTests: number;
  testsWithReagents: number;
  averageTestPrice: number;
  totalReagentTypes: number;
}

export interface PerformTestRequest {
  performedBy: string;
  patientInfo?: string;
  notes?: string;
}

export {};
