import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Group,
  TextInput,
  Select,
  Paper,
  Text,
  Badge,
  Tooltip,
  Button,
  Checkbox,
  NumberInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconTrash,
  IconSearch,
  IconAlertTriangle,
  IconClock,
  IconPlus,
  IconFlask,
  IconDroplet,
  IconPrinter,
} from "@tabler/icons-react";
import { DataTable, DataTableColumn } from "../DataTable";
import {
  useInfiniteReagents,
  useDeleteReagentsBatch,
} from "../../hooks/api/useReagents";
import { ReagentSummaryStats } from "../ReagentSummaryStats";
import { useDebounce } from "../../hooks/useDebounce";
import type { Reagent, ReagentFilters } from "../../lib/api";
import { formatCurrency } from "../../utils/currency";
import { EditReagentModal } from "../EditReagentModal";
import { PrintPreviewModal } from "../PrintPreviewModal";

interface ReagentsTabProps {
  onAddReagent: () => void;
  onBulkAddReagent?: () => void;
}

export function ReagentsTab({
  onAddReagent,
  onBulkAddReagent,
}: ReagentsTabProps) {
  
  const [reagentSearchQuery, setReagentSearchQuery] = useState("");
  const [reagentType, setReagentType] = useState<string | null>(null);
  const [batchNumber, setBatchNumber] = useState("");

  
  const [reagentIsLowStock, setReagentIsLowStock] = useState<boolean | null>(
    null
  );
  const [reagentIsExpired, setReagentIsExpired] = useState<boolean | null>(
    null
  );
  const [reagentIsExpiringSoon, setReagentIsExpiringSoon] = useState<
    boolean | null
  >(null);

  
  const [minUnitCost, setMinUnitCost] = useState<number | "">("");
  const [maxUnitCost, setMaxUnitCost] = useState<number | "">("");

  
  const [reagentSortBy, setReagentSortBy] = useState<string>("name");
  const [reagentSortDirection, setReagentSortDirection] = useState<
    "asc" | "desc"
  >("asc");
  const [selectedReagentIds, setSelectedReagentIds] = useState<Set<string>>(
    new Set()
  );

  
  const debouncedReagentSearchQuery = useDebounce(reagentSearchQuery, 300);
  const debouncedBatchNumber = useDebounce(batchNumber, 300);

  
  const reagentFilters: Omit<ReagentFilters, "page"> = useMemo(
    () => ({
      searchTerm: debouncedReagentSearchQuery || undefined,
      reagentType: reagentType as ReagentFilters["reagentType"],
      batchNumber: debouncedBatchNumber || undefined,
      isLowStock: reagentIsLowStock === null ? undefined : reagentIsLowStock,
      isExpired: reagentIsExpired === null ? undefined : reagentIsExpired,
      isExpiringSoon:
        reagentIsExpiringSoon === null ? undefined : reagentIsExpiringSoon,
      expiringSoonDays: reagentIsExpiringSoon ? 30 : undefined,
      minUnitCost: minUnitCost === "" ? undefined : Number(minUnitCost),
      maxUnitCost: maxUnitCost === "" ? undefined : Number(maxUnitCost),
      sortBy: reagentSortBy as ReagentFilters["sortBy"],
      sortDirection: reagentSortDirection,
      pageSize: 50,
    }),
    [
      debouncedReagentSearchQuery,
      reagentType,
      debouncedBatchNumber,
      reagentIsLowStock,
      reagentIsExpired,
      reagentIsExpiringSoon,
      minUnitCost,
      maxUnitCost,
      reagentSortBy,
      reagentSortDirection,
    ]
  );

  
  const {
    data: infiniteReagentData,
    isLoading: reagentsLoading,
    error: reagentsError,
    fetchNextPage: fetchNextReagentPage,
    hasNextPage: hasNextReagentPage,
    isFetchingNextPage: isFetchingNextReagentPage,
    refetch: refetchReagents,
  } = useInfiniteReagents(reagentFilters);

  
  const batchDeleteMutation = useDeleteReagentsBatch();

  
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [printModalOpened, setPrintModalOpened] = useState(false);
  const [reagentsToEdit, setReagentsToEdit] = useState<Reagent[]>([]);

  const reagents =
    infiniteReagentData?.pages?.flatMap((page) => page.data) || [];
  const totalReagentCount = infiniteReagentData?.pages?.[0]?.totalCount || 0;

  
  useEffect(() => {
    if (reagentsError) {
      notifications.show({
        title: "Error Loading Reagents",
        message: "Failed to load reagent data. Please try again.",
        color: "red",
      });
    }
  }, [reagentsError]);

  
  const handleReagentSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setReagentSearchQuery(event.currentTarget.value);
    },
    []
  );

  const handleBatchNumberChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setBatchNumber(event.currentTarget.value);
    },
    []
  );

  const handleReagentSort = useCallback(
    (field: string) => {
      if (reagentSortBy === field) {
        setReagentSortDirection(
          reagentSortDirection === "asc" ? "desc" : "asc"
        );
      } else {
        setReagentSortBy(field);
        setReagentSortDirection("asc");
      }
    },
    [reagentSortBy, reagentSortDirection]
  );

  const handleSelectReagent = useCallback(
    (reagentId: string, selected: boolean) => {
      setSelectedReagentIds((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(reagentId);
        } else {
          newSet.delete(reagentId);
        }
        return newSet;
      });
    },
    []
  );

  const handleSelectAllReagents = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedReagentIds(new Set(reagents.map((r) => r.id)));
      } else {
        setSelectedReagentIds(new Set());
      }
    },
    [reagents]
  );

  const handleFilterPreset = useCallback((filterType: string) => {
    
    setReagentType(null);
    setBatchNumber("");
    setReagentIsLowStock(null);
    setReagentIsExpired(null);
    setReagentIsExpiringSoon(null);
    setMinUnitCost("");
    setMaxUnitCost("");

    
    switch (filterType) {
      case "low-stock":
        setReagentIsLowStock(true);
        break;
      case "expired":
        setReagentIsExpired(true);
        break;
      case "expiring-soon":
        setReagentIsExpiringSoon(true);
        break;
      case "charge-based":
        setReagentType("charge-based");
        break;
      case "volume-based":
        setReagentType("volume-based");
        break;
    }
  }, []);

  const handleRowClick = useCallback((reagent: Reagent) => {
    setReagentsToEdit([reagent]);
    setEditModalOpened(true);
  }, []);

  const handleBatchEditClick = useCallback(() => {
    const selectedReagents = reagents.filter((r) =>
      selectedReagentIds.has(r.id)
    );
    setReagentsToEdit(selectedReagents);
    setEditModalOpened(true);
  }, [reagents, selectedReagentIds]);

  const handleBatchDelete = useCallback(
    async (reagentIds: Set<string>) => {
      if (reagentIds.size === 0) return;

      const confirmed = window.confirm(
        `Are you sure you want to delete ${reagentIds.size} selected reagent(s)? This action cannot be undone.`
      );

      if (!confirmed) return;

      try {
        await batchDeleteMutation.mutateAsync({
          reagentIds: Array.from(reagentIds),
          reason: "Batch deletion from inventory management",
        });

        notifications.show({
          title: "Success",
          message: `Successfully deleted ${reagentIds.size} reagent(s)`,
          color: "green",
        });

        refetchReagents();
        setSelectedReagentIds(new Set());
      } catch (error: any) {
        notifications.show({
          title: "Error",
          message:
            error?.response?.data?.message || "Failed to delete reagents",
          color: "red",
        });
      }
    },
    [batchDeleteMutation, refetchReagents]
  );

  
  const isChargeBasedReagent = (reagent: Reagent) => {
    return (
      (reagent.reagentType as any) === 0 ||
      reagent.reagentTypeName === "charge-based" ||
      reagent.reagentType === "ChargeBased" ||
      reagent.reagentType === "charge-based"
    );
  };

  const getReagentStockColor = (reagent: Reagent) => {
    if (reagent.availableAmount === 0) return "red";
    if (reagent.isLowStock) return "orange";
    return null;
  };

  const getReagentExpiryColor = (reagent: Reagent) => {
    if (reagent.isExpired) return "red";
    if (reagent.isExpiringSoon) return "orange";
    return "dimmed";
  };

  const formatReagentAmount = (reagent: Reagent) => {
    if (isChargeBasedReagent(reagent)) {
      
      const totalAmount =
        reagent.totalAvailableAmount || reagent.availableAmount;
      return `${totalAmount} ${reagent.displayUnit || "charges"}`;
    } else {
      const totalAmount =
        reagent.totalAvailableAmount || reagent.availableAmount;
      return `${totalAmount.toFixed(2)} ${reagent.unitOfMeasure || "mL"}`;
    }
  };

  const formatReagentQuantity = (reagent: Reagent) => {
    if (isChargeBasedReagent(reagent)) {
      
      if (
        reagent.currentCharges !== undefined &&
        reagent.initialCharges !== undefined
      ) {
        return (
          <div style={{ textAlign: "center" }}>
            <Text size="sm" fw={500}>
              {reagent.quantity} unopened + {reagent.currentCharges}/
              {reagent.initialCharges} opened
            </Text>
            <Text size="xs" c="dimmed">
              {(reagent.quantity || 0) * (reagent.initialCharges || 0) +
                (reagent.currentCharges || 0)}{" "}
              total charges
            </Text>
          </div>
        );
      } else {
        
        return (
          <div style={{ textAlign: "center" }}>
            <Text size="sm" fw={500}>
              {reagent.quantity} units
            </Text>
            <Text size="xs" c="dimmed">
              {reagent.totalCharges || reagent.availableAmount} charges
            </Text>
          </div>
        );
      }
    } else {
      
      if (
        reagent.currentVolume !== undefined &&
        reagent.initialVolume !== undefined
      ) {
        return (
          <div style={{ textAlign: "center" }}>
            <Text size="sm" fw={500}>
              {reagent.quantity} unopened + {reagent.currentVolume?.toFixed(1)}/
              {reagent.initialVolume}mL opened
            </Text>
            <Text size="xs" c="dimmed">
              {(
                (reagent.quantity || 0) * (reagent.initialVolume || 0) +
                (reagent.currentVolume || 0)
              ).toFixed(1)}
              mL total
            </Text>
          </div>
        );
      } else {
        
        return (
          <div style={{ textAlign: "center" }}>
            <Text size="sm" fw={500}>
              {reagent.quantity} containers
            </Text>
            <Text size="xs" c="dimmed">
              {reagent.volume}mL each
            </Text>
          </div>
        );
      }
    }
  };

  const getReagentTypeIcon = (reagent: Reagent) => {
    return isChargeBasedReagent(reagent) ? IconFlask : IconDroplet;
  };

  const getReagentTypeColor = (reagent: Reagent) => {
    return isChargeBasedReagent(reagent) ? "blue" : "teal";
  };

  
  const reagentColumns: DataTableColumn<Reagent>[] = useMemo(
    () => [
      {
        key: "select",
        title: (
          <Checkbox
            checked={
              reagents
                ? selectedReagentIds.size === reagents.length &&
                  reagents.length > 0
                : false
            }
            indeterminate={
              selectedReagentIds.size > 0 &&
              selectedReagentIds.size < reagents.length
            }
            onChange={(event) =>
              handleSelectAllReagents(event.currentTarget.checked)
            }
          />
        ),
        width: 50,
        align: "center",
        headerAlign: "center",
        render: (item: Reagent) => (
          <Checkbox
            checked={selectedReagentIds.has(item.id)}
            onChange={(event) =>
              handleSelectReagent(item.id, event.currentTarget.checked)
            }
          />
        ),
      },
      {
        key: "name",
        title: "Reagent",
        width: 240,
        sortable: true,
        sortKey: "name",
        render: (item: Reagent) => {
          const IconType = getReagentTypeIcon(item);
          return (
            <div>
              <Group gap={8} align="center">
                <IconType
                  size={16}
                  color={`var(--mantine-color-${getReagentTypeColor(item)}-6)`}
                />
                <div>
                  <Text size="sm" fw={500}>
                    {item.name}
                  </Text>
                  <Group gap={4} align="center">
                    <Text size="xs" c="dimmed">
                      {item.reagentTypeName}
                    </Text>
                    {item.batchNumber && (
                      <Badge size="xs" variant="outline" color="gray">
                        {item.batchNumber}
                      </Badge>
                    )}
                  </Group>
                </div>
              </Group>
            </div>
          );
        },
      },
      {
        key: "unitOfMeasure",
        title: "Unit",
        width: 80,
        align: "center",
        headerAlign: "center",
        render: (item: Reagent) => (
          <Badge size="sm" variant="outline" color="gray">
            {item.unitOfMeasure}
          </Badge>
        ),
      },
      {
        key: "quantity",
        title: "Inventory",
        width: 100,
        align: "center",
        headerAlign: "center",
        sortable: true,
        sortKey: "quantity",
        render: (item: Reagent) => (
          <div style={{ textAlign: "center" }}>
            {formatReagentQuantity(item)}
            {getReagentStockColor(item) && (
              <Badge
                size="xs"
                color={getReagentStockColor(item)!}
                variant="light"
                mt={4}
              >
                {item.availableAmount === 0 ? "Empty" : "Low Stock"}
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: "availableAmount",
        title: "Available",
        width: 110,
        align: "center",
        headerAlign: "center",
        sortable: true,
        sortKey: "availableAmount",
        render: (item: Reagent) => {
          const totalAmount = item.totalAvailableAmount || item.availableAmount;
          const isLowStock = totalAmount <= item.minimumStock;

          return (
            <div style={{ textAlign: "center" }}>
              <Text size="sm" fw={500} c={isLowStock ? "red" : "dark"}>
                {formatReagentAmount(item)}
              </Text>
              <Text size="xs" c="dimmed">
                min: {item.minimumStock}{" "}
                {item.displayUnit ||
                  (isChargeBasedReagent(item) ? "charges" : "mL")}
              </Text>
              {isLowStock && (
                <Badge size="xs" color="red" variant="light" mt={2}>
                  Below Minimum
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        key: "containerInfo",
        title: "Container Info",
        width: 120,
        align: "center",
        headerAlign: "center",
        render: (item: Reagent) => {
          if (isChargeBasedReagent(item)) {
            
            const initialCharges = item.initialCharges || item.chargesPerUnit;
            return (
              <Text size="sm">
                {initialCharges ? `${initialCharges} charges/container` : "—"}
              </Text>
            );
          } else {
            
            const initialVolume = item.initialVolume || item.volume;
            return (
              <Text size="sm">
                {initialVolume ? `${initialVolume} mL/container` : "—"}
              </Text>
            );
          }
        },
      },
      {
        key: "unitCost",
        title: "Unit Cost",
        width: 100,
        align: "right",
        headerAlign: "right",
        sortable: true,
        sortKey: "unitCost",
        render: (item: Reagent) => (
          <Text size="sm" fw={500}>
            {formatCurrency(item.unitCost)}
          </Text>
        ),
      },
      {
        key: "expirationDate",
        title: "Expiry",
        width: 100,
        render: (item: Reagent) => {
          if (!item.expirationDate) {
            return (
              <Text size="sm" c="dimmed">
                —
              </Text>
            );
          }

          const expiryDate = new Date(item.expirationDate);
          return (
            <div>
              <Text size="xs" c={getReagentExpiryColor(item)}>
                {expiryDate.toLocaleDateString()}
              </Text>
              {(item.isExpired || item.isExpiringSoon) && (
                <Badge
                  size="xs"
                  color={item.isExpired ? "red" : "orange"}
                  variant="light"
                  leftSection={
                    item.isExpired ? (
                      <IconAlertTriangle size={10} />
                    ) : (
                      <IconClock size={10} />
                    )
                  }
                >
                  {item.isExpired ? "Expired" : "Soon"}
                </Badge>
              )}
            </div>
          );
        },
      },
    ],
    [
      reagents,
      selectedReagentIds,
      handleSelectAllReagents,
      handleSelectReagent,
      getReagentStockColor,
      getReagentExpiryColor,
      isChargeBasedReagent,
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
              placeholder="Search reagents..."
              leftSection={<IconSearch size={16} />}
              value={reagentSearchQuery}
              onChange={handleReagentSearchChange}
            />
          </div>

          <div style={{ flex: "1" }}>
            <Select
              placeholder="Stock Status"
              value={
                reagentIsLowStock === true
                  ? "low"
                  : reagentIsLowStock === false
                  ? "normal"
                  : null
              }
              onChange={(value) =>
                setReagentIsLowStock(
                  value === "low" ? true : value === "normal" ? false : null
                )
              }
              data={[
                { value: "low", label: "Low Stock" },
                { value: "normal", label: "Normal Stock" },
              ]}
              clearable
            />
          </div>

          <div style={{ flex: "1" }}>
            <Select
              placeholder="Expiry Status"
              value={
                reagentIsExpired === true
                  ? "expired"
                  : reagentIsExpiringSoon === true
                  ? "expiring"
                  : null
              }
              onChange={(value) => {
                if (value === "expired") {
                  setReagentIsExpired(true);
                  setReagentIsExpiringSoon(null);
                } else if (value === "expiring") {
                  setReagentIsExpired(null);
                  setReagentIsExpiringSoon(true);
                } else {
                  setReagentIsExpired(null);
                  setReagentIsExpiringSoon(null);
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
              placeholder="Reagent Type"
              value={reagentType}
              onChange={setReagentType}
              data={[
                { value: "charge-based", label: "Charge-Based" },
                { value: "volume-based", label: "Volume-Based" },
              ]}
              clearable
            />
          </div>

          <div style={{ flex: "1" }}>
            <TextInput
              placeholder="Batch Number"
              value={batchNumber}
              onChange={handleBatchNumberChange}
            />
          </div>

          <div style={{ flex: "1" }}>
            <NumberInput
              placeholder="Min Cost"
              value={minUnitCost}
              onChange={(value) => setMinUnitCost(value as number | "")}
              min={0}
              step={0.01}
              decimalScale={2}
            />
          </div>

          <div style={{ flex: "1" }}>
            <NumberInput
              placeholder="Max Cost"
              value={maxUnitCost}
              onChange={(value) => setMaxUnitCost(value as number | "")}
              min={0}
              step={0.01}
              decimalScale={2}
            />
          </div>
        </div>

        {}
        <div
          style={{ flexShrink: 0, marginTop: "0.5rem", marginBottom: "1rem" }}
        >
          <ReagentSummaryStats onFilterClick={handleFilterPreset} />
        </div>
      </div>

      {}
      <div style={{ flexShrink: 0, marginBottom: "1rem" }}>
        <Group justify="space-between" align="center">
          <div>
            {!reagentsLoading && reagents.length > 0 && (
              <Text size="sm" c="dimmed">
                Showing {reagents.length.toLocaleString()} of{" "}
                {totalReagentCount.toLocaleString()} reagents
                {hasNextReagentPage && " (scroll to load more)"}
              </Text>
            )}
          </div>

          <Group gap="xs">
            <Tooltip label="Print Reagents">
              <Button
                leftSection={<IconPrinter size={16} />}
                variant="light"
                size="sm"
                onClick={() => setPrintModalOpened(true)}
              >
                Print
              </Button>
            </Tooltip>
            {selectedReagentIds.size > 0 && (
              <>
                <Tooltip
                  label={`Edit ${selectedReagentIds.size} selected reagent(s)`}
                >
                  <Button
                    leftSection={<IconEdit size={16} />}
                    variant="light"
                    size="sm"
                    onClick={handleBatchEditClick}
                  >
                    Edit ({selectedReagentIds.size})
                  </Button>
                </Tooltip>
                <Tooltip
                  label={`Delete ${selectedReagentIds.size} selected reagent(s)`}
                >
                  <Button
                    leftSection={<IconTrash size={16} />}
                    variant="light"
                    color="red"
                    size="sm"
                    onClick={() => handleBatchDelete(selectedReagentIds)}
                    loading={batchDeleteMutation.isPending}
                    disabled={batchDeleteMutation.isPending}
                  >
                    Delete ({selectedReagentIds.size})
                  </Button>
                </Tooltip>
              </>
            )}
            <Group gap="xs">
              <Button
                variant="filled"
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={onAddReagent}
              >
                Add Reagent
              </Button>
              {onBulkAddReagent && (
                <Button
                  variant="light"
                  size="sm"
                  leftSection={<IconPlus size={16} />}
                  onClick={onBulkAddReagent}
                >
                  Bulk Add
                </Button>
              )}
            </Group>
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
            data={reagents || []}
            columns={reagentColumns}
            loading={reagentsLoading || isFetchingNextReagentPage}
            hasMore={hasNextReagentPage}
            onLoadMore={fetchNextReagentPage}
            height="100%"
            stickyHeader
            emptyMessage={
              !reagentsLoading && reagents.length === 0
                ? "No reagents found. Click 'Add Reagent' to get started!"
                : "No reagents found"
            }
            sortBy={reagentSortBy}
            sortDirection={reagentSortDirection}
            onSort={handleReagentSort}
            horizontalScroll
            minWidth="0px"
            onRowClick={handleRowClick}
          />
        </div>
      </Paper>

      {}
      <EditReagentModal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        reagents={reagentsToEdit}
        onSuccess={() => {
          refetchReagents();
          setSelectedReagentIds(new Set());
        }}
      />

      {}
      <PrintPreviewModal
        opened={printModalOpened}
        onClose={() => setPrintModalOpened(false)}
        type="reagents"
      />
    </div>
  );
}
