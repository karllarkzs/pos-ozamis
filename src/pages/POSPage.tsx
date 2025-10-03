import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";
import {
  TextInput,
  Select,
  Combobox,
  useCombobox,
  Checkbox,
  Text,
  Button,
  Paper,
  Stack,
  Group,
  NumberInput,
  Divider,
  ActionIcon,
  Badge,
  Modal,
  Menu,
  Avatar,
  UnstyledButton,
  Title,
  Alert,
} from "@mantine/core";
import {
  IconSearch,
  IconPlus,
  IconCash,
  IconTrash,
  IconClock,
  IconUser,
  IconLogout,
  IconChevronDown,
  IconTrashX,
  IconSettings,
  IconChartBar,
  IconReceipt,
} from "@tabler/icons-react";
import { DataTable, DataTableColumn } from "../components/DataTable";
import { POSLayout } from "../components/POSLayout";
import {
  useInfiniteCatalog,
  useProcessTransaction,
  convertCatalogItemToCartItem,
  useProductsReferenceData,
} from "../hooks/api";
import type { CatalogItem } from "../hooks/api";
import { useAuth, useCart } from "../store/hooks";
import { logout, getRoleName } from "../store/slices/authSlice";
import { PaymentModal } from "../components/PaymentModal";
import { TransactionListModal } from "../components/TransactionListModal";
import { formatCurrency } from "../utils/currency";

export function POSPage() {
  const { user, dispatch } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [productType, setProductType] = useState<string | null>(null);
  const [formulation, setFormulation] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [itemTypeFilter, setItemTypeFilter] = useState<string>("All");
  const [stockFilter, setStockFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<
    | "name"
    | "formulation"
    | "price"
    | "quantity"
    | "category"
    | "location"
    | "itemtype"
  >("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentTime, setCurrentTime] = useState(new Date());

  
  const productTypeCombobox = useCombobox();
  const formulationCombobox = useCombobox();
  const categoryCombobox = useCombobox();
  const locationCombobox = useCombobox();

  
  const [productTypeSearch, setProductTypeSearch] = useState("");
  const [formulationSearch, setFormulationSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");

  const [quantityModalOpened, setQuantityModalOpened] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(
    null
  );
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);

  const [paymentModalOpened, setPaymentModalOpened] = useState(false);
  const [transactionListModalOpened, setTransactionListModalOpened] =
    useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const referenceData = useProductsReferenceData();

  const showReferenceDataError = referenceData.hasAnyError;

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const catalogFilters = useMemo(
    () => ({
      search: debouncedSearchQuery || undefined,
      itemType:
        itemTypeFilter === "Products"
          ? ("Product" as const)
          : itemTypeFilter === "Tests"
          ? ("Test" as const)
          : undefined,
      productType: productType || undefined,
      formulation: formulation || undefined,
      category: category || undefined,
      location: location || undefined,
      isLowStock: stockFilter === "Low Stock" ? true : undefined,
      isNoStock: stockFilter === "No Stock" ? true : undefined,
      sortBy: sortBy,
      sortDirection: sortDirection,
      pageSize: 20,
    }),
    [
      debouncedSearchQuery,
      productType,
      formulation,
      category,
      location,
      itemTypeFilter,
      stockFilter,
      sortBy,
      sortDirection,
    ]
  );

  const {
    data: infiniteData,
    isLoading: loading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteCatalog(catalogFilters);

  const { processTransaction, isPending: isProcessing } =
    useProcessTransaction();

  const showCatalogError = !!error;

  const filteredProducts =
    infiniteData?.pages?.flatMap((page) => page.data) || [];
  const totalCount = infiniteData?.pages?.[0]?.totalCount || 0;

  const openQuantityModal = (catalogItem: CatalogItem) => {
    const currentCartQuantity = cart.getItemQuantity(catalogItem.id);
    const maxQuantity = catalogItem.quantity - currentCartQuantity;

    setSelectedProduct(catalogItem);
    setQuantityToAdd(maxQuantity > 0 ? 1 : 0);
    setQuantityModalOpened(true);
  };

  const addToCartWithQuantity = () => {
    if (!selectedProduct || quantityToAdd <= 0) return;

    const cartItem = convertCatalogItemToCartItem(
      selectedProduct,
      quantityToAdd
    );
    cart.addItem(cartItem);

    setQuantityModalOpened(false);
    setSelectedProduct(null);
    setQuantityToAdd(1);
  };

  const getMaxQuantityForProduct = (productId: string): number => {
    const catalogItem = filteredProducts.find((p) => p.id === productId);
    const currentCartQuantity = cart.getItemQuantity(productId);
    return catalogItem ? catalogItem.quantity - currentCartQuantity : 0;
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    const catalogItem = filteredProducts.find((p) => p.id === id);
    const cartItem = cart.items.find((item) => item.id === id);

    const maxStock = catalogItem
      ? catalogItem.quantity
      : cartItem?.maxStock || quantity;

    cart.updateQuantity({
      id,
      quantity,
      maxStock,
    });
  };

  const removeFromCart = (id: string) => {
    cart.removeItem(id);
  };

  const hasStockIssues = useMemo(() => {
    return cart.items.some((cartItem) => {
      const catalogItem = filteredProducts.find((p) => p.id === cartItem.id);

      return !catalogItem || cartItem.quantity > catalogItem.quantity;
    });
  }, [cart.items, filteredProducts]);

  const handleConfirmTransaction = useCallback(() => {
    if (!user || cart.isEmpty || hasStockIssues) return;
    setPaymentModalOpened(true);
  }, [user, cart, hasStockIssues]);

  const handlePaymentConfirm = useCallback(
    async (paymentData: {
      paymentMethod: "Cash" | "GCash";
      gcashReference?: string;
      cashInHand?: number;
    }) => {
      if (!user || cart.isEmpty) return;

      try {
        const enhancedCartItems = cart.items.map((cartItem) => {
          const catalogItem = filteredProducts.find(
            (p) => p.id === cartItem.id
          );
          return {
            ...cartItem,
            itemType: catalogItem?.itemType || "Product",
            isDiscountable: catalogItem?.isDiscountable || true,
          };
        });

        const transaction = await processTransaction(enhancedCartItems, {
          paymentMethod: paymentData.paymentMethod,
          gcashReference: paymentData.gcashReference,
          cashInHand: paymentData.cashInHand,
          regularDiscount: cart.discountAmounts.regularDiscountAmount,
          specialDiscount: cart.discountAmounts.specialDiscountAmount,
          subtotal: cart.subtotal,
          vat: cart.vat,
          total: cart.total,
        });

        alert(
          `✅ Transaction Completed!\n` +
            `Receipt: ${transaction.receiptNumber}\n` +
            `Total: ${formatCurrency(transaction.totalAmount)}\n` +
            `Payment: ${transaction.paymentMethod}` +
            (transaction.changeAmount
              ? `\nChange: ${formatCurrency(transaction.changeAmount)}`
              : "")
        );

        cart.clear();
        setPaymentModalOpened(false);

        await refetch();
      } catch (error: any) {
        console.error("Transaction failed:", error);
        throw error;
      }
    },
    [user, cart, filteredProducts, processTransaction, refetch]
  );

  
  const getStockColor = (item: CatalogItem) => {
    if (item.quantity === 0) return "red"; 
    if (item.isLow) return "yellow"; 
    return "green"; 
  };

  const productColumns: DataTableColumn<CatalogItem>[] = [
    {
      key: "name",
      title: "Name",
      width: 150,
      sortable: true,
      sortKey: "name",
      render: (item) => (
        <Text size="sm" style={{ lineHeight: 1.2, wordBreak: "break-word" }}>
          {item.name}
          {item.itemType === "Test" && (
            <Badge size="xs" color="blue" ml={4}>
              Test
            </Badge>
          )}
        </Text>
      ),
    },
    {
      key: "formulation",
      title: "Formulation",
      width: 65,
      sortable: true,
      sortKey: "formulation",
      render: (item) => (
        <Text size="xs" style={{ lineHeight: 1.2, wordBreak: "break-word" }}>
          {item.formulation || "-"}
        </Text>
      ),
    },
    {
      key: "category",
      title: "Category",
      width: 105,
      sortable: true,
      sortKey: "category",
      render: (item) => (
        <Text size="xs" style={{ lineHeight: 1.2, wordBreak: "break-word" }}>
          {item.category}
        </Text>
      ),
    },
    {
      key: "quantity",
      title: "Stock",
      width: 48,
      sortable: true,
      sortKey: "quantity",
      align: "center",
      headerAlign: "center",
      render: (item) => (
        <Badge color={getStockColor(item)} variant="filled" size="xs">
          {item.quantity}
        </Badge>
      ),
    },
    {
      key: "location",
      title: "Loc",
      width: 48,
      sortable: true,
      sortKey: "location",
      render: (item) => (
        <Text size="xs" style={{ lineHeight: 1.2 }}>
          {item.location || "-"}
        </Text>
      ),
    },
    {
      key: "price",
      title: "Price",
      width: 68,
      sortable: true,
      sortKey: "price",
      align: "right",
      headerAlign: "right",
      render: (item) => (
        <Text size="sm" fw={500} style={{ lineHeight: 1.2 }}>
          {formatCurrency(item.price)}
        </Text>
      ),
    },
    {
      key: "action",
      title: "",
      width: 62,
      align: "center",
      render: (item) => (
        <Button
          size="xs"
          leftSection={<IconPlus size={10} />}
          onClick={() => openQuantityModal(item)}
          disabled={getMaxQuantityForProduct(item.id) === 0}
        >
          Add
        </Button>
      ),
    },
  ];

  const cartColumns: DataTableColumn<(typeof cart.items)[0]>[] = [
    {
      key: "name",
      title: "Name",
      width: 140,
      render: (item) => (
        <Text size="sm" style={{ lineHeight: 1.2, wordBreak: "break-word" }}>
          {item.name}
        </Text>
      ),
    },
    {
      key: "quantity",
      title: "Qty",
      width: 75,
      render: (item) => (
        <TextInput
          value={item.quantity.toString()}
          onChange={(e) => {
            const inputValue = e.currentTarget.value;

            if (inputValue === "") {
              return;
            }

            const numValue = parseInt(inputValue, 10);

            if (!isNaN(numValue) && numValue >= 1) {
              updateCartQuantity(item.id, numValue);
            }
          }}
          onBlur={(e) => {
            const inputValue = e.currentTarget.value.trim();
            const numValue = parseInt(inputValue, 10);

            if (inputValue === "" || isNaN(numValue) || numValue < 1) {
              updateCartQuantity(item.id, 1);
            } else {
              updateCartQuantity(item.id, numValue);
            }
          }}
          onFocus={(e) => {
            e.currentTarget.select();
          }}
          size="xs"
          w={55}
          styles={{ input: { textAlign: "center" } }}
          error={(() => {
            const catalogItem = filteredProducts.find((p) => p.id === item.id);

            if (catalogItem && item.quantity > catalogItem.quantity) {
              return "Exceeds stock";
            }

            return null;
          })()}
        />
      ),
    },
    {
      key: "price",
      title: "Price",
      width: 75,
      align: "right",
      headerAlign: "right",
      render: (item) => (
        <Text size="sm" fw={500} style={{ lineHeight: 1.2 }}>
          {formatCurrency(item.price * item.quantity)}
        </Text>
      ),
    },
    {
      key: "action",
      title: "",
      width: 38,
      align: "center",
      render: (item) => (
        <ActionIcon
          color="red"
          variant="subtle"
          size="sm"
          onClick={() => removeFromCart(item.id)}
        >
          <IconTrash size={12} />
        </ActionIcon>
      ),
    },
  ];

  const headerSection = useMemo(
    () => (
      <Paper p="sm" shadow="sm" radius="md" withBorder>
        <Group justify="space-between">
          <Group>
            <Title order={3}>OCT POS</Title>
            <Badge color="blue" variant="light">
              {typeof window !== "undefined" && window.__TAURI__
                ? "Tauri"
                : "Browser"}
            </Badge>
            <Button
              variant="light"
              size="xs"
              leftSection={<IconChartBar size={14} />}
              onClick={() => navigate("/admin/dashboard")}
            >
              Dashboard
            </Button>
            <Button
              variant="light"
              size="xs"
              leftSection={<IconSettings size={14} />}
              onClick={() => navigate("/admin")}
            >
              Admin
            </Button>
          </Group>
          <Group gap="md" align="center">
            <Group gap="xs">
              <IconClock size={16} />
              <Text size="sm" c="dimmed">
                {currentTime.toLocaleDateString()}
              </Text>
              <Text size="sm" c="dimmed">
                {currentTime.toLocaleTimeString()}
              </Text>
            </Group>

            <Divider orientation="vertical" />

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <Avatar size={32} color="blue">
                      <IconUser size={20} />
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        {user?.profile.firstName} {user?.profile.lastName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {user ? getRoleName(user.role) : ""}
                      </Text>
                    </div>
                    <IconChevronDown size={16} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Account</Menu.Label>
                <Menu.Item leftSection={<IconUser size={14} />}>
                  Profile
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  onClick={() => dispatch(logout())}
                  color="red"
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Paper>
    ),
    [currentTime, user, navigate, dispatch]
  );

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.currentTarget.value);
    },
    []
  );

  const handleProductTypeChange = useCallback((value: string | null) => {
    setProductType(value);
  }, []);

  const handleFormulationChange = useCallback((value: string | null) => {
    setFormulation(value);
  }, []);

  const handleCategoryChange = useCallback((value: string | null) => {
    setCategory(value);
  }, []);

  const handleLocationChange = useCallback((value: string | null) => {
    setLocation(value);
  }, []);

  const handleItemTypeFilterChange = useCallback((value: string | null) => {
    setItemTypeFilter(value || "All");
  }, []);

  const handleStockFilterChange = useCallback((value: string | null) => {
    setStockFilter(value || "All");
  }, []);

  const handleSort = useCallback(
    (newSortBy: string, newSortDirection: "asc" | "desc") => {
      const validSortKeys = [
        "name",
        "formulation",
        "price",
        "quantity",
        "category",
        "location",
        "itemtype",
      ] as const;
      if (validSortKeys.includes(newSortBy as any)) {
        setSortBy(newSortBy as (typeof validSortKeys)[number]);
        setSortDirection(newSortDirection);
      }
    },
    []
  );

  const filtersSection = useMemo(
    () => (
      <Paper p="sm" shadow="sm" radius="md" withBorder>
        {showReferenceDataError && (
          <Alert color="red" mb="sm" title="Error loading dropdown data">
            Failed to load dropdown options. Some filters may be unavailable.
          </Alert>
        )}
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: "0 0 300px" }}>
            <TextInput
              placeholder="Search by name..."
              value={searchQuery}
              onChange={handleSearchChange}
              leftSection={<IconSearch size={16} />}
            />
          </div>
          <div style={{ flex: "1", minWidth: "130px" }}>
            <Combobox
              store={productTypeCombobox}
              onOptionSubmit={(val) => {
                handleProductTypeChange(val);
                setProductTypeSearch("");
                productTypeCombobox.closeDropdown();
              }}
              disabled={referenceData.productTypes.isLoading}
            >
              <Combobox.Target>
                <TextInput
                  placeholder="Type product type..."
                  value={productTypeSearch || productType || ""}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    setProductTypeSearch(val);
                    if (val.trim() === "") {
                      handleProductTypeChange(null);
                    } else {
                      handleProductTypeChange(val);
                    }
                    productTypeCombobox.openDropdown();
                  }}
                  onFocus={() => {
                    setProductTypeSearch(productType || "");
                    productTypeCombobox.openDropdown();
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setProductTypeSearch("");
                      productTypeCombobox.closeDropdown();
                    }, 150);
                  }}
                  rightSection={<Combobox.Chevron />}
                />
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options>
                  {referenceData.productTypes.data
                    .filter((item) =>
                      item
                        .toLowerCase()
                        .includes(
                          (productTypeSearch || productType || "").toLowerCase()
                        )
                    )
                    .map((item) => (
                      <Combobox.Option value={item} key={item}>
                        {item}
                      </Combobox.Option>
                    ))}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          </div>
          <div style={{ flex: "1", minWidth: "130px" }}>
            <Combobox
              store={formulationCombobox}
              onOptionSubmit={(val) => {
                handleFormulationChange(val);
                setFormulationSearch("");
                formulationCombobox.closeDropdown();
              }}
              disabled={referenceData.formulations.isLoading}
            >
              <Combobox.Target>
                <TextInput
                  placeholder="Ex. Tablet, Capsule"
                  value={formulationSearch || formulation || ""}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    setFormulationSearch(val);
                    if (val.trim() === "") {
                      handleFormulationChange(null);
                    } else {
                      handleFormulationChange(val);
                    }
                    formulationCombobox.openDropdown();
                  }}
                  onFocus={() => {
                    setFormulationSearch(formulation || "");
                    formulationCombobox.openDropdown();
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setFormulationSearch("");
                      formulationCombobox.closeDropdown();
                    }, 150);
                  }}
                  rightSection={<Combobox.Chevron />}
                />
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options>
                  {referenceData.formulations.data
                    .filter((item) =>
                      item
                        .toLowerCase()
                        .includes(
                          (formulationSearch || formulation || "").toLowerCase()
                        )
                    )
                    .map((item) => (
                      <Combobox.Option value={item} key={item}>
                        {item}
                      </Combobox.Option>
                    ))}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          </div>
          <div style={{ flex: "1", minWidth: "120px" }}>
            <Combobox
              store={categoryCombobox}
              onOptionSubmit={(val) => {
                handleCategoryChange(val);
                setCategorySearch("");
                categoryCombobox.closeDropdown();
              }}
              disabled={referenceData.categories.isLoading}
            >
              <Combobox.Target>
                <TextInput
                  placeholder="Type category..."
                  value={categorySearch || category || ""}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    setCategorySearch(val);
                    if (val.trim() === "") {
                      handleCategoryChange(null);
                    } else {
                      handleCategoryChange(val);
                    }
                    categoryCombobox.openDropdown();
                  }}
                  onFocus={() => {
                    setCategorySearch(category || "");
                    categoryCombobox.openDropdown();
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setCategorySearch("");
                      categoryCombobox.closeDropdown();
                    }, 150);
                  }}
                  rightSection={<Combobox.Chevron />}
                />
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options>
                  {referenceData.categories.data
                    .filter((item) =>
                      item
                        .toLowerCase()
                        .includes(
                          (categorySearch || category || "").toLowerCase()
                        )
                    )
                    .map((item) => (
                      <Combobox.Option value={item} key={item}>
                        {item}
                      </Combobox.Option>
                    ))}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          </div>
          <div style={{ flex: "1", minWidth: "120px" }}>
            <Combobox
              store={locationCombobox}
              onOptionSubmit={(val) => {
                handleLocationChange(val);
                setLocationSearch("");
                locationCombobox.closeDropdown();
              }}
              disabled={referenceData.locations.isLoading}
            >
              <Combobox.Target>
                <TextInput
                  placeholder="Type location..."
                  value={locationSearch || location || ""}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    setLocationSearch(val);
                    if (val.trim() === "") {
                      handleLocationChange(null);
                    } else {
                      handleLocationChange(val);
                    }
                    locationCombobox.openDropdown();
                  }}
                  onFocus={() => {
                    setLocationSearch(location || "");
                    locationCombobox.openDropdown();
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setLocationSearch("");
                      locationCombobox.closeDropdown();
                    }, 150);
                  }}
                  rightSection={<Combobox.Chevron />}
                />
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options>
                  {referenceData.locations.data
                    .filter((item) =>
                      item
                        .toLowerCase()
                        .includes(
                          (locationSearch || location || "").toLowerCase()
                        )
                    )
                    .map((item) => (
                      <Combobox.Option value={item} key={item}>
                        {item}
                      </Combobox.Option>
                    ))}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          </div>

          <div style={{ flex: "0 0 120px" }}>
            <Select
              placeholder="Show Items"
              value={itemTypeFilter}
              onChange={handleItemTypeFilterChange}
              data={[
                { value: "All", label: "All Items" },
                { value: "Products", label: "Products Only" },
                { value: "Tests", label: "Tests Only" },
              ]}
              clearable={false}
            />
          </div>

          <div style={{ flex: "0 0 auto" }}>
            <Button
              variant="light"
              color="blue"
              leftSection={<IconReceipt size={18} />}
              onClick={() => setTransactionListModalOpened(true)}
            >
              Receipts
            </Button>
          </div>
        </div>
      </Paper>
    ),
    [
      searchQuery,
      productType,
      formulation,
      category,
      location,
      itemTypeFilter,
      stockFilter,
      referenceData,
      showReferenceDataError,
      handleSearchChange,
      handleProductTypeChange,
      handleFormulationChange,
      handleCategoryChange,
      handleLocationChange,
      handleItemTypeFilterChange,
      handleStockFilterChange,
    ]
  );

  const productCatalogSection = useMemo(
    () => (
      <Paper
        p="sm"
        shadow="sm"
        radius="md"
        withBorder
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        {showCatalogError && (
          <Alert color="red" mb="sm" title="Error loading catalog">
            {error?.message ||
              "Failed to load catalog items. Please try again."}
          </Alert>
        )}
        <Group justify="space-between" mb="sm">
          <Text size="lg" fw={600}>
            Items
          </Text>
          <Text size="sm" c="dimmed">
            Showing {filteredProducts.length} of {totalCount} items
            {hasNextPage && <span> (scroll for more)</span>}
            {isFetchingNextPage && <span> (loading...)</span>}
          </Text>
        </Group>
        <div style={{ flex: 1, minHeight: 0 }}>
          <DataTable
            data={filteredProducts}
            columns={productColumns}
            loading={loading || isFetchingNextPage}
            hasMore={hasNextPage}
            onLoadMore={fetchNextPage}
            stickyHeader
            height="100%"
            horizontalScroll={false}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            emptyMessage={
              loading && filteredProducts.length === 0
                ? "Loading items..."
                : "No items found. Try adjusting your search or filters."
            }
          />
        </div>
      </Paper>
    ),
    [
      showCatalogError,
      error,
      filteredProducts,
      totalCount,
      hasNextPage,
      isFetchingNextPage,
      loading,
      fetchNextPage,
      productColumns,
      sortBy,
      sortDirection,
      handleSort,
    ]
  );

  const cartSection = useMemo(
    () => (
      <Paper
        p="sm"
        shadow="sm"
        radius="md"
        withBorder
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Group justify="space-between" align="center" mb="sm">
          <Text size="lg" fw={600}>
            Cart
          </Text>
          <Text size="sm" c="dimmed">
            {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
          </Text>
          <Button
            variant="light"
            color="red"
            size="xs"
            leftSection={<IconTrashX size={14} />}
            onClick={() => cart.clear()}
            disabled={cart.isEmpty}
          >
            Clear
          </Button>
        </Group>
        <div style={{ flex: 1, minHeight: 0 }}>
          <DataTable
            stickyHeader
            data={cart.items}
            columns={cartColumns}
            height="100%"
            emptyMessage="Cart is empty"
          />
        </div>
      </Paper>
    ),
    [cart.items, cart.isEmpty, cart.clear, cartColumns]
  );

  const transactionSummarySection = useMemo(
    () => (
      <Paper p="sm" shadow="sm" radius="md" withBorder>
        <Text size="md" fw={600} mb="xs">
          Transaction Summary
        </Text>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm">Subtotal:</Text>
            <Text size="sm">{formatCurrency(cart.subtotal)}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">VAT (12%):</Text>
            <Text size="sm">{formatCurrency(cart.vat)}</Text>
          </Group>
          <Group justify="space-between" align="center">
            <Checkbox
              label="Discounted (10%)"
              checked={cart.discount.isRegularDiscounted}
              onChange={(e) =>
                cart.setDiscount({
                  isRegularDiscounted: e.currentTarget.checked,
                })
              }
              size="sm"
            />
            <Text size="sm" c="dimmed">
              -{formatCurrency(cart.discountAmounts.regularDiscountAmount)}
            </Text>
          </Group>
          <Group justify="space-between" align="center" gap="xs">
            <Group gap="xs" align="center">
              <Text size="sm">Special Discount (₱):</Text>
              <NumberInput
                value={cart.discount.specialDiscountAmount}
                onChange={(value) =>
                  cart.setDiscount({
                    specialDiscountAmount: Number(value) || 0,
                  })
                }
                min={0}
                step={0.01}
                decimalScale={2}
                fixedDecimalScale
                placeholder="0.00"
                size="xs"
                style={{ width: 90 }}
              />
            </Group>
            <Text size="sm" c="dimmed">
              -{formatCurrency(cart.discountAmounts.specialDiscountAmount)}
            </Text>
          </Group>
          <Divider />
          <Group justify="space-between">
            <Text size="md" fw={700}>
              Total:
            </Text>
            <Text size="md" fw={700}>
              {formatCurrency(cart.total)}
            </Text>
          </Group>
          <Button
            fullWidth
            size="md"
            leftSection={<IconCash size={16} />}
            onClick={handleConfirmTransaction}
            disabled={cart.isEmpty || isProcessing || hasStockIssues}
            loading={isProcessing}
            mt="sm"
          >
            {isProcessing
              ? "Processing..."
              : hasStockIssues
              ? "Please recheck cart items"
              : "Confirm Transaction"}
          </Button>
        </Stack>
      </Paper>
    ),
    [
      cart.subtotal,
      cart.vat,
      cart.discount,
      cart.discountAmounts,
      cart.total,
      cart.isEmpty,
      cart.setDiscount,
      handleConfirmTransaction,
      hasStockIssues,
    ]
  );

  return (
    <>
      <POSLayout
        header={headerSection}
        filters={filtersSection}
        productCatalog={productCatalogSection}
        cart={cartSection}
        transactionSummary={transactionSummarySection}
      />

      <Modal
        opened={quantityModalOpened}
        onClose={() => setQuantityModalOpened(false)}
        title={selectedProduct ? `Add ${selectedProduct.name}` : "Add Item"}
        size="sm"
        centered
      >
        {selectedProduct && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Available Stock:
              </Text>
              <Badge color={selectedProduct.quantity > 10 ? "green" : "orange"}>
                {selectedProduct.quantity}
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Currently in Cart:
              </Text>
              <Text size="sm">{cart.getItemQuantity(selectedProduct.id)}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Max Available to Add:
              </Text>
              <Text size="sm" fw={600}>
                {getMaxQuantityForProduct(selectedProduct.id)}
              </Text>
            </Group>
            <NumberInput
              label="Quantity to Add"
              value={quantityToAdd}
              onChange={(value) => {
                const numValue = value === "" ? 0 : Number(value);
                setQuantityToAdd(numValue);
              }}
              min={1}
              max={getMaxQuantityForProduct(selectedProduct.id)}
              size="md"
              allowDecimal={false}
              clampBehavior="strict"
              hideControls
              description={`Enter quantity (max: ${getMaxQuantityForProduct(
                selectedProduct.id
              )})`}
            />{" "}
            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => setQuantityModalOpened(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={addToCartWithQuantity}
                disabled={
                  quantityToAdd <= 0 ||
                  quantityToAdd > getMaxQuantityForProduct(selectedProduct.id)
                }
                leftSection={<IconPlus size={16} />}
              >
                Add to Cart
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {}
      <PaymentModal
        isOpen={paymentModalOpened}
        onClose={() => setPaymentModalOpened(false)}
        onConfirm={handlePaymentConfirm}
        isProcessing={isProcessing}
        transactionSummary={{
          subtotal: cart.subtotal,
          regularDiscount: cart.discountAmounts.regularDiscountAmount,
          specialDiscount: cart.discountAmounts.specialDiscountAmount,
          vat: cart.vat,
          total: cart.total,
        }}
      />

      {}
      <TransactionListModal
        opened={transactionListModalOpened}
        onClose={() => setTransactionListModalOpened(false)}
      />
    </>
  );
}
