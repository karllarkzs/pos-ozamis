import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";
import {
  addToCart,
  updateItemQuantity,
  removeFromCart,
  clearCart,
  updateDiscount,
  updateItemStock,
  selectCart,
  selectCartItems,
  selectCartDiscount,
  selectCartItemCount,
  selectCartSubtotal,
  selectCartVAT,
  selectCartTotal,
  selectCartDiscountAmounts,
  canAddToCart,
  type AddToCartPayload,
  type UpdateQuantityPayload,
  type UpdateDiscountPayload,
} from "./slices/cartSlice";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  return {
    ...auth,
    dispatch,
  };
};

export const usePermissions = () => {
  const user = useAppSelector((state) => state.auth.user);
  const userRole = user?.role;

  const hasRole = (requiredRole: number) => {
    if (!userRole) return false;

    if (userRole === 2) return true;

    return userRole === requiredRole;
  };

  const isAdmin = userRole === 2;
  const isCashier = userRole === 1;
  const isLab = userRole === 3;

  const canAccessAdmin = userRole === 2;
  const canAccessPOS = userRole === 1 || userRole === 2;
  const canAccessLab = userRole === 3 || userRole === 2;

  return {
    userRole,
    hasRole,
    isAdmin,
    isCashier,
    isLab,
    canAccessAdmin,
    canAccessPOS,
    canAccessLab,
  };
};

export const useCart = () => {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCart);
  const items = useAppSelector(selectCartItems);
  const discount = useAppSelector(selectCartDiscount);
  const itemCount = useAppSelector(selectCartItemCount);
  const subtotal = useAppSelector(selectCartSubtotal);
  const vat = useAppSelector(selectCartVAT);
  const total = useAppSelector(selectCartTotal);
  const discountAmounts = useAppSelector(selectCartDiscountAmounts);

  const addItem = (payload: AddToCartPayload) => {
    dispatch(addToCart(payload));
  };

  const updateQuantity = (payload: UpdateQuantityPayload) => {
    dispatch(updateItemQuantity(payload));
  };

  const removeItem = (id: string) => {
    dispatch(removeFromCart(id));
  };

  const clear = () => {
    dispatch(clearCart());
  };

  const setDiscount = (payload: UpdateDiscountPayload) => {
    dispatch(updateDiscount(payload));
  };

  const updateStock = (id: string, maxStock: number) => {
    dispatch(updateItemStock({ id, maxStock }));
  };

  const canAdd = (productId: string, quantity: number, maxStock: number) => {
    return canAddToCart(items, productId, quantity, maxStock);
  };

  const getItemQuantity = (productId: string) => {
    const item = items.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const hasItem = (productId: string) => {
    return items.some((item) => item.id === productId);
  };

  const isEmpty = items.length === 0;

  return {
    cart,
    items,
    discount,
    itemCount,
    subtotal,
    vat,
    total,
    discountAmounts,
    isEmpty,

    addItem,
    updateQuantity,
    removeItem,
    clear,
    setDiscount,
    updateStock,

    canAdd,
    getItemQuantity,
    hasItem,
  };
};
