import { useState } from "react";
import {
  Modal,
  Stack,
  NumberInput,
  Select,
  Textarea,
  Button,
  Group,
  Text,
  Paper,
  Badge,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAdjustments,
  IconAlertCircle,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiEndpoints } from "../lib/api";
import type { Product } from "../lib/api";

interface StockAdjustmentModalProps {
  opened: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export function StockAdjustmentModal({
  opened,
  onClose,
  product,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [quantityChange, setQuantityChange] = useState<number | string>(0);
  const [adjustmentType, setAdjustmentType] = useState<string>("Oversight");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const adjustStockMutation = useMutation({
    mutationFn: (data: {
      productId: string;
      quantityChange: number;
      adjustmentType: string;
      reason: string;
    }) =>
      apiEndpoints.products.adjustStock(data.productId, {
        quantityChange: data.quantityChange,
        adjustmentType: data.adjustmentType,
        reason: data.reason,
      }),
  });

  const handleClose = () => {
    if (!isSubmitting) {
      setQuantityChange(0);
      setAdjustmentType("Oversight");
      setReason("");
      onClose();
    }
  };

  const getNewQuantity = () => {
    if (!product) return 0;
    const change = typeof quantityChange === "number" ? quantityChange : 0;
    return product.quantity + change;
  };

  const isValid = () => {
    if (!product) return false;
    const change = typeof quantityChange === "number" ? quantityChange : 0;
    if (change === 0) return false;
    if (!reason.trim()) return false;
    if (getNewQuantity() < 0) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!product || !isValid()) return;

    try {
      setIsSubmitting(true);

      await adjustStockMutation.mutateAsync({
        productId: product.id,
        quantityChange: typeof quantityChange === "number" ? quantityChange : 0,
        adjustmentType,
        reason: reason.trim(),
      });

      notifications.show({
        title: "Success",
        message: `Stock adjusted successfully for ${product.brand}`,
        color: "green",
      });

      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess();
      handleClose();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error?.response?.data?.error || "Failed to adjust stock",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  const newQuantity = getNewQuantity();
  const wouldBeNegative = newQuantity < 0;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconAdjustments size={20} />
          <Text fw={600}>Adjust Stock</Text>
        </Group>
      }
      size="md"
    >
      <Stack gap="md">
        <Paper p="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Product
            </Text>
            <Text fw={500}>{product.brand}</Text>
            {product.generic && (
              <Text size="sm" c="dimmed">
                {product.generic}
              </Text>
            )}
            <Group gap="xs" mt="xs">
              <Text size="sm" c="dimmed">
                Current Stock:
              </Text>
              <Badge
                color={
                  product.quantity === 0
                    ? "red"
                    : product.isLowStock
                    ? "yellow"
                    : "green"
                }
              >
                {product.quantity}
              </Badge>
            </Group>
          </Stack>
        </Paper>

        <NumberInput
          label="Quantity Change"
          description="Enter positive number to add stock, negative to remove"
          placeholder="e.g., 10 or -5"
          value={quantityChange}
          onChange={setQuantityChange}
          allowNegative
          required
          leftSection={
            typeof quantityChange === "number" && quantityChange > 0 ? "+" : ""
          }
        />

        <Select
          label="Adjustment Type"
          placeholder="Select reason type"
          value={adjustmentType}
          onChange={(value) => setAdjustmentType(value || "Oversight")}
          data={[
            {
              value: "Oversight",
              label: "Oversight - Counting Error Correction",
            },
            { value: "Damaged", label: "Damaged - Items Damaged/Unusable" },
            { value: "Returned", label: "Returned - Returned to Supplier" },
          ]}
          required
        />

        <Textarea
          label="Reason"
          placeholder="Detailed explanation for this adjustment (required)"
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          minRows={3}
          maxLength={500}
          required
        />

        {typeof quantityChange === "number" && quantityChange !== 0 && (
          <Paper p="md" withBorder bg={wouldBeNegative ? "red.0" : "blue.0"}>
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                New Stock Level:
              </Text>
              <Badge size="lg" color={wouldBeNegative ? "red" : "blue"}>
                {product.quantity} {quantityChange > 0 ? "+" : ""}
                {quantityChange} = {newQuantity}
              </Badge>
            </Group>
          </Paper>
        )}

        {wouldBeNegative && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Invalid Adjustment"
            color="red"
          >
            This adjustment would result in negative stock. Please adjust the
            quantity change.
          </Alert>
        )}

        {typeof quantityChange === "number" &&
          quantityChange === 0 &&
          reason.trim() && (
            <Alert icon={<IconAlertCircle size={16} />} color="yellow">
              Quantity change cannot be zero.
            </Alert>
          )}

        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!isValid()}
          >
            Adjust Stock
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
