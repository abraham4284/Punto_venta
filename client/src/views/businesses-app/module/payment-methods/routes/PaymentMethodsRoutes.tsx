import { Route, Routes } from "react-router-dom";
import { PermissionRoute } from "@/views/businesses-app/components/PermissionRoute";
import { PaymentMethodsPage } from "../page/PaymentMethodsPage";

export const PaymentMethodsRoutes = () => {
  return (
    <Routes>
      <Route
        index
        element={
          <PermissionRoute permissions={["payment_methods.view"]}>
            <PaymentMethodsPage />
          </PermissionRoute>
        }
      />
    </Routes>
  );
};
