import { Route, Routes } from "react-router-dom";
import { StockPage } from "../page/StockPage";

export function StockRoutes() {
  return (
    <Routes>
      <Route path="/" element={<StockPage />} />
    </Routes>
  );
}
