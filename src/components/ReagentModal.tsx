import { useState, useEffect } from "react";
import { useForm } from "@mantine/form";
import {
  Modal,
  TextInput,
  NumberInput,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Divider,
  Badge,
  Alert,
  Loader,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconFlask, IconDeviceFloppy } from "@tabler/icons-react";
import {
  CreateReagentRequest,
  UpdateReagentRequest,
  ReagentType,
} from "../lib/api";
import {
  useCreateReagent,
  useUpdateReagent,
  useReagent,
} from "../hooks/api/useReagents";

interface ReagentModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reagentId?: string;
  mode: "create" | "edit";
}

interface ReagentFormValues {
  name: string;

  reagentType: ReagentType;

  
  quantity: number | "";
  currentCharges: number | "";

  
  volume: number | "";
  unitOfMeasure: string;

  
  minimumStock: number | "";
  unitCost: number | "";
  expirationDate: Date | null;
  batchNumber: string;
}

const createEmptyFormValues = (): ReagentFormValues => ({
  name: "",
  reagentType: "ChargeBased",
  quantity: "",
  currentCharges: 1,
  volume: "",
  unitOfMeasure: "mL",
  minimumStock: "",
  unitCost: "",
  expirationDate: null,
  batchNumber: "",
});

const reagentTypeOptions = [
  { value: "ChargeBased", label: "Charge Based (Discrete Units with Charges)" },
  { value: "VolumeBased", label: "Volume Based (Containers with Volume)" },
];

const unitOfMeasureOptions = [
  "mL",
  "L",
  "g",
  "kg",
  "oz",
  "lb",
  "units",
  "drops",
].map((unit) => ({ value: unit, label: unit }));

export function ReagentModal({
  opened,
  onClose,
  onSuccess,
  reagentId,
  mode,
}: ReagentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReagentMutation = useCreateReagent();
  const updateReagentMutation = useUpdateReagent();

  const {
    data: existingReagent,
    isLoading: isLoadingReagent,
    error: reagentError,
  } = useReagent(reagentId || "");

  const form = useForm<ReagentFormValues>({
    initialValues: createEmptyFormValues(),
    validate: {
      name: (value) =>
        !value || value.trim().length < 3
          ? "Name must be at least 3 characters"
          : value.trim().length > 200
          ? "Name must be less than 200 characters"
          : null,
      reagentType: (value) => (!value ? "Reagent type is required" : null),
      quantity: (value) =>
        !value || value < 1 ? "Quantity must be 1 or greater" : null,
      currentCharges: (value, values) =>
        values.reagentType === "ChargeBased" && (!value || value < 1)
          ? "Current charges must be 1 or greater"
          : null,
      volume: (value, values) =>
        values.reagentType === "VolumeBased" && (!value || value < 0.01)
          ? "Volume must be 0.01 or greater"
          : null,
      unitOfMeasure: (value, values) =>
        values.reagentType === "VolumeBased" && !value
          ? "Unit of measure is required for volume-based reagents"
          : null,
      minimumStock: (value) =>
        !value || value < 1 ? "Minimum stock must be 1 or greater" : null,
      unitCost: (value) =>
        !value || value < 0.01 || value > 999999.99
          ? "Unit cost must be between 0.01 and 999999.99"
          : null,
    },
  });

  
  useEffect(() => {
    if (mode === "edit" && existingReagent && !isLoadingReagent) {
      form.setValues({
        name: existingReagent.name || "",

        reagentType: existingReagent.reagentType,
        quantity: existingReagent.quantity || "",
        currentCharges:
          existingReagent.currentCharges ||
          existingReagent.chargesPerUnit ||
          "",
        volume: existingReagent.volume || existingReagent.currentVolume || "",
        unitOfMeasure: existingReagent.unitOfMeasure || "mL",
        minimumStock: existingReagent.minimumStock || "",
        unitCost: existingReagent.unitCost || "",
        expirationDate: existingReagent.expirationDate
          ? new Date(existingReagent.expirationDate)
          : null,
        batchNumber: existingReagent.batchNumber || "",
      });
    }
  }, [existingReagent, isLoadingReagent, mode]);

  const handleSubmit = async (values: ReagentFormValues) => {
    try {
      setIsSubmitting(true);

      const reagentData: CreateReagentRequest | UpdateReagentRequest = {
        name: values.name.trim(),

        reagentType: values.reagentType,
        quantity: Number(values.quantity),
        minimumStock: Number(values.minimumStock),
        unitCost: Number(values.unitCost),
        expirationDate: values.expirationDate?.toISOString() || undefined,
        batchNumber: values.batchNumber.trim() || undefined,
      };

      
      if (values.reagentType === "ChargeBased") {
        reagentData.currentCharges = Number(values.currentCharges);
      } else if (values.reagentType === "VolumeBased") {
        reagentData.volume = Number(values.volume);
        reagentData.unitOfMeasure = values.unitOfMeasure;
      }

      if (mode === "create") {
        await createReagentMutation.mutateAsync(reagentData);
        notifications.show({
          title: "Success",
          message: "Reagent created successfully",
          color: "green",
        });
      } else {
        await updateReagentMutation.mutateAsync({
          id: reagentId!,
          reagentData: { ...reagentData, id: reagentId },
        });
        notifications.show({
          title: "Success",
          message: "Reagent updated successfully",
          color: "green",
        });
      }

      handleClose();
      onSuccess();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error?.response?.data?.message || `Failed to ${mode} reagent`,
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  const isChargeBased = form.values.reagentType === "ChargeBased";
  const isVolumeBased = form.values.reagentType === "VolumeBased";

  const isLoading = mode === "edit" && isLoadingReagent;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconFlask size={20} />
          <Text fw={600}>
            {mode === "create" ? "Add New Reagent" : "Edit Reagent"}
          </Text>
        </Group>
      }
      size="lg"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      {isLoading ? (
        <Group justify="center" p="xl">
          <Loader size="lg" />
          <Text>Loading reagent data...</Text>
        </Group>
      ) : reagentError ? (
        <Alert color="red" title="Error loading reagent">
          {reagentError.message || "Failed to load reagent data"}
        </Alert>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Paper p="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Text fw={500} size="sm">
                    Basic Information
                  </Text>
                  <Badge
                    color={isChargeBased ? "blue" : "green"}
                    variant="light"
                    size="sm"
                  >
                    {isChargeBased ? "Charge Based" : "Volume Based"}
                  </Badge>
                </Group>
                <Divider />

                <Group grow>
                  <TextInput
                    label="Reagent Name"
                    placeholder="Enter reagent name"
                    required
                    {...form.getInputProps("name")}
                  />
                  <Select
                    label="Reagent Type"
                    placeholder="Select type"
                    required
                    data={reagentTypeOptions}
                    {...form.getInputProps("reagentType")}
                  />
                </Group>
              </Stack>
            </Paper>

            <Paper p="md" withBorder>
              <Stack gap="md">
                <Text fw={500} size="sm">
                  {isChargeBased
                    ? "Charge-Based Configuration"
                    : "Volume-Based Configuration"}
                </Text>
                <Divider />

                <NumberInput
                  label="Quantity (Unopened Containers)"
                  placeholder="Number of unopened containers on shelf"
                  description="Number of unopened containers/boxes/bottles on shelf"
                  required
                  min={1}
                  {...form.getInputProps("quantity")}
                />

                {isChargeBased && (
                  <NumberInput
                    label="Current Charges (Opened Container)"
                    placeholder="Charges in currently opened container"
                    description="Charges left in the currently opened box/container"
                    required
                    min={1}
                    {...form.getInputProps("currentCharges")}
                  />
                )}

                {isVolumeBased && (
                  <Group grow>
                    <NumberInput
                      label="Volume (Opened Container)"
                      placeholder="Volume in currently opened container"
                      description="Volume left in the currently opened bottle/container"
                      required
                      min={0.01}
                      decimalScale={2}
                      {...form.getInputProps("volume")}
                    />
                    <Select
                      label="Unit of Measure"
                      placeholder="Select unit"
                      required
                      data={unitOfMeasureOptions}
                      {...form.getInputProps("unitOfMeasure")}
                    />
                  </Group>
                )}
              </Stack>
            </Paper>

            <Paper p="md" withBorder>
              <Stack gap="md">
                <Text fw={500} size="sm">
                  Stock & Cost Information
                </Text>
                <Divider />

                <Group grow>
                  <NumberInput
                    label="Minimum Stock"
                    placeholder="Enter minimum stock"
                    required
                    min={1}
                    {...form.getInputProps("minimumStock")}
                  />
                  <NumberInput
                    label="Unit Cost (₱)"
                    placeholder="Enter unit cost"
                    required
                    min={0.01}
                    max={999999.99}
                    decimalScale={2}
                    {...form.getInputProps("unitCost")}
                  />
                </Group>
              </Stack>
            </Paper>

            <Paper p="md" withBorder>
              <Stack gap="md">
                <Text fw={500} size="sm">
                  Additional Information
                </Text>
                <Divider />

                <Group grow>
                  <DateInput
                    label="Expiration Date"
                    placeholder="Select expiration date"
                    {...form.getInputProps("expirationDate")}
                  />
                </Group>
              </Stack>
            </Paper>

            <Group justify="flex-end" mt="lg">
              <Button
                variant="subtle"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {mode === "create" ? "Create Reagent" : "Update Reagent"}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
