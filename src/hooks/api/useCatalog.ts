import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
  useMutation,
} from "@tanstack/react-query";
import {
  apiEndpoints,
  CatalogItem,
  CatalogFilters,
  CatalogResponse,
  Transaction,
  CartItem,
} from "../../lib/api";

export const catalogKeys = {
  all: ["catalog"] as const,
  lists: () => [...catalogKeys.all, "list"] as const,
  list: (filters: CatalogFilters) => [...catalogKeys.lists(), filters] as const,
  details: () => [...catalogKeys.all, "detail"] as const,
  detail: (id: string) => [...catalogKeys.details(), id] as const,
  infinite: (filters: CatalogFilters) =>
    [...catalogKeys.all, "infinite", filters] as const,
};

export function useCatalog(filters?: CatalogFilters) {
  return useQuery({
    queryKey: catalogKeys.list(filters || {}),
    queryFn: async (): Promise<CatalogResponse> => {
      const response = await apiEndpoints.catalog.getAll(filters);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: {
      data: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  });
}

export function useInfiniteCatalog(filters?: Omit<CatalogFilters, "page">) {
  return useInfiniteQuery({
    queryKey: catalogKeys.infinite(filters || {}),
    queryFn: async ({ pageParam = 1 }): Promise<CatalogResponse> => {
      const filtersWithPage: CatalogFilters = {
        ...filters,
        page: pageParam,
        pageSize: filters?.pageSize || 20,
      };
      const response = await apiEndpoints.catalog.getAll(filtersWithPage);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCatalogItem(id: string) {
  return useQuery({
    queryKey: catalogKeys.detail(id),
    queryFn: async (): Promise<CatalogItem> => {
      const response = await apiEndpoints.catalog.getById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCatalogItemExists(id: string) {
  return useQuery({
    queryKey: [...catalogKeys.detail(id), "exists"],
    queryFn: async () => {
      const response = await apiEndpoints.catalog.checkExists(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePOSCatalog() {
  const queryClient = useQueryClient();

  const getCatalogItems = (filters: CatalogFilters = {}) => {
    const defaultFilters: CatalogFilters = {
      sortBy: "name",
      sortDirection: "asc",
      pageSize: 50,
      ...filters,
    };

    return useCatalog(defaultFilters);
  };

  const searchItems = (searchTerm: string, itemType?: "Product" | "Test") => {
    const filters: CatalogFilters = {
      search: searchTerm,
      itemType,
      pageSize: 20,
      sortBy: "name",
    };

    return useCatalog(filters);
  };

  const getProducts = (filters: Omit<CatalogFilters, "itemType"> = {}) => {
    return useCatalog({
      ...filters,
      itemType: "Product",
    });
  };

  const getTests = (filters: Omit<CatalogFilters, "itemType"> = {}) => {
    return useCatalog({
      ...filters,
      itemType: "Test",
    });
  };

  const getLowStockItems = (itemType?: "Product" | "Test") => {
    return useCatalog({
      isLowStock: true,
      itemType,
      sortBy: "quantity",
      sortDirection: "asc",
      pageSize: 100,
    });
  };

  const getNoStockItems = (itemType?: "Product" | "Test") => {
    return useCatalog({
      isNoStock: true,
      itemType,
      sortBy: "name",
      sortDirection: "asc",
      pageSize: 100,
    });
  };

  const getDiscountableItems = (
    filters: Omit<CatalogFilters, "isDiscountable"> = {}
  ) => {
    return useCatalog({
      ...filters,
      isDiscountable: true,
    });
  };

  const updateItemStockOptimistically = (
    itemId: string,
    quantitySold: number
  ) => {
    queryClient.setQueryData(
      catalogKeys.detail(itemId),
      (oldItem: CatalogItem | undefined) => {
        if (!oldItem) return oldItem;

        const newQuantity = Math.max(0, oldItem.quantity - quantitySold);
        return {
          ...oldItem,
          quantity: newQuantity,
          isLow: newQuantity <= 10, // This should ideally come from backend minimum stock setting
        };
      }
    );

    queryClient.setQueriesData(
      { queryKey: catalogKeys.lists() },
      (oldData: CatalogResponse | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((item) => {
            if (item.id === itemId) {
              const newQuantity = Math.max(0, item.quantity - quantitySold);
              return {
                ...item,
                quantity: newQuantity,
                isLow: newQuantity <= 10, // This should ideally come from backend minimum stock setting
              };
            }
            return item;
          }),
        };
      }
    );
  };

  const invalidateAllCatalog = () => {
    queryClient.invalidateQueries({ queryKey: catalogKeys.all });
  };

  const refreshCatalogList = (filters: CatalogFilters) => {
    queryClient.invalidateQueries({ queryKey: catalogKeys.list(filters) });
  };

  return {
    getCatalogItems,
    searchItems,
    getProducts,
    getTests,
    getLowStockItems,
    getNoStockItems,
    getDiscountableItems,
    updateItemStockOptimistically,
    invalidateAllCatalog,
    refreshCatalogList,
  };
}

export function convertCatalogItemToCartItem(
  item: CatalogItem,
  quantity: number
): CartItem {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: quantity,
    maxStock: item.quantity,
    itemType: item.itemType,
    isDiscountable: item.isDiscountable,
  };
}

export function useProcessTransaction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      items,
      paymentData,
    }: {
      items: CartItem[];
      paymentData: {
        paymentMethod: "Cash" | "GCash";
        gcashReference?: string;
        cashInHand?: number;
        specialDiscount: number;
        regularDiscount: number;
        subtotal: number;
        vat: number;
        total: number;
      };
    }): Promise<Transaction> => {
      const response = await apiEndpoints.transactions.create({
        paymentMethod: paymentData.paymentMethod,
        gcashReference: paymentData.gcashReference || null,
        cashInHand: paymentData.cashInHand || null,
        specialDiscount: paymentData.specialDiscount,
        regularDiscount: paymentData.regularDiscount,
        subtotal: paymentData.subtotal,
        vat: paymentData.vat,
        totalAmount: paymentData.total,
        items: items.map((item) => ({
          itemId: item.id,
          quantity: item.quantity,
        })),
      });
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.all });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const processTransaction = async (
    items: CartItem[],
    paymentData: {
      paymentMethod: "Cash" | "GCash";
      gcashReference?: string;
      cashInHand?: number;
      specialDiscount: number;
      regularDiscount: number;
      subtotal: number;
      vat: number;
      total: number;
    }
  ) => {
    return mutation.mutateAsync({ items, paymentData });
  };

  return {
    processTransaction,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
