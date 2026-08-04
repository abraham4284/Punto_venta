import { Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  BusinessessRoutes,
  BusinessSubscriptionRoutes,
  BusinessUsersRoutes,
  CashRoutes,
  CategoriesRoutes,
  ClientsRoutes,
  DashboardRoutes,
  DepositsRoutes,
  PaymentMethodsRoutes,
  ProductsRoutes,
  PurchasesRoutes,
  SalesRoutes,
  StockRoutes,
  SuppliersRoutes,
} from "@/views/businesses-app/module";
import { ProfilePage } from "@/views/businesses-app/module/auth/page/ProfilePage";
import { PermissionRoute } from "@/views/businesses-app/components/PermissionRoute";

export const AdminRoutes = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route
          path="/dashboard/*"
          element={
            <PermissionRoute permissions={["dashboard.view"]}>
              <DashboardRoutes />
            </PermissionRoute>
          }
        />
        <Route
          path="/clients/*"
          element={
            <PermissionRoute permissions={["customers.view"]}>
              <ClientsRoutes />
            </PermissionRoute>
          }
        />
        <Route
          path="/categories-product/*"
          element={
            <PermissionRoute permissions={["categories.view"]}>
              <CategoriesRoutes />
            </PermissionRoute>
          }
        />
        <Route
          path="/products/*"
          element={
            <PermissionRoute permissions={["products.view"]}>
              <ProductsRoutes />
            </PermissionRoute>
          }
        />
        <Route
          path="/deposits/*"
          element={
            <PermissionRoute permissions={["deposits.view"]}>
              <DepositsRoutes />
            </PermissionRoute>
          }
        />
        <Route
          path="/payment-methods/*"
          element={
            <PermissionRoute permissions={["payment_methods.view"]}>
              <PaymentMethodsRoutes />
            </PermissionRoute>
          }
        />
        <Route
          path="/stock/*"
          element={
            <PermissionRoute
              permissions={["stock.view", "stock.view_movements", "stock.view_critical"]}
            >
              <StockRoutes />
            </PermissionRoute>
          }
        />
        <Route
          path="/cash/*"
          element={
            <PermissionRoute
              permissions={[
                "cash_sessions.view",
                "cash_sessions.view_history",
                "cash_registers.view",
              ]}
            >
              <CashRoutes />
            </PermissionRoute>
          }
        />
        <Route
          path="/sales/*"
          element={
            <PermissionRoute permissions={["sales.view", "sales.create"]}>
              <SalesRoutes />
            </PermissionRoute>
          }
        />
        <Route
          path="/purchases/*"
          element={
            <PermissionRoute permissions={["purchases.view", "purchases.create"]}>
              <PurchasesRoutes />
            </PermissionRoute>
          }
        />
        <Route
          path="/suppliers/*"
          element={
            <PermissionRoute permissions={["suppliers.view"]}>
              <SuppliersRoutes />
            </PermissionRoute>
          }
        />
        <Route
          path="/businesses/*"
          element={
            <PermissionRoute permissions={["business.view"]}>
              <BusinessessRoutes />
            </PermissionRoute>
          }
        />
        <Route
          path="/subscription/*"
          element={
            <PermissionRoute permissions={["subscription.view"]}>
              <BusinessSubscriptionRoutes />
            </PermissionRoute>
          }
        />
        <Route path="/users/*" element={<BusinessUsersRoutes />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </AdminLayout>
  );
};
