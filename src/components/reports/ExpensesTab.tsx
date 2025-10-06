// components/expenses/ExpensesTab.tsx
import { useMemo, useState } from "react";
import {
  Paper,
  Stack,
  Group,
  Text,
  Table,
  Badge,
  Center,
  Loader,
  Alert,
  ThemeIcon,
  Button,
  Select,
  Modal,
  TextInput,
  NumberInput,
  Textarea,
  ActionIcon,
  Divider,
  Tooltip,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconCurrencyPeso,
  IconFileText,
  IconPlus,
  IconX,
  IconTrash,
  IconEdit,
  IconListDetails,
} from "@tabler/icons-react";
import { formatCurrency } from "../../utils/currency";
import {
  useExpenseStatistics,
  useExpensesByCategory,
  useExpenseCategories,
  useExpensesList,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "../../hooks/api/useExpenses";

type Props = { startDateStr: string; endDateStr: string };

export default function ExpensesTab({ startDateStr, endDateStr }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page] = useState(1);
  const [pageSize] = useState(20);

  const statsQ = useExpenseStatistics(startDateStr, endDateStr);
  const byCatQ = useExpensesByCategory(startDateStr, endDateStr);
  const catsQ = useExpenseCategories();
  const listQ = useExpensesList(startDateStr, endDateStr, {
    category: selectedCategory || undefined,
    pageNumber: page,
    pageSize,
  });

  const isLoading = statsQ.isLoading || byCatQ.isLoading || listQ.isLoading;
  const error = (statsQ.error || byCatQ.error || listQ.error) as any;

  const categories = catsQ.data?.categories ?? [];

  // modals
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <ThemeIcon variant="light" color="red">
            <IconFileText size={18} />
          </ThemeIcon>
          <Text fw={700}>Expenses</Text>
          <Badge variant="light" color="gray">
            {startDateStr || "—"} – {endDateStr || "—"}
          </Badge>
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
          variant="filled"
        >
          Add Expense
        </Button>
      </Group>

      <Paper withBorder p="sm">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Text size="sm" c="dimmed">
              Filter:
            </Text>
            <Select
              data={[
                { value: "", label: "All Categories" },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
              value={selectedCategory}
              onChange={(v) => setSelectedCategory(v || "")}
              w={220}
              placeholder="All Categories"
              searchable
              clearable
            />
          </Group>
          {statsQ.data && (
            <Group gap="lg">
              <Stat
                label="Total"
                value={formatCurrency(statsQ.data.totals.totalAmount)}
                icon={<IconCurrencyPeso size={14} />}
              />
              <Divider orientation="vertical" />
              <Stat
                label="Transactions"
                value={statsQ.data.totals.transactionCount.toLocaleString()}
              />
              <Divider orientation="vertical" />
              <Stat
                label="Average"
                value={formatCurrency(statsQ.data.totals.averageExpense)}
              />
            </Group>
          )}
        </Group>
      </Paper>

      <Paper withBorder>
        <Group p="md" justify="space-between" align="center">
          <Text fw={600} size="lg">
            Recent Expenses{selectedCategory ? ` — ${selectedCategory}` : ""}
          </Text>
          <Text size="sm" c="dimmed">
            Showing {listQ.data?.data.length ?? 0} of{" "}
            {listQ.data?.pagination.totalRecords ?? 0}
          </Text>
        </Group>

        {isLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : error ? (
          <Alert color="red" title="Error loading expenses">
            {error?.message ?? "Unknown error"}
          </Alert>
        ) : listQ.data && listQ.data.data.length > 0 ? (
          <Table striped highlightOnHover withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Purchased By</Table.Th>
                <Table.Th>Payment</Table.Th>
                <Table.Th ta="right">Amount</Table.Th>
                <Table.Th ta="center">Items</Table.Th>
                <Table.Th ta="right">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {listQ.data.data.map((e) => (
                <Table.Tr key={e.id}>
                  <Table.Td>
                    <Text size="sm">
                      {new Date(e.date).toLocaleDateString()}
                    </Text>
                    {e.reference && (
                      <Text size="xs" c="dimmed">
                        Ref: {e.reference}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6}>
                      <Text fw={500} size="sm">
                        {e.reason}
                      </Text>
                      {e.notes && (
                        <Tooltip label={e.notes} withArrow>
                          <IconListDetails size={16} />
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light">
                      {e.category}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{e.purchasedBy}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      variant="outline"
                      color={e.paymentMethod === "Cash" ? "green" : "blue"}
                    >
                      {e.paymentMethod}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text fw={600}>{formatCurrency(e.total)}</Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge size="xs" color="gray">
                      {e.itemCount}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Group gap={6} justify="end">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => {
                          setViewing(e);
                          setViewerOpen(true);
                        }}
                      >
                        <IconListDetails size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        onClick={() => {
                          setEditing(e);
                          setEditorOpen(true);
                        }}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <DangerDelete id={e.id} />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Center p="xl" style={{ gap: 8, flexDirection: "column" }}>
            <IconFileText size={40} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed">No expenses found for the selected period</Text>
          </Center>
        )}
      </Paper>

      {/* Create / Edit modal */}
      <ExpenseEditor
        opened={editorOpen}
        onClose={() => setEditorOpen(false)}
        initial={editing}
        defaultDate={startDateStr}
      />

      {/* Viewer modal */}
      <ExpenseViewer
        opened={viewerOpen}
        onClose={() => setViewerOpen(false)}
        expense={viewing}
      />
    </Stack>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <Group gap={6}>
      {icon}
      <Text size="sm" fw={700}>
        {value}
      </Text>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
    </Group>
  );
}

function DangerDelete({ id }: { id: string }) {
  const del = useDeleteExpense();
  const [confirm, setConfirm] = useState(false);
  return confirm ? (
    <Group gap={6}>
      <Button
        size="xs"
        color="red"
        variant="light"
        onClick={() => del.mutate(id)}
        loading={del.isPending}
      >
        Confirm
      </Button>
      <ActionIcon variant="subtle" onClick={() => setConfirm(false)}>
        <IconX size={16} />
      </ActionIcon>
    </Group>
  ) : (
    <ActionIcon variant="subtle" color="red" onClick={() => setConfirm(true)}>
      <IconTrash size={16} />
    </ActionIcon>
  );
}

/* ------------------------ Viewer ------------------------ */
function ExpenseViewer({
  opened,
  onClose,
  expense,
}: {
  opened: boolean;
  onClose: () => void;
  expense: any | null;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Expense Details"
      centered
      size="lg"
    >
      {!expense ? (
        <Text c="dimmed">No expense selected.</Text>
      ) : (
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600}>{expense.reason}</Text>
            <Badge variant="light">{expense.category}</Badge>
          </Group>
          <Group gap="md">
            <Text size="sm" c="dimmed">
              Date:
            </Text>
            <Text size="sm">{new Date(expense.date).toLocaleString()}</Text>
            <Text size="sm" c="dimmed">
              Purchased By:
            </Text>
            <Text size="sm">{expense.purchasedBy}</Text>
            <Text size="sm" c="dimmed">
              Payment:
            </Text>
            <Text size="sm">{expense.paymentMethod}</Text>
          </Group>
          {expense.reference && (
            <Text size="sm">Reference: {expense.reference}</Text>
          )}
          {expense.notes && <Text size="sm">Notes: {expense.notes}</Text>}
          <Divider />
          <Text fw={600} size="sm">
            Items ({expense.itemCount})
          </Text>
          <Table striped withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th ta="center">Qty</Table.Th>
                <Table.Th ta="right">Unit Price</Table.Th>
                <Table.Th ta="right">Line Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(expense.items ?? []).map((it: any) => (
                <Table.Tr key={it.id}>
                  <Table.Td>
                    <Text fw={500}>{it.name}</Text>
                    <Text size="xs" c="dimmed">
                      {[it.brand, it.unit, it.description]
                        .filter(Boolean)
                        .join(" • ")}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">{it.quantity}</Table.Td>
                  <Table.Td ta="right">{formatCurrency(it.unitPrice)}</Table.Td>
                  <Table.Td ta="right">
                    {formatCurrency(it.totalPrice)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Group justify="flex-end" mt="xs">
            <Text fw={800}>Total: {formatCurrency(expense.total)}</Text>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}

/* ------------------------ Editor (Create / Update) ------------------------ */
type EditorProps = {
  opened: boolean;
  onClose: () => void;
  initial: any | null; // if present -> edit mode
  defaultDate?: string;
};
function ExpenseEditor({ opened, onClose, initial, defaultDate }: EditorProps) {
  const isEdit = !!initial;
  const create = useCreateExpense();
  const update = useUpdateExpense();

  const [form, setForm] = useState<any>(() => ({
    purchasedBy: initial?.purchasedBy ?? "",
    date: initial?.date
      ? new Date(initial.date)
      : defaultDate
      ? new Date(defaultDate)
      : new Date(),
    reason: initial?.reason ?? "",
    total: initial?.total ?? 0,
    category: initial?.category ?? "",
    paymentMethod: initial?.paymentMethod ?? "Cash",
    reference: initial?.reference ?? "",
    notes: initial?.notes ?? "",
    items: (initial?.items ?? []).map((i: any) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      brand: i.brand ?? "",
      unit: i.unit ?? "",
      description: i.description ?? "",
    })),
  }));

  // compute total from items if items exist; otherwise respect manual total
  const computedTotal = useMemo(() => {
    if (!form.items || form.items.length === 0) return form.total || 0;
    return form.items.reduce(
      (s: number, it: any) =>
        s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );
  }, [form.items, form.total]);

  const addItem = () =>
    setForm((f: any) => ({
      ...f,
      items: [
        ...(f.items ?? []),
        {
          name: "",
          quantity: 1,
          unitPrice: 0,
          brand: "",
          unit: "",
          description: "",
        },
      ],
    }));
  const removeItem = (idx: number) =>
    setForm((f: any) => ({
      ...f,
      items: f.items.filter((_: any, i: number) => i !== idx),
    }));

  const setItem = (idx: number, patch: any) =>
    setForm((f: any) => ({
      ...f,
      items: f.items.map((it: any, i: number) =>
        i === idx ? { ...it, ...patch } : it
      ),
    }));

  const onSubmit = async () => {
    const payload = {
      purchasedBy: form.purchasedBy,
      date: (form.date as Date).toISOString(),
      reason: form.reason,
      total: computedTotal, // send calculated
      category: form.category,
      paymentMethod: form.paymentMethod,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
      items: (form.items ?? []).length
        ? form.items.map((i: any) => ({
            name: i.name,
            quantity: Number(i.quantity) || 0,
            unitPrice: Number(i.unitPrice) || 0,
            brand: i.brand || undefined,
            unit: i.unit || undefined,
            description: i.description || undefined,
          }))
        : undefined,
    };

    if (isEdit) {
      await update.mutateAsync({ id: initial.id, body: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? "Update Expense" : "Add Expense"}
      size="lg"
      centered
    >
      <Stack gap="sm">
        <Group grow>
          <TextInput
            label="Purchased By"
            value={form.purchasedBy}
            onChange={(e) =>
              setForm({ ...form, purchasedBy: e.currentTarget.value })
            }
          />
          <DateInput
            label="Date"
            value={form.date}
            onChange={(v) => setForm({ ...form, date: v || new Date() })}
          />
        </Group>
        <TextInput
          label="Reason / Description"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.currentTarget.value })}
        />
        <Group grow>
          <TextInput
            label="Category"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.currentTarget.value })
            }
            placeholder="e.g., Supplies"
          />
          <TextInput
            label="Payment Method"
            value={form.paymentMethod}
            onChange={(e) =>
              setForm({ ...form, paymentMethod: e.currentTarget.value })
            }
            placeholder="Cash, Bank Transfer, ..."
          />
        </Group>
        <Group grow>
          <TextInput
            label="Reference (optional)"
            value={form.reference}
            onChange={(e) =>
              setForm({ ...form, reference: e.currentTarget.value })
            }
          />
          <NumberInput
            label="Total (manual fallback)"
            value={form.total}
            onChange={(v) => setForm({ ...form, total: Number(v) || 0 })}
            thousandSeparator
            min={0}
          />
        </Group>
        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.currentTarget.value })}
        />

        <Group justify="space-between" mt="xs">
          <Text fw={600}>Items</Text>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={addItem}
          >
            Add item
          </Button>
        </Group>

        {(form.items ?? []).length === 0 ? (
          <Text size="sm" c="dimmed">
            No items yet. You can still save using the manual total, or add line
            items.
          </Text>
        ) : (
          <Table withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ minWidth: 160 }}>Name</Table.Th>
                <Table.Th ta="center">Qty</Table.Th>
                <Table.Th ta="right">Unit Price</Table.Th>
                <Table.Th>Brand</Table.Th>
                <Table.Th>Unit</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th ta="right">Line Total</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {form.items.map((it: any, idx: number) => (
                <Table.Tr key={idx}>
                  <Table.Td>
                    <TextInput
                      value={it.name}
                      onChange={(e) =>
                        setItem(idx, { name: e.currentTarget.value })
                      }
                    />
                  </Table.Td>
                  <Table.Td ta="center">
                    <NumberInput
                      value={it.quantity}
                      min={0}
                      onChange={(v) =>
                        setItem(idx, { quantity: Number(v) || 0 })
                      }
                    />
                  </Table.Td>
                  <Table.Td ta="right">
                    <NumberInput
                      value={it.unitPrice}
                      min={0}
                      onChange={(v) =>
                        setItem(idx, { unitPrice: Number(v) || 0 })
                      }
                      thousandSeparator
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      value={it.brand}
                      onChange={(e) =>
                        setItem(idx, { brand: e.currentTarget.value })
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      value={it.unit}
                      onChange={(e) =>
                        setItem(idx, { unit: e.currentTarget.value })
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      value={it.description}
                      onChange={(e) =>
                        setItem(idx, { description: e.currentTarget.value })
                      }
                    />
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text fw={600}>
                      {formatCurrency(
                        (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                      )}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => removeItem(idx)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        <Group justify="space-between" mt="sm">
          <Text c="dimmed" size="sm">
            Calculated Total
          </Text>
          <Text fw={800}>{formatCurrency(computedTotal)}</Text>
        </Group>

        <Group justify="flex-end" mt="sm">
          <Button
            variant="light"
            onClick={onClose}
            leftSection={<IconX size={14} />}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            loading={create.isPending || update.isPending}
          >
            {isEdit ? "Update Expense" : "Create Expense"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
