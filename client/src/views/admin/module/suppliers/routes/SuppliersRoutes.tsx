import { Route, Routes } from "react-router-dom";
import { SuppliersPage } from "../page/SuppliersPage";

export const SuppliersRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<SuppliersPage />} />
    </Routes>
  );
};
