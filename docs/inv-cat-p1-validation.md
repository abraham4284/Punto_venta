# INV-CAT-P1 — Filtro multicategoría y datos de exportación

Implementado y validado sin DB el 2026-11-14. Checkout `dev`, HEAD inicial `fffadfd` y árbol inicial limpio. Integración MySQL y QA pendientes.

## Contrato y alcance

Los endpoints administrativos listan existencias registradas por producto y depósito. Comparten la normalización de `categoryIds` y los filtros de búsqueda, depósito, cantidades y alerta. El listado conserva paginación y DTO. La exportación incluye la imagen principal nullable, excluye importes y devuelve hasta 2.000 coincidencias completas. El límite SQL de 2.001 detecta exceso en el mismo SELECT sin contar todas las filas en una segunda consulta. [Contrato HTTP](contracts.md) · [SQL canónico](../server/src/db/procedures/stock.sql).

`SELLER` recibe `stock.view` pero no `categories.view` en el seed. `GET /api/stock/category-options` usa `stock.view` y proyecta únicamente ID y nombre de categorías del negocio autenticado. La matriz, el frontend, las transferencias y el catálogo público T3 permanecen intactos. [Permisos del seed](../server/src/db/seeds/002_permissions_and_role_permissions.sql).

## Evidencia sin DB

| Comando desde `server/` | Resultado |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run --config vitest.stock-inventory.config.ts --reporter=dot` | 75 aprobadas, incluidas 30 de inventario y 45 de transferencias/historial. |
| `node node_modules/vitest/vitest.mjs run --config vitest.storefront-catalog.config.ts --reporter=dot` | 315 regresiones aprobadas. |
| `npm run typecheck` | Aprobado. |
| `npm run build` | Aprobado. |
| `npm run db:build-baseline` | Regenerado. |
| `npm run db:validate-baseline` | Aprobado. SHA-256 `4d6897757da8b6be132d69197c9b539f0c450cfc5c07e102428414cba3198cbc`. |

Las pruebas montan rutas Express con autenticación simulada, ejecutan el middleware real de permisos con resolución simulada y reemplazan el pool. Verifican validación, tenant ligado a la sesión, binds, campos, fila por depósito, conteo, errores y exportaciones de 0, 35, 2.000 y 2.001 filas. Los checks estáticos comparan los joins y predicados de filas, COUNT y exportación, y verifican estado, orden, imagen y límites. [Suite de inventario](../server/src/tests/unit/stock-inventory.test.ts).

## Verificaciones pendientes

- Con autorización, aplicar y verificar ambas firmas según el orden de despliegue y rollback documentado. Confirmar motor y versión de cada ambiente. [Operación de DB](database.md).
- En MySQL test, comprobar una y varias categorías combinadas con los demás filtros y la unión sin duplicados, categoría de otro negocio, producto con dos depósitos, cero, inactivos, imagen nula, orden estable, COUNT y paridad del listado con exportación.
- Verificar por HTTP en QA un listado de 15 frente a una exportación de 35, los casos vacío, 2.000 y superior a 2.000 y los permisos efectivos de OWNER, ADMIN y SELLER. Verificar el contrato previo sin `categoryIds`.
- Revisar el plan de las consultas de listado, COUNT y exportación con `EXPLAIN` sobre los SELECT con datos autorizados y cardinalidades representativas.

Para INV-CAT-P2, usar `category-options` con `stock.view`, omitir `categoryIds` para «Todas» y solicitar `export-data` solo al preparar la planilla. El render A4 y el manejo de imagen ausente pertenecen a esa fase.
