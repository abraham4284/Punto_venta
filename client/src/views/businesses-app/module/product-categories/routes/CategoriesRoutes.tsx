import { Route, Routes } from "react-router-dom";
import { ProductCategoriesPage } from "../page/ProductCategoriesPage";

export function CategoriesRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProductCategoriesPage />} />
    </Routes>
  );
}
