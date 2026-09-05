import { Route, Routes } from "react-router-dom";
import { CashSettlementsPage } from "../page/CashSettlementsPage";

export const CashSettlementsRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CashSettlementsPage />} />
    </Routes>
  );
};
