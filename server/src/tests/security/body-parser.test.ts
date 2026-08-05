import request from "supertest";
import { describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import {
  expectBodyDoesNotExposeSensitiveText,
  expectErrorResponse,
} from "@/tests/helpers/test-response.helper.js";

describe("Body parser seguro", function bodyParserSuite() {
  it("rechaza JSON invalido sin exponer detalles internos", async function testInvalidJson() {
    const response = await request(getTestApp())
      .post("/api/login")
      .set("Content-Type", "application/json")
      .send('{"username":');

    expectErrorResponse(response, {
      status: 400,
      code: "INVALID_JSON_BODY",
    });
    expectBodyDoesNotExposeSensitiveText(response, ["SyntaxError", "stack"]);
  });

  it("rechaza JSON que supera el limite configurado", async function testLargeJsonPayload() {
    const response = await request(getTestApp())
      .post("/api/login")
      .send({
        username: "usuario",
        password: "password",
        filler: "x".repeat(2048),
      });

    expectErrorResponse(response, {
      status: 413,
      code: "PAYLOAD_TOO_LARGE",
    });
    expect(response.body.message).toBe(
      "El contenido enviado supera el tamano permitido.",
    );
  });
});
