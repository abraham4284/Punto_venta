import { Route, Routes } from "react-router-dom";
import { PermissionRoute } from "@/views/businesses-app/components/PermissionRoute";
import { BusinessUsersPage } from "../page/BusinessUsersPage";

export const BusinessUsersRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PermissionRoute permissions={["users.view"]}>
            <BusinessUsersPage />
          </PermissionRoute>
        }
      />
    </Routes>
  );
};

