import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export interface Discount {
  isRegularDiscounted: boolean;
  specialDiscountAmount: number;
}

export interface CartState {
  items: CartItem[];
  discount: Discount;
  lastUpdated: string;
}

const initialState: CartState = {
  items: [],
  discount: {
    isRegularDiscounted: false,
    specialDiscountAmount: 0,
  },
  lastUpdated: new Date().toISOString(),
};

export interface AddToCartPayload {
  id: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export interface UpdateQuantityPayload {
  id: string;
  quantity: number;
  maxStock?: number;
}

export interface UpdateDiscountPayload {
  isRegularDiscounted?: boolean;
  specialDiscountAmount?: number;
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<AddToCartPayload>) => {
      const { id, name, price, quantity, maxStock } = action.payload;
      const existingItem = state.items.find((item) => item.id === id);

      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          maxStock
        );
        existingItem.quantity = newQuantity;
        existingItem.maxStock = maxStock;
      } else {
        const finalQuantity = Math.min(quantity, maxStock);
        state.items.push({
          id,
          name,
          price,
          quantity: finalQuantity,
          maxStock,
        });
      }
      state.lastUpdated = new Date().toISOString();
    },

    updateItemQuantity: (
      state,
      action: PayloadAction<UpdateQuantityPayload>
    ) => {
      const { id, quantity, maxStock } = action.payload;
      const item = state.items.find((item) => item.id === id);

      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((item) => item.id !== id);
        } else {
          const stockLimit = maxStock ?? item.maxStock;
          item.quantity = Math.min(quantity, stockLimit);
          item.maxStock = stockLimit;
        }
        state.lastUpdated = new Date().toISOString();
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.items = state.items.filter((item) => item.id !== id);
      state.lastUpdated = new Date().toISOString();
    },

    clearCart: (state) => {
      state.items = [];
      state.discount = {
        isRegularDiscounted: false,
        specialDiscountAmount: 0,
      };
      state.lastUpdated = new Date().toISOString();
    },

    updateDiscount: (state, action: PayloadAction<UpdateDiscountPayload>) => {
      const { isRegularDiscounted, specialDiscountAmount } = action.payload;

      if (isRegularDiscounted !== undefined) {
        state.discount.isRegularDiscounted = isRegularDiscounted;
      }

      if (specialDiscountAmount !== undefined) {
        state.discount.specialDiscountAmount = Math.max(
          0,
          specialDiscountAmount
        );
      }

      state.lastUpdated = new Date().toISOString();
    },

    updateItemStock: (
      state,
      action: PayloadAction<{ id: string; maxStock: number }>
    ) => {
      const { id, maxStock } = action.payload;
      const item = state.items.find((item) => item.id === id);

      if (item) {
        item.maxStock = maxStock;

        if (item.quantity > maxStock) {
          item.quantity = maxStock;
        }
        state.lastUpdated = new Date().toISOString();
      }
    },
  },
});

export const {
  addToCart,
  updateItemQuantity,
  removeFromCart,
  clearCart,
  updateDiscount,
  updateItemStock,
} = cartSlice.actions;

export default cartSlice.reducer;

export const selectCart = (state: { cart: CartState }) => state.cart;
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartDiscount = (state: { cart: CartState }) =>
  state.cart.discount;
export const selectCartLastUpdated = (state: { cart: CartState }) =>
  state.cart.lastUpdated;

export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);

export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

export const selectCartVAT = (state: { cart: CartState }) => {
  const subtotal = selectCartSubtotal(state);
  return subtotal * 0.12;
};

export const selectCartTotal = (state: { cart: CartState }) => {
  const subtotal = selectCartSubtotal(state);
  const vat = selectCartVAT(state);
  const baseTotal = subtotal + vat;

  const { isRegularDiscounted, specialDiscountAmount } = state.cart.discount;

  const regularDiscountAmount = isRegularDiscounted ? baseTotal * 0.1 : 0;

  const finalTotal = baseTotal - regularDiscountAmount - specialDiscountAmount;

  return Math.max(0, finalTotal);
};

export const selectCartDiscountAmounts = createSelector(
  [selectCartSubtotal, selectCartVAT, selectCartDiscount],
  (subtotal, vat, discount) => {
    const baseTotal = subtotal + vat;
    const { isRegularDiscounted, specialDiscountAmount } = discount;

    return {
      regularDiscountAmount: isRegularDiscounted ? baseTotal * 0.1 : 0,
      specialDiscountAmount: specialDiscountAmount,
    };
  }
);

export const canAddToCart = (
  cartItems: CartItem[],
  productId: string,
  quantityToAdd: number,
  maxStock: number
): boolean => {
  const existingItem = cartItems.find((item) => item.id === productId);
  const currentQuantity = existingItem ? existingItem.quantity : 0;
  return currentQuantity + quantityToAdd <= maxStock;
};
