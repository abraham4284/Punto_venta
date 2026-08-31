import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuthStore } from "@/views/businesses-app/module/auth/store/auth.store";
import { useBusinesses } from "@/views/businesses-app/module/businesses/hooks/useBusinesses";

type MetaProps = {
  title: string;
};

const DEFAULT_APP_NAME = "Cajora";

export const Meta = ({ title }: MetaProps) => {
  const user = useAuthStore((state) => state.user);
  const { business, getBusiness, resetBusiness } = useBusinesses();
  const businessName = business?.name || DEFAULT_APP_NAME;
  const fullTitle = `${businessName} - ${title}`;

  useEffect(() => {
    if (!user?.idBusiness) return;

    void getBusiness();

    return () => {
      resetBusiness();
    };
  }, [getBusiness, resetBusiness, user?.idBusiness]);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta property="og:title" content={fullTitle} />
    </Helmet>
  );
};
