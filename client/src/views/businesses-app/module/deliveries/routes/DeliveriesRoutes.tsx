import { Route, Routes } from "react-router-dom";
import { DeliveriesPage } from "../page/DeliveriesPage";

export const DeliveriesRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DeliveriesPage />} />
    </Routes>
  );
};
