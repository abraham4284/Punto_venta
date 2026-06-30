import { Route, Routes } from "react-router-dom";
import { CreateSalePage } from "../page/CreateSalePage";
import { SaleAllPage } from "../page/SaleAllPage";
import { ViewSaleDetails } from "../page/ViewSaleDetails";

export const SalesRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CreateSalePage />} />
      <Route path="/history" element={<SaleAllPage />} />
      <Route path="/:idSale" element={<ViewSaleDetails />} />
    </Routes>
  );
};
