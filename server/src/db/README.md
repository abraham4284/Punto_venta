# Cajora Database v1.0

`server/src/db` contains the canonical database baseline for Cajora / Punto_Venta v1.0.

The clean-install baseline is for an already selected EMPTY database. It is not a migration runner and must not be replayed over an existing production database.

## Final Structure

```text
server/src/db/
├── db.ts
├── README.md
├── install.sql
├── BASELINE_AUDIT.md
├── MANUAL_BASELINE_TEST.md
├── RELEASE_CANDIDATE.md
├── schema/
├── seeds/
├── publications/
├── procedures/
├── generated/
├── tools/
└── local/
```

## Canonical Baseline

Clean v1.0 installs are built from these directories only:

1. `schema/`
2. `seeds/`
3. `procedures/`
4. `publications/`

Conceptual roles:

- `schema/`: final current table structure, indexes, foreign keys and constraints.
- `seeds/`: required system catalog data.
- `procedures/`: current stored procedure logic.
- `procedures/storefront_catalog.sql`: public read-only catalog procedures for Storefront deployments.
- `publications/`: official versioned publications such as legal documents.
- `generated/`: generated importable full SQL. Do not edit manually.
- `tools/`: file-only builder, validator and localhost-only DB tooling.
- `local/`: documentation for local development helpers.

Historical migrations were squashed into baseline v1.0 before first release; history remains available in Git.

## Clean Install - MySQL/MariaDB CLI

1. Create an empty database manually.
2. Select it manually.
3. From `server/src/db`, run:

```sql
USE your_empty_database;
SOURCE install.sql;
```

`install.sql` does not create, drop or select a database.

## Clean Install - phpMyAdmin / Hostinger

1. Create an empty database from the hosting panel.
2. Select that database in phpMyAdmin.
3. Import:

```text
server/src/db/generated/cajora_v1_0_full.sql
```

The generated file contains schema, seeds, procedures and the official legal publication v1.0 in a single SQL file without `SOURCE` statements.

## Local Development

The local tooling uses the same environment variables as the backend database connection:

```text
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cajora_local
```

Only local hosts are allowed:

- `localhost`
- `127.0.0.1`
- `::1`

Create a local database and install the baseline:

```bash
npm run db:local:create
```

Reset the local database destructively:

```bash
npm run db:local:reset -- --yes
```

The reset command requires `--yes` and refuses remote hosts before attempting any connection.

## Build Baseline

From `server`:

```bash
npm run db:build-baseline
```

This regenerates:

```text
src/db/generated/cajora_v1_0_full.sql
```

Generated files are versioned but must not be edited manually.

## Validate Baseline

From `server`:

```bash
npm run db:validate-baseline
```

The validator is file-only. It does not connect to MySQL/MariaDB.

It verifies:

- manifest files exist;
- generated SQL matches the builder output;
- install order matches the manifest;
- active baseline has no development database name dependency;
- active baseline does not reference historical folders;
- generated SQL has no `SOURCE` statements;
- legal v1.0 hashes and publication metadata are present;
- database creation/drop statements are absent from the canonical baseline.

## Install Order

`install.sql` runs:

1. `schema/002_create_tables.sql`
2. `schema/003_add_indexes.sql`
3. `schema/004_add_foreign_keys.sql`
4. `schema/005_add_constraints.sql`
5. `seeds/001_subscription_plans.sql`
6. `seeds/002_permissions_and_role_permissions.sql`
7. `seeds/003_legal_documents.sql`
8. all canonical files listed in `tools/db-baseline.manifest.mjs#procedureFiles`
9. `publications/001_cajora_legal_v1_0.sql`

## Publications

`publications/001_cajora_legal_v1_0.sql` publishes the official Cajora legal documents:

- `TERMS` version `1.0`
- `PRIVACY` version `1.0`

Expected SHA-256 hashes:

- TERMS 1.0: `5430d5d3870113f25f00d98f29ba85b14e78b6591f4f0809c3214b27ed021ab4`
- PRIVACY 1.0: `9cd13785522dac3e837b54f1eb988e936f110ad6805dcf6063b88fcf7930f222`

Future legal versions should be published deliberately as new publication files, not by editing historical v1.0 content.

## Audit And Release Candidate

- Static audit: `BASELINE_AUDIT.md`
- Manual validation checklist: `MANUAL_BASELINE_TEST.md`
- Release candidate notes: `RELEASE_CANDIDATE.md`
