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
import { IconDeviceFloppy, IconEdit } from "@tabler/icons-react";
import { EditProductEntryCard } from "./EditProductEntryCard";
import { Product } from "../lib/api";
import { apiEndpoints } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface BatchEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  referenceData: {
    productTypes: { data: string[]; isLoading: boolean };
    formulations: { data: string[]; isLoading: boolean };
    categories: { data: string[]; isLoading: boolean };
    locations: { data: string[]; isLoading: boolean };
  };
}

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

const createProductEditRow = (product: Product): ProductEditRow => ({
  id: Math.random().toString(36).substr(2, 9),
  originalId: product.id,
  barcode: product.barcode || "",
  generic: product.generic || "",
  brand: product.brand || "",
  type: product.type || "",
  formulation: product.formulation || "",
  category: product.category || "",
  retailPrice: product.retailPrice || 0,
  wholesalePrice: product.wholesalePrice || 0,
  quantity: product.quantity || 0,
  minimumStock: product.minimumStock || 0,
  location: product.location || "",
  expirationDate: product.expirationDate
    ? new Date(product.expirationDate)
    : null,
  isDiscountable: product.isDiscountable ?? true,
});

export function BatchEditProductModal({
  isOpen,
  onClose,
  products,
  referenceData,
}: BatchEditProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm({
    initialValues: {
      products: [] as ProductEditRow[],
    },

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
      },
    },
  });

  
  useEffect(() => {
    if (isOpen && products.length > 0) {
      form.setValues({
        products: products.map(createProductEditRow),
      });
    }
  }, [isOpen, products]);

  
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setIsSubmitting(false);
    }
  }, [isOpen]);

  
  const batchUpdateMutation = useMutation({
    mutationFn: async (
      updates: { productId: string; data: Partial<Product> }[]
    ) => {
      const results = await Promise.allSettled(
        updates.map(({ productId, data }) =>
          apiEndpoints.products.update(productId, data)
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed };
    },
    onSuccess: (result) => {
      const { successful, failed } = result;

      if (failed === 0) {
        notifications.show({
          title: "Success",
          message: `Successfully updated ${successful} products`,
          color: "green",
          icon: <IconDeviceFloppy size={16} />,
        });
      } else {
        notifications.show({
          title: "Partial Success",
          message: `Updated ${successful} products, ${failed} failed`,
          color: "orange",
        });
      }

      
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productSummary"] });

      onClose();
    },
    onError: (error: any) => {
      console.error("Batch update error:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update products",
        color: "red",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleProductUpdate = useCallback(
    (index: number, field: string, value: any) => {
      form.setFieldValue(`products.${index}.${field}`, value);
    },
    [form]
  );

  const handleSubmit = async (values: { products: ProductEditRow[] }) => {
    setIsSubmitting(true);

    try {
      const updates = values.products.map((product) => ({
        productId: product.originalId,
        data: {
          barcode: product.barcode || null,
          generic: product.generic || null,
          brand: product.brand,
          type: product.type || null,
          formulation: product.formulation || null,
          category: product.category || null,
          retailPrice:
            typeof product.retailPrice === "number" ? product.retailPrice : 0,
          wholesalePrice:
            typeof product.wholesalePrice === "number"
              ? product.wholesalePrice
              : 0,
          quantity: typeof product.quantity === "number" ? product.quantity : 0,
          minimumStock:
            typeof product.minimumStock === "number" ? product.minimumStock : 0,
          location: product.location || null,
          expirationDate: product.expirationDate
            ? product.expirationDate.toISOString()
            : null,
          isDiscountable: product.isDiscountable,
          
          batchNumber:
            products.find((p) => p.id === product.originalId)?.batchNumber ||
            null,
        } as Partial<Product>,
      }));

      await batchUpdateMutation.mutateAsync(updates);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  if (products.length === 0) return null;

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconEdit size={20} />
          <Text fw={600}>Batch Edit Products ({products.length} selected)</Text>
        </Group>
      }
      size="100%"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
      styles={{
        body: {
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
        },
      }}
    >
      <form
        onSubmit={form.onSubmit(handleSubmit)}
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <div style={{ padding: "1.5rem", flexShrink: 0 }}>
          <Text size="sm" c="dimmed" mb="md">
            Edit each product individually. All changes will be saved when you
            click "Update All Products".
          </Text>
          <Divider />
        </div>

        {}
        <ScrollArea style={{ flex: 1, padding: "1rem" }} scrollbarSize={6}>
          <SimpleGrid
            cols={{ base: 1, sm: 1, lg: 2, xl: 3 }}
            spacing="lg"
            style={{ paddingBottom: "1.5rem" }}
          >
            {form.values.products.map((product, index) => (
              <EditProductEntryCard
                key={product.id}
                product={product}
                index={index}
                onUpdate={handleProductUpdate}
                errors={form.errors}
                referenceData={referenceData}
                originalProduct={
                  products.find((p) => p.id === product.originalId)!
                }
              />
            ))}
          </SimpleGrid>
        </ScrollArea>

        {}
        <div
          style={{
            padding: "1.5rem",
            borderTop: "1px solid var(--mantine-color-gray-3)",
            flexShrink: 0,
          }}
        >
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {form.values.products.length} products ready to update
            </Text>
            <Group gap="sm">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                leftSection={<IconDeviceFloppy size={16} />}
              >
                {isSubmitting
                  ? `Updating ${form.values.products.length} Products...`
                  : `Update All Products`}
              </Button>
            </Group>
          </Group>
        </div>
      </form>
    </Modal>
  );
}
