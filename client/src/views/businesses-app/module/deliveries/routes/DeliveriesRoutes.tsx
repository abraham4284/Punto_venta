import { Route, Routes } from "react-router-dom";
import { DeliveryDetailsPage } from "../page/DeliveryDetailsPage";
import { DeliveriesPage } from "../page/DeliveriesPage";

export const DeliveriesRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DeliveriesPage />} />
      <Route path="/:id" element={<DeliveryDetailsPage />} />
    </Routes>
  );
};
