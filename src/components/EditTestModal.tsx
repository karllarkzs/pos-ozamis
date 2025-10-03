import { useState, useEffect } from "react";
import {
  Modal,
  TextInput,
  NumberInput,
  Button,
  Stack,
  Group,
  Text,
  Divider,
  ActionIcon,
  Select,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import type { Test, UpdateTestRequest } from "../types/global";
import { useUpdateTest } from "../hooks/api/useTests";
import { useReagents } from "../hooks/api/useReagents";
import { notifications } from "@mantine/notifications";

interface EditTestModalProps {
  opened: boolean;
  onClose: () => void;
  test: Test | null;
  onSuccess?: () => void;
}

export function EditTestModal({
  opened,
  onClose,
  test,
  onSuccess,
}: EditTestModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">(0);
  const [reagentRequirements, setReagentRequirements] = useState<
    Array<{
      reagentId: string;
      requiredAmount: number;
      reagentType: "ChargeBased" | "VolumeBased";
      unitOfMeasure: string;
    }>
  >([]);

  
  useEffect(() => {
    if (test) {
      setName(test.name);
      setPrice(test.price);
      setReagentRequirements(
        test.reagentRequirements.map((req) => ({
          reagentId: req.reagentId,
          requiredAmount: req.requiredAmount,
          reagentType: req.reagentType,
          unitOfMeasure: req.reagentUnit || "mL",
        }))
      );
    }
  }, [test]);

  const updateTest = useUpdateTest();
  const { data: reagentsResponse } = useReagents();
  const reagents = reagentsResponse?.data || [];
  const reagentOptions = reagents.map((reagent) => ({
    value: reagent.id,
    label: reagent.name,
    type: reagent.reagentType,
    unit:
      reagent.displayUnit ||
      (reagent.reagentType === "ChargeBased"
        ? "charges"
        : reagent.unitOfMeasure || "mL"),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!test) return;

    if (!name.trim()) {
      notifications.show({
        title: "Validation Error",
        message: "Test name is required",
        color: "red",
      });
      return;
    }

    if (typeof price !== "number" || price <= 0) {
      notifications.show({
        title: "Validation Error",
        message: "Price must be greater than 0",
        color: "red",
      });
      return;
    }

    const testData: UpdateTestRequest = {
      id: test.id,
      name: name.trim(),
      price: price as number,
      reagentRequirements: reagentRequirements
        .filter((req) => req.reagentId && req.requiredAmount > 0)
        .map((req) => ({
          reagentId: req.reagentId,
          requiredAmount: req.requiredAmount,
        })),
    };

    try {
      await updateTest.mutateAsync(testData);
      notifications.show({
        title: "Success",
        message: "Test updated successfully",
        color: "green",
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to update test",
        color: "red",
      });
    }
  };

  const addReagentRequirement = () => {
    setReagentRequirements((prev) => [
      ...prev,
      {
        reagentId: "",
        requiredAmount: 0,
        reagentType: "VolumeBased",
        unitOfMeasure: "mL",
      },
    ]);
  };

  const removeReagentRequirement = (index: number) => {
    setReagentRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const updateReagentRequirement = (
    index: number,
    field: keyof (typeof reagentRequirements)[0],
    value: string | number
  ) => {
    setReagentRequirements((prev) =>
      prev.map((req, i) => (i === index ? { ...req, [field]: value } : req))
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Test" size="lg">
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Test Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Complete Blood Count"
          />

          <NumberInput
            label="Price"
            required
            value={price}
            onChange={(value) => {
              if (typeof value === "string") {
                setPrice(value === "" ? "" : Number(value));
              } else {
                setPrice(value);
              }
            }}
            min={0}
            step={0.01}
            decimalSeparator="."
            prefix="₱"
            description="Service price for performing this test"
          />

          <Divider
            label="Reagent Requirements (Optional)"
            labelPosition="center"
            mt="md"
          />

          <Text size="sm" c="dimmed">
            Add reagents required to perform this test. Test availability will
            be calculated based on reagent stock.
          </Text>

          {reagentRequirements.map((requirement, index) => (
            <Group key={index} align="flex-end" wrap="nowrap">
              <Select
                label="Reagent"
                placeholder="Select reagent"
                data={reagentOptions}
                value={requirement.reagentId}
                onChange={(value: string | null) => {
                  if (value) {
                    const selectedReagent = reagentOptions.find(
                      (opt) => opt.value === value
                    );
                    updateReagentRequirement(index, "reagentId", value);
                    if (selectedReagent) {
                      updateReagentRequirement(
                        index,
                        "reagentType",
                        selectedReagent.type
                      );
                      updateReagentRequirement(
                        index,
                        "unitOfMeasure",
                        selectedReagent.unit
                      );
                    }
                  }
                }}
                style={{ flex: 2 }}
                searchable
              />
              <NumberInput
                label={`Amount (${requirement.unitOfMeasure || "mL"})`}
                value={requirement.requiredAmount}
                onChange={(value) =>
                  updateReagentRequirement(index, "requiredAmount", value || 0)
                }
                min={0}
                step={0.1}
                style={{ flex: 1 }}
              />
              <ActionIcon
                color="red"
                onClick={() => removeReagentRequirement(index)}
                variant="subtle"
                size="lg"
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Group>
          ))}

          <Button
            variant="light"
            onClick={addReagentRequirement}
            fullWidth
            size="sm"
          >
            + Add Reagent Requirement
          </Button>

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={updateTest.isPending}
              disabled={updateTest.isPending}
            >
              Update Test
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
