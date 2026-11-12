import { z } from "zod";
import type { BusinessSessionUser } from "../../auth/types/auth.types";
import type { DepositResponse } from "../../deposits/types/deposits.types";
import type { StockMovementResponse, StockTransferBatchResponse, StockTransferHistoryResponse } from "../types/stock.types";

export interface StockTransferReceiptData {
  referenceId: number;
  createdAt: string;
  businessName: string;
  logoUrl: string | null;
  actorName: string;
  originName: string;
  destinationName: string;
  observation: string | null;
  items: StockTransferHistoryResponse["items"];
  movementCount: number;
}

const id = z.number().int().positive();
const transferDetailsSchema = z.object({
  referenceId: id,
  idDepositFrom: id,
  idDepositTo: id,
  idUser: id,
  createdAt: z.iso.datetime({ offset: true }),
  observation: z.string().nullable(),
  items: z.array(z.object({
    idProduct: id,
    productName: z.string().trim().min(1),
    unitType: z.string().trim().min(1),
    quantity: z.number().positive(),
  })).min(1).max(100),
  movementCount: id,
});

const isCompleteTransfer = (transfer: z.infer<typeof transferDetailsSchema>) =>
  transfer.idDepositFrom !== transfer.idDepositTo &&
  transfer.movementCount === transfer.items.length * 2 &&
  new Set(transfer.items.map(({ idProduct }) => idProduct)).size === transfer.items.length;

const confirmedTransferEnvelope = z.object({
  status: z.literal(true),
  data: transferDetailsSchema.extend({ totalQuantity: z.number().positive() }).refine(isCompleteTransfer),
});

const historicalTransferEnvelope = z.object({
  status: z.literal(true),
  data: transferDetailsSchema.extend({
    depositFromName: z.string(),
    depositToName: z.string(),
    userName: z.string(),
  }).refine(isCompleteTransfer),
});

export const isConfirmedStockTransfer = (httpStatus: number, body: unknown): boolean =>
  httpStatus >= 200 && httpStatus < 300 && confirmedTransferEnvelope.safeParse(body).success;

export const readStockTransferHistory = (body: unknown, referenceId: number): StockTransferHistoryResponse | null => {
  const parsed = historicalTransferEnvelope.safeParse(body);
  return parsed.success && parsed.data.data.referenceId === referenceId ? parsed.data.data : null;
};

export const getStockTransferReceiptReference = (
  { referenceType, referenceId, movementType }: Pick<StockMovementResponse, "referenceType" | "referenceId" | "movementType">,
): number | null =>
  referenceType === "TRANSFER" && (movementType === "TRANSFER_IN" || movementType === "TRANSFER_OUT") &&
  referenceId !== null && Number.isSafeInteger(referenceId) && referenceId > 0 ? referenceId : null;

export const getStockTransferHistoryError = (status?: number): string =>
  status === 404 ? "No se encontró la transferencia." : "No se pudo cargar el comprobante de transferencia.";

export const buildStockTransferReceiptFromHistory = (
  transfer: StockTransferHistoryResponse,
  session: Pick<BusinessSessionUser, "businessName" | "logoUrl"> | null,
): StockTransferReceiptData => ({
  referenceId: transfer.referenceId,
  createdAt: transfer.createdAt,
  businessName: session?.businessName?.trim() || "Cajora",
  logoUrl: session?.logoUrl?.trim() || null,
  actorName: transfer.userName.trim() || `Usuario #${transfer.idUser}`,
  originName: transfer.depositFromName.trim() || `Depósito #${transfer.idDepositFrom}`,
  destinationName: transfer.depositToName.trim() || `Depósito #${transfer.idDepositTo}`,
  observation: transfer.observation,
  items: transfer.items.map(({ idProduct, productName, unitType, quantity }) => ({
    idProduct, productName, unitType, quantity,
  })),
  movementCount: transfer.movementCount,
});

export const buildStockTransferReceipt = (
  transfer: StockTransferBatchResponse,
  deposits: Pick<DepositResponse, "idDeposit" | "name">[],
  session: Pick<BusinessSessionUser, "idUser" | "name" | "businessName" | "logoUrl"> | null,
): StockTransferReceiptData => {
  const depositName = (idDeposit: number) =>
    deposits.find((deposit) => deposit.idDeposit === idDeposit)?.name.trim() || `Depósito #${idDeposit}`;
  const sessionActor = session?.idUser === transfer.idUser ? session.name?.trim() : "";
  return {
    referenceId: transfer.referenceId,
    createdAt: transfer.createdAt,
    businessName: session?.businessName?.trim() || "Cajora",
    logoUrl: session?.logoUrl?.trim() || null,
    actorName: sessionActor || `Usuario #${transfer.idUser}`,
    originName: depositName(transfer.idDepositFrom),
    destinationName: depositName(transfer.idDepositTo),
    observation: transfer.observation?.trim() || null,
    items: transfer.items.map(({ idProduct, productName, unitType, quantity }) => ({
      idProduct, productName, unitType, quantity,
    })),
    movementCount: transfer.movementCount,
  };
};
