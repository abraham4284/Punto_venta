# Etiquetas imprimibles de precios

Implementadas el 2026-11-22 en `dev` sobre `c9d7926`, con árbol inicial limpio. La función pertenece a Productos y consulta precios persistidos del negocio autenticado.

## Arquitectura y contrato

`GET /api/products/price-labels` se monta antes de `/products/:id` y usa `products.view`. Valida filtros independientes de la paginación. El service usa SQL parametrizado, relaciona categorías por negocio e ID y lee hasta 2.001 filas para detectar un exceso del límite de 2.000. La proyección devuelve únicamente identidad, nombre, categoría, barcode, precios de venta y condición activa. Es una lectura directa y no requiere schema, migración, procedure ni baseline nuevos. [Contrato](contracts.md) · [Backend](../server/src/modules/businesses-app/products/services/products.service.ts).

En Productos, un Set local conserva la selección durante la visita y entre páginas. El checkbox de cabecera afecta solo la página visible. El diálogo elige por defecto los seleccionados si existen o todos los filtrados. Una selección solicita únicamente IDs, mientras que los filtrados envían búsqueda, categoría y estado. La preparación hace una sola petición y conserva una respuesta completa como snapshot. Cambiar contenido o volver a preparar invalida la versión anterior. Cerrar cancela la consulta. La impresión requiere una segunda acción explícita. [Página](../client/src/views/businesses-app/module/products/page/ProductsPage.tsx) · [Diálogo](../client/src/views/businesses-app/module/products/components/price-labels/ProductPriceLabelsDialog.tsx).

## Etiquetas y salida

Cada etiqueta mide 63 × 38 mm, con borde recortable de 0,25 mm y barra superior de 0,8 mm. Una hoja A4 vertical usa márgenes de 8 mm y una grilla de 3 × 7 con separación de 2 mm. Cada página se agrupa explícitamente en 21 productos. El portal se monta directamente en body y aísla la impresión de la UI administrativa.

La marca textual viene de `businessName`. El fondo dominante es blanco. El nombre usa 11 pt y hasta dos líneas. Los bloques Minorista/Mayorista ocupan 50/50 y sus importes comparten tamaño adaptable y peso, con texto `#242038`. Mayorista usa borde y título `#6547BE` sobre fondo `#EAE6F7`. El bloque se oculta si el valor es nulo, no finito o no positivo y Minorista ocupa todo el ancho. Barcode textual y categoría son opcionales. Los productos inactivos llevan su marca. [Documento](../client/src/views/businesses-app/module/products/components/price-labels/ProductPriceLabelsPrintDocument.tsx) · [Estilos](../client/src/views/businesses-app/module/products/components/price-labels/product-price-labels-print.css).

## Verificaciones ejecutadas

| Desde | Comando | Resultado |
| --- | --- | --- |
| server | `node node_modules/vitest/vitest.mjs run --config vitest.product-price-labels.config.ts --reporter=dot` | 28 pruebas aprobadas, con pool simulado. |
| server | `npm run typecheck` y `npm run build` | Aprobados. |
| client | `node --test --test-reporter=dot scripts/product-price-labels.test.mjs scripts/wholesale-price-visibility.test.mjs scripts/stock-inventory.test.mjs` | 67 aprobadas, incluidas 30 nuevas. |
| client | `npm run build` | Aprobado con avisos de tamaño del bundle e imports dinámicos. |
| client | ESLint acotado a fuentes de la fase y su suite | Aprobado. El lint global no se ejecutó. |

Los tests backend cubren filtros y combinaciones, deduplicación y límites de IDs, rechazo de entradas antes de DB, binds por tenant, middleware real de permiso con resolución simulada, DTO sin costos, nulos, conjunto vacío, límite y errores seguros. No ejecutan SQL real. [Tests backend](../server/src/tests/unit/product-price-labels.test.ts).

Los tests frontend cubren URL por IDs/filtros, selección entre páginas, agrupación sin pérdidas, formato ARS, mayorista ausente, toggles, inactivos y render sin costos. [Tests frontend](../client/scripts/product-price-labels.test.mjs).

## QA con fixtures

Chrome headless montó `ProductsPage` con Axios en memoria a 320, 768 y 1440 px. Se comprobó seleccionar un producto, cambiar de página, seleccionar esa página, conservar 21 IDs, elegir scope, preparar y emitir impresión solo mediante el botón. Los diálogos quedaron dentro de cada viewport.

Se verificaron recuperación de 400/401/403/422/500, resultado vacío y cancelación con respuesta tardía. La impresión de prueba se obtuvo mediante el motor PDF de Chrome a escala 1 y tamaño CSS A4. Se probaron 1, 2, 3, 20, 21, 22, 42, 43 y 100 etiquetas. `pdfinfo` confirmó 1, 1, 1, 1, 1, 2, 2, 3 y 5 páginas, respectivamente, y tamaño A4 en todas.

La salida de 21 etiquetas y el salto a la segunda hoja del caso de 22 se renderizaron con `pdftoppm` para inspección visual. Se ajustaron precios grandes y nombres extensos. La repetición verificó que cada precio cabe en su celda en modo print, con importes de $990 a $12.500.000, y el nombre ocupa dos líneas. Los archivos de prueba quedaron fuera del repositorio en el directorio de visualizaciones de la sesión.

Microsoft Edge headless repitió el flujo a 1440 px, los errores y la cancelación. Su motor PDF produjo A4 y la misma secuencia de páginas para los nueve tamaños. La primera hoja de 21 se renderizó y revisó visualmente. También se inspeccionó la tercera hoja de 43 en Chrome para comprobar el salto. Las pruebas interceptan `window.print()` y usan CDP para obtener la salida del motor, sin impresora física.

## Ajuste de etiquetas y consulta rápida F8

Implementado sobre `dfa31f9` en `dev`, con árbol inicial limpio. La tarjeta de F8 usa los mismos colores e importes con notoriedad equivalente, apilados en móvil y en dos columnas desde 640 px. Reutiliza el formato ARS de las etiquetas, omitiendo decimales cero y conservando centavos reales. Mayorista se muestra solo si existe, es finito y positivo. El render de la tarjeta se separó del modal para comprobarlo mediante SSR. [Tarjeta F8](../client/src/components/global/PriceCheckerProductCard.tsx).

Validación desde `client/`: `node --test --test-reporter=dot scripts/product-price-labels.test.mjs scripts/wholesale-price-visibility.test.mjs` aprobó 59 tests (9 nuevos). Build y ESLint acotado a ambos componentes de F8 y la suite aprobados, con los avisos de bundle/imports ya informados. Lint global no ejecutado.

Chrome headless con componentes reales y Axios en memoria verificó 320/375/768/1440 px, F8, autofocus, búsqueda con `limit=6`/`isActive=true`, barcode exacto prioritario, Escape y reapertura. Comprobó importes de $990, $12.500 y $1.250.000 sin overflow, igualdad de tamaño/peso, mayoristas nulos/cero/no finitos, centavos y metadata. Capturas de móvil y desktop inspeccionadas. La impresión de 1/21/22 etiquetas mantuvo 1/1/2 páginas A4 según `pdfinfo`. La hoja de 21 se renderizó con `pdftoppm` e inspeccionó visualmente. El listener, el store, la búsqueda, backend, DB, schema, procedures y contratos API conservan su implementación. Smoke contra API real e impresora física pendientes.

## Pendientes de despliegue

Para el ajuste visual y F8, desplegar el frontend y hacer smoke autenticado en QA con productos reales. Verificar impresión física a escala 100%, con encabezados/pies del navegador desactivados para aprovechar los márgenes. No se consultó DB real ni se aplicó SQL en esta fase.
