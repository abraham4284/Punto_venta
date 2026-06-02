import { Routes, Route } from "react-router-dom";
import { LoginPage } from "../page/LoginPage";

export const HomeRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};
