import type { DesktopAPI } from "../types/global";
import { checkTauriAvailability, invokeTauriCommand } from "./tauri-bridge";

export async function createTauriAPI(): Promise<DesktopAPI | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const isAvailable = await checkTauriAvailability();

    if (!isAvailable) {
      return null;
    }

    return {
      app: {
        getVersion: () => invokeTauriCommand<string>("get_app_version"),
        getPlatform: () => invokeTauriCommand<string>("get_platform"),
      },

      hardware: {
        openCashDrawer: () => invokeTauriCommand<string>("open_cash_drawer"),
        printReceipt: (data: any) =>
          invokeTauriCommand<string>("print_receipt", { receiptData: data }),
      },

      store: {
        get: async (_key: string) => {
          return null;
        },
        set: async (_key: string, _value: any) => {},
      },

      ui: {
        showAlert: (title: string, message: string) =>
          invokeTauriCommand<string>("show_alert", { title, message }),
      },
    };
  } catch (error) {
    console.error("Failed to create Tauri API:", error);
    return null;
  }
}
