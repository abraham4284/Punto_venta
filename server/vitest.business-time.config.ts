import { defineConfig } from "vitest/config";
import base from "./vitest.storefront-catalog.config.js";

export default defineConfig({
  ...base,
  test: { ...base.test, include: [...base.test!.include!, "src/tests/unit/business-time.test.ts"] },
});
