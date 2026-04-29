export interface DesktopAPI {
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
  };

  hardware: {
    getPrinters: () => Promise<string[]>;
    testPrintReceipt: (printerName: string) => Promise<string>;
    printEscposReceipt: (
      printerName: string,
      escposData: number[]
    ) => Promise<string>;
    printReceipt: (data: any) => Promise<string>;
  };

  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };

  ui: {
    showAlert: (title: string, message: string) => Promise<string>;
  };
}

declare global {
  interface Window {
    electronAPI?: DesktopAPI;
    __TAURI__?: any;
  }
}

export {};
