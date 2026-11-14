# INV-CAT-P2 — Filtro multicategoría y planilla imprimible

Implementada en `dev` sobre `32372cb` el 2026-11-14, con árbol inicial limpio. La implementación consume el contrato de P1 tal como está. [Contrato](contracts.md) · [Stock](../client/src/views/businesses-app/module/stock/page/StockPage.tsx).

- El selector de Stock busca por nombre, conserva el borrador hasta aplicar y permite limpiar solo las categorías. Usa `stock.view`.
- La planilla consulta los filtros aplicados al abrir el diálogo, una sola vez por intento. Los casos vacío y 422 muestran un mensaje y bloquean la impresión.
- El documento conserva una fila por existencia registrada y separa depósitos. Imprime fotos de 17 mm, con un máximo de seis segundos de preparación y «Sin imagen» para nulas, fallidas o lentas. La fecha corresponde al momento de preparación. El usuario puede imprimir o guardar como PDF desde el navegador.

## Pruebas ejecutadas

- `node --test scripts/stock-inventory.test.mjs scripts/stock-batch-transfer.test.mjs scripts/stock-transfer-receipt.test.mjs` desde `client/`. 51 aprobadas, 17 nuevas y 34 regresiones. Cubren CSV, límites, errores, cancelación de fotos y render de 35 filas con depósitos distintos y sin precios. [Suite](../client/scripts/stock-inventory.test.mjs).
- `npm run build` desde `client/`. Aprobado, con avisos de tamaño del bundle e imports dinámicos.
- ESLint acotado a los 11 archivos TypeScript/JavaScript cambiados. Aprobado. ESLint global encontró 8 errores y 2 advertencias en código ajeno a la fase.
- Chrome headless con componentes del módulo y adaptador Axios en memoria. Revisados 320, 375, 1024 y 1440 px, foco en búsqueda, Escape, reintento de opciones y exportación de filtros aplicados. Verificados 0, 1, 15, 35, 2.000 y 2.001 registros, reintento de red y cancelación de una consulta en vuelo. La acción explícita invoca `window.print()` (interceptado en las pruebas). La generación de PDF de prueba se efectuó con el motor de Chrome.
- `pdfinfo` verificó A4 vertical en las salidas de 1, 15, 35 y 2.000 filas, con 1, 2, 3 y 144 páginas respectivamente. Se renderizaron con `pdftoppm` y se inspeccionaron las tres páginas del caso de 35 filas. Márgenes, numeración, encabezados repetidos, continuidad de filas, fotos y espacio para observaciones verificados. Se usó una imagen de prueba repetida y casos nulos, fallidos y lentos.

## Pendientes

- Hacer smoke autenticado de las tres rutas contra QA con sesión de test y comprobar el listado con filtros y la planilla con fotos reales. El operador informa bases sincronizadas. La suite no usa credenciales ni API real.
- Verificar impresión nativa, navegación completa por teclado y compatibilidad en los navegadores e impresoras que se usan en operación. Probar el volumen máximo con imágenes remotas reales para medir el efecto del límite de preparación.
