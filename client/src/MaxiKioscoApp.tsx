import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes/AppRoutes";
import { HelmetProvider } from "react-helmet-async";
import { AuthInitializer } from "@/components";

export const MaxiKioscoApp = () => {
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
