import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/integration/economic-flows/**/*.test.ts"],
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    env: {
      NODE_ENV: "test",
      DB_NAME: "punto_venta_integration_test",
      TEST_DISABLE_RATE_LIMITS: "true",
      JSON_BODY_LIMIT: "1mb",
      URL_ENCODED_BODY_LIMIT: "1mb",
    },
  },
  resolve: {
    alias: {
      "@": resolve(currentDir, "src"),
    },
  },
});
