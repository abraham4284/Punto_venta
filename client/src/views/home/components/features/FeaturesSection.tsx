import {
  BarChart3,
  Building2,
  FileSpreadsheet,
  Landmark,
  PackageCheck,
  ShoppingCart,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Control de stock por deposito",
    description:
      "Consulta existencias, minimo critico y movimientos por cada almacen del negocio.",
    icon: PackageCheck,
  },
  {
    title: "Punto de venta rapido",
    description:
      "Registra ventas con buscador, codigo de barras y tickets listos para imprimir.",
    icon: ShoppingCart,
  },
  {
    title: "Importacion masiva desde Excel",
    description:
      "Carga catalogos completos con preview, validaciones y stock inicial por deposito.",
    icon: FileSpreadsheet,
  },
  {
    title: "Reportes y metricas",
    description:
      "Visualiza ventas por periodo, productos y evolucion del negocio desde el dashboard.",
    icon: BarChart3,
  },
  {
    title: "Gestion multi-negocio",
    description:
      "Cada comercio trabaja aislado con sus propios usuarios, clientes, stock y ventas.",
    icon: Building2,
  },
  {
    title: "Compras y proveedores",
    description:
      "Administra proveedores, compras y reposicion de mercaderia de forma ordenada.",
    icon: Landmark,
  },
];

export const FeaturesSection = () => {
  return (
    <section id="funcionalidades" className="bg-white py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Funcionalidades
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Todo lo importante del comercio en un solo lugar
          </h2>
          <p className="mt-4 text-muted-foreground">
            Una experiencia pensada para operar rapido en mostrador y revisar
            datos con claridad cuando termina el dia.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="border-slate-200 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
