import { Navigate, Route, Routes } from "react-router-dom";
import { PlatformProtectedRoute } from "@/views/platform/middlewares/PlatformProtectedRoute";
import { PlatformLayout } from "@/views/platform/components/layout/PlatformLayout";
import { PlatformLoginPage } from "@/views/platform/module/auth";
import { PlatformDashboardPage } from "@/views/platform/module/dashboard";
import { SubscriptionsRoutes } from "@/views/platform/module/subscriptions";
import {
  PlatformBusinessDetailPage,
  PlatformBusinessesPage,
} from "@/views/platform/module/businesses";
import { PlatformAuditPage } from "@/views/platform/module/audit";
import { PlatformUsersPage } from "@/views/platform/module/users";

export const PlatformRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<PlatformLoginPage />} />
      <Route
        path="/dashboard"
        element={
          <PlatformProtectedRoute>
            <PlatformLayout>
              <PlatformDashboardPage />
            </PlatformLayout>
          </PlatformProtectedRoute>
        }
      />
      <Route
        path="/businesses"
        element={
          <PlatformProtectedRoute>
            <PlatformLayout>
              <PlatformBusinessesPage />
            </PlatformLayout>
          </PlatformProtectedRoute>
        }
      />
      <Route
        path="/businesses/:idBusiness"
        element={
          <PlatformProtectedRoute>
            <PlatformLayout>
              <PlatformBusinessDetailPage />
            </PlatformLayout>
          </PlatformProtectedRoute>
        }
      />
      <Route
        path="/subscriptions/*"
        element={
          <PlatformProtectedRoute>
            <PlatformLayout>
              <SubscriptionsRoutes />
            </PlatformLayout>
          </PlatformProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <PlatformProtectedRoute>
            <PlatformLayout>
              <PlatformAuditPage />
            </PlatformLayout>
          </PlatformProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PlatformProtectedRoute>
            <PlatformLayout>
              <PlatformUsersPage />
            </PlatformLayout>
          </PlatformProtectedRoute>
        }
      />
      <Route path="/*" element={<Navigate to="/platform/dashboard" replace />} />
    </Routes>
  );
};
