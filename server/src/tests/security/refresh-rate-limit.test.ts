import request from "supertest";
import { describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { expectErrorResponse } from "@/tests/helpers/test-response.helper.js";

describe("Rate limit refresh", function refreshRateLimitSuite() {
  it("limita refresh Business", async function testBusinessRefreshRateLimit() {
    const app = getTestApp();

    await request(app).post("/api/refresh");
    await request(app).post("/api/refresh");
    await request(app).post("/api/refresh");
    const limitedResponse = await request(app).post("/api/refresh");

    expectErrorResponse(limitedResponse, {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
    });
  });

  it("limita refresh Platform", async function testPlatformRefreshRateLimit() {
    const app = getTestApp();

    await request(app).post("/api/platform/auth/refresh");
    await request(app).post("/api/platform/auth/refresh");
    await request(app).post("/api/platform/auth/refresh");
    const limitedResponse = await request(app).post("/api/platform/auth/refresh");

    expectErrorResponse(limitedResponse, {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
    });
  });
});
