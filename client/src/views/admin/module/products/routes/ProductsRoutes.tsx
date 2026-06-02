import { Route, Routes } from "react-router-dom";
import { ProductsPage } from "../page/ProductsPage";

export function ProductsRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProductsPage />} />
    </Routes>
  );
}