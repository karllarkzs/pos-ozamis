import {
  Card,
  TextInput,
  NumberInput,
  Group,
  Stack,
  ActionIcon,
  Badge,
  Divider,
  Tooltip,
  Select,
  Text,
  Paper,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconTrash, IconFlask } from "@tabler/icons-react";
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

  const reagentTypeValue = isChargeBased ? "ChargeBased" : "VolumeBased";

  return (
    <Card withBorder padding="md" radius="md" shadow="sm">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconFlask size={20} />
            <Text fw={600} size="sm">
              Reagent #{index + 1}
            </Text>
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
                value={reagent.name}
                onChange={(e) => onUpdate(index, "name", e.currentTarget.value)}
                error={errors[`reagents.${index}.name`]}
                required
              />
              <Select
                label="Reagent Type"
                placeholder="Select type"
                value={reagentTypeValue}
                onChange={(value) =>
                  onUpdate(
                    index,
                    "reagentType",
                    value === "ChargeBased" ? 0 : 1
                  )
                }
                data={reagentTypeOptions}
                required
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
              value={reagent.quantity}
              onChange={(value) => onUpdate(index, "quantity", value)}
              error={errors[`reagents.${index}.quantity`]}
              min={1}
              required
            />

            {isChargeBased && (
              <NumberInput
                label="Current Charges (Opened Container)"
                placeholder="Charges in currently opened container"
                description="Charges left in the currently opened box/container"
                value={reagent.currentCharges}
                onChange={(value) => onUpdate(index, "currentCharges", value)}
                error={errors[`reagents.${index}.currentCharges`]}
                min={1}
                required
              />
            )}

            {!isChargeBased && (
              <Group grow>
                <NumberInput
                  label="Volume (Opened Container)"
                  placeholder="Volume in currently opened container"
                  description="Volume left in the currently opened bottle/container"
                  value={reagent.currentVolume}
                  onChange={(value) => onUpdate(index, "currentVolume", value)}
                  error={errors[`reagents.${index}.currentVolume`]}
                  min={0.01}
                  decimalScale={2}
                  required
                />
                <Select
                  label="Unit of Measure"
                  placeholder="Select unit"
                  value={reagent.unitOfMeasure}
                  onChange={(value) =>
                    onUpdate(index, "unitOfMeasure", value || "mL")
                  }
                  data={unitOfMeasureOptions}
                  required
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
                value={reagent.minimumStock}
                onChange={(value) => onUpdate(index, "minimumStock", value)}
                error={errors[`reagents.${index}.minimumStock`]}
                min={1}
                required
              />
              <NumberInput
                label="Unit Cost (₱)"
                placeholder="Enter unit cost"
                value={reagent.unitCost}
                onChange={(value) => onUpdate(index, "unitCost", value)}
                error={errors[`reagents.${index}.unitCost`]}
                min={0.01}
                max={999999.99}
                decimalScale={2}
                required
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
                value={
                  reagent.expirationDate
                    ? new Date(reagent.expirationDate)
                    : null
                }
                onChange={(value) =>
                  onUpdate(index, "expirationDate", value?.toISOString())
                }
                error={errors[`reagents.${index}.expirationDate`]}
              />
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Card>
  );
}
