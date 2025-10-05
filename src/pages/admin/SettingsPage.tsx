import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Paper,
  Stack,
  TextInput,
  NumberInput,
  Switch,
  Button,
  Group,
  Text,
  Alert,
  Loader,
  Grid,
} from "@mantine/core";
import {
  IconDeviceFloppy,
  IconAlertCircle,
  IconCheck,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { apiEndpoints } from "../../lib/api";
import { useAppDispatch } from "../../store/hooks";
import {
  fetchSettingsStart,
  fetchSettingsSuccess,
  fetchSettingsFailure,
} from "../../store/slices/settingsSlice";

interface Setting {
  id: string;
  key: string;
  displayName: string;
  value: string;
  dataType: string;
  description?: string;
  category: string;
  isRequired: boolean;
  defaultValue?: string;
}

interface CategoryGroup {
  category: string;
  displayName: string;
  settings: Setting[];
}

// Default placeholders for empty values
const getPlaceholder = (key: string, dataType: string): string => {
  const placeholders: Record<string, string> = {
    store_name: "Store Name",
    store_owner: "Owner Name",
    store_location: "Store Address",
    store_contact: "Contact Information",
    vat_amount: "0",
    show_vat: "false",
  };

  if (placeholders[key]) {
    return placeholders[key];
  }

  // Generic placeholders based on data type
  if (
    dataType === "number" ||
    dataType === "decimal" ||
    dataType === "percentage"
  ) {
    return "0";
  }
  if (dataType === "boolean") {
    return "false";
  }
  return "Enter value";
};

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching settings from /api/systemsettings...");
      const response = await apiEndpoints.systemSettings.getAll();
      console.log("Settings response:", response);
      console.log("Settings data:", response.data);

      // Group settings by category
      const grouped: Record<string, CategoryGroup> = {};
      response.data.forEach((setting) => {
        if (!grouped[setting.category]) {
          grouped[setting.category] = {
            category: setting.category,
            displayName:
              setting.category.charAt(0).toUpperCase() +
              setting.category.slice(1) +
              " Settings",
            settings: [],
          };
        }
        grouped[setting.category].settings.push(setting);
      });

      const categoryArray = Object.values(grouped);
      setCategories(categoryArray);

      // Initialize form values
      const initialValues: Record<string, string> = {};
      response.data.forEach((setting) => {
        initialValues[setting.key] = setting.value || "";
      });
      setFormValues(initialValues);
      console.log("Initialized form values:", initialValues);
      console.log("Grouped categories:", categoryArray);
    } catch (err: any) {
      console.error("Failed to fetch settings:", err);
      console.error("Error details:", err.response?.data);
      setError(
        err.response?.data?.error || err.message || "Failed to load settings"
      );

      notifications.show({
        title: "Error loading settings",
        message:
          err.response?.data?.error ||
          err.message ||
          "Failed to load settings. Please ensure the backend is running and settings have been seeded.",
        color: "red",
        icon: <IconAlertCircle size={16} />,
        autoClose: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      // Update each setting individually
      const updates = Object.entries(formValues).map(async ([key, value]) => {
        // Find the setting to get its dataType
        const setting = categories
          .flatMap((c) => c.settings)
          .find((s) => s.key === key);

        // If value is empty, use the placeholder
        const finalValue =
          value.trim() === ""
            ? getPlaceholder(key, setting?.dataType || "string")
            : value;

        return apiEndpoints.systemSettings.updateSetting(key, finalValue);
      });

      // Wait for all updates to complete
      await Promise.all(updates);

      notifications.show({
        title: "Settings saved",
        message: "All settings have been updated successfully",
        color: "green",
        icon: <IconCheck size={16} />,
      });

      // Refetch to show updated values
      await fetchSettings();

      // Update global Redux state for POS page
      try {
        dispatch(fetchSettingsStart());
        const response = await apiEndpoints.systemSettings.getAll();

        const settingsObj = {
          storeName:
            response.data.find((s) => s.key === "store_name")?.value ||
            "OCT POS",
          storeOwner:
            response.data.find((s) => s.key === "store_owner")?.value || "",
          storeLocation:
            response.data.find((s) => s.key === "store_location")?.value || "",
          storeContact:
            response.data.find((s) => s.key === "store_contact")?.value || "",
          vatAmount: Number(
            response.data.find((s) => s.key === "vat_amount")?.value || 0
          ),
          showVat:
            response.data.find((s) => s.key === "show_vat")?.value === "true",
        };

        dispatch(fetchSettingsSuccess(settingsObj));
        console.log("Global settings updated:", settingsObj);
      } catch (error: any) {
        console.error("Failed to update global settings:", error);
        dispatch(
          fetchSettingsFailure(error.message || "Failed to update settings")
        );
      }
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      notifications.show({
        title: "Save failed",
        message:
          err.response?.data?.error || err.message || "Failed to save settings",
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting: Setting) => {
    const value = formValues[setting.key] || "";
    const placeholder = getPlaceholder(setting.key, setting.dataType);

    switch (setting.dataType) {
      case "boolean":
        return (
          <Switch
            checked={value === "true"}
            onChange={(event) =>
              handleValueChange(
                setting.key,
                event.currentTarget.checked ? "true" : "false"
              )
            }
            label={value === "true" ? "Enabled" : "Disabled"}
          />
        );

      case "number":
      case "decimal":
      case "percentage":
        return (
          <NumberInput
            value={value === "" ? "" : Number(value)}
            onChange={(val) => handleValueChange(setting.key, String(val))}
            placeholder={placeholder}
            min={0}
            max={setting.dataType === "percentage" ? 100 : undefined}
            decimalScale={
              setting.dataType === "decimal" ||
              setting.dataType === "percentage"
                ? 2
                : 0
            }
            suffix={setting.dataType === "percentage" ? "%" : undefined}
          />
        );

      default:
        return (
          <TextInput
            value={value}
            onChange={(event) =>
              handleValueChange(setting.key, event.currentTarget.value)
            }
            placeholder={placeholder}
          />
        );
    }
  };

  if (loading) {
    return (
      <Container size="xl" py="md">
        <Group justify="center" py="xl">
          <Loader size="lg" />
          <Text>Loading settings...</Text>
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="md">
        <Alert
          color="red"
          title="Error loading settings"
          icon={<IconAlertCircle size={16} />}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Settings</Title>
          <Text size="sm" c="dimmed">
            Configure system-wide settings for your pharmacy
          </Text>
        </div>
        <Button
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={handleSaveAll}
          loading={saving}
          size="md"
        >
          Save All Settings
        </Button>
      </Group>

      <Stack gap="lg">
        {categories.length === 0 ? (
          <Alert color="blue" title="No settings found">
            No system settings are configured yet. Please ensure the backend has
            been seeded with default settings.
          </Alert>
        ) : (
          categories.map((category) => (
            <Paper
              key={category.category}
              p="lg"
              shadow="sm"
              radius="md"
              withBorder
            >
              <Title order={3} mb="md">
                {category.displayName}
              </Title>

              <Grid gutter="md">
                {category.settings.map((setting) => (
                  <Grid.Col key={setting.key} span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <div>
                        <Text size="sm" fw={500}>
                          {setting.displayName}
                          {setting.isRequired && (
                            <Text component="span" c="red" ml={4}>
                              *
                            </Text>
                          )}
                        </Text>
                        {setting.description && (
                          <Text size="xs" c="dimmed">
                            {setting.description}
                          </Text>
                        )}
                      </div>
                      {renderSettingInput(setting)}
                    </Stack>
                  </Grid.Col>
                ))}
              </Grid>
            </Paper>
          ))
        )}
      </Stack>

      <Group justify="flex-end" mt="xl">
        <Button
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={handleSaveAll}
          loading={saving}
          size="lg"
        >
          Save All Settings
        </Button>
      </Group>
    </Container>
  );
}
