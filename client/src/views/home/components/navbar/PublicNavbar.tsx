import { Link } from "react-router-dom";
import { BarChart3, Store } from "lucide-react";

import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Precios", href: "#precios" },
];

export const PublicNavbar = () => {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </span>
          <span className="font-heading text-lg font-bold">
            MaxiKiosco App
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link to="/login" />}>
            Iniciar sesion
          </Button>
          <Button className="hidden sm:inline-flex" render={<Link to="/register" />}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Registrar mi comercio
          </Button>
        </div>
      </nav>
    </header>
  );
};
