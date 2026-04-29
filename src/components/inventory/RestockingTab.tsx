import { useState, useMemo, useCallback } from "react";
import {
  Text,
  Badge,
  Paper,
  Group,
  Button,
  ActionIcon,
  TextInput,
  Select,
  NumberInput,
  Combobox,
  useCombobox,
  Modal,
  Stack,
  Table,
  ThemeIcon,
  Divider,
  Center,
  Loader,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconTrash,
  IconPackage,
  IconCurrencyPeso,
  IconCalendar,
  IconMapPin,
  IconAlertCircle,
} from "@tabler/icons-react";
import { DataTable, DataTableColumn } from "../DataTable";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import {
  useInfiniteProductsForRestock,
  useProduct,
} from "../../hooks/api/useProducts";
import { formatCurrency } from "../../utils/currency";
import {
  useCreateRestockBatch,
  useRestockBatchCompanies,
} from "../../hooks/api/useRestockBatches";
import type { Product, ProductFilters, RestockQueueItem } from "../../lib/api";

interface CustomSelectProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  data: string[];
  required?: boolean;
  size?: string;
}

function CustomSelect({
  label,
  placeholder,
  value,
  onChange,
  data,
  required,
  size = "sm",
}: CustomSelectProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const handleValueSelect = (val: string) => {
    onChange(val);
    combobox.closeDropdown();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.currentTarget.value;
    onChange(newValue);
    if (newValue.length > 0) {
      combobox.openDropdown();
    } else {
      combobox.closeDropdown();
    }
  };

  const handleClear = () => {
    onChange("");
    combobox.closeDropdown();
  };

  const handleChevronClick = () => {
    if (combobox.dropdownOpened) {
      combobox.closeDropdown();
    } else {
      combobox.openDropdown();
    }
  };

  const filteredOptions = data.filter((item) =>
    item.toLowerCase().includes((value || "").toLowerCase()),
  );

  const options = filteredOptions.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={handleValueSelect}
    >
      <Combobox.Target>
        <TextInput
          label={label}
          placeholder={placeholder}
          value={value || ""}
          onChange={handleInputChange}
          required={required}
          size={size}
          rightSection={
            <Group gap={4}>
              {value && (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={handleClear}
                >
                  ×
                </ActionIcon>
              )}
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={handleChevronClick}
              >
                <Combobox.Chevron />
              </ActionIcon>
            </Group>
          }
          rightSectionWidth={value ? 70 : 40}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options style={{ maxHeight: 200, overflowY: "auto" }}>
          {options.length > 0 ? (
            options
          ) : (
            <Combobox.Empty>
              No matching options - press Enter to use this value
            </Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

export function RestockingTab() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detailModalOpened, setDetailModalOpened] = useState(false);

  const [restockQueue, setRestockQueue] = useState<RestockQueueItem[]>([]);

  const [batchCompany, setBatchCompany] = useState("");
  const [batchSupplierReference, setBatchSupplierReference] = useState("");
  const [batchReceiveDate, setBatchReceiveDate] = useState<Date>(new Date());
  const [batchNotes, setBatchNotes] = useState("");

  const debouncedSearchQuery = "";

  const user = useSelector(selectUser);
  const createRestockBatchMutation = useCreateRestockBatch();
  const { data: companyNames } = useRestockBatchCompanies();

  const { data: selectedProductResponse, isLoading: productDetailLoading } =
    useProduct(selectedItemId || "");

  const selectedProduct =
    (selectedProductResponse as any)?.data || selectedProductResponse;

  const productFilters: Omit<ProductFilters, "page"> = useMemo(
    () => ({
      searchTerm: debouncedSearchQuery || undefined,
      pageSize: 50,
    }),
    [debouncedSearchQuery],
  );

  const {
    data: infiniteProductData,
    isLoading: productsLoading,
    fetchNextPage: fetchNextProductPage,
    hasNextPage: hasNextProductPage,
    isFetchingNextPage: isFetchingNextProductPage,
  } = useInfiniteProductsForRestock(productFilters);

  const restockProducts =
    infiniteProductData?.pages?.flatMap((page) => page.data) || [];

  const addToRestockQueue = useCallback((item: Product) => {
    const queueId = `Product_${item.id}_${Date.now()}`;

    const restockItem: RestockQueueItem = {
      id: queueId,
      itemType: "Product",
      originalItem: item,
      quantity: 0,
      retailPrice: item.retailPrice,
      wholesalePrice: item.wholesalePrice,
      expirationDate: item.expirationDate,
      supplierBatchNumber: item.batchNumber,
      notes: null,
      hasFieldChanges: false,
      shouldCreateNew: false,
    };

    setRestockQueue((prev) => {
      const existsIndex = prev.findIndex(
        (qItem) => qItem.originalItem.id === item.id,
      );

      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = {
          ...updated[existsIndex],
          originalItem: item,
        };
        return updated;
      } else {
        return [...prev, restockItem];
      }
    });
  }, []);

  const removeFromRestockQueue = useCallback((queueId: string) => {
    setRestockQueue((prev) => prev.filter((item) => item.id !== queueId));
  }, []);

  const updateRestockQueueItem = useCallback(
    (queueId: string, updates: Partial<RestockQueueItem>) => {
      setRestockQueue((prev) =>
        prev.map((item) => {
          if (item.id !== queueId) return item;

          const updated = { ...item, ...updates };

          const originalItem = item.originalItem;
          const hasNonQuantityChanges =
            updated.expirationDate !== originalItem.expirationDate ||
            updated.retailPrice !== (originalItem as any).retailPrice ||
            updated.wholesalePrice !== (originalItem as any).wholesalePrice ||
            updated.supplierBatchNumber !== (originalItem as any).batchNumber ||
            updated.notes !== null;

          updated.hasFieldChanges = hasNonQuantityChanges;
          updated.shouldCreateNew = hasNonQuantityChanges;

          return updated;
        }),
      );
    },
    [],
  );

  const handleCreateRestockBatch = useCallback(async () => {
    if (!user) {
      notifications.show({
        title: "Error",
        message: "User not authenticated",
        color: "red",
      });
      return;
    }

    if (!batchCompany.trim()) {
      notifications.show({
        title: "Error",
        message: "Please enter supplier/company name",
        color: "red",
      });
      return;
    }

    if (restockQueue.length === 0) {
      notifications.show({
        title: "Error",
        message: "Please add items to restock queue",
        color: "red",
      });
      return;
    }

    const invalidItems = restockQueue.filter((item) => item.quantity <= 0);
    if (invalidItems.length > 0) {
      notifications.show({
        title: "Error",
        message: "All items must have quantity greater than 0",
        color: "red",
      });
      return;
    }

    try {
      const batchRequest = {
        receiveDate: batchReceiveDate.toISOString(),
        receivedBy: user.profile.fullName,
        company: batchCompany,
        supplierReference: batchSupplierReference || null,
        notes: batchNotes || null,
        items: restockQueue.map((item) => ({
          itemType: "Product" as const,
          productId: !item.shouldCreateNew ? item.originalItem.id : null,
          ...(item.shouldCreateNew && {
            generic: (item.originalItem as Product).generic || undefined,
            brand: (item.originalItem as Product).brand,
            barcode: (item.originalItem as Product).barcode || undefined,
            type: (item.originalItem as Product).type || undefined,
            formulation:
              (item.originalItem as Product).formulation || undefined,
            category: (item.originalItem as Product).category || undefined,
            location: (item.originalItem as Product).location || undefined,
            minimumStock: (item.originalItem as Product).minimumStock,
            isDiscountable: (item.originalItem as Product).isDiscountable,
          }),
          quantity: item.quantity,
          wholesalePrice: item.wholesalePrice,
          retailPrice: item.retailPrice,
          expirationDate: item.expirationDate,
          supplierBatchNumber: item.supplierBatchNumber,
          notes: item.notes,
        })),
      };

      await createRestockBatchMutation.mutateAsync(batchRequest);

      notifications.show({
        title: "Success",
        message: "Restock batch created successfully",
        color: "green",
      });

      setBatchCompany("");
      setBatchSupplierReference("");
      setBatchReceiveDate(new Date());
      setBatchNotes("");
      setRestockQueue([]);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.message || "Failed to create restock batch",
        color: "red",
      });
    }
  }, [
    user,
    batchCompany,
    batchSupplierReference,
    batchReceiveDate,
    batchNotes,
    restockQueue,
    createRestockBatchMutation,
  ]);

  const getStockColor = (item: Product) => {
    if (item.quantity === 0) return "red";
    if (item.isLowStock) return "orange";
    return "green";
  };

  const handleRowClick = useCallback((item: Product) => {
    setSelectedItemId(item.id);
    setDetailModalOpened(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpened(false);
    setTimeout(() => {
      setSelectedItemId(null);
    }, 200);
  }, []);

  const restockProductColumns: DataTableColumn<Product>[] = useMemo(
    () => [
      {
        key: "generic",
        title: "Product",
        width: 200,
        sortable: true,
        sortKey: "brand",
        render: (item: Product) => (
          <div>
            <Text size="sm" fw={500}>
              {item.brand}
            </Text>
            <Text size="xs" c="dimmed">
              {item.generic}
            </Text>
          </div>
        ),
      },
      {
        key: "stock",
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
        key: "price",
        title: "Price",
        width: 90,
        align: "right",
        headerAlign: "right",
        sortable: true,
        sortKey: "retailPrice",
        render: (item: Product) => (
          <Text size="xs" fw={500}>
            ₱{item.retailPrice.toFixed(2)}
          </Text>
        ),
      },
      {
        key: "actions",
        title: "",
        width: 80,
        align: "center",
        headerAlign: "center",
        render: (item: Product) => (
          <Button
            size="xs"
            variant="light"
            onClick={(e) => {
              e.stopPropagation();
              addToRestockQueue(item);
            }}
          >
            Add
          </Button>
        ),
      },
    ],
    [getStockColor, addToRestockQueue],
  );

  const restockQueueColumns: DataTableColumn<RestockQueueItem>[] = useMemo(
    () => [
      {
        key: "item",
        title: "Item",
        width: 200,
        render: (item: RestockQueueItem) => (
          <div>
            <Text size="sm" fw={500}>
              {(item.originalItem as Product).brand}
            </Text>
            <Text size="xs" c="dimmed">
              {(item.originalItem as Product).generic}
            </Text>
            <Badge
              size="xs"
              color={item.shouldCreateNew ? "blue" : "gray"}
              variant="light"
            >
              {item.shouldCreateNew ? "New Item" : "Add to Existing"}
            </Badge>
          </div>
        ),
      },
      {
        key: "quantity",
        title: "Quantity",
        width: 100,
        align: "center",
        headerAlign: "center",
        render: (item: RestockQueueItem) => (
          <NumberInput
            size="xs"
            value={item.quantity}
            onChange={(value) =>
              updateRestockQueueItem(item.id, { quantity: Number(value) || 0 })
            }
            min={0}
            step={1}
            styles={{ input: { textAlign: "center" } }}
          />
        ),
      },
      {
        key: "retailPrice",
        title: "Retail Price",
        width: 110,
        align: "center",
        headerAlign: "center",
        render: (item: RestockQueueItem) => (
          <NumberInput
            size="xs"
            value={item.retailPrice}
            onChange={(value) =>
              updateRestockQueueItem(item.id, {
                retailPrice: Number(value) || 0,
              })
            }
            min={0}
            step={0.01}
            decimalScale={2}
            fixedDecimalScale
            prefix="₱"
          />
        ),
      },
      {
        key: "wholesalePrice",
        title: "Wholesale Price",
        width: 120,
        align: "center",
        headerAlign: "center",
        render: (item: RestockQueueItem) => (
          <NumberInput
            size="xs"
            value={item.wholesalePrice}
            onChange={(value) =>
              updateRestockQueueItem(item.id, {
                wholesalePrice: Number(value) || 0,
              })
            }
            min={0}
            step={0.01}
            decimalScale={2}
            fixedDecimalScale
            prefix="₱"
          />
        ),
      },
      {
        key: "expirationDate",
        title: "Expiry Date",
        width: 130,
        align: "center",
        headerAlign: "center",
        render: (item: RestockQueueItem) => (
          <DateInput
            size="xs"
            value={item.expirationDate ? new Date(item.expirationDate) : null}
            onChange={(date) => {
              if (date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                updateRestockQueueItem(item.id, {
                  expirationDate: `${year}-${month}-${day}`,
                });
              } else {
                updateRestockQueueItem(item.id, {
                  expirationDate: null,
                });
              }
            }}
            placeholder="No expiry"
            clearable
          />
        ),
      },

      {
        key: "actions",
        title: "",
        width: 60,
        align: "center",
        headerAlign: "center",
        render: (item: RestockQueueItem) => (
          <ActionIcon
            size="sm"
            color="red"
            variant="subtle"
            onClick={() => removeFromRestockQueue(item.id)}
            title="Remove from queue"
          >
            <IconTrash size={16} />
          </ActionIcon>
        ),
      },
    ],
    [updateRestockQueueItem, removeFromRestockQueue],
  );

  return (
    <div
      style={{
        height: "calc(100vh - 120px)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr",
        gap: "0.5rem",
        padding: "0.25rem",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateRows: "auto 1fr",
          gap: "0.5rem",
          overflow: "hidden",
        }}
      >
        <div>
          <Text size="md" fw={600} mb={4}>
            Items to Restock
          </Text>
        </div>

        <Paper
          p="xs"
          withBorder
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <Text size="sm" fw={500} mb={4}>
            Products ({restockProducts.length})
          </Text>
          <div style={{ flex: 1, minHeight: 0 }}>
            <DataTable
              data={restockProducts}
              columns={restockProductColumns}
              loading={productsLoading || isFetchingNextProductPage}
              hasMore={hasNextProductPage}
              onLoadMore={fetchNextProductPage}
              emptyMessage="No products found"
              stickyHeader
              horizontalScroll
              minWidth="480px"
              height="100%"
              onRowClick={(item) => handleRowClick(item)}
            />
          </div>
        </Paper>
      </div>

      <Paper
        p="xs"
        withBorder
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          height: "100%",
        }}
      >
        <Group justify="space-between" mb={4}>
          <Text size="md" fw={600}>
            Restock Queue ({restockQueue.length})
          </Text>
          {restockQueue.length > 0 && (
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={() => setRestockQueue([])}
            >
              Clear All
            </Button>
          )}
        </Group>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            marginBottom: "0.5rem",
          }}
        >
          {restockQueue.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                border: "2px dashed var(--mantine-color-gray-3)",
                height: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "1rem",
              }}
            >
              <Text c="dimmed" size="sm">
                No items in restock queue
              </Text>
              <Text c="dimmed" size="xs" mt={4}>
                Click "Add" to add items
              </Text>
            </div>
          ) : (
            <DataTable
              data={restockQueue}
              columns={restockQueueColumns}
              loading={false}
              emptyMessage="No items in restock queue"
              stickyHeader
              horizontalScroll
              minWidth="650px"
              height="100%"
            />
          )}
        </div>

        <Divider my="xs" />

        <Text size="md" fw={600} mb="xs">
          Create Restock Batch
        </Text>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <Paper
            p="xs"
            style={{
              backgroundColor: "var(--mantine-color-gray-0)",
            }}
          >
            <Text size="sm" fw={500} mb={8}>
              Batch Information
            </Text>

            <div style={{ marginBottom: "8px" }}>
              <CustomSelect
                label="Supplier/Company"
                placeholder="Enter or select supplier name"
                value={batchCompany}
                onChange={setBatchCompany}
                data={companyNames || []}
                required
                size="sm"
              />
            </div>

            <TextInput
              label="Supplier Reference/Invoice #"
              placeholder="Enter invoice or PO number"
              value={batchSupplierReference}
              onChange={(event) =>
                setBatchSupplierReference(event.currentTarget.value)
              }
              mb={8}
              size="sm"
            />

            <DateInput
              label="Receive Date"
              value={batchReceiveDate}
              onChange={(date) => setBatchReceiveDate(date || new Date())}
              mb={8}
              required
              size="sm"
            />

            <Text size="xs" fw={500} mb={4}>
              Received By: {user?.profile?.fullName || "Current User"}
            </Text>

            <TextInput
              label="Notes (optional)"
              placeholder="Delivery condition, special notes..."
              value={batchNotes}
              onChange={(event) => setBatchNotes(event.currentTarget.value)}
              size="sm"
            />
          </Paper>

          <Button
            onClick={handleCreateRestockBatch}
            disabled={
              restockQueue.length === 0 ||
              !batchCompany.trim() ||
              createRestockBatchMutation.isPending
            }
            loading={createRestockBatchMutation.isPending}
            fullWidth
          >
            Create Batch
          </Button>
        </div>
      </Paper>

      {}
      <Modal
        opened={detailModalOpened}
        onClose={handleCloseDetailModal}
        title={
          <Group gap="xs">
            <IconPackage size={20} />
            <Text size="lg" fw={600}>
              Product Details
            </Text>
          </Group>
        }
        size="lg"
      >
        {productDetailLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : selectedProduct ? (
          <Stack gap="md">
            <Paper withBorder p="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Brand Name
                  </Text>
                  <Text size="sm" fw={500}>
                    {selectedProduct.brand}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Generic Name
                  </Text>
                  <Text size="sm" fw={500}>
                    {selectedProduct.generic}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Formulation
                  </Text>
                  <Badge>{selectedProduct.formulation}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Category
                  </Text>
                  <Badge variant="outline">{selectedProduct.category}</Badge>
                </Group>
              </Stack>
            </Paper>

            <Paper withBorder p="md">
              <Text size="sm" fw={600} mb="sm">
                Stock Information
              </Text>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconAlertCircle size={16} />
                    <Text size="sm" c="dimmed">
                      Current Stock
                    </Text>
                  </Group>
                  <Badge
                    size="lg"
                    color={
                      selectedProduct.quantity === 0
                        ? "red"
                        : selectedProduct.isLowStock
                          ? "orange"
                          : "green"
                    }
                  >
                    {selectedProduct.quantity}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Minimum Stock
                  </Text>
                  <Text size="sm" fw={500}>
                    {selectedProduct.minimumStock}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Stock Status
                  </Text>
                  <Badge
                    color={
                      selectedProduct.quantity === 0
                        ? "red"
                        : selectedProduct.isLowStock
                          ? "orange"
                          : "green"
                    }
                  >
                    {selectedProduct.quantity === 0
                      ? "Out of Stock"
                      : selectedProduct.isLowStock
                        ? "Low Stock"
                        : "In Stock"}
                  </Badge>
                </Group>
              </Stack>
            </Paper>

            <Paper withBorder p="md">
              <Text size="sm" fw={600} mb="sm">
                Pricing
              </Text>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconCurrencyPeso size={16} />
                    <Text size="sm" c="dimmed">
                      Retail Price
                    </Text>
                  </Group>
                  <Text size="sm" fw={600} c="green">
                    {formatCurrency(selectedProduct.retailPrice)}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Wholesale Price
                  </Text>
                  <Text size="sm" fw={500}>
                    {formatCurrency(selectedProduct.wholesalePrice)}
                  </Text>
                </Group>
              </Stack>
            </Paper>

            <Paper withBorder p="md">
              <Text size="sm" fw={600} mb="sm">
                Additional Information
              </Text>
              <Stack gap="sm">
                {selectedProduct.barcode && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Barcode
                    </Text>
                    <Text size="xs" ff="monospace">
                      {selectedProduct.barcode}
                    </Text>
                  </Group>
                )}
                {selectedProduct.location && (
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconMapPin size={16} />
                      <Text size="sm" c="dimmed">
                        Location
                      </Text>
                    </Group>
                    <Badge variant="light">{selectedProduct.location}</Badge>
                  </Group>
                )}
                {selectedProduct.expirationDate && (
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconCalendar size={16} />
                      <Text size="sm" c="dimmed">
                        Expiration Date
                      </Text>
                    </Group>
                    <Text size="sm">
                      {new Date(
                        selectedProduct.expirationDate,
                      ).toLocaleDateString()}
                    </Text>
                  </Group>
                )}
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Discountable
                  </Text>
                  <Badge
                    color={selectedProduct.isDiscountable ? "green" : "gray"}
                  >
                    {selectedProduct.isDiscountable ? "Yes" : "No"}
                  </Badge>
                </Group>
              </Stack>
            </Paper>

            <Button
              fullWidth
              onClick={() => {
                addToRestockQueue(selectedProduct);
                handleCloseDetailModal();
              }}
            >
              Add to Restock Queue
            </Button>
          </Stack>
        ) : (
          <Center py="xl">
            <Text c="dimmed">No details available</Text>
          </Center>
        )}
      </Modal>
    </div>
  );
}
