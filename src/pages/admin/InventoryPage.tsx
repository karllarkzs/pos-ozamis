import { useState, useCallback } from "react";
import { Container, Tabs, Title, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconPackage,
  IconTestPipe,
  IconFlask,
  IconTruck,
} from "@tabler/icons-react";
import { BulkAddProductModal } from "../../components/BulkAddProductModal";
import { BulkAddReagentModal } from "../../components/BulkAddReagentModal";
import { ReagentModal } from "../../components/ReagentModal";
import { TestModal } from "../../components/TestModal";
import { ProductsTab } from "../../components/inventory/ProductsTab";
import { TestsTab } from "../../components/inventory/TestsTab";
import { ReagentsTab } from "../../components/inventory/ReagentsTab";
import { RestockingTab } from "../../components/inventory/RestockingTab";
import { useProductsReferenceData } from "../../hooks/api/useProducts";

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState("products");

  
  const [addProductModalOpened, setAddProductModalOpened] = useState(false);
  const [reagentModalOpened, setReagentModalOpened] = useState(false);
  const [bulkAddReagentModalOpened, setBulkAddReagentModalOpened] =
    useState(false);
  const [addTestModalOpened, setAddTestModalOpened] = useState(false);

  
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

  const handleAddReagent = useCallback(() => {
    setReagentModalOpened(true);
  }, []);

  const handleBulkAddReagent = useCallback(() => {
    setBulkAddReagentModalOpened(true);
  }, []);

  const handleReagentModalSuccess = useCallback(() => {
    
  }, []);

  const handleAddTest = useCallback(() => {
    setAddTestModalOpened(true);
  }, []);

  const handleTestModalSuccess = useCallback(() => {
    notifications.show({
      title: "Success",
      message: "Test added successfully",
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
          <Tabs.Tab value="tests" leftSection={<IconTestPipe size={16} />}>
            Tests
          </Tabs.Tab>
          <Tabs.Tab value="reagents" leftSection={<IconFlask size={16} />}>
            Reagents
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
          value="tests"
          pt="md"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TestsTab onAddTest={handleAddTest} />
        </Tabs.Panel>

        <Tabs.Panel
          value="reagents"
          pt="md"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ReagentsTab
            onAddReagent={handleAddReagent}
            onBulkAddReagent={handleBulkAddReagent}
          />
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

      <ReagentModal
        opened={reagentModalOpened}
        onClose={() => setReagentModalOpened(false)}
        onSuccess={handleReagentModalSuccess}
        mode="create"
      />

      <BulkAddReagentModal
        opened={bulkAddReagentModalOpened}
        onClose={() => setBulkAddReagentModalOpened(false)}
        onSuccess={handleReagentModalSuccess}
      />

      <TestModal
        opened={addTestModalOpened}
        onClose={() => setAddTestModalOpened(false)}
        onSuccess={handleTestModalSuccess}
      />
    </Container>
  );
}
