import {
  Card,
  TextInput,
  NumberInput,
  Group,
  Stack,
  ActionIcon,
  Badge,
  Divider,
  Grid,
  Tooltip,
  Select,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconTrash, IconFlask, IconDroplet } from "@tabler/icons-react";
import type { Reagent } from "../lib/api";

type ReagentFormData = {
  name: string;
  reagentType: Reagent["reagentType"];
  quantity: number | string | "";
  currentCharges?: number | string | "";
  currentVolume?: number | string | "";
  unitOfMeasure?: string;
  minimumStock: number | string | "";
  unitCost: number | string | "";
  expirationDate?: Date | string | null;
  batchNumber?: string | null;
};

interface ReagentEntryCardProps {
  reagent: ReagentFormData;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  errors: Record<string, any>;
  showRemove?: boolean;
}

export function ReagentEntryCard({
  reagent,
  index,
  onUpdate,
  onRemove,
  errors,
  showRemove = true,
}: ReagentEntryCardProps) {
  const isChargeBased =
    reagent.reagentType === 0 ||
    reagent.reagentType === "ChargeBased" ||
    reagent.reagentType === "charge-based";

  return (
    <Card withBorder padding="md" radius="md" shadow="sm">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            {isChargeBased ? (
              <IconFlask size={20} color="var(--mantine-color-blue-6)" />
            ) : (
              <IconDroplet size={20} color="var(--mantine-color-teal-6)" />
            )}
            <Badge color={isChargeBased ? "blue" : "teal"} variant="light">
              {isChargeBased ? "Charge-Based" : "Volume-Based"}
            </Badge>
          </Group>
          {showRemove && (
            <Tooltip label="Remove Reagent">
              <ActionIcon
                color="red"
                variant="subtle"
                onClick={() => onRemove(index)}
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        <Divider />

        {/* Basic Info */}
        <Grid>
          <Grid.Col span={12}>
            <TextInput
              label="Reagent Name"
              placeholder="e.g., Blood Sugar Test Strip"
              value={reagent.name}
              onChange={(e) => onUpdate(index, "name", e.currentTarget.value)}
              error={errors[`reagents.${index}.name`]}
              required
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <NumberInput
              label="Quantity (Unopened Containers)"
              placeholder="Number of unopened containers"
              value={reagent.quantity}
              onChange={(value) => onUpdate(index, "quantity", value)}
              error={errors[`reagents.${index}.quantity`]}
              min={0}
              required
            />
          </Grid.Col>

          {isChargeBased ? (
            <Grid.Col span={6}>
              <NumberInput
                label="Current Charges (Opened Container)"
                placeholder="Charges in opened container"
                value={reagent.currentCharges}
                onChange={(value) => onUpdate(index, "currentCharges", value)}
                error={errors[`reagents.${index}.currentCharges`]}
                min={0}
                required
              />
            </Grid.Col>
          ) : (
            <>
              <Grid.Col span={3}>
                <NumberInput
                  label="Current Volume (Opened)"
                  placeholder="Volume"
                  value={reagent.currentVolume}
                  onChange={(value) => onUpdate(index, "currentVolume", value)}
                  error={errors[`reagents.${index}.currentVolume`]}
                  min={0}
                  decimalScale={2}
                  required
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Select
                  label="Unit"
                  placeholder="Unit"
                  value={reagent.unitOfMeasure}
                  onChange={(value) =>
                    onUpdate(index, "unitOfMeasure", value || "mL")
                  }
                  data={["mL", "L", "g", "kg", "oz", "lb", "units", "drops"]}
                  required
                />
              </Grid.Col>
            </>
          )}

          <Grid.Col span={6}>
            <NumberInput
              label="Minimum Stock"
              placeholder="Low stock threshold"
              value={reagent.minimumStock}
              onChange={(value) => onUpdate(index, "minimumStock", value)}
              error={errors[`reagents.${index}.minimumStock`]}
              min={1}
              required
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <NumberInput
              label="Unit Cost (₱)"
              placeholder="Cost per container"
              value={reagent.unitCost}
              onChange={(value) => onUpdate(index, "unitCost", value)}
              error={errors[`reagents.${index}.unitCost`]}
              min={0.01}
              max={999999.99}
              decimalScale={2}
              fixedDecimalScale
              required
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <DateInput
              label="Expiration Date"
              placeholder="Select expiration date"
              value={
                reagent.expirationDate ? new Date(reagent.expirationDate) : null
              }
              onChange={(value) =>
                onUpdate(index, "expirationDate", value?.toISOString())
              }
              error={errors[`reagents.${index}.expirationDate`]}
            />
          </Grid.Col>

          <Grid.Col span={6}></Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
}
