# Roadmap operativo

Revisado: 2026-10-31. `[x]` indica fase cerrada con el alcance de validacion indicado, no certificacion de produccion. Estado tecnico y limites: [project-state](project-state.md).

- [x] F0 — Canonical documentation foundation. Validacion documental completada; evidencias en [f00-documentation-validation](f00-documentation-validation.md).
- [x] F0.1 — Hierarchical documentation by subsystem. Validacion documental completada; [evidencias](f00-1-documentation-hierarchy-validation.md).
- [x] F1 — Customers v2 DB/backend. Implementacion corroborada en schema/procedures/modulo/tests. Traspaso previo informa typecheck, build, baseline y 33 tests DB-free aprobados; no se repiten en F0. Ejecucion SQL/migracion real pendiente del operador.
- [x] F2 — Customers v2 frontend. Implementacion corroborada en tipos, validacion, formulario, busqueda y consumidores Sales. Traspaso previo informa build, lint acotado y 35 comprobaciones ad hoc aprobadas; no equivalen a suite persistente. Sin QA E2E real informado.
- [x] F3 — Orders Core DB/procedures/backend. Implementacion/DB-free y 11 pruebas HTTP/DB reales aprobadas en MySQL test local; [evidencias](f03-orders-core-validation.md). Operador confirma SQL sincronizado en local/test/produccion; produccion no sometida a pruebas por el agente.
- [x] F4 — Orders Admin frontend. Implementacion, build y lint acotado aprobados; 51 comprobaciones aisladas. QA navegador/API real pendiente por indisponibilidad de herramientas; [evidencias](f04-orders-admin-frontend-validation.md).
- [x] F4.1 — Pulido operativo de Orders. Modal Customer, selects UI, deposito default, autofill DELIVERY, imagenes actuales y hoja de preparacion. Build/lint aplicable y pruebas aisladas aprobados; QA navegador/impresion pendientes; operador confirma procedures aplicados en local/test/produccion. [Evidencias](f04-1-orders-ui-polish-validation.md).
- [x] F5 — Order -> Sale backend. Conversion atomica READY -> Sale + COMPLETED, link unico por tenant, deliveryFee y permisos. Typecheck/build/baseline y 115 tests DB-free aprobados. Operador confirma SQL aplicado en local/test/produccion; gate real F5 11/11 aprobado en DB test loopback, sin prueba productiva; [evidencias](f05-order-to-sale-backend-validation.md).
- [x] F6 — Order -> Sale frontend. Gate F5 real 11/11 aprobado antes de implementar. Checkout reducido, caja/pagos/metadata, key estable y venta vinculada. Build/lint acotado y 35 comprobaciones aisladas aprobados; QA navegador pendiente por entorno. [Evidencias](f06-order-to-sale-frontend-validation.md).
- [x] F7 — Delivery Providers & Cancellation Hardening. Tres modos de proveedor, costo externo informativo y anulación segura. Builds/baseline, 142 tests DB-free y comprobaciones frontend aprobados; SQL y suite real pendientes del operador. [Evidencias](f07-delivery-providers-cancellation-validation.md).
- [ ] F8 — Returns & Refunds. FUTURE; devoluciones/reembolsos, sin implementar.
- [ ] Future — Stock reservations. Solo si el uso real justifica una fase especifica.

Fuera de alcance actual: creacion automatica de Orders desde VITRUNO, checkout publico e integracion automatica de pedidos.

## F3 — Contrato implementado (DB/backend, sin frontend)

Implementados `orders`, `order_details`, `order_events`, procedures y modulo backend para pedidos manuales internos de Cajora. API/payload y permisos por rol: [contracts](contracts.md). SQL aplicado en local/test/produccion segun confirmacion del operador; validacion directa limitada a MySQL test local, sin certificar despliegue productivo.

- Order != Sale. Cliente y deposito obligatorios; metodo esperado de pago opcional. Tomar snapshots de cliente/productos desde DB, no confiar en snapshots del body.
- Estados: PENDING -> CONFIRMED -> PREPARING -> READY; CANCELLED desde no terminales con motivo obligatorio. COMPLETED existe como estado reservado a futura conversion atomica, nunca asignable por endpoint generico.
- Edicion completa solo en PENDING/CONFIRMED con transaccion y row lock. Eventos auditables para cambios relevantes; no borrar historia silenciosamente.
- Create con `Idempotency-Key`, UNIQUE por negocio y manejo de replay/carreras sin duplicar details/eventos. Tenant/actor autenticados, referencias del mismo negocio.
- Decimal.js, validacion de totales, 1..100 productos sin IDs repetidos; cantidades segun unidad y precision actual de DB.
- Stock informativo: cero/insuficiente y ON_ORDER no bloquean pedidos. No reservar ni descontar stock; no crear ventas, pagos, movimientos de caja, deliveries reales ni settlements.
- Consulta propia de productos por deposito que incluya stock cero. Listado con paginacion SQL, filtros y metricas del conjunto filtrado completo.
- Permisos backend: `orders.view`, `orders.create`, `orders.update`, `orders.change_status`, `orders.cancel`, con `requirePermission`.
- SQL canonico, manifest/install y baseline actualizados; migracion manual `003_orders_core.sql` aplicada por operador. Tests DB-free y suite real especifica, typecheck/build y baseline aprobados; limites en [validacion F3](f03-orders-core-validation.md).
- Scope excluye `client/src`, storefront/VITRUNO, conversion a venta y reservas.

F4 consume el contrato actual y preserva COMPLETED reservado, stock informativo y permisos; no implementa conversion/reservas. Mantener validacion de ambiente y fixtures acotados antes de repetir pruebas reales; [database](database.md).

## F4 — Orders Admin frontend implementado

Modulo con listado, metricas del conjunto filtrado, filtros explicitos y paginacion SQL; alta/PUT completo, detalle snapshot/timeline y acciones de siguiente estado/cancelacion segun useCan. Rutas `/admin/orders`, `/new`, `/:idOrder` y `/:idOrder/edit` protegidas, navegacion y labels de permisos integrados. Create conserva Idempotency-Key por payload/reintento y la invalida al editar; stock cero/ON_ORDER no bloquean. Sin nuevos stores globales, librerias UI, endpoints o cambios backend. Alcance de validacion y deuda global de lint en [F4 validation](f04-orders-admin-frontend-validation.md). F5 backend implementado posteriormente; F6 implementa posteriormente el checkout de conversion; reservas siguen fuera de alcance.

## Mantenimiento

Al cerrar cada fase, actualizar este roadmap, [project-state](project-state.md) y su validation doc; [decisions](decisions.md) solo ante decisiones nuevas. Separar implementado, validado en archivos/tests aislados y comprobado contra DB/API real.
