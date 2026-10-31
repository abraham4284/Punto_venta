# Ownership transaccional e idempotencia

La [ADR-002](../../docs/decisions.md) conserva procedures y coordinacion en services cuando el flujo lo requiere. El owner real varia: inspeccionar service y procedure completos antes de reutilizar un patron.

## Sales: creacion coordinada por service

[createSaleService](../src/modules/businesses-app/sales/services/sales.service.ts) obtiene una conexion del pool y ejecuta `beginTransaction`. Cabecera (`sp_create_sale`), detalles/descuento stock, pagos y entrega usan esa misma conexion. Si cabecera indica `alreadyProcessed`, omite nuevos detalles/pagos/entrega.

El service hace `commit`, luego obtiene detalle de respuesta y evalua notificaciones de stock para creaciones nuevas. En catch invoca `rollback`; ante duplicado consulta la venta por negocio/clave y devuelve replay si existe, en otro caso propaga el error. `finally` libera siempre la conexion (`release`). La lectura final y notificaciones posteriores al commit no forman parte de la transaccion ya confirmada; no prometer rollback de esos efectos.

[sales.sql](../src/db/procedures/sales.sql) contiene locks `FOR UPDATE` y handlers SQL que tambien pueden hacer rollback. Los procedures de creacion participan en la transaccion del service; cancelacion tiene su propio START TRANSACTION/COMMIT. Por eso no agregar begin/commit anidados ni extrapolar ownership entre endpoints del mismo modulo.

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
