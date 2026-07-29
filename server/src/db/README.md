# Database Setup

Este directorio separa el esquema limpio para instalaciones nuevas, los seeds
requeridos, los stored procedures y las migraciones/fixes historicos.

## Orden de ejecucion para una base vacia

Ejecutar desde `server/src/db`:

1. `schema/001_create_database.sql`
2. `schema/002_create_tables.sql`
3. `schema/003_add_indexes.sql`
4. `schema/004_add_foreign_keys.sql`
5. `schema/005_add_constraints.sql`
6. Seeds:
   - `seeds/001_subscription_plans.sql`
   - `seeds/002_permissions_and_role_permissions.sql`
7. Stored procedures:
   - `procedures/auth.sql`
   - `procedures/platform_auth.sql`
   - `procedures/platform_audit.sql`
   - `procedures/platform_users.sql`
   - `procedures/platform_businesses.sql`
   - `procedures/platform_dashboard.sql`
   - `procedures/businesses.sql`
   - `procedures/business_users.sql`
   - `procedures/subscriptions.sql`
   - `procedures/deposits.sql`
   - `procedures/product-categories.sql`
   - `procedures/products.sql`
   - `procedures/customers.sql`
   - `procedures/suppliers.sql`
   - `procedures/stock.sql`
   - `procedures/stock_movements.sql`
   - `procedures/sales.sql`
   - `procedures/purchases.sql`
   - `procedures/tickets.sql`
   - `procedures/dashboard.sql`

Tambien se puede ejecutar `install.sql` con un cliente MySQL que soporte
`SOURCE`:

```sql
SOURCE install.sql;
```

## Collation y motor

El dump exportado desde `punto_venta_dev_clean` usa de forma consistente:

- `ENGINE=InnoDB`
- `CHARACTER SET utf8mb4`
- `COLLATE utf8mb4_unicode_ci`

El esquema limpio mantiene ese estandar para evitar los errores previos de
mezcla de collations.

## Esquema limpio vs migraciones

- `schema/` sirve para crear instalaciones nuevas desde cero.
- `migrations/` conserva scripts historicos de correccion para bases existentes.
- `export_db/` queda como referencia del dump de estructura usado como fuente.
- `procedures/` contiene stored procedures de negocio y plataforma. No se
  mezclan con la creacion de tablas.

## Seeds

Los seeds no incluyen datos reales del entorno.

Incluyen:

- Plan base de suscripcion requerido por el registro inicial.
- Catalogo de permisos.
- Permisos predeterminados por rol `ADMIN` y `SELLER`.

No se incluye seed global para `payment_methods` porque la tabla requiere
`idBusiness`; los metodos de pago son datos tenant-specific.

## Reset de desarrollo

`reset-development.sql` elimina la base completa y vuelve a ejecutar el
instalador. Usar solo en desarrollo.

## Inconsistencias detectadas en el dump

Estas observaciones se reportan sin modificar semanticamente el modelo:

1. `sales` tiene primary key compuesta (`idSale`, `idDeposit`) aunque `idSale`
   es `AUTO_INCREMENT`. Tambien existe `uk_sale_business_id`
   (`idBusiness`, `idSale`) usado por `sale_details`.
2. `sales.idDeposit` tiene indice `fk_sales_deposits1_idx`, pero no tiene una
   foreign key explicita hacia `deposits`.
3. `sale_details` no tiene columna `idDeposit`, pero define
   `fk_sale_details_deposit` sobre `idBusiness` hacia `deposits(idBusiness)`.
   Esa relacion no identifica un deposito concreto.
4. `platform_users` tiene primary key compuesta (`idPlatformUser`, `idUser`) y
   tambien `UNIQUE KEY idUser_UNIQUE (idUser)`, mas otro indice sobre `idUser`.
   El indice `fk_platform_users_users1_idx` es redundante frente al unico.
5. `user_sessions` tiene primary key compuesta (`idLogin`, `idUser`) aunque
   `idLogin` es `AUTO_INCREMENT`.
6. `subscription_plans.code` es `NOT NULL`, pero no tiene unique key en el dump.
   Los seeds usan `code` como identificador logico.
7. `sale_number` y `purchase_number` son `NOT NULL`, pero el dump no define
   unique key para ellos.
8. Varias columnas `updated_at` usan `DEFAULT NULL`, mientras otras usan
   `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`. Se mantuvo tal como
   esta en el dump.

## Correcciones aplicadas en el esquema limpio

- Se eliminaron `DROP TABLE` y `AUTO_INCREMENT=<valor exportado>` del dump.
- Se separaron tablas, indices y foreign keys.
- Se centralizo `utf8mb4_unicode_ci`.
- Se usaron nombres explicitos del dump para indices y constraints.
- Se separaron seeds requeridos por la aplicacion.

## Correcciones no aplicadas

No se corrigieron las inconsistencias semanticas listadas arriba porque pueden
afectar reglas de negocio o procedures existentes. Conviene decidirlas en una
migracion explicita y probada.
