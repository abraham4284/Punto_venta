import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import { AuthInitializer } from "@/components";
import { AppRoutes } from "@/routes/AppRoutes";

export const CajoraApp = () => {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <HelmetProvider>
          <AppRoutes />
        </HelmetProvider>
      </AuthInitializer>
    </BrowserRouter>
  );
};
