import { Routes, Route } from "react-router-dom";
import { HomeRoutes } from "@/views/home";
import { AdminRoutes } from "@/views/businesses-app";
import { PrivateRoute } from "@/views/businesses-app/middlewares/PrivateRoute";
import { PlatformRoutes } from "@/views/platform";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/platform/*" element={<PlatformRoutes />} />
      <Route
        path="/admin/*"
        element={
          <PrivateRoute>
            <AdminRoutes />
          </PrivateRoute>
        }
      />
      <Route path="/*" element={<HomeRoutes />} />
    </Routes>
  );
};
