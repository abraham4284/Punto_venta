import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbRoot = path.resolve(__dirname, "..");
const serverRoot = path.resolve(dbRoot, "..", "..");
const generatedSqlPath = path.join(dbRoot, "generated", "cajora_v1_0_full.sql");
const validateBaselinePath = path.join(dbRoot, "tools", "validate-db-baseline.mjs");
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const validDatabaseNamePattern = /^[A-Za-z0-9_]+$/;

dotenv.config({ path: path.join(serverRoot, ".env"), quiet: true });
dotenv.config({ quiet: true });

function printHelp() {
  console.log(`Cajora local database tool

Usage:
  node src/db/tools/local-db.mjs create
  node src/db/tools/local-db.mjs reset --yes
  node src/db/tools/local-db.mjs --help

Commands:
  create       Create DB_NAME locally and import generated/cajora_v1_0_full.sql.
  reset --yes  Drop DB_NAME locally, recreate it and import generated/cajora_v1_0_full.sql.

Safety:
  - DB_HOST must be localhost, 127.0.0.1 or ::1.
  - reset requires --yes.
  - remote hosts are rejected before any connection attempt.
`);
}

function abort(message) {
  console.error(message);
  process.exit(1);
}

function getConfig() {
  const requiredKeys = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missingKeys = requiredKeys.filter((key) => process.env[key] === undefined);

  if (missingKeys.length > 0) {
    abort(`Faltan variables de entorno requeridas: ${missingKeys.join(", ")}`);
  }

  const host = process.env.DB_HOST ?? "";
  const port = process.env.DB_PORT ?? "3306";
  const user = process.env.DB_USER ?? "";
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME ?? "";

  if (!localHosts.has(host)) {
    abort("Por seguridad, este comando solo puede ejecutarse contra una base local.");
  }

  if (!validDatabaseNamePattern.test(database)) {
    abort("DB_NAME debe contener solo letras, numeros y guiones bajos.");
  }

  if (!/^\d+$/.test(port)) {
    abort("DB_PORT debe ser numerico.");
  }

  return {
    host,
    port,
    user,
    password,
    database,
  };
}

function getExecutableCandidates(command) {
  const pathValue = process.env.PATH ?? "";
  const pathEntries = pathValue.split(path.delimiter).filter(Boolean);
  const extensions =
    process.platform === "win32"
      ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM")
          .split(";")
          .filter(Boolean)
      : [""];
  const candidates = [];

  for (const directory of pathEntries) {
    if (process.platform === "win32") {
      for (const extension of extensions) {
        candidates.push(path.join(directory, `${command}${extension.toLowerCase()}`));
        candidates.push(path.join(directory, `${command}${extension.toUpperCase()}`));
      }
    } else {
      candidates.push(path.join(directory, command));
    }
  }

  return candidates;
}

function findSqlClient() {
  for (const command of ["mysql", "mariadb"]) {
    for (const candidate of getExecutableCandidates(command)) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  abort("No se encontro el cliente mysql/mariadb en PATH.");
}

function getBaseArgs(config) {
  return ["-h", config.host, "-P", config.port, "-u", config.user];
}

function runClient(client, args, config, options = {}) {
  const result = spawnSync(client, args, {
    cwd: dbRoot,
    encoding: "utf8",
    input: options.input,
    env: {
      ...process.env,
      MYSQL_PWD: config.password,
    },
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    abort(output || "El cliente mysql/mariadb finalizo con error.");
  }

  return result.stdout ?? "";
}

function quoteIdentifier(identifier) {
  return `\`${identifier.replace(/`/g, "``")}\``;
}

function runBaselineValidation() {
  const result = spawnSync(process.execPath, [validateBaselinePath], {
    cwd: serverRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    abort(
      `${output}\n\nEl baseline generado no esta validado. Ejecuta npm run db:build-baseline y npm run db:validate-baseline.`,
    );
  }
}

function databaseExists(client, config) {
  const query = [
    "SELECT SCHEMA_NAME",
    "FROM INFORMATION_SCHEMA.SCHEMATA",
    `WHERE SCHEMA_NAME = '${config.database.replace(/'/g, "''")}'`,
  ].join(" ");
  const output = runClient(
    client,
    [...getBaseArgs(config), "-N", "-B", "-e", query],
    config,
  );

  return output.trim() === config.database;
}

function createDatabase(client, config) {
  runClient(
    client,
    [
      ...getBaseArgs(config),
      "-e",
      `CREATE DATABASE ${quoteIdentifier(config.database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    ],
    config,
  );
}

function dropDatabase(client, config) {
  runClient(
    client,
    [...getBaseArgs(config), "-e", `DROP DATABASE IF EXISTS ${quoteIdentifier(config.database)};`],
    config,
  );
}

function importBaseline(client, config) {
  if (!existsSync(generatedSqlPath)) {
    abort("No existe generated/cajora_v1_0_full.sql. Ejecuta npm run db:build-baseline.");
  }

  const sql = readFileSync(generatedSqlPath, "utf8");
  runClient(client, [...getBaseArgs(config), config.database], config, { input: sql });
}

function runCreate() {
  const config = getConfig();
  runBaselineValidation();
  const client = findSqlClient();

  if (databaseExists(client, config)) {
    abort(`La base local ${config.database} ya existe. No se modifico nada.`);
  }

  createDatabase(client, config);
  importBaseline(client, config);
  console.log(`Base local ${config.database} creada e instalada correctamente.`);
}

function runReset() {
  if (!process.argv.includes("--yes")) {
    abort("Este comando elimina toda la DB local. Volve a ejecutar con --yes para confirmar.");
  }

  const config = getConfig();
  runBaselineValidation();
  const client = findSqlClient();

  dropDatabase(client, config);
  createDatabase(client, config);
  importBaseline(client, config);
  console.log(`Base local ${config.database} creada e instalada correctamente.`);
}

const command = process.argv[2];

if (!command || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

if (command === "create") {
  runCreate();
} else if (command === "reset") {
  runReset();
} else {
  printHelp();
  process.exit(1);
}
