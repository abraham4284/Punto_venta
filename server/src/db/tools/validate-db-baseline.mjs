import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildBaselineSql } from "./build-db-baseline.mjs";
import {
  baselineFiles,
  excludedProcedureFiles,
  procedureFiles,
  publicationFiles,
  schemaFiles,
  seedFiles,
} from "./db-baseline.manifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbRoot = path.resolve(__dirname, "..");
const generatedPath = path.join(dbRoot, "generated", "cajora_v1_0_full.sql");
const installPath = path.join(dbRoot, "install.sql");

const hardCodedDatabase = "punto_venta_dev_clean_2";
const termsHash =
  "5430d5d3870113f25f00d98f29ba85b14e78b6591f4f0809c3214b27ed021ab4";
const privacyHash =
  "9cd13785522dac3e837b54f1eb988e936f110ad6805dcf6063b88fcf7930f222";

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function normalizeContent(content) {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function withoutLegacyUse(content) {
  return normalizeContent(content)
    .split("\n")
    .filter((line) => line.trim() !== "USE punto_venta_dev_clean_2;")
    .join("\n")
    .trimEnd();
}

function fail(errors, message) {
  errors.push(message);
}

async function readRelative(filePath) {
  return readFile(path.join(dbRoot, filePath), "utf8");
}

async function listSqlFiles(directory) {
  const absoluteDirectory = path.join(dbRoot, directory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => normalizePath(path.join(directory, entry.name)))
    .sort();
}

function assertUniqueFiles(errors) {
  const seen = new Set();

  for (const filePath of baselineFiles) {
    if (seen.has(filePath)) {
      fail(errors, `Duplicate manifest entry: ${filePath}`);
    }

    seen.add(filePath);
  }
}

async function assertFilesExist(errors) {
  for (const filePath of baselineFiles) {
    try {
      await readRelative(filePath);
    } catch {
      fail(errors, `Missing manifest file: ${filePath}`);
    }
  }
}

async function assertNoForbiddenContent(errors) {
  const filesToCheck = [
    ...baselineFiles,
    "install.sql",
    "generated/cajora_v1_0_full.sql",
  ];

  for (const filePath of filesToCheck) {
    let content = "";

    try {
      content = await readRelative(filePath);
    } catch {
      fail(errors, `Cannot read file for forbidden-content check: ${filePath}`);
      continue;
    }

    if (content.includes(hardCodedDatabase)) {
      fail(errors, `Hard-coded database name found in baseline file: ${filePath}`);
    }

    if (/migrations\//i.test(content) || /fixed\//i.test(content)) {
      fail(errors, `Baseline file references migrations/ or fixed/: ${filePath}`);
    }

    if (/\b(?:CREATE|DROP)\s+DATABASE\b/i.test(content)) {
      fail(errors, `CREATE/DROP DATABASE found in baseline file: ${filePath}`);
    }
  }
}

async function assertInstallOrder(errors) {
  const installContent = normalizeContent(await readFile(installPath, "utf8"));
  const sourceMatches = [...installContent.matchAll(/^\s*SOURCE\s+([^;\s]+)\s*;/gim)];
  const actualSources = sourceMatches.map((match) => normalizePath(match[1]));
  const expectedSources = [
    ...schemaFiles,
    ...seedFiles,
    ...procedureFiles,
    ...publicationFiles,
  ];

  if (actualSources.join("\n") !== expectedSources.join("\n")) {
    fail(
      errors,
      [
        "install.sql SOURCE order does not match manifest.",
        `Expected:\n${expectedSources.join("\n")}`,
        `Actual:\n${actualSources.join("\n")}`,
      ].join("\n"),
    );
  }

  if (installContent.includes("schema/001_create_database.sql")) {
    fail(errors, "install.sql references schema/001_create_database.sql");
  }
}

async function assertGenerated(errors) {
  let generated = "";

  try {
    generated = await readFile(generatedPath, "utf8");
  } catch {
    fail(errors, "generated/cajora_v1_0_full.sql does not exist");
    return null;
  }

  const expected = await buildBaselineSql();

  if (generated !== expected) {
    fail(errors, "generated/cajora_v1_0_full.sql is out of sync with builder");
  }

  if (/^\s*SOURCE\s+[^\r\n;]+;/im.test(generated)) {
    fail(errors, "generated/cajora_v1_0_full.sql contains SOURCE");
  }

  if (generated.includes("schema/001_create_database.sql")) {
    fail(errors, "generated/cajora_v1_0_full.sql references schema/001_create_database.sql");
  }

  return generated;
}

async function assertPublication(errors) {
  const publicationPath = publicationFiles[0];
  const publication = await readRelative(publicationPath);
  const historical = await readRelative("migrations/006_publish_cajora_legal_v1_0.sql");

  if (!publication.includes(termsHash)) {
    fail(errors, `TERMS 1.0 hash not found in ${publicationPath}`);
  }

  if (!publication.includes(privacyHash)) {
    fail(errors, `PRIVACY 1.0 hash not found in ${publicationPath}`);
  }

  if (/^\s*USE\s+/im.test(publication)) {
    fail(errors, `${publicationPath} contains USE`);
  }

  if (withoutLegacyUse(publication) !== withoutLegacyUse(historical)) {
    fail(
      errors,
      `${publicationPath} differs from migrations/006_publish_cajora_legal_v1_0.sql beyond removing USE`,
    );
  }
}

async function assertProcedureManifest(errors) {
  const procedureSqlFiles = await listSqlFiles("procedures");
  const expectedExcluded = new Set(excludedProcedureFiles);
  const expectedIncluded = new Set(procedureFiles);

  for (const filePath of procedureSqlFiles) {
    if (!expectedIncluded.has(filePath) && !expectedExcluded.has(filePath)) {
      fail(errors, `Procedure file is not classified in manifest: ${filePath}`);
    }
  }

  for (const filePath of procedureFiles) {
    if (!procedureSqlFiles.includes(filePath)) {
      fail(errors, `Procedure file listed in manifest does not exist: ${filePath}`);
    }
  }
}

async function main() {
  const errors = [];

  assertUniqueFiles(errors);
  await assertFilesExist(errors);
  await assertProcedureManifest(errors);
  await assertNoForbiddenContent(errors);
  await assertInstallOrder(errors);
  await assertPublication(errors);
  const generated = await assertGenerated(errors);

  if (errors.length > 0) {
    console.error("Database baseline validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const hash = createHash("sha256").update(generated ?? "", "utf8").digest("hex");
  console.log("Database baseline validation passed.");
  console.log(`SHA-256 cajora_v1_0_full.sql: ${hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
