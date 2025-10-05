import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,

      gcTime: 10 * 60 * 1000,

      retry: (failureCount, error: any) => {
        if (axios.isCancel(error)) {
          return false;
        }

        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }

        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: "online",
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (axios.isCancel(error)) {
          return false;
        }

        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }

        return failureCount < 2;
      },

      networkMode: "online",
    },
  },
});
