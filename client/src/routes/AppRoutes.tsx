import { Routes, Route } from "react-router-dom";
import { HomeRoutes } from "@/views/home";
import { AdminRoutes } from "@/views/businesses-app";
import { PrivateRoute } from "@/views/businesses-app/middlewares/PrivateRoute";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/*" element={<HomeRoutes />} />
      <Route
        path="/admin/*"
        element={
          <PrivateRoute>
            <AdminRoutes />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};
