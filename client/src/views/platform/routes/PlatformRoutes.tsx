import { Navigate, Route, Routes } from "react-router-dom";
import { PlatformProtectedRoute } from "@/views/platform/middlewares/PlatformProtectedRoute";
import { PlatformLayout } from "@/views/platform/components/layout/PlatformLayout";
import { PlatformLoginPage } from "@/views/platform/module/auth";
import { PlatformDashboardPage } from "@/views/platform/module/dashboard";

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
      <Route path="/*" element={<Navigate to="/platform/dashboard" replace />} />
    </Routes>
  );
};
