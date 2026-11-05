# F10.2.1 — Wholesale Price Visibility Polish

Fecha: 2026-11-05. Estado: CLOSED al alcance frontend visual validado.

## Base y alcance

Rama `dev`; HEAD inicial `5c5354d73509815d458033801cc8a5a47beb6848` (`feat(pricing): integrar precios mayoristas en el panel administrativo`), checkout inicial limpio. Se conserva la rama indicada por AGENTS; la referencia historica a master/PR161 del prompt no implica cambiarla. Sin add, commit, push ni otras escrituras Git.

El modal de productos de Nueva Venta muestra `priceSale` como Minorista y `priceWholesale` como Mayorista, con badge textual del precio aplicado. Un mayorista null/undefined/no finito/no positivo muestra `Sin definir`, nunca un $0 sustituto. Si `requireWholesalePrice` exige mayorista, conserva el bloqueo y `Sin precio mayorista`. Si no lo exige, conserva la seleccion existente; el badge minorista en un producto sin mayorista refleja ese comportamiento, sin inventar un importe mayorista. Se retira un helper de presentacion que solo elegia el precio mostrado; handlers, guards y logica F10.2 no cambian.

Productos conserva Costo y sus valores; renombra Precio venta a Precio minorista y agrega Precio mayorista. Mayorista ausente/invalido muestra `—`. Se preserva scroll horizontal interno, acciones y columnas restantes. Labels y badges son texto real; no dependen solo del color.

Sin cambios a effectivePricingType, candidato/minimo, Customer tier, carrito/payload/promocion, Mi Empresa, detalle/impresion Sale, Orders o Returns. Sin backend/API/DB/SQL/migraciones, VITRUNO, dependencias nuevas ni despliegue.

## Archivos

- [ProductSelectionModal.tsx](../client/src/views/businesses-app/module/sales/components/modal/ProductSelectionModal.tsx)
- [ProductTable.tsx](../client/src/views/businesses-app/module/products/components/table/ProductTable.tsx)
- [wholesale-price-visibility.test.mjs](../client/scripts/wholesale-price-visibility.test.mjs)
- [testing.md](../client/docs/testing.md)
- [tasks.md](tasks.md)
- [project-state.md](project-state.md)
- Este documento.

## Validacion tecnica

Desde `client`:

```sh
node --test scripts/wholesale-price-visibility.test.mjs scripts/wholesale-pricing.test.mjs
npm run build
node node_modules/eslint/bin/eslint.js src/views/businesses-app/module/sales/components/modal/ProductSelectionModal.tsx src/views/businesses-app/module/products/components/table/ProductTable.tsx
```

- Tests: 91/91 PASS (20 nuevos + 71 F10.2). Render de componentes reales: ambos precios, badges retail/wholesale, null/undefined/0/negativo/NaN/Infinity, input bloqueado cuando requerido y seleccion opcional conservada, headers/importes/costo y wrapper scroll. Regresion F10.2 cubre pricing y payload.
- Tests nuevos usan React SSR y transpilan en memoria con TypeScript instalado. Se siembran solo los dos estados vacios de busqueda del modal para mostrar resultados sin efectos SSR; no sustituyen lifecycle DOM ni API real.
- Build: PASS (TypeScript + Vite). Persisten warnings de bundle mayor a 500 kB e imports dinamicos inefectivos de auth/subscription/react-hot-toast. Sin ampliacion de alcance para corregirlos.
- ESLint acotado a ambos componentes: PASS. Lint global no reejecutado; deuda anterior fuera de alcance.
- Enlaces locales/rutas, alcance, whitespace, `git diff --check`, `git status --short` y `git diff --stat` revisados al cierre.

## QA visual local

15/15 escenarios PASS en Chrome headless, con ambos componentes reales, estilos existentes y productos ficticios (costo 1.234, minorista 15.000, mayorista 12.000 o null). Desktop 1424 px, tablet 768 px y mobile 390x844. La ventana minima de Chrome es 500 px; mobile se ejecuta en iframe de ancho real 390 px.

Matriz: tabla, modal retail, modal wholesale requerido y modal wholesale opcional en los tres tamaños (12 escenarios), mas tabla desplazada hasta precios en mobile/tablet y producto sin mayorista desplazado al centro en modal mobile (3). Se verifican importes/labels, badge aplicado, ausencia sin $0, bloqueo requerido frente a seleccion opcional, busqueda/foco inicial, ancho del modal, footer visible y ausencia de overflow horizontal de pagina. Capturas inspeccionadas para densidad/alineacion y scroll interno.

Computer-use fallo al inicializar assets (`failed to write kernel assets`, ruta no encontrada). Se uso un harness propio temporal servido localmente, sin API, autenticacion ni operaciones financieras reales. Harness retirado del repo y servidor detenido. Artefactos locales conservados fuera del repo en `C:/Users/Abrah/.codex/visualizations/2026/10/31/01a18f43-9087-77d1-84c1-f46376335b8d/wholesale-price-visibility-qa`: results.json, capturas, DOM y copia del harness; perfil Chrome temporal eliminado.

Este QA demuestra presentacion responsive de componentes con fixtures. No certifica E2E contra API/DB real, navegacion completa por teclado, dispositivo fisico ni produccion. No se ejecuto suite backend, SQL, migracion o conexion DB en esta fase.
