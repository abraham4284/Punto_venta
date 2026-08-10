import request from "supertest";
import type { Response } from "supertest";
import { randomUUID } from "crypto";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";

export interface PurchaseDetailRequest {
  idProduct: number;
  idDeposit: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
}

export interface SaleItemRequest {
  idProduct: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export function createPurchaseThroughApi(input: {
  cookies: string[];
  idSupplier: number | null;
  subtotal: number;
  discountTotal: number;
  total: number;
  observation?: string | null;
  idempotencyKey?: string;
  details: PurchaseDetailRequest[];
}): Promise<Response> {
  return request(getTestApp())
    .post("/api/purchases")
    .set("Cookie", input.cookies)
    .set("Idempotency-Key", input.idempotencyKey ?? randomUUID())
    .send({
      idSupplier: input.idSupplier,
      subtotal: input.subtotal,
      discountTotal: input.discountTotal,
      total: input.total,
      observation: input.observation ?? null,
      details: input.details,
    });
}

export function cancelPurchaseThroughApi(input: {
  cookies: string[];
  idPurchase: number;
}): Promise<Response> {
  return request(getTestApp())
    .patch(`/api/purchases/${input.idPurchase}/cancel`)
    .set("Cookie", input.cookies)
    .send({});
}

export function openCashSessionThroughApi(input: {
  cookies: string[];
  idCashRegister: number;
  openingAmount: number;
  openingObservation?: string | null;
}): Promise<Response> {
  return request(getTestApp())
    .post("/api/cash-sessions/open")
    .set("Cookie", input.cookies)
    .send({
      idCashRegister: input.idCashRegister,
      openingAmount: input.openingAmount,
      openingObservation: input.openingObservation ?? null,
    });
}

export function closeCashSessionThroughApi(input: {
  cookies: string[];
  idCashSession: number;
  countedCashAmount: number;
  closingObservation?: string | null;
}): Promise<Response> {
  return request(getTestApp())
    .post(`/api/cash-sessions/${input.idCashSession}/close`)
    .set("Cookie", input.cookies)
    .send({
      countedCashAmount: input.countedCashAmount,
      closingObservation: input.closingObservation ?? null,
    });
}

export function createCashMovementThroughApi(input: {
  cookies: string[];
  idCashSession: number;
  movementType: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  description?: string | null;
}): Promise<Response> {
  return request(getTestApp())
    .post(`/api/cash-sessions/${input.idCashSession}/movements`)
    .set("Cookie", input.cookies)
    .send({
      movementType: input.movementType,
      category: input.category,
      amount: input.amount,
      description: input.description ?? null,
    });
}

export function getCashSessionSummaryThroughApi(input: {
  cookies: string[];
  idCashSession: number;
}): Promise<Response> {
  return request(getTestApp())
    .get(`/api/cash-sessions/${input.idCashSession}/summary`)
    .set("Cookie", input.cookies);
}

export function getCashSessionPaymentSummariesThroughApi(input: {
  cookies: string[];
  idCashSession: number;
}): Promise<Response> {
  return request(getTestApp())
    .get(`/api/cash-sessions/${input.idCashSession}/payment-summaries`)
    .set("Cookie", input.cookies);
}

export function createSaleThroughApi(input: {
  cookies: string[];
  idCustomer: number | null;
  idDeposit: number;
  idCashSession: number;
  idPaymentMethod: number;
  subtotal: number;
  discountTotal: number;
  total: number;
  observation?: string | null;
  idempotencyKey?: string;
  items: SaleItemRequest[];
}): Promise<Response> {
  return request(getTestApp())
    .post("/api/sales")
    .set("Cookie", input.cookies)
    .set("Idempotency-Key", input.idempotencyKey ?? randomUUID())
    .send({
      idCustomer: input.idCustomer,
      idDeposit: input.idDeposit,
      idCashSession: input.idCashSession,
      idPaymentMethod: input.idPaymentMethod,
      subtotal: input.subtotal,
      discountTotal: input.discountTotal,
      total: input.total,
      observation: input.observation ?? null,
      items: input.items,
    });
}

export function cancelSaleThroughApi(input: {
  cookies: string[];
  idSale: number;
}): Promise<Response> {
  return request(getTestApp())
    .patch(`/api/sales/${input.idSale}/cancel`)
    .set("Cookie", input.cookies)
    .send({});
}

export function transferStockThroughApi(input: {
  cookies: string[];
  idProduct: number;
  idDepositFrom: number;
  idDepositTo: number;
  quantity: number;
  observation?: string | null;
}): Promise<Response> {
  return request(getTestApp())
    .post("/api/stock-movements/transfer")
    .set("Cookie", input.cookies)
    .send({
      idProduct: input.idProduct,
      idDepositFrom: input.idDepositFrom,
      idDepositTo: input.idDepositTo,
      quantity: input.quantity,
      observation: input.observation ?? null,
    });
}
