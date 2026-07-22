import { Route, Routes } from "react-router-dom";
import { DepositsPage } from "../page/DepositsPage";

export function DepositsRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DepositsPage />} />
    </Routes>
  );
}
