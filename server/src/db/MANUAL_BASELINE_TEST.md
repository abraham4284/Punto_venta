# Manual Baseline Test - Cajora DB v1.0

This checklist is for the operator. Codex must not execute these steps.

## Preparation

1. Create an empty database manually.
2. Select that empty database.
3. Do not run this over an existing production database.
4. Do not run historical migrations for a clean v1.0 install.

## Option A - MySQL/MariaDB CLI

From `server/src/db`:

```sql
USE your_empty_database;
SOURCE install.sql;
```

## Option B - phpMyAdmin / Hostinger

1. Select the empty database in phpMyAdmin.
2. Import:

```text
server/src/db/generated/cajora_v1_0_full.sql
```

## Read-only verification suggestions

```sql
SHOW TABLES;
SHOW PROCEDURE STATUS WHERE Db = DATABASE();
```

Suggested key tables to verify exist:

```sql
SHOW TABLES LIKE 'businesses';
SHOW TABLES LIKE 'users';
SHOW TABLES LIKE 'business_users';
SHOW TABLES LIKE 'subscription_plans';
SHOW TABLES LIKE 'permissions';
SHOW TABLES LIKE 'role_permissions';
SHOW TABLES LIKE 'legal_documents';
SHOW TABLES LIKE 'legal_document_versions';
SHOW TABLES LIKE 'legal_acceptances';
SHOW TABLES LIKE 'payment_methods';
SHOW TABLES LIKE 'cash_registers';
SHOW TABLES LIKE 'cash_sessions';
SHOW TABLES LIKE 'cash_session_payment_summaries';
SHOW TABLES LIKE 'sale_payments';
SHOW TABLES LIKE 'sale_payment_events';
SHOW TABLES LIKE 'sale_deliveries';
SHOW TABLES LIKE 'delivery_events';
SHOW TABLES LIKE 'cash_settlements';
```

Suggested catalog checks:

```sql
SELECT code, trial_days, is_active FROM subscription_plans;
SELECT code FROM permissions WHERE code IN (
  'sale_payments.view',
  'sale_payments.create',
  'sale_payments.update',
  'sale_payments.collect',
  'sale_payments.confirm',
  'sale_payments.cancel',
  'deliveries.view',
  'deliveries.view_all',
  'deliveries.assign',
  'deliveries.update_status',
  'cash_settlements.view',
  'cash_settlements.create'
);
SELECT code, required_action, is_active FROM legal_documents;
SELECT d.code, v.version, v.content_hash, v.status
FROM legal_document_versions v
INNER JOIN legal_documents d ON d.idLegalDocument = v.idLegalDocument
WHERE v.version = '1.0';
```

Expected legal hashes:

- TERMS 1.0: `5430d5d3870113f25f00d98f29ba85b14e78b6591f4f0809c3214b27ed021ab4`
- PRIVACY 1.0: `9cd13785522dac3e837b54f1eb988e936f110ad6805dcf6063b88fcf7930f222`

## Smoke test app

1. Register OWNER/business.
2. Login as OWNER.
3. Verify legal Terms/Privacy state.
4. Create deposit.
5. Create product.
6. Register purchase.
7. Open cash session.
8. Create normal sale.
9. Create delivery sale.
10. Login as delivery user.
11. Delivery user collects payment.
12. Delivery user marks delivery as delivered.
13. Admin/OWNER receives settlement.
14. Close cash session.
15. Verify sales history, delivery history, cash settlement history and reports.

## Expected clean install state

A successful clean install should include:

- complete tables;
- indexes;
- foreign keys;
- constraints;
- subscription plan seed;
- permissions seed;
- role permissions seed;
- legal document catalog seed;
- TERMS 1.0 published;
- PRIVACY 1.0 published;
- current stored procedures.

It should not require `migrations/007_sale_payments_delivery_cash_settlements.sql` or any other historical migration.
