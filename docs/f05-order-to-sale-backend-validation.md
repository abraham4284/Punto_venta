# F5 — Order -> Sale backend

Fecha: 2026-10-31. Rama inicial/final dev, checkout limpio al comenzar. HEAD inspeccionado `cc0c41b747685c6ac4ba627a1e7c5f3c82d3e578` (F4.1), distinto del master historico del prompt. Sin cambio de rama, staging, commit ni push. Solo backend, SQL y docs; client/** intacto.

## Implementado

- POST `/api/orders/:id/convert-to-sale`, BUSINESS operativo, orders.convert **y** sales.create. OWNER usa shortcut existente; ADMIN recibe convert por seed/migracion aditivos; SELLER y DELIVERY no. UUID Idempotency-Key obligatorio. Envelope Orders con data.order/data.sale e idempotentReplay; 201 nuevo / 200 replay.
- [Servicio de conversion](../server/src/modules/businesses-app/orders/services/order-conversion.service.ts): una PoolConnection/transaccion para lock Order, validar actor/tenant/estado/vinculo/clave, crear venta/detalles, descontar stock y movimientos, crear pagos/eventos, delivery/eventos si corresponde, completar Order y STATUS_CHANGED READY -> COMPLETED. Cualquier error previo al commit hace rollback. No se llama createSaleService seguido de un PATCH independiente.
- [Helper Sales](../server/src/modules/businesses-app/sales/services/sales.service.ts) createSaleWithinTransaction reutiliza la logica existente con la conexion recibida; no begin/commit/rollback/release ni notificaciones internas. createSaleService sigue siendo owner de la creacion directa. Se retiraron handlers ROLLBACK de los dos procedures de creacion Sales; caller controla rollback. Cancelacion Sales conserva su transaccion propia.
- Solo READY convierte. COMPLETED con Sale vinculada es replay, incluso Sale CANCELLED y key distinta libre. Key de POS/otro Order devuelve conflicto, incluyendo UUID con otra capitalizacion. READY con Sale o COMPLETED sin Sale: conflicto, sin reparacion. Row lock + UNIQUE tenant/order + UNIQUE tenant/key protegen contra duplicacion. Las pruebas mockeadas verifican protocolo/restricciones, no prueban concurrencia del motor.
- [Body estricto](../server/src/modules/businesses-app/orders/validations/order-conversion.validations.ts): caja y pagos reales, mas metadata opcional de entrega. Cliente/deposito/items/importes y destinatario salen del Order bloqueado; expectedPaymentMethodId no crea pagos. Sales valida payload derivado: 1..5 pagos positivos cuya suma coincide con total; PICKUP sin PENDING ni entrega; DELIVERY admite PENDING. Caja OPEN/registro activo y referencias del tenant mediante Sales/procedures existentes.
- Precio/quantity/discount/totales no se ajustan. Valores incompatibles con Sales (precio cero, longitudes delivery, aritmetica, etc.) rechazan/rollback. Observacion que no cabe en el limite Sales queda solo en Order sin truncar (incluido Unicode). ON_ORDER debe tener stock suficiente al convertir. Alta/preparacion Order siguen sin reservar stock.
- GET Order incluye linkedSale minimo (idSale/saleNumber/status) mediante mapper; Sales devuelve idOrder nullable y deliveryFee. Cancelar Sale no reabre Order ni libera el vinculo unico. COMPLETED sigue rechazado por el endpoint generico de estado.
- Notificaciones y lecturas de respuesta ocurren despues del commit/liberacion de la conexion economica; un fallo posterior no revierte la conversion. Retry recupera el vinculo. No se garantiza rollback de efectos post-commit.

## DB y compatibilidad

[Schema](../server/src/db/schema/002_create_tables.sql): sales.idOrder INT NULL y delivery_fee DECIMAL(18,2) NOT NULL DEFAULT 0.00. No existe orders.idSale. [Indice](../server/src/db/schema/003_add_indexes.sql) UNIQUE sales(idBusiness,idOrder), [FK](../server/src/db/schema/004_add_foreign_keys.sql) compuesta a orders y [checks](../server/src/db/schema/005_add_constraints.sql) de fee no negativo/totales. POS usa idOrder NULL; maximo una Sale por Order aun cancelada. Baseline previo no tenia un CHECK Sales de total para reemplazar; se agrega la formula requerida.

Sales directo acepta deliveryFee opcional default 0 y sigue con transaccion propia; su schema HTTP no acepta idOrder. Formula total = subtotal - discountTotal + deliveryFee. sp_create_sale agrega dos parametros (13 en total) y compara el origen del replay para no devolver una venta de otro Order/POS. Detalles/stock/pagos/delivery se reutilizan sin duplicarlos en Orders.

[Migracion manual 004](../server/src/db/manual/004_order_to_sale.sql), numeracion libre confirmada: columnas, unique/FK/checks y permiso/grant ADMIN, sin reset de grants ajenos ni cambios de datos. Guards por metadata permiten retomar objetos ya creados; no certifican estructura de un objeto preexistente alterado manualmente. DDL tiene commits implicitos y no es atomicamente reversible.

[sales.sql](../server/src/db/procedures/sales.sql) actualiza creacion y proyecciones/group by de list/detail; [orders.sql](../server/src/db/procedures/orders.sql) agrega linkedSale y sp_order_complete_from_sale, que valida READY y vinculo tenant-safe. No se habilita COMPLETED generico. No hay nuevo archivo de procedures: manifest/install conservan orden; baseline regenerado con tooling oficial.

## Validaciones ejecutadas

- `npm run typecheck`: aprobado, incluidos los archivos de tests bajo src (tambien la suite de integracion, sin ejecutarla).
- `npm run build`: aprobado (tsc + tsc-alias), repetido tras ajustes finales de implementacion.
- `npm run db:build-baseline` y `npm run db:validate-baseline`: aprobados; SHA-256 `0d3013aad86e947b434f3446738f7995947e42b03d5ece42e094c9e4e2bfbd1b`. Son validaciones de archivos, sin ejecutar SQL.
- `npx vitest run --config vitest.orders-core.config.ts`: **115 tests aprobados** en dos archivos: 68 existentes + 47 de F5/Sales. Config setupFiles vacio, pool mockeado; F5 tambien mockea notificaciones. Primer intento en sandbox no ejecuto tests por EPERM del rename de cache; reintento fuera del sandbox aprobado. Un chequeo estatico inicial confundio un comentario con SQL destructivo; se corrigio para ignorar comentarios y el conjunto final paso.
- Cobertura DB-free: estados, payload estricto/overrides, key valida y colisiones/carrera/UUID case, actor/tenant, retiro/entrega/destinatario/fee, pagos/caja y fallos en cada etapa con rollback/no commit, observacion larga, limites Sales, helper sin ownership, POS default fee 0 y formula aditiva, ambos permisos, HTTP 201/200/409, linkedSale, venta cancelada/replay sin nuevos efectos, SQL/DDL y firmas CALL. No representa prueba de persistencia o locks reales.
- Comprobacion final: 175 enlaces Markdown locales y 55 imports locales validos en los archivos cambiados. Sintaxis de ambas configs de integracion comprobada por transpilacion sin cargarlas ni ejecutarlas. `git diff --check` aprobado; status/stat revisados, 38 archivos (siete nuevos), sin cambios client. Solo avisos de normalizacion LF/CRLF.

## Suite real preparada, NO ejecutada

[Suite F5](../server/src/tests/integration/orders/order-to-sale.integration.test.ts), 11 casos preparados; [config dedicada](../server/vitest.order-to-sale-integration.config.ts) reutiliza restricciones loopback + DB exacta punto_venta_integration_test, setup y fixtures existentes. La config Orders previa se acota a su archivo original para no incorporar F5 implicitamente.

Preflight de DB/plan activo/columna F5; dos tenants UUID propios. Incluye PICKUP/DELIVERY, stock y eventos de pago/entrega/completado, stock insuficiente ON_ORDER, caja ajena/cerrada/registro inactivo, metodo ajeno, rollback por fallo delivery posterior a stock/pagos, aislamiento tenant, ADMIN/SELLER, concurrencia keys iguales/distintas, retry, colision con POS/otro Order, cancelacion y no reconversion. Limpieza solo de fixtures propios, sales antes de orders por FK, sin reset/desactivar FKs ni cambios de catalogos/grants globales.

Comando para una tarea posterior autorizada, tras aplicar SQL: `npx vitest run --config vitest.order-to-sale-integration.config.ts`. No se ejecuto esta suite ni npm test ni suites economicas generales (usan DB). No se ejecutaron DB real, migraciones, SQL manual, backend en marcha, navegador ni produccion. Compatibilidad MySQL/MariaDB y concurrencia efectiva quedan pendientes de esa validacion.

## Operador y cierre

1. Backup, confirmar DB/ambiente y revisar totales existentes; detener escrituras.
2. Aplicar manual/004_order_to_sale.sql.
3. Importar completos procedures/sales.sql y procedures/orders.sql, en ese orden.
4. Desplegar backend compatible antes de reanudar operaciones: la firma sp_create_sale cambio tambien para POS.
5. Autorizar y ejecutar la suite real exclusivamente contra DB test loopback; no produccion. No importar baseline/install ni seed completo sobre DB existente.

Se registra en [F4.1](f04-1-orders-ui-polish-validation.md) confirmacion del operador: orders.sql F4.1 aplicado y probado en local, test y produccion. El agente no verifico produccion. Eso no incluye el SQL F5 nuevo.

Actualizados tasks/project-state, contracts, database, decisions (ADR-008 y estado ADR-005), arquitectura/PRD donde su alcance cambio, docs backend de arquitectura/transacciones/testing y README DB. Sin dependencias, ORM o arquitectura nueva; sin client/F6, reservas, VITRUNO ni Orders publicos. Sin desviacion funcional de alcance ni bloqueo contractual detectado. Implementacion F5 cerrada con evidencia DB-free; aplicacion SQL y validacion real quedan pendientes. Siguiente fase funcional F6, sin comenzar.

## Gate real F5 al iniciar F6 — 2026-10-31

El operador confirma manual/004_order_to_sale.sql, procedures/sales.sql y procedures/orders.sql aplicados y DB alineadas en local, test local y produccion. El agente no verifico produccion. Se ejecuto `npx vitest run --config vitest.order-to-sale-integration.config.ts`: **11/11 tests aprobados**, 1 archivo, 5.21 s, contra host loopback y DB exacta punto_venta_integration_test restringidos por la config/suite; fixtures propios con limpieza acotada. Primer intento no inicio tests por EPERM del cache Vitest; reintento fuera del sandbox aprobado. Esta evidencia reemplaza el pendiente de aplicacion informado al cerrar F5 y el pendiente de ejecucion de su suite real. No se aplicaron migraciones ni SQL estructural por el agente. F6 habilitada por gate.
