import request from "supertest";
import { describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { expectErrorResponse } from "@/tests/helpers/test-response.helper.js";

describe("Rate limit registro", function registerRateLimitSuite() {
  it("limita el registro publico antes de crear datos reales", async function testRegisterRateLimit() {
    const app = getTestApp();
    const invalidPayload = {};

    const firstResponse = await request(app).post("/api/register").send(invalidPayload);
    await request(app).post("/api/register").send(invalidPayload);
    const limitedResponse = await request(app).post("/api/register").send(invalidPayload);

    expect(firstResponse.status).not.toBe(429);
    expectErrorResponse(limitedResponse, {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
    });
  });
});
