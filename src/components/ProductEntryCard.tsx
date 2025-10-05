import { useEffect, useState, useCallback, useRef } from "react";
import {
  Card,
  TextInput,
  NumberInput,
  Checkbox,
  Group,
  Stack,
  ActionIcon,
  Badge,
  Divider,
  Grid,
  Tooltip,
  Combobox,
  useCombobox,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconCalendar,
  IconTrash,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import { apiEndpoints } from "../lib/api";

interface CustomSelectProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  data: string[];
  error?: string;
}

function CustomSelect({
  label,
  placeholder,
  value,
  onChange,
  data,
  error,
}: CustomSelectProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const handleValueSelect = (val: string) => {
    onChange(val);
    combobox.closeDropdown();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.currentTarget.value;
    onChange(newValue);
    if (newValue.length > 0) {
      combobox.openDropdown();
    } else {
      combobox.closeDropdown();
    }
  };

  const handleClear = () => {
    onChange("");
    combobox.closeDropdown();
  };

  const handleChevronClick = () => {
    if (combobox.dropdownOpened) {
      combobox.closeDropdown();
    } else {
      combobox.openDropdown();
    }
  };

  const filteredOptions = data.filter((item) =>
    item.toLowerCase().includes((value || "").toLowerCase())
  );

  const options = filteredOptions.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={handleValueSelect}
    >
      <Combobox.Target>
        <TextInput
          label={label}
          placeholder={placeholder}
          value={value || ""}
          onChange={handleInputChange}
          error={error}
          rightSection={
            <Group gap={4}>
              {value && (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={handleClear}
                >
                  ×
                </ActionIcon>
              )}
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={handleChevronClick}
              >
                <Combobox.Chevron />
              </ActionIcon>
            </Group>
          }
          rightSectionWidth={value ? 70 : 40}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options style={{ maxHeight: 200, overflowY: "auto" }}>
          {options.length > 0 ? (
            options
          ) : (
            <Combobox.Empty>No matching options</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

interface ProductEntryCardProps {
  index: number;
  product: any;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  referenceData: any;
  errors: any;
  onDuplicateStatus: (index: number, isDuplicate: boolean) => void;
  isEditMode?: boolean;
  externalDuplicateStatus?: boolean;
}

export function ProductEntryCard({
  index,
  product,
  onUpdate,
  onRemove,
  canRemove,
  referenceData,
  errors,
  onDuplicateStatus,
  isEditMode = false,
  externalDuplicateStatus = false,
}: ProductEntryCardProps) {
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const isAnyDuplicate = isDuplicate || externalDuplicateStatus;

  const lastCheckedRef = useRef<{
    barcode?: string;
    core?: string;
    comprehensive?: string;
  }>({});

  const [debouncedBarcode] = useDebouncedValue(product.barcode, 500);

  const [debouncedCoreFields] = useDebouncedValue(
    {
      brand: product.brand,
      generic: product.generic,
      type: product.type,
    },
    1000
  );
  const [debouncedAllFields] = useDebouncedValue(
    {
      brand: product.brand,
      generic: product.generic,
      type: product.type,
      formulation: product.formulation,
      category: product.category,
      location: product.location,
      expirationDate: product.expirationDate,
    },
    1500
  );

  const hasErrors = Object.keys(errors).some((key) =>
    key.startsWith(`products.${index}.`)
  );

  const hasRequiredFields = useCallback(() => {
    return (
      product.brand?.trim() &&
      typeof product.retailPrice === "number" &&
      typeof product.wholesalePrice === "number" &&
      typeof product.quantity === "number" &&
      typeof product.minimumStock === "number"
    );
  }, [product]);

  const checkForDuplicates = useCallback(
    async (stage: "barcode" | "core" | "comprehensive", stageData?: any) => {
      if (isEditMode) {
        setIsDuplicate(false);
        onDuplicateStatus(index, false);
        return;
      }

      if (!hasRequiredFields()) {
        setIsDuplicate(false);
        onDuplicateStatus(index, false);
        return;
      }

      setIsChecking(true);
      try {
        const criteria: any = {};

        if (stage === "barcode" && stageData?.trim()) {
          criteria.barcode = stageData.trim();
        } else if (stage === "core" && stageData) {
          if (stageData.brand?.trim()) {
            criteria.brand = stageData.brand.trim();
          }
          if (stageData.generic?.trim()) {
            criteria.generic = stageData.generic.trim();
          }
          if (stageData.type?.trim()) {
            criteria.type = stageData.type.trim();
          }
        } else if (stage === "comprehensive" && stageData) {
          if (stageData.brand?.trim()) {
            criteria.brand = stageData.brand.trim();
          }
          if (stageData.generic?.trim()) {
            criteria.generic = stageData.generic.trim();
          }
          if (stageData.type?.trim()) {
            criteria.type = stageData.type.trim();
          }
          if (stageData.formulation?.trim()) {
            criteria.formulation = stageData.formulation.trim();
          }
          if (stageData.category?.trim()) {
            criteria.category = stageData.category.trim();
          }
          if (stageData.location?.trim()) {
            criteria.location = stageData.location.trim();
          }
          if (stageData.expirationDate) {
            criteria.expirationDate = stageData.expirationDate.toISOString();
          }
        }

        if (Object.keys(criteria).length === 0) {
          setIsDuplicate(false);
          onDuplicateStatus(index, false);
          setIsChecking(false);
          return;
        }

        const response = await apiEndpoints.products.checkExists(criteria);
        const duplicateExists = response.data.exists;

        setIsDuplicate(duplicateExists);
        onDuplicateStatus(index, duplicateExists);
      } catch (error) {
        console.error("Error checking for duplicates:", error);
        setIsDuplicate(false);
        onDuplicateStatus(index, false);
      } finally {
        setIsChecking(false);
      }
    },
    [hasRequiredFields, index, onDuplicateStatus, isEditMode]
  );

  useEffect(() => {
    const barcodeValue = debouncedBarcode?.trim();
    if (barcodeValue && barcodeValue !== lastCheckedRef.current.barcode) {
      lastCheckedRef.current.barcode = barcodeValue;
      checkForDuplicates("barcode", barcodeValue);
    }
  }, [debouncedBarcode, checkForDuplicates]);

  useEffect(() => {
    const { brand, generic } = debouncedCoreFields;
    const coreKey = `${brand?.trim() || ""}-${generic?.trim() || ""}`;
    if (
      brand?.trim() &&
      generic?.trim() &&
      coreKey !== lastCheckedRef.current.core
    ) {
      lastCheckedRef.current.core = coreKey;
      checkForDuplicates("core", debouncedCoreFields);
    }
  }, [debouncedCoreFields, checkForDuplicates]);

  useEffect(() => {
    const { brand, generic, formulation, category, location } =
      debouncedAllFields;
    const filledFields = [
      brand,
      generic,
      formulation,
      category,
      location,
    ].filter((f) => f?.trim());
    const hasMultipleFields = filledFields.length >= 3;

    if (hasMultipleFields) {
      const comprehensiveKey = filledFields.join("-");
      if (comprehensiveKey !== lastCheckedRef.current.comprehensive) {
        lastCheckedRef.current.comprehensive = comprehensiveKey;
        checkForDuplicates("comprehensive", debouncedAllFields);
      }
    }
  }, [debouncedAllFields, checkForDuplicates]);

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{
        borderColor: isAnyDuplicate
          ? "var(--mantine-color-orange-4)"
          : hasErrors
          ? "var(--mantine-color-red-5)"
          : undefined,
        borderWidth: isAnyDuplicate || hasErrors ? 2 : 1,
        backgroundColor: isAnyDuplicate
          ? "var(--mantine-color-orange-0)"
          : undefined,
      }}
    >
      <Card.Section withBorder inheritPadding py="sm">
        <Group justify="space-between">
          <Group>
            <Badge variant="light" color="blue" size="sm">
              Product #{index + 1}
            </Badge>
            {isAnyDuplicate && (
              <Tooltip
                label={
                  externalDuplicateStatus
                    ? "This product is a duplicate of another product in this form"
                    : "This product may already exist in the system"
                }
              >
                <Badge variant="filled" color="orange" size="sm">
                  <Group gap={4}>
                    <IconAlertTriangle size={12} />
                    Duplicate
                  </Group>
                </Badge>
              </Tooltip>
            )}
            {hasErrors && (
              <Badge variant="filled" color="red" size="sm">
                Has Errors
              </Badge>
            )}
            {isChecking && (
              <Badge variant="light" color="gray" size="sm">
                Checking...
              </Badge>
            )}
          </Group>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            size="sm"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Card.Section>

      <Stack gap="md" mt="md">
        {}
        <Grid gutter="sm">
          <Grid.Col span={6}>
            <TextInput
              label="Barcode"
              placeholder="Enter product barcode (optional)"
              value={product.barcode}
              onChange={(e) =>
                onUpdate(index, "barcode", e.currentTarget.value)
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
                onUpdate(index, "generic", e.currentTarget.value)
              }
              error={errors[`products.${index}.generic`]}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Brand"
              placeholder="e.g., Biogesic"
              value={product.brand}
              onChange={(e) => onUpdate(index, "brand", e.currentTarget.value)}
              error={errors[`products.${index}.brand`]}
              required
            />
          </Grid.Col>
        </Grid>

        <Divider label="Classification" labelPosition="center" />

        <Grid gutter="sm">
          <Grid.Col span={6}>
            <CustomSelect
              label="Type"
              placeholder="Select or enter type"
              value={product.type}
              onChange={(value) => onUpdate(index, "type", value)}
              data={referenceData.productTypes.data}
              error={errors[`products.${index}.type`]}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <CustomSelect
              label="Formulation"
              placeholder="Select or enter formulation"
              value={product.formulation}
              onChange={(value) => onUpdate(index, "formulation", value)}
              data={referenceData.formulations.data}
              error={errors[`products.${index}.formulation`]}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <CustomSelect
              label="Category"
              placeholder="Select or enter category"
              value={product.category}
              onChange={(value) => onUpdate(index, "category", value)}
              data={referenceData.categories.data}
              error={errors[`products.${index}.category`]}
            />
          </Grid.Col>
        </Grid>

        <Divider label="Pricing & Inventory" labelPosition="center" />

        <Grid gutter="sm">
          <Grid.Col span={6}>
            <NumberInput
              label="Retail Price (₱)"
              placeholder="0.00"
              value={product.retailPrice}
              onChange={(value) => onUpdate(index, "retailPrice", value)}
              error={errors[`products.${index}.retailPrice`]}
              prefix="₱"
              decimalScale={2}
              fixedDecimalScale
              min={0}
              required
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Wholesale Price (₱)"
              placeholder="0.00"
              value={product.wholesalePrice}
              onChange={(value) => onUpdate(index, "wholesalePrice", value)}
              error={errors[`products.${index}.wholesalePrice`]}
              prefix="₱"
              decimalScale={2}
              fixedDecimalScale
              min={0}
              required
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Tooltip
              label="Use Adjust Stock to modify quantity"
              disabled={!isEditMode}
              withArrow
            >
              <NumberInput
                label="Quantity"
                placeholder="0"
                value={product.quantity}
                onChange={(value) => onUpdate(index, "quantity", value)}
                error={errors[`products.${index}.quantity`]}
                min={0}
                required
                disabled={isEditMode}
              />
            </Tooltip>
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Minimum Stock"
              placeholder="0"
              value={product.minimumStock}
              onChange={(value) => onUpdate(index, "minimumStock", value)}
              error={errors[`products.${index}.minimumStock`]}
              min={0}
              required
            />
          </Grid.Col>
        </Grid>

        <Divider label="Additional Details" labelPosition="center" />

        <Grid gutter="sm">
          <Grid.Col span={12}>
            <CustomSelect
              label="Location"
              placeholder="Select or enter location"
              value={product.location}
              onChange={(value) => onUpdate(index, "location", value)}
              data={referenceData.locations.data}
              error={errors[`products.${index}.location`]}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <DateInput
              label="Expiration Date"
              placeholder="Select date (optional)"
              value={product.expirationDate}
              onChange={(value) => onUpdate(index, "expirationDate", value)}
              error={errors[`products.${index}.expirationDate`]}
              leftSection={<IconCalendar size={16} />}
              minDate={new Date()}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Checkbox
              label="Is Discountable"
              description="Can this product have discounts applied?"
              checked={product.isDiscountable}
              onChange={(e) =>
                onUpdate(index, "isDiscountable", e.currentTarget.checked)
              }
            />
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
}
