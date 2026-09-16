# Cajora Database

`server/src/db` contains the canonical database baseline for Cajora / Punto_Venta v1.0.

The clean-install baseline is for an already selected EMPTY database. It is not a migration runner and must not be replayed over an existing production database.

## Canonical baseline

Clean v1.0 installs are built from these directories only:

1. `schema/`
2. `seeds/`
3. `procedures/`
4. `publications/`

Conceptual roles:

- `schema/`: final current table structure, indexes, foreign keys and constraints.
- `seeds/`: required system catalog data.
- `procedures/`: current stored procedure logic.
- `publications/`: official versioned publications such as legal documents.
- `generated/`: generated importable full SQL. Do not edit manually.
- `tools/`: file-only builder and validator for the baseline.
- `local/`: local/dev examples only.
- `migrations/`: historical upgrades for existing databases only.
- `fixed/`: legacy duplicate/fix scripts only.

## Clean install - MySQL/MariaDB CLI

1. Create an empty database manually.
2. Select it manually.
3. From `server/src/db`, run:

```sql
USE your_empty_database;
SOURCE install.sql;
```

`install.sql` does not create, drop or select a database. It does not execute `migrations/`, `fixed/`, `reset-development.sql` or `schema/001_create_database.sql`.

## Clean install - phpMyAdmin / Hostinger

1. Create an empty database from the hosting panel.
2. Select that database in phpMyAdmin.
3. Import:

```text
server/src/db/generated/cajora_v1_0_full.sql
```

The generated file contains schema, seeds, procedures and the official legal publication v1.0 in a single SQL file without `SOURCE` statements.

## Build

From `server`:

```bash
npm run db:build-baseline
```

This regenerates:

```text
src/db/generated/cajora_v1_0_full.sql
```

Generated files are versioned but must not be edited manually.

## Validate

From `server`:

```bash
npm run db:validate-baseline
```

The validator is file-only. It does not connect to MySQL/MariaDB.

It verifies:

- manifest files exist;
- generated SQL matches the builder output;
- install order matches the manifest;
- active baseline has no `punto_venta_dev_clean_2` dependency;
- active baseline does not reference `migrations/` or `fixed/`;
- generated SQL has no `SOURCE`;
- legal v1.0 hashes are present;
- `schema/001_create_database.sql` is not part of the canonical install.

## Install order

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

For v1.0 clean installs, the publication is part of `install.sql` and `generated/cajora_v1_0_full.sql` so a newly created database is ready to register businesses.

Future legal versions should be published deliberately as new publication files, not by editing historical v1.0 content.

## Historical migrations

`migrations/` is retained during K.1 for history and existing database upgrades only.

Do not run migrations for a clean v1.0 install.

Important examples:

- `migrations/006_publish_cajora_legal_v1_0.sql` is the historical source for the legal publication. The canonical clean-install copy is `publications/001_cajora_legal_v1_0.sql`.
- `migrations/007_sale_payments_delivery_cash_settlements.sql` is not part of clean install. Its final schema/seed/procedure state is absorbed by the baseline.

## Local helpers

`local/create_database.example.sql` and `local/reset_database.example.sql` are local development examples only.

They are not referenced by `install.sql`, the manifest or generated full SQL.

`reset-development.sql` is retained during K.1 as a legacy/dev helper. It is not part of the canonical baseline.

## K.1 transitional note

K.1 does not delete historical folders.

Temporarily retained until K.2:

- `fixed/`
- `migrations/`
- `schema/001_create_database.sql`
- `reset-development.sql`

K.2 will decide final cleanup only after a manually validated clean database reconstruction.

## Audit and manual test

- Static audit: `BASELINE_AUDIT.md`
- Manual validation checklist: `MANUAL_BASELINE_TEST.md`
