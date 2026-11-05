# F10.1 — Wholesale Pricing Core: evidencia

Fecha: 2026-11-05. Rama inspeccionada dev; HEAD inicial 8725aaf3ff42e2d11b435dd93c0bce8cab1078e8 (rediseño SalePrintDocument). Checkout limpio al iniciar. Implementacion y validacion DB-free aprobadas; cierre operativo pendiente de aplicar SQL/gate real autorizado. Sin fallas funcionales conocidas en los checks ejecutados; no se certifican engine SQL, locks reales ni produccion.

## Alcance y decisiones

DB canonica/manual + backend Businesses/Customers/Sales + API publica de catalogo + tests/documentacion. Sin tablas nuevas, framework/ORM/dependencias nuevas, frontend Cajora/VITRUNO, Orders, Returns, checkout, WhatsApp, login publico, reglas por categoria ni promociones.

Politica global por negocio false/null inicial; minimo positivo al habilitar. WHOLESALE exige Customer activo del tenant y productos activos con precio mayorista positivo. Compara unitPrice con DB, sin fallback; calcula candidato Decimal a precio mayorista, por linea half-up a dos decimales, antes de descuentos/envio. RETAIL debe alcanzar el minimo; Customer WHOLESALE no lo repite. Cantidades respetan dos decimales y UNIT entero. Venta valida promueve y asigna fecha en su misma transaccion; fallos posteriores revierten cabecera/tier/fecha. Cancelacion/refund nunca degradan. [ADR-011](decisions.md).

Analisis de precios previos: Sales schema/procedure aceptan unitPrice explicito sin un contrato separado de overrides; la UI useSales calcula desde precio seleccionado, CartTable muestra ese unitPrice, y Orders permite presupuestos manuales. Se conserva todo ese flujo RETAIL/manual y descuentos existentes. WHOLESALE nuevo requiere precio catalogo DB, sin override silencioso. UI actual no envia pricingType: sigue RETAIL hasta integracion posterior, aunque el selector visual diga WHOLESALE. No se reinterpretan requests ni historia por coincidencia de importes.

Customers expone tier/fecha en sus lecturas/respuestas mediante procedures/mappers. Se decide dejar promocion automatica por Sale, sin edicion manual de tier/fecha: schemas estrictos los rechazan. Business settings reutiliza PATCH /businesses/me y business.update, sin permisos nuevos; politica se envia como par enabled/minimum para cambios atomicos. Patches antiguos conservan politica. Tenant/actor autenticados, queries/locks/updates por negocio.

## DB y despliegue

| Tabla | Cambio exacto |
| --- | --- |
| businesses | wholesale_enabled TINYINT(1) NOT NULL DEFAULT 0; wholesale_minimum_amount DECIMAL(18,2) NULL |
| customers | pricing_tier ENUM('RETAIL','WHOLESALE') NOT NULL DEFAULT 'RETAIL'; wholesale_since DATETIME NULL |
| sales | pricing_type ENUM('RETAIL','WHOLESALE') NULL; sin backfill historico |

CHECKs en schema/005: enabled 0/1, minimo null o positivo y no null si enabled; tier/fecha consistentes; Sale WHOLESALE con Customer. Schema/002 contiene columnas; no se modifican 003/004 ni manifest/install. Manual [007](../server/src/db/manual/007_wholesale_pricing.sql) verificado como siguiente numero libre, aditivo/retomable por existencia, sin reset ni datos historicos inferidos. No repara objetos discrepantes; DDL no garantiza rollback integral.

Procedures modificados (archivos completos para reimportar):

- [businesses.sql](../server/src/db/procedures/businesses.sql): get/update leen politica; sp_update_business 6 -> 8 parametros y conserva campos omitidos.
- [customers.sql](../server/src/db/procedures/customers.sql): get por ID/lista incluyen pricing_tier/wholesale_since; create/update/status devuelven el get actual. Firmas iguales, default RETAIL en DB.
- [sales.sql](../server/src/db/procedures/sales.sql): sp_create_sale mantiene 13 parametros, inserta RETAIL, bloquea Customer del tenant antes de INSERT/FK; get lista/detalle proyectan pricing_type y lo incluyen en GROUP BY. Cancelacion conserva historial y delega lectura actual.
- [storefront_catalog.sql](../server/src/db/procedures/storefront_catalog.sql): politica real del negocio por slug y precios mayoristas en lista/detalle. Sin costos privados.

Orden operativo: backup y confirmar host/DB/ambiente, detener escrituras, aplicar manual 007 sobre DB compatible con 001..006, reimportar los cuatro archivos completos y desplegar backend F10.1 antes de reanudar. No ejecutar install/baseline/seed sobre datos existentes. Detalle en [database](database.md) y [README DB](../server/src/db/README.md).

Configuracion VITRUNO no aplicada. Defaults siguen false/null para todos. Puede configurarse con business.update (true/50000) en su tenant, o revisar el [SQL operativo separado](../server/src/db/manual/configure_wholesale_business.example.sql), con slug NULL y ROLLBACK por defecto. No forma parte del baseline/migracion ni activa otros negocios.

Baseline regenerado exclusivamente con npm run db:build-baseline. Validator oficial aprobado. SHA-256: 707f8b40dc286f3823833d8c72201062475d1b5e99a8fc41cc732e2be5741b04. Es evidencia de archivos, no ejecucion SQL.

## Transaccion, idempotencia y concurrencia

Service conserva begin/commit/rollback/release existentes; helper no posee transaccion. La cabecera hace replay antes de nuevas validaciones y bloquea caja -> Customer antes del INSERT para no adquirir dos locks FK compartidos y luego intentar promover desde cajas diferentes. Para cabecera nueva WHOLESALE, helper revalida Customer bajo FOR UPDATE, politica bajo lock compartido y productos por ID bajo FOR UPDATE, todos en misma conexion; actualiza Sale y promueve Customer solo si RETAIL, antes de detalles/stock/pagos/delivery.

Replays omiten helper/precios/promocion y preservan fecha; no se agrega hash de body a Sales ni se modifica su contrato previo. UNIQUE tenant/key resuelve carreras con rollback y recuperacion existente. Deadlock/timeout create responde 409 SALE_CONCURRENT_CHANGE para reintento misma key. Errores de dominio mayorista tienen codigo 400; SQL inesperado create retorna 500 seguro. [Contratos](contracts.md), [ownership](../server/docs/transactions.md).

## Contratos HTTP/publicos

Business agrega wholesaleEnabled/wholesaleMinimumAmount. Customer agrega pricingTier/wholesaleSince. Sales create agrega pricingType opcional RETAIL/WHOLESALE (default RETAIL); lecturas agregan valor nullable historico. No acepta SALE del enum visual ni nuevo idOrder en HTTP directo. No se agregan campos a Orders; conversion sigue como presupuesto manual RETAIL.

GET /api/public/catalog agrega data.pricing desde PUBLIC_CATALOG_BUSINESS_SLUG. Lista/detalle productos agregan priceSale/priceWholesale y conservan price como alias minorista. Proyeccion/mappers publicos excluyen priceCost, lastPurchaseCost, margenes y externalCost, aun si una row contuviera esos campos; no se reutilizan mappers administrativos. Sin endpoint publico de ventas o Customers.

## Validaciones ejecutadas

Desde server:

| Comando | Resultado y limite |
| --- | --- |
| npm run typecheck | PASS, incluye fuente y suite real preparada; no ejecuta DB. |
| npm run build | PASS, tsc + tsc-alias. |
| node node_modules/vitest/vitest.mjs run --config vitest.wholesale-pricing.config.ts | PASS 280/280, 8 archivos; 52 nuevos y 228 regresiones (Orders/F5/F7/F8, Customers y catalog mapper). setupFiles vacio, pool/notificaciones/config publica mockeados. |
| npm run db:build-baseline | PASS, regenerado oficial. |
| npm run db:validate-baseline | PASS con hash indicado. |

Primer intento Vitest dentro del sandbox fallo EPERM al renombrar cache temporal; se corrigieron dos fixtures iniciales de test y una llave de sintaxis, y se ejecuto fuera del sandbox sin DB. Corrida final completa aprobada despues del refuerzo de lock SQL. Backend no tiene script/dependencia/config ESLint, por lo que no se informa lint acotado como ejecutado ni se instalan herramientas.

Revision documental/alcance: PASS 231 enlaces Markdown locales y 58 imports locales/alias; 36 archivos inventariados, whitespace incluido en archivos nuevos, mismo numero de tablas y ningun cambio en client/Orders/Returns. git diff --check aprobado; git status --short, git diff --stat y rama dev verificados. El stat de Git muestra 28 archivos tracked; los ocho nuevos estan incluidos en el inventario de esta evidencia y en la revision de alcance.

Cobertura nueva: Customer tiers/fecha, rechazo de escritura tier/fecha, validacion/defaults de politica y llamada settings tenant-safe, RETAIL/anonymous/manual, minimo menor/exacto/mayor/configurable, Customer WHOLESALE debajo del minimo, disabled/null policy, producto sin precio/ajeno/inactivo, unitPrice manipulado, tenant Customer/inactividad, cantidades/precision Decimal, descuentos/envio, historial NULL/RETAIL/WHOLESALE, replay, locks/ownership/rollback ante fallos, errores seguros y proyeccion publica del tenant sin campos privados. Regresiones previas mantienen Orders/conversion, Delivery y Returns.

## Gate real preparado, NO ejecutado

[Config](../server/vitest.wholesale-pricing-integration.config.ts) y [suite HTTP/DB](../server/src/tests/integration/wholesale-pricing/wholesale-pricing.integration.test.ts): 19 casos. Comando para operador autorizado, despues de aplicar SQL: `npx vitest run --config vitest.wholesale-pricing-integration.config.ts` desde server. Esta entrega no lo ejecuta ni solicita implicitamente autorizacion.

Hereda guards Orders: host loopback, DB exacta punto_venta_integration_test, NODE_ENV=test, secretos de test. Preflight confirma DB real, columnas F10.1, firma businesses y plan activo previo. Fixtures propios UUID; afterAll elimina solo tenants/usuarios de esa corrida en orden FK dentro de transaccion, sin reset, TRUNCATE ni deshabilitar FKs. No crea plan global si falta: preflight bloquea.

Casos: negocio deshabilitado/defaults, RETAIL anonimo/manual, WHOLESALE sin cliente, candidato 49999 vs minorista 75000, exacto 50000 con promocion/fecha/historial, mayor al minimo, cliente WHOLESALE 10000 preservando fecha, precio faltante, precio manipulado, historia NULL lista/detalle, replay, cancelacion, devolucion total, aislamiento/spoof de tenant, cliente inactivo, rollback tras stock insuficiente, carrera dos cajas distintas, carrera misma key, proyeccion SQL publica por slug sin costos.

Resultado DB real: NO EJECUTADO. No se afirma que los 19 casos pasaron ni que los CHECKs/locks se probaron en MySQL/MariaDB. SQL real ejecutado: ninguno. Migracion, configuracion VITRUNO y despliegue quedan pendientes del operador. Produccion no consultada, migrada ni probada.

## Estado de entrega

Implementacion sin fallas conocidas en validaciones ejecutadas; cierre operativo F10.1 pendiente del gate autorizado. Riesgos: coordinar firma sp_update_business y backend; compatibilidad efectiva MySQL/MariaDB requiere gate; UI actual no integra campo nuevo; clasificacion comercial no es historial fiscal. No hubo cambios frontend/client/text.txt, Orders, Returns ni repositorio VITRUNO. No hubo Git writes: sin add/commit/push/cambio de rama. Se actualizaron tasks/state/contracts/database, ADR-011 y documentacion backend/DB.

Commit sugerido: `feat(pricing): agregar core mayorista y contrato publico del catalogo`.

Descripcion: agregar politica mayorista por negocio, tier persistente Customers y pricingType historico Sales con validacion/promocion atomica; exponer precios/politica publicos sin costos y conservar contratos RETAIL. Incluir manual 007, baseline, pruebas DB-free/suite real preparada y documentacion de despliegue. Sin frontend ni ejecucion SQL.

## Archivos modificados/creados

- [docs/contracts.md](../docs/contracts.md)
- [docs/database.md](../docs/database.md)
- [docs/decisions.md](../docs/decisions.md)
- [docs/f10-1-wholesale-pricing-core-validation.md](../docs/f10-1-wholesale-pricing-core-validation.md)
- [docs/project-state.md](../docs/project-state.md)
- [docs/tasks.md](../docs/tasks.md)
- [server/docs/testing.md](../server/docs/testing.md)
- [server/docs/transactions.md](../server/docs/transactions.md)
- [server/src/db/README.md](../server/src/db/README.md)
- [server/src/db/generated/cajora_v1_0_full.sql](../server/src/db/generated/cajora_v1_0_full.sql)
- [server/src/db/manual/007_wholesale_pricing.sql](../server/src/db/manual/007_wholesale_pricing.sql)
- [server/src/db/manual/configure_wholesale_business.example.sql](../server/src/db/manual/configure_wholesale_business.example.sql)
- [server/src/db/procedures/businesses.sql](../server/src/db/procedures/businesses.sql)
- [server/src/db/procedures/customers.sql](../server/src/db/procedures/customers.sql)
- [server/src/db/procedures/sales.sql](../server/src/db/procedures/sales.sql)
- [server/src/db/procedures/storefront_catalog.sql](../server/src/db/procedures/storefront_catalog.sql)
- [server/src/db/schema/002_create_tables.sql](../server/src/db/schema/002_create_tables.sql)
- [server/src/db/schema/005_add_constraints.sql](../server/src/db/schema/005_add_constraints.sql)
- [server/src/modules/businesses-app/businesses/services/business.service.ts](../server/src/modules/businesses-app/businesses/services/business.service.ts)
- [server/src/modules/businesses-app/businesses/types/business.types.ts](../server/src/modules/businesses-app/businesses/types/business.types.ts)
- [server/src/modules/businesses-app/businesses/validations/business.validations.ts](../server/src/modules/businesses-app/businesses/validations/business.validations.ts)
- [server/src/modules/businesses-app/customers/helpers/customer.mapper.ts](../server/src/modules/businesses-app/customers/helpers/customer.mapper.ts)
- [server/src/modules/businesses-app/customers/types/index.ts](../server/src/modules/businesses-app/customers/types/index.ts)
- [server/src/modules/businesses-app/sales/controllers/sales.controller.ts](../server/src/modules/businesses-app/sales/controllers/sales.controller.ts)
- [server/src/modules/businesses-app/sales/helpers/sale.mapper.ts](../server/src/modules/businesses-app/sales/helpers/sale.mapper.ts)
- [server/src/modules/businesses-app/sales/helpers/wholesale-pricing.helper.ts](../server/src/modules/businesses-app/sales/helpers/wholesale-pricing.helper.ts)
- [server/src/modules/businesses-app/sales/services/sales.service.ts](../server/src/modules/businesses-app/sales/services/sales.service.ts)
- [server/src/modules/businesses-app/sales/types/index.ts](../server/src/modules/businesses-app/sales/types/index.ts)
- [server/src/modules/businesses-app/sales/validations/sales.validations.ts](../server/src/modules/businesses-app/sales/validations/sales.validations.ts)
- [server/src/modules/storefront-app/catalog/helpers/catalog.mapper.ts](../server/src/modules/storefront-app/catalog/helpers/catalog.mapper.ts)
- [server/src/modules/storefront-app/catalog/types/catalog.types.ts](../server/src/modules/storefront-app/catalog/types/catalog.types.ts)
- [server/src/tests/integration/wholesale-pricing/wholesale-pricing.integration.test.ts](../server/src/tests/integration/wholesale-pricing/wholesale-pricing.integration.test.ts)
- [server/src/tests/unit/customers-v2.test.ts](../server/src/tests/unit/customers-v2.test.ts)
- [server/src/tests/unit/wholesale-pricing.test.ts](../server/src/tests/unit/wholesale-pricing.test.ts)
- [server/vitest.wholesale-pricing-integration.config.ts](../server/vitest.wholesale-pricing-integration.config.ts)
- [server/vitest.wholesale-pricing.config.ts](../server/vitest.wholesale-pricing.config.ts)

## Gate real F10.1 al iniciar F10.2 — 2026-11-05

Actualiza el estado previo de esta evidencia: F10.1 CLOSED al alcance local/test. El prompt F10.2 confirma SQL local/test sincronizado por el operador y autoriza explicitamente este gate antes de modificar frontend. No se volvio a pedir confirmacion ni se ejecutaron migraciones/DDL/manual 007. No hay confirmacion ni prueba de produccion.

Se revisaron config, setup, preflight, fixtures y cleanup de la suite existente. Comando ejecutado desde server: `node node_modules/vitest/vitest.mjs run --config vitest.wholesale-pricing-integration.config.ts`. Primer intento sandbox fallo EPERM al renombrar cache; reejecucion autorizada fuera del sandbox, conservando guards de host loopback y DB exacta punto_venta_integration_test, NODE_ENV=test. Resultado: 1 archivo aprobado, **19/19 tests PASS**, duracion informada 8.08 s; hooks/afterAll aprobados, limpieza restringida a tenants/usuarios UUID comprobada por asserts, sin reset ni desactivar FKs. No se requirieron correcciones backend/SQL.

La suite ejecuto SQL real de fixtures, operaciones HTTP/economicas y cleanup en test. No se ejecuto SQL estructural ni se consulto/modifico produccion o configuracion real de VITRUNO. Los apartados anteriores conservan el estado de la entrega original F10.1; esta seccion prevalece para su gate actual. [F10.2 frontend y limites](f10-2-wholesale-pricing-admin-frontend-validation.md).
