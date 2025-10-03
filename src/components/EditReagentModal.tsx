import { useState, useEffect } from "react";
import { Modal, Stack, Group, Button, Text, ScrollArea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { ReagentEntryCard } from "./ReagentEntryCard";
import type { Reagent } from "../lib/api";
import { useUpdateReagent, useDeleteReagent } from "../hooks/api/useReagents";

interface EditReagentModalProps {
  opened: boolean;
  onClose: () => void;
  reagents: Reagent[];
  onSuccess: () => void;
}

export function EditReagentModal({
  opened,
  onClose,
  reagents: initialReagents,
  onSuccess,
}: EditReagentModalProps) {
  const [reagents, setReagents] = useState<Reagent[]>(initialReagents);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateReagentMutation = useUpdateReagent();
  const deleteReagentMutation = useDeleteReagent();

  useEffect(() => {
    if (opened) {
      setReagents(initialReagents);
      setErrors({});
    }
  }, [opened, initialReagents]);

  const handleAddReagent = () => {
    setReagents([...reagents, { ...reagents[reagents.length - 1] }]);
  };

  const handleRemoveReagent = (index: number) => {
    if (reagents.length === 1) {
      notifications.show({
        title: "Cannot Remove",
        message: "At least one reagent must remain",
        color: "orange",
      });
      return;
    }
    setReagents(reagents.filter((_, i) => i !== index));
  };

  const handleUpdateReagent = (index: number, field: string, value: any) => {
    setReagents((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`reagents.${index}.${field}`];
      return newErrors;
    });
  };

  const handleDeleteReagent = async (
    reagentId: string,
    reagentName: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete reagent "${reagentName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteReagentMutation.mutateAsync(reagentId);
      notifications.show({
        title: "Success",
        message: `Reagent "${reagentName}" deleted successfully`,
        color: "green",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error?.response?.data?.message || "Failed to delete reagent",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      for (const reagent of reagents) {
        await updateReagentMutation.mutateAsync({
          id: reagent.id,
          reagentData: {
            name: reagent.name,
            reagentType: reagent.reagentType,
            quantity: reagent.quantity,
            currentCharges: reagent.currentCharges,
            currentVolume: reagent.currentVolume,
            minimumStock: reagent.minimumStock,
            unitCost: reagent.unitCost,
            expirationDate: reagent.expirationDate || undefined,
            batchNumber: reagent.batchNumber || undefined,
            unitOfMeasure: reagent.unitOfMeasure || undefined,
          },
        });
      }

      notifications.show({
        title: "Success",
        message: `Successfully updated ${reagents.length} reagent(s)`,
        color: "green",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error?.response?.data?.message || "Failed to update reagents",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSingleReagent = reagents.length === 1;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text fw={600}>
            {isSingleReagent
              ? "Edit Reagent"
              : `Edit ${reagents.length} Reagents`}
          </Text>
        </Group>
      }
      size="xl"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <Stack gap="md">
        <ScrollArea h={600} offsetScrollbars>
          <Stack gap="md">
            {reagents.map((reagent, index) => (
              <ReagentEntryCard
                key={`${reagent.id}-${index}`}
                reagent={reagent}
                index={index}
                onUpdate={handleUpdateReagent}
                onRemove={handleRemoveReagent}
                errors={errors}
                showRemove={!isSingleReagent}
              />
            ))}
          </Stack>
        </ScrollArea>

        <Group justify="space-between">
          <Group gap="xs">
            {!isSingleReagent && (
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                onClick={handleAddReagent}
                disabled={isSubmitting}
              >
                Add Another
              </Button>
            )}
          </Group>

          <Group gap="xs">
            {isSingleReagent && (
              <Button
                leftSection={<IconTrash size={16} />}
                color="red"
                variant="light"
                onClick={() =>
                  handleDeleteReagent(reagents[0].id, reagents[0].name)
                }
                disabled={isSubmitting}
              >
                Delete
              </Button>
            )}
            <Button variant="subtle" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Save Changes
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
