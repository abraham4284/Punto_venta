import { Route, Routes } from "react-router-dom";
import { PermissionRoute } from "@/views/businesses-app/components/PermissionRoute";
import { OrdersPage } from "../page/OrdersPage";
import { EditOrderPage, NewOrderPage } from "../page/OrderFormPage";
import { OrderDetailPage } from "../page/OrderDetailPage";

export const OrdersRoutes = () => <Routes>
  <Route path="/" element={<PermissionRoute permissions={["orders.view"]}><OrdersPage /></PermissionRoute>} />
  <Route path="/new" element={<PermissionRoute permissions={["orders.create"]}><NewOrderPage /></PermissionRoute>} />
  <Route path="/:idOrder" element={<PermissionRoute permissions={["orders.view"]}><OrderDetailPage /></PermissionRoute>} />
  <Route path="/:idOrder/edit" element={<PermissionRoute permissions={["orders.update"]}><EditOrderPage /></PermissionRoute>} />
</Routes>;
