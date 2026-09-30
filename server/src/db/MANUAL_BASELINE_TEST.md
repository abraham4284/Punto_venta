# Manual Baseline Test - Cajora DB v1.0

This checklist is for the operator. Codex must not execute DB-connected steps.

## Preparation

1. Confirm your `.env` points to the intended local database.
2. Confirm `DB_HOST` is `localhost`, `127.0.0.1` or `::1` for local tooling.
3. Confirm `mysql` or `mariadb` client is available in `PATH`.
4. Do not run clean install over an existing production database.

## Option A - Local automated reset

From `server`:

```bash
npm run db:build-baseline
npm run db:validate-baseline
npm run db:local:reset -- --yes
```

This is destructive and only works against localhost.

## Option B - Local automated create

From `server`:

```bash
npm run db:build-baseline
npm run db:validate-baseline
npm run db:local:create
```

This aborts if `DB_NAME` already exists.

## Option C - MySQL/MariaDB CLI

From `server/src/db`:

```sql
CREATE DATABASE cajora_local
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cajora_local;
SOURCE install.sql;
```

## Option D - phpMyAdmin / Hostinger

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
SHOW TABLES LIKE 'product_images';
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

## Smoke test Product Gallery

1. Create a product with `products.image_url` as cover image.
2. Verify `products.image_url` still behaves as the product cover.
3. Add two additional images through `POST /products/:idProduct/images`.
4. List gallery images through `GET /products/:idProduct/images`.
5. Verify order is `sortOrder ASC, idProductImage ASC`.
6. Reorder all current image IDs through `PATCH /products/:idProduct/images/order`.
7. Delete one image through `DELETE /products/:idProduct/images/:idProductImage`.
8. If the environment has multiple businesses/products, verify cross-tenant and cross-product access does not expose or mutate images.
9. Verify the gallery rejects the eleventh image with a clear business error.

### Product Gallery reorder regression

1. Current gallery order `A -> 0`, `B -> 1`, `C -> 2`; send `[B, A, C]` to `PATCH /products/:idProduct/images/order`; expect success.
2. Current gallery order `A -> 0`, `B -> 1`, `C -> 2`; send `[A, B, C]`; expect success/no-op.
3. Current gallery has 9 images; run two concurrent `POST /products/:idProduct/images`; expect the gallery never exceeds 10 images.
4. Run `POST /products/:idProduct/images` concurrently with `PATCH /products/:idProduct/images/order`; expect a consistent final order without duplicate `sortOrder`.
5. Run `DELETE /products/:idProduct/images/:idProductImage` concurrently with `PATCH /products/:idProduct/images/order`; expect one operation waits or fails cleanly without corrupting the gallery set.

## Smoke test Public Storefront Catalog

Codex must not execute these HTTP or DB-connected checks. They are for the operator after configuring the deployment.

1. Configure `PUBLIC_CATALOG_BUSINESS_SLUG` with the active business slug.
2. Configure `STOREFRONT_URL` with the public Storefront origin.
3. Run `GET /api/public/catalog`.
4. Run `GET /api/public/catalog/categories`.
5. Run `GET /api/public/catalog/products?page=1&limit=24`.
6. Run `GET /api/public/catalog/products?search=term`.
7. Run `GET /api/public/catalog/products?idProductCategory=1`.
8. Confirm active products are visible.
9. Confirm inactive products are not visible.
10. Confirm inactive categories are not published.
11. Run `GET /api/public/catalog/products/:idProduct` and verify cover plus additional gallery images.
12. Confirm gallery order is `sortOrder ASC, idProductImage ASC`.
13. Confirm `priceCost` is absent.
14. Confirm `stockMin` is absent.
15. Confirm `idBusiness` is absent.
16. Confirm `available` is returned as true/false without exact stock quantity.
17. Configure a nonexistent slug and expect 404.
18. Remove `PUBLIC_CATALOG_BUSINESS_SLUG` and expect 404.
19. Suspend or deactivate the business and expect 404.
20. Confirm requests from `STOREFRONT_URL` are allowed by CORS without using wildcard origins.

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
- product gallery table, indexes, foreign key, constraint and procedures;
- public Storefront catalog procedures;
- current stored procedures.

It should not require historical migrations or fixed scripts.
