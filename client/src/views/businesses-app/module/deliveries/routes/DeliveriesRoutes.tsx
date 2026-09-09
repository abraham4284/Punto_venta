import { Route, Routes } from "react-router-dom";
import { MyPendingSettlementPage } from "../../cash-settlements/page/MyPendingSettlementPage";
import { DeliveryDetailsPage } from "../page/DeliveryDetailsPage";
import { DeliveriesPage } from "../page/DeliveriesPage";

export const DeliveriesRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DeliveriesPage />} />
      <Route path="/my-settlement" element={<MyPendingSettlementPage />} />
      <Route path="/:id" element={<DeliveryDetailsPage />} />
    </Routes>
  );
};
