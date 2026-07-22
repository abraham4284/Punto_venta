import { Route, Routes } from "react-router-dom";
import { CreatePurchasePage } from "../page/CreatePurchasePage";
import { PurchaseAllPage } from "../page/PurchaseAllPage";
import { ViewPurchaseDetails } from "../page/ViewPurchaseDetails";

export const PurchasesRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CreatePurchasePage />} />
      <Route path="/history" element={<PurchaseAllPage />} />
      <Route path="/:idPurchase" element={<ViewPurchaseDetails />} />
    </Routes>
  );
};
