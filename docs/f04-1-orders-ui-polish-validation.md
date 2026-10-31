# F4.1 — Pulido operativo de Orders

Fecha: 2026-10-31. Checkout inicial limpio, rama `dev`, HEAD `62b91693996cdfb12e81b42c641f9dbaf5d93013`. Se trabajo sobre ese estado real, sin cambiar rama ni ejecutar staging, commit o push. El master del prompt es referencia historica.

## Implementacion

- [OrderForm](../client/src/views/businesses-app/module/orders/components/OrderForm.tsx) organiza contexto, productos, entrega y observaciones con resumen lateral sticky en escritorio y acciones finales. Reutiliza los hooks y componentes del proyecto; no agrega stores ni dependencias.
- [OrderCustomerModal](../client/src/views/businesses-app/module/orders/components/OrderCustomerModal.tsx) busca clientes activos por nombre/apellido/fullName, documento, telefono o email mediante el helper Customers v2 existente. Lista hasta 40 coincidencias y pide refinar cuando hay mas. Cliente obligatorio, sin Consumer Final ni Customer.name. Seleccion muestra documento/contacto y permite cambiarlo.
- [OrderSelect](../client/src/views/businesses-app/module/orders/components/OrderSelect.tsx) reutiliza Base UI/shadcn para deposito, metodo esperado, modalidad y filtros. No quedan selects HTML nativos en Orders. Labels, errores, disabled y seleccion controlada. No se cambia el UI compartido.
- Deposito predeterminado activo derivado de los lookups en nuevo pedido; sin default valido queda vacio. Una eleccion manual, incluso vacia, prevalece. Editar conserva el idDeposit del pedido aunque lleguen/refresquen lookups o cambie el default. Una seleccion no disponible se muestra como tal, sin reemplazarla.
- [OrderDeliverySection](../client/src/views/businesses-app/module/orders/components/OrderDeliverySection.tsx): control opt-in visible; copia fullName, phone y address del Customer actual (null -> cadena vacia). Los campos siguen editables. Cambiar cliente sincroniza solo si esta activo; desactivar conserva valores. Referencia nunca se copia. Inicialmente apagado para preservar entrega editada. PICKUP sigue enviando delivery null y deliveryFee 0.
- [OrderProductImage](../client/src/views/businesses-app/module/orders/components/OrderProductImage.tsx) en picker, carrito e impresion; imagen contenida y fallback con nombre accesible para URL nula o rota. El carrito conserva lineas/nombres/codigos/precios historicos cuando no encuentra el maestro; disponibilidad y stock insuficiente siguen siendo informativos. Stock cero y ON_ORDER no bloquean.
- [OrderPrintDocument](../client/src/views/businesses-app/module/orders/components/OrderPrintDocument.tsx): hoja de preparacion con numero, estado, fecha, cliente/documento/telefono, modalidad/entrega/referencia, deposito, productos/imagenes/codigo/cantidad/unidad/casillas visuales, observaciones y totales. No es factura ni comprobante de cobro. Portal fuera del layout con CSS de impresion que oculta el resto de body, encabezado de tabla repetible y filas sin cortes internos. Boton Imprimir pedido en detalle con orders.view, bloqueado durante carga/acciones; usa window.print y permite Guardar como PDF desde el navegador. Sin libreria PDF. El HTML/SSR fue comprobado; paginacion y resultado impreso real siguen pendientes de navegador.

## Actualizacion informada al iniciar F5 (2026-10-31)

El operador confirma que orders.sql F4.1 fue aplicado y probado en DB local, DB local de test y produccion. Esta confirmacion reemplaza el pendiente de aplicacion registrado al cierre F4.1; el agente no consulto ni verifico produccion. QA visual/impresion real del agente sigue pendiente.

## Backend minimo y despliegue

Archivos backend modificados exactamente:

1. [orders/types/index.ts](../server/src/modules/businesses-app/orders/types/index.ts): campos DB image_url/product_image_url nullable.
2. [orders.mapper.ts](../server/src/modules/businesses-app/orders/helpers/orders.mapper.ts): imageUrl/productImageUrl camelCase, null cuando no hay imagen.
3. [procedures/orders.sql](../server/src/db/procedures/orders.sql): sp_order_products proyecta products.image_url; sp_order_get agrega LEFT JOIN por idBusiness e idProduct, conservando od.* historico. No filtra detalles por actividad actual del producto.
4. [orders-core.test.ts](../server/src/tests/unit/orders-core.test.ts): dos casos de imagen nullable a traves de servicios con pool mockeado y una comprobacion estatica del join/proyeccion tenant.
5. [baseline generado](../server/src/db/generated/cajora_v1_0_full.sql): regenerado con herramienta oficial, sin editar manualmente.

Solo enriquecimiento de lectura desde la imagen actual del producto; no se guarda imagen en order_details ni se acepta en POST/PUT. Sin modificaciones de schema, migraciones, servicios, controllers, rutas, grants o permisos. [Contrato](contracts.md) actualizado.

El operador debe actualizar los procedures desde orders.sql antes de usar las imagenes con el backend desplegado. No requiere nueva migracion de schema; el baseline completo corresponde a instalaciones nuevas y no debe importarse sobre una DB existente para este cambio. No se ejecuto SQL, migracion, DB real, reset, backend ni operaciones productivas en esta tarea. La sincronizacion F3 informada anteriormente por el operador no prueba que esta extension este aplicada.

## Validaciones ejecutadas

- Client `npm run build`: aprobado (TypeScript + Vite). Persisten warnings previos de bundle >500 kB e imports dinamicos inefectivos de auth/suscripcion/toast.
- Client `npm run lint`: 8 errores y 2 warnings, todos previos fuera de Orders: LiGeneral.tsx, UI badge/button, useForm.ts, DepositModalForm.tsx y PaymentMethodModal.tsx. No se declara aprobado el lint global.
- Client `npx eslint src/views/businesses-app/module/orders`: aprobado sin errores ni warnings.
- Server `npm run typecheck` y `npm run build`: aprobados.
- Server `npx vitest run --config vitest.orders-core.config.ts`: **68 tests aprobados**, pool mockeado y setupFiles vacio. Primer intento no corrio tests por EPERM de rename del cache temporal; reintento fuera del sandbox aprobado. Sin setup de integracion ni DB.
- Server `npm run db:build-baseline` y `npm run db:validate-baseline`: aprobados. SHA-256 `fd7f9f49086e398d510fa621c8215c4a5553c54386585f3f2f229bbdef921e1e`. Validacion de archivos, sin ejecutar SQL.
- **28 comprobaciones ad hoc frontend** con TypeScript transpilado en memoria, estado de hooks simulado, API mockeada y render SSR real: default activo/ausente/asincronico, eleccion manual/vacia y edicion; autofill opcional, nulls, cambio de cliente, edicion y referencia preservada; PICKUP y payload sin imagen; stock cero/encargo; clave estable tras fallo incierto y nueva tras editar; historial sin maestro; contenido de impresion retiro/entrega, imagen y fallback nulo/roto/reintento URL nueva. No es suite persistente, React DOM interactivo ni E2E.

## QA y limites

Se reintento iniciar computer-use/node_repl y cua; ambos fallaron antes de operar la UI con `failed to write kernel assets ... os error 3`. No se ejecutaron QA visual, viewport movil/escritorio, teclado/foco, dialogo de impresion, PDF real ni flujo navegador/API/DB. SSR no sustituye esas verificaciones. Pendiente comprobarlos tras actualizar procedures en el entorno correspondiente.

Se mantiene calculo Decimal, state machine, validacion de totales, idempotencia y tenant/actor autenticados. Sin cambios de efectos economicos, caja, pagos, stock, reservas, Order -> Sale o VITRUNO. Sin ADR nuevo: se aplica el alcance acordado, sin arquitectura nueva. client/text.txt y dependencias intactos.

Comprobacion documental: 51 enlaces Markdown locales validos en los cuatro documentos de la fase. `git diff --check`, `git status --short` y `git diff --stat` revisados; scope de 24 archivos incluyendo ocho nuevos, comprobados tambien por separado. Solo avisos de normalizacion LF/CRLF. Rama dev conservada, sin staging.

F4.1 queda implementada y validada al nivel estatico/aislado anterior; no certifica impresion real ni despliegue. No hay bloqueo contractual detectado. Proxima fase funcional: F5 Order -> Sale backend, sin iniciar.
