import { Link } from "react-router-dom";

export const PublicFooter = () => {
  return (
    <footer className="border-t bg-white py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>
          © {new Date().getFullYear()} Cajora. Todos los derechos reservados.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/" className="hover:text-foreground">
            Inicio
          </Link>
          <Link to="/funcionalidades" className="hover:text-foreground">
            Funcionalidades
          </Link>
          <Link to="/#beneficios" className="hover:text-foreground">
            Beneficios
          </Link>
          <Link to="/login" className="hover:text-foreground">
            Acceder
          </Link>
        </div>
      </div>
    </footer>
  );
};
