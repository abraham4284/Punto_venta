export const schemaFiles = [
  "schema/002_create_tables.sql",
  "schema/003_add_indexes.sql",
  "schema/004_add_foreign_keys.sql",
  "schema/005_add_constraints.sql",
];

export const seedFiles = [
  "seeds/001_subscription_plans.sql",
  "seeds/002_permissions_and_role_permissions.sql",
  "seeds/003_legal_documents.sql",
];

export const procedureFiles = [
  "procedures/auth.sql",
  "procedures/legal.sql",
  "procedures/platform_auth.sql",
  "procedures/platform_audit.sql",
  "procedures/platform_users.sql",
  "procedures/platform_businesses.sql",
  "procedures/platform_dashboard.sql",
  "procedures/businesses.sql",
  "procedures/business_users.sql",
  "procedures/notifications.sql",
  "procedures/subscriptions.sql",
  "procedures/deposits.sql",
  "procedures/payment_methods.sql",
  "procedures/cash_registers.sql",
  "procedures/cash_session_payment_summaries.sql",
  "procedures/cash_sessions.sql",
  "procedures/cash_movements.sql",
  "procedures/cash_settlements.sql",
  "procedures/product-categories.sql",
  "procedures/products.sql",
  "procedures/customers.sql",
  "procedures/suppliers.sql",
  "procedures/stock.sql",
  "procedures/stock_movements.sql",
  "procedures/sale_payments.sql",
  "procedures/deliveries.sql",
  "procedures/sales.sql",
  "procedures/purchases.sql",
  "procedures/tickets.sql",
  "procedures/dashboard.sql",
];

export const publicationFiles = [
  "publications/001_cajora_legal_v1_0.sql",
];

export const excludedProcedureFiles = [
  "procedures/truncate.tables.sql",
];

export const baselineFiles = [
  ...schemaFiles,
  ...seedFiles,
  ...procedureFiles,
  ...publicationFiles,
];
