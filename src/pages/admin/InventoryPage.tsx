import { useState, useCallback } from "react";
import { Container, Tabs, Title, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPackage, IconTruck } from "@tabler/icons-react";
import { BulkAddProductModal } from "../../components/BulkAddProductModal";
import { ProductsTab } from "../../components/inventory/ProductsTab";
import { RestockingTab } from "../../components/inventory/RestockingTab";
import { useProductsReferenceData } from "../../hooks/api/useProducts";

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState("products");

  const [addProductModalOpened, setAddProductModalOpened] = useState(false);

  const referenceData = useProductsReferenceData();

  const handleAddProduct = useCallback(() => {
    setAddProductModalOpened(true);
  }, []);

  const handleAddProductSuccess = useCallback(() => {
    notifications.show({
      title: "Success",
      message: "Product added successfully",
      color: "green",
    });
  }, []);

  return (
    <Container
      px="md"
      py="md"
      style={{
        height: "100%",
        maxWidth: "none",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <Group justify="space-between" mb="md">
          <Title order={2}>Inventory Management</Title>
        </Group>
      </div>

      <Tabs
        value={activeTab}
        onChange={(value) => setActiveTab(value || "products")}
        keepMounted={false}
        style={{
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="products" leftSection={<IconPackage size={16} />}>
            Products
          </Tabs.Tab>
          <Tabs.Tab value="restocking" leftSection={<IconTruck size={16} />}>
            Restocking
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel
          value="products"
          pt="md"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ProductsTab onAddProduct={handleAddProduct} />
        </Tabs.Panel>

        <Tabs.Panel
          value="restocking"
          pt="xs"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <RestockingTab />
        </Tabs.Panel>
      </Tabs>

      {}
      <BulkAddProductModal
        opened={addProductModalOpened}
        onClose={() => setAddProductModalOpened(false)}
        onSuccess={handleAddProductSuccess}
        referenceData={referenceData}
      />
    </Container>
  );
}
