import { Route, Routes } from "react-router-dom";
import { CustomersPage } from "../page/CustomersPage";

export function ClientsRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CustomersPage />} />
    </Routes>
  );
}