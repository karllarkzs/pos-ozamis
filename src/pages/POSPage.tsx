import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";
import { notifications } from "@mantine/notifications";
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
  Loader,
  CloseButton,
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
  IconReceipt,
  IconX,
  IconStar,
  IconCirclePercentage,
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
import { apiEndpoints } from "../lib/api";
import { useAuth, useCart, useSettings } from "../store/hooks";
import { logout, getRoleName, canAccessPOS } from "../store/slices/authSlice";
import { PaymentModal } from "../components/PaymentModal";
import { TransactionListModal } from "../components/TransactionListModal";
import { PrinterSettingsModal } from "../components/PrinterSettingsModal";
import { formatCurrency } from "../utils/currency";
import { generateReceiptESCPOS } from "../utils/escpos";
import { printEscposReceipt } from "../utils/tauri-api";

export function POSPage() {
  const { user, dispatch } = useAuth();
  const cart = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user && !canAccessPOS(user.role)) {
      window.location.href = "/forbidden";
    }
  }, [user]);

  if (!user || !canAccessPOS(user.role)) {
    return null;
  }
  const [productType, setProductType] = useState<string | null>(null);
  const [formulation, setFormulation] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [itemTypeFilter, setItemTypeFilter] = useState<string>("All");
  const [stockFilter, setStockFilter] = useState<string>("All");
  const [isPhilHealthOnly, setIsPhilHealthOnly] = useState<boolean>(false);
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
  const [isTauri, setIsTauri] = useState(false);
  const [discounts, setDiscounts] = useState<
    Array<{ id: string; discountName: string; percent: number }>
  >([]);

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
  const [printerSettingsModalOpened, setPrinterSettingsModalOpened] =
    useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tauri detection with polling
  useEffect(() => {
    let mounted = true;

    const checkTauri = async () => {
      if (!mounted) return;

      const inIframe = window.self !== window.top;
      const hasDirectTauri =
        typeof window !== "undefined" && !!window.__TAURI__;
      const hasAPI = typeof window !== "undefined" && !!window.electronAPI;

      const tauri = hasDirectTauri || (inIframe && hasAPI);

      if (tauri !== isTauri) setIsTauri(tauri);
    };

    checkTauri();

    const interval = setInterval(checkTauri, 100);
    const timeout = setTimeout(() => clearInterval(interval), 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isTauri]);

  // Auto-open printer settings if no default printer is configured
  useEffect(() => {
    if (isTauri) {
      const defaultPrinter = localStorage.getItem("defaultPrinter");
      if (!defaultPrinter) {
        setPrinterSettingsModalOpened(true);
      }
    }
  }, [isTauri]);

  // Fetch active discounts
  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await apiEndpoints.discounts.getActive();
        setDiscounts(response.data);
      } catch (error) {}
    };
    fetchDiscounts();
  }, []);

  const referenceData = useProductsReferenceData();

  const showReferenceDataError = referenceData.hasAnyError;

  // Show notification for reference data errors
  useEffect(() => {
    if (showReferenceDataError) {
      notifications.show({
        id: "reference-data-error",
        title: "Error loading dropdown data",
        message:
          "Failed to load dropdown options. Some filters may be unavailable.",
        color: "red",
        autoClose: 5000,
      });
    }
  }, [showReferenceDataError]);

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
      isPhilHealth: isPhilHealthOnly ? true : undefined,
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
      isPhilHealthOnly,
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

  // NEW
  const hasStockIssues = useMemo(() => {
    return cart.items.some(
      (cartItem) => cartItem.quantity > (cartItem.maxStock ?? Infinity)
    );
  }, [cart.items]);

  const handleConfirmTransaction = useCallback(() => {
    if (!user || cart.isEmpty || hasStockIssues) return;
    setPaymentModalOpened(true);
  }, [user, cart, hasStockIssues]);

  const handlePaymentConfirm = useCallback(
    async (paymentData: {
      paymentMethod: "Cash" | "GCash" | "Maya" | "GoTyme";
      referenceNumber?: string;
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
          referenceNumber: paymentData.referenceNumber,
          cashInHand: paymentData.cashInHand,
          seniorId: cart.discount.seniorId || undefined,
          regularDiscount: cart.discountAmounts.regularDiscountAmount,
          specialDiscount: cart.discountAmounts.specialDiscountAmount,
          subtotal: cart.subtotal,
          vat: cart.vat,
          total: cart.total,
        });

        // Automatically print receipt if printer is configured
        try {
          const defaultPrinter = localStorage.getItem("defaultPrinter");
          if (defaultPrinter && window.electronAPI) {
            const escposData = generateReceiptESCPOS(transaction, settings);
            await printEscposReceipt(defaultPrinter, Array.from(escposData));
            console.log("Receipt printed successfully");
          } else {
            console.log("No printer configured or not running in Tauri");
          }
        } catch (printError) {
          console.error("Failed to print receipt:", printError);
          // Don't fail the transaction if printing fails
        }

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
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {item.isDiscountable && (
            <IconCirclePercentage
              size={16}
              style={{
                color: "var(--mantine-color-green-6)",
                marginRight: 4,
                minWidth: "16px",
              }}
            />
          )}
          <Text
            size="sm"
            style={{
              lineHeight: 1.2,
              wordBreak: "break-word",
              justifyContent: "center",
            }}
          >
            {item.name}
            {item.itemType === "Test" && (
              <Badge size="xs" color="blue" ml={4}>
                Test
              </Badge>
            )}
          </Text>
        </div>
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
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {item.isDiscountable && (
            <IconCirclePercentage
              size={16}
              style={{
                color: "var(--mantine-color-green-6)",
                marginRight: 4,
                minWidth: "16px",
              }}
            />
          )}
          <Text size="sm" style={{ lineHeight: 1.2, wordBreak: "break-word" }}>
            {item.name}
          </Text>
        </div>
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
            <Title order={3}>{settings.storeName}</Title>
            <Badge color="blue" variant="light">
              {isTauri ? "Tauri" : "Browser"}
            </Badge>
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
                <Menu.Item
                  leftSection={<IconSettings size={14} />}
                  onClick={() => setPrinterSettingsModalOpened(true)}
                >
                  Printer Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  onClick={() => {
                    dispatch(logout());
                    navigate("/");
                  }}
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
    [currentTime, user, navigate, dispatch, isTauri, settings.storeName]
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
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: "0 0 300px" }}>
            <TextInput
              placeholder="Search by barcode or name..."
              value={searchQuery}
              onChange={handleSearchChange}
              leftSection={<IconSearch size={16} />}
              rightSection={
                searchQuery ? (
                  <CloseButton
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  />
                ) : null
              }
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
                  rightSection={
                    productType ? (
                      <CloseButton
                        size="sm"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleProductTypeChange(null);
                          setProductTypeSearch("");
                        }}
                        aria-label="Clear product type"
                      />
                    ) : (
                      <Combobox.Chevron />
                    )
                  }
                />
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options style={{ maxHeight: 200, overflowY: "auto" }}>
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
                  rightSection={
                    formulation ? (
                      <CloseButton
                        size="sm"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleFormulationChange(null);
                          setFormulationSearch("");
                        }}
                        aria-label="Clear formulation"
                      />
                    ) : (
                      <Combobox.Chevron />
                    )
                  }
                />
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options style={{ maxHeight: 200, overflowY: "auto" }}>
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
                  rightSection={
                    category ? (
                      <CloseButton
                        size="sm"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCategoryChange(null);
                          setCategorySearch("");
                        }}
                        aria-label="Clear category"
                      />
                    ) : (
                      <Combobox.Chevron />
                    )
                  }
                />
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options style={{ maxHeight: 200, overflowY: "auto" }}>
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
                  rightSection={
                    location ? (
                      <CloseButton
                        size="sm"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleLocationChange(null);
                          setLocationSearch("");
                        }}
                        aria-label="Clear location"
                      />
                    ) : (
                      <Combobox.Chevron />
                    )
                  }
                />
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options style={{ maxHeight: 200, overflowY: "auto" }}>
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
        <Group justify="space-between" mb="sm">
          <Group gap="md">
            <Text size="lg" fw={600}>
              Items
            </Text>
            <Checkbox
              label="PhilHealth only"
              checked={isPhilHealthOnly}
              onChange={(event) =>
                setIsPhilHealthOnly(event.currentTarget.checked)
              }
              size="sm"
            />
          </Group>
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
      isPhilHealthOnly,
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

  // Check if senior ID is required and missing
  const isSeniorIdMissing =
    cart.discount.discountName?.toLowerCase().includes("senior") &&
    !cart.discount.seniorId?.trim();

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
          {settings.showVat && cart.vat > 0 && (
            <Group justify="space-between">
              <Text size="sm">VAT ({settings.vatAmount}%):</Text>
              <Text size="sm">{formatCurrency(cart.vat)}</Text>
            </Group>
          )}
          <Stack gap="xs">
            <Group justify="space-between" align="center" gap="xs">
              <Select
                placeholder="Select discount"
                data={[
                  { value: "", label: "No Discount" },
                  ...discounts.map((d) => ({
                    value: d.id,
                    label: `${d.discountName} (${d.percent}%)`,
                  })),
                ]}
                value={cart.discount.discountId || ""}
                onChange={(value) => {
                  const selectedDiscount = discounts.find(
                    (d) => d.id === value
                  );
                  cart.setDiscount({
                    discountId: value || null,
                    discountPercent: selectedDiscount?.percent || 0,
                    discountName: selectedDiscount?.discountName || null,
                    seniorId: null, // Clear senior ID when discount changes
                  });
                }}
                size="xs"
                style={{ flex: 1 }}
                clearable
              />
              <Text
                size="sm"
                c="dimmed"
                style={{ minWidth: "70px", textAlign: "right" }}
              >
                -{formatCurrency(cart.discountAmounts.regularDiscountAmount)}
              </Text>
            </Group>
            {cart.discount.discountName?.toLowerCase().includes("senior") && (
              <TextInput
                placeholder="Enter Senior Citizen ID"
                value={cart.discount.seniorId || ""}
                onChange={(e) =>
                  cart.setDiscount({
                    seniorId: e.currentTarget.value,
                  })
                }
                size="xs"
                maxLength={50}
                required
                styles={{
                  input: {
                    borderColor: !cart.discount.seniorId
                      ? "var(--mantine-color-red-6)"
                      : undefined,
                  },
                }}
              />
            )}
          </Stack>
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
            disabled={
              cart.isEmpty ||
              isProcessing ||
              hasStockIssues ||
              isSeniorIdMissing
            }
            loading={isProcessing}
            mt="sm"
          >
            {isProcessing
              ? "Processing..."
              : hasStockIssues
              ? "Please recheck cart items"
              : isSeniorIdMissing
              ? "Enter Senior Citizen ID"
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
      isSeniorIdMissing,
      settings.showVat,
      settings.vatAmount,
      discounts,
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
          discountName: cart.discount.discountName,
          discountPercent: cart.discount.discountPercent,
        }}
      />

      {}
      <TransactionListModal
        opened={transactionListModalOpened}
        onClose={() => setTransactionListModalOpened(false)}
      />

      {}
      <PrinterSettingsModal
        opened={printerSettingsModalOpened}
        onClose={() => setPrinterSettingsModalOpened(false)}
      />
    </>
  );
}
