# Catalogo publico — busqueda por categoria y relevancia

Fecha: 2026-11-07. Estado: IMPLEMENTED / DB GATE PENDING; fase no cerrada.

## Base y alcance

Rama dev, checkout inicial limpio. HEAD inspeccionado: `a4719dfeb36ab8a008f11892342251d5119e379e` (`fix(pricing): mostrar precios minoristas y mayoristas en productos`). Sin cambio de rama ni escrituras Git.

Cambio funcional exclusivamente en [storefront_catalog.sql](../server/src/db/procedures/storefront_catalog.sql), procedure sp_storefront_get_products. Se conserva la firma de cinco parametros y el flujo controller/Zod/service/CALL existente. Controller, service, validaciones, tipos y mapper productivos no requirieron cambios. Frontend Cajora y repositorio externo VITRUNO sin modificaciones.

## Filtro y orden

Tanto SELECT como COUNT usan el mismo WHERE: slug del negocio configurado, negocio activo/ACTIVE, producto/categoria activos, search nulo/vacio o substring en p.name/p.description/pc.name/pc.slug, y filtro opcional de categoria como AND separado. Se preservan joins por idBusiness, DTO publico sin costos y stock del deposito predeterminado activo.

Orden SQL previo a LIMIT/OFFSET:

1. Producto exacto.
2. Categoria exacta.
3. Prefijo de producto.
4. Prefijo de categoria.
5. Substring de producto.
6. Substring de categoria.
7. Descripcion.
8. Slug de categoria.

Desempate por p.name ASC, p.idProduct ASC; sin search todos reciben prioridad 100 y conservan orden alfabetico. COUNT no necesita ORDER BY. Se preserva utf8mb4_unicode_ci y semantica LIKE existente, incluidos comodines; no se implementa stemming, sinonimos, fuzzy, FULLTEXT ni indices nuevos. Singular/plural se beneficia del substring, sin prometer equivalencias linguisticas generales.

## Archivos

- [Procedure canonico](../server/src/db/procedures/storefront_catalog.sql).
- [Baseline generado por tooling](../server/src/db/generated/cajora_v1_0_full.sql).
- [Config DB-free](../server/vitest.storefront-catalog.config.ts) y [25 tests nuevos](../server/src/tests/unit/storefront-catalog.search.test.ts).
- [Config de gate real](../server/vitest.storefront-catalog-integration.config.ts) y [20 casos preparados](../server/src/tests/integration/storefront-catalog/catalog-search.integration.test.ts).
- [Contratos](contracts.md), [DB/despliegue](database.md), [tasks](tasks.md), [project-state](project-state.md), [testing backend](../server/docs/testing.md) y este documento.

No nueva migracion DDL, tabla, columna, parametro HTTP, campo DTO, dependencia ni cambio de manifest/install. No ADR nueva: es una ampliacion acotada del criterio de busqueda en el procedure existente.

## Validacion ejecutada

Desde server:

```sh
node node_modules/vitest/vitest.mjs run --config vitest.storefront-catalog.config.ts
npm run typecheck
npm run build
npm run db:build-baseline
npm run db:validate-baseline
```

- Tests: 305/305 PASS en 9 archivos (25 nuevos + 280 regresiones Wholesale/Customers/catalog mapper/Orders/F5/F7/F8). Config sin setup de integracion; pool/config publica mockeados. SQL validado como contrato de archivos, no ejecutado. Pruebas de transporte verifican service/controller reales con resultados DB mockeados; no certifican matches de MySQL.
- Primer intento dentro del sandbox fallo antes de ejecutar tests por EPERM al renombrar cache Vitest. Reejecucion DB-free fuera del sandbox aprobada; no fue un fallo funcional ni hubo conexion DB.
- Typecheck: PASS; incluye compilacion de la suite real preparada, sin ejecutarla.
- Build: PASS, tsc + tsc-alias.
- Build/validate baseline: PASS. SHA-256 `df0330f9674a348ae79738c0f689b0947587ac8335c83e2d20f48ff493ddec45`.
- Lint acotado: no ejecutable con tooling vigente. Backend no tiene script, dependencia ni configuracion ESLint; no se agrega un linter para esta tarea ni se informa PASS ficticio. SQL cubierto por tests estaticos y baseline validator, que no sustituyen un motor SQL.
- Cierre de archivos: enlaces/rutas documentales, whitespace, alcance, git diff --check, status y diff --stat revisados.

## Gate HTTP / DB pendiente

Ninguna conexion DB, consulta SQL real, import de procedure o migracion ejecutados. No se conoce ni certifica la definicion instalada actual. El archivo editado y el baseline no actualizan automaticamente MySQL/MariaDB. Estado por ambiente:

| Ambiente | SP aplicado por el agente | HTTP/DB validado en esta tarea |
| --- | --- | --- |
| Local/test | No | No; gate preparado |
| QA | No | No |
| Produccion | No | No |

Gate preparado, no ejecutado:

```sh
node node_modules/vitest/vitest.mjs run --config vitest.storefront-catalog-integration.config.ts
```

Hereda guardas de Orders: NODE_ENV=test, loopback y nombre exacto punto_venta_integration_test. Antes de fixtures comprueba DB efectiva y SHOW CREATE PROCEDURE contra cuerpo canonico; aborta si no coincide. No aplica SQL automaticamente. Usa app/routes/service/mappers/procedure reales y dos negocios UUID propios; solo categorias/productos, sin planes/usuarios/stock/ventas. Config publica cambia solo en memoria durante la suite y se restaura; afterAll borra unicamente esos productos/categorias/negocios en transaccion y verifica limpieza, sin desactivar FKs.

20 casos preparados cubren los diez grupos solicitados: nombre exacto/parcial/descripcion, categoria exacta/parcial/slug, search AND categorySlug, sin search, COUNT/pages y ranking. Incluyen Auriculares con Bluetooth gamer G11 y TWS M10 (sin el termino en nombre/descripcion), terminos auricular/parlante/parlantes/perfume/perfumes/cargador/bluetooth/gamer/belleza/maquillaje, case/acentos, ocho niveles/ties en cinco paginas y exclusions de tenant/inactivos. Esto es cobertura preparada/typecheckeada, no evidencia de funcionamiento real todavia.

## Aplicacion y limites

Operador confirma host/ambiente/DB y backup, revisa el SQL y coordina la actualizacion. Importar completo storefront_catalog.sql respetando DELIMITER; guardar definiciones previas para recuperacion revisada. Contiene DROP/CREATE de procedures (incluido un DROP legacy preexistente), con commits implicitos: no prometer rollback DDL. No usar baseline/install/seed completo sobre una DB existente.

Flujo: repo -> local/test -> gate HTTP/DB y verificacion instalada -> QA -> produccion, cada ambiente con autorizacion propia y definiciones alineadas. El gate preparado es exclusivamente test loopback; no usar su config/fixtures contra QA remoto o produccion. Validar en otros ambientes con el operador sin datos de test indiscriminados. No se toca produccion automaticamente.

Pendiente para cerrar: autorizacion y confirmacion de backup/DB test, aplicacion del procedure por operador o autorizacion explicita para hacerlo, gate HTTP/DB PASS con cleanup y verificacion de alineacion. MySQL/MariaDB, collation, ranking efectivo y performance real no quedan certificados por tests estaticos. LIKE con wildcard inicial y CASE tienen costo dependiente del catalogo; sin evidencia de degradacion no se agregan indices/motores ni se cambia arquitectura. Sin benchmark ni despliegue certificados.
