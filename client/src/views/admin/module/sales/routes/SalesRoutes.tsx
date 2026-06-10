import { Route, Routes } from "react-router-dom";
import { SalesPage } from "../page/SalesPage";

export const SalesRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<SalesPage />} />
    </Routes>
  );
};
