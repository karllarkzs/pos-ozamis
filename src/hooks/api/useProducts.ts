import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  apiEndpoints,
  ProductResponse,
  ProductFilters,
  ProductSummary,
} from "../../lib/api";

export const productsKeys = {
  all: ["products"] as const,
  lists: () => [...productsKeys.all, "list"] as const,
  list: (filters: any) => [...productsKeys.lists(), filters] as const,
  infinite: (filters: any) =>
    [...productsKeys.lists(), "infinite", filters] as const,
  restock: () => [...productsKeys.all, "restock"] as const,
  restockInfinite: (filters: any) =>
    [...productsKeys.restock(), "infinite", filters] as const,
  details: () => [...productsKeys.all, "detail"] as const,
  detail: (id: string) => [...productsKeys.details(), id] as const,
  summary: () => [...productsKeys.all, "summary"] as const,
  productTypes: () => [...productsKeys.all, "productTypes"] as const,
  formulations: () => [...productsKeys.all, "formulations"] as const,
  categories: () => [...productsKeys.all, "categories"] as const,
  locations: () => [...productsKeys.all, "locations"] as const,
};

export function useProductTypes() {
  return useQuery({
    queryKey: productsKeys.productTypes(),
    queryFn: async () => {
      const response = await apiEndpoints.products.getProductTypes();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,

    refetchOnMount: "always",
  });
}

export function useProductFormulations() {
  return useQuery({
    queryKey: productsKeys.formulations(),
    queryFn: async () => {
      const response = await apiEndpoints.products.getFormulations();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,

    refetchOnMount: "always",
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: productsKeys.categories(),
    queryFn: async () => {
      const response = await apiEndpoints.products.getCategories();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,

    refetchOnMount: "always",
  });
}

export function useProductLocations() {
  return useQuery({
    queryKey: productsKeys.locations(),
    queryFn: async () => {
      const response = await apiEndpoints.products.getLocations();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,

    refetchOnMount: "always",
  });
}

export function useProductsReferenceData() {
  const productTypes = useProductTypes();
  const formulations = useProductFormulations();
  const categories = useProductCategories();
  const locations = useProductLocations();

  const result = {
    productTypes: {
      data: productTypes.data || [],
      isLoading: productTypes.isLoading,
      error: productTypes.error,
    },
    formulations: {
      data: formulations.data || [],
      isLoading: formulations.isLoading,
      error: formulations.error,
    },

    categories: {
      data: categories.data || [],
      isLoading: categories.isLoading,
      error: categories.error,
    },
    locations: {
      data: locations.data || [],
      isLoading: locations.isLoading,
      error: locations.error,
    },
    isAnyLoading:
      productTypes.isLoading ||
      formulations.isLoading ||
      categories.isLoading ||
      locations.isLoading,
    hasAnyError:
      productTypes.error ||
      formulations.error ||
      categories.error ||
      locations.error,
  };

  return result;
}

export function useProducts(filters?: ProductFilters) {
  const filtersKey = filters || {};

  return useQuery({
    queryKey: productsKeys.list(filtersKey),
    queryFn: async (): Promise<ProductResponse> => {
      const response = await apiEndpoints.products.getAll(filters);
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

export function useInfiniteProducts(filters?: Omit<ProductFilters, "page">) {
  return useInfiniteQuery({
    queryKey: productsKeys.infinite(filters || {}),
    queryFn: async ({ pageParam = 1 }): Promise<ProductResponse> => {
      const filtersWithPage: ProductFilters = {
        ...filters,
        page: pageParam,
        pageSize: filters?.pageSize || 20,
      };
      const response = await apiEndpoints.products.getAll(filtersWithPage);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, 
  });
}

export function useInfiniteProductsForRestock(
  filters?: Omit<ProductFilters, "page">
) {
  return useInfiniteQuery({
    queryKey: productsKeys.restockInfinite(filters || {}),
    queryFn: async ({ pageParam = 1 }): Promise<ProductResponse> => {
      const filtersWithPage: ProductFilters = {
        ...filters,
        page: pageParam,
        pageSize: filters?.pageSize || 20,
      };
      const response = await apiEndpoints.products.getForRestock(
        filtersWithPage
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, 
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productsKeys.detail(id),
    queryFn: async () => {
      const response = await apiEndpoints.products.getById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, 
  });
}

export function useProductSummary() {
  return useQuery({
    queryKey: productsKeys.summary(),
    queryFn: async (): Promise<ProductSummary> => {
      const response = await apiEndpoints.products.getSummary();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, 
  });
}

export function useClearProductReferenceCache() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: productsKeys.all });
    queryClient.invalidateQueries({ queryKey: productsKeys.all });
  };
}
