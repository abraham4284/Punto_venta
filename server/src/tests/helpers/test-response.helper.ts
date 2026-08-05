import { expect } from "vitest";
import type { Response } from "supertest";

export function expectErrorResponse(
  response: Response,
  params: { status: number; code: string },
): void {
  expect(response.status).toBe(params.status);
  expect(response.body).toMatchObject({
    success: false,
    status: "ERROR",
    code: params.code,
  });
}

export function expectBodyDoesNotExposeSensitiveText(
  response: Response,
  forbiddenTexts: string[],
): void {
  const serializedBody = JSON.stringify(response.body);

  for (const text of forbiddenTexts) {
    expect(serializedBody).not.toContain(text);
  }
}
