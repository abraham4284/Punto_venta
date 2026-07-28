import { Route, Routes } from "react-router-dom";
import { CreatePurchasePage } from "../page/CreatePurchasePage";
import { PurchaseAllPage } from "../page/PurchaseAllPage";
import { ViewPurchaseDetails } from "../page/ViewPurchaseDetails";
import { PermissionRoute } from "@/views/businesses-app/components/PermissionRoute";

export const PurchasesRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PermissionRoute permissions={["purchases.create"]}>
            <CreatePurchasePage />
          </PermissionRoute>
        }
      />
      <Route
        path="/history"
        element={
          <PermissionRoute permissions={["purchases.view"]}>
            <PurchaseAllPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/:idPurchase"
        element={
          <PermissionRoute permissions={["purchases.view"]}>
            <ViewPurchaseDetails />
          </PermissionRoute>
        }
      />
    </Routes>
  );
};
