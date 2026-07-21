import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  ConfirmProductImportPayload,
  ProductImportApiResponse,
  ProductImportPreviewResponse,
  ProductImportResult,
} from "../types/product-import.types";

export const downloadProductImportTemplateRequest = (): Promise<
  AxiosResponse<Blob>
> => {
  return axios.get("/products/import/template", {
    responseType: "blob",
  });
};

export const previewProductImportRequest = (
  file: File,
): Promise<AxiosResponse<ProductImportApiResponse<ProductImportPreviewResponse>>> => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post("/products/import/preview", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const confirmProductImportRequest = (
  payload: ConfirmProductImportPayload,
): Promise<AxiosResponse<ProductImportApiResponse<ProductImportResult>>> => {
  return axios.post("/products/import/confirm", payload);
};
