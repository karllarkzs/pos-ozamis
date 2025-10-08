import { useState, useMemo } from "react";
import {
  Paper,
  Stack,
  Group,
  Text,
  Tabs,
  Table,
  Badge,
  Button,
  Loader,
  Center,
  Alert,
  ThemeIcon,
  Tooltip,
  Divider,
  Modal,
  ScrollArea,
  Skeleton,
  Code,
} from "@mantine/core";
import {
  IconClipboardText,
  IconTrashX,
  IconReceipt,
  IconDiscount2,
  IconCurrencyPeso,
} from "@tabler/icons-react";
import {
  useInfiniteTransactions,
  useTransaction,
} from "../../hooks/api/useTransactions";
import { formatCurrency } from "../../utils/currency";

/* utils */
const pmColor = (pm: string) =>
  pm === "Cash"
    ? "green"
    : pm === "GCash"
    ? "blue"
    : pm === "Maya"
    ? "indigo"
    : pm === "GoTyme"
    ? "violet"
    : "gray";

export function TransactionsTab({
  startDateStr,
  endDateStr,
}: {
  startDateStr?: string;
  endDateStr?: string;
}) {
  const [subtab, setSubtab] = useState<"all" | "discounted" | "voided">("all");
  const [openedId, setOpenedId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteTransactions({
    pageSize: 50,
    startDate: startDateStr,
    endDate: endDateStr,
    includeVoided: true,
    sortBy: "transactionDate",
    sortDirection: "desc",
  });

  const rows = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.data),
    [data]
  );

  const filtered = useMemo(() => {
    switch (subtab) {
      case "voided":
        return rows.filter((t) => t.isVoided);
      case "discounted":
        return rows.filter(
          (t) =>
            (t.discountAmount ?? 0) > 0 ||
            (t.regularDiscount ?? 0) > 0 ||
            (t.specialDiscount ?? 0) > 0
        );
      default:
        // ALL = include everything (voided + non-voided)
        return rows;
    }
  }, [rows, subtab]);

  // summary for current view
  const summary = useMemo(() => {
    const total = filtered.reduce((s, t) => s + (t.totalAmount ?? 0), 0);
    const discounted = filtered.filter(
      (t) =>
        (t.discountAmount ?? 0) > 0 ||
        (t.regularDiscount ?? 0) > 0 ||
        (t.specialDiscount ?? 0) > 0
    ).length;
    const voided = filtered.filter((t) => t.isVoided).length;
    return { count: filtered.length, total, discounted, voided };
  }, [filtered]);

  if (isLoading)
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  if (isError) {
    return (
      <Alert color="red" title="Failed to load transactions">
        {(error as any)?.message ?? "Unknown error"}
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <ThemeIcon variant="light" color="blue">
            <IconClipboardText size={18} />
          </ThemeIcon>
          <Text fw={700}>Transactions</Text>
          <Badge variant="light" color="gray">
            {startDateStr || "—"} – {endDateStr || "—"}
          </Badge>
        </Group>
      </Group>

      <Tabs value={subtab} onChange={(v) => setSubtab((v as any) || "all")}>
        <Tabs.List>
          <Tabs.Tab value="all" leftSection={<IconReceipt size={14} />}>
            All
          </Tabs.Tab>
        </Tabs.List>

        {/* shared summary header */}
        <SummaryBar summary={summary} />

        <Tabs.Panel value="all" pt="sm">
          <Paper withBorder>
            <TransactionsTable
              rows={filtered}
              onOpen={(id) => setOpenedId(id)}
            />
            <ListPager
              hasNextPage={!!hasNextPage}
              fetchNextPage={fetchNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="discounted" pt="sm">
          <Paper withBorder>
            <TransactionsTable
              rows={filtered}
              emphasizeDiscounts
              onOpen={(id) => setOpenedId(id)}
            />
            <ListPager
              hasNextPage={!!hasNextPage}
              fetchNextPage={fetchNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="voided" pt="sm">
          <Paper withBorder>
            <TransactionsTable
              rows={filtered}
              showVoidedBadge
              onOpen={(id) => setOpenedId(id)}
            />
            <ListPager
              hasNextPage={!!hasNextPage}
              fetchNextPage={fetchNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* Details modal */}
      <TransactionDetailsModal
        id={openedId}
        onClose={() => setOpenedId(null)}
      />
    </Stack>
  );
}

function SummaryBar({
  summary,
}: {
  summary: { count: number; total: number; discounted: number; voided: number };
}) {
  return (
    <Paper withBorder p="xs" mt="sm">
      <Group gap="md" wrap="wrap">
        <Group gap={6}>
          <Badge variant="light" color="gray">
            {summary.count.toLocaleString()}
          </Badge>
          <Text size="sm" c="dimmed">
            records
          </Text>
        </Group>
        <Divider orientation="vertical" />
        <Group gap={6}>
          <IconCurrencyPeso size={14} />
          <Text size="sm" fw={700}>
            {formatCurrency(summary.total)}
          </Text>
          <Text size="sm" c="dimmed">
            total
          </Text>
        </Group>
        <Divider orientation="vertical" />
        <Group gap={6}>
          <Badge variant="light" color="violet">
            {summary.discounted}
          </Badge>
          <Text size="sm" c="dimmed">
            discounted
          </Text>
        </Group>
        <Divider orientation="vertical" />
        <Group gap={6}>
          <Badge variant="light" color="red">
            {summary.voided}
          </Badge>
          <Text size="sm" c="dimmed">
            voided
          </Text>
        </Group>
      </Group>
    </Paper>
  );
}

function TransactionsTable({
  rows,
  showVoidedBadge = false,
  emphasizeDiscounts = false,
  onOpen,
}: {
  rows: Array<{
    id: string;
    receiptNumber: string;
    transactionDate: string;
    processedBy: string;
    cashierName: string;
    subTotal?: number;
    regularDiscount?: number;
    specialDiscount?: number;
    discountAmount?: number;
    vatAmount?: number;
    totalAmount: number;
    paymentMethod: "Cash" | "GCash" | "Maya" | "GoTyme" | string;
    referenceNumber?: string | null;
    isVoided: boolean;
    itemCount: number;
  }>;
  showVoidedBadge?: boolean;
  emphasizeDiscounts?: boolean;
  onOpen: (id: string) => void;
}) {
  if (!rows.length)
    return (
      <Center p="xl">
        <Text c="dimmed">No transactions found.</Text>
      </Center>
    );

  return (
    <div style={{ overflowX: "auto" }}>
      <Table striped highlightOnHover withColumnBorders verticalSpacing="xs">
        <Table.Thead
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            background: "var(--mantine-color-body)",
          }}
        >
          <Table.Tr>
            <Table.Th style={{ width: 160 }}>Date</Table.Th>
            <Table.Th>Receipt #</Table.Th>
            <Table.Th>Cashier</Table.Th>
            <Table.Th ta="right" style={{ width: 110 }}>
              Items
            </Table.Th>
            <Table.Th style={{ width: 130 }}>Payment</Table.Th>
            <Table.Th ta="right" style={{ width: 140 }}>
              Discounts
            </Table.Th>
            <Table.Th ta="right" style={{ width: 140 }}>
              Total
            </Table.Th>
            <Table.Th style={{ width: 130 }}>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((t) => {
            const hasDiscount =
              (t.discountAmount ?? 0) > 0 ||
              (t.regularDiscount ?? 0) > 0 ||
              (t.specialDiscount ?? 0) > 0;

            // row click + keyboard open
            const open = () => onOpen(t.id);
            const onKey = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            };

            return (
              <Table.Tr
                key={t.id}
                onClick={open}
                onKeyDown={onKey}
                tabIndex={0}
                style={{ cursor: "pointer" }}
                title="View transaction details"
              >
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      {new Date(t.transactionDate).toLocaleDateString()}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {new Date(t.transactionDate).toLocaleTimeString()}
                    </Text>
                  </Stack>
                </Table.Td>

                <Table.Td>
                  <Text size="sm" ff="monospace">
                    {t.receiptNumber}
                  </Text>
                  {t.referenceNumber ? (
                    <Text size="xs" c="dimmed">
                      Ref: {t.referenceNumber}
                    </Text>
                  ) : null}
                </Table.Td>

                <Table.Td>
                  <Text size="sm">{t.cashierName}</Text>
                  <Text size="xs" c="dimmed">
                    {t.cashierName}
                  </Text>
                </Table.Td>

                <Table.Td ta="right">
                  <Text size="sm" fw={600}>
                    {t.itemCount}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Badge
                    size="sm"
                    variant="outline"
                    color={pmColor(t.paymentMethod)}
                  >
                    {t.paymentMethod}
                  </Badge>
                </Table.Td>

                <Table.Td ta="right">
                  {hasDiscount ? (
                    <Tooltip
                      withArrow
                      label={`Regular: ${formatCurrency(
                        t.regularDiscount ?? 0
                      )} • Special: ${formatCurrency(
                        t.specialDiscount ?? 0
                      )} • Total: ${formatCurrency(t.discountAmount ?? 0)}`}
                    >
                      <Badge
                        size="sm"
                        variant={emphasizeDiscounts ? "filled" : "light"}
                        color="violet"
                      >
                        {formatCurrency(t.discountAmount ?? 0)}
                      </Badge>
                    </Tooltip>
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>

                <Table.Td ta="right">
                  <Group gap={6} justify="end" wrap="nowrap">
                    <IconCurrencyPeso size={14} />
                    <Text fw={700}>{formatCurrency(t.totalAmount)}</Text>
                  </Group>
                  {typeof t.vatAmount === "number" ? (
                    <Text size="xs" c="dimmed">
                      VAT: {formatCurrency(t.vatAmount)}
                    </Text>
                  ) : null}
                </Table.Td>

                <Table.Td>
                  {t.isVoided ? (
                    <Badge color="red" variant="filled" size="sm">
                      Voided
                    </Badge>
                  ) : showVoidedBadge ? (
                    <Badge color="green" variant="light" size="sm">
                      Completed
                    </Badge>
                  ) : (
                    <Badge
                      color={hasDiscount ? "violet" : "green"}
                      variant="light"
                      size="sm"
                    >
                      {hasDiscount ? "Discounted" : "Completed"}
                    </Badge>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </div>
  );
}

function ListPager({
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: {
  hasNextPage: boolean;
  fetchNextPage: () => any;
  isFetchingNextPage: boolean;
}) {
  return (
    <Group p="md" justify="center">
      {hasNextPage ? (
        <Button
          onClick={() => fetchNextPage()}
          loading={isFetchingNextPage}
          variant="light"
        >
          Load more
        </Button>
      ) : (
        <Text c="dimmed" size="sm">
          End of results
        </Text>
      )}
    </Group>
  );
}

/* ------------------ Details Modal ------------------ */

function TransactionDetailsModal({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error } = useTransaction(id || "", {
    enabled: !!id,
  });

  const t = data;

  return (
    <Modal
      opened={!!id}
      onClose={onClose}
      title={<Text fw={700}>Transaction Details</Text>}
      size="lg"
      centered
      withinPortal
      padding="md"
    >
      {!id ? null : isLoading ? (
        <Stack gap="sm">
          <Skeleton height={12} />
          <Skeleton height={12} width="60%" />
          <Skeleton height={200} />
        </Stack>
      ) : isError ? (
        <Alert color="red" title="Failed to load">
          {(error as any)?.message ?? "Unknown error"}
        </Alert>
      ) : !t ? null : (
        <Stack gap="md">
          <Group gap="md" wrap="wrap">
            <Group gap={6}>
              <Text size="sm" c="dimmed">
                Receipt #
              </Text>
              <Code>{t.receiptNumber}</Code>
            </Group>
            <Divider orientation="vertical" />
            <Group gap={6}>
              <Text size="sm" c="dimmed">
                Date
              </Text>
              <Text size="sm">
                {new Date(t.transactionDate).toLocaleString()}
              </Text>
            </Group>
            <Divider orientation="vertical" />
            <Group gap={6}>
              <Text size="sm" c="dimmed">
                Cashier
              </Text>
              <Text size="sm">{t.cashierName}</Text>
            </Group>
            <Divider orientation="vertical" />
            <Group gap={6}>
              <Badge variant="outline" color={pmColor(t.paymentMethod)}>
                {t.paymentMethod}
              </Badge>
              {t.referenceNumber ? (
                <Text size="xs" c="dimmed">
                  Ref: {t.referenceNumber}
                </Text>
              ) : null}
              {t.isVoided ? (
                <Badge color="red" variant="filled">
                  Voided
                </Badge>
              ) : null}
            </Group>
          </Group>

          <ScrollArea.Autosize mah={320} type="auto">
            <Table striped withColumnBorders highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Item</Table.Th>
                  <Table.Th style={{ width: 110 }} ta="right">
                    Qty
                  </Table.Th>
                  <Table.Th style={{ width: 140 }} ta="right">
                    Unit Price
                  </Table.Th>
                  <Table.Th style={{ width: 140 }} ta="right">
                    Line Total
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(t.items ?? []).map((it) => (
                  <Table.Tr key={it.id}>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text size="sm" fw={600}>
                          {it.itemName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {it.itemType}
                          {it.barcode ? ` • ${it.barcode}` : ""}
                          {it.batchNumber ? ` • Batch: ${it.batchNumber}` : ""}
                          {it.expirationDate
                            ? ` • Exp: ${new Date(
                                it.expirationDate
                              ).toLocaleDateString()}`
                            : ""}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm">{it.quantity}</Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      {formatCurrency(it.unitPrice)}
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text fw={600}>{formatCurrency(it.lineTotal)}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea.Autosize>

          <Paper withBorder p="sm">
            <Stack gap={6}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Subtotal
                </Text>
                <Text size="sm">{formatCurrency(t.subTotal ?? 0)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Regular Discount
                </Text>
                <Text size="sm">{formatCurrency(t.regularDiscount ?? 0)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Special Discount
                </Text>
                <Text size="sm">{formatCurrency(t.specialDiscount ?? 0)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Total Discount
                </Text>
                <Text size="sm" fw={600}>
                  {formatCurrency(t.discountAmount ?? 0)}
                </Text>
              </Group>
              {"vatAmount" in t && typeof t.vatAmount === "number" && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    VAT
                  </Text>
                  <Text size="sm">{formatCurrency(t.vatAmount)}</Text>
                </Group>
              )}
              <Divider my={4} />
              <Group justify="space-between">
                <Text fw={700}>Grand Total</Text>
                <Group gap={6}>
                  <IconCurrencyPeso size={16} />
                  <Text fw={800}>{formatCurrency(t.totalAmount)}</Text>
                </Group>
              </Group>
              {typeof t.changeAmount === "number" && t.changeAmount > 0 && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Change
                  </Text>
                  <Text size="sm">{formatCurrency(t.changeAmount)}</Text>
                </Group>
              )}
              {t.isVoided && (
                <>
                  <Divider my={4} />
                  <Group gap={8}>
                    <Badge color="red">Voided</Badge>
                    {t.voidedAt ? (
                      <Text size="sm" c="dimmed">
                        {new Date(t.voidedAt).toLocaleString()}
                      </Text>
                    ) : null}
                  </Group>
                  {t.voidReason ? (
                    <Text size="sm">Reason: {t.voidReason}</Text>
                  ) : null}
                  {t.voidedBy ? (
                    <Text size="sm" c="dimmed">
                      By: {t.voidedBy}
                    </Text>
                  ) : null}
                </>
              )}
            </Stack>
          </Paper>
        </Stack>
      )}
    </Modal>
  );
}
