# Cajora DB Baseline 1.0 Audit

## A. Cajora DB Baseline 1.0

K.2 closes the database baseline cleanup for Cajora / Punto_Venta v1.0.

Canonical clean install inputs are:

1. `schema/`
2. `seeds/`
3. `procedures/`
4. `publications/`

The baseline is intended for an already selected empty database. It does not create, drop or select a database by name.

Historical migrations and fixed scripts were removed from the working tree after manual validation of the clean baseline. Their history remains available in Git.

## B. Historical migrations absorption matrix

| Historical file | Historical purpose | Canonical final state | Absorbed by baseline | Notes |
| --- | --- | --- | --- | --- |
| `001_fix_collations.sql` | Normalize an existing database to `utf8mb4_unicode_ci`. | Every table in `schema/002_create_tables.sql` declares `DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`; text columns use `utf8mb4_unicode_ci`. | Yes | Historical only. Removed in K.2. |
| `002_subscriptions_pk_fix.sql` | Convert subscription tables to simple primary keys and recreate FKs. | `schema/002_create_tables.sql` defines `business_subscriptions`, `subscription_payments` and `subscription_events` with simple primary keys; `schema/004_add_foreign_keys.sql` defines the FKs. | Yes | Removed in K.2. |
| `003_payment_methods_unique_name_fix.sql` | Replace unique `(idBusiness, code)` with unique `(idBusiness, name)` and keep a normal code index. | `schema/003_add_indexes.sql` contains `uk_payment_method_business_name` and `idx_payment_methods_business_code`; no unique `(idBusiness, code)` is present. | Yes | Removed in K.2. |
| `004_sales_purchases_idempotency.sql` | Add `idempotency_key` to sales and purchases and add tenant-scoped unique indexes. | `schema/002_create_tables.sql` defines the columns; `schema/003_add_indexes.sql` contains `uq_sales_business_idempotency` and `uq_purchases_business_idempotency`. | Yes | Removed in K.2. |
| `005_legal_mvp.sql` | Add legal document, version and acceptance tables plus initial catalog. | Legal tables live in `schema/002_create_tables.sql`; indexes/FKs/checks live in `schema/003-005`; catalog lives in `seeds/003_legal_documents.sql`. | Yes | Removed in K.2. |
| `006_publish_cajora_legal_v1_0.sql` | Publish official Cajora legal documents v1.0. | Canonical publication lives in `publications/001_cajora_legal_v1_0.sql`. | Yes | Removed in K.2; Git history remains. |
| `007_sale_payments_delivery_cash_settlements.sql` | Add sale payments, delivery, cash settlements, related permissions and role permissions. | Tables are in `schema/002_create_tables.sql`; indexes in `schema/003_add_indexes.sql`; FKs in `schema/004_add_foreign_keys.sql`; checks in `schema/005_add_constraints.sql`; permissions and role permissions in `seeds/002_permissions_and_role_permissions.sql`; logic in `procedures/`. | Yes | Removed in K.2. |

## C. Detailed 007 Audit

### Subscription and role state

- `subscription_plans.trial_days` final default is present in `schema/002_create_tables.sql` and initial values are provided by `seeds/001_subscription_plans.sql`.
- `business_users.role` includes `DELIVERY` in `schema/002_create_tables.sql`.

### Permissions and role permissions

`seeds/002_permissions_and_role_permissions.sql` contains the 007 permission set:

- `sale_payments.view`
- `sale_payments.create`
- `sale_payments.update`
- `sale_payments.collect`
- `sale_payments.confirm`
- `sale_payments.cancel`
- `deliveries.view`
- `deliveries.view_all`
- `deliveries.assign`
- `deliveries.update_status`
- `cash_settlements.view`
- `cash_settlements.create`

`ADMIN` receives sale payment, delivery and cash settlement permissions.

`DELIVERY` receives:

- `deliveries.view`
- `deliveries.update_status`
- `sale_payments.view`
- `sale_payments.collect`

### Tables

The final tables from 007 are defined in `schema/002_create_tables.sql`:

- `sale_payments`
- `sale_payment_events`
- `sale_deliveries`
- `delivery_events`
- `cash_settlements`

`cash_session_payment_summaries` uses final column `payments_count`, not legacy `sales_count`.

### Indexes

`schema/003_add_indexes.sql` contains sale payment, delivery, delivery event and cash settlement indexes, including tenant-scoped unique keys such as:

- `uk_sale_payment_business_id`
- `uk_sale_delivery_business_sale`
- `uk_sale_delivery_business_id`
- `uk_cash_settlement_business_id`

### Foreign keys and multi-tenant relations

`schema/004_add_foreign_keys.sql` defines tenant-aware relations where needed:

- `sale_payments(idBusiness, idSale)` -> `sales(idBusiness, idSale)`
- `sale_payments(idBusiness, idPaymentMethod)` -> `payment_methods(idBusiness, idPaymentMethod)`
- `sale_payment_events(idBusiness, idSalePayment)` -> `sale_payments(idBusiness, idSalePayment)`
- `sale_deliveries(idBusiness, idSale)` -> `sales(idBusiness, idSale)`
- `delivery_events(idBusiness, idSaleDelivery)` -> `sale_deliveries(idBusiness, idSaleDelivery)`
- `sale_payments(idBusiness, idCashSettlement)` -> `cash_settlements(idBusiness, idCashSettlement)`

User references point to `users(idUser)` for actor identity.

### Constraints

`schema/005_add_constraints.sql` contains final checks:

- `chk_cash_summary_payments_count_non_negative`
- `chk_cash_summary_total_amount_non_negative`
- `chk_sale_payments_amount_positive`
- `chk_cash_settlements_total_amount_positive`

The legacy check drop path uses `DROP CONSTRAINT` for MariaDB compatibility if it is ever exercised outside an empty install.

### Legacy state intentionally absent from clean install

Clean install does not include historical backfill/drop-column logic. That history remains available in Git.

## D. Hard-coded DB Name Audit

Searched token: `punto_venta_dev_clean_2`.

Post-K.2 active baseline has no dependency on that database name.

The validator keeps the token only as a forbidden string to detect regressions.

## E. JSON_TABLE Compatibility Notes

`JSON_TABLE` is present in canonical procedures and may be a MariaDB compatibility risk depending on server version/configuration:

- `procedures/business_users.sql`
- `procedures/notifications.sql`
- `procedures/purchases.sql`

K.2 does not refactor those procedures. This remains a compatibility note for a dedicated future phase if Hostinger/MariaDB requires it.

## F. Final Cleanup Completed

Completed in K.2:

- `fixed/` removed.
- `migrations/` removed.
- `schema/001_create_database.sql` removed.
- `reset-development.sql` removed.
- `procedures/truncate.tables.sql` removed from canonical procedures.
- Legal v1.0 publication canonicalized in `publications/001_cajora_legal_v1_0.sql`.
- Local database tooling added in `tools/local-db.mjs`.
- Local helper documentation added in `local/README.md`.

## G. Release Candidate State

The DB baseline is ready for release-candidate validation through:

- `npm run db:build-baseline`
- `npm run db:validate-baseline`
- `npm run db:local:reset -- --yes` by the operator
- the manual smoke checklist in `MANUAL_BASELINE_TEST.md`
