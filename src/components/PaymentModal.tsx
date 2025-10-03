import { useState, useEffect } from "react";
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  SegmentedControl,
  NumberInput,
  TextInput,
  Paper,
  Divider,
  Alert,
  Badge,
  Loader,
} from "@mantine/core";
import {
  IconCash,
  IconCreditCard,
  IconAlertCircle,
  IconCheck,
  IconReceipt,
} from "@tabler/icons-react";
import { formatCurrency } from "../utils/currency";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: {
    paymentMethod: "Cash" | "GCash";
    gcashReference?: string;
    cashInHand?: number;
  }) => Promise<void>;
  isProcessing: boolean;
  transactionSummary: {
    subtotal: number;
    regularDiscount: number;
    specialDiscount: number;
    vat: number;
    total: number;
  };
}

export function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  transactionSummary,
}: PaymentModalProps) {
  const discountAmount =
    transactionSummary.regularDiscount + transactionSummary.specialDiscount;
  const taxableAmount = Math.max(
    0,
    transactionSummary.subtotal - discountAmount
  );
  const correctVAT = taxableAmount * 0.12;
  const correctTotal = taxableAmount + correctVAT;

  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "GCash">("Cash");
  const [cashInHand, setCashInHand] = useState<number>(correctTotal);
  const [gcashReference, setGcashReference] = useState("");
  const [error, setError] = useState("");
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [hasInteractedWithReference, setHasInteractedWithReference] =
    useState(false);

  useEffect(() => {
    if (isOpen) {
      setCashInHand(correctTotal);
      setError("");
      setHasAttemptedSubmit(false);
      setHasInteractedWithReference(false);
      setGcashReference("");
    }
  }, [isOpen, correctTotal]);

  
  useEffect(() => {
    setHasInteractedWithReference(false);
    setHasAttemptedSubmit(false);
    setError("");
  }, [paymentMethod]);

  const changeAmount =
    paymentMethod === "Cash" ? Math.max(0, cashInHand - correctTotal) : 0;

  const isInsufficientCash =
    paymentMethod === "Cash" && cashInHand < correctTotal;
  const isInvalidGCash = paymentMethod === "GCash" && !gcashReference.trim();
  const shouldShowGCashError =
    isInvalidGCash && (hasAttemptedSubmit || hasInteractedWithReference);
  const canConfirm = !isInsufficientCash && !isInvalidGCash && !isProcessing;

  const handleConfirm = async () => {
    setError("");
    setHasAttemptedSubmit(true);

    try {
      if (paymentMethod === "Cash" && cashInHand < correctTotal) {
        setError(`Insufficient cash. Need ${formatCurrency(correctTotal)}`);
        return;
      }

      if (paymentMethod === "GCash" && !gcashReference.trim()) {
        setError("GCash reference number is required");
        return;
      }

      await onConfirm({
        paymentMethod,
        gcashReference: paymentMethod === "GCash" ? gcashReference : undefined,
        cashInHand: paymentMethod === "Cash" ? cashInHand : undefined,
      });

      setCashInHand(correctTotal);
      setGcashReference("");
      setError("");
    } catch (error: any) {
      setError(error.message || "Payment processing failed");
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setError("");
      onClose();
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconReceipt size={20} />
          <Text fw={600}>Process Payment</Text>
        </Group>
      }
      size="md"
      centered
      closeOnClickOutside={!isProcessing}
      closeOnEscape={!isProcessing}
    >
      <Stack gap="md">
        {}
        <Paper p="md" bg="gray.0" radius="md">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm">Subtotal</Text>
              <Text size="sm">
                {formatCurrency(transactionSummary.subtotal)}
              </Text>
            </Group>

            {transactionSummary.regularDiscount > 0 && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Regular Discount (10%)
                </Text>
                <Text size="sm" c="dimmed">
                  -{formatCurrency(transactionSummary.regularDiscount)}
                </Text>
              </Group>
            )}

            {transactionSummary.specialDiscount > 0 && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Special Discount
                </Text>
                <Text size="sm" c="dimmed">
                  -{formatCurrency(transactionSummary.specialDiscount)}
                </Text>
              </Group>
            )}

            <Group justify="space-between">
              <Text size="sm">VAT (12%)</Text>
              <Text size="sm">{formatCurrency(correctVAT)}</Text>
            </Group>

            <Divider />

            <Group justify="space-between">
              <Text size="lg" fw={700}>
                Total Amount
              </Text>
              <Text size="lg" fw={700}>
                {formatCurrency(correctTotal)}
              </Text>
            </Group>
          </Stack>
        </Paper>

        {}
        <Stack gap="sm">
          <Text size="sm" fw={500}>
            Payment Method
          </Text>
          <SegmentedControl
            value={paymentMethod}
            onChange={(value) => {
              setPaymentMethod(value as "Cash" | "GCash");
              setError("");
            }}
            data={[
              {
                label: (
                  <Group gap="xs" justify="center">
                    <IconCash size={16} />
                    <Text>Cash</Text>
                  </Group>
                ),
                value: "Cash",
              },
              {
                label: (
                  <Group gap="xs" justify="center">
                    <IconCreditCard size={16} />
                    <Text>GCash</Text>
                  </Group>
                ),
                value: "GCash",
              },
            ]}
            fullWidth
            disabled={isProcessing}
          />
        </Stack>

        {}
        {paymentMethod === "Cash" && (
          <Stack gap="sm">
            <div>
              <Text size="sm" fw={500} mb="xs">
                Quick Cash Amounts (Philippine Bills)
              </Text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                }}
              >
                {[20, 50, 100, 200, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setCashInHand(amount)}
                    disabled={isProcessing}
                    fullWidth
                  >
                    ₱{amount}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">
                Cash in Hand
              </Text>
              <Group gap="xs" align="flex-start">
                <div style={{ flex: 1 }}>
                  <NumberInput
                    placeholder="Enter amount received"
                    value={cashInHand}
                    onChange={(value) => setCashInHand(Number(value) || 0)}
                    min={0}
                    step={0.01}
                    decimalScale={2}
                    fixedDecimalScale
                    leftSection="₱"
                    size="md"
                    disabled={isProcessing}
                    error={isInsufficientCash ? "Insufficient amount" : ""}
                  />
                </div>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setCashInHand(correctTotal)}
                  disabled={isProcessing}
                  px="md"
                  style={{ marginTop: 0 }}
                >
                  Exact
                </Button>
              </Group>
            </div>

            {changeAmount > 0 && (
              <Paper p="sm" bg="green.0" radius="md">
                <Group justify="space-between">
                  <Text size="sm" fw={500} c="green">
                    Change Due
                  </Text>
                  <Badge color="green" size="lg">
                    {formatCurrency(changeAmount)}
                  </Badge>
                </Group>
              </Paper>
            )}
          </Stack>
        )}

        {paymentMethod === "GCash" && (
          <TextInput
            label="GCash Reference Number"
            placeholder="Enter GCash reference (e.g., GC-2025-0115-001)"
            value={gcashReference}
            onChange={(e) => {
              setGcashReference(e.currentTarget.value);
              setHasInteractedWithReference(true);
              setError("");
            }}
            size="md"
            disabled={isProcessing}
            error={shouldShowGCashError ? "Reference number is required" : ""}
          />
        )}

        {}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        )}

        {}
        <Group justify="flex-end" gap="sm">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            leftSection={
              isProcessing ? <Loader size={16} /> : <IconCheck size={16} />
            }
          >
            {isProcessing
              ? "Processing..."
              : `Confirm Payment - ${formatCurrency(correctTotal)}`}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
