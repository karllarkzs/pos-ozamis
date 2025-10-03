import { useState, useEffect } from "react";
import { Modal, Stack, Group, Button, Text, ScrollArea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { ProductEntryCard } from "./ProductEntryCard";
import type { Product } from "../lib/api";
import { apiEndpoints } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProductsReferenceData } from "../hooks/api/useProducts";

interface EditProductModalProps {
  opened: boolean;
  onClose: () => void;
  products: Product[];
  onSuccess: () => void;
}

export function EditProductModal({
  opened,
  onClose,
  products: initialProducts,
  onSuccess,
}: EditProductModalProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [initialProductsState, setInitialProductsState] =
    useState<Product[]>(initialProducts);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const referenceData = useProductsReferenceData();

  const updateProductMutation = useMutation({
    mutationFn: (data: { id: string; product: Partial<Product> }) =>
      apiEndpoints.products.update(data.id, data.product),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => apiEndpoints.products.delete(productId),
  });

  useEffect(() => {
    if (opened) {
      setProducts(initialProducts);
      setInitialProductsState(JSON.parse(JSON.stringify(initialProducts)));
      setErrors({});
    }
  }, [opened, initialProducts]);

  const handleAddProduct = () => {
    setProducts([...products, { ...products[products.length - 1] }]);
  };

  const handleRemoveProduct = (index: number) => {
    if (products.length === 1) {
      notifications.show({
        title: "Cannot Remove",
        message: "At least one product must remain",
        color: "orange",
      });
      return;
    }
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleUpdateProduct = (index: number, field: string, value: any) => {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`products.${index}.${field}`];
      return newErrors;
    });
  };

  const handleDuplicateStatus = (_index: number, _isDuplicate: boolean) => {
    
  };

  const hasChanges = () => {
    if (products.length !== initialProductsState.length) return true;

    return products.some((product, index) => {
      const initial = initialProductsState[index];
      if (!initial) return true;

      return (
        product.barcode !== initial.barcode ||
        product.generic !== initial.generic ||
        product.brand !== initial.brand ||
        product.type !== initial.type ||
        product.formulation !== initial.formulation ||
        product.category !== initial.category ||
        product.batchNumber !== initial.batchNumber ||
        product.retailPrice !== initial.retailPrice ||
        product.wholesalePrice !== initial.wholesalePrice ||
        product.quantity !== initial.quantity ||
        product.minimumStock !== initial.minimumStock ||
        product.location !== initial.location ||
        product.isDiscountable !== initial.isDiscountable ||
        product.expirationDate?.toString() !==
          initial.expirationDate?.toString()
      );
    });
  };

  const handleDeleteProduct = async (
    productId: string,
    productName: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete product "${productName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteProductMutation.mutateAsync(productId);
      notifications.show({
        title: "Success",
        message: `Product "${productName}" deleted successfully`,
        color: "green",
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess();
      onClose();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error?.response?.data?.message || "Failed to delete product",
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

      for (const product of products) {
        await updateProductMutation.mutateAsync({
          id: product.id,
          product: {
            barcode: product.barcode,
            generic: product.generic,
            brand: product.brand,
            type: product.type,
            formulation: product.formulation,
            category: product.category,
            batchNumber: product.batchNumber,
            retailPrice: product.retailPrice,
            wholesalePrice: product.wholesalePrice,
            quantity: product.quantity,
            minimumStock: product.minimumStock,
            location: product.location,
            expirationDate: product.expirationDate,
            isDiscountable: product.isDiscountable,
          },
        });
      }

      notifications.show({
        title: "Success",
        message: `Successfully updated ${products.length} product(s)`,
        color: "green",
      });

      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess();
      onClose();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error?.response?.data?.message || "Failed to update products",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSingleProduct = products.length === 1;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text fw={600}>
            {isSingleProduct
              ? "Edit Product"
              : `Edit ${products.length} Products`}
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
            {products.map((product, index) => (
              <ProductEntryCard
                key={`${product.id}-${index}`}
                product={product}
                index={index}
                onUpdate={handleUpdateProduct}
                onRemove={handleRemoveProduct}
                errors={errors}
                canRemove={!isSingleProduct}
                referenceData={referenceData}
                onDuplicateStatus={handleDuplicateStatus}
                isEditMode={true}
              />
            ))}
          </Stack>
        </ScrollArea>

        <Group justify="space-between">
          <Group gap="xs">
            {!isSingleProduct && (
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                onClick={handleAddProduct}
                disabled={isSubmitting}
              >
                Add Another
              </Button>
            )}
          </Group>

          <Group gap="xs">
            {isSingleProduct && (
              <Button
                leftSection={<IconTrash size={16} />}
                color="red"
                variant="light"
                onClick={() =>
                  handleDeleteProduct(products[0].id, products[0].brand)
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
              disabled={isSubmitting || !hasChanges()}
            >
              Save Changes
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
