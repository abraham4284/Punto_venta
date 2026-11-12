# T1 — Validación de transferencia múltiple de stock

Fecha 2026-11-11. Implementación validada sin DB. Gate MySQL pendiente. Checkout `dev`, HEAD inicial `b4707500b1c26ed9fc1788d0b16f03a5e5af2885`. La especificación toma `qa` como referencia y permite trabajar en el checkout existente.

## Implementación

- [Ruta](../server/src/modules/businesses-app/stock_movements/routes/stock_movements.routes.ts), [controller](../server/src/modules/businesses-app/stock_movements/controllers/stock_movements.controller.ts), [validación](../server/src/modules/businesses-app/stock_movements/validations/stock_movements.validations.ts) y [tipos](../server/src/modules/businesses-app/stock_movements/types/index.ts) definen el endpoint y sus errores.
- [Service](../server/src/modules/businesses-app/stock_movements/services/stock_movements.service.ts) controla una conexión y transacción, ordena los ítems y devuelve el resumen preparado antes del commit. Evalúa alertas después de liberar la conexión.
- [Procedures](../server/src/db/procedures/stock_movements.sql) y [baseline](../server/src/db/generated/cajora_v1_0_full.sql) contienen el helper compartido y el wrapper individual. La operación individual admite alta de destino y conserva el traslado de stock de productos inactivos y su respuesta de listado reciente. La validación de producto activo aplica al lote.
- [Contrato](contracts.md), [aplicación SQL](database.md), [ownership](../server/docs/transactions.md), [roadmap](tasks.md) y [estado](project-state.md) documentan el cambio.

## Verificación ejecutada

Desde `server`:

```sh
node node_modules/vitest/vitest.mjs run --config vitest.stock-transfer.config.ts
npm run typecheck
npm run build
npm run db:build-baseline
npm run db:validate-baseline
```

[Suite DB-free](../server/src/tests/unit/stock-transfer.test.ts) y [configuración](../server/vitest.stock-transfer.config.ts). 24 pruebas aprobadas. La suite usa la ruta, controller y service reales con autorización, pool y notificaciones simulados. Cubre validación estricta, autenticación y permiso en las rutas, referencia entre ítems, commit/rollback/release, rechazo UNIT desde el procedure simulado, errores HTTP, alertas posteriores y contrato individual. La comprobación SQL es estática. El primer intento dentro del sandbox falló por EPERM en el caché de Vitest antes de ejecutar casos. La ejecución DB-free fuera del sandbox aprobó.

Typecheck, build y generación/validación del baseline aprobados. SHA-256 del baseline `95b5b3e38739d651e5f5ce61720bdc342e441ccb22977a190aac3c881c399d45`. El backend carece de configuración de lint.

## Gate HTTP/MySQL preparado

```sh
node node_modules/vitest/vitest.mjs run --config vitest.stock-transfer-integration.config.ts
```

[Suite real](../server/src/tests/integration/stock-transfer/stock-transfer.integration.test.ts) y [configuración de loopback](../server/vitest.stock-transfer-integration.config.ts). Nueve escenarios cubren éxito, conservación, agrupación, rollback de stock y movimientos, alta de destino, decimales, depósitos iguales, UNIT, aislamiento, inactivos, regresión individual y competencia concurrente entre un lote y una transferencia individual. El gate comprueba la DB de test y los procedures instalados. Usa dos negocios etiquetados con UUID y limpieza acotada con FKs activas.

La tarea no ejecutó SQL ni se conectó a una DB. La compilación del gate y el baseline estático no demuestran el comportamiento de los locks en MySQL. Al iniciar T2.1, el operador confirmó que las bases local, de test y de producción están sincronizadas. T1 sigue pendiente del resultado del gate HTTP/MySQL.
