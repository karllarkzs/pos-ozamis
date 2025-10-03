import { useState, useCallback } from "react";
import { useForm } from "@mantine/form";
import {
  Modal,
  Button,
  Group,
  Text,
  ScrollArea,
  Divider,
  SimpleGrid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconDeviceFloppy } from "@tabler/icons-react";
import { ReagentEntryCard } from "./ReagentEntryCard";
import { useCreateReagentsBatch } from "../hooks/api/useReagents";

interface BulkAddReagentModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ReagentRow {
  id: string;
  name: string;
  reagentType: 0 | 1 | "ChargeBased" | "VolumeBased";
  quantity: number | "";
  minimumStock: number | "";
  unitCost: number | "";
  expirationDate: Date | null | string;
  batchNumber: string;
  currentCharges?: number | "";
  currentVolume?: number | "";
  unitOfMeasure?: string;
}

const createEmptyRow = (): ReagentRow => ({
  id: Math.random().toString(36).substr(2, 9),
  name: "",
  reagentType: 0,
  quantity: "",
  minimumStock: "",
  unitCost: "",
  expirationDate: null,
  batchNumber: "",
  currentCharges: "",
  currentVolume: "",
  unitOfMeasure: "mL",
});

export function BulkAddReagentModal({
  opened,
  onClose,
  onSuccess,
}: BulkAddReagentModalProps) {
  const [reagents, setReagents] = useState<ReagentRow[]>([createEmptyRow()]);
  const createBatch = useCreateReagentsBatch();

  const form = useForm({
    initialValues: { reagents },
    validate: {
      reagents: {
        name: (value: string) => {
          if (!value?.trim()) return "Name is required";
          if (value.length < 3) return "Name must be at least 3 characters";
          if (value.length > 200) return "Name must be 200 characters or less";
          return null;
        },
        quantity: (value: number | "") => {
          if (value === "" || value === null || value === undefined)
            return "Required";
          if (typeof value === "number" && value < 1)
            return "Must be at least 1";
          return null;
        },
        minimumStock: (value: number | "") => {
          if (value === "" || value === null || value === undefined)
            return "Required";
          if (typeof value === "number" && value < 1)
            return "Must be at least 1";
          return null;
        },
        unitCost: (value: number | "") => {
          if (value === "" || value === null || value === undefined)
            return "Required";
          if (typeof value === "number" && (value < 0.01 || value > 999999.99))
            return "Must be between 0.01 and 999,999.99";
          return null;
        },
        currentCharges: (
          value: number | "" | undefined,
          values: any,
          path: string
        ) => {
          const index = parseInt(path.split(".")[1]);
          const reagent = reagents[index];
          const isChargeBased =
            reagent.reagentType === 0 || reagent.reagentType === "ChargeBased";

          if (isChargeBased) {
            if (value === "" || value === null || value === undefined)
              return "Required for charge-based";
            if (typeof value === "number" && value < 1)
              return "Must be at least 1";
          }
          return null;
        },
        currentVolume: (
          value: number | "" | undefined,
          values: any,
          path: string
        ) => {
          const index = parseInt(path.split(".")[1]);
          const reagent = reagents[index];
          const isVolumeBased =
            reagent.reagentType === 1 || reagent.reagentType === "VolumeBased";

          if (isVolumeBased) {
            if (value === "" || value === null || value === undefined)
              return "Required for volume-based";
            if (typeof value === "number" && value < 0.01)
              return "Must be at least 0.01";
          }
          return null;
        },
        batchNumber: (value: string) => {
          if (value && value.length > 50)
            return "Batch number must be 50 characters or less";
          return null;
        },
      },
    },
  });

  const addRow = useCallback(() => {
    const newReagents = [...reagents, createEmptyRow()];
    setReagents(newReagents);
    form.setFieldValue("reagents", newReagents);
  }, [reagents, form]);

  const removeRow = useCallback(
    (index: number) => {
      if (reagents.length <= 1) return;
      const newReagents = reagents.filter((_, i) => i !== index);
      setReagents(newReagents);
      form.setFieldValue("reagents", newReagents);
    },
    [reagents, form]
  );

  const updateReagent = useCallback(
    (index: number, field: keyof ReagentRow, value: any) => {
      const newReagents = [...reagents];
      newReagents[index] = { ...newReagents[index], [field]: value };
      setReagents(newReagents);
      form.setFieldValue(`reagents.${index}.${field}`, value);
    },
    [reagents, form]
  );

  const handleSubmit = async () => {
    const validation = form.validate();
    if (validation.hasErrors) {
      notifications.show({
        title: "Validation Error",
        message: "Please fix all errors before submitting",
        color: "red",
      });
      return;
    }

    try {
      const reagentData = reagents.map((reagent) => {
        const isChargeBased =
          reagent.reagentType === 0 || reagent.reagentType === "ChargeBased";

        const baseData = {
          name: reagent.name.trim(),
          reagentType: isChargeBased
            ? ("charge-based" as const)
            : ("volume-based" as const),
          quantity: Number(reagent.quantity),
          minimumStock: Number(reagent.minimumStock),
          unitCost: Number(reagent.unitCost),
          expirationDate: reagent.expirationDate
            ? typeof reagent.expirationDate === "string"
              ? reagent.expirationDate
              : reagent.expirationDate.toISOString()
            : undefined,
          batchNumber: reagent.batchNumber?.trim() || undefined,
        };

        if (isChargeBased) {
          return {
            ...baseData,
            chargesPerUnit: Number(reagent.currentCharges),
          };
        } else {
          return {
            ...baseData,
            volume: Number(reagent.currentVolume),
            unitOfMeasure: reagent.unitOfMeasure || "mL",
          };
        }
      });

      const response = await createBatch.mutateAsync({
        reagents: reagentData,
        validateDuplicates: true,
        continueOnError: false,
      });

      notifications.show({
        title: "Success",
        message: `Successfully added ${response.data.totalCreated} reagent${
          response.data.totalCreated > 1 ? "s" : ""
        }`,
        color: "green",
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create reagents";
      const errors = error.response?.data?.failedReagents || [];

      notifications.show({
        title: "Error",
        message:
          errors.length > 0
            ? `${errorMessage}. ${errors.length} reagent(s) failed.`
            : errorMessage,
        color: "red",
      });
    }
  };

  const handleClose = () => {
    setReagents([createEmptyRow()]);
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text size="lg" fw={600}>
          Add Reagents (Bulk Entry)
        </Text>
      }
      size="100%"
      centered
      styles={{
        body: {
          padding: 0,
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        },
        header: { padding: "var(--mantine-spacing-md)" },
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: "var(--mantine-spacing-sm)",
        }}
      >
        <Group justify="space-between" mb="sm">
          <Text size="sm" c="dimmed">
            Add multiple reagents at once. Choose charge-based (discrete units)
            or volume-based (continuous volume) for each reagent.
          </Text>
          <Button
            leftSection={<IconPlus size={16} />}
            variant="light"
            size="sm"
            onClick={addRow}
          >
            Add Reagent
          </Button>
        </Group>

        <Divider mb="sm" />

        <ScrollArea flex={1} offsetScrollbars style={{ padding: "0.75rem" }}>
          <SimpleGrid cols={{ base: 1, sm: 1, lg: 2 }} spacing="md">
            {reagents.map((reagent, index) => (
              <ReagentEntryCard
                key={reagent.id}
                index={index}
                reagent={reagent}
                onUpdate={(index, field, value) =>
                  updateReagent(index, field as keyof ReagentRow, value)
                }
                onRemove={removeRow}
                errors={form.errors}
                showRemove={reagents.length > 1}
              />
            ))}
          </SimpleGrid>
        </ScrollArea>

        <Divider mt="sm" mb="sm" />

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {reagents.length} reagent{reagents.length > 1 ? "s" : ""} to add
          </Text>
          <Group>
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSubmit}
              loading={createBatch.isPending}
              disabled={reagents.length === 0}
            >
              Add All Reagents
            </Button>
          </Group>
        </Group>
      </div>
    </Modal>
  );
}
