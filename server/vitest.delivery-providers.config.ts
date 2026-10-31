import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({ resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } }, test: { environment: "node", setupFiles: [], include: ["src/tests/unit/orders-core*.test.ts", "src/tests/unit/delivery-providers.test.ts"] } });
