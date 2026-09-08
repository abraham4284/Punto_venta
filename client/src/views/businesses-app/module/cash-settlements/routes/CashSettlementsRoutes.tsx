import { Route, Routes } from "react-router-dom";
import { CashSettlementDetailsPage } from "../page/CashSettlementDetailsPage";
import { CashSettlementsPage } from "../page/CashSettlementsPage";

export const CashSettlementsRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CashSettlementsPage />} />
      <Route path="/:id" element={<CashSettlementDetailsPage />} />
    </Routes>
  );
};
