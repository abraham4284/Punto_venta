import { Route, Routes } from "react-router-dom";
import { StockPage } from "../page/StockPage";
import { StockMovementPage } from "../page/StockMovementPage";
import { InfoStockCritical } from "../page/InfoStockCritical";

export function StockRoutes() {
  return (
    <Routes>
      <Route path="/" element={<StockPage />} />
      <Route path="/movements" element={<StockMovementPage />} />
      <Route path="/critical" element={<InfoStockCritical />} />
    </Routes>
  );
}
