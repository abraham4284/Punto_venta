import { z } from "zod";
import type { BusinessSessionUser } from "../../auth/types/auth.types";
import type { DepositResponse } from "../../deposits/types/deposits.types";
import type { StockTransferBatchResponse } from "../types/stock.types";

export interface StockTransferReceiptData {
  referenceId: number;
  createdAt: string;
  businessName: string;
  logoUrl: string | null;
  actorName: string;
  originName: string;
  destinationName: string;
  observation: string | null;
  items: StockTransferBatchResponse["items"];
  movementCount: number;
}

const id = z.number().int().positive();
const confirmedTransferEnvelope = z.object({
  status: z.literal(true),
  data: z.object({
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
    totalQuantity: z.number().positive(),
    movementCount: id,
  }).refine((transfer) =>
    transfer.idDepositFrom !== transfer.idDepositTo &&
    transfer.movementCount === transfer.items.length * 2 &&
    new Set(transfer.items.map(({ idProduct }) => idProduct)).size === transfer.items.length,
  ),
});

export const isConfirmedStockTransfer = (httpStatus: number, body: unknown): boolean =>
  httpStatus >= 200 && httpStatus < 300 && confirmedTransferEnvelope.safeParse(body).success;

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
