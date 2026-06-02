// components/Meta.tsx
import { Helmet } from "react-helmet-async";

type MetaProps = {
  title: string;
  description?: string;
};

export const Meta = ({ title, description }: MetaProps) => {
  const fullTitle = `${title} | Libro Contable`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}

      <meta property="og:title" content={fullTitle} />
      {description && (
        <meta property="og:description" content={description} />
      )}
    </Helmet>
  );
};