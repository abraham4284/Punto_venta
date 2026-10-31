# F3 — Orders Core DB/procedures/backend

Fecha: 2026-10-30. Base inspeccionada: `dev`, HEAD `fe846c3279af026a7516041dae85ccc46b5aae6b`, arbol limpio al comenzar. El master de referencia aportado no reemplazo el checkout real. No se hizo staging, commit ni push.

## Implementacion

- [Modulo Orders](../server/src/modules/businesses-app/orders/index.ts): tipos, Zod estricto, state machine/calculos, mappers, services, controllers, routes y mount BUSINESS despues de controles operativos.
- Ocho rutas: create, list, products-by-deposit, detail, full update, events, status, cancel. [Contrato completo](contracts.md).
- Tablas orders/order_details/order_events en schema 002; indices/unicidad 003; FKs tenant-safe 004; checks de totales, cantidades, entrega y motivo 005. IDs/snapshots separados de Sales, sin idSale/idOrder de conversion.
- [Procedures Orders](../server/src/db/procedures/orders.sql) participan en transacciones del service; SQL parametrizado de referencias activas y snapshots desde DB. No hay writes de stock, movements, ventas, pagos, entregas reales ni caja.
- Locks sobre cabecera para update/status/cancel antes de comprobar estado. Create/update/status/cancel confirman evento en la misma transaccion; rollback y release en fallo. GET detail lee header/items bajo lock para no mezclar revisiones.
- Idempotencia UUID por tenant, UNIQUE y recuperacion de carrera especifica sin duplicar header/details/eventos. Otras colisiones no se convierten en replay. Conexion liberada antes de recuperar el registro ganador.
- Permisos seeds: OWNER shortcut del middleware; ADMIN cinco permisos, SELLER view/create/update; DELIVERY sin grants Orders iniciales. Sin ampliar permisos ajenos.

## DB y aplicacion por operador (no ejecutada)

[003_orders_core.sql](../server/src/db/manual/003_orders_core.sql) es aditiva para baseline existente con Customers v2. Contiene los mismos bloques F3 de tablas/indices/FKs/checks y grants, sin resetear permisos ajenos ni cambiar tablas de otros dominios. Usa comprobaciones por nombre de los helpers canonicos; una base parcialmente modificada requiere revisar su estructura, no asumir que IF NOT EXISTS corrige definiciones incompatibles.

Orden previsto: backup + confirmar base seleccionada + mantenimiento, aplicar manual 003 completo, importar procedures/orders.sql completo y desplegar backend compatible. DDL puede hacer commits implicitos. No ejecutar install.sql ni seed completo sobre la base existente para esta fase. [database](database.md) y [DB README](../server/src/db/README.md).

Manifest/install agregan orders.sql y el SQL completo fue regenerado por tooling oficial. La revision estatica y builder no certifican sintaxis/ejecucion real de todos los procedures en MySQL/MariaDB.

## Validaciones ejecutadas

Desde server:

| Comando | Resultado real |
| --- | --- |
| `npm run typecheck` | Aprobado. |
| `npm run build` | Aprobado (tsc + tsc-alias). |
| `npm run db:build-baseline` | Aprobado, solo archivos. |
| `npm run db:validate-baseline` | Aprobado, solo archivos. |
| `npx vitest run --config vitest.orders-core.config.ts` | 65 tests DB-free aprobados. |

SHA-256 baseline generado/validado: `3918a584d3c12389f01c14cdeee44ffa37986e14412b5d08a53b2fee0dacf915`.

[Config aislada](../server/vitest.orders-core.config.ts) omite setup de integracion y [tests](../server/src/tests/unit/orders-core.test.ts) mockean el pool antes de importar services/controllers/permissions. No se importa la app con conexion real.

Cobertura: transiciones permitidas/invalidas, COMPLETED bloqueado, terminales/cancel/edicion, redondeo Decimal y precision, duplicados, PICKUP/DELIVERY, payload estricto, snapshots/tenant/referencias activas, rollback/release, replay temprano/carrera UNIQUE, rechazo de colisiones ajenas, cambio sobre estado ya avanzado, metricas/paginacion, stock cero/ON_ORDER, controller actor/tenant/errores seguros y requirePermission real de las ocho rutas con pool mockeado. Checks estaticos comparan bloques migracion/canonical, firmas CALL, filtros filas/metricas, mount y ausencia de writes economicos.

Incidencias corregidas: Vitest inicial no pudo importar por EPERM al renombrar temporales del sandbox; la ejecucion fuera del sandbox autorizada uso la misma config DB-free y funciono. La primera ejecucion efectiva encontro un fallo en el mock de carrera (respuesta de actor reutilizada); se corrigio y la suite completa paso. No se presenta ese error de fixture como un fallo de la DB.

## Limites y decisiones concretadas

F3 resuelve detalles no fijados en el resumen: retiro/entrega con datos propios del pedido, deliveryFee independiente, descuentos solo por linea, quote con precios manuales y montos no negativos, update completo que refresca snapshots, grants iniciales por rol y replay por clave sin comparar hash. El contrato publico esta en contracts; ownership en [transactions](../server/docs/transactions.md). No introduce una arquitectura nueva ni cambia el dominio acordado; ADR-005/006 solo actualizan estado de planned a implementado.

No ejecutados: SQL/queries/migracion real, suites de integracion ni pruebas API contra MySQL/MariaDB; tampoco QA navegador/frontend ni despliegue. Locks/rollback/carreras se probaron mediante mocks y revision estatica, no con sesiones concurrentes reales. La lectura de respuesta posterior al commit puede fallar sin revertir el cambio ya confirmado; create se recupera con la misma clave. Deadlocks/timeouts se reportan como 409 y requieren reintento.

Pendiente del operador: comprobar instalacion limpia y manual 003, constraints/FKs y CALLs reales en MySQL/MariaDB; aislamiento entre negocios, replay concurrente y rollback sin efectos parciales usando una DB de prueba autorizada. El estado completado F3 expresa implementacion + validacion permitida DB-free, no certificacion de produccion.

## Cierre de repositorio

- [x] Comprobados 259 enlaces locales en 33 Markdown y paths referenciados. Scope revisado: 34 archivos modificados/nuevos, sin client/storefront/app.ts ni codigo de conversion/reservas; sin cambios en packages/configuracion de despliegue. Archivos nuevos comprobados tambien por separado, sin staging.
- [x] `git diff --check` aprobado, `git status --short` y `git diff --stat` ejecutados. Solo avisos de normalizacion LF/CRLF. Stat de versionados: 21 archivos, 462 inserciones y 31 eliminaciones; no incluye los 13 nuevos sin seguimiento.
- [x] Roadmap/estado/contratos/DB/arquitectura sincronizados; F3 completada y F4 siguiente, sin comenzar F4. ADR-005/006 actualizan su estado sin agregar ADRs nuevos ni reescribir evidencias historicas F0/F0.1.

No hay bloqueos ni desviaciones de alcance identificados. La aplicacion SQL queda expresamente fuera de las acciones autorizadas a este agente.
