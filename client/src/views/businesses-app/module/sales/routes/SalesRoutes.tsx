import { Route, Routes } from "react-router-dom";
import { CreateSalePage } from "../page/CreateSalePage";
import { SaleAllPage } from "../page/SaleAllPage";
import { ViewSaleDetails } from "../page/ViewSaleDetails";
import { PermissionRoute } from "@/views/businesses-app/components/PermissionRoute";

export const SalesRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PermissionRoute permissions={["sales.create"]}>
            <CreateSalePage />
          </PermissionRoute>
        }
      />
      <Route
        path="/history"
        element={
          <PermissionRoute permissions={["sales.view"]}>
            <SaleAllPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/:idSale"
        element={
          <PermissionRoute permissions={["sales.view"]}>
            <ViewSaleDetails />
          </PermissionRoute>
        }
      />
    </Routes>
  );
};
