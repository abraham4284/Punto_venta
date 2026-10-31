import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Explicit DB-free config: no integration setup; each test file mocks the pool.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", setupFiles: [], include: ["src/tests/unit/orders-core*.test.ts"] },
});
