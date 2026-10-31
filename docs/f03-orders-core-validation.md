# F3 — Orders Core DB/procedures/backend

Este documento conserva la evidencia inicial DB-free y agrega al final la validacion real posterior. Las restricciones/resultados de la entrega inicial no describen el estado actualizado de la ultima seccion.

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

## Validacion real posterior — 2026-10-30

Base inspeccionada: `dev`, HEAD `6a381750eef240e9f36f403683b90e5723abd2d0`, limpio al comenzar. El prompt de esta tarea autoriza exclusivamente la DB test local; el operador confirma tablas/procedures/constraints/indices/FKs/permisos F3 sincronizados en local, test y produccion. Esa confirmacion es del operador, no resultado de consultas a produccion.

### Destino y seguridad comprobados

- `.env.test` no existe. `.env` apunta a desarrollo: su DB_NAME no se uso. Se reutilizaron credenciales locales sin mostrarlas y se selecciono explicitamente `localhost:3306 / punto_venta_integration_test`.
- Preflight de solo lectura confirmo `DATABASE() = punto_venta_integration_test`, servidor `DESKTOP-M4JH3TC`, MySQL `8.0.33`; tres tablas Orders, diez procedures `sp_order_*` y grants ADMIN/SELLER esperados. El primer intento de red en sandbox dio EACCES; la ejecucion autorizada fuera del sandbox funciono con el mismo destino restringido.
- [Config nueva](../server/vitest.orders-integration.config.ts) rechaza hosts remotos/nombres incompatibles antes de imports de app/DB. Reutiliza setup existente, secretos JWT de test y rate limits desactivados para la suite.
- [Suite real](../server/src/tests/integration/orders/orders.integration.test.ts) reutiliza fixtures/helpers/app Express/Supertest; no mockea DB. No usa resetIntegrationTestData, TRUNCATE, desactivacion de FKs ni limpieza general. Elimina exclusivamente datos de sus tenants/usuarios con prefijo UUID y comprueba su desaparicion.

### Resultados HTTP/DB — 11 pruebas aprobadas

| Escenario | Evidencia comprobada |
| --- | --- |
| PICKUP, detail, events | PENDING, snapshot cliente/producto desde DB, una linea, un CREATED con actor correcto, delivery null/fee 0; lectura de detalle igual a creacion. |
| Replay secuencial | HTTP 200/replay true, mismo idOrder, un order/linea/evento; creacion original 201. |
| Edicion PENDING y CONFIRMED | Reemplazo de producto, cliente/deposito, observacion y metodo esperado; snapshot actualizado; estado conservado y UPDATED por edicion. |
| State machine | PENDING -> CONFIRMED -> PREPARING -> READY con eventos; PUT PREPARING 409 ORDER_NOT_EDITABLE y ninguna mutacion; COMPLETED 400 sin mutacion; historia ordenada por ID/fecha y actor. |
| DELIVERY/cancelacion | Persistencia de destinatario, telefono, direccion, referencia y fee 7.50; total 45.50. Motivo y evento CANCELLED persistidos; recancelacion 409. PICKUP con entrega/costo 400 sin crear filas. |
| Listado/filtros | Paginacion limit=1, count/metrics del conjunto filtrado completo comparados con SQL; busqueda por numero/cliente/tipo sin fuga de tenant. |
| Products-by-deposit | STOCK cantidad 10, STOCK 0, ON_ORDER 0 y productos sin fila stock en otro deposito; crear ON_ORDER sin stock funciona. |
| Tenant A/B | A recibe 404 al leer/editar/cambiar estado/cancelar/ver eventos de B; referencias customer/deposit/product/payment method de B rechazadas 400. Catalogo por deposito ajeno rechazado; B conserva header/eventos intactos. |
| Roles y actores | OWNER opera flujo; SELLER crea/lee/edita pero status/cancel devuelven 403; ADMIN avanza/cancela; DELIVERY sin lectura/create. User y business_user inactivos no pueden crear aun con cookie previa. Grants no modificados. |
| Dos creates concurrentes | Misma key con Promise.all: respuestas 201/200, mismo idOrder, flags false/true, un header, un conjunto de details y un CREATED. |
| Stock/economia | Todas las filas stock de los dos tenants identicas antes/despues (incluidos timestamps); conteos globales de seis tablas iguales, ver tabla siguiente. |

| Tabla | Antes | Despues |
| --- | --- | --- |
| stock_movements | 0 | 0 |
| sales | 0 | 0 |
| sale_details | 0 | 0 |
| sale_payments | 0 | 0 |
| sale_deliveries | 0 | 0 |
| cash_movements | 0 | 0 |

Ejecucion completa aprobada: fixture tag `ordtest_5bbc186e1101`; afterAll retiro dos negocios y siete usuarios propios, con FKs activas y verificacion de ausencia de residuos por prefijo.

### Incidencia de la suite y correccion

La primera ejecucion paso los once escenarios funcionales pero fallo en afterAll: subscription_events/subscription_payments no tienen idBusiness directo. La transaccion de limpieza se revirtio. Se corrigio solo la limpieza para unir esas tablas con business_subscriptions y filtrar los IDs propios. Se limpiaron expresamente los fixtures del intento `ordtest_b41cadcfd910` (dos negocios/siete usuarios) en la misma DB test, sin desactivar FKs, antes de repetir la suite completa con exito.

No se encontraron bugs funcionales de Orders en los escenarios probados. No se modificaron services/controllers/procedures/schema, reparto de permisos ni contratos de dominio.

### Comandos ejecutados en esta validacion

- `npx vitest run --config vitest.orders-integration.config.ts --reporter=verbose`: 11/11 tests y limpieza aprobados; ejecucion fuera del sandbox por restricciones de acceso local.
- `npm run typecheck`: aprobado.
- `npm run build`: aprobado.
- `npm run db:validate-baseline`: aprobado, SHA-256 sin cambios `3918a584d3c12389f01c14cdeee44ffa37986e14412b5d08a53b2fee0dacf915`.
- La suite DB-free conserva los 65 resultados de la entrega inicial; no se repitio porque no cambio codigo funcional.

### Alcance final

SQL aplicado en local/test/produccion por confirmacion del operador; validacion directa HTTP/DB solo en MySQL test local. Produccion no fue consultada, modificada ni sometida a smoke test destructivo. No se ejecutaron migraciones, reinstalaciones, suites generales con reset ni pruebas de MariaDB remoto. No se implementaron F4/F5/F6, conversion, reservas o VITRUNO. F4 sigue NEXT. Sin bloqueos ni desviaciones de alcance; correccion limitada al harness de test.

Comprobaciones finales: 265 enlaces locales comprobados; scope de siete archivos (dos nuevos de testing y cinco documentos), sin codigo funcional/SQL/client modificado. `git diff --check` aprobado; `git status --short` y `git diff --stat` revisados, incluyendo archivos nuevos por separado. Verificacion SQL final de solo lectura: ambos tags de ejecucion tienen cero negocios/usuarios residuales y `@@foreign_key_checks = 1` en la misma DB test. No se hizo staging, commit ni push.
