import { useState, useCallback, useEffect } from "react";
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
import { ProductEntryCard } from "./ProductEntryCard";
import { apiEndpoints } from "../lib/api";

interface BulkAddProductModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  referenceData: {
    productTypes: { data: string[]; isLoading: boolean };
    formulations: { data: string[]; isLoading: boolean };
    categories: { data: string[]; isLoading: boolean };
    locations: { data: string[]; isLoading: boolean };
  };
}

interface ProductRow {
  id: string;
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

const createEmptyRow = (): ProductRow => ({
  id: Math.random().toString(36).substr(2, 9),
  barcode: "",
  generic: "",
  brand: "",
  type: "",
  formulation: "",
  category: "",
  retailPrice: "",
  wholesalePrice: "",
  quantity: "",
  minimumStock: "",
  location: "",
  expirationDate: null,
  isDiscountable: true,
});

export function BulkAddProductModal({
  opened,
  onClose,
  onSuccess,
  referenceData,
}: BulkAddProductModalProps) {
  const [products, setProducts] = useState<ProductRow[]>([createEmptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateStatuses, setDuplicateStatuses] = useState<boolean[]>([
    false,
  ]);
  const [internalDuplicates, setInternalDuplicates] = useState<boolean[]>([
    false,
  ]);

  const form = useForm({
    initialValues: { products },
    validate: {
      products: {
        barcode: (value: string) => {
          if (value && value.length > 50)
            return "Barcode must be 50 characters or less";
          return null;
        },
        generic: (value: string) => {
          if (value && value.length > 200)
            return "Generic name must be 200 characters or less";
          return null;
        },
        brand: (value: string) => {
          if (!value?.trim()) return "Brand is required";
          if (value.length > 100) return "Brand must be 100 characters or less";
          return null;
        },
        type: (value: string) => {
          if (value && value.length > 50)
            return "Type must be 50 characters or less";
          return null;
        },
        formulation: (value: string) => {
          if (value && value.length > 50)
            return "Formulation must be 50 characters or less";
          return null;
        },
        category: (value: string) => {
          if (value && value.length > 50)
            return "Category must be 50 characters or less";
          return null;
        },
        retailPrice: (value: number | "") => {
          if (value === "" || value === null || value === undefined)
            return "Required";
          if (typeof value === "number" && value <= 0) return "Must be > 0";
          return null;
        },
        wholesalePrice: (value: number | "") => {
          if (value === "" || value === null || value === undefined)
            return "Required";
          if (typeof value === "number" && value < 0)
            return "Cannot be negative";
          return null;
        },
        quantity: (value: number | "") => {
          if (value === "" || value === null || value === undefined)
            return "Required";
          if (typeof value === "number" && value < 0)
            return "Cannot be negative";
          return null;
        },
        minimumStock: (value: number | "") => {
          if (value === "" || value === null || value === undefined)
            return "Required";
          if (typeof value === "number" && value < 0)
            return "Cannot be negative";
          return null;
        },
        location: (value: string) => {
          if (value && value.length > 100)
            return "Location must be 100 characters or less";
          return null;
        },
        expirationDate: (value: Date | null) => {
          if (value && value <= new Date()) return "Must be in future";
          return null;
        },
      },
    },
  });

  useEffect(() => {
    const checkInternalDuplicates = () => {
      const newInternalDuplicates = products.map((product, currentIndex) => {
        const hasRequiredFields =
          product.brand?.trim() &&
          typeof product.retailPrice === "number" &&
          typeof product.wholesalePrice === "number" &&
          typeof product.quantity === "number" &&
          typeof product.minimumStock === "number";

        if (!hasRequiredFields) return false;

        return products.some((otherProduct, otherIndex) => {
          if (currentIndex === otherIndex) return false;

          if (product.barcode?.trim() && otherProduct.barcode?.trim()) {
            if (
              product.barcode.trim().toLowerCase() ===
              otherProduct.barcode.trim().toLowerCase()
            ) {
              return true;
            }
          }

          if (
            product.brand?.trim() &&
            product.generic?.trim() &&
            product.type?.trim() &&
            otherProduct.brand?.trim() &&
            otherProduct.generic?.trim() &&
            otherProduct.type?.trim()
          ) {
            if (
              product.brand.trim().toLowerCase() ===
                otherProduct.brand.trim().toLowerCase() &&
              product.generic.trim().toLowerCase() ===
                otherProduct.generic.trim().toLowerCase() &&
              product.type.trim().toLowerCase() ===
                otherProduct.type.trim().toLowerCase()
            ) {
              return true;
            }
          }

          const productFields = [
            product.brand,
            product.generic,
            product.formulation,
            product.category,
            product.location,
          ].filter((f) => f?.trim());

          const otherFields = [
            otherProduct.brand,
            otherProduct.generic,
            otherProduct.formulation,
            otherProduct.category,
            otherProduct.location,
          ].filter((f) => f?.trim());

          if (productFields.length >= 3 && otherFields.length >= 3) {
            const fieldsMatch =
              product.brand?.trim().toLowerCase() ===
                otherProduct.brand?.trim().toLowerCase() &&
              product.generic?.trim().toLowerCase() ===
                otherProduct.generic?.trim().toLowerCase() &&
              product.formulation?.trim().toLowerCase() ===
                otherProduct.formulation?.trim().toLowerCase() &&
              product.category?.trim().toLowerCase() ===
                otherProduct.category?.trim().toLowerCase() &&
              product.location?.trim().toLowerCase() ===
                otherProduct.location?.trim().toLowerCase();

            if (fieldsMatch) return true;
          }

          return false;
        });
      });

      setInternalDuplicates(newInternalDuplicates);
    };

    checkInternalDuplicates();
  }, [products]);

  const addRow = useCallback(() => {
    const newProducts = [...products, createEmptyRow()];
    const newDuplicateStatuses = [...duplicateStatuses, false];
    const newInternalDuplicates = [...internalDuplicates, false];
    setProducts(newProducts);
    setDuplicateStatuses(newDuplicateStatuses);
    setInternalDuplicates(newInternalDuplicates);
    form.setFieldValue("products", newProducts);
  }, [products, duplicateStatuses, internalDuplicates, form]);

  const removeRow = useCallback(
    (index: number) => {
      if (products.length <= 1) return;
      const newProducts = products.filter((_, i) => i !== index);
      const newDuplicateStatuses = duplicateStatuses.filter(
        (_, i) => i !== index
      );
      const newInternalDuplicates = internalDuplicates.filter(
        (_, i) => i !== index
      );
      setProducts(newProducts);
      setDuplicateStatuses(newDuplicateStatuses);
      setInternalDuplicates(newInternalDuplicates);
      form.setFieldValue("products", newProducts);
    },
    [products, duplicateStatuses, internalDuplicates, form]
  );

  const handleDuplicateStatus = useCallback(
    (index: number, isDuplicate: boolean) => {
      setDuplicateStatuses((prev) => {
        const newStatuses = [...prev];
        newStatuses[index] = isDuplicate;
        return newStatuses;
      });
    },
    []
  );

  const updateProduct = useCallback(
    (index: number, field: keyof ProductRow, value: any) => {
      const newProducts = [...products];
      newProducts[index] = { ...newProducts[index], [field]: value };
      setProducts(newProducts);
      form.setFieldValue(`products.${index}.${field}`, value);
    },
    [products, form]
  );

  const handleSubmit = async () => {
    const validation = form.validate();
    if (validation.hasErrors) return;

    const hasDatabaseDuplicates = duplicateStatuses.some((status) => status);
    const hasInternalDuplicates = internalDuplicates.some((status) => status);

    if (hasDatabaseDuplicates || hasInternalDuplicates) {
      notifications.show({
        title: "Duplicates Detected",
        message: hasInternalDuplicates
          ? "You have duplicate products within this form. Please remove or modify them."
          : "Some products already exist in the database.",
        color: "orange",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const productData = products.map((product) => ({
        barcode: product.barcode.trim() || undefined,
        generic: product.generic.trim() || undefined,
        brand: product.brand.trim(),
        type: product.type.trim() || undefined,
        formulation: product.formulation.trim() || undefined,
        category: product.category.trim() || undefined,
        retailPrice: Number(product.retailPrice),
        wholesalePrice: Number(product.wholesalePrice),
        quantity: Number(product.quantity),
        minimumStock: Number(product.minimumStock),
        location: product.location.trim() || undefined,
        expirationDate: product.expirationDate?.toISOString() || undefined,
        isDiscountable: product.isDiscountable,
      }));

      const response = await apiEndpoints.products.createBatch({
        products: productData,
        validateDuplicates: false,
        continueOnError: false,
      });

      notifications.show({
        title: "Success",
        message: `Successfully added ${response.data.totalCreated} product${
          response.data.totalCreated > 1 ? "s" : ""
        }`,
        color: "green",
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to create products",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setProducts([createEmptyRow()]);
    setDuplicateStatuses([false]);
    setInternalDuplicates([false]);
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text size="lg" fw={600}>
          Add Products (Bulk Entry)
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
            Add multiple products at once. Each card contains all the fields
            organized by category.
          </Text>
          <Button
            leftSection={<IconPlus size={16} />}
            variant="light"
            size="sm"
            onClick={addRow}
          >
            Add Product
          </Button>
        </Group>

        <Divider mb="sm" />

        <ScrollArea flex={1} offsetScrollbars style={{ padding: "0.75rem" }}>
          <SimpleGrid cols={{ base: 1, sm: 1, lg: 2 }} spacing="md">
            {products.map((product, index) => (
              <ProductEntryCard
                key={product.id}
                index={index}
                product={product}
                onUpdate={(index, field, value) =>
                  updateProduct(index, field as keyof ProductRow, value)
                }
                onRemove={removeRow}
                canRemove={products.length > 1}
                referenceData={referenceData}
                errors={form.errors}
                onDuplicateStatus={handleDuplicateStatus}
                externalDuplicateStatus={internalDuplicates[index]}
              />
            ))}
          </SimpleGrid>
        </ScrollArea>

        <Divider mt="sm" mb="sm" />

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {products.length} product{products.length > 1 ? "s" : ""} to add
            {(duplicateStatuses.some((status) => status) ||
              internalDuplicates.some((status) => status)) && (
              <Text component="span" c="orange" size="sm" ml="xs">
                • Contains duplicates
              </Text>
            )}
          </Text>
          <Group>
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={
                products.length === 0 ||
                duplicateStatuses.some((status) => status) ||
                internalDuplicates.some((status) => status)
              }
            >
              {duplicateStatuses.some((status) => status) ||
              internalDuplicates.some((status) => status)
                ? "Resolve Duplicates First"
                : "Add All Products"}
            </Button>
          </Group>
        </Group>
      </div>
    </Modal>
  );
}
