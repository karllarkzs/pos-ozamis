import {
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconFlask,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";
import {
  useCreateLabTest,
  useDeleteLabTest,
  useInfiniteLabTests,
  useToggleLabTestAvailability,
  useUpdateLabTest,
} from "../../hooks/api/useLabTests";
import { useDebounce } from "../../hooks/useDebounce";
import type { LabTest, LabTestFilters } from "../../types/labtest.types";
import {
  LAB_TEST_CATEGORY_COLORS,
  LAB_TEST_CATEGORY_NAMES,
  LabTestCategory,
} from "../../types/labtest.types";
import { formatCurrency } from "../../utils/currency";
import { DataTable, DataTableColumn } from "../DataTable";

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  ...Object.entries(LAB_TEST_CATEGORY_NAMES).map(([value, label]) => ({
    value,
    label,
  })),
];

interface LabTestFormState {
  name: string;
  category: number;
  price: number | "";
  isAvailable: boolean;
  isPhilHealth: boolean;
}

const DEFAULT_FORM: LabTestFormState = {
  name: "",
  category: LabTestCategory.Hematology,
  price: "",
  isAvailable: true,
  isPhilHealth: false,
};

export function LabTestsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [availableFilter, setAvailableFilter] = useState<string>("");
  const [philHealthFilter, setPhilHealthFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<LabTestFilters["sortBy"]>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [itemToEdit, setItemToEdit] = useState<LabTest | null>(null);
  const [form, setForm] = useState<LabTestFormState>(DEFAULT_FORM);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filters: Omit<LabTestFilters, "page"> = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: categoryFilter ? Number(categoryFilter) : undefined,
      isAvailable:
        availableFilter === "true"
          ? true
          : availableFilter === "false"
            ? false
            : undefined,
      isPhilHealth:
        philHealthFilter === "true"
          ? true
          : philHealthFilter === "false"
            ? false
            : undefined,
      sortBy,
      sortDirection,
      pageSize: 50,
    }),
    [
      debouncedSearch,
      categoryFilter,
      availableFilter,
      philHealthFilter,
      sortBy,
      sortDirection,
    ],
  );

  const {
    data: infiniteData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteLabTests(filters);

  const createMutation = useCreateLabTest();
  const updateMutation = useUpdateLabTest();
  const deleteMutation = useDeleteLabTest();
  const toggleMutation = useToggleLabTestAvailability();

  const labTests = infiniteData?.pages?.flatMap((p) => p.data) ?? [];
  const totalCount = infiniteData?.pages?.[0]?.totalCount ?? 0;

  const handleSort = useCallback(
    (field: string) => {
      if (sortBy === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field as LabTestFilters["sortBy"]);
        setSortDirection("asc");
      }
    },
    [sortBy],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? new Set(labTests.map((t) => t.id)) : new Set());
    },
    [labTests],
  );

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const openEditForItem = (item: LabTest) => {
    setForm({
      name: item.name,
      category: item.category,
      price: item.price,
      isAvailable: item.isAvailable,
      isPhilHealth: item.isPhilHealth,
    });
    setItemToEdit(item);
    setModalMode("edit");
  };

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setItemToEdit(null);
    setModalMode("create");
  };

  const openEdit = () => {
    const id = Array.from(selectedIds)[0];
    const item = labTests.find((t) => t.id === id);
    if (!item) return;
    openEditForItem(item);
  };

  const handleModalClose = () => {
    setModalMode(null);
    setItemToEdit(null);
    setForm(DEFAULT_FORM);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      notifications.show({
        title: "Validation",
        message: "Name is required",
        color: "red",
      });
      return;
    }
    if (form.price === "" || Number(form.price) < 0) {
      notifications.show({
        title: "Validation",
        message: "Enter a valid price",
        color: "red",
      });
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      isAvailable: form.isAvailable,
      isPhilHealth: form.isPhilHealth,
    };

    try {
      if (modalMode === "create") {
        await createMutation.mutateAsync(payload);
        notifications.show({
          title: "Success",
          message: "Lab test created",
          color: "green",
        });
      } else if (modalMode === "edit" && itemToEdit) {
        await updateMutation.mutateAsync({ id: itemToEdit.id, data: payload });
        notifications.show({
          title: "Success",
          message: "Lab test updated",
          color: "green",
        });
      }
      setSelectedIds(new Set());
      handleModalClose();
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err?.response?.data?.message || "Something went wrong",
        color: "red",
      });
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedIds.size} lab test(s)? This cannot be undone.`,
    );
    if (!confirmed) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => deleteMutation.mutateAsync(id)),
      );
      notifications.show({
        title: "Success",
        message: `Deleted ${selectedIds.size} lab test(s)`,
        color: "green",
      });
      setSelectedIds(new Set());
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err?.response?.data?.message || "Failed to delete",
        color: "red",
      });
    }
  };

  const handleToggleAvailability = useCallback(
    async (id: string) => {
      try {
        await toggleMutation.mutateAsync(id);
      } catch {
        notifications.show({
          title: "Error",
          message: "Failed to toggle availability",
          color: "red",
        });
      }
    },
    [toggleMutation],
  );

  const columns: DataTableColumn<LabTest>[] = useMemo(
    () => [
      {
        key: "select",
        title: (
          <Checkbox
            checked={
              labTests.length > 0 && selectedIds.size === labTests.length
            }
            indeterminate={
              selectedIds.size > 0 && selectedIds.size < labTests.length
            }
            onChange={(e) => handleSelectAll(e.currentTarget.checked)}
          />
        ),
        width: 50,
        align: "center",
        headerAlign: "center",
        render: (item: LabTest) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selectedIds.has(item.id)}
              onChange={(e) => handleSelect(item.id, e.currentTarget.checked)}
            />
          </div>
        ),
      },
      {
        key: "name",
        title: "Name",
        sortable: true,
        sortKey: "name",
        render: (item: LabTest) => (
          <Text size="sm" fw={500}>
            {item.name}
          </Text>
        ),
      },
      {
        key: "category",
        title: "Category",
        sortable: true,
        sortKey: "category",
        width: 180,
        render: (item: LabTest) => (
          <Badge
            size="sm"
            variant="light"
            color={
              LAB_TEST_CATEGORY_COLORS[item.category as LabTestCategory] ??
              "gray"
            }
          >
            {item.categoryName}
          </Badge>
        ),
      },
      {
        key: "price",
        title: "Price",
        sortable: true,
        sortKey: "price",
        width: 110,
        align: "right",
        headerAlign: "right",
        render: (item: LabTest) => (
          <Text size="sm" fw={500}>
            {formatCurrency(item.price)}
          </Text>
        ),
      },
      {
        key: "isPhilHealth",
        title: "PhilHealth",
        width: 100,
        align: "center",
        headerAlign: "center",
        render: (item: LabTest) => (
          <Badge
            size="sm"
            variant={item.isPhilHealth ? "filled" : "outline"}
            color={item.isPhilHealth ? "red" : "gray"}
          >
            {item.isPhilHealth ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        key: "isAvailable",
        title: "Available",
        width: 100,
        align: "center",
        headerAlign: "center",
        render: (item: LabTest) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={item.isAvailable}
              onChange={() => handleToggleAvailability(item.id)}
              size="sm"
              color="green"
              disabled={toggleMutation.isPending}
            />
          </div>
        ),
      },
    ],
    [
      labTests,
      selectedIds,
      handleSelectAll,
      handleSelect,
      handleToggleAvailability,
      toggleMutation.isPending,
    ],
  );

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Filters */}
      <div style={{ flexShrink: 0, marginBottom: "1rem" }}>
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Search lab tests..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 2, minWidth: 200 }}
          />
          <Select
            placeholder="All Categories"
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v ?? "")}
            data={CATEGORY_OPTIONS}
            clearable
            style={{ flex: 1, minWidth: 160 }}
          />
          <Select
            placeholder="Availability"
            value={availableFilter}
            onChange={(v) => setAvailableFilter(v ?? "")}
            data={[
              { value: "true", label: "Available" },
              { value: "false", label: "Unavailable" },
            ]}
            clearable
            style={{ flex: 1, minWidth: 140 }}
          />
          <Select
            placeholder="PhilHealth"
            value={philHealthFilter}
            onChange={(v) => setPhilHealthFilter(v ?? "")}
            data={[
              { value: "true", label: "PhilHealth" },
              { value: "false", label: "Non-PhilHealth" },
            ]}
            clearable
            style={{ flex: 1, minWidth: 140 }}
          />
        </Group>
      </div>

      {/* Toolbar */}
      <div style={{ flexShrink: 0, marginBottom: "1rem" }}>
        <Group justify="space-between" align="center">
          <div>
            {!isLoading && labTests.length > 0 && (
              <Text size="sm" c="dimmed">
                Showing {labTests.length.toLocaleString()} of{" "}
                {totalCount.toLocaleString()} lab tests
                {hasNextPage && " (scroll to load more)"}
              </Text>
            )}
          </div>
          <Group gap="xs">
            <Tooltip
              label={
                selectedIds.size === 1
                  ? "Edit selected lab test"
                  : "Select exactly 1 lab test to edit"
              }
            >
              <Button
                leftSection={<IconEdit size={16} />}
                variant="light"
                size="sm"
                disabled={selectedIds.size !== 1}
                onClick={openEdit}
              >
                Edit
              </Button>
            </Tooltip>
            <Tooltip
              label={
                selectedIds.size > 0
                  ? `Delete ${selectedIds.size} lab test(s)`
                  : "Select lab tests to delete"
              }
            >
              <Button
                leftSection={<IconTrash size={16} />}
                variant="light"
                color="red"
                size="sm"
                disabled={selectedIds.size === 0 || deleteMutation.isPending}
                loading={deleteMutation.isPending}
                onClick={handleDelete}
              >
                Delete
                {selectedIds.size > 0 && ` (${selectedIds.size})`}
              </Button>
            </Tooltip>
            <Button
              leftSection={<IconPlus size={16} />}
              variant="filled"
              size="sm"
              onClick={openCreate}
            >
              Add Lab Test
            </Button>
          </Group>
        </Group>
      </div>

      {/* Table */}
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
            data={labTests}
            columns={columns}
            loading={isLoading || isFetchingNextPage}
            hasMore={hasNextPage}
            onLoadMore={fetchNextPage}
            height="100%"
            stickyHeader
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            emptyMessage="No lab tests found"
            onRowClick={openEditForItem}
          />
        </div>
      </Paper>

      {/* Create / Edit Modal */}
      <Modal
        opened={modalMode !== null}
        onClose={handleModalClose}
        title={
          <Group gap="xs">
            <IconFlask size={18} />
            <Text fw={600}>
              {modalMode === "create" ? "Add Lab Test" : "Edit Lab Test"}
            </Text>
          </Group>
        }
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="e.g. Complete Blood Count w/ Platelets"
            required
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({ ...f, name: e.currentTarget.value }))
            }
          />
          <Select
            label="Category"
            required
            value={String(form.category)}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                category: Number(v ?? LabTestCategory.Hematology),
              }))
            }
            data={Object.entries(LAB_TEST_CATEGORY_NAMES).map(
              ([value, label]) => ({
                value,
                label,
              }),
            )}
          />
          <NumberInput
            label="Price (₱)"
            placeholder="0.00"
            required
            min={0}
            decimalScale={2}
            prefix="₱"
            value={form.price}
            onChange={(v) =>
              setForm((f) => ({ ...f, price: v as number | "" }))
            }
          />
          <Group grow>
            <Switch
              label="Available"
              checked={form.isAvailable}
              onChange={(e) =>
                setForm((f) => ({ ...f, isAvailable: e.currentTarget.checked }))
              }
              color="green"
            />
            <Switch
              label="PhilHealth"
              checked={form.isPhilHealth}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  isPhilHealth: e.currentTarget.checked,
                }))
              }
              color="red"
            />
          </Group>
          <Group justify="flex-end" mt="sm">
            <Button
              variant="default"
              onClick={handleModalClose}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={isMutating}>
              {modalMode === "create" ? "Create" : "Save Changes"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
