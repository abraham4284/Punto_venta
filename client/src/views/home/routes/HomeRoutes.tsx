import { Routes, Route } from "react-router-dom";
import { HomePage } from "../page/HomePage";
import { LoginPage } from "../page/LoginPage";
import { RegisterPage } from "../page/RegisterPage";
import { LegalDocumentPage } from "@/views/businesses-app/module/legal/page/LegalDocumentPage";

export const HomeRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/terms"
        element={<LegalDocumentPage code="TERMS" title="Términos y condiciones" />}
      />
      <Route
        path="/terms/:version"
        element={<LegalDocumentPage code="TERMS" title="Términos y condiciones" />}
      />
      <Route
        path="/privacy"
        element={<LegalDocumentPage code="PRIVACY" title="Política de privacidad" />}
      />
      <Route
        path="/privacy/:version"
        element={<LegalDocumentPage code="PRIVACY" title="Política de privacidad" />}
      />
    </Routes>
  );
};
