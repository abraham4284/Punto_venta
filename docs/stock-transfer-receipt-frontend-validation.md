# T2.1 — Validación del comprobante de transferencia

Fecha 2026-11-11. Checkout `dev` limpio al inicio con T2 en `fb229096a22ebf817132f2c5ab70935257fa63dd`. La especificación usa `qa` como referencia.

## Flujo y contenido

Una respuesta HTTP exitosa con `status: true` y el contrato completo genera una copia local del comprobante. Stock lo abre antes de refrescar el inventario. El fallo de refresco queda indicado en el diálogo y la transferencia conserva su estado confirmado. **Último comprobante** vuelve a abrir el último confirmado durante la visita a Stock. El estado termina al salir o recargar la página.

El documento muestra nombre y logo disponible del negocio, referencia y fecha confirmadas por el backend, origen, destino, operador, productos y cantidades con unidad, observación cuando existe, cantidad de productos y movimientos, espacios para Entregado por y Recibido por y el aviso de documento operativo interno. Los nombres se resuelven desde la sesión BUSINESS y los depósitos ya cargados. Hay fallbacks de nombre de negocio, depósito y usuario, y un logo fallido se omite. El documento omite precios, costos, fotos, datos fiscales y suma física de unidades mixtas.

**Imprimir / Guardar PDF** abre `window.print()`. El contenido se comparte entre el diálogo y un portal de impresión en `document.body`. La hoja A4 tiene estilos propios, encabezados de tabla repetidos y agrupación de observación, resumen, firmas y aviso al final.

HTTP 400 conserva validación editable. El 409 de concurrencia conserva el flujo de revalidación de T2. Ante 5xx, fallo de red o respuesta incompleta, el borrador se conserva y bloquea el reenvío, incluso al cerrar y reabrir el diálogo. **Ver movimientos** abre la ruta existente en otra pestaña cuando está disponible el permiso de lectura. Descartar el borrador es una acción explícita. En estos casos se conserva el último comprobante previamente confirmado.

## Archivos

- [StockPage](../client/src/views/businesses-app/module/stock/page/StockPage.tsx) coordina la respuesta confirmada, el comprobante local y el refresco.
- [useStock](../client/src/views/businesses-app/module/stock/hooks/useStock.ts) devuelve el resultado del refresco para distinguir un fallo de lectura de un fallo en la transferencia.
- [BatchStockTransferDialog](../client/src/views/businesses-app/module/stock/components/transfer/BatchStockTransferDialog.tsx) y [helper de transferencia](../client/src/views/businesses-app/module/stock/helpers/stock-transfer.helper.ts) manejan el resultado incierto.
- [Helper de comprobante](../client/src/views/businesses-app/module/stock/helpers/stock-transfer-receipt.helper.ts) valida la respuesta y construye la copia de presentación.
- [Diálogo](../client/src/views/businesses-app/module/stock/components/transfer/StockTransferReceiptDialog.tsx), [contenido](../client/src/views/businesses-app/module/stock/components/transfer/StockTransferReceiptContent.tsx) y [portal A4](../client/src/views/businesses-app/module/stock/components/transfer/StockTransferPrintDocument.tsx) implementan vista e impresión.
- [Pruebas del comprobante](../client/scripts/stock-transfer-receipt.test.mjs), [regresión del lote](../client/scripts/stock-batch-transfer.test.mjs) y [package.json](../client/package.json) registran las suites persistentes.
- [Roadmap](tasks.md), [estado](project-state.md), [evidencia de T1](stock-batch-transfer-backend-validation.md) y este documento registran alcance y resultados.

## Validación ejecutada

Comandos desde `client`.

```powershell
node --test scripts/stock-transfer-receipt.test.mjs scripts/stock-batch-transfer.test.mjs scripts/sale-print.test.mjs
npm run build
npm run lint
$s='src/views/businesses-app/module/stock'
node node_modules/eslint/bin/eslint.js "$s/helpers/stock-transfer-receipt.helper.ts" "$s/helpers/stock-transfer.helper.ts" "$s/components/transfer/BatchStockTransferDialog.tsx" "$s/components/transfer/StockTransferReceiptContent.tsx" "$s/components/transfer/StockTransferPrintDocument.tsx" "$s/components/transfer/StockTransferReceiptDialog.tsx" "$s/hooks/useStock.ts" "$s/page/StockPage.tsx" scripts/stock-transfer-receipt.test.mjs scripts/stock-batch-transfer.test.mjs
```

- **46/46 pruebas aprobadas**. Seis de T2.1, 22 de T2 y 18 de impresión de venta. Cubren validación de confirmación, datos y fallbacks, formato es-AR, contenido operativo y resultado incierto.
- **Build aprobado** con avisos existentes de tamaño de bundle e imports dinámicos.
- **Lint acotado aprobado**. El lint global mantiene 8 errores y 2 advertencias previas en archivos ajenos.
- **25 comprobaciones de Chrome headless aprobadas** con la página y diálogos reales y un adaptador Axios ficticio. Cubren apertura antes de terminar el refresco, fallo de refresco, cierre y reapertura, recarga, fallos del POST, bloqueo, logo fallido, acción nativa de impresión y layout a 1424, 768 y 390 px.
- Chrome exportó A4 para 1, 10, 25 y 100 productos en 1, 1, 1 y 3 páginas, respectivamente. La extracción con pypdf verificó dimensiones, todas las filas, encabezados repetidos, firmas en la última página y exclusión del layout administrativo. Se renderizaron con Poppler y se inspeccionaron los PNG. El harness temporal se retiró del checkout. QA con fixtures, sin API/MySQL ni impresora física.
- `git status --short`, `git diff --stat`, `git diff --check` y enlaces locales revisados.

El operador confirmó bases local, de test y de producción sincronizadas. El gate HTTP/MySQL de T1 sigue pendiente de ejecución autorizada. La reimpresión después de recargar requeriría historial durable por referencia. T3 stock público global y T4 QA VITRUNO corresponden a fases posteriores.
