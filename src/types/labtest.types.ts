export enum LabTestCategory {
  Hematology = 1,
  ClinicalChemistry = 2,
  ImmunologyAndSerology = 3,
  XRay = 4,
  Ultrasound = 5,
  ClinicalMicroscopy = 6,
  Others = 7,
}

export const LAB_TEST_CATEGORY_NAMES: Record<LabTestCategory, string> = {
  [LabTestCategory.Hematology]: "Hematology",
  [LabTestCategory.ClinicalChemistry]: "Clinical Chemistry",
  [LabTestCategory.ImmunologyAndSerology]: "Immunology & Serology",
  [LabTestCategory.XRay]: "X-Ray",
  [LabTestCategory.Ultrasound]: "Ultrasound",
  [LabTestCategory.ClinicalMicroscopy]: "Clinical Microscopy",
  [LabTestCategory.Others]: "Others",
};

export const LAB_TEST_CATEGORY_COLORS: Record<LabTestCategory, string> = {
  [LabTestCategory.Hematology]: "red",
  [LabTestCategory.ClinicalChemistry]: "blue",
  [LabTestCategory.ImmunologyAndSerology]: "violet",
  [LabTestCategory.XRay]: "orange",
  [LabTestCategory.Ultrasound]: "teal",
  [LabTestCategory.ClinicalMicroscopy]: "green",
  [LabTestCategory.Others]: "gray",
};

export interface LabTest {
  id: string;
  name: string;
  category: LabTestCategory;
  categoryName: string;
  price: number;
  isAvailable: boolean;
  isPhilHealth: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface LabTestFilters {
  search?: string;
  category?: number;
  isAvailable?: boolean;
  isPhilHealth?: boolean;
  sortBy?: "name" | "price" | "category" | "createdat";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface LabTestCreate {
  name: string;
  category: number;
  price: number;
  isAvailable?: boolean;
  isPhilHealth?: boolean;
}

export interface LabTestUpdate {
  name?: string;
  category?: number;
  price?: number;
  isAvailable?: boolean;
  isPhilHealth?: boolean;
}

export interface PaginatedLabTestResponse {
  data: LabTest[];
  page: number;
  pageSize: number;
  totalCount: number;
  sortBy?: string;
  sortDirection?: string;
}
