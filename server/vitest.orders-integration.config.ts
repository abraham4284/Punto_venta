import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));
const database = "punto_venta_integration_test";
const envTest = resolve(root, ".env.test");
const source = existsSync(envTest) ? envTest : resolve(root, ".env");
const configured = dotenv.parse(readFileSync(source));
const host = process.env.DB_HOST ?? configured.DB_HOST;
if (!host || !["localhost", "127.0.0.1", "::1"].includes(host)) {
  throw new Error("Orders integration: solo se autoriza un host loopback local");
}
if ((process.env.DB_NAME && process.env.DB_NAME !== database) || (existsSync(envTest) && configured.DB_NAME !== database)) {
  throw new Error("Orders integration: DB_NAME debe ser punto_venta_integration_test");
}

// Only connection credentials are reused. Never inherit the development DB name.
const connectionEnv: Record<string, string> = { DB_HOST: host, DB_NAME: database };
for (const field of ["DB_USER", "DB_PASSWORD", "DB_PORT"]) {
  const value = process.env[field] ?? configured[field];
  if (value !== undefined) connectionEnv[field] = value;
}
Object.assign(process.env, connectionEnv);

export default defineConfig({
  resolve: { alias: { "@": resolve(root, "src") } },
  test: {
    environment: "node", setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/integration/orders/**/*.test.ts"],
    fileParallelism: false, sequence: { concurrent: false }, testTimeout: 20000, hookTimeout: 30000,
    env: { ...connectionEnv, NODE_ENV: "test", TEST_DISABLE_RATE_LIMITS: "true",
      JSON_BODY_LIMIT: "1mb", URL_ENCODED_BODY_LIMIT: "1mb",
      ACCESS_TOKEN_SECRET: "orders_integration_access_only", REFRESH_TOKEN_SECRET: "orders_integration_refresh_only" },
  },
});
