import request from "supertest";
import { describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { expectErrorResponse } from "@/tests/helpers/test-response.helper.js";

describe("Rate limit login Business", function businessAuthRateLimitSuite() {
  it("aplica limite especifico al login comercial", async function testBusinessLoginRateLimit() {
    const app = getTestApp();
    const credentials = {
      username: "usuario-inexistente",
      password: "password-invalida",
    };

    const firstResponse = await request(app).post("/api/login").send(credentials);
    await request(app).post("/api/login").send(credentials);
    const limitedResponse = await request(app).post("/api/login").send(credentials);

    expect(firstResponse.status).not.toBe(429);
    expectErrorResponse(limitedResponse, {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
    });
  });
});
