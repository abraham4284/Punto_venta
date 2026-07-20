import { Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  BusinessessRoutes,
  CategoriesRoutes,
  ClientsRoutes,
  DashboardRoutes,
  DepositsRoutes,
  ProductsRoutes,
  PurchasesRoutes,
  SalesRoutes,
  StockRoutes,
  SuppliersRoutes,
} from "@/views/admin/module";
import { ProfilePage } from "@/views/admin/module/auth/page/ProfilePage";

export const AdminRoutes = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/dashboard/*" element={<DashboardRoutes />} />
        <Route path="/clients/*" element={<ClientsRoutes />} />
        <Route path="/categories-product/*" element={<CategoriesRoutes />} />
        <Route path="/products/*" element={<ProductsRoutes />} />
        <Route path="/deposits/*" element={<DepositsRoutes />} />
        <Route path="/stock/*" element={<StockRoutes />} />
        <Route path="/sales/*" element={<SalesRoutes />} />
        <Route path="/purchases/*" element={<PurchasesRoutes />} />
        <Route path="/suppliers/*" element={<SuppliersRoutes />} />
        <Route path="/businesses/*" element={<BusinessessRoutes />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </AdminLayout>
  );
};
