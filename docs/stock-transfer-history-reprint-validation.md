# T2.2 — Historial y reimpresión de transferencias

Checkout inicial `dev` limpio, HEAD `80cf73d9ac4145bc7be5b90c4b9149aca5806882` con T2.1. La especificación toma `qa` como referencia.

## Implementación

- [Ruta](../server/src/modules/businesses-app/stock_movements/routes/stock_movements.routes.ts), [controller](../server/src/modules/businesses-app/stock_movements/controllers/stock_movements.controller.ts) y [schema Zod](../server/src/modules/businesses-app/stock_movements/validations/stock_movements.validations.ts) agregan el GET histórico con `stock.view_movements` y una referencia positiva segura.
- [Service](../server/src/modules/businesses-app/stock_movements/services/stock_movements.service.ts), [mapper](../server/src/modules/businesses-app/stock_movements/helpers/stock-movement.mapper.ts) y [tipos](../server/src/modules/businesses-app/stock_movements/types/index.ts) consultan con parámetros de sesión y referencia. Validan una salida y una entrada por producto, cantidades Decimal iguales, actor, ruta y observación coherentes y primer movimiento de salida como ancla. El límite de lectura de 201 permite detectar grupos fuera del máximo de 200 filas sin devolver un lote parcial.
- [Procedure del listado](../server/src/db/procedures/stock_movements.sql) aplica el mismo filtro por referencia en SELECT y COUNT. [Índice canónico](../server/src/db/schema/003_add_indexes.sql), [migración 008](../server/src/db/manual/008_stock_transfer_reference_lookup.sql) y [baseline](../server/src/db/generated/cajora_v1_0_full.sql) cubren el acceso por negocio, tipo y referencia.
- [Filtro](../client/src/views/businesses-app/module/stock/components/movement/MovementFilter.tsx), [tabla](../client/src/views/businesses-app/module/stock/components/movement/MovementTable.tsx) y [página](../client/src/views/businesses-app/module/stock/page/StockMovementPage.tsx) muestran la referencia y la acción para transferencias, cargan el grupo completo bajo demanda, comparten el estado de carga para filas de la misma referencia y ofrecen reintento ante error. La tabla mantiene filas individuales y contempla el tipo existente `SALE_RETURN`.
- [API Axios](../client/src/views/businesses-app/module/stock/api/stock.movement.api.ts), [tipos de cliente](../client/src/views/businesses-app/module/stock/types/stock.types.ts) y [helper del comprobante](../client/src/views/businesses-app/module/stock/helpers/stock-transfer-receipt.helper.ts) validan el GET y lo convierten al modelo de presentación existente. El [diálogo T2.1](../client/src/views/businesses-app/module/stock/components/transfer/StockTransferReceiptDialog.tsx) comparte contenido e impresión A4 con el comprobante inmediato.
- [Contrato](contracts.md), [despliegue SQL](database.md), [roadmap](tasks.md) y [estado](project-state.md) documentan el resultado.

El historial se recupera desde `stock_movements` tras recargar o volver a entrar. La referencia, los IDs, la fecha, la observación y las cantidades corresponden a los movimientos persistidos. Los nombres, el logo y la unidad reflejan los datos de presentación actuales. Las entidades inactivas siguen siendo legibles. El detalle devuelve el mismo 404 para una referencia ausente, ajena o de otro tipo y un 500 seguro para grupos incoherentes.

## Comprobaciones ejecutadas

Comandos desde `server`.

```powershell
npm run typecheck
npm run build
node node_modules/vitest/vitest.mjs run --config vitest.stock-transfer.config.ts
npm run db:build-baseline
npm run db:validate-baseline
```

Typecheck y build aprobados. La [suite DB-free](../server/src/tests/unit/stock-transfer.test.ts) aprobó **45/45** casos, 24 de regresión T1 y 21 de T2.2. Usa rutas reales con autenticación, permiso y pool simulados. Verifica consultas parametrizadas, 404 uniforme, reconstrucción, inactivos, casos inconsistentes, errores seguros y alineación estática de SELECT/COUNT. El baseline se regeneró y validó con SHA-256 `947557211d51847e2ab99d3ed8bbdfe949926980436f94743267c17074f2188d`.

Comandos desde `client`.

```powershell
node --test scripts/stock-transfer-receipt.test.mjs scripts/stock-batch-transfer.test.mjs scripts/sale-print.test.mjs
npm run build
npm run lint
$s='src/views/businesses-app/module/stock'
node node_modules/eslint/bin/eslint.js "$s/api/stock.movement.api.ts" "$s/components/movement/MovementFilter.tsx" "$s/components/movement/MovementTable.tsx" "$s/components/transfer/StockTransferReceiptDialog.tsx" "$s/helpers/stock-transfer-receipt.helper.ts" "$s/page/StockMovementPage.tsx" "$s/types/stock.types.ts" scripts/stock-transfer-receipt.test.mjs
```

**52/52 pruebas frontend** aprobadas. Los seis casos nuevos de [historial y comprobante](../client/scripts/stock-transfer-receipt.test.mjs) se ejecutaron con las regresiones de T2, T2.1 y Sales. Build aprobado con avisos previos de tamaño de bundle e imports dinámicos. Lint acotado aprobado. Lint global con 8 errores y 2 advertencias preexistentes fuera de los archivos de T2.2.

**19 comprobaciones en Chrome headless** con la página y diálogos reales y Axios simulado. Cubren filtro Transferencias, búsqueda con y sin `#`, acción exclusiva, carga por referencia sin GET duplicados, 404/500 y reintento, recuperación de filas fuera de la página actual, reapertura y recarga. Se comprobó el diálogo a 1424, 768 y 390 px. El PDF de prueba A4 se inspeccionó con pypdf y Poppler para verificar las tres líneas, las unidades, el operador, las firmas y el aislamiento del layout administrativo. El harness temporal se retiró del repo. La prueba usa fixtures y no demuestra persistencia contra MySQL.

`git status --short`, `git diff --stat`, `git diff --check` y enlaces locales revisados.

## Gate real preparado y pendiente

La [suite de loopback](../server/src/tests/integration/stock-transfer/stock-transfer.integration.test.ts) extiende el gate T1 con dos casos de T2.2. Verifica preflight del índice y el procedure, lote completo, búsqueda en una lista paginada, 404 de otro negocio, transferencia individual y lectura con entidades inactivas. Usa el mismo cleanup de fixtures por negocio y usuario. Para ejecutar solo T2.2 desde `server`, una vez aplicado el SQL en test y autorizada la ejecución:

```powershell
node node_modules/vitest/vitest.mjs run --config vitest.stock-transfer-integration.config.ts -t "T2.2 durable transfer history"
```

Migración 008 y procedure sin aplicar por el agente. Gates HTTP/MySQL T1 y T2.2 pendientes. T3 stock público global y T4 QA VITRUNO corresponden a fases posteriores.
