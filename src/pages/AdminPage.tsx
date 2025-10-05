import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { DashboardPage } from "./admin/DashboardPage";
import { InventoryPage } from "./admin/InventoryPage";
import { ReportsPage } from "./admin/ReportsPage";
import { UsersPage } from "./admin/UsersPage";
import { SettingsPage } from "./admin/SettingsPage";
import { useAuth } from "../store/hooks";
import { canAccessAdmin } from "../store/slices/authSlice";
import { useEffect } from "react";

export function AdminPage() {
  const { user } = useAuth();

  useEffect(() => {
    if (user && !canAccessAdmin(user.role)) {
      window.location.href = "/forbidden";
    }
  }, [user]);

  if (!user || !canAccessAdmin(user.role)) {
    return null;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AdminLayout>
  );
}
