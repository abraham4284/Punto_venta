# F4 — Orders Admin Frontend

Fecha: 2026-10-30. Base: `dev`, HEAD `31beded0e6111c6c8548a7fbd0b13e935b79d74b`, limpio al comenzar. La referencia master aportada no reemplazo el checkout inspeccionado. No se cambio de rama ni se hizo staging/commit/push.

## Implementado

[Modulo Orders](../client/src/views/businesses-app/module/orders/index.ts) con types, API tipada, helpers/Decimal.js, Zod, hooks, componentes, pages y routes. Reutiliza useForm, useCustomers, useDeposits, usePaymentMethods, useCan, Axios BUSINESS, UI existente y helper createIdempotencyKey.

- `/admin/orders`: listado operativo, numero/fecha/cliente snapshot/modalidad/estado/monto, detalle/edicion segun permiso. Metricas del conjunto filtrado (total, pendientes, confirmados, preparando, listos, cancelados y monto de pedidos, sin tratarlo como facturacion).
- Filtros search/status/customer/deposit/fulfillment/dateFrom/dateTo/limit aplicados explicitamente; vuelven a page 1 al aplicar/limpiar. Paginacion SQL segun response; no se pagina ni filtra solo la pagina en memoria.
- `/admin/orders/new` y `/:idOrder/edit`: formulario compartido, cliente/deposito obligatorios, metodo esperado opcional, PICKUP/DELIVERY, observacion y 1..100 productos. PUT completo solo PENDING/CONFIRMED; inicializa carrito desde lineas historicas y conserva datos ante errores.
- Catalogo paginado/buscable exclusivo de `/orders/products-by-deposit/:idDeposit`; muestra codigo/unidad/modo/precio/stock sin asumir imageUrl. Disponibilidad se refresca al cambiar deposito; un producto no encontrado queda con disponibilidad desconocida, sin eliminar la linea historica. Stock cero/insuficiente y ON_ORDER no bloquean agregado/submit.
- Cantidad por unidad, dos decimales, precio cero valido, descuentos por linea y totales con Decimal.js half-up. Campos vacios no se convierten silenciosamente en cero valido. Zod valida contrato y muestra errores de campo/lista sin borrar datos.
- POST conserva clave y fingerprint para retries del mismo payload tras respuesta incierta; cualquier edicion del formulario/carrito invalida la clave, y exito/replay la limpia. PUT/status/cancel no agregan ese header.
- Confirmacion de creacion con numero/estado y acciones Ver/Nuevo/Lista segun permiso; detalle muestra snapshots, nombres de deposito/metodo via hooks existentes, entrega, items/totales y timeline con actor Usuario #id.
- Acciones de siguiente estado y cancelacion con dialogo Base UI, motivo 3..500, mutex/disabled durante proceso, aplicacion del response y recarga de detalle/eventos. READY sin siguiente CTA; COMPLETED/CANCELLED sin editar/status/cancel. Sin convertir a venta.
- Loading/error/empty/success, tablas con overflow y formularios/cards responsive, labels, aria-labels en iconos, aria-busy/status/alert y dialogos del sistema. Son decisiones de implementacion; no equivalen a QA visual/teclado realizado.

## Navegacion y permisos

AppSidebar agrega Pedidos en Operacion con list/new y activePatterns root/detail/edit/new, sin modificar otros grupos. AdminRoutes permite wrapper view/create, y rutas internas exigen view (list/detail), create (new), update (edit). Labels Orders agregados en business-users.

OWNER usa shortcut existente; ADMIN con cinco permisos ve acciones; SELLER view/create/update no ve status/cancel; DELIVERY sin grants no ve modulo. Se consume useCan/permisos efectivos, sin hardcodear nuevos grants ni sistema de roles. Overrides de solo create sin view pueden abrir formulario pero el endpoint productos requiere view; lo mismo aplica a dependencias de lectura Customers/Deposits/Payment Methods. Se muestran errores y no se amplian privilegios ni cambia backend por esa preferencia UI.

## Validaciones ejecutadas

- `npm run build` desde client: aprobado. Persisten warnings de bundle >500 kB y dynamic imports inefectivos en auth/suscripcion/toast; no se modifico bundling fuera de scope.
- `npm run lint`: falla por deuda global previa. Verificacion final equivalente `npx eslint . -f json`: 8 errores y 2 warnings, todos fuera de F4: LiGeneral.tsx (any), UI badge/button (exports Fast Refresh), useForm.ts (any), DepositModalForm.tsx y PaymentMethodModal.tsx (effects/dependencias). No se presenta lint global como aprobado.
- Lint acotado a modulo Orders, AppSidebar.tsx, AdminRoutes.tsx, module/index.ts y permission-labels.helper.ts: aprobado sin errores ni warnings. Los efectos nuevos se ajustaron para cargas cancelables sin resets de formulario.
- 51 comprobaciones ad hoc en Node con TypeScript transpilado en memoria: Zod pickup/delivery/campos/limites/duplicados/totales/errores; Decimal/redondeo; estados/terminales; key estable y regeneracion; snapshot historico; ocho endpoints y header solo POST con Axios mockeado; render SSR del carrito sin maestro, aviso stock cero/ON_ORDER sin bloqueo; cantidad entera UNIT y decimal KG. No se agrego una suite persistente de 51 tests ni se uso DB/API real para esas comprobaciones.

## QA navegador y limites

Se intento inicializar navegador mediante cua y computer-use/node_repl. Ambas herramientas fallaron con `failed to write kernel assets ... os error 3`, antes de abrir/operar la UI. Por tanto NO se ejecutaron QA visual, responsive en viewport real, teclado/foco real ni flujo navegador contra backend de desarrollo/test. El SSR del carrito no sustituye navegador/E2E. La validacion HTTP/DB de F3 es evidencia previa distinta.

No se modificaron server, SQL, grants, packages, auth ni client/text.txt; tampoco se ejecuto DB, migraciones o backend. No hay nuevos endpoints, stores globales ni librerias UI. Sin cambios de contrato HTTP ni ADRs nuevos; docs/contracts/decisions conservan la entrega F3 y sus decisiones. Se actualizan roadmap/estado y afirmaciones de arquitectura/producto que quedaron desactualizadas al existir UI.

F4 se cierra como implementacion con build/lint aplicable y comprobaciones aisladas; QA navegador queda pendiente por entorno. No hay blockers contractuales. Sin desviaciones funcionales de alcance. F5 (Order -> Sale backend) sigue NEXT, sin iniciar F5/F6, reservas ni VITRUNO.

Comprobaciones finales: 119 imports locales y 271 enlaces Markdown verificados. Scope de 30 archivos: 20 nuevos del modulo, cuatro integraciones frontend y seis documentos (incluido este). Sin modificaciones server/DB/packages/client/text.txt; sin staging. `git diff --check` aprobado, `git status --short` y `git diff --stat` revisados; archivos nuevos comprobados por separado porque stat no incluye untracked. Solo avisos de normalizacion LF/CRLF. Build y lint acotado repetidos tras los ultimos ajustes: aprobados.
