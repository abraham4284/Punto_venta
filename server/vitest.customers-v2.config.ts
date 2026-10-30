import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Explicitly excludes the integration setup: these tests never connect to a DB.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    setupFiles: [],
    include: ["src/tests/unit/customers-v2.test.ts"],
  },
});
