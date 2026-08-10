# Migrations

Historical correction scripts belong here.

The clean schema in ../schema is for new installations from an empty database.
Existing installations should be updated with migration/fix scripts, not by replaying the clean schema over production data.

Copied historical scripts:

1. 001_fix_collations.sql
2. 002_subscriptions_pk_fix.sql
3. 003_payment_methods_unique_name_fix.sql
4. 004_sales_purchases_idempotency.sql

Para bases existentes que aun tengan `UNIQUE(idBusiness, code)` en
`payment_methods`, ejecutar:

1. migrations/003_payment_methods_unique_name_fix.sql

Este cambio elimina la restriccion vieja `uk_payment_method_business_code`,
mantiene un indice normal para busquedas por `code` y asegura
`UNIQUE(idBusiness, name)`. Asi un negocio puede cargar varios metodos del
tipo `TRANSFER`, `CARD` u `OTHER`, por ejemplo Mercado Pago, Uala o Banco
Nacion, sin duplicar nombres visibles dentro del mismo negocio.

Para bases existentes creadas antes del modulo de cajas, ejecutar:

1. migrations/003_cash_module_existing_schema.sql
2. schema/003_add_indexes.sql
3. schema/004_add_foreign_keys.sql
4. schema/005_add_constraints.sql
5. procedures/auth.sql
6. procedures/cash_registers.sql
7. procedures/cash_session_payment_summaries.sql
8. procedures/cash_sessions.sql
9. procedures/cash_movements.sql
10. procedures/sales.sql

El schema/002_create_tables.sql esta pensado para instalaciones nuevas. En una
base ya existente no modifica tablas creadas previamente porque usa
CREATE TABLE IF NOT EXISTS.

The original files in ../fixed were left untouched for compatibility with the
current workspace history.

Para bases existentes creadas antes de la proteccion contra doble ejecucion de
ventas y compras, ejecutar:

1. migrations/004_sales_purchases_idempotency.sql
2. procedures/sales.sql
3. procedures/purchases.sql

La migracion agrega `idempotency_key` a `sales` y `purchases`, rellena registros
historicos con claves `legacy-*` y crea los indices unicos multi-tenant:

- `uq_sales_business_idempotency`
- `uq_purchases_business_idempotency`
