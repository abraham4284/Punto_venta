import { Route, Routes } from "react-router-dom";
import { BusinessSubscriptionPage } from "../page/BusinessSubscriptionPage";

export const BusinessSubscriptionRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<BusinessSubscriptionPage />} />
    </Routes>
  );
};
