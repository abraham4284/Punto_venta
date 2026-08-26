import { Route, Routes } from "react-router-dom";
import { LegalPage } from "../page/LegalPage";

export const LegalRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LegalPage />} />
    </Routes>
  );
};
