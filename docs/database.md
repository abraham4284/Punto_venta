# Base de datos canonica

## Fuentes y operacion

La fuente SQL vigente esta en [server/src/db](../server/src/db/README.md). El detalle de instalacion permanece alli; [BASELINE_AUDIT](../server/src/db/BASELINE_AUDIT.md) conserva auditoria historica, no sustituye el schema actual.

Este documento conserva operacion/modelo de DB a nivel sistema. Los patrones de ejecucion backend viven en [transactions](../server/docs/transactions.md) y [security-tenancy](../server/docs/security-tenancy.md); la documentacion tecnica proxima a DB permanece en su ubicacion.

| Fuente | Responsabilidad |
| --- | --- |
| [schema/002_create_tables.sql](../server/src/db/schema/002_create_tables.sql) | Tablas finales, columnas y primary keys; InnoDB, utf8mb4, utf8mb4_unicode_ci. |
| [schema/003_add_indexes.sql](../server/src/db/schema/003_add_indexes.sql) | Indices y unicidad, incluida idempotencia por tenant. |
| [schema/004_add_foreign_keys.sql](../server/src/db/schema/004_add_foreign_keys.sql) | Relaciones y FKs compuestas por negocio donde corresponda. |
| [schema/005_add_constraints.sql](../server/src/db/schema/005_add_constraints.sql) | CHECKs de dominio. |
| [procedures](../server/src/db/procedures) | Logica SQL actual, incluido catalogo publico. |
| [seeds](../server/src/db/seeds) / [publications](../server/src/db/publications) | Planes, permisos y catalogo legal / publicaciones oficiales versionadas. |
| [manual](../server/src/db/manual) | Cambios revisados para bases existentes; no forman parte de la instalacion limpia. |
| [generated/cajora_v1_0_full.sql](../server/src/db/generated/cajora_v1_0_full.sql) | Baseline completo generado, importable sin SOURCE; no editar a mano. |
| [tools](../server/src/db/tools) | Builder/validator de archivos y herramientas de DB local. |

[install.sql](../server/src/db/install.sql) y [db-baseline.manifest.mjs](../server/src/db/tools/db-baseline.manifest.mjs) fijan el orden: schema 002..005 -> seeds -> procedures -> publications. El instalador requiere base vacia previamente seleccionada; no crea, selecciona ni elimina una DB. No reproducirlo sobre una instalacion existente.

Desde `server`:

```sh
npm run db:build-baseline
npm run db:validate-baseline
```

Son operaciones de archivos. El builder regenera el SQL completo; el validator compara generado/manifest/instalador y consistencia estatica. Un resultado aprobado no demuestra ejecucion ni compatibilidad efectiva de cada sentencia en MySQL/MariaDB. Usar el [checklist manual](../server/src/db/MANUAL_BASELINE_TEST.md) con un operador autorizado para pruebas reales.

## Cambios y restricciones

Para instalaciones nuevas, actualizar schema/procedures/seeds segun corresponda y regenerar baseline por tooling. Si cambian archivos de entrada, mantener manifest e instalador alineados. Para bases existentes, preparar ademas migracion aditiva/manual revisada; no reemplazarla con el instalador limpio ni recrear carpetas historicas `fixed`/`tables`.

Actualmente existen manual/001, manual/002, [manual/003_orders_core.sql](../server/src/db/manual/003_orders_core.sql) [manual/004_order_to_sale.sql](../server/src/db/manual/004_order_to_sale.sql) y [manual/005_delivery_providers.sql](../server/src/db/manual/005_delivery_providers.sql). Orders 003 es aditiva para un baseline existente compatible con Customers v2: crea tablas/indices/FKs/checks Orders y agrega sus permisos sin resetear grants ajenos. Luego importar [procedures/orders.sql](../server/src/db/procedures/orders.sql) completo antes de desplegar backend. Backup, DB seleccionada y revision del operador obligatorios; no ejecutar install ni el seed completo para esta actualizacion. No se aplico SQL real durante F3.

Actualizacion posterior a la entrega inicial: el operador confirma SQL F3 aplicado/sincronizado en local, test y produccion. La [validacion real F3](f03-orders-core-validation.md) comprobo HTTP/procedures en MySQL 8.0.33 test local; el agente no ejecuto migraciones ni consulto produccion. No equivale a validar MariaDB/hosting remoto ni a reinstalar el baseline.

Toda aplicacion SQL real requiere autorizacion del operador, backup, confirmacion de base/ambiente y ventana de mantenimiento cuando corresponda. DDL puede hacer commits implicitos; no prometer rollback integral. No deshabilitar FKs/safe updates para sortear errores. Respetar DELIMITER al importar archivos completos, tambien en DROP PROCEDURE. No ejecutar automaticamente SQL, migraciones ni `db:local:create/reset`. Ver [AGENTS](../AGENTS.md).

## Modelo resumido actual

| Area | Entidades |
| --- | --- |
| Identidad y SaaS | businesses, users, business_users, platform_users, permissions, role_permissions, business_user_permissions, user_sessions, subscription_plans, business_subscriptions, subscription_events, subscription_payments, legal_documents, legal_document_versions, legal_acceptances |
| Maestros | customers, suppliers, product_categories, products, product_images, deposits, payment_methods |
| Inventario | stock, stock_movements |
| Compras | purchases, purchase_details |
| Pedidos internos | orders, order_details, order_events; referencia inversa via sales.idOrder |
| Ventas y entregas | sales, sale_details, sale_payments, sale_payment_events, sale_deliveries, delivery_events |
| Caja | cash_registers, cash_sessions, cash_movements, cash_settlements, cash_session_payment_summaries |
| Notificaciones y auditoria | notifications, notification_recipients, platform_audit_logs; eventos de pagos, entregas y suscripciones en sus propias tablas |

Orders guarda snapshots de cliente/productos; alta/edicion/preparacion no reservan ni descuentan stock. La conversion F5 crea Sales y sus efectos atomicos con un vinculo unico. `idBusiness` delimita las entidades del negocio; existen catalogos/identidades de plataforma globales. Stock es por negocio/producto/deposito. `purchase_details` posee `idDeposit`; no la cabecera de compra. `payment_methods` es unico por `(idBusiness, name)`, permite repetir code. Cantidades y montos usan DECIMAL segun schema; revisar precision concreta antes de ampliar contratos.

## Customers v2 y despliegue

Schema: `first_name`/`last_name` NOT NULL, documento opcional como par, UNIQUE `(idBusiness, document_type, document_number)` y CHECK del par. `uk_customer_business_id` mantiene la relacion tenant-safe con Sales. `fullName` es derivado; Customers no tiene columna `name`.

La [guia especifica Customers v2](../server/src/db/CUSTOMERS_V2.md) contiene el orden exacto: estructura manual 002, luego customers, sales, tickets, cash_settlements, dashboard y platform_businesses procedures, seguido de backend/frontend compatibles. La guia fue redactada en la fase backend y su advertencia de frontend es historica: el frontend compatible ya existe; no prueba que este desplegado.

La llamada actual `CALL sp_migrate_customers_v2(1)` SOLO sirve para datos descartables: conserva IDs/relaciones, usa nombre legacy recortado y apellido temporal `Sin apellido`. Puede perder caracteres; no reconstruye identidades reales. Con argumento 0 bloquea filas legacy antes de ALTER. No se aplico en F0; para clientes reales el operador debe preparar una migracion revisada.

## Ambientes

El contexto operativo aportado indica backend/frontend separados en Render, DB alojada MariaDB/Hostinger y desarrollo MySQL local. F0 no certifica configuracion ni despliegues activos. No inferir que una conexion es local por ejecutar localmente la app.

Para el frontend estatico, la referencia operativa es raiz `client`, build `npm ci && npm run build`, salida `dist` y rewrite SPA `/* -> /index.html`. `VITE_BACKEND_URL` se incorpora en build. Verificar destino por ambiente, CORS, cookies y configuracion de produccion antes de desplegar; no copiar secretos entre QA y produccion.

## F5 — Vinculo y entrega en Sales

`sales.idOrder INT NULL`, UNIQUE `(idBusiness,idOrder)` y FK a orders por las mismas columnas: POS usa NULL y un Order tiene como maximo una Sale, aun cancelada. No existe orders.idSale. `sales.delivery_fee DECIMAL(18,2) NOT NULL DEFAULT 0.00`; checks no negativo y total = subtotal - discount_total + delivery_fee. El baseline anterior no tenia un CHECK de total Sales que hubiera que eliminar.

Orden de despliegue F5 (aplicado segun operador, no ejecutado por el agente): revisar backup, ambiente y totales existentes; detener escrituras; aplicar [manual/004_order_to_sale.sql](../server/src/db/manual/004_order_to_sale.sql), luego importar completos [sales.sql](../server/src/db/procedures/sales.sql) y [orders.sql](../server/src/db/procedures/orders.sql), y desplegar backend compatible antes de reanudar escrituras. sp_create_sale pasa de 11 a 13 parametros; requiere coordinar procedures/backend, incluido POS directo. La migracion agrega permiso orders.convert y grant ADMIN sin resetear otros grants. DDL no es atomico; si falla un check, revisar datos con el operador, no corregirlos silenciosamente. No aplicar baseline/seed completos sobre una DB existente.

Sin nuevos archivos de procedures, manifest/install conservan su orden. Baseline regenerado con tooling oficial. F4.1 orders.sql aplicado/probado en local/test/produccion segun operador; no es verificacion del agente ni incluye SQL F5. [Validacion F5](f05-order-to-sale-backend-validation.md) registra el gate real F5 11/11 ejecutado al iniciar F6, sin verificar produccion.

## F7 — Proveedor logistico

sale_deliveries agrega provider_type ENUM(INTERNAL,THIRD_PARTY) nullable, external_provider_name(120), external_reference(150), external_contact_name(160), external_contact_phone(80) y external_cost DECIMAL(18,2) nullable. CHECK exige combinaciones no ambiguas y costo no negativo. Se conserva la FK existente assigned_to_user_id -> users.idUser; esa FK sola no comprueba pertenencia al negocio. El helper SQL exige business_users activo del mismo idBusiness, rol DELIVERY y usuario activo antes de asignar. No se agregan indices/FKs ni otro archivo de procedures; schema 003/004 y manifest/install conservan su estructura. Schema 002/005, procedures y baseline reflejan el modelo nuevo.

[005_delivery_providers.sql](../server/src/db/manual/005_delivery_providers.sql) es la numeracion libre siguiente. Backfill user no-null -> INTERNAL; sin user queda NULL y no se asume tercero. Conserva estados historicos (no convierte registros antiguos ni inventa proveedor); los checks son de combinacion de campos, sin imponer PENDING retroactivamente a toda fila sin usuario. La migracion es retomable por presencia de columnas/constraint, no una reparacion de objetos preexistentes modificados manualmente.

Pendiente del operador: backup/DB confirmada, parar escrituras, aplicar 005 y luego importar completos procedures/deliveries.sql, procedures/sale_payments.sql y procedures/sales.sql antes de backend/client compatibles. sp_delivery_create: 10 -> 16 parametros; sp_delivery_assign: 4 -> 10. No correr baseline/install/seed completos sobre DB existente. DDL tiene commits implicitos; revisar datos antes de aplicar, no relajar constraints ni desactivar FKs. El agente no aplica SQL ni ejecuta DB real F7. Suite test preparada para despues: [evidencias](f07-delivery-providers-cancellation-validation.md).
