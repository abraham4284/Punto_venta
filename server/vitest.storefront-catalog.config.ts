import { defineConfig } from "vitest/config";
import base from "./vitest.wholesale-pricing.config.js";

// DB-free: the catalog service pool/config are mocked; no integration setup.
export default defineConfig({
  ...base,
  test: { ...base.test, setupFiles: [], include: [...base.test!.include!,
    "src/tests/unit/storefront-catalog.search.test.ts"],
  },
});
