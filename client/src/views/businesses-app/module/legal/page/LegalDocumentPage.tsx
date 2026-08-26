import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
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
import { useLegalDocuments } from "../hooks/useLegal";
import type { LegalDocumentCode } from "../types";

type LegalDocumentPageProps = {
  code: LegalDocumentCode;
  title: string;
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

export const LegalDocumentPage = ({ code, title }: LegalDocumentPageProps) => {
  const { version } = useParams();
  const { document, loading, error, fetchCurrentDocument, fetchDocumentVersion } =
    useLegalDocuments();

  useEffect(() => {
    if (version) {
      void fetchDocumentVersion(code, version);
      return;
    }

    void fetchCurrentDocument(code);
  }, [code, fetchCurrentDocument, fetchDocumentVersion, version]);

  return (
    <>
      <Meta title={title} />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-5">
          <Button type="button" variant="outline" render={<Link to="/" />}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Documento legal
                  </div>
                  <CardTitle className="text-2xl">
                    {document?.title ?? title}
                  </CardTitle>
                </div>
                {document ? (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Versión {document.version}</Badge>
                    {document.status ? (
                      <Badge variant="outline">{document.status}</Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {document ? (
                <p className="text-sm text-muted-foreground">
                  Vigente desde {formatDate(document.effectiveAt)}
                </p>
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex min-h-80 items-center justify-center">
                  <Spinner />
                </div>
              ) : error ? (
                <div className="p-6 text-sm text-destructive">{error}</div>
              ) : document ? (
                <article className="whitespace-pre-wrap px-6 py-7 text-sm leading-7 text-slate-800">
                  {document.content}
                </article>
              ) : (
                <div className="p-6 text-sm text-muted-foreground">
                  Documento no disponible.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};
