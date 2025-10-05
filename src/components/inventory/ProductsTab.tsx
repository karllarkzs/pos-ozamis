import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Group,
  Button,
  TextInput,
  Select,
  Paper,
  Text,
  Badge,
  Checkbox,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconTrash,
  IconSearch,
  IconAlertTriangle,
  IconClock,
  IconPrinter,
  IconAdjustments,
  IconDiscount,
  IconHeartPlus,
  IconPlus,
  IconCross,
  IconDropletPlus,
  IconDiscount2,
  IconDiscountCheckFilled,
  IconFlagDiscount,
  IconPercentage,
  IconEyeDiscount,
  IconCirclePercentage,
} from "@tabler/icons-react";
import { DataTable, DataTableColumn } from "../DataTable";
import {
  useInfiniteProducts,
  useProductsReferenceData,
  useProductSummary,
} from "../../hooks/api/useProducts";
import { useDebounce } from "../../hooks/useDebounce";
import type { Product, ProductFilters } from "../../lib/api";
import { apiEndpoints } from "../../lib/api";
import { useMutation } from "@tanstack/react-query";
import { formatCurrency } from "../../utils/currency";
import { ProductSummaryStats } from "../ProductSummaryStats";
import { EditProductModal } from "../EditProductModal";
import { PrintPreviewModal } from "../PrintPreviewModal";
import { StockAdjustmentModal } from "../StockAdjustmentModal";

interface ProductsTabProps {
  onAddProduct: () => void;
}

export function ProductsTab({ onAddProduct }: ProductsTabProps) {
  const { data: summary, refetch: refetchSummary } = useProductSummary();
  const [isPhilHealth, setIsPhilHealth] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [formulationFilter, setFormulationFilter] = useState<string | null>(
    null
  );
  const [isLowStock, setIsLowStock] = useState<boolean | null>(null);
  const [isNoStock, setIsNoStock] = useState<boolean | null>(null);
  const [isExpired, setIsExpired] = useState<boolean | null>(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState<boolean | null>(null);

  const [sortBy, setSortBy] = useState<string>("brand");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set()
  );

  const [editModalOpened, setEditModalOpened] = useState(false);
  const [printModalOpened, setPrintModalOpened] = useState(false);
  const [adjustStockModalOpened, setAdjustStockModalOpened] = useState(false);
  const [productsToEdit, setProductsToEdit] = useState<Product[]>([]);
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const productFilters: Omit<ProductFilters, "page"> = useMemo(
    () => ({
      searchTerm: debouncedSearchQuery || undefined,
      type: typeFilter || undefined,
      category: categoryFilter || undefined,
      location: locationFilter || undefined,
      formulation: formulationFilter || undefined,
      isLowStock: isLowStock === null ? undefined : isLowStock,
      isNoStock: isNoStock === null ? undefined : isNoStock,
      isExpired: isExpired === null ? undefined : isExpired,
      isExpiringSoon: isExpiringSoon === null ? undefined : isExpiringSoon,
      isPhilHealth: isPhilHealth ? true : undefined,
      sortBy: sortBy as ProductFilters["sortBy"],
      sortDirection,
      pageSize: 50,
    }),
    [
      debouncedSearchQuery,
      typeFilter,
      categoryFilter,
      locationFilter,
      formulationFilter,
      isLowStock,
      isNoStock,
      isExpired,
      isExpiringSoon,
      isPhilHealth,
      sortBy,
      sortDirection,
    ]
  );

  const {
    data: infiniteData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteProducts(productFilters);

  const referenceData = useProductsReferenceData();

  const products = infiniteData?.pages?.flatMap((page) => page.data) || [];
  const totalCount = infiniteData?.pages?.[0]?.totalCount || 0;

  useEffect(() => {
    if (error) {
      notifications.show({
        title: "Error Loading Products",
        message: "Failed to load product data. Please try again.",
        color: "red",
      });
    }
  }, [error]);

  const batchDeleteMutation = useMutation({
    mutationFn: (data: { productIds: string[]; reason?: string }) =>
      apiEndpoints.products.deleteBatch(data),
    onSuccess: (response) => {
      const { totalDeleted, totalFailed } = response.data;
      if (totalFailed === 0) {
        notifications.show({
          title: "Success",
          message: `Successfully deleted ${totalDeleted} products`,
          color: "green",
        });
      } else {
        notifications.show({
          title: "Partially Completed",
          message: `${totalDeleted} products deleted, ${totalFailed} failed`,
          color: "yellow",
        });
      }
      refetch();
      setSelectedProductIds(new Set());
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to delete products",
        color: "red",
      });
    },
  });

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.currentTarget.value);
    },
    []
  );

  const handleSort = useCallback(
    (field: string) => {
      if (sortBy === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortBy(field);
        setSortDirection("asc");
      }
    },
    [sortBy, sortDirection]
  );

  const handleSelectProduct = useCallback(
    (productId: string, selected: boolean) => {
      setSelectedProductIds((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(productId);
        } else {
          newSet.delete(productId);
        }
        return newSet;
      });
    },
    []
  );

  const handleSelectAllProducts = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedProductIds(new Set(products.map((p) => p.id)));
      } else {
        setSelectedProductIds(new Set());
      }
    },
    [products]
  );

  const handleBatchDelete = useCallback(
    async (productIds: Set<string>) => {
      if (productIds.size === 0) return;

      const confirmed = window.confirm(
        `Are you sure you want to delete ${productIds.size} selected product(s)? This action cannot be undone.`
      );

      if (!confirmed) return;

      try {
        await batchDeleteMutation.mutateAsync({
          productIds: Array.from(productIds),
          reason: "Batch deletion from inventory management",
        });
      } catch (error) {
        console.error("Failed to batch delete products:", error);
      }
    },
    [batchDeleteMutation]
  );

  const handleFilterPreset = useCallback((filterType: string) => {
    setTypeFilter(null);
    setCategoryFilter(null);
    setLocationFilter(null);
    setFormulationFilter(null);
    setIsLowStock(null);
    setIsNoStock(null);
    setIsExpired(null);
    setIsExpiringSoon(null);

    switch (filterType) {
      case "low-stock":
        setIsLowStock(true);
        break;
      case "no-stock":
        setIsNoStock(true);
        break;
      case "expired":
        setIsExpired(true);
        break;
      case "expiring-soon":
        setIsExpiringSoon(true);
        break;
    }
  }, []);

  const handleRowClick = useCallback((product: Product) => {
    setProductsToEdit([product]);
    setEditModalOpened(true);
  }, []);

  const handleBatchEditClick = useCallback(() => {
    const selectedProducts = products.filter((p) =>
      selectedProductIds.has(p.id)
    );
    setProductsToEdit(selectedProducts);
    setEditModalOpened(true);
  }, [products, selectedProductIds]);

  const getStockColor = (item: Product) => {
    if (item.quantity === 0) return "red";
    if (item.isLowStock) return "orange";
    return "green";
  };

  const getProductRowStyle = (product: Product): React.CSSProperties => {
    if (product.isExpired) {
      return {
        backgroundColor: "#fef2f2",
      };
    }
    if (product.isExpiringSoon) {
      return {
        backgroundColor: "#fefaf0",
      };
    }
    return {};
  };

  const productColumns: DataTableColumn<Product>[] = useMemo(
    () => [
      {
        key: "select",
        title: (
          <Checkbox
            checked={
              products
                ? selectedProductIds.size === products.length &&
                  products.length > 0
                : false
            }
            indeterminate={
              selectedProductIds.size > 0 &&
              selectedProductIds.size < products.length
            }
            onChange={(event) =>
              handleSelectAllProducts(event.currentTarget.checked)
            }
          />
        ),
        width: 50,
        align: "center",
        headerAlign: "center",
        render: (item: Product) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selectedProductIds.has(item.id)}
              onChange={(event) =>
                handleSelectProduct(item.id, event.currentTarget.checked)
              }
            />
          </div>
        ),
      },
      {
        key: "brand",
        title: "Product",
        width: 200,
        sortable: true,
        sortKey: "brand",
        render: (item: Product) => (
          <Group gap="xs" wrap="nowrap" align="center">
            <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
              {item.isDiscountable && (
                <Tooltip label="Discountable" withArrow>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <IconCirclePercentage
                      size={24}
                      style={{ color: "var(--mantine-color-green-6)" }}
                    />
                  </div>
                </Tooltip>
              )}
              {item.isPhilHealth && (
                <Tooltip label="PhilHealth" withArrow>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <IconDropletPlus
                      size={24}
                      style={{ color: "var(--mantine-color-red-6)" }}
                    />
                  </div>
                </Tooltip>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text size="sm" fw={500} truncate>
                {item.brand}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {item.generic}
              </Text>
            </div>
          </Group>
        ),
      },
      {
        key: "barcode",
        title: "Barcode",
        width: 120,
        render: (item: Product) => (
          <Text size="xs" ff="monospace">
            {item.barcode || "—"}
          </Text>
        ),
      },
      {
        key: "type",
        title: "Type",
        width: 100,
        sortable: true,
        sortKey: "type",
        render: (item: Product) => (
          <Badge size="sm" variant="light" color="blue">
            {item.type || "—"}
          </Badge>
        ),
      },
      {
        key: "category",
        title: "Category",
        width: 120,
        sortable: true,
        sortKey: "category",
        render: (item: Product) => (
          <Badge
            size="sm"
            variant="outline"
            color="gray"
            style={{
              maxWidth: "110px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.category || "—"}
          </Badge>
        ),
      },
      {
        key: "location",
        title: "Location",
        width: 100,
        sortable: true,
        sortKey: "location",
        render: (item: Product) => (
          <Text size="sm">{item.location || "—"}</Text>
        ),
      },
      {
        key: "formulation",
        title: "Formulation",
        width: 120,
        sortable: true,
        sortKey: "formulation",
        render: (item: Product) => (
          <Text size="sm">{item.formulation || "—"}</Text>
        ),
      },
      {
        key: "quantity",
        title: "Stock",
        width: 80,
        align: "center",
        headerAlign: "center",
        sortable: true,
        sortKey: "quantity",
        render: (item: Product) => (
          <div>
            <Badge
              color={getStockColor(item)}
              variant={item.quantity === 0 ? "filled" : "light"}
              size="sm"
            >
              {item.quantity}
            </Badge>
            <Text size="xs" c="dimmed">
              Min: {item.minimumStock}
            </Text>
          </div>
        ),
      },
      {
        key: "retailPrice",
        title: "Price",
        width: 110,
        align: "right",
        headerAlign: "right",
        sortable: true,
        sortKey: "retailPrice",
        render: (item: Product) => (
          <div style={{ textAlign: "right" }}>
            <Text size="sm" fw={500}>
              {formatCurrency(item.retailPrice)}
            </Text>
            <Text size="xs" c="dimmed">
              {formatCurrency(item.wholesalePrice)}
            </Text>
          </div>
        ),
      },
      {
        key: "expirationDate",
        title: "Expiry",
        width: 100,
        render: (item: Product) => {
          if (!item.expirationDate) {
            return (
              <Text size="sm" c="dimmed">
                —
              </Text>
            );
          }

          const expiryDate = new Date(item.expirationDate);
          const today = new Date();
          const isExpired = expiryDate < today;
          const isExpiringSoon =
            !isExpired &&
            expiryDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

          return (
            <div>
              <Text
                size="xs"
                c={isExpired ? "red" : isExpiringSoon ? "orange" : "dimmed"}
              >
                {expiryDate.toLocaleDateString()}
              </Text>
              {(isExpired || isExpiringSoon) && (
                <Badge
                  size="xs"
                  color={isExpired ? "red" : "orange"}
                  variant="light"
                  leftSection={
                    isExpired ? (
                      <IconAlertTriangle size={10} />
                    ) : (
                      <IconClock size={10} />
                    )
                  }
                >
                  {isExpired ? "Expired" : "Soon"}
                </Badge>
              )}
            </div>
          );
        },
      },
    ],
    [
      products,
      selectedProductIds,
      handleSelectAllProducts,
      handleSelectProduct,
      getStockColor,
      formatCurrency,
    ]
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {}
      <div style={{ flexShrink: 0, marginBottom: "1rem" }}>
        {}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-end",
            marginBottom: "0.5rem",
          }}
        >
          <div style={{ flex: "3" }}>
            <TextInput
              placeholder="Search products..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div style={{ flex: "1" }}>
            <Select
              placeholder="Stock Status"
              value={
                isLowStock === true
                  ? "low"
                  : isNoStock === true
                  ? "none"
                  : isLowStock === false
                  ? "normal"
                  : null
              }
              onChange={(value) => {
                if (value === "low") {
                  setIsLowStock(true);
                  setIsNoStock(null);
                } else if (value === "none") {
                  setIsLowStock(null);
                  setIsNoStock(true);
                } else if (value === "normal") {
                  setIsLowStock(false);
                  setIsNoStock(false);
                } else {
                  setIsLowStock(null);
                  setIsNoStock(null);
                }
              }}
              data={[
                { value: "low", label: "Low Stock" },
                { value: "none", label: "No Stock" },
              ]}
              clearable
            />
          </div>

          <div style={{ flex: "1" }}>
            <Select
              placeholder="Expiry Status"
              value={
                isExpired === true
                  ? "expired"
                  : isExpiringSoon === true
                  ? "expiring"
                  : null
              }
              onChange={(value) => {
                if (value === "expired") {
                  setIsExpired(true);
                  setIsExpiringSoon(null);
                } else if (value === "expiring") {
                  setIsExpired(null);
                  setIsExpiringSoon(true);
                } else {
                  setIsExpired(null);
                  setIsExpiringSoon(null);
                }
              }}
              data={[
                { value: "expired", label: "Expired" },
                { value: "expiring", label: "Expiring Soon" },
              ]}
              clearable
            />
          </div>
        </div>
        {}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: "1" }}>
            <Select
              placeholder="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              data={referenceData?.productTypes?.data || []}
              clearable
            />
          </div>

          <div style={{ flex: "1" }}>
            <Select
              placeholder="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              data={referenceData?.categories?.data || []}
              clearable
            />
          </div>

          <div style={{ flex: "1" }}>
            <Select
              placeholder="Formulation"
              value={formulationFilter}
              onChange={setFormulationFilter}
              data={referenceData?.formulations?.data || []}
              clearable
            />
          </div>

          <div style={{ flex: "1" }}>
            <Select
              placeholder="Location"
              value={locationFilter}
              onChange={setLocationFilter}
              data={referenceData?.locations?.data || []}
              clearable
            />
          </div>
        </div>

        {}
        <div
          style={{ flexShrink: 0, marginTop: "0.5rem", marginBottom: "1rem" }}
        >
          <ProductSummaryStats
            onFilterClick={handleFilterPreset}
            isPhilHealth={isPhilHealth}
            onPhilHealthToggle={() => {
              setIsPhilHealth((v) => {
                const newVal = !v;
                setTimeout(() => {
                  refetchSummary();
                  refetch();
                }, 0);
                return newVal;
              });
            }}
          />
        </div>
      </div>

      {}
      <div style={{ flexShrink: 0, marginBottom: "1rem" }}>
        <Group justify="space-between" align="center">
          <div>
            {!isLoading && products.length > 0 && (
              <Text size="sm" c="dimmed">
                Showing {products.length.toLocaleString()} of{" "}
                {totalCount.toLocaleString()} products
                {hasNextPage && " (scroll to load more)"}
              </Text>
            )}
          </div>

          <Group gap="xs">
            <Tooltip label="Print Products">
              <Button
                leftSection={<IconPrinter size={16} />}
                variant="light"
                size="sm"
                onClick={() => setPrintModalOpened(true)}
              >
                Print
              </Button>
            </Tooltip>
            {selectedProductIds.size === 1 && (
              <Tooltip label="Adjust stock quantity">
                <Button
                  leftSection={<IconAdjustments size={16} />}
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={() => {
                    const productId = Array.from(selectedProductIds)[0];
                    const product = products.find((p) => p.id === productId);
                    if (product) {
                      setProductToAdjust(product);
                      setAdjustStockModalOpened(true);
                    }
                  }}
                >
                  Adjust Stock
                </Button>
              </Tooltip>
            )}
            {selectedProductIds.size > 0 && (
              <>
                <Tooltip
                  label={`Edit ${selectedProductIds.size} selected product(s)`}
                >
                  <Button
                    leftSection={<IconEdit size={16} />}
                    variant="light"
                    size="sm"
                    onClick={handleBatchEditClick}
                  >
                    Edit ({selectedProductIds.size})
                  </Button>
                </Tooltip>
                <Tooltip
                  label={`Delete ${selectedProductIds.size} selected product(s)`}
                >
                  <Button
                    leftSection={<IconTrash size={16} />}
                    variant="light"
                    color="red"
                    size="sm"
                    onClick={() => handleBatchDelete(selectedProductIds)}
                    loading={batchDeleteMutation.isPending}
                    disabled={batchDeleteMutation.isPending}
                  >
                    Delete ({selectedProductIds.size})
                  </Button>
                </Tooltip>
              </>
            )}
            <Button variant="filled" size="sm" onClick={onAddProduct}>
              Add Product
            </Button>
          </Group>
        </Group>
      </div>

      {}
      <Paper
        withBorder
        style={{
          width: "100%",
          height: "calc(100vh - 350px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <DataTable
            data={products || []}
            columns={productColumns}
            loading={isLoading || isFetchingNextPage}
            hasMore={hasNextPage}
            onLoadMore={fetchNextPage}
            height="100%"
            stickyHeader
            emptyMessage="No products found"
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            horizontalScroll
            minWidth="0px"
            getRowStyle={getProductRowStyle}
            onRowClick={handleRowClick}
          />
        </div>
      </Paper>

      {}
      <EditProductModal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        products={productsToEdit}
        onSuccess={() => {
          refetch();
          setSelectedProductIds(new Set());
        }}
      />

      {}
      <PrintPreviewModal
        opened={printModalOpened}
        onClose={() => setPrintModalOpened(false)}
        type="products"
      />

      {}
      <StockAdjustmentModal
        opened={adjustStockModalOpened}
        onClose={() => {
          setAdjustStockModalOpened(false);
          setProductToAdjust(null);
        }}
        product={productToAdjust}
        onSuccess={() => {
          refetch();
          setSelectedProductIds(new Set());
        }}
      />
    </div>
  );
}
