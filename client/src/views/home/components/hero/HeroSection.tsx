import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, PackageSearch, ScanBarcode } from "lucide-react";

import { BrandLogo } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(22,163,106,0.16),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f7f9fa_100%)]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
        <div className="space-y-7">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Software moderno para puntos de venta
          </Badge>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Vendé más simple. Controlá todo.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Cajora centraliza ventas, stock por depósito, compras, clientes y
              reportes en un panel rápido, claro y preparado para comercios
              reales.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" render={<Link to="/register" />}>
              Empezar ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" render={<Link to="/login" />}>
              Ya tengo cuenta
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Ventas con lector de codigo",
              "Inventario por deposito",
              "Importacion desde Excel",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b bg-[#101828] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs text-white/70">Panel Cajora</span>
              <BrandLogo
                variant="isotype"
                tone="white"
                imageClassName="ml-auto h-6 w-6"
              />
            </div>
            <div className="grid gap-4 p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["Ventas hoy", "$ 248.500", "text-emerald-700"],
                  ["Productos bajos", "12", "text-amber-700"],
                  ["Tickets emitidos", "86", "text-blue-700"],
                ].map(([label, value, color]) => (
                  <div key={label} className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Venta rapida</p>
                    <p className="text-xs text-muted-foreground">
                      Preparado para scanner
                    </p>
                  </div>
                  <ScanBarcode className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-3">
                  {["Gaseosa 500ml", "Pan por kilo", "Queso fresco"].map((product, index) => (
                    <div
                      key={product}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <PackageSearch className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{product}</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {index === 0 ? "$ 2.100" : index === 1 ? "$ 1.850" : "$ 4.300"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
