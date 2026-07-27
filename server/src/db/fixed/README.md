# Fixes de base de datos

## Collations

Para normalizar una base limpia o migrada al estandar del proyecto:

```sql
USE punto_venta_dev_clean;
SOURCE server/src/db/fixed/fix_collations.sql;
```

El fix convierte el schema activo y todas sus tablas base a:

```txt
utf8mb4 / utf8mb4_unicode_ci
```

Luego se recomienda recrear los stored procedures sobre la misma base, porque los
parametros de los procedures toman la collation activa al momento de crearse.

Orden recomendado despues de crear o importar una base limpia:

```sql
USE punto_venta_dev_clean;
SOURCE server/src/db/fixed/fix_collations.sql;
SOURCE server/src/db/procedures/auth.sql;
SOURCE server/src/db/procedures/businesses.sql;
SOURCE server/src/db/procedures/customers.sql;
SOURCE server/src/db/procedures/deposits.sql;
SOURCE server/src/db/procedures/product-categories.sql;
SOURCE server/src/db/procedures/products.sql;
SOURCE server/src/db/procedures/stock.sql;
SOURCE server/src/db/procedures/stock_movements.sql;
SOURCE server/src/db/procedures/sales.sql;
SOURCE server/src/db/procedures/purchases.sql;
SOURCE server/src/db/procedures/suppliers.sql;
SOURCE server/src/db/procedures/tickets.sql;
SOURCE server/src/db/procedures/dashboard.sql;
SOURCE server/src/db/procedures/subscriptions.sql;
SOURCE server/src/db/procedures/platform_auth.sql;
```
