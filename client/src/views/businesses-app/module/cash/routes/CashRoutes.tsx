import { Route, Routes } from "react-router-dom";
import { PermissionRoute } from "@/views/businesses-app/components/PermissionRoute";
import { CashHistoryPage } from "../page/CashHistoryPage";
import { CashPage } from "../page/CashPage";
import { CashRegistersPage } from "../page/CashRegistersPage";

export const CashRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PermissionRoute permissions={["cash_sessions.view"]}>
            <CashPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/history"
        element={
          <PermissionRoute permissions={["cash_sessions.view_history"]}>
            <CashHistoryPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/registers"
        element={
          <PermissionRoute permissions={["cash_registers.view"]}>
            <CashRegistersPage />
          </PermissionRoute>
        }
      />
    </Routes>
  );
};
