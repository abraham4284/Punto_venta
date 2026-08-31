/*
  Clean database install script.
  Run this file from MySQL client with SOURCE support, from server/src/db directory:

    SOURCE install.sql;

  This installer does not drop database or tables.
*/

SOURCE schema/001_create_database.sql;
SOURCE schema/002_create_tables.sql;
SOURCE schema/003_add_indexes.sql;
SOURCE schema/004_add_foreign_keys.sql;
SOURCE schema/005_add_constraints.sql;
SOURCE seeds/001_subscription_plans.sql;
SOURCE seeds/002_permissions_and_role_permissions.sql;
SOURCE seeds/003_legal_documents.sql;

/* Procedures: execute after schema and seeds. Keep this order. */
SOURCE procedures/auth.sql;
SOURCE procedures/legal.sql;
SOURCE procedures/platform_auth.sql;
SOURCE procedures/platform_audit.sql;
SOURCE procedures/platform_users.sql;
SOURCE procedures/platform_businesses.sql;
SOURCE procedures/platform_dashboard.sql;
SOURCE procedures/businesses.sql;
SOURCE procedures/business_users.sql;
SOURCE procedures/notifications.sql;
SOURCE procedures/subscriptions.sql;
SOURCE procedures/deposits.sql;
SOURCE procedures/payment_methods.sql;
SOURCE procedures/cash_registers.sql;
SOURCE procedures/cash_session_payment_summaries.sql;
SOURCE procedures/cash_sessions.sql;
SOURCE procedures/cash_movements.sql;
SOURCE procedures/product-categories.sql;
SOURCE procedures/products.sql;
SOURCE procedures/customers.sql;
SOURCE procedures/suppliers.sql;
SOURCE procedures/stock.sql;
SOURCE procedures/stock_movements.sql;
SOURCE procedures/sales.sql;
SOURCE procedures/purchases.sql;
SOURCE procedures/tickets.sql;
SOURCE procedures/dashboard.sql;

/*
  Legal publication is intentionally manual and auditable.
  After this install, run migrations/006_publish_cajora_legal_v1_0.sql only
  when you intentionally want to publish Cajora TERMS/PRIVACY 1.0.
*/
