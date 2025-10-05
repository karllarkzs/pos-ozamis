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

