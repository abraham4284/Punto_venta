# Ownership transaccional e idempotencia

## T1 — Transferencias de stock

El service batch abre una transacción en una conexión, llama a `sp_apply_stock_transfer_item` por producto en orden ascendente y confirma una vez. El helper participa en la transacción de su caller. En el endpoint individual, `sp_process_stock_transfer` controla la transacción y devuelve el listado histórico de movimientos después del commit.

Cada aplicación valida y toma locks compartidos sobre los depósitos activos en orden de ID. Luego bloquea el producto y valida su unidad. El lote exige producto activo y la operación individual conserva el traslado de stock de productos inactivos. Lee las filas de stock con `FOR UPDATE` en orden de ID de depósito, independientemente de la dirección de la transferencia, y valida la disponibilidad bajo lock. Si falta el destino, inserta con la clave única por negocio/producto/depósito y relee el saldo bajo lock ante una alta concurrente. El primer `TRANSFER_OUT` define la referencia que reutilizan todos los movimientos del lote.

El service revierte ante un error, libera la conexión y evalúa notificaciones por producto y depósito después de confirmar. Los conflictos de locks se reportan como 409. La verificación en el motor queda pendiente del [gate T1](../../docs/stock-batch-transfer-backend-validation.md).

La [ADR-002](../../docs/decisions.md) conserva procedures y coordinacion en services cuando el flujo lo requiere. El owner real varia: inspeccionar service y procedure completos antes de reutilizar un patron.

## Sales: creacion coordinada por service

[createSaleService](../src/modules/businesses-app/sales/services/sales.service.ts) obtiene una conexion del pool y ejecuta `beginTransaction`. Delega cabecera (`sp_create_sale`), detalles/descuento stock, pagos y entrega a createSaleWithinTransaction con esa misma conexion. El helper no inicia/confirma/revierte ni libera transacciones. Si cabecera indica `alreadyProcessed`, omite nuevos detalles/pagos/entrega.

El service hace `commit`, luego obtiene detalle de respuesta y evalua notificaciones de stock para creaciones nuevas. En catch invoca `rollback`; ante duplicado consulta la venta por negocio/clave y devuelve replay si existe, en otro caso propaga el error. `finally` libera siempre la conexion (`release`). La lectura final y notificaciones posteriores al commit no forman parte de la transaccion ya confirmada; no prometer rollback de esos efectos.

[sales.sql](../src/db/procedures/sales.sql) contiene locks `FOR UPDATE`. F5 elimina handlers ROLLBACK de creacion de cabecera/detalles para que el caller sea el unico owner; los errores se propagan. Los procedures de creacion participan en la transaccion del service; cancelacion tiene su propio START TRANSACTION/COMMIT. Por eso no agregar begin/commit anidados ni extrapolar ownership entre endpoints del mismo modulo.

## Purchases: creacion coordinada por procedure

[createPurchaseService](../src/modules/businesses-app/purchases/services/purchases.service.ts) ordena lineas por producto/deposito, serializa details con JSON.stringify y llama `sp_create_purchase` usando pool.query. No abre la transaccion en TypeScript.

[purchases.sql](../src/db/procedures/purchases.sql) posee START TRANSACTION/COMMIT y handler ROLLBACK para la creacion; recibe cabecera y detalles juntos. El service interpreta `alreadyProcessed`, evita notificaciones adicionales en replay y recupera compra existente por tenant/clave ante duplicado. No envolver ese CALL en otra transaccion sin revisar ownership y semantica DDL/SQL.

## Idempotencia, concurrencia y eventos

[Idempotency helper](../src/helpers/idempotency.helper.ts) valida `Idempotency-Key` de request. [Indices](../src/db/schema/003_add_indexes.sql) definen `uq_sales_business_idempotency` y `uq_purchases_business_idempotency` sobre negocio/clave. La restriccion UNIQUE protege carreras ademas del chequeo previo.

El mismo negocio/clave recupera el registro existente; una clave en otro negocio no autoriza acceso cruzado. Los services contemplan error de duplicado (1062/ER_DUP_ENTRY) y busqueda tenant-safe para replay. No describirlo como comparacion criptografica de payload: el flujo inspeccionado recupera por clave, sin demostrar igualdad del body.

Mantener orden de locks/lineas y misma conexion segun operacion. Evitar dobles descuentos de stock, pagos, detalles y eventos; preservar historia de dominio y montos Decimal.js. Testear replay/carreras sin DB cuando sea posible; pruebas conectadas requieren autorizacion [segun testing](testing.md).

## Orders Core F3

[Orders service](../src/modules/businesses-app/orders/services/orders.service.ts) posee begin/commit/rollback/release para create/update/status/cancel. Los procedures no abren ni confirman transacciones. Update/status/cancel bloquean cabecera por negocio/ID antes de validar el estado; las referencias activas/snapshots se leen con locks. El GET de detalle tambien bloquea cabecera durante lectura de header/items para evitar mezclar revisiones.

Create usa UNIQUE `(idBusiness, idempotency_key)`, replay temprano y recuperacion despues de rollback ante una carrera en esa clave especifica. Se libera conexion antes de recuperar replay; otras colisiones no se convierten en exito. Repetir clave devuelve pedido existente sin comparar hash de payload ni duplicar detalles/eventos. Una respuesta perdida despues de commit se recupera reenviando create con la misma clave. Lectura final de respuesta ocurre despues del commit de escritura; un fallo de esa lectura no deshace el cambio ya confirmado.

Edicion completa reemplaza detalles en la misma transaccion; eventos existentes permanecen. El evento nuevo se confirma junto con header/details o status/cancel. No se reserva/descuenta stock ni se crean ventas/pagos/caja. Deadlock/lock timeout se informa como 409 para reintento, no como operacion aprobada. Alcance de tests mockeados y limite de concurrencia real: [F3 validation](../../docs/f03-orders-core-validation.md).

## F5 — Order -> Sale

[Conversion service](../src/modules/businesses-app/orders/services/order-conversion.service.ts) posee una conexion y una transaccion de escritura. Orden: lock Order por tenant/ID, actor activo, lectura locking actual del vinculo/clave Sales, validacion READY/replay/inconsistencia, payload derivado de Order validado por Sales, createSaleWithinTransaction, sp_order_complete_from_sale y STATUS_CHANGED READY -> COMPLETED, commit. Cabecera, stock, detalles, pagos/eventos y delivery/eventos solo usan esa conexion. Los procedures de creacion Sales/Orders no abren/confirman/revierten la transaccion; errores llegan al caller para rollback total. Cancelacion Sales conserva su ownership propio y no modifica Orders.

UNIQUE tenant/order limita a una venta; UNIQUE tenant/key y guard de sp_create_sale rechazan claves de POS/otro Order. Order lock serializa conversion del mismo pedido aun con keys distintas. COMPLETED con vinculo devuelve la misma venta (incluso CANCELLED); READY con vinculo o COMPLETED sin el son conflicto, sin reparacion. Deadlocks/timeouts se exponen como 409 reintentable. La prueba real de concurrencia queda preparada; tests DB-free verifican llamadas/orden y restricciones estaticas, no el motor.

Tras commit se libera conexion y se evaluan notificaciones/leen respuestas con los servicios existentes. Esas lecturas (incluido GET Order transaccional de solo lectura) son posteriores a la transaccion economica y pueden fallar sin revertirla. Retry recupera el vinculo, sin nuevos efectos. [Evidencias](../../docs/f05-order-to-sale-backend-validation.md).

## F7 — Proveedores y cancelacion

sp_delivery_create participa en la transaccion Sales/F5, sin begin/commit propios; valida proveedor con sp_delivery_validate_provider y lock de usuario DELIVERY activo/tenant. sp_delivery_assign posee su transaccion, bloquea entrega y audita asignacion anterior/nueva. sp_delivery_change_status conserva ownership propio: bloquea Sale antes de Delivery, verifica actor/permisos row-level y bloquea salida de tercero con efectivo pendiente. Crear/actualizar pago pendiente comparte lock Sale y rechaza agregar efectivo pendiente a tercero ya en camino/entregado. No crea movimientos por externalCost ni modifica ownership de settlements.

sp_cancel_sale_and_revert_stock conserva transaccion propia y lock Sale/Delivery. Cursor de lectura locking actual sobre pagos, ordenado por idSalePayment, verifica idCashSettlement y COLLECTED/CONFIRMED antes de cualquier escritura economica. Guards en camino/entregada preceden reversion. PENDING pagos y Delivery/eventos se cancelan y stock se restaura dentro del mismo commit; cualquier error revierte todo. Cancelacion no escribe Order ni settlements. Deadlocks posibles se revierten; el gate real F7 15/15 ya aprobo en test local; no certifica otros motores/produccion ni sustituye el gate F8. [Evidencias](../../docs/f07-delivery-providers-cancellation-validation.md).


## F8 — Sale Returns / Refunds

[sale-returns.service](../src/modules/businesses-app/sale-returns/services/sale-returns.service.ts) posee begin/commit/rollback/release sobre una PoolConnection. Orden estable: Sale tenant/ID -> Delivery -> payments por ID (con payment methods) -> sale_details por ID (con products) -> devoluciones/refunds previos por ID -> actor activo -> clave idempotente -> caja actual si hay cash. Lecturas de limites previos FOR UPDATE son actuales, sin depender de un snapshot anterior a la espera del lock. Sale serializa keys distintas, cancellation y creacion de Return. Deadlock/timeout POST revierte y devuelve conflicto reintentable; no representa exito.

Valida cantidades/importes acumulados, cobertura CONFIRMED, estado y payload; inserta Return/items, stock/movimientos via [helper SQL](../src/db/procedures/sale_returns.sql) sin ownership propio, refunds/cash EXPENSE y PAYMENT_REFUNDED, y Delivery CANCELLED/evento si full pre-dispatch. Misma conexion hasta commit; cualquier error de escritura revierte todo. No llama sp_cash_movement_create porque ese procedure tiene begin/commit propios. No reescribe sales, orders/order_events, sale_payments ni settlements. Permisos efectivos se exigen en rutas; actor activo y referencias tenant-safe se revalidan dentro.

POST compara request_hash sobre body normalizado y Sale para replay; UNIQUE tenant/key protege colisiones, no convierte una key ajena en exito. Summary/detalle se leen despues del commit con otro GET consistente; un fallo alli no deshace lo confirmado y se recupera reenviando UUID/body. GET lista toma lock Sale y contexto en transaccion corta para coherencia de returns/saldos; GET Return localiza su Sale por tenant y delega esa lectura. No hay endpoints de edicion/borrado.

Anulacion F7 agrega lectura locking actual de Return antes de cualquier mutacion (evita snapshot viejo si espera un Return concurrente) y rechaza SALE_WITH_RETURNS_CANNOT_BE_CANCELLED. Cash actual se bloquea para coordinar cierre; EXPENSE se incorpora naturalmente a live/cierre/expected cash existentes. Tests DB-free verifican plan/llamadas/rollback; atomicidad y concurrencia en motor pendientes del gate real autorizado F8. [Evidencia](../../docs/f08-returns-refunds-core-validation.md).

## F10.1 — Promocion mayorista atomica

sp_create_sale mantiene firma de 13 argumentos y replay previo a validaciones nuevas. Nuevas cabeceras se insertan RETAIL. Despues del lock caja, bloquea Customer del tenant con FOR UPDATE antes de INSERT/FK: evita tomar primero locks FK compartidos y luego intentar promover concurrentemente desde dos cajas. La validacion de pertenencia/actividad ya existente se conserva.

Solo para cabecera nueva WHOLESALE, [applyWholesalePricing](../src/modules/businesses-app/sales/helpers/wholesale-pricing.helper.ts) lee politica BUSINESS con LOCK IN SHARE MODE, revalida Customer con FOR UPDATE y lee productos activos del tenant ordenados por ID con FOR UPDATE. Valida precios/candidato Decimal, cambia la cabecera a WHOLESALE y promueve Customer RETAIL con NOW una sola vez, antes de detalles/pagos/delivery. Todo comparte conexion/commit/rollback del service. Errores posteriores revierten tambien tier/fecha. Helper no inicia ni cierra transacciones. Replay no ejecuta el helper; carreras por UNIQUE siguen rollback/relectura existentes. Deadlock/timeout create => 409 SALE_CONCURRENT_CHANGE y reintento misma key.

RETAIL conserva precios explicitos y conversion Orders sin nuevas reglas. Cancel/Returns no escriben tier/fecha. [Decision](../../docs/decisions.md), [validacion](../../docs/f10-1-wholesale-pricing-core-validation.md).
