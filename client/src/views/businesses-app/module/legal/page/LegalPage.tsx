import { useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/views/businesses-app/module/auth/store/auth.store";
import { useLegalDocuments } from "../hooks/useLegal";
import type { LegalAcceptanceStatusResponse } from "../types";

const actionLabels: Record<string, string> = {
  ACCEPT: "Aceptación requerida",
  ACKNOWLEDGE: "Reconocimiento requerido",
  NONE: "Sin acción requerida",
  ACCEPTED: "Aceptado",
  ACKNOWLEDGED: "Reconocido",
  REGISTRATION: "Registro inicial",
  SETTINGS: "Configuración",
  LOGIN_REACCEPTANCE: "Reaceptación",
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const getStatusLabel = (
  item: LegalAcceptanceStatusResponse,
  canAcceptTerms: boolean,
): string => {
  if (item.code === "TERMS") {
    if (item.isSatisfied) {
      return canAcceptTerms ? "Aceptado" : "Aceptado por el negocio";
    }

    return canAcceptTerms ? "Pendiente" : "Pendiente del propietario";
  }

  return item.isSatisfied ? "Reconocido" : "Pendiente";
};

const getStatusVariant = (
  item: LegalAcceptanceStatusResponse,
): "secondary" | "destructive" => {
  return item.isSatisfied ? "secondary" : "destructive";
};

const getEvidenceTitle = (item: LegalAcceptanceStatusResponse): string => {
  if (item.code === "TERMS") {
    return "Estado del negocio";
  }

  return "Tu registro";
};

const getEvidenceText = (
  item: LegalAcceptanceStatusResponse,
  canAcceptTerms: boolean,
): string => {
  if (item.code === "TERMS") {
    if (item.isSatisfied) {
      return "Los términos vigentes ya fueron aceptados para este negocio.";
    }

    return canAcceptTerms
      ? "Los términos vigentes requieren aceptación del propietario."
      : "Los términos vigentes están pendientes de aceptación por parte del propietario.";
  }

  return item.isSatisfied
    ? "La política de privacidad vigente ya fue reconocida por tu usuario."
    : "Reconocé la política de privacidad vigente para dejar constancia de lectura.";
};

const LegalStatusCard = ({
  item,
  canAcceptTerms,
  saving,
  onAccept,
}: {
  item: LegalAcceptanceStatusResponse;
  canAcceptTerms: boolean;
  saving: boolean;
  onAccept: (code: LegalAcceptanceStatusResponse["code"]) => void;
}) => {
  const canAct =
    item.actionRequired &&
    item.idLegalDocumentVersion !== null &&
    (item.code !== "TERMS" || canAcceptTerms);
  const statusLabel = getStatusLabel(item, canAcceptTerms);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {item.code === "TERMS" ? (
                <FileText className="h-5 w-5 text-blue-600" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              )}
              {item.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Versión vigente: {item.currentVersion ?? "No disponible"}
            </p>
          </div>
          <Badge variant={getStatusVariant(item)}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Acción requerida</p>
            <p className="font-medium">
              {actionLabels[item.requiredAction] ?? item.requiredAction}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Vigencia</p>
            <p className="font-medium">{formatDateTime(item.effectiveAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{getEvidenceTitle(item)}</p>
            <p className="font-medium">
              {item.actionType ? actionLabels[item.actionType] : "Sin registro"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Fecha de registro</p>
            <p className="font-medium">{formatDateTime(item.acceptedAt)}</p>
          </div>
          {item.isSatisfied ? (
            <div>
              <p className="text-muted-foreground">
                {item.acceptanceScope === "BUSINESS"
                  ? "Aceptado por"
                  : "Reconocido por"}
              </p>
              <p className="font-medium">
                {item.acceptanceScope === "USER" && item.acceptedByCurrentUser
                  ? "Tu usuario"
                  : item.acceptedByUserName ?? "-"}
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
          <p>{getEvidenceText(item, canAcceptTerms)}</p>
          {item.acceptanceMethod ? (
            <p className="mt-1">
              Método: {actionLabels[item.acceptanceMethod] ?? item.acceptanceMethod}
            </p>
          ) : null}
        </div>

        {item.code === "TERMS" && !canAcceptTerms && !item.isSatisfied ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Esta acción solo puede realizarla el propietario del negocio.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            render={
              <Link
                to={item.code === "TERMS" ? "/terms" : "/privacy"}
                target="_blank"
              />
            }
          >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver documento vigente
          </Button>
          {item.currentVersion ? (
            <Button
              type="button"
              variant="ghost"
              render={
                <Link
                  to={`/${item.code === "TERMS" ? "terms" : "privacy"}/${item.currentVersion}`}
                  target="_blank"
                />
              }
            >
                Ver versión {item.currentVersion}
            </Button>
          ) : null}
          {canAct ? (
            <Button
              type="button"
              onClick={() => onAccept(item.code)}
              disabled={saving}
            >
              {saving ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {item.code === "PRIVACY" ? "Reconocer" : "Aceptar"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export const LegalPage = () => {
  const role = useAuthStore((state) => state.user?.role);
  const {
    acceptances,
    loading,
    saving,
    error,
    fetchMyAcceptances,
    recordAcceptance,
  } = useLegalDocuments();

  useEffect(() => {
    void fetchMyAcceptances();
  }, [fetchMyAcceptances]);

  const handleAccept = async (code: LegalAcceptanceStatusResponse["code"]) => {
    const result = await recordAcceptance(code);

    if (result.success) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  };

  return (
    <>
      <Meta title="Legal" />
      <main className="space-y-6">
        <section className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            Cumplimiento y evidencia
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Legal</h1>
          <p className="max-w-3xl text-muted-foreground">
            Consultá los documentos legales vigentes y el registro de aceptación
            o reconocimiento asociado a tu usuario dentro del negocio.
          </p>
        </section>

        {loading ? (
          <Card>
            <CardContent className="flex min-h-72 items-center justify-center">
              <Spinner />
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-6 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-4 xl:grid-cols-2">
            {acceptances.map((item) => (
              <LegalStatusCard
                key={item.code}
                item={item}
                canAcceptTerms={role === "OWNER"}
                saving={saving}
                onAccept={handleAccept}
              />
            ))}
          </section>
        )}
      </main>
    </>
  );
};
