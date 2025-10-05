import { useQuery } from "@tanstack/react-query";
import { apiEndpoints, Role } from "../../lib/api";

export const rolesKeys = {
  all: ["roles"] as const,
  list: () => [...rolesKeys.all, "list"] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: rolesKeys.list(),
    queryFn: async (): Promise<Role[]> => {
      const response = await apiEndpoints.roles.getAll();
      return response.data;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
