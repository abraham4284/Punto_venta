# Seguridad y aislamiento backend

Decision transversal: [ADR-001](../../docs/decisions.md). Transporte cookies/Bearer/CSRF y codigos HTTP: [contracts](../../docs/contracts.md). Aqui vive su aplicacion dentro del backend.

## Contexto autenticado

[requireAuth](../src/middlewares/requireAuth.ts) verifica JWT y coloca payload en `req.auth`. BUSINESS genera ademas `req.user = { idBusiness, idUser, role }`. PLATFORM usa `req.auth.platformRole` e idUser del payload, no un `req.user` BUSINESS ficticio. Tipos: [auth.types.ts](../src/types/auth.types.ts).

Las rutas `/api/platform` solo aceptan contexto PLATFORM y rechazan BUSINESS; las otras rutas autenticadas rechazan PLATFORM. [requireBusinessContext](../src/middlewares/requireBusinessContext.middleware.ts) exige contexto BUSINESS y req.user. `idBusiness` enviado por cliente nunca es autoridad; sobrescribir/rechazar entradas del body segun validacion del modulo y obtener actor desde contexto autenticado.

## Cadena y permisos

[Barrel BUSINESS](../src/modules/businesses-app/index.ts) monta primero auth, businesses, subscription, notifications y legal con controles propios. Despues instala `requireAuth -> requireBusinessContext -> requirePasswordChangeCompleted -> requireOperationalSubscription` antes de modulos operativos. No mover rutas tempranas ni presumir que reciben esta cadena.

[requireOperationalSubscription](../src/middlewares/requireOperationalSubscription.middleware.ts) carga/reutiliza suscripcion y bloquea sin canOperate; no reemplaza permisos ni tenant checks. [requirePermission](../src/middlewares/requirePermission.middleware.ts) exige BUSINESS, permite OWNER directamente y consulta permiso efectivo para otros roles (rol/overrides). Fallos de comprobacion deniegan acceso. Cada operacion sensible debe montar el permiso correspondiente.

PLATFORM usa [requirePlatformContext](../src/middlewares/requirePlatformContext.middleware.ts) y [requirePlatformRoles](../src/middlewares/requirePlatformRoles.middleware.ts) segun ruta. No conceder permisos administrativos amplios para resolver dependencias de lectura del POS; revisar endpoints de contexto y acceso SELLER/DELIVERY.

## Persistencia tenant-safe

Para entidades de negocio, aplicar `WHERE idBusiness = ?` y validar el negocio de cada referencia (cliente, producto, deposito, caja, usuario asignado). Los procedimientos reciben negocio del service autenticado, no del body como autoridad. Los joins incluyen negocio donde corresponde.

[Foreign keys](../src/db/schema/004_add_foreign_keys.sql) y [indices](../src/db/schema/003_add_indexes.sql) contienen claves compuestas como Sales -> Customers por negocio/ID; preservar ese contrato. No todas las entidades son tenant-scoped: identidades y catalogos SaaS tienen alcance propio; inspeccionar schema concreto.

Ocultar UI no es autorizacion. Los controles row-level de cadetes y permisos de vista global requieren inspeccion del flujo afectado ademas de un middleware generico. Usar pruebas de tenant/roles con el alcance permitido en [testing](testing.md); nunca concluir aislamiento total solo por encontrar un filtro en un modulo.

`app.ts` aporta Helmet, rate limiting, CORS, parsers/limites, CSRF y error handler seguro. No exponer secretos ni mover configuracion de un ambiente a otro. La politica de ejecucion DB permanece en [AGENTS global](../../AGENTS.md) y [database](../../docs/database.md).
