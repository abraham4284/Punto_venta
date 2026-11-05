import { defineConfig } from "vitest/config";
import base from "./vitest.sale-returns.config.js";

export default defineConfig({
  ...base,
  test: { ...base.test, include: [...base.test!.include!,
    "src/tests/unit/wholesale-pricing.test.ts", "src/tests/unit/customers-v2.test.ts",
    "src/tests/unit/storefront-catalog.mapper.test.ts"], setupFiles: [] },
});
