# F10.2 — Wholesale Pricing Admin Frontend: evidencia

Fecha: 2026-11-05. Estado: CLOSED al alcance validado. Checkout inicial limpio en dev, HEAD f614b6a79b0d101481ebc25e36ab6e5545c20b0a (F10.1). El prompt aporta antecedente master/PR, pero se trabajo en el checkout actual compatible y se mantuvo dev conforme AGENTS; sin Git writes ni cambio de rama.

## Gate real F10.1 previo al frontend

Autorizacion expresa y confirmacion de SQL local/test sincronizado provienen del prompt F10.2. Se revisaron guards, setup, preflight, fixtures y limpieza antes de ejecutar. Desde server: `node node_modules/vitest/vitest.mjs run --config vitest.wholesale-pricing-integration.config.ts`.

Resultado: **19/19 PASS**, 1 archivo; duracion informada 8.08 s. Host restringido a loopback, DB exacta punto_venta_integration_test, NODE_ENV=test. Preflight de columnas y firma actualizado aprobado; afterAll y asserts de cleanup de tenants/usuarios UUID aprobados, sin reset ni desactivar FKs. Primer intento sandbox fallo EPERM de cache Vitest; corrida fuera del sandbox mantuvo config/guards. No requirio correcciones backend/SQL. [Evidencia F10.1 actualizada](f10-1-wholesale-pricing-core-validation.md).

Se ejecutaron operaciones HTTP/SQL reales de prueba y cleanup en DB test. No se ejecutaron migraciones, DDL, configuracion de VITRUNO ni SQL productivo. SQL local/test sincronizado es confirmacion del operador; no se afirma sincronizacion ni prueba de produccion.

## Implementacion por superficie

| Superficie | Resultado |
| --- | --- |
| Mi Empresa | BusinessResponse/UpdateBusinessBody incorporan enabled/minimum; perfil muestra estado/minimo sin cifra engañosa si null. Modal existente agrega Switch y minimo, valida texto antes de convertir a number, habilitado >0/maximo backend/dos decimales y deshabilitado false/null. Envia ambos campos, conserva draft/errores al fallar y bloquea edicion sin business.update. |
| Customers | CustomerPricingTier y wholesaleSince string/null, badge Minorista/Mayorista y fecha solo si existe. Sin selector/fecha editable, ni campos nuevos en create/update Customers. |
| Nueva Venta | Hook recibe politica y Customers existentes, deriva effectivePricingType y carrito renderizado desde un unico borrador, sin estado duplicado/effect de sincronizacion de precios. Indicador y progreso reemplazan selector libre. Payload manda RETAIL/WHOLESALE explicito, nunca SALE. |
| Detalle Sale | Tipo historico Minorista/Mayorista/No registrado para RETAIL/WHOLESALE/NULL. No se infiere desde Customer actual. |

Formulario de politica conserva minimo como string para poder detectar entrada invalida antes de conversion. Zod rechaza vacio, NaN, Infinity, exponentes, negativos, cero habilitado, exceso de precision/maximo; error inline asociado al campo. Al deshabilitar limpia minimo y envia null. Cierre/save deshabilitados durante mutation; fallo backend conserva campos y mensaje. Permiso existente, sin grants nuevos.

## Regla de pricing y carrito

Politica deshabilitada o consumidor final => RETAIL. Customer RETAIL requiere todas las lineas con precio mayorista finito/positivo y candidato >= minimo configurado; Customer WHOLESALE habilitado no repite minimo. Candidato Decimal suma round-half-up(quantity * priceWholesale, 2) por linea, antes de descuentos/envio/pagos. UNIT entero y precision maxima dos decimales en otras unidades. Sin hardcode de minimo en dominio.

Cambios de Customer, cantidades, altas/bajas, politica o precios actualizados derivan de nuevo modo, unitPrice, descuentos y totales en el mismo render; submit consume esa misma derivacion. Se mantiene descuento porcentual de linea/global y la aritmetica monetaria se redondea por linea, compartiendo calculo de descuentos/totales con el payload. No se agregan promociones ni motor de descuentos.

Cliente RETAIL admite producto sin mayorista y todo el carrito permanece/vuelve RETAIL, incluso si antes calificaba. Para Customer WHOLESALE, scanner/hook/picker bloquean agregar un producto sin precio valido con explicacion. Si ya estaba en carrito al cambiar Customer, permanece visible, muestra aviso y bloquea submit; no se elimina ni se usa fallback minorista. Una linea incompatible muestra calculo temporal cero y no habilita una venta hasta resolverla. Cambiar deposito conserva confirmacion de vaciado existente. Refetch actualiza metadata/precios sin borrar lineas ni cambiar cantidades; resultados viejos de consultas se descartan.

Pagos distribuidos manualmente no se ajustan al cambiar pricing; balance detecta diferencia. Pago unico implicito sigue el total. Mutex cubre validacion de caja y POST; overlay/estado de proceso evita doble envio. UUID/fingerprint conserva intento ante red/500/SALE_CONCURRENT_CHANGE si payload no cambia; payload cambiado inicia otro intento. Backend sigue siendo autoridad.

Errores mayoristas se traducen a mensajes conocidos seguros; no se muestra message SQL arbitrario. Rechazo por politica/cliente/precio/cantidad requiere refresh de Business, Customers y productos del deposito, informa al operador y no reenvia automaticamente. Fallo de refresh conserva bloqueo y ofrece retry. Exito WHOLESALE refresca Customers; fallo de esa lectura informa que la venta ya se registro y bloquea la siguiente hasta actualizar. Esto permite reconocer promocion y comprar por debajo del minimo en la siguiente venta.

POS requiere business.view para cargar politica (permiso ya incluido inicialmente para SELLER); no se amplian permisos como alternativa a una lectura fallida. Si no se puede leer politica/cliente seleccionado, no se presume que corresponde RETAIL: se bloquea hasta resolver carga.

## Pruebas persistentes y tecnicas

| Verificacion ejecutada | Resultado |
| --- | --- |
| node --test scripts/wholesale-pricing.test.mjs | 71/71 tests nuevos PASS |
| node --test scripts/wholesale-pricing.test.mjs scripts/sale-returns.test.mjs scripts/sale-print.test.mjs | 141/141 PASS: 71 nuevos + 52 Returns + 18 Print |
| npm run build (client) | PASS, tsc -b + Vite; warnings previos de bundle >500 KB e imports dinamicos inefectivos |
| node node_modules/eslint/bin/eslint.js + las 15 fuentes TS/TSX afectadas del inventario | PASS, sin errores/warnings; lint global no reejecutado, deuda anterior ajena no corregida |

Nuevo script `npm run test:wholesale-pricing`, node:test y compilador TypeScript instalado, sin dependencias/framework nuevos. Helpers/schema se transpilan en memoria; ningun import backend o conexion DB. Cubre politica disabled/ausente/invalida, cliente nulo/inactivo, RETAIL menor/exacto/mayor/configurable, WHOLESALE por debajo, precios faltantes/no finitos, cantidades/half-up, descuentos/envio ignorados para candidato, cambio de cliente y vuelta a RETAIL sin perder lineas/porcentajes, precios actualizados, payload de linea, labels historicos, codigos seguros/refresh y validacion/payload de settings.

Revision final: 28 archivos inventariados (25 tracked y tres nuevos), 294 enlaces Markdown locales y 97 imports locales/alias comprobados. Whitespace revisado tambien en archivos nuevos; git diff --check aprobado, git status --short y git diff --stat inspeccionados; rama dev preservada. Allowlist confirma ausencia de cambios backend/SQL/Orders/Print y de harness temporal en el repo.

## QA funcional A..M

Paginas/componentes reales montados con Helmet/MemoryRouter y estado de sesion ficticio. Adaptador Axios BUSINESS en memoria; nunca se llama backend/DB durante QA frontend. Pruebas de UI distinguibles del gate backend real anterior.

| Caso | Resultado comprobado |
| --- | --- |
| A/B | Politica deshabilitada usa RETAIL con cliente RETAIL o WHOLESALE. |
| C | Consumidor final permanece RETAIL aun con candidato suficiente. |
| D | Candidato 49999 usa minorista, aunque equivalente minorista es 75000. |
| E/F | Candidato exacto 50000 o superior aplica mayorista y aviso de promocion. |
| G | POST capturado envia WHOLESALE y unitPrice 10000; refetch Customers posterior; siguiente venta reconoce promocion. La promocion economica real se probo en gate F10.1. |
| H | Customer WHOLESALE compra baja sin minimo. |
| I/J | Agregar linea sin precio al minorista permite RETAIL; cambiar luego a mayorista conserva linea, explica incompatibilidad y bloquea submit. |
| K | Bajar cantidad de 5 a 4 vuelve automaticamente a RETAIL. |
| L | Descuento no cambia elegibilidad/candidato. |
| M | Detalle RETAIL/WHOLESALE/NULL muestra labels correctos sin inferencia. |

Matriz adicional: perfil/politica, modal valido/invalido/save, false/null, error backend preservando draft, tier/fecha Customers y form sin controles comerciales, error de precio con refresh explicito sin SQL, permisos business.update y pagos manuales 30000/20000 conservados al cambiar total (checkout queda bloqueado por diferencia).

**32/32 casos de UI PASS**, 99 asserts registrados en results.json. Viewports comprobados: desktop 1424 px, tablet 768 px, movil real 390x844 mediante iframe. Capturas inspeccionadas de las cuatro superficies y errores. Se detecto y corrigio desborde de grilla POS en tablet con min-w-0/grid-cols-1 locales; cards vuelven a quedar dentro del viewport y tablas conservan scroll interno. Modales tienen limites de altura, labels/errores asociados y foco inicial visible. No se afirma prueba completa con teclado, navegador interactivo, hardware movil, lector de pantalla ni impresora.

Herramientas CUA y node_repl fallaron al inicializar assets; Chrome headless existente sirvio de fallback para renderizar/probar el harness propio. Chrome/Vite requirieron salir del sandbox para compartir loopback; sin API externa ni credenciales de usuario. Chrome impone minimo de ventana de 500 px: se descarto la captura movil inicial recortada y se repitio en iframe 390x844. Se corrigio una espera del harness al cerrar el dialogo de exito antes de abrir selector; no fue un bug del producto. Resultados finales aprobados.

Artefactos fuera del repo: `C:/Users/Abrah/.codex/visualizations/2026/10/31/01a18f43-9087-77d1-84c1-f46376335b8d/wholesale-pricing-qa` contiene results.json, DOM snapshots, capturas y copia del harness. Fuentes temporales client/wholesale-qa* y perfil Chrome aislado removidos; Vite detenido al terminar. No se deja harness ni API simulada en la aplicacion.

## Limites y cierre

Sin cambios de codigo backend, schema, procedures, Orders, Returns, SalePrintDocument, client/text.txt o repo/UX VITRUNO. No hay filtros nuevos de ventas ni endpoints/tablas/permisos nuevos. Produccion no consultada ni sometida a suite. No se ejecuto deploy, migracion ni configuracion real de negocio. El frontend fue probado con adaptador en memoria y el backend por separado contra DB test: no es E2E del frontend contra API real.

Docs actualizadas: tasks/state, arquitectura/testing client, contrato de consumo, estado de gate F10.1 y referencias DB/backend. ADR-011 solo actualiza estado/antecedente; no agrega decision comercial nueva. Sin Git writes: no add/commit/push/pull/checkout/merge/rebase/reset. Rama dev preservada.

Commit sugerido: `feat(pricing): integrar precios mayoristas en el panel administrativo`.

Descripcion: configurar politica en Mi Empresa, visualizar tier/fecha en Clientes, derivar pricing del POS con payload y recalc coherentes, refrescar promocion y mostrar historico en detalle. Incluir helpers/tests persistentes, QA responsive y evidencia del gate real F10.1. Sin cambios backend/SQL/Orders/VITRUNO.

## Inventario de archivos modificados/creados

- [client/docs/architecture.md](../client/docs/architecture.md)
- [client/docs/testing.md](../client/docs/testing.md)
- [client/package.json](../client/package.json)
- [client/scripts/wholesale-pricing.test.mjs](../client/scripts/wholesale-pricing.test.mjs)
- [client/src/views/businesses-app/module/businesses/components/card/BusinessProfileCard.tsx](../client/src/views/businesses-app/module/businesses/components/card/BusinessProfileCard.tsx)
- [client/src/views/businesses-app/module/businesses/components/modal/UpdateBusinessModal.tsx](../client/src/views/businesses-app/module/businesses/components/modal/UpdateBusinessModal.tsx)
- [client/src/views/businesses-app/module/businesses/hooks/useBusinesses.ts](../client/src/views/businesses-app/module/businesses/hooks/useBusinesses.ts)
- [client/src/views/businesses-app/module/businesses/page/BusinessesPage.tsx](../client/src/views/businesses-app/module/businesses/page/BusinessesPage.tsx)
- [client/src/views/businesses-app/module/businesses/types/index.ts](../client/src/views/businesses-app/module/businesses/types/index.ts)
- [client/src/views/businesses-app/module/businesses/validations/businesses.validations.ts](../client/src/views/businesses-app/module/businesses/validations/businesses.validations.ts)
- [client/src/views/businesses-app/module/customers/components/table/CustomersTable.tsx](../client/src/views/businesses-app/module/customers/components/table/CustomersTable.tsx)
- [client/src/views/businesses-app/module/customers/types/customers.types.ts](../client/src/views/businesses-app/module/customers/types/customers.types.ts)
- [client/src/views/businesses-app/module/sales/components/create/ProductEntrySection.tsx](../client/src/views/businesses-app/module/sales/components/create/ProductEntrySection.tsx)
- [client/src/views/businesses-app/module/sales/components/details/SaleDetailsView.tsx](../client/src/views/businesses-app/module/sales/components/details/SaleDetailsView.tsx)
- [client/src/views/businesses-app/module/sales/components/modal/ProductSelectionModal.tsx](../client/src/views/businesses-app/module/sales/components/modal/ProductSelectionModal.tsx)
- [client/src/views/businesses-app/module/sales/helpers/wholesale-pricing.helpers.ts](../client/src/views/businesses-app/module/sales/helpers/wholesale-pricing.helpers.ts)
- [client/src/views/businesses-app/module/sales/hooks/useSales.ts](../client/src/views/businesses-app/module/sales/hooks/useSales.ts)
- [client/src/views/businesses-app/module/sales/page/CreateSalePage.tsx](../client/src/views/businesses-app/module/sales/page/CreateSalePage.tsx)
- [client/src/views/businesses-app/module/sales/types/index.ts](../client/src/views/businesses-app/module/sales/types/index.ts)
- [docs/contracts.md](../docs/contracts.md)
- [docs/database.md](../docs/database.md)
- [docs/decisions.md](../docs/decisions.md)
- [docs/f10-1-wholesale-pricing-core-validation.md](../docs/f10-1-wholesale-pricing-core-validation.md)
- [docs/f10-2-wholesale-pricing-admin-frontend-validation.md](../docs/f10-2-wholesale-pricing-admin-frontend-validation.md)
- [docs/project-state.md](../docs/project-state.md)
- [docs/tasks.md](../docs/tasks.md)
- [server/docs/testing.md](../server/docs/testing.md)
- [server/src/db/README.md](../server/src/db/README.md)
