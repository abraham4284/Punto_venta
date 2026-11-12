# T3 — Stock público global entre depósitos activos

Estado al 2026-11-11 en `dev` sobre `e02cb42`. Implementado, con aplicación SQL por ambiente y gate real pendientes.

## Comportamiento

`sp_storefront_get_products` y `sp_storefront_get_product_by_slug` suman cantidades positivas de depósitos con `is_active = 1` del mismo negocio y producto. Si el depósito Principal activo tiene 2 unidades, Local activo tiene 5 e Inactivo tiene 10, listado y detalle devuelven `stockAvailable: 7`. Un producto sin saldo elegible devuelve `0`. Los depósitos predeterminados y no predeterminados siguen la misma regla.

`stockAvailable` sigue siendo un número y `availabilityStatus` mantiene la precedencia `on_order`, `in_stock`, `out_of_stock`. El agregado es por negocio y producto, sin desglose de depósitos en la respuesta. Se conservan búsqueda, `categorySlug`, ranking, paginación, precios minorista y mayorista, `saleMode` e imágenes. [SQL canónico](../server/src/db/procedures/storefront_catalog.sql) · [Contrato](contracts.md).

## Verificaciones ejecutadas

| Comando | Resultado |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run --config vitest.storefront-catalog.config.ts` | 315 pruebas aprobadas en 10 archivos. |
| `npm run typecheck` | Aprobado. |
| `npm run build` | Aprobado. |
| `npm run db:build-baseline` | Baseline regenerado. |
| `npm run db:validate-baseline` | Aprobado. SHA-256 `2f067fe9ef38a284d5b951250dcedce7b7744b08ed5a3c61d636d95e3a1b6929`. |
| `git diff --check` | Aprobado. |

Los comandos npm y Vitest se ejecutaron desde `server/`. El primer intento de Vitest en el sandbox falló al renombrar archivos temporales. La repetición fuera del sandbox completó la suite sin DB. Las 10 pruebas nuevas verifican los invariantes del SQL, paridad del agregado, mapeo de disponibilidad y forma del DTO. [Pruebas aisladas](../server/src/tests/unit/storefront-catalog.stock.test.ts).

## Gate HTTP/MySQL preparado

**PREPARED / NOT RUN.** Incluye 20 casos de búsqueda y 9 de stock público. Los casos T3 comparan listado y detalle con stock activo, inactivo, no predeterminado, decimal, cero, negativo, inexistente y por pedido. También cubren aislamiento, redistribución de saldo entre depósitos activos y desactivación/reactivación. La redistribución modifica solo el fixture de stock y comprueba el total público. La integración del endpoint de transferencia corresponde al gate de T1. [Suite combinada](../server/src/tests/integration/storefront-catalog/catalog-search.integration.test.ts) · [Gate T1](stock-batch-transfer-backend-validation.md).

Con autorización explícita y ambos procedures canónicos instalados, ejecutar desde `server/` con MySQL loopback y `punto_venta_integration_test`:

```powershell
node node_modules/vitest/vitest.mjs run --config vitest.storefront-catalog-integration.config.ts
```

La suite verifica los dos cuerpos instalados antes de sembrar los fixtures UUID y limpia sus datos con FKs activas. La aplicación del SQL y el resultado del gate quedan pendientes de confirmación.

## Aplicación y próxima fase

Para cada base existente, el operador debe reimportar completo [storefront_catalog.sql](../server/src/db/procedures/storefront_catalog.sql) y verificar los dos procedures de listado y detalle. Promover local/test, QA y producción según el flujo operativo. El baseline actualizado corresponde a instalaciones limpias. T3 no requiere migración ni cambios de schema o índices. T4 QA VITRUNO es la fase siguiente. [Operación de base de datos](database.md) · [Roadmap](tasks.md).
