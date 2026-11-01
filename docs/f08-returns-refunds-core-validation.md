# F8 — Returns & Refunds Core (DB/backend)

Fecha: 2026-10-31. Rama dev, HEAD inicial `583f0113fd17a1b147fde8a05aee1cf31a13b3dd` (gate F7 documentado); checkout limpio. Sin cambio de rama, staging, commit ni push. F7 conserva gate real 15/15; esa autorizacion no se extiende a ejecutar DB/migraciones F8.

## Alcance implementado

- [Modulo sale-returns](../server/src/modules/businesses-app/sale-returns/index.ts): POST /sales/:idSale/returns, GET lista/summary/saldos por Sale y GET detalle Return. Sin API publica ni operaciones mutables sobre Returns. BUSINESS y tenant/actor del contexto autenticado, Zod estricto, permisos sale_returns.view/create, ADMIN inicial/OWNER shortcut; SELLER/DELIVERY sin grants iniciales.
- Tablas sale_returns, sale_return_items, sale_refunds. UNIQUE tenant/UUID, numero/ID, indices por Sale/linea/pago, FKs tenant-safe y CHECKs de importes/cantidades/restock. Request hash para conflicto/replay. Actores FK users, revalidacion activa del negocio en service. Referencias producto/linea/metodo/montos nunca desde cliente como autoridad.
- [Calculo](../server/src/modules/businesses-app/sale-returns/helpers/sale-returns.helper.ts): parcial/full, multiples devoluciones, UNIT entero y resto dos decimales, subtotal neto original de linea, Decimal local precision 40, redondeo half-up y residual exacto final; limites acumulados de cantidad, importe de linea, pago y envio. Refund exacto del total calculado. Envio solo permitido sin items; linea gratuita puede devolver con refunds vacio y sin caja. Sin store credit/exchange.
- Solo Sale COMPLETED, pagos sin PENDING/COLLECTED y cobertura original CONFIRMED; asignaciones contra pagos CONFIRMED del mismo tenant/Sale. Cash requiere caja actual OPEN/activa/tenant; EXPENSE SALE_REFUND y IDs enlazados. Noncash sin caja/movimiento, evidencia reference/observation. Pago confirmado/rendido e idCashSettlement/settlement historico no cambian; PAYMENT_REFUNDED conserva previous/new CONFIRMED.
- restock true llama [helper SQL](../server/src/db/procedures/sale_returns.sql) para item/stock/movimiento SALE_RETURN con idDepositTo original y reference Return; false solo registra item. No ADJUSTMENT_IN. Sale/Order siguen COMPLETED; no modifica order_events. Full por cantidades cancela Delivery PENDING/ASSIGNED/FAILED con evento reason/idReturn; parcial conserva estado; DELIVERED se conserva; OUT_FOR_DELIVERY bloquea. Puede reembolsarse luego envio restante tras full de mercaderia.
- [Anulacion Sales](../server/src/db/procedures/sales.sql) agrega guarda locking SALE_WITH_RETURNS_CANNOT_BE_CANCELLED antes de mutar; mapper profesional/backend 409. Sin cambios client/**, client/text.txt, dependencias o nuevos estados Sales/Payment. Metrics Sales gross/completedTotal siguen iguales.
- Una PoolConnection/transaccion para todos los efectos; Sale lock serializa keys distintas. Lecturas actuales locking de pagos/lineas/returns/refunds protegen acumulados tras esperas. Misma UUID/body normalizado -> replay sin efectos; body/Sale distintos -> conflicto. Deadlock/timeout revierte y permite reintento; no afirma exito. Response/summary post-commit: lectura fallida se recupera reenviando UUID/body, no revierte lo ya confirmado.

## SQL preparado, no aplicado

[manual/006_returns_refunds.sql](../server/src/db/manual/006_returns_refunds.sql) siguiente numero libre, sin reset/seed global ni reescritura historica: crea tablas, indices, FKs/checks, grants ADMIN; amplia stock enums con SALE_RETURN, reference_id INT -> BIGINT y event enum con PAYMENT_REFUNDED. Canonicos schema 002..005, seeds, [manifest](../server/src/db/tools/db-baseline.manifest.mjs)/install y generado alineados. DDL retomable por objetos existentes, no reparacion de estructuras divergentes ni promesa de rollback DDL.

Operador: backup/ambiente confirmado y escrituras detenidas; aplicar **manual/006_returns_refunds.sql**, importar completos **procedures/sale_returns.sql** y **procedures/sales.sql**, desplegar backend compatible antes de reanudar. No requiere reimportar Orders/Delivery/Payments/Cash por F8. No importar baseline/install/seeds completos en DB existente. Guard Sales usa tabla nueva: coordinar estructura/procedures/backend. No desactivar FKs.

## Validaciones ejecutadas

- `npm run typecheck`: aprobado desde server, incluida compilacion estatica de suite real preparada. Un comando inicial desde root no encontro package.json; se ejecuto correctamente desde server. Tipado inicial detecto import default de Decimal en NodeNext y fixtures tipados como RowDataPacket; se corrigieron con import nombrado y tipos de dominio separados, sin any.
- `npm run build`: aprobado (tsc + tsc-alias).
- `npm run db:build-baseline` y `npm run db:validate-baseline`: aprobados con tooling oficial; sin edicion manual del generado. SHA-256 `62787a6f2e1c69681b99942f419147611c3c27b8a66ab1066d7ac9204bb958ee`. Revision detecto ubicacion inicial de CHECKs F8 posterior al DROP de su helper; corregida antes de aplicar DB, con regresion de orden y baseline regenerado/validado.
- `npx vitest run --config vitest.sale-returns.config.ts`: **191 tests aprobados, 5 archivos** (49 F8 + 142 Orders/F5/F7 previos). Config DB-free setupFiles vacio; service pool mockeado. Primer intento EPERM de cache SSR del sandbox antes de importar/tests; repetido fuera del sandbox con misma config sin DB. Primer conjunto 188/188; tras ampliar regresiones finales, 191/191.
- Cobertura: calculo parcial/full, restock/no-restock, cantidades/precision, multiple/final residual, over-return, envio parcial/multiple/overflow, mixed cash/noncash, limites por pago, pagos pendientes/cobrados/cancelados, cobertura confirmada, historico rendido sin mutar, estados Delivery, summary, hash/replay/conflicto, payload estricto/duplicados, permisos/rutas inmutables, missing/foreign Sale, actor/caja, rollback por fallo posterior, SQL error seguro y orden de locks/current reads. Checks SQL y mocks no demuestran rollback/concurrencia del motor.
- Revision de cash_sessions.sql: live y cierre restan SUM(EXPENSE) sin filtro categoria; no requiere cambiar reporting. Suite real preparada incluye live expectedCash y cierre para comprobarlo en motor tras autorizacion.

## Suite real preparada, pendiente

[Config](../server/vitest.sale-returns-integration.config.ts) hereda guardas Orders; [suite](../server/src/tests/integration/sale-returns/sale-returns.integration.test.ts), **24 casos preparados**, sintaxis y tipos comprobados, no ejecutados. Exige NODE_ENV=test, host loopback, DB exacta punto_venta_integration_test, tablas F8/helper y plan activo existente antes de fixtures. UUID por corrida y cleanup transaccional solo de sus tenants/usuarios: refunds/items/returns antes de Sales, pagos antes de settlements, Sales antes de Orders; sin reset ni desactivar FKs.

Casos: parcial cash/restock, no-restock, segundo parcial, over-return, full, envio parcial multiple/overflow, mixed original payments, cash EXPENSE/live summary, noncash sin movimiento, pago rendido/settlement inalterados, PENDING/COLLECTED, OUT bloqueado, DELIVERED preservado, full PENDING/ASSIGNED/FAILED cancelado, Sale/Order COMPLETED, anulacion posterior bloqueada, replay/conflicto, concurrencia keys distintas, tenant/roles y cierre caja. Historias mixed/settled/collected se preparan con mutaciones acotadas de fixtures propios; no representan una prueba del flujo de cobranza/rendicion previo.

Comando futuro, **solo despues de SQL F8 y autorizacion expresa**: `npx vitest run --config vitest.sale-returns-integration.config.ts` desde server. No se ejecuto DB real F8, migracion, SQL manual, reset, baseline/install contra DB ni produccion. No afirmar compatibilidad ejecutada MySQL/MariaDB, cleanup real, concurrencia o rollback efectivos F8 sin ese gate. SQL F7 previo sincronizado por operador y gate anterior conservan sus limites.

## Revision final de archivos

37 archivos involucrados (22 modificados y 15 nuevos); 178 enlaces Markdown locales y 67 imports relativos/alias verificados. Sin whitespace final, git diff --check aprobado; git status --short y git diff --stat revisados. client/** sin cambios. Estas comprobaciones incluyen archivos nuevos no seguidos por Git y no equivalen a ejecutar SQL.

## Documentacion y cierre

Actualizados tasks/project-state, contracts/database/decisions (ADR-010), backend transactions/testing/architecture y README DB; PRD/frontend no requieren cambios en esta entrega Core. Implementacion F8 cerrada al nivel DB-free/estatico; gate DB real pendiente del operador. F9 Frontend NEXT despues del gate, sin implementar. Fuera de alcance: UI, nota de credito fiscal/ARCA, store credit/exchange, reembolso a otro metodo, settlement externo, editar/borrar/cancelar Return, Purchases returns, reservas y VITRUNO/public returns.

Commit sugerido: `feat(sale-returns): agregar devoluciones y reembolsos compensatorios`.
Descripcion: registrar Returns/Refunds inmutables con stock opcional, caja compensatoria, limites acumulados y replay; proteger anulacion, preparar migracion 006/suite real y documentar contrato F9 y gate pendiente.
