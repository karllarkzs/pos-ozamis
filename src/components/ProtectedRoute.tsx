import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/hooks";
import {
  canAccessPOS,
  canAccessAdmin,
  getDefaultRouteForRole,
} from "../store/slices/authSlice";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredAccess: "pos" | "admin";
}

export function ProtectedRoute({
  children,
  requiredAccess,
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  // If not logged in → always send to "/"
  if (!isAuthenticated || !user) return <Navigate to="/" replace />;

  const hasAccess =
    requiredAccess === "pos"
      ? canAccessPOS(user.role)
      : canAccessAdmin(user.role);

  // Logged in but wrong role → send to their home (no /forbidden)
  if (!hasAccess)
    return <Navigate to={getDefaultRouteForRole(user.role) || "/"} replace />;

  return <>{children}</>;
}
