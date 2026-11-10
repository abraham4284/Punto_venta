import { defineConfig } from "vitest/config";
import base from "./vitest.orders-core.config.js";

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["src/tests/unit/storefront-cors.test.ts"],
  },
});
