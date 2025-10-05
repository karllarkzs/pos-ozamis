import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/hooks";
import { canAccessPOS, canAccessAdmin } from "../store/slices/authSlice";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredAccess: "pos" | "admin";
}

export function ProtectedRoute({
  children,
  requiredAccess,
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  const hasAccess =
    requiredAccess === "pos"
      ? canAccessPOS(user.role)
      : canAccessAdmin(user.role);

  if (!hasAccess) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}

