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
   - `procedures/notifications.sql`
   - `procedures/subscriptions.sql`
   - `procedures/deposits.sql`
   - `procedures/payment_methods.sql`
   - `procedures/cash_registers.sql`
   - `procedures/cash_session_payment_summaries.sql`
   - `procedures/cash_sessions.sql`
   - `procedures/cash_movements.sql`
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

No se incluye seed global para `payment_methods` ni `cash_registers` porque
requieren `idBusiness`; se crean dentro del flujo de registro del negocio.

## Reset de desarrollo

`reset-development.sql` elimina la base completa y vuelve a ejecutar el
instalador. Usar solo en desarrollo.

## Inconsistencias detectadas en el dump

Estas observaciones se reportan sin modificar semanticamente el modelo:

1. `platform_users` tiene primary key compuesta (`idPlatformUser`, `idUser`) y
   tambien `UNIQUE KEY idUser_UNIQUE (idUser)`, mas otro indice sobre `idUser`.
   El indice `fk_platform_users_users1_idx` es redundante frente al unico.
2. `user_sessions` tiene primary key compuesta (`idLogin`, `idUser`) aunque
   `idLogin` es `AUTO_INCREMENT`.
3. `subscription_plans.code` es `NOT NULL`, pero no tiene unique key en el dump.
   Los seeds usan `code` como identificador logico.
4. `purchase_number` es `NOT NULL`, pero el dump no define unique key.
5. Varias columnas `updated_at` usan `DEFAULT NULL`, mientras otras usan
   `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`. Se mantuvo tal como
   esta en el dump.

## Correcciones aplicadas en el esquema limpio

- Se eliminaron `DROP TABLE` y `AUTO_INCREMENT=<valor exportado>` del dump.
- Se separaron tablas, indices y foreign keys.
- Se centralizo `utf8mb4_unicode_ci`.
- Se usaron nombres explicitos del dump para indices y constraints.
- Se separaron seeds requeridos por la aplicacion.
- Se agrego el modelo de cajas, sesiones, movimientos y snapshots de cierre.
- Se agrego `sales.idCashSession` obligatorio para instalaciones nuevas.
- Se agrego el modelo de notificaciones internas con contexto `BUSINESS` y
  `PLATFORM`, destinatarios por usuario/plataforma, lectura, archivo,
  expiracion y resolucion por deduplicacion.
- Se agregaron `payment_methods.code` y `payment_methods.affects_cash` para
  identificar efectivo sin depender del texto visible.
- Se corrigio `payment_methods` para permitir multiples metodos del mismo tipo
  funcional por negocio: `code` puede repetirse y el nombre visible queda unico
  por negocio mediante `UNIQUE(idBusiness, name)`.
- Se dejo `payment_methods.code` como enum controlado:
  `CASH`, `TRANSFER`, `CARD`, `OTHER`.
- Se agrego indice normal `idx_payment_methods_business_code`
  (`idBusiness`, `code`) para consultas sin imponer unicidad por tipo.
- Se agrego `uk_payment_method_business_id` (`idBusiness`, `idPaymentMethod`)
  para soportar foreign keys multi-tenant desde ventas.
- Se agregaron checks booleanos y consistencia de caja en `payment_methods`:
  solo `CASH` impacta caja.
- Se corrigio `sales` para que `idSale` sea primary key simple.
- Se agrego `UNIQUE(sale_number)` para sostener la generacion alfanumerica
  irrepetible del backend.
- Se agrego foreign key explicita `sales(idBusiness, idDeposit)` hacia
  `deposits(idBusiness, idDeposit)`.
- Se elimino la foreign key incorrecta de `sale_details(idBusiness)` hacia
  `deposits(idBusiness)`, porque `sale_details` no identifica un deposito
  concreto.
- `reset-development.sql` ahora elimina la misma base declarada en el schema
  limpio: `punto_venta_dev_clean_2`.

## Estado actual del esquema limpio

El esquema ubicado en `schema/` esta listo para crear una base nueva desde cero
sin depender del dump exportado ni de carpetas historicas. Para el flujo de
metodos de pago, la estructura final queda asi:

- `payment_methods.code` identifica el tipo funcional del metodo.
- `payment_methods.name` identifica la cuenta o metodo visible para el usuario.
- Un negocio puede tener varios `TRANSFER`, `CARD` u `OTHER`.
- Un negocio no puede repetir el mismo `name` en `payment_methods`.
- `sales.idPaymentMethod` es obligatorio y referencia el metodo concreto usado.
- El metodo `CASH / Efectivo` se crea en el registro del negocio desde
  `procedures/auth.sql`.

## Correcciones no aplicadas

No se corrigieron las inconsistencias semanticas listadas arriba porque pueden
afectar reglas de negocio o procedures existentes. Conviene decidirlas en una
migracion explicita y probada.
