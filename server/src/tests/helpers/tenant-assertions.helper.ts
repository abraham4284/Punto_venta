import { expect } from "vitest";
import type { Response } from "supertest";

export function expectTenantBlocked(response: Response): void {
  expect([400, 403, 404, 500]).toContain(response.status);
  expect(response.status).not.toBe(200);
  expect(response.status).not.toBe(201);
}

export function expectResponseDoesNotLeak(response: Response, secret: string): void {
  expect(JSON.stringify(response.body)).not.toContain(secret);
}

export function extractArrayFromBody(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;

  if (typeof body !== "object" || body === null) return [];

  const record = body as Record<string, unknown>;

  if (Array.isArray(record.data)) return record.data;

  if (typeof record.data === "object" && record.data !== null) {
    const data = record.data as Record<string, unknown>;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.movements)) return data.movements;
    if (Array.isArray(data.stock)) return data.stock;
    if (Array.isArray(data.sales)) return data.sales;
    if (Array.isArray(data.purchases)) return data.purchases;
  }

  return [];
}
