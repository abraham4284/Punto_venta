# Validacion backend

Comandos reales desde `server`, fuente [package.json](../package.json):

| Comando | Alcance / configuracion |
| --- | --- |
| `npm run typecheck` | tsc --noEmit; tipado sin ejecutar endpoints. |
| `npm run build` | tsc + tsc-alias; no demuestra comportamiento DB/API. |
| `npx vitest run --config vitest.customers-v2.config.ts` | Unit tests DB-free de Customers v2. |
| `npx vitest run --config vitest.orders-core.config.ts` | Orders Core DB-free: dominio, services/controllers/permisos y contratos SQL estaticos, sin setup de integracion. |
| `npx vitest run --config vitest.orders-integration.config.ts` | Orders HTTP/DB real, exclusivamente loopback + punto_venta_integration_test, fixtures propios y limpieza acotada. Requiere autorizacion DB explicita. |
| `npm run test:security` | Vitest sobre src/tests/security con config general. |
| `npm run test:tenant` | vitest.tenant.config.ts; aislamiento multi-tenant. |
| `npm run test:economic` | vitest.economic.config.ts; flujos economicos. |
| `npm run test:auth` | vitest.auth-permissions.config.ts; auth/permisos. |
| `npm run test:notifications` | vitest.notifications.config.ts; notificaciones. |
| `npm test` | Encadena security, tenant, economic, auth y notifications; no asume ni ejecuta solo unit tests. |

## DB-free frente a integracion

[Config Customers v2](../vitest.customers-v2.config.ts) selecciona un archivo unitario con `setupFiles: []`; [tests](../src/tests/unit/customers-v2.test.ts) mockean pool para importar services/controllers. Verifican validacion, mapper, llamadas, respuestas y estructura SQL; no ejecutan SQL real. Si se agregan imports o tests, volver a comprobar que los mocks intercepten toda conexion.

[Config general](../vitest.config.ts) y configs [tenant](../vitest.tenant.config.ts), [economic](../vitest.economic.config.ts), [auth](../vitest.auth-permissions.config.ts), [notifications](../vitest.notifications.config.ts) cargan [setup](../src/tests/setup.ts). Este configura entorno, valida nombre de DB y toca pool al cerrar; helpers/suites de integracion pueden conectar y modificar datos. No asumir que security es DB-free por su nombre ni que `_test` garantiza host local.

**`npm test` backend NO debe asumirse DB-free.** Antes de ejecutar, revisar setup, imports y efectos. No ejecutar suites conectadas, queries, SQL manual o resets sin autorizacion explicita; politica global en [AGENTS](../../AGENTS.md). Esta fase documental no requiere esas ejecuciones.

### Orders real, sin reset general

[Config Orders real](../vitest.orders-integration.config.ts) comprueba host loopback y nombre exacto antes de cargar setup. Lee credenciales de `.env.test` si existe o solo datos de conexion de `.env`; fuerza la DB de test y nunca hereda DB_NAME de desarrollo. Rechaza overrides incompatibles y usa secretos JWT exclusivos del test. Antes de fixtures verifica `SELECT DATABASE()`/servidor/version y requiere un plan activo existente, sin crear catalogos globales.

[Suite Orders](../src/tests/integration/orders/orders.integration.test.ts) reutiliza app, setup, helpers y fixtures actuales, sin mocks ni segunda arquitectura. Crea tenants/usuarios con prefijo UUID; `afterAll` elimina solo esos datos respetando FKs en una transaccion, con joins de suscripciones cuando no existe idBusiness directo. No llama `resetIntegrationTestData`, no aplica SQL estructural ni modifica grants globales. No ejecutar esta suite sobre hosting remoto o produccion; evidencia y limites en [F3 validation](../../docs/f03-orders-core-validation.md).

## Evidencia y cierre

Elegir validacion segun cambio: tipado/build, tests aislados para comportamiento nuevo y, solo cuando este autorizado, integracion/API. Validar SQL por archivos no demuestra ejecucion en ambos motores: comandos de baseline y checklist del operador en [database](../../docs/database.md). No presentar mocks, build o lint como QA de DB real/E2E.

[TESTING.md](../TESTING.md) conserva detalle operativo de suites de integracion; este documento es la entrada canonica para elegir alcance/seguridad, no repite fixtures ni instrucciones de provisionamiento. Registrar comando, resultado y limites en validation doc de fase; distinguir fallo funcional de un bloqueo de entorno (por ejemplo EPERM). Markdown solo requiere enlaces/paths y checks Git.

### F5 Order -> Sale

La config Orders DB-free tambien selecciona orders-core-conversion.test.ts, con pool y notificaciones mockeados: validacion, rollback/call order, compatibilidad Sales, permisos/replay y SQL estatico. No valida locks reales.

Suite real preparada en [order-to-sale.integration.test.ts](../src/tests/integration/orders/order-to-sale.integration.test.ts), comando `npx vitest run --config vitest.order-to-sale-integration.config.ts`. Reutiliza guardas loopback/DB exacta de Orders, setup y fixtures existentes; requiere SQL F5 aplicado y permiso explicito para DB real. No ejecutada durante F5. Limpia solo tenants/usuarios UUID propios, borra sales antes de orders por la nueva FK, sin reset ni desactivar FKs. Config Orders anterior queda acotada a su archivo original para no incorporar esta suite implicitamente. [Validacion F5](../../docs/f05-order-to-sale-backend-validation.md).

### F7 providers/cancellation

DB-free: npx vitest run --config vitest.delivery-providers.config.ts (setupFiles vacio, pool mockeado; incluye regresiones Orders/F5 y delivery-providers.test.ts). Integracion preparada: npx vitest run --config vitest.delivery-providers-integration.config.ts, hereda loopback + DB exacta de Orders y fixtures/limpieza UUID propios; no ejecutar hasta SQL F7 y autorizacion expresa. Durante F7 solo se preparo/typecheckeo esa suite; no se ejecuto. [Evidencia](../../docs/f07-delivery-providers-cancellation-validation.md).
