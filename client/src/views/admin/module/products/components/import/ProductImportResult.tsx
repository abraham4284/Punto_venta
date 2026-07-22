import { AlertTriangle, CheckCircle2, PackageCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { ProductImportResult as ProductImportResultType } from "../../types/product-import.types";

interface ProductImportResultProps {
  result: ProductImportResultType;
}

const metricItems = (result: ProductImportResultType) => [
  {
    label: "Productos creados",
    value: result.created,
    className: "text-emerald-700",
  },
  {
    label: "Productos actualizados",
    value: result.updated,
    className: "text-blue-700",
  },
  {
    label: "Filas omitidas",
    value: result.skipped,
    className: "text-amber-700",
  },
  {
    label: "Stock procesado",
    value: result.stockRowsAffected,
    className: "text-violet-700",
  },
];

export const ProductImportResult = ({ result }: ProductImportResultProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
        <PackageCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-semibold">Importacion finalizada</h3>
          <p className="text-sm">
            Se procesaron productos, stock inicial y movimientos de inventario
            segun las reglas del negocio.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metricItems(result).map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={`mt-1 text-2xl font-bold ${item.className}`}>
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-sm">
              Movimientos de stock generados: {result.movementsCreated}
            </span>
          </div>

          {result.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-amber-700">Advertencias</p>
              {result.warnings.map((message) => (
                <p key={message} className="text-sm text-amber-700">
                  {message}
                </p>
              ))}
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-red-700">Errores</p>
              {result.errors.map((message) => (
                <p key={message} className="flex gap-2 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {message}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
