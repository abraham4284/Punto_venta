import { formatCurrency } from "@/helpers";
import { Building2, CalendarDays, ExternalLink, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BUSINESS_TYPE_OPTIONS } from "../../types";
import type { BusinessResponse } from "../../types";

type Props = {
  business: BusinessResponse;
  canEdit?: boolean;
  onEdit: () => void;
};

const formatDate = (value: Date | string | null): string => {
  if (!value) return "Sin datos";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

export const BusinessProfileCard = ({ business, onEdit, canEdit = true }: Props) => {
  const businessTypeLabel =
    BUSINESS_TYPE_OPTIONS.find((option) => option.value === business.businessType)
      ?.label ?? business.businessType ?? "Sin tipo";

  return (
    <Card className="overflow-hidden">
      <div className="h-28 bg-gradient-to-r from-emerald-900 via-slate-900 to-sky-900" />
      <CardHeader className="-mt-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-12 w-12 text-slate-700" />
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">{business.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800">
                {businessTypeLabel}
              </Badge>
            </div>
          </div>
        </div>

        <Button type="button" onClick={onEdit} disabled={!canEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar perfil
        </Button>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Slug de acceso</p>
          <div className="mt-2 flex items-center gap-2 font-semibold">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            {business.slug}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Fecha de alta</p>
          <div className="mt-2 flex items-center gap-2 font-semibold">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {formatDate(business.createdAt)}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Ultima actualizacion</p>
          <div className="mt-2 flex items-center gap-2 font-semibold">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {formatDate(business.updatedAt)}
          </div>
        </div>
        <section className="space-y-2 rounded-lg border p-4 md:col-span-3" aria-label="Precios mayoristas">
          <h3 className="font-semibold">Precios mayoristas</h3>
          <Badge variant={business.wholesaleEnabled ? "default" : "secondary"}>{business.wholesaleEnabled ? "Activados" : "Desactivados"}</Badge>
          {business.wholesaleEnabled && business.wholesaleMinimumAmount != null && <p className="text-sm">Compra mínima inicial: <strong>{formatCurrency(business.wholesaleMinimumAmount)}</strong></p>}
          <p className="text-sm text-muted-foreground">El mínimo se exige una sola vez al cliente y aplica a todas las categorías.</p>
        </section>
      </CardContent>
    </Card>
  );
};
