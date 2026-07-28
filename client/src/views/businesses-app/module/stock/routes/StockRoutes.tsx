import { Route, Routes } from "react-router-dom";
import { StockPage } from "../page/StockPage";
import { StockMovementPage } from "../page/StockMovementPage";
import { InfoStockCritical } from "../page/InfoStockCritical";
import { PermissionRoute } from "@/views/businesses-app/components/PermissionRoute";

export function StockRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PermissionRoute permissions={["stock.view"]}>
            <StockPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/movements"
        element={
          <PermissionRoute permissions={["stock.view_movements"]}>
            <StockMovementPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/critical"
        element={
          <PermissionRoute permissions={["stock.view_critical"]}>
            <InfoStockCritical />
          </PermissionRoute>
        }
      />
    </Routes>
  );
}
