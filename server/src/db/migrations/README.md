# Migrations

Historical correction scripts belong here.

The clean schema in ../schema is for new installations from an empty database.
Existing installations should be updated with migration/fix scripts, not by replaying the clean schema over production data.

Copied historical scripts:

1. 001_fix_collations.sql
2. 002_subscriptions_pk_fix.sql
3. 003_cash_module_existing_schema.sql

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
