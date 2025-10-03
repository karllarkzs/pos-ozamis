let isTauriAvailable = false;
let pendingRequests = new Map<
  string,
  { resolve: (value: any) => void; reject: (error: any) => void }
>();

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

window.addEventListener("message", (event) => {
  const data = event.data;

  if (data.type === "TAURI_AVAILABLE") {
    isTauriAvailable = data.available;
  } else if (data.type === "TAURI_RESPONSE") {
    const request = pendingRequests.get(data.id);
    if (request) {
      request.resolve(data.result);
      pendingRequests.delete(data.id);
    }
  } else if (data.type === "TAURI_ERROR") {
    const request = pendingRequests.get(data.id);
    if (request) {
      request.reject(new Error(data.error));
      pendingRequests.delete(data.id);
    }
  }
});

export function checkTauriAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.self !== window.top) {
      window.parent.postMessage({ type: "TAURI_CHECK" }, "*");

      setTimeout(() => {
        resolve(isTauriAvailable);
      }, 100);
    } else {
      resolve(!!window.__TAURI__);
    }
  });
}

export function invokeTauriCommand<T>(
  cmd: string,
  args?: Record<string, any>
): Promise<T> {
  if (window.self !== window.top) {
    return new Promise((resolve, reject) => {
      const id = generateId();
      pendingRequests.set(id, { resolve, reject });

      window.parent.postMessage(
        {
          type: "TAURI_INVOKE",
          id,
          cmd,
          args: args || {},
        },
        "*"
      );

      setTimeout(() => {
        if (pendingRequests.has(id)) {
          pendingRequests.delete(id);
          reject(new Error("Tauri command timeout"));
        }
      }, 5000);
    });
  } else if (window.__TAURI__) {
    return window.__TAURI__.core.invoke(cmd, args);
  } else {
    return Promise.reject(new Error("Tauri is not available"));
  }
}

export function isTauri(): boolean {
  return isTauriAvailable || !!window.__TAURI__;
}

checkTauriAvailability();
