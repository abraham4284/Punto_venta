import { Route, Routes } from "react-router-dom";
import { NotificationsPage } from "../page/NotificationsPage";

export const NotificationsRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<NotificationsPage />} />
    </Routes>
  );
};
