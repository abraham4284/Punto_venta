import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeaturesSection } from "../components/features/FeaturesSection";
import { HeroSection } from "../components/hero/HeroSection";
import { PublicNavbar } from "../components/navbar/PublicNavbar";

export const HomePage = () => {
  return (
    <>
      <Meta title="Inicio" />
      <div className="min-h-screen bg-background text-foreground">
        <PublicNavbar />
        <HeroSection />

        <section id="beneficios" className="bg-slate-50 py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
            <Card className="border-emerald-100 bg-white">
              <CardContent className="flex gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Operaciones rapidas</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Diseñado para atender clientes sin friccion, registrar
                    productos con lector y mantener el stock actualizado.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-100 bg-white">
              <CardContent className="flex gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Datos seguros por comercio</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Cada negocio administra sus usuarios, clientes, ventas y
                    mercaderia sin mezclarse con otros comercios.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <FeaturesSection />

        <section id="precios" className="bg-slate-950 py-20 text-white">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tu negocio, bajo control.
            </h2>
            <p className="mt-4 max-w-2xl text-white/70">
              Centraliza ventas, compras, stock y reportes en un sistema simple
              para usar todos los dias.
            </p>
            <Button className="mt-8" size="lg" render={<Link to="/register" />}>
              Registrar mi comercio
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        <footer className="border-t bg-white py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} Cajora. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <a href="#funcionalidades" className="hover:text-foreground">
                Funcionalidades
              </a>
              <a href="#beneficios" className="hover:text-foreground">
                Beneficios
              </a>
              <Link to="/login" className="hover:text-foreground">
                Acceder
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
