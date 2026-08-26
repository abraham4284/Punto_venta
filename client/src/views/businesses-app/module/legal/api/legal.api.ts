import type { AxiosResponse } from "axios";
import axios from "@/api/axios.config";
import type { ApiResponse } from "@/api/axios.response.type";
import type {
  LegalAcceptanceResponse,
  LegalAcceptanceStatusResponse,
  LegalDocumentCode,
  LegalDocumentMetadata,
  LegalDocumentResponse,
  RecordLegalAcceptanceBody,
} from "../types";

export const getCurrentLegalDocumentsRequest = (): Promise<
  AxiosResponse<ApiResponse<LegalDocumentMetadata[]>>
> => {
  return axios.get("/legal/documents/current");
};

export const getCurrentLegalDocumentRequest = (
  code: LegalDocumentCode,
): Promise<AxiosResponse<ApiResponse<LegalDocumentResponse>>> => {
  return axios.get(`/legal/documents/${code}/current`);
};

export const getLegalDocumentVersionRequest = (
  code: LegalDocumentCode,
  version: string,
): Promise<AxiosResponse<ApiResponse<LegalDocumentResponse>>> => {
  return axios.get(`/legal/documents/${code}/versions/${version}`);
};

export const getMyLegalAcceptancesRequest = (): Promise<
  AxiosResponse<ApiResponse<LegalAcceptanceStatusResponse[]>>
> => {
  return axios.get("/legal/acceptances/me");
};

export const recordLegalAcceptanceRequest = (
  body: RecordLegalAcceptanceBody,
): Promise<AxiosResponse<ApiResponse<LegalAcceptanceResponse>>> => {
  return axios.post("/legal/acceptances", body);
};
