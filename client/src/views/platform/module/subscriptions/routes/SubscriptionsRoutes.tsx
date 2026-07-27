import { Navigate, Route, Routes } from "react-router-dom";
import { SubscriptionsPage } from "../page/SubscriptionsPage";

export const SubscriptionsRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<SubscriptionsPage />} />
      <Route path="/*" element={<Navigate to="/platform/subscriptions" replace />} />
    </Routes>
  );
};
