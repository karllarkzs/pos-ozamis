import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // cache 10m
      gcTime: 15 * 60 * 1000, // keep in cache a bit longer
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // <- was true
      refetchOnMount: false, // <- add this
      retry: (failureCount, error: any) => {
        if (axios.isCancel(error)) return false;
        if (error?.response?.status >= 400 && error?.response?.status < 500)
          return false;
        return failureCount < 1; // <- calmer than 3
      },
      networkMode: "online",
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (axios.isCancel(error)) return false;
        if (error?.response?.status >= 400 && error?.response?.status < 500)
          return false;
        return failureCount < 2;
      },
      networkMode: "online",
    },
  },
});
