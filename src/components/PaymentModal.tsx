import { useState, useEffect } from "react";
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  Select,
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
import { useSettings } from "../store/hooks";

type PaymentMethod = "Cash" | "GCash" | "Maya" | "GoTyme";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: {
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    cashInHand?: number;
  }) => Promise<void>;
  isProcessing: boolean;
  transactionSummary: {
    subtotal: number;
    regularDiscount: number;
    specialDiscount: number;
    vat: number;
    total: number;
    discountName?: string | null;
    discountPercent?: number;
  };
}

export function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  transactionSummary,
}: PaymentModalProps) {
  const settings = useSettings();

  const correctTotal = transactionSummary.total;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [cashInHand, setCashInHand] = useState<number>(correctTotal);
  const [referenceNumber, setReferenceNumber] = useState("");
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
      setReferenceNumber("");
    }
  }, [isOpen, correctTotal]);

  useEffect(() => {
    setHasInteractedWithReference(false);
    setHasAttemptedSubmit(false);
    setError("");
  }, [paymentMethod]);

  const changeAmount =
    paymentMethod === "Cash" ? Math.max(0, cashInHand - correctTotal) : 0;

  const requiresReference = paymentMethod !== "Cash";
  const isInsufficientCash =
    paymentMethod === "Cash" && cashInHand < correctTotal;
  const isInvalidReference = requiresReference && !referenceNumber.trim();
  const shouldShowReferenceError =
    isInvalidReference && (hasAttemptedSubmit || hasInteractedWithReference);
  const canConfirm =
    !isInsufficientCash && !isInvalidReference && !isProcessing;

  const handleConfirm = async () => {
    setError("");
    setHasAttemptedSubmit(true);

    try {
      if (paymentMethod === "Cash" && cashInHand < correctTotal) {
        setError(`Insufficient cash. Need ${formatCurrency(correctTotal)}`);
        return;
      }

      if (requiresReference && !referenceNumber.trim()) {
        setError(`${paymentMethod} reference number is required`);
        return;
      }

      await onConfirm({
        paymentMethod,
        referenceNumber: requiresReference ? referenceNumber : undefined,
        cashInHand: paymentMethod === "Cash" ? cashInHand : undefined,
      });

      setCashInHand(correctTotal);
      setReferenceNumber("");
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
                  {transactionSummary.discountName || "Discount"}{" "}
                  {transactionSummary.discountPercent
                    ? `(${transactionSummary.discountPercent}%)`
                    : ""}
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

            {settings.showVat && transactionSummary.vat > 0 && (
              <Group justify="space-between">
                <Text size="sm">VAT ({settings.vatAmount}%)</Text>
                <Text size="sm">{formatCurrency(transactionSummary.vat)}</Text>
              </Group>
            )}

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
        <Select
          label="Payment Method"
          placeholder="Select payment method"
          value={paymentMethod}
          onChange={(value) => {
            setPaymentMethod(value as PaymentMethod);
            setError("");
          }}
          data={[
            { value: "Cash", label: "Cash" },
            { value: "GCash", label: "GCash" },
            { value: "Maya", label: "Maya" },
            { value: "GoTyme", label: "GoTyme" },
          ]}
          size="md"
          disabled={isProcessing}
          leftSection={
            paymentMethod === "Cash" ? (
              <IconCash size={16} />
            ) : (
              <IconCreditCard size={16} />
            )
          }
        />

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

        {requiresReference && (
          <TextInput
            label={`${paymentMethod} Reference Number`}
            placeholder={`Enter ${paymentMethod} reference (e.g., ${paymentMethod}-2025-0115-001)`}
            value={referenceNumber}
            onChange={(e) => {
              setReferenceNumber(e.currentTarget.value);
              setHasInteractedWithReference(true);
              setError("");
            }}
            size="md"
            disabled={isProcessing}
            error={
              shouldShowReferenceError ? "Reference number is required" : ""
            }
            required
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
