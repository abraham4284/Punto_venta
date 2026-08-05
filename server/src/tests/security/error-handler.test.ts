import request from "supertest";
import { describe, expect, it } from "vitest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import {
  expectBodyDoesNotExposeSensitiveText,
  expectErrorResponse,
} from "@/tests/helpers/test-response.helper.js";

describe("Error handler seguro", function errorHandlerSuite() {
  it("no expone detalles internos ante un error inesperado", async function testInternalError() {
    const response = await request(getTestApp()).get(
      "/api/__test__/internal-error",
    );

    expectErrorResponse(response, {
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
    });
    expect(response.body.message).toBe("Ocurrio un error interno.");
    expectBodyDoesNotExposeSensitiveText(response, [
      "Table users",
      "sp_secret",
      "stack",
      "sqlMessage",
      "procedure",
      "constraint",
    ]);
  });
});
