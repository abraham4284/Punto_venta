# Cajora DB Baseline 1.0 Audit

## A. Cajora DB Baseline 1.0

K.1 consolidates the clean-install database baseline for Cajora / Punto_Venta v1.0.

Canonical clean install inputs are now:

1. `schema/`
2. `seeds/`
3. `procedures/`
4. `publications/`

Historical directories remain in place for K.1:

- `migrations/`: existing database upgrades only.
- `fixed/`: legacy duplicate/fix scripts only.

The baseline is intended for an already selected empty database. It does not create, drop or select a database by name.

## B. Historical migrations absorption matrix

| Migration | Historical purpose | Canonical final state | Absorbed by baseline | Notes |
| --- | --- | --- | --- | --- |
| `migrations/001_fix_collations.sql` | Normalize an existing database to `utf8mb4_unicode_ci`. | Every table in `schema/002_create_tables.sql` declares `DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`; text columns use `utf8mb4_unicode_ci`. | Yes | Historical only for old DBs with mixed collations. |
| `migrations/002_subscriptions_pk_fix.sql` | Convert subscription tables to simple primary keys and recreate FKs. | `schema/002_create_tables.sql` defines `business_subscriptions`, `subscription_payments` and `subscription_events` with simple primary keys; `schema/004_add_foreign_keys.sql` defines the FKs. | Yes | No clean install should run this migration. |
| `migrations/003_payment_methods_unique_name_fix.sql` | Replace unique `(idBusiness, code)` with unique `(idBusiness, name)` and keep a normal code index. | `schema/003_add_indexes.sql` contains `uk_payment_method_business_name` and `idx_payment_methods_business_code`; no unique `(idBusiness, code)` is present in the canonical baseline. | Yes | Multiple `TRANSFER`, `CARD` or `OTHER` methods per business are supported as long as names differ. |
| `migrations/004_sales_purchases_idempotency.sql` | Add `idempotency_key` to sales and purchases, backfill legacy rows and add tenant-scoped unique indexes. | `schema/002_create_tables.sql` defines `sales.idempotency_key` and `purchases.idempotency_key` as `NOT NULL`; `schema/003_add_indexes.sql` contains `uq_sales_business_idempotency` and `uq_purchases_business_idempotency`. | Yes | Backfill statements are migration-only and intentionally absent from clean install. |
| `migrations/005_legal_mvp.sql` | Add legal document, version and acceptance tables plus initial legal catalog for existing DBs. | `schema/002_create_tables.sql` defines `legal_documents`, `legal_document_versions`, `legal_acceptances`; `schema/003_add_indexes.sql` and `schema/004_add_foreign_keys.sql` define related indexes/FKs; `schema/005_add_constraints.sql` defines legal checks; `seeds/003_legal_documents.sql` seeds `TERMS` and `PRIVACY`. | Yes | Official legal content is not in seeds; it is now in `publications/001_cajora_legal_v1_0.sql`. |
| `migrations/006_publish_cajora_legal_v1_0.sql` | Publish official Cajora legal documents v1.0. | Copied to `publications/001_cajora_legal_v1_0.sql` with only the DB-specific `USE` removed. | Special | Preserved as historical migration; canonical clean install runs the publication copy. |
| `migrations/007_sale_payments_delivery_cash_settlements.sql` | Add sale payments, delivery, cash settlements, related permissions and role permissions; remove legacy payment columns from existing sales. | Tables are in `schema/002_create_tables.sql`; indexes in `schema/003_add_indexes.sql`; FKs in `schema/004_add_foreign_keys.sql`; checks in `schema/005_add_constraints.sql`; permissions and role permissions in `seeds/002_permissions_and_role_permissions.sql`; logic in `procedures/`. | Yes | Clean install must not run 007. Legacy backfill/drop-column logic belongs only to existing DB upgrades. |

## C. Detailed 007 audit

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

The following final tables from 007 are defined in `schema/002_create_tables.sql`:

- `sale_payments`
- `sale_payment_events`
- `sale_deliveries`
- `delivery_events`
- `cash_settlements`

`cash_session_payment_summaries` uses final column `payments_count`, not legacy `sales_count`.

### Indexes

`schema/003_add_indexes.sql` contains:

- `uk_sale_payment_business_id`
- `idx_sale_payments_business_sale`
- `idx_sale_payments_business_status`
- `idx_sale_payments_business_method`
- `idx_sale_payments_collector_status`
- `idx_sale_payments_cash_session`
- `idx_sale_payments_cash_settlement`
- `idx_sale_payments_created_at`
- `idx_sale_payment_events_payment_created`
- `uk_sale_delivery_business_sale`
- `uk_sale_delivery_business_id`
- `idx_sale_deliveries_business_status`
- `idx_sale_deliveries_assigned_status`
- `idx_sale_deliveries_scheduled_at`
- `idx_delivery_events_delivery_created`
- `uk_cash_settlement_business_id`
- `idx_cash_settlements_collector_settled`
- `idx_cash_settlements_cash_session`
- `idx_cash_settlements_settled_at`

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

The legacy check drop path was normalized to use `DROP CONSTRAINT` for MariaDB compatibility if it is ever exercised outside an empty install.

### Legacy state intentionally absent from clean install

Clean install does not include 007 logic for:

- backfilling legacy `sale_payments` from old `sales.idPaymentMethod`;
- inserting `PAYMENT_MIGRATED` events for old sales;
- dropping old `sales.idPaymentMethod` or `sales.payment_detail`.

Those operations are only meaningful for existing databases and remain historical in `migrations/007_sale_payments_delivery_cash_settlements.sql`.

### Procedures

Runtime logic is canonical in `procedures/`, including:

- `sale_payments.sql`
- `deliveries.sql`
- `cash_settlements.sql`
- `cash_session_payment_summaries.sql`
- `sales.sql`

## D. Hard-coded DB name audit

Searched token: `punto_venta_dev_clean_2`.

### Removed from active baseline

The hard-coded database name was removed from:

- `schema/002_create_tables.sql`
- `schema/003_add_indexes.sql`
- `schema/004_add_foreign_keys.sql`
- `schema/005_add_constraints.sql`
- `seeds/001_subscription_plans.sql`
- `seeds/002_permissions_and_role_permissions.sql`
- `seeds/003_legal_documents.sql`
- `publications/001_cajora_legal_v1_0.sql`
- `install.sql`
- generated full SQL

### Allowed historical/local occurrences during K.1

The string can remain only in legacy/transitional files:

- `schema/001_create_database.sql`
- `reset-development.sql`
- `migrations/006_publish_cajora_legal_v1_0.sql`
- historical docs explicitly marked as not clean-install material

## E. JSON_TABLE compatibility notes

`JSON_TABLE` is present in canonical procedures and may be a MariaDB compatibility risk depending on the server version/configuration:

- `procedures/business_users.sql`
- `procedures/notifications.sql`
- `procedures/purchases.sql`

K.1 does not refactor those procedures. This is a compatibility note for a dedicated future phase, especially for Hostinger/MariaDB environments.

## F. Remaining K.2 cleanup candidates

Do not delete during K.1. Candidates for K.2 after manual baseline validation:

- `fixed/`
- absorbed historical migrations 001-005 and 007
- historical `migrations/006_publish_cajora_legal_v1_0.sql` if publications becomes the only release artifact
- `schema/001_create_database.sql`
- `reset-development.sql`
- obsolete README sections that still describe legacy clean-install flows
- `procedures/truncate.tables.sql` or relocation to a local/destructive helper area
