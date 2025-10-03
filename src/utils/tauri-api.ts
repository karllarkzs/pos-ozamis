
import type { DesktopAPI } from "../types/global";

export async function createTauriAPI(): Promise<DesktopAPI | null> {
  
  if (typeof window === "undefined" || !window.__TAURI__) {
    return null;
  }

  try {
    const win = window as any;

    
    let invoke = null;

    if (win.__TAURI__?.core?.invoke) {
      invoke = win.__TAURI__.core.invoke;
    } else if (win.ipc?.invoke) {
      invoke = win.ipc.invoke;
    } else if (win.__TAURI_INVOKE__) {
      invoke = win.__TAURI_INVOKE__;
    } else if (win.__TAURI__?.invoke) {
      invoke = win.__TAURI__.invoke;
    } else if (win.__TAURI_TAURI__?.invoke) {
      invoke = win.__TAURI_TAURI__.invoke;
    }

    if (invoke) {
      return {
        app: {
          getVersion: () => invoke("get_app_version"),
          getPlatform: () => invoke("get_platform"),
        },

        hardware: {
          openCashDrawer: () => invoke("open_cash_drawer"),
          printReceipt: (data: any) =>
            invoke("print_receipt", { receiptData: data }),
        },

        store: {
          get: async (_key: string) => {
            // TODO: Implement with Tauri's fs API if needed
            return null;
          },
          set: async (_key: string, _value: any) => {
            // TODO: Implement with Tauri's fs API if needed
          },
        },

        ui: {
          showAlert: (title: string, message: string) =>
            invoke("show_alert", { title, message }),
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to create Tauri API:", error);
    return null;
  }
}
