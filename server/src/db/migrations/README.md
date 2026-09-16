# Migrations

HISTORICAL / EXISTING DATABASE UPGRADES ONLY.

Do not execute these files for a clean Cajora v1.0 installation.

A clean install uses only:

1. `../schema/`
2. `../seeds/`
3. `../procedures/`
4. `../publications/`

## Important rules

- `007_sale_payments_delivery_cash_settlements.sql` is not part of clean install.
- `001` through `005` are absorbed by the canonical baseline for new databases.
- `006_publish_cajora_legal_v1_0.sql` remains historical/audit material.
- The canonical legal v1.0 publication is `../publications/001_cajora_legal_v1_0.sql`.
- Existing installations must be backed up before any migration is executed.

## Current historical files

1. `001_fix_collations.sql`
2. `002_subscriptions_pk_fix.sql`
3. `003_payment_methods_unique_name_fix.sql`
4. `004_sales_purchases_idempotency.sql`
5. `005_legal_mvp.sql`
6. `006_publish_cajora_legal_v1_0.sql`
7. `007_sale_payments_delivery_cash_settlements.sql`

## K.1 status

These files are retained during K.1 for traceability and existing database upgrades only. K.2 will decide final cleanup after a clean baseline has been manually validated.
