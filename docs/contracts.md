# Contratos entre componentes

Fuente principal de contratos transversales. Internos: [client](../client/docs/architecture.md) y [server](../server/docs/architecture.md). Preservar formatos del endpoint concreto; no existe un contrato global uniforme.

## HTTP y contextos

| Limite | Uso |
| --- | --- |
| `/api/*` | Operacion BUSINESS y rutas de sesion/contexto del negocio; los prefijos especializados se montan antes. |
| `/api/platform/*` | Administracion SaaS y sesion PLATFORM, separadas del negocio. |
| `/api/public/*` | GET de catalogo publico, sin autenticacion administrativa. |

La SPA usa `/admin/*`, `/platform/*` y home; esas rutas de navegador no son prefijos HTTP de API. `VITE_BACKEND_URL` define baseURL Axios en build; los requests del frontend agregan rutas relativas como `/customers` o `/platform/dashboard`. Verificar el valor configurado y no agregar/quitar `/api` por suposicion.

### Sesion y headers

- BUSINESS: cookies HttpOnly de backend; `requireAuth` acepta `access_token` de cookie, no Bearer para rutas de negocio. Axios envia credenciales, refresh por `/refresh`, inicializacion `/me`; login/register/refresh/logout se excluyen del reintento automatico de 401.
- PLATFORM: Axios propio usa `platform_access_token` de localStorage como `Authorization: Bearer ...`, con credenciales y refresh `/platform/auth/refresh`. Backend prioriza cookie `access_token` si existe y usa Bearer como alternativa en rutas platform; no intercambiar tokens BUSINESS/PLATFORM ni extrapolar almacenamiento BUSINESS a plataforma.
- `Content-Type: application/json` es habitual; respetar excepciones del endpoint (por ejemplo uploads). `Idempotency-Key` se usa en creacion Sales/Purchases/Orders; no es un requisito de todo POST.
- `X-CSRF-Protection: 1` acompana mutaciones BUSINESS desde Axios. El middleware actual verifica Origin permitido + header en POST/PUT/PATCH/DELETE no-platform cuando hay Origin; excluye platform y deja pasar sin Origin. Es un contrato actual, no un token CSRF por sesion. CORS permite Content-Type, Authorization, Idempotency-Key y X-CSRF-Protection con credenciales.

Evidencia: [requireAuth](../server/src/middlewares/requireAuth.ts), [CSRF](../server/src/middlewares/csrfProtection.middleware.ts), [app](../server/src/app.ts), [Axios BUSINESS](../client/src/api/axios.config.ts), [Axios PLATFORM](../client/src/views/platform/module/auth/api/platformAuth.api.ts).

## Datos y respuestas

JSON de dominio/API usa camelCase; DB rows pueden usar snake_case. Fechas viajan como strings serializadas, aunque interfaces existentes declaren Date. Documentos de cliente son strings y preservan ceros iniciales. Customers v2 no acepta/devuelve `name`; `fullName` es derivado, mientras Sales/Tickets conservan aliases `customerName`. Contrato especifico: [Customers v2](../server/src/db/CUSTOMERS_V2.md).

BUSINESS suele responder `{ status: true, message, data }`; platform usa `success` y varios middlewares tienen `status: "ERROR"`, `code` o `data`. `errors: [{ field, message }]` permite errores de campo donde se implementa. No sustituir envelopes ni asumir la misma forma en todos los errores.

### Listados

`page`/`limit` son comunes donde existe paginacion, no universales. [Sales service](../server/src/modules/businesses-app/sales/services/sales.service.ts) devuelve dentro de data `{ sales, pagination: { totalRecords, currentPage, totalPages, limit }, metrics }`; paginas empiezan en 1 y el totalPages minimo es 1. El procedimiento pagina en SQL y devuelve resumen para metricas.

[Catalog types](../server/src/modules/storefront-app/catalog/types/catalog.types.ts) define `{ items, pagination: { page, currentPage, limit, total, totalRecords, totalPages } }`. Customers GET devuelve lista completa del tenant, con search opcional y sin paginacion. Leer limites/defaults del endpoint antes de implementar un consumidor.

### Errores HTTP

| Codigo | Significado observado (segun endpoint) |
| --- | --- |
| 400 | Entrada invalida, Zod, documento Customer duplicado o regla de dominio. |
| 401 | Falta de autenticacion o token invalido/expirado; puede activar refresh del contexto. |
| 402 | Suscripcion sin acceso operativo (`SUBSCRIPTION_REQUIRED`); no tratar como sesion expirada. |
| 403 | Contexto/rol/permiso no autorizado o fallo CSRF. |
| 404 | Ruta/recurso no encontrado donde el controller lo mapea. |
| 409 | Conflicto de estado donde se implementa, por ejemplo caja cerrada en Sales. |

Tambien existen 413/429 por limites y 500 para fallos inesperados. No todos los controllers mapean iguales casos igual. Filosofia: mensajes seguros y errores de campo utiles, sin exponer SQL/secretos; mantener compatibilidad y revisar mapeo real del modulo.

## Publico frente a administracion

Catalogo: GET `/api/public/catalog`, `/categories`, `/products`, `/products/:slug` (los ultimos tres relativos a `/api/public/catalog`). Negocio seleccionado por `PUBLIC_CATALOG_BUSINESS_SLUG`; stock publico del deposito predeterminado activo y campos publicos sin costos. Los consumidores publicos/VITRUNO no deben consumir endpoints administrativos.

No hay Orders publicos. F5 implementa conversion administrativa a Sale, con frontend de conversion aun pendiente. WhatsApp/sin Orders automaticos es acuerdo de integracion externa: [ADR-007](decisions.md).

## Orders Core F3 — API administrativa implementada

Rutas relativas a `/api` con sesion BUSINESS, suscripcion operativa y permiso backend:

| Metodo/ruta | Permiso / comportamiento |
| --- | --- |
| POST `/orders` | orders.create; UUID `Idempotency-Key` obligatorio. 201 nuevo / 200 replay, `{ status: true, message, data: order, idempotentReplay }`. |
| GET `/orders` | orders.view; `{ orders, pagination, metrics }` dentro de data. |
| GET `/orders/products-by-deposit/:idDeposit` | orders.view; productos activos, incluso sin stock/stock cero y ON_ORDER. `{ items, pagination }` dentro de data. |
| GET `/orders/:id` | orders.view; header con items/snapshots. |
| PUT `/orders/:id` | orders.update; reemplazo completo solo en PENDING/CONFIRMED. |
| GET `/orders/:id/events` | orders.view; lista de eventos por ID ascendente. |
| PATCH `/orders/:id/status` | orders.change_status; body `{ status: "CONFIRMED" | "PREPARING" | "READY" }`, solo siguiente paso. |
| PATCH `/orders/:id/cancel` | orders.cancel; body `{ reason }`, trim 3..500, desde no terminales. |

Otros exitos usan `{ status: true, message, data }`. ID ajeno/inexistente se trata como no encontrado. COMPLETED no se asigna por status generico: solo por conversion F5; CANCELLED solo por cancel. Un cambio de estado invalido/no editable devuelve 409; entrada/referencia invalida 400, permiso/contexto 403, fallo inesperado 500 seguro. Los deadlocks/timeouts de lock devuelven 409 para reintento.

Extension de lectura F4.1: cada producto de `/orders/products-by-deposit/:idDeposit` incluye `imageUrl: string | null`; cada item de detalle incluye `productImageUrl: string | null`. Ambos derivan de `products.image_url` actual, con aislamiento por negocio. La imagen es enriquecimiento visual, no snapshot persistido: puede cambiar o desaparecer. Nombre/codigo/unidad/modo/precios del detalle siguen siendo historicos; un LEFT JOIN conserva la linea aun sin producto actual. No se aceptan campos de imagen en POST/PUT. Requiere actualizar los procedures de [orders.sql](../server/src/db/procedures/orders.sql); no cambia schema ni agrega migracion. Operador confirma aplicado y probado en local/test/produccion (sin verificacion productiva del agente): [F4.1](f04-1-orders-ui-polish-validation.md).

### Crear y reemplazar

```json
{
  "idCustomer": 3,
  "idDeposit": 2,
  "expectedPaymentMethodId": null,
  "fulfillmentType": "PICKUP",
  "deliveryFee": 0,
  "subtotal": 10,
  "discountTotal": 1,
  "total": 9,
  "items": [{ "idProduct": 5, "quantity": 2, "unitPrice": 5, "discount": 1, "total": 9 }]
}
```

Cliente/deposito obligatorios y activos del tenant; metodo esperado opcional/nullable y activo si se informa. Items 1..100, IDs distintos, productos activos del tenant. Precios/cantidades son numeros del presupuesto manual (precio puede ser cero); datos descriptivos/documentales y unidad/modo se toman de DB. No se acepta tenant, actor, estado ni snapshots en body. El contrato es estricto y rechaza campos desconocidos.

Cantidad positiva hasta 999999999 con maximo 2 decimales; UNIT exige entero segun producto DB. Importes no negativos, maximo 999999999999.99 y dos decimales. Bruto por linea = round half-up(cantidad * precio, 2); total linea = bruto - descuento. `subtotal` suma brutos, `discountTotal` suma descuentos de linea, `total = subtotal - discountTotal + deliveryFee`; validar todos con Decimal.js. No hay descuento global adicional.

DELIVERY requiere `delivery: { recipientName, recipientPhone, address, reference? }`: nombre 2..240, telefono texto 1..80, direccion 3..255, referencia hasta 500, tras trim. PICKUP rechaza delivery no-null y deliveryFee distinto de cero. `observation` opcional/nullable hasta 500. `deliveryFee` omitido usa 0. PUT completo limpia campos opcionales omitidos y refresca snapshots desde DB; no admite parches parciales. Delivery son datos del pedido, no una entidad sale_delivery ni asignacion de cadete.

Replay por negocio/clave devuelve el pedido existente actual sin duplicar details/eventos ni comparar hash del payload; se valida forma del body antes del replay. Un error de lectura posterior al commit no revierte la escritura: reintentar create con la misma clave.

### Consultas y permisos iniciales

Listado: `page` (1..1000000, default 1), `limit` (1..100, default 20), `search` (1..160 tras trim: numero/nombre snapshot), `status`, `idCustomer`, `idDeposit`, `fulfillmentType`, `dateFrom`/`dateTo` (YYYY-MM-DD inclusivos, sobre created_at del servidor DB). Paginacion SQL `{ totalRecords, currentPage, totalPages, limit }`; metrics del conjunto filtrado: total, totalAmount y conteo por cada estado. `totalAmount` incluye todos los estados filtrados, no representa facturacion. Productos por deposito admite page/limit/search, con stockQuantity informativo. No hay filtros arbitrarios por tenant.

Snapshots se exponen en `customerSnapshot` y campos de items; fechas serializadas. Eventos registran tipo, actor, estado previo/destino, motivo y fecha; no son un archivo completo de cada revision de items. OWNER usa shortcut existente; ADMIN recibe los cinco permisos, SELLER view/create/update y DELIVERY ninguno por defecto; overrides existentes pueden ajustar acceso. No se agregaron labels UI ni permisos administrativos de otros modulos.

Implementacion y limites de evidencia: [F3 validation](f03-orders-core-validation.md). Frontend Orders F4/F4.1 implementado; conversion backend F5 descrita debajo. Frontend de conversion F6 implementado; sin reservas ni integracion VITRUNO.

## F5 — Conversion administrativa Order -> Sale

POST `/orders/:id/convert-to-sale`: BUSINESS operativo, `orders.convert` **y** `sales.create`; UUID Idempotency-Key obligatorio. OWNER usa shortcut; ADMIN recibe convert; SELLER/DELIVERY no reciben ese grant inicial. Overrides efectivos siguen vigentes.

Body estricto: `{ idCashSession, payments, delivery? }`. Payments 1..5 con idPaymentMethod, amount positivo, status PENDING/CONFIRMED y reference/observation opcionales (limites Sales). Delivery admite metadata de proveedor documentada en F7, scheduledAt y observation; opcional/nullable. No permite tenant/actor/customer/deposit/items/montos/destinatario en body. Un PICKUP rechaza metadata delivery no-null.

Respuesta: `{ status: true, message, data: { order, sale }, idempotentReplay }`. 201 nueva; 200 replay. GET detalle Order agrega `linkedSale: { idSale, saleNumber, status: "COMPLETED" | "CANCELLED" } | null`. Sales agrega en sus respuestas `idOrder: number | null` y `deliveryFee: number`.

Solo READY inicia conversion. El pedido bloqueado provee cliente, deposito, items, cantidades, precios, descuentos y totales; expectedPaymentMethodId no crea pagos. Se preserva deliveryFee: total = subtotal - discountTotal + deliveryFee. Sales directo acepta deliveryFee opcional (default 0); no acepta idOrder desde HTTP. Incompatibilidades con Sales (precio cero, limites delivery, aritmetica, etc.) se rechazan sin ajustes. Observacion Order de mas de 255 unidades de texto del validador se conserva solo en Order, sin truncar.

Pagos suman Sale.total. PICKUP no permite PENDING; DELIVERY si. Caja del tenant, OPEN y registro activo; referencias activas del tenant validadas por Sales. Stock suficiente al convertir, incluso ON_ORDER. DELIVERY crea entrega con destinatario/telefono/direccion/referencia de Order y metadata complementaria del request. Venta, detalles, stock/movimientos, pagos/eventos, entrega/eventos y READY -> COMPLETED/evento se confirman en una transaccion.

El row lock de Order y UNIQUE sales(idBusiness,idOrder) aseguran un solo vinculo. COMPLETED con venta vinculada devuelve esa venta incluso cancelada y con otra key libre, sin repetir efectos ni comparar payload. Key perteneciente a POS/otro Order: 409 IDEMPOTENCY_KEY_CONFLICT (tambien en diferencias de mayusculas UUID). READY con venta o COMPLETED sin venta: 409 ORDER_SALE_INCONSISTENT. Estado distinto de READY para conversion nueva: 409 ORDER_NOT_READY. Stock/caja/deadlock: 409; validacion/referencias: 400; tenant ajeno/inexistente: 404; permisos/actor: 403; inesperados: 500 seguro. Cancelar Sale conserva Order COMPLETED y no habilita reconversion. Status generico sigue rechazando COMPLETED.

Operador confirma SQL F5 aplicado y el gate real F5 paso 11/11 al iniciar F6; no se verifico produccion. F6 implementado, sin reservas ni Orders publicos. Evidencia y limites: [F5 validation](f05-order-to-sale-backend-validation.md).

## F7 — Proveedor Delivery y anulacion segura

Creacion directa Sales, metadata de conversion Orders y PATCH /deliveries/:id/assign aceptan providerType null/INTERNAL/THIRD_PARTY. INTERNAL exige assignedToUserId (usuario DELIVERY activo del tenant); THIRD_PARTY exige externalProviderName (trim, 1..120), assignedToUserId null y admite externalReference (150), externalContactName (160), externalContactPhone (80), externalCost (no negativo, dos decimales, nullable). Sin asignar: providerType null, usuario y campos externos nulos. INTERNAL no admite campos externos. No hay tabla maestra ni usuario para proveedores externos.

Compatibilidad de request: providerType omitido + usuario implica INTERNAL; omitido sin usuario implica null. Nunca se infiere THIRD_PARTY; null explicito con usuario es invalido. Nuevos clientes envian providerType explicitamente. Campos anteriores de destinatario/direccion/programacion/observacion se mantienen. Order conversion solo agrega metadata de proveedor, no acepta editar destinatario, productos o totales de Order. Responses Delivery (incluida Sale.delivery) incluyen campos explicitos camelCase y costo nullable numerico.

Crear sin proveedor produce PENDING; INTERNAL/THIRD_PARTY producen ASSIGNED/assignedAt. Assign exige INTERNAL o THIRD_PARTY, solo PENDING/ASSIGNED, permite cruzar entre ambos tipos y registra metadata previa/nueva. Reschedule FAILED -> PENDING borra proveedor/datos externos actuales y conserva la asignacion anterior en eventos. State machine existente permanece; no iniciar sin proveedor. deliveries.assign conserva su permiso; tercero requiere deliveries.view_all y deliveries.update_status para operar, cadete propio conserva acceso row-level. Busqueda incluye nombre/referencia externa; no se agrega filtro nuevo.

externalCost es logistica informativa; no modifica sales.deliveryFee, Sale.total, pagos, caja o rendiciones. Tercero con PENDING + affects_cash no inicia reparto: THIRD_PARTY_PENDING_CASH_PAYMENT_NOT_ALLOWED. Tampoco se permite crear/cambiar a efectivo pendiente en tercero ya en camino/entregado. Pagos no-cash pendientes conservan comportamiento actual. No hay settlement externo; efectivo de tercero puede confirmarse por el negocio segun reglas de pagos vigentes, no cobrarse como un empleado externo ficticio.

Anulacion de Sale DELIVERY solo con entrega PENDING/ASSIGNED/FAILED y sin pagos COLLECTED/CONFIRMED ni pagos con idCashSettlement. Efectos reversibles existentes en la misma transaccion: Sale CANCELLED, PENDING pagos cancelados/eventos, entrega cancelada/evento, stock restaurado. No se reabre Order COMPLETED ni se habilita reconversion. POS sin Delivery conserva su politica de caja/anulacion previa, con proteccion adicional de pagos rendidos.

Errores de anulacion 409 con code y mensaje seguro: DELIVERY_IN_TRANSIT_CANNOT_BE_CANCELLED (en camino), DELIVERED_SALE_RETURN_REQUIRED (entregada), DELIVERY_SALE_REFUND_REQUIRED (cobrada/confirmada), SALE_PAYMENT_ALREADY_SETTLED (rendido), DELIVERY_CANNOT_BE_CANCELLED (otros estados no admitidos). Venta ajena/inexistente 404; fallos inesperados 500 seguro. Frontend explica bloqueos conocidos y mapea tambien codigos legacy, sin ofrecer reembolso ni restaurar stock de entregadas. Reglas nuevas de proveedor/asignacion usan errores de dominio 400 y autorizacion efectiva existente. [Validacion F7](f07-delivery-providers-cancellation-validation.md).


## F8 — Returns & Refunds Core (contrato para F9)

BUSINESS operativo autenticado. OWNER shortcut; ADMIN recibe sale_returns.view/create. SELLER/DELIVERY sin grants iniciales, overrides efectivos conservados. No reutiliza sales.cancel ni expone API publica.

| Endpoint | Permiso / respuesta |
| --- | --- |
| POST /sales/:idSale/returns | sale_returns.create; Idempotency-Key UUID obligatorio. 201 primera creacion, 200 replay. `{ status: true, message, data: { saleReturn, summary, idempotentReplay } }`. |
| GET /sales/:idSale/returns | sale_returns.view; `{ status: true, data: { returns, summary, returnableItems, refundablePayments, remainingDeliveryFeeRefund } }`. |
| GET /sale-returns/:idSaleReturn | sale_returns.view; `{ status: true, data: { saleReturn, summary } }`. Summary actual de la Sale, no snapshot al crear Return. |

Body estricto POST: `{ reason, observation?, deliveryFeeRefund?: 0, items: [{ idSaleDetail, quantity, restock }], refunds: [{ idSalePayment, amount, reference?, observation? }], idCashSession? }`. Reason trim 3..500; observacion hasta 500; reference hasta 150. Items requeridos 0..100, IDs unicos, cantidad positiva hasta 999999999 y dos decimales (UNIT entero segun producto DB). Refunds requeridos 0..5, IDs unicos, importe positivo hasta 999999999999.99 con dos decimales. Envio no negativo con ese mismo limite/precision. Minimo una linea o envio positivo. `refunds: []` solo puede sumar una devolucion de importe cero (producto de valor cero), sin caja. IDs positivos safe integer. No acepta tenant, actor, producto, precio, importe de linea, deposito, payment method ni affectsCash del cliente.

Solo Sale COMPLETED, sin PENDING ni COLLECTED y total CONFIRMED cubriendo Sale.total; pagos CANCELLED no cuentan. OUT_FOR_DELIVERY bloquea. Lineas y pagos se verifican contra la misma Sale/tenant. Cantidad acumulada <= vendida; refund acumulado por pago <= amount; envio acumulado <= delivery_fee. Linea parcial = round half-up(subtotal neto original * cantidad / cantidad vendida, 2), limitada al saldo monetario; ultima cantidad usa saldo exacto. Suma de refunds debe ser exactamente merchandiseAmount + deliveryFeeRefund. Sin credito a favor ni cambio de metodo.

Cash segun metodo original referenciado: requiere idCashSession actual del negocio, OPEN y caja activa, actor activo/autorizado; crea EXPENSE SALE_REFUND dentro de la misma transaccion y registra IDs. Noncash: idCashSession debe omitirse/null, sin movimiento; reference/observation documentan el reembolso externo. No reescribe payment CONFIRMED, idCashSettlement ni settlements. restock true incrementa stock en Sale.idDeposit y audita SALE_RETURN con reference al Return; false no toca stock.

Full se determina por cantidades, no dinero: cancela Delivery PENDING/ASSIGNED/FAILED y crea evento con reason full sale return + idSaleReturn. Parcial conserva estado; DELIVERED conserva historia. Puede reembolsarse luego el saldo de envio, aun si la devolucion completa previa cancelo la entrega. Sale/Order siguen COMPLETED, sin escribir order_events; Sale.total y metricas gross previas no cambian. Sale con cualquier Return ya no se anula (409 SALE_WITH_RETURNS_CANNOT_BE_CANCELLED).

SaleReturn incluye idSaleReturn/idSale, returnNumber/saleNumber, reason/observation, merchandiseAmount/deliveryFeeRefund/totalRefund, createdBy `{idUser,name}`, createdAt, items `{idSaleReturnItem,idSaleDetail,idProduct,productName,barcode,quantity,refundAmount,restock}` y refunds `{idSaleRefund,idSalePayment,paymentMethodName,affectsCash,amount,idCashSession,cashMovement,reference,observation}`. cashMovement null o `{idCashMovement,movementType: EXPENSE,category: SALE_REFUND}`. Nombres/barcode/unidad provienen del producto/metodo vigente relacionado: sale_details no tiene snapshot descriptivo de producto; cantidades/precios/subtotal originales siempre de sale_details.

Summary: returnStatus NONE/PARTIAL/FULL por cantidades, refundStatus NONE/PARTIAL/FULL por dinero; returnedMerchandiseAmount, refundedDeliveryFee, refundedTotal, netSaleAmount = Sale.total - refundedTotal. returnableItems incluye producto `{idProduct,productName,barcode,unitType}`, soldQuantity/returnedQuantity/remainingQuantity/remainingRefundAmount. refundablePayments incluye idSalePayment, paymentMethod `{idPaymentMethod,name}`, amount/alreadyRefunded/remainingRefundable, affectsCash/status (saldo reembolsable cero si no CONFIRMED). Saldos de GET son informativos: POST vuelve a validar elegibilidad/limites bajo locks.

Idempotencia por negocio/UUID normalizado a minusculas; hash SHA-256 de Sale y body normalizado, arrays ordenados por IDs, opcionales null equivalentes. Misma clave/body devuelve mismo Return sin efectos; otra Sale/body con esa clave => 409 IDEMPOTENCY_KEY_CONFLICT. Se valida formato de request antes de replay. Respuesta/summary se leen despues del commit; un fallo de lectura no revierte y se recupera con la misma clave/body. Sin PUT/PATCH/DELETE/cancel Return.

Errores de dominio seguros: SALE_RETURN_SALE_NOT_FOUND 404 (tambien Return ajeno/inexistente), SALE_RETURN_ACTOR_INVALID 403; IDs/campos/formato, ITEM_NOT_FOUND/PAYMENT_NOT_FOUND, INVALID_UNIT_QUANTITY, REFUND_TOTAL_MISMATCH y CASH_SESSION_NOT_ALLOWED 400. Conflictos 409: SALE_RETURN_SALE_CANCELLED, DELIVERY_IN_TRANSIT, PENDING_PAYMENT_MUST_BE_RESOLVED, COLLECTED_PAYMENT_MUST_BE_SETTLED, PAYMENT_COVERAGE_REQUIRED, QUANTITY_EXCEEDED, DELIVERY_FEE_EXCEEDED, PAYMENT_NOT_CONFIRMED, PAYMENT_AMOUNT_EXCEEDED, CASH_SESSION_REQUIRED/CASH_SESSION_CLOSED (todos con prefijo SALE_RETURN_), IDEMPOTENCY_KEY_CONFLICT y SALE_RETURN_CONCURRENT_CHANGE (deadlock/timeout, reintentar). SQL inesperado: 500 generico, sin detalles SQL/stack. Validacion Zod conserva `errors: [{field,message}]`.

Implementacion sin frontend ni SQL ejecutado F8: [evidencias](f08-returns-refunds-core-validation.md).

## F10.1 — Wholesale Pricing Core

Extensiones aditivas, sin nuevos endpoints ni permisos. Fechas JSON son strings/null. [Evidencia y limites](f10-1-wholesale-pricing-core-validation.md).

| Contrato | Extension |
| --- | --- |
| GET `/api/businesses` y respuesta PATCH `/api/businesses/me` | wholesaleEnabled boolean y wholesaleMinimumAmount number/null; defaults false/null. |
| PATCH `/api/businesses/me` | Permiso business.update existente. Enviar ambos campos juntos al cambiar politica. Habilitar requiere minimo positivo, maximo 999999999999.99 y dos decimales. Deshabilitado admite minimo positivo o null. Patches ajenos a la politica la conservan. |
| Customers GET lista/detalle y respuestas create/update/status | pricingTier RETAIL/WHOLESALE y wholesaleSince string/null. Create sigue RETAIL/null; schemas estrictos rechazan escrituras de tier/fecha. No hay edicion manual del tier en F10.1. |
| POST `/api/sales` | pricingType opcional RETAIL/WHOLESALE, default RETAIL. BUSINESS, sales.create y key UUID existentes. No admite el valor UI SALE. Tenant/actor vienen de la sesion. |
| Sales GET lista/detalle y respuestas create/cancel | pricingType RETAIL/WHOLESALE/null. Historia previa NULL, sin inferir desde precios ni tier actual. |
| GET `/api/public/catalog` | Dentro de data agrega pricing: { wholesaleEnabled, wholesaleMinimumAmount } junto a nombre/slug/logo/tipo. |
| GET `/api/public/catalog/products` y `/api/public/catalog/products/:slug` | Producto agrega priceSale y priceWholesale number/null. price permanece alias de priceSale. Listado en data.items; detalle en data. |

Ejemplo de configuracion administrativa: `{ "wholesaleEnabled": true, "wholesaleMinimumAmount": 50000 }`. No se aplica globalmente ni se hardcodea en dominio. Catalogo publica politica real del negocio ACTIVE seleccionado por PUBLIC_CATALOG_BUSINESS_SLUG; no acepta tenant arbitrario del visitante. Proyecciones y mappers propios publicos excluyen costos, margenes, proveedores y datos privados de Customers.

WHOLESALE exige negocio habilitado, Customer activo del mismo tenant y cada producto activo del tenant con price_wholesale positivo. Backend compara cada unitPrice con precio mayorista DB vigente; no corrige silenciosamente ni hace fallback minorista. Candidato = suma de round-half-up(cantidad * precio mayorista DB, 2), antes de descuentos y sin envio. Cantidad positiva con maximo dos decimales, UNIT entero. Customer RETAIL debe alcanzar minimo global; WHOLESALE no lo repite. Descuentos/pagos/totales conservan reglas Sales existentes.

RETAIL conserva precios explicitos/manuales del contrato previo y presupuestos convertidos desde Orders. La UI Sales calcula precios desde su selector SALE/WHOLESALE pero hoy no envia pricingType: F10.1 no modifica ese cliente ni infiere WHOLESALE por coincidencia de importes. Para validacion/promocion nueva el consumidor debe enviar pricingType WHOLESALE. Precios manuales permanecen disponibles en RETAIL; WHOLESALE requiere precio de catalogo y conserva descuentos explicitos. No hay un motor nuevo de overrides.

Primera venta WHOLESALE valida promueve Customer en la misma transaccion; wholesaleSince se asigna una sola vez. Cancelacion/devolucion parcial o total no degrada ni reescribe esa fecha. Replay conserva politica Sales previa: devuelve venta existente sin hash de payload y sin recalcular politica/precios/promocion/fecha; forma del request validada antes de replay. Orders no recibe campos/endpoints ni reglas nuevas; su conversion mantiene RETAIL. No hay login publico Customers, checkout ni Orders publicos.

Errores nuevos HTTP 400 `{ status: false, code, message }`: WHOLESALE_DISABLED, WHOLESALE_CUSTOMER_REQUIRED, WHOLESALE_CUSTOMER_INVALID (cabecera rechaza referencia ajena/inactiva), WHOLESALE_CUSTOMER_NOT_FOUND, WHOLESALE_CUSTOMER_INACTIVE (revalidacion bajo lock), WHOLESALE_MINIMUM_NOT_REACHED, WHOLESALE_PRICE_MISSING (incluye producto ajeno/inactivo), WHOLESALE_PRICE_MISMATCH y WHOLESALE_INVALID_QUANTITY. No se revela identidad de otro tenant. Deadlock/timeout create devuelve 409 SALE_CONCURRENT_CHANGE: reintentar misma key. SQL inesperado en create devuelve 500 generico sin SQL/stack; Zod conserva errores por campo y reglas previas de idempotencia.
