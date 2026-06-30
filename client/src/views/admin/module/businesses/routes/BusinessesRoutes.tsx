import { Route, Routes } from "react-router-dom";
import { BusinessesPage } from "../page/BusinessesPage";

export function BusinessessRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BusinessesPage />} />
    </Routes>
  );
}
