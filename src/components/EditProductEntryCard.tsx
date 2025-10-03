import { useState, useCallback } from "react";
import {
  Card,
  TextInput,
  NumberInput,
  Select,
  Switch,
  Group,
  Badge,
  Text,
  Stack,
  Grid,
  Divider,
  Tooltip,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconEdit } from "@tabler/icons-react";
import { Product } from "../lib/api";

interface ProductEditRow {
  id: string;
  originalId: string;
  barcode: string;
  generic: string;
  brand: string;
  type: string;
  formulation: string;
  category: string;
  retailPrice: number | "";
  wholesalePrice: number | "";
  quantity: number | "";
  minimumStock: number | "";
  location: string;
  expirationDate: Date | null;
  isDiscountable: boolean;
}

interface EditProductEntryCardProps {
  product: ProductEditRow;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  errors: any;
  referenceData: {
    productTypes: { data: string[]; isLoading: boolean };
    formulations: { data: string[]; isLoading: boolean };
    categories: { data: string[]; isLoading: boolean };
    locations: { data: string[]; isLoading: boolean };
  };
  originalProduct: Product;
}

export function EditProductEntryCard({
  product,
  index,
  onUpdate,
  errors,
  referenceData,
  originalProduct,
}: EditProductEntryCardProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      onUpdate(index, field, value);
      setHasChanges(true);
    },
    [index, onUpdate]
  );

  const hasErrors = Object.keys(errors).some((key) =>
    key.startsWith(`products.${index}.`)
  );

  const getDynamicData = (
    field: "type" | "formulation" | "category" | "location",
    currentValue: string
  ) => {
    let baseData: string[] = [];

    switch (field) {
      case "type":
        baseData = referenceData.productTypes.data || [];
        break;
      case "formulation":
        baseData = referenceData.formulations.data || [];
        break;
      case "category":
        baseData = referenceData.categories.data || [];
        break;
      case "location":
        baseData = referenceData.locations.data || [];
        break;
    }

    return [...new Set([...baseData, ...(currentValue ? [currentValue] : [])])];
  };

  return (
    <Card
      shadow="sm"
      padding="xl"
      radius="md"
      withBorder
      style={{
        borderColor: hasErrors
          ? "var(--mantine-color-red-5)"
          : hasChanges
          ? "var(--mantine-color-blue-4)"
          : undefined,
        borderWidth: hasErrors || hasChanges ? 2 : 1,
        backgroundColor: hasChanges ? "var(--mantine-color-blue-0)" : undefined,
      }}
    >
      <Card.Section withBorder inheritPadding py="md">
        <Group justify="space-between">
          <Group>
            <Badge variant="light" color="blue" size="sm">
              Product #{index + 1}
            </Badge>
            {hasChanges && (
              <Badge variant="filled" color="blue" size="sm">
                <Group gap={4}>
                  <IconEdit size={12} />
                  Modified
                </Group>
              </Badge>
            )}
            {hasErrors && (
              <Badge variant="filled" color="red" size="sm">
                Has Errors
              </Badge>
            )}
          </Group>
          <Tooltip
            label={`Original: ${originalProduct.brand}${
              originalProduct.generic ? ` (${originalProduct.generic})` : ""
            }`}
          >
            <Text size="xs" c="dimmed" style={{ fontWeight: 500 }}>
              {originalProduct.brand}
            </Text>
          </Tooltip>
        </Group>
      </Card.Section>

      <Stack gap="lg" mt="lg">
        {/* Basic Information */}
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Barcode"
              placeholder="Enter product barcode (optional)"
              value={product.barcode}
              onChange={(e) =>
                handleFieldChange("barcode", e.currentTarget.value)
              }
              error={errors[`products.${index}.barcode`]}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Generic Name"
              placeholder="e.g., Paracetamol (optional)"
              value={product.generic}
              onChange={(e) =>
                handleFieldChange("generic", e.currentTarget.value)
              }
              error={errors[`products.${index}.generic`]}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <TextInput
              label="Brand"
              placeholder="e.g., Biogesic"
              value={product.brand}
              onChange={(e) =>
                handleFieldChange("brand", e.currentTarget.value)
              }
              error={errors[`products.${index}.brand`]}
              required
            />
          </Grid.Col>
        </Grid>

        <Divider label="Classification" labelPosition="center" />

        <Grid>
          <Grid.Col span={6}>
            <Select
              label="Type"
              placeholder="Select or enter type"
              value={product.type}
              onChange={(value) => handleFieldChange("type", value || "")}
              data={getDynamicData("type", product.type)}
              error={errors[`products.${index}.type`]}
              searchable
              clearable
              allowDeselect
              nothingFoundMessage="Press Enter to use this value"
              comboboxProps={{ withinPortal: false }}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              label="Formulation"
              placeholder="Select or enter formulation"
              value={product.formulation}
              onChange={(value) =>
                handleFieldChange("formulation", value || "")
              }
              data={getDynamicData("formulation", product.formulation)}
              error={errors[`products.${index}.formulation`]}
              searchable
              clearable
              allowDeselect
              nothingFoundMessage="Press Enter to use this value"
              comboboxProps={{ withinPortal: false }}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Select
              label="Category"
              placeholder="Select or enter category"
              value={product.category}
              onChange={(value) => handleFieldChange("category", value || "")}
              data={getDynamicData("category", product.category)}
              error={errors[`products.${index}.category`]}
              searchable
              clearable
              allowDeselect
              nothingFoundMessage="Press Enter to use this value"
              comboboxProps={{ withinPortal: false }}
            />
          </Grid.Col>
        </Grid>

        <Divider label="Pricing & Inventory" labelPosition="center" />

        <Grid>
          <Grid.Col span={6}>
            <NumberInput
              label="Retail Price"
              placeholder="0.00"
              value={product.retailPrice}
              onChange={(value) => handleFieldChange("retailPrice", value)}
              min={0}
              step={0.01}
              decimalScale={2}
              fixedDecimalScale
              leftSection="₱"
              required
              error={errors[`products.${index}.retailPrice`]}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Wholesale Price"
              placeholder="0.00"
              value={product.wholesalePrice}
              onChange={(value) => handleFieldChange("wholesalePrice", value)}
              min={0}
              step={0.01}
              decimalScale={2}
              fixedDecimalScale
              leftSection="₱"
              required
              error={errors[`products.${index}.wholesalePrice`]}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Quantity"
              placeholder="0"
              value={product.quantity}
              onChange={(value) => handleFieldChange("quantity", value)}
              min={0}
              required
              error={errors[`products.${index}.quantity`]}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Minimum Stock"
              placeholder="0"
              value={product.minimumStock}
              onChange={(value) => handleFieldChange("minimumStock", value)}
              min={0}
              required
              error={errors[`products.${index}.minimumStock`]}
            />
          </Grid.Col>
        </Grid>

        <Divider label="Additional Details" labelPosition="center" />

        <Grid>
          <Grid.Col span={12}>
            <Select
              label="Location"
              placeholder="Select or enter location"
              value={product.location}
              onChange={(value) => handleFieldChange("location", value || "")}
              data={getDynamicData("location", product.location)}
              error={errors[`products.${index}.location`]}
              searchable
              clearable
              allowDeselect
              nothingFoundMessage="Press Enter to use this value"
              comboboxProps={{ withinPortal: false }}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <DateInput
              label="Expiration Date"
              placeholder="Select expiration date (optional)"
              value={product.expirationDate}
              onChange={(value) => handleFieldChange("expirationDate", value)}
              clearable
              error={errors[`products.${index}.expirationDate`]}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Switch
              label="Discountable"
              description="Allow discounts on this product"
              checked={product.isDiscountable}
              onChange={(event) =>
                handleFieldChange("isDiscountable", event.currentTarget.checked)
              }
              error={errors[`products.${index}.isDiscountable`]}
            />
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
}
