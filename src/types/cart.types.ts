export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
  itemType: "Product" | "Test";
  isDiscountable: boolean;
}

