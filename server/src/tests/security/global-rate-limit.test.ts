import request from "supertest";
import { describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { expectErrorResponse } from "@/tests/helpers/test-response.helper.js";

describe("Rate limit general", function globalRateLimitSuite() {
  it("limita solicitudes generales a /api", async function testGlobalRateLimit() {
    const app = getTestApp();

    await request(app).get("/api/global-rate-limit-check");
    await request(app).get("/api/global-rate-limit-check");
    await request(app).get("/api/global-rate-limit-check");
    const response = await request(app).get("/api/global-rate-limit-check");

    expectErrorResponse(response, {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
    });
    expect(
      response.headers["ratelimit-limit"] ??
        response.headers["x-ratelimit-limit"] ??
        response.headers["ratelimit-policy"],
    ).toBeDefined();
  });
});
