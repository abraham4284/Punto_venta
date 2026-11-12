# T2 — Validación de transferencia múltiple de stock

Fecha 2026-11-11. Checkout `dev` limpio al inicio, HEAD `c985449d2bda40e8d97ff1754c09206c1e5f0d0a` con T1 funcional. La especificación usa `qa` como referencia. La implementación y validación se hicieron sobre el checkout disponible.

## Flujo y contrato

Stock muestra **Transferir stock** con `stock.transfer`. El diálogo usa depósitos activos y distintos, y consulta `GET /stock/advanced-search` con origen, texto y `minQuantity=0.01`. Los resultados paginados se filtran también por origen, producto activo y saldo positivo. El borrador mantiene hasta 100 productos distintos con saldo y unidad por línea. El origen se bloquea mientras hay líneas. El destino se puede editar. El resumen muestra depósitos y cantidad de productos.

La confirmación serializa el borrador en un único POST `/stock-movements/transfers` mediante Axios BUSINESS. Se envían `idDepositFrom`, `idDepositTo`, `observation` recortada o nula e `items: [{ idProduct, quantity }]` en orden de agregado. La respuesta tipada conserva `referenceId`, depósitos, actor, fecha ISO, observación, ítems, `totalQuantity` y `movementCount`. El callback de éxito recibe esa respuesta, muestra la referencia y actualiza el inventario. El diálogo cierra con el borrador limpio. [Contrato T1](contracts.md#t1--transferencia-múltiple-de-stock)

HTTP 400 conserva el borrador y muestra el mensaje seguro y los errores por índice de ítem o campo. El 409 de concurrencia bloquea la confirmación hasta actualizar saldos, sin reenvío automático. La revalidación pagina el inventario del origen en bloques de 100 hasta encontrar las líneas o agotar los resultados. Mantiene las cantidades y marca líneas sin saldo o con saldo reducido. Si falla, conserva el borrador y el bloqueo. En 500 y respuestas inciertas se pide revisar movimientos antes de volver a enviar. El bloqueo durante POST cubre confirmación repetida, Cancelar y Escape.

El flujo individual de Ajuste rápido informa que se creará el stock destino cuando `exists=false` y permite confirmar. El formulario general individual ya enviaba al mismo endpoint sin exigir una fila destino. El gate HTTP/MySQL de T1 sigue pendiente. La evidencia de T2 usa solo datos ficticios. [Evidencia T1](stock-batch-transfer-backend-validation.md)

## Archivos

- [StockPage](../client/src/views/businesses-app/module/stock/page/StockPage.tsx) conecta permiso, acción y actualización de inventario.
- [BatchStockTransferDialog](../client/src/views/businesses-app/module/stock/components/transfer/BatchStockTransferDialog.tsx) controla ruta, líneas, cantidades, errores y confirmación. [StockTransferProductPicker](../client/src/views/businesses-app/module/stock/components/transfer/StockTransferProductPicker.tsx) consulta resultados por origen.
- [Tipos](../client/src/views/businesses-app/module/stock/types/stock.types.ts) y [API](../client/src/views/businesses-app/module/stock/api/stock.movement.api.ts) representan el contrato T1.
- [Helper](../client/src/views/businesses-app/module/stock/helpers/stock-transfer.helper.ts) valida líneas, arma el payload, actualiza saldos y clasifica errores.
- [QuickStockAdjustmentModal](../client/src/views/businesses-app/module/stock/components/modal/QuickStockAdjustmentModal.tsx) vuelve informativo el saldo destino faltante y vincula el aviso al producto y depósito seleccionados.
- [Script Node](../client/scripts/stock-batch-transfer.test.mjs) y [package.json](../client/package.json) agregan pruebas persistentes.
- [Roadmap](tasks.md), [estado](project-state.md) y este documento registran la evidencia.

## Comprobaciones ejecutadas

Desde `client`:

```powershell
npm run test:stock-batch-transfer
npm run build
npm run lint
$stock='src/views/businesses-app/module/stock'
node node_modules/eslint/bin/eslint.js "$stock/api/stock.movement.api.ts" "$stock/types/stock.types.ts" "$stock/helpers/stock-transfer.helper.ts" "$stock/components/modal/QuickStockAdjustmentModal.tsx" "$stock/components/transfer/BatchStockTransferDialog.tsx" "$stock/components/transfer/StockTransferProductPicker.tsx" "$stock/page/StockPage.tsx" scripts/stock-batch-transfer.test.mjs
```

- **22/22 pruebas** de helper. Cubren ruta, carrito vacío, límite 100, duplicados, elegibilidad, cantidad, payload, saldos nuevos y errores. No ejercen DOM ni HTTP.
- **Build aprobado** con avisos existentes de tamaño de bundle e imports dinámicos inefectivos de auth, subscription y react-hot-toast.
- **Lint global con 8 errores y 2 advertencias** en `LiGeneral.tsx`, `badge.tsx`, `button.tsx`, `useForm.ts`, `DepositModalForm.tsx` y `PaymentMethodModal.tsx`. **Lint acotado aprobado** en los ocho archivos ejecutables de T2.
- **29 comprobaciones de navegador aprobadas** en Chrome headless. La página Stock, los diálogos y los hooks reales se montaron con un adaptador Axios en memoria. Se comprobó el permiso, origen/destino, búsqueda por código, filtrado, edición, duplicado, eliminación, errores 400/409/500, refresco fallido y saldo reducido, doble submit, éxito, POST individual y Tab/Escape. El diálogo y su footer se verificaron a 1424, 768 y 390 px. El límite de 100 se probó en Node. El harness temporal se retiró del repo y sus resultados y capturas quedaron fuera del checkout. No se ejecutó un E2E contra API/MySQL.
- Enlaces locales revisados. `git status --short`, `git diff --stat` y `git diff --check` ejecutados al cierre.

T2.1 comprobante provisional, T3 stock público global entre depósitos y T4 QA VITRUNO corresponden a fases posteriores.
