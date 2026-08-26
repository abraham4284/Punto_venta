import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import type { ApiMessageResponse } from "@/api/axios.response.type";
import {
  getCurrentLegalDocumentRequest,
  getCurrentLegalDocumentsRequest,
  getLegalDocumentVersionRequest,
  getMyLegalAcceptancesRequest,
  recordLegalAcceptanceRequest,
} from "../api/legal.api";
import type {
  LegalAcceptanceStatusResponse,
  LegalDocumentCode,
  LegalDocumentMetadata,
  LegalDocumentResponse,
} from "../types";

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiMessageResponse>;

  return axiosError.response?.data?.message ?? axiosError.message ?? fallback;
};

export const useLegalDocuments = () => {
  const [documents, setDocuments] = useState<LegalDocumentMetadata[]>([]);
  const [document, setDocument] = useState<LegalDocumentResponse | null>(null);
  const [acceptances, setAcceptances] = useState<
    LegalAcceptanceStatusResponse[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getCurrentLegalDocumentsRequest();
      setDocuments(data.data ?? []);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "No se pudieron obtener los documentos legales",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentDocument = useCallback(async (code: LegalDocumentCode) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getCurrentLegalDocumentRequest(code);
      setDocument(data.data);
    } catch (requestError) {
      setDocument(null);
      setError(
        getErrorMessage(requestError, "No se pudo obtener el documento legal"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocumentVersion = useCallback(
    async (code: LegalDocumentCode, version: string) => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await getLegalDocumentVersionRequest(code, version);
        setDocument(data.data);
      } catch (requestError) {
        setDocument(null);
        setError(
          getErrorMessage(
            requestError,
            "No se pudo obtener la version legal solicitada",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchMyAcceptances = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getMyLegalAcceptancesRequest();
      setAcceptances(data.data ?? []);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "No se pudo obtener tu estado legal"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const recordAcceptance = useCallback(async (code: LegalDocumentCode) => {
    setSaving(true);
    setError(null);

    try {
      await recordLegalAcceptanceRequest({ code, confirmed: true });
      const { data } = await getMyLegalAcceptancesRequest();
      setAcceptances(data.data ?? []);
      return { success: true, message: "Documento registrado correctamente" };
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "No se pudo registrar el documento legal",
      );
      setError(message);
      return { success: false, message };
    } finally {
      setSaving(false);
    }
  }, []);

  const requiredDocumentsAvailable = useMemo(() => {
    const hasTerms = documents.some((item) => item.code === "TERMS");
    const hasPrivacy = documents.some((item) => item.code === "PRIVACY");

    return hasTerms && hasPrivacy;
  }, [documents]);

  useEffect(() => {
    return () => {
      setDocument(null);
      setError(null);
    };
  }, []);

  return {
    documents,
    document,
    acceptances,
    loading,
    saving,
    error,
    requiredDocumentsAvailable,
    fetchCurrentDocuments,
    fetchCurrentDocument,
    fetchDocumentVersion,
    fetchMyAcceptances,
    recordAcceptance,
  };
};
