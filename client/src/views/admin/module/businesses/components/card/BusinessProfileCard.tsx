import { Building2, CalendarDays, ExternalLink, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BusinessResponse } from "../../types";

type Props = {
  business: BusinessResponse;
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

export const BusinessProfileCard = ({ business, onEdit }: Props) => {
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
                {business.businessType ?? "Sin tipo"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                ID negocio #{business.idBusiness}
              </span>
            </div>
          </div>
        </div>

        <Button type="button" onClick={onEdit}>
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
      </CardContent>
    </Card>
  );
};
