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
   - `seeds/003_legal_documents.sql`
7. Stored procedures:
   - `procedures/auth.sql`
   - `procedures/legal.sql`
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
   - `procedures/cash_settlements.sql`
   - `procedures/product-categories.sql`
   - `procedures/products.sql`
   - `procedures/customers.sql`
   - `procedures/suppliers.sql`
   - `procedures/stock.sql`
   - `procedures/stock_movements.sql`
   - `procedures/sale_payments.sql`
   - `procedures/deliveries.sql`
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

Si una base existente ya tiene tablas creadas, los archivos de `schema/` no
deben usarse como reemplazo de las migraciones: muchas tablas se crean con
`CREATE TABLE IF NOT EXISTS` y MySQL no modifica columnas existentes. Por
ejemplo, versiones anteriores de `cash_session_payment_summaries` usaban
`sales_count`; el esquema limpio ya usa `payments_count`. Para actualizar una
base existente se debe correr la migracion correspondiente antes de aplicar
constraints nuevos.

## Seeds

Los seeds no incluyen datos reales del entorno.

Incluyen:

- Plan base de suscripcion requerido por el registro inicial.
- Catalogo de permisos.
- Permisos predeterminados por rol `ADMIN` y `SELLER`.
- Catalogo base de documentos legales (`TERMS` y `PRIVACY`).

Los seeds legales no incluyen versiones ni contenido contractual real. Para
habilitar el registro de nuevos negocios se debe publicar una version vigente
para `TERMS` y otra para `PRIVACY` en `legal_document_versions`.

## Publicacion legal Cajora v1.0

La publicacion inicial del MVP de Cajora se mantiene como un evento explicito y
auditable, separado del instalador normal:

1. Ejecutar el orden base de instalacion indicado arriba.
2. Ejecutar manualmente `migrations/006_publish_cajora_legal_v1_0.sql`.

El script publica:

- `TERMS` version `1.0`, titulo `Terminos y Condiciones de Cajora`.
- `PRIVACY` version `1.0`, titulo `Politica de Privacidad de Cajora`.
- `status = PUBLISHED`.
- `requires_user_action = 0`.
- `published_at` y `effective_at` con el mismo `NOW()` de ejecucion.

Los documentos oficiales tienen fecha documental `31 de agosto de 2026`, que se
conserva dentro de `legal_document_versions.content`.

Como defensa para instalaciones limpias o seeds omitidos accidentalmente, el
script asegura el catalogo logico minimo de `legal_documents` para `TERMS` y
`PRIVACY` antes de insertar las versiones. Esta normalizacion solo afecta el
catalogo legal; no modifica versiones publicadas.

Hashes SHA-256 calculados sobre el contenido final almacenado en UTF-8:

- `TERMS 1.0`: `5430d5d3870113f25f00d98f29ba85b14e78b6591f4f0809c3214b27ed021ab4`
- `PRIVACY 1.0`: `9cd13785522dac3e837b54f1eb988e936f110ad6805dcf6063b88fcf7930f222`

Regla operativa:

- Una version publicada es inmutable.
- Cualquier cambio de texto debe publicarse como una nueva version.
- El script no actualiza silenciosamente `1.0`; si ya existe con otro hash,
  falla y hace rollback.
- `install.sql` no ejecuta esta publicacion para evitar publicar documentos
  juridicos sin una accion intencional.

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
- Se agrego el MVP legal con documentos, versiones publicables y evidencia de
  aceptacion/reconocimiento por negocio y usuario.
- Se agrego seed minimo para `TERMS` y `PRIVACY`, dejando el contenido legal
  oficial fuera de seeds hasta que se publique desde base de datos.
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
- Se agrego `sales.idempotency_key` y `purchases.idempotency_key` para evitar
  doble procesamiento por doble click, retry de red o requests duplicados.
- Se agregaron `UNIQUE(idBusiness, idempotency_key)` en `sales` y `purchases`.
  La key es multi-tenant: una key solo se considera repetida dentro del mismo
  negocio.
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
- `sale_payments` registra los pagos concretos de cada venta y reemplaza el
  uso legacy de `sales.idPaymentMethod`.
- `sale_deliveries` registra entregas y permite estados independientes de la
  venta.
- `cash_settlements` registra la rendicion de efectivo cobrado por cadetes.
- El metodo `CASH / Efectivo` se crea en el registro del negocio desde
  `procedures/auth.sql`.

## Idempotencia de ventas y compras

Los endpoints `POST /sales` y `POST /purchases` exigen el header:

```http
Idempotency-Key: <uuid>
```

Regla operativa:

- Mismo negocio + misma key: devuelve la operacion original como replay y no
  vuelve a insertar cabecera, detalles, stock, caja, movimientos ni
  notificaciones.
- Negocios distintos pueden usar la misma key sin cruzar datos.
- Si el payload cambia pero la key ya fue consumida, se devuelve la operacion
  original. La key representa el intento logico, no el contenido editable.

Para bases existentes creadas antes de esta regla, ejecutar:

1. `migrations/004_sales_purchases_idempotency.sql`
2. `procedures/sales.sql`
3. `procedures/purchases.sql`

## Correcciones no aplicadas

No se corrigieron las inconsistencias semanticas listadas arriba porque pueden
afectar reglas de negocio o procedures existentes. Conviene decidirlas en una
migracion explicita y probada.
