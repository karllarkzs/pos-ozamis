import { useState, useMemo, useCallback } from "react";
import {
  Modal,
  Text,
  Badge,
  Group,
  Stack,
  Paper,
  Divider,
  ActionIcon,
  Tooltip,
  Table,
  Button,
  TextInput,
  Textarea,
} from "@mantine/core";
import {
  IconReceipt,
  IconPrinter,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { DataTable, DataTableColumn } from "./DataTable";
import {
  useInfiniteTransactions,
  useVoidTransaction,
  useTransaction,
} from "../hooks/api/useTransactions";
import { Transaction, TransactionItemResponse } from "../lib/api";
import { formatCurrency } from "../utils/currency";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

function getTodayDateRange() {
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  return {
    startDate: formatLocalDate(startOfDay),
    endDate: formatLocalDate(endOfDay),
  };
}

type TransactionListItem = {
  id: string;
  receiptNumber: string;
  transactionDate: string;
  processedBy: string;
  cashierId: string;
  cashierName: string;
  totalAmount: number;
  paymentMethod: "Cash" | "GCash";
  isVoided: boolean;
  itemCount: number;
};

interface TransactionListModalProps {
  opened: boolean;
  onClose: () => void;
}

export function TransactionListModal({
  opened,
  onClose,
}: TransactionListModalProps) {
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const voidTransaction = useVoidTransaction();

  const todayRange = useMemo(() => getTodayDateRange(), []);

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteTransactions({
    startDate: todayRange.startDate,
    endDate: todayRange.endDate,
    includeVoided: true,
    sortBy: "transactionDate",
    sortDirection: "desc",
    pageSize: 50,
  });

  const { data: selectedTransaction } = useTransaction(
    selectedTransactionId || "",
    {
      enabled: !!selectedTransactionId,
    }
  );

  const transactions = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  const handleRowClick = useCallback((transaction: TransactionListItem) => {
    setSelectedTransactionId(transaction.id);
  }, []);

  const handlePrint = useCallback((transaction: Transaction) => {
    console.log("=== PRINTING RECEIPT ===");
    console.log("Transaction:", transaction);
    console.log("Items:", transaction.items);
    console.log("========================");

    notifications.show({
      title: "Print Receipt",
      message: `Receipt #${transaction.receiptNumber} logged to console`,
      color: "blue",
    });
  }, []);

  const handleVoid = useCallback(
    (transaction: Transaction) => {
      if (transaction.isVoided) {
        notifications.show({
          title: "Already Voided",
          message: "This transaction has already been voided",
          color: "orange",
        });
        return;
      }

      modals.open({
        title: "Void Transaction",
        centered: true,
        children: (
          <VoidConfirmationDialog
            transaction={transaction}
            onConfirm={async (voidReason: string) => {
              try {
                await voidTransaction.mutateAsync({
                  id: transaction.id,
                  voidRequest: { voidReason },
                });

                notifications.show({
                  title: "Success",
                  message: `Transaction #${transaction.receiptNumber} has been voided`,
                  color: "green",
                });

                modals.closeAll();
                setSelectedTransactionId(null);
                refetch();
              } catch (error: any) {
                notifications.show({
                  title: "Error",
                  message:
                    error.response?.data?.message ||
                    "Failed to void transaction",
                  color: "red",
                });
              }
            }}
          />
        ),
      });
    },
    [voidTransaction, refetch]
  );

  const columns: DataTableColumn<TransactionListItem>[] = useMemo(
    () => [
      {
        key: "receiptNumber",
        title: "Receipt #",
        width: 140,
        render: (item) => (
          <Text size="sm" fw={500} ff="monospace">
            {item.receiptNumber}
          </Text>
        ),
      },
      {
        key: "transactionDate",
        title: "Time",
        width: 100,
        render: (item) => (
          <Text size="sm">
            {new Date(item.transactionDate).toLocaleTimeString("en-PH", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        ),
      },
      {
        key: "cashierName",
        title: "Cashier",
        width: 150,
        render: (item) => <Text size="sm">{item.cashierName}</Text>,
      },
      {
        key: "totalAmount",
        title: "Total",
        width: 110,
        align: "right",
        headerAlign: "right",
        render: (item) => (
          <Text size="sm" fw={500}>
            {formatCurrency(item.totalAmount)}
          </Text>
        ),
      },
      {
        key: "paymentMethod",
        title: "Payment",
        width: 80,
        render: (item) => (
          <Badge
            size="sm"
            variant="light"
            color={item.paymentMethod === "Cash" ? "green" : "blue"}
          >
            {item.paymentMethod}
          </Badge>
        ),
      },
      {
        key: "itemCount",
        title: "Items",
        width: 60,
        align: "center",
        headerAlign: "center",
        render: (item) => (
          <Badge size="sm" variant="outline">
            {item.itemCount}
          </Badge>
        ),
      },
      {
        key: "isVoided",
        title: "Status",
        width: 80,
        render: (item) =>
          item.isVoided ? (
            <Badge size="sm" color="red" variant="filled">
              VOIDED
            </Badge>
          ) : (
            <Badge size="sm" color="green" variant="light">
              Complete
            </Badge>
          ),
      },
    ],
    []
  );

  const getRowStyle = useCallback(
    (item: TransactionListItem): React.CSSProperties => ({
      backgroundColor:
        selectedTransactionId === item.id
          ? "var(--mantine-color-blue-0)"
          : undefined,
      cursor: "pointer",
    }),
    [selectedTransactionId]
  );

  const handleClose = () => {
    setSelectedTransactionId(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconReceipt size={20} />
          <Text size="lg" fw={600}>
            Today's Transactions
          </Text>
          <Badge variant="light">{transactions.length}</Badge>
        </Group>
      }
      size={selectedTransaction ? "95%" : "70%"}
      styles={{
        body: {
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
        },
      }}
    >
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        {/* Left side - Transaction List */}
        <div
          style={{
            flex: selectedTransaction ? "0 0 550px" : 1,
            borderRight: selectedTransaction
              ? "1px solid var(--mantine-color-gray-3)"
              : undefined,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "1rem", paddingBottom: "0.5rem" }}>
            <Text size="sm" c="dimmed">
              Showing all transactions for{" "}
              {new Date().toLocaleDateString("en-PH")}
            </Text>
          </div>

          <DataTable
            data={transactions}
            columns={columns}
            loading={isLoading || isFetchingNextPage}
            hasMore={hasNextPage}
            onLoadMore={fetchNextPage}
            emptyMessage="No transactions found for today"
            stickyHeader
            height="calc(80vh - 60px)"
            onRowClick={handleRowClick}
            getRowStyle={getRowStyle}
          />
        </div>

        {/* Right side - Transaction Details */}
        {selectedTransaction && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
              padding: "1rem",
            }}
          >
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={600}>
                Transaction Details
              </Text>
              <Group gap="xs">
                <Tooltip label="Print Receipt">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    size="lg"
                    onClick={() => handlePrint(selectedTransaction)}
                  >
                    <IconPrinter size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip
                  label={
                    selectedTransaction.isVoided
                      ? "Already Voided"
                      : "Void Transaction"
                  }
                >
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="lg"
                    onClick={() => handleVoid(selectedTransaction)}
                    disabled={selectedTransaction.isVoided}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Tooltip>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  onClick={() => setSelectedTransactionId(null)}
                >
                  <IconX size={18} />
                </ActionIcon>
              </Group>
            </Group>

            <Stack gap="md">
              {/* Receipt Info */}
              <Paper withBorder p="md">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Receipt Number
                    </Text>
                    <Text size="sm" fw={500} ff="monospace">
                      {selectedTransaction.receiptNumber}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Date & Time
                    </Text>
                    <Text size="sm" fw={500}>
                      {new Date(
                        selectedTransaction.transactionDate
                      ).toLocaleString("en-PH")}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Cashier
                    </Text>
                    <Text size="sm" fw={500}>
                      {selectedTransaction.cashierName}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Payment Method
                    </Text>
                    <Badge
                      color={
                        selectedTransaction.paymentMethod === "Cash"
                          ? "green"
                          : "blue"
                      }
                    >
                      {selectedTransaction.paymentMethod}
                    </Badge>
                  </Group>
                  {selectedTransaction.gcashReference && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        GCash Reference
                      </Text>
                      <Text size="sm" fw={500} ff="monospace">
                        {selectedTransaction.gcashReference}
                      </Text>
                    </Group>
                  )}
                  {selectedTransaction.isVoided && (
                    <>
                      <Divider />
                      <Badge color="red" size="lg" variant="filled" fullWidth>
                        TRANSACTION VOIDED
                      </Badge>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Void Reason
                        </Text>
                        <Text size="sm">{selectedTransaction.voidReason}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Voided By
                        </Text>
                        <Text size="sm">{selectedTransaction.voidedBy}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Voided At
                        </Text>
                        <Text size="sm">
                          {selectedTransaction.voidedAt
                            ? new Date(
                                selectedTransaction.voidedAt
                              ).toLocaleString("en-PH")
                            : "N/A"}
                        </Text>
                      </Group>
                    </>
                  )}
                </Stack>
              </Paper>

              {/* Items */}
              <Paper withBorder p="md">
                <Text size="sm" fw={600} mb="sm">
                  Items ({selectedTransaction.items?.length || 0})
                </Text>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Item</Table.Th>
                      <Table.Th style={{ textAlign: "center" }}>Qty</Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>
                        Unit Price
                      </Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>Total</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedTransaction.items?.map(
                      (item: TransactionItemResponse) => (
                        <Table.Tr key={item.id}>
                          <Table.Td>
                            <div>
                              <Text size="sm" fw={500}>
                                {item.itemName}
                              </Text>
                              <Group gap="xs">
                                <Badge size="xs" variant="outline">
                                  {item.itemType}
                                </Badge>
                                {item.barcode && (
                                  <Text size="xs" c="dimmed" ff="monospace">
                                    {item.barcode}
                                  </Text>
                                )}
                              </Group>
                            </div>
                          </Table.Td>
                          <Table.Td style={{ textAlign: "center" }}>
                            <Text size="sm">{item.quantity}</Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: "right" }}>
                            <Text size="sm">
                              {formatCurrency(item.unitPrice)}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: "right" }}>
                            <Text size="sm" fw={500}>
                              {formatCurrency(item.lineTotal)}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>

              {/* Totals */}
              <Paper withBorder p="md">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm">Subtotal</Text>
                    <Text size="sm">
                      {formatCurrency(selectedTransaction.subTotal)}
                    </Text>
                  </Group>
                  {selectedTransaction.regularDiscount > 0 && (
                    <Group justify="space-between">
                      <Text size="sm">Regular Discount</Text>
                      <Text size="sm" c="orange">
                        -{formatCurrency(selectedTransaction.regularDiscount)}
                      </Text>
                    </Group>
                  )}
                  {selectedTransaction.specialDiscount > 0 && (
                    <Group justify="space-between">
                      <Text size="sm">Special Discount</Text>
                      <Text size="sm" c="orange">
                        -{formatCurrency(selectedTransaction.specialDiscount)}
                      </Text>
                    </Group>
                  )}
                  <Group justify="space-between">
                    <Text size="sm">VAT (12%)</Text>
                    <Text size="sm">
                      {formatCurrency(selectedTransaction.vatAmount)}
                    </Text>
                  </Group>
                  <Divider />
                  <Group justify="space-between">
                    <Text size="md" fw={700}>
                      Total Amount
                    </Text>
                    <Text size="md" fw={700}>
                      {formatCurrency(selectedTransaction.totalAmount)}
                    </Text>
                  </Group>
                  {selectedTransaction.cashInHand && (
                    <>
                      <Group justify="space-between">
                        <Text size="sm">Cash Received</Text>
                        <Text size="sm">
                          {formatCurrency(selectedTransaction.cashInHand)}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm">Change</Text>
                        <Text size="sm" c="green" fw={500}>
                          {formatCurrency(selectedTransaction.changeAmount)}
                        </Text>
                      </Group>
                    </>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </div>
        )}
      </div>
    </Modal>
  );
}

// Void Confirmation Dialog Component
function VoidConfirmationDialog({
  transaction,
  onConfirm,
}: {
  transaction: Transaction;
  onConfirm: (voidReason: string) => Promise<void>;
}) {
  const [voidReason, setVoidReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!voidReason.trim()) {
      notifications.show({
        title: "Validation Error",
        message: "Please provide a reason for voiding this transaction",
        color: "red",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(voidReason.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        You are about to void transaction{" "}
        <Text component="span" fw={600} ff="monospace">
          #{transaction.receiptNumber}
        </Text>{" "}
        for{" "}
        <Text component="span" fw={600}>
          {formatCurrency(transaction.totalAmount)}
        </Text>
        . This action cannot be undone.
      </Text>

      <Textarea
        label="Void Reason"
        placeholder="Enter reason for voiding this transaction..."
        required
        minRows={3}
        maxLength={200}
        value={voidReason}
        onChange={(e) => setVoidReason(e.currentTarget.value)}
      />

      <Group justify="flex-end" gap="sm">
        <Button variant="subtle" onClick={() => modals.closeAll()}>
          Cancel
        </Button>
        <Button
          color="red"
          onClick={handleConfirm}
          loading={isSubmitting}
          disabled={!voidReason.trim()}
        >
          Void Transaction
        </Button>
      </Group>
    </Stack>
  );
}
