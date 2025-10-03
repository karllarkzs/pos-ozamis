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
  IconTrash,
  IconSearch,
  IconAlertTriangle,
  IconFlask,
} from "@tabler/icons-react";
import { DataTable, DataTableColumn } from "../DataTable";
import { useTests, useDeleteTest } from "../../hooks/api/useTests";
import { useDebounce } from "../../hooks/useDebounce";
import type { Test, TestFilters } from "../../types/global";
import { formatCurrency } from "../../utils/currency";

interface TestsTabProps {
  onAddTest: () => void;
}

export function TestsTab({ onAddTest }: TestsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [canPerform, setCanPerform] = useState<boolean | null>(null);
  const [hasReagents, setHasReagents] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(
    new Set()
  );

  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  
  const testFilters: TestFilters = useMemo(
    () => ({
      searchTerm: debouncedSearchQuery || undefined,
      canPerform: canPerform === null ? undefined : canPerform,
      sortBy: sortBy as TestFilters["sortBy"],
      sortDirection,
      pageSize: 50,
    }),
    [debouncedSearchQuery, canPerform, sortBy, sortDirection]
  );

  
  const {
    data: testsResponse,
    isLoading,
    error,
    refetch,
  } = useTests(testFilters);

  const tests = testsResponse?.data || [];
  const totalCount = testsResponse?.totalCount || 0;

  
  const { mutate: deleteTest, isPending: isDeleting } = useDeleteTest();

  
  useEffect(() => {
    if (error) {
      notifications.show({
        title: "Error Loading Tests",
        message: "Failed to load test data. Please try again.",
        color: "red",
      });
    }
  }, [error]);

  
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

  const handleSelectTest = useCallback((testId: string, selected: boolean) => {
    setSelectedTestIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(testId);
      } else {
        newSet.delete(testId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllTests = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedTestIds(new Set(tests.map((t) => t.id)));
      } else {
        setSelectedTestIds(new Set());
      }
    },
    [tests]
  );

  const handleBatchDelete = useCallback(
    async (testIds: Set<string>) => {
      if (testIds.size === 0) return;

      const confirmed = window.confirm(
        `Are you sure you want to delete ${testIds.size} selected test(s)? This action cannot be undone.`
      );

      if (!confirmed) return;

      
      const promises = Array.from(testIds).map((id) =>
        deleteTest(id, {
          onSuccess: () => {
            notifications.show({
              title: "Success",
              message: `Test deleted successfully`,
              color: "green",
            });
          },
          onError: (error: any) => {
            notifications.show({
              title: "Error",
              message: error.response?.data?.message || "Failed to delete test",
              color: "red",
            });
          },
        })
      );

      await Promise.all(promises);
      refetch();
      setSelectedTestIds(new Set());
    },
    [deleteTest, refetch]
  );

  
  const testColumns: DataTableColumn<Test>[] = useMemo(
    () => [
      {
        key: "select",
        title: (
          <Checkbox
            checked={
              tests
                ? selectedTestIds.size === tests.length && tests.length > 0
                : false
            }
            indeterminate={
              selectedTestIds.size > 0 && selectedTestIds.size < tests.length
            }
            onChange={(event) =>
              handleSelectAllTests(event.currentTarget.checked)
            }
          />
        ),
        width: 50,
        align: "center",
        headerAlign: "center",
        render: (item: Test) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selectedTestIds.has(item.id)}
              onChange={(event) =>
                handleSelectTest(item.id, event.currentTarget.checked)
              }
            />
          </div>
        ),
      },
      {
        key: "name",
        title: "Test Name",
        width: 250,
        sortable: true,
        sortKey: "name",
        render: (item: Test) => (
          <div>
            <Text size="sm" fw={500}>
              {item.name}
            </Text>
            {item.reagentRequirements.length > 0 && (
              <Badge size="xs" color="blue" variant="light">
                {item.reagentRequirements.length} Reagent(s)
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: "availableQuantity",
        title: "Can Perform",
        width: 120,
        align: "center",
        headerAlign: "center",
        render: (item: Test) => (
          <div>
            <Badge
              color={
                item.availableQuantity === 0
                  ? "red"
                  : item.availableQuantity < 5
                  ? "orange"
                  : "green"
              }
              variant={item.availableQuantity === 0 ? "filled" : "light"}
              size="md"
            >
              {item.availableQuantity}x
            </Badge>
            <Text size="xs" c="dimmed" mt={2}>
              {item.reagentRequirements.length > 0
                ? "Based on reagents"
                : "No reagents needed"}
            </Text>
          </div>
        ),
      },
      {
        key: "price",
        title: "Price",
        width: 120,
        align: "right",
        headerAlign: "right",
        sortable: true,
        sortKey: "price",
        render: (item: Test) => (
          <Text size="sm" fw={500}>
            {formatCurrency(item.price)}
          </Text>
        ),
      },
      {
        key: "status",
        title: "Status",
        width: 150,
        render: (item: Test) => (
          <Group gap={5}>
            {item.canPerform ? (
              <Badge size="sm" color="green" variant="light">
                Ready
              </Badge>
            ) : (
              <Badge
                size="sm"
                color="red"
                variant="light"
                leftSection={<IconAlertTriangle size={12} />}
              >
                Insufficient Reagents
              </Badge>
            )}
          </Group>
        ),
      },
      {
        key: "reagents",
        title: "Reagent Requirements",
        width: 250,
        render: (item: Test) => (
          <div>
            {item.reagentRequirements.length > 0 ? (
              item.reagentRequirements.map((req) => (
                <Text key={req.reagentId} size="xs">
                  • {req.reagentName || "Unknown"}: {req.requiredAmount}{" "}
                  {req.reagentUnit || "units"}
                  {req.reagentIsLowStock && (
                    <Badge size="xs" color="orange" variant="light" ml={4}>
                      Low
                    </Badge>
                  )}
                </Text>
              ))
            ) : (
              <Text size="xs" c="dimmed">
                No reagents required
              </Text>
            )}
          </div>
        ),
      },
    ],
    [
      tests,
      selectedTestIds,
      handleSelectAllTests,
      handleSelectTest,
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
              placeholder="Search tests..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div style={{ flex: "1.5" }}>
            <Select
              placeholder="Availability"
              value={
                canPerform === true
                  ? "can-perform"
                  : canPerform === false
                  ? "cannot-perform"
                  : null
              }
              onChange={(value) => {
                if (value === "can-perform") {
                  setCanPerform(true);
                } else if (value === "cannot-perform") {
                  setCanPerform(false);
                } else {
                  setCanPerform(null);
                }
              }}
              data={[
                { value: "can-perform", label: "✓ Can Perform" },
                { value: "cannot-perform", label: "✗ Cannot Perform" },
              ]}
              clearable
            />
          </div>

          <div style={{ flex: "1.5" }}>
            <Select
              placeholder="Reagents"
              value={hasReagents === true ? "has-reagents" : null}
              onChange={(value) => {
                setHasReagents(value === "has-reagents" ? true : null);
              }}
              data={[{ value: "has-reagents", label: "Has Reagents" }]}
              clearable
            />
          </div>
        </div>
      </div>

      {}
      <div style={{ flexShrink: 0, marginBottom: "1rem" }}>
        <Group justify="space-between" align="center">
          <div>
            {!isLoading && tests.length > 0 && (
              <Text size="sm" c="dimmed">
                Showing {tests.length.toLocaleString()} of{" "}
                {totalCount.toLocaleString()} tests
              </Text>
            )}
          </div>

          <Group gap="xs">
            {selectedTestIds.size > 0 && (
              <Tooltip
                label={`Delete ${selectedTestIds.size} selected test(s)`}
              >
                <Button
                  leftSection={<IconTrash size={16} />}
                  variant="light"
                  color="red"
                  size="sm"
                  onClick={() => handleBatchDelete(selectedTestIds)}
                  loading={isDeleting}
                  disabled={isDeleting}
                >
                  Delete ({selectedTestIds.size})
                </Button>
              </Tooltip>
            )}
            <Button variant="filled" size="sm" onClick={onAddTest}>
              Add Test
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
            data={tests}
            columns={testColumns}
            loading={isLoading}
            height="100%"
            stickyHeader
            emptyMessage="No tests found"
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            horizontalScroll
            minWidth="0px"
          />
        </div>
      </Paper>
    </div>
  );
}
