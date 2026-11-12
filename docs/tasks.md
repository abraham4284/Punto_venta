# Roadmap operativo

Revisado: 2026-11-07. `[x]` indica fase cerrada con el alcance de validacion indicado, no certificacion de produccion. Estado tecnico y limites: [project-state](project-state.md).

- [x] F0 — Canonical documentation foundation. Validacion documental completada; evidencias en [f00-documentation-validation](f00-documentation-validation.md).
- [x] F0.1 — Hierarchical documentation by subsystem. Validacion documental completada; [evidencias](f00-1-documentation-hierarchy-validation.md).
- [x] F1 — Customers v2 DB/backend. Implementacion corroborada en schema/procedures/modulo/tests. Traspaso previo informa typecheck, build, baseline y 33 tests DB-free aprobados; no se repiten en F0. Ejecucion SQL/migracion real pendiente del operador.
- [x] F2 — Customers v2 frontend. Implementacion corroborada en tipos, validacion, formulario, busqueda y consumidores Sales. Traspaso previo informa build, lint acotado y 35 comprobaciones ad hoc aprobadas; no equivalen a suite persistente. Sin QA E2E real informado.
- [x] F3 — Orders Core DB/procedures/backend. Implementacion/DB-free y 11 pruebas HTTP/DB reales aprobadas en MySQL test local; [evidencias](f03-orders-core-validation.md). Operador confirma SQL sincronizado en local/test/produccion; produccion no sometida a pruebas por el agente.
- [x] F4 — Orders Admin frontend. Implementacion, build y lint acotado aprobados; 51 comprobaciones aisladas. QA navegador/API real pendiente por indisponibilidad de herramientas; [evidencias](f04-orders-admin-frontend-validation.md).
- [x] F4.1 — Pulido operativo de Orders. Modal Customer, selects UI, deposito default, autofill DELIVERY, imagenes actuales y hoja de preparacion. Build/lint aplicable y pruebas aisladas aprobados; QA navegador/impresion pendientes; operador confirma procedures aplicados en local/test/produccion. [Evidencias](f04-1-orders-ui-polish-validation.md).
- [x] F5 — Order -> Sale backend. Conversion atomica READY -> Sale + COMPLETED, link unico por tenant, deliveryFee y permisos. Typecheck/build/baseline y 115 tests DB-free aprobados. Operador confirma SQL aplicado en local/test/produccion; gate real F5 11/11 aprobado en DB test loopback, sin prueba productiva; [evidencias](f05-order-to-sale-backend-validation.md).
- [x] F6 — Order -> Sale frontend. Gate F5 real 11/11 aprobado antes de implementar. Checkout reducido, caja/pagos/metadata, key estable y venta vinculada. Build/lint acotado y 35 comprobaciones aisladas aprobados; QA navegador pendiente por entorno. [Evidencias](f06-order-to-sale-frontend-validation.md).
- [x] F7 — Delivery Providers & Cancellation Hardening. Tres modos de proveedor, costo externo informativo y anulación segura. F7 CLOSED: builds/baseline, 142 tests DB-free y comprobaciones frontend aprobados; gate real 15/15 aprobado en localhost / punto_venta_integration_test, cleanup correcto. SQL local/test/produccion aplicado segun operador; produccion no sometida a suite. [Evidencias](f07-delivery-providers-cancellation-validation.md).
- [x] F8 — Returns & Refunds Core DB/backend. Devoluciones inmutables, reingreso opcional, reembolsos contra pagos originales y compensacion de caja; 191 tests DB-free/regresion, typecheck/build y baseline aprobados. [Evidencias](f08-returns-refunds-core-validation.md).
- [x] Gate real F8 — 24/24 aprobado en localhost:3306 / punto_venta_integration_test, NODE_ENV=test, cleanup OK y FKs preservadas, segun confirmacion del operador al iniciar F9. SQL local/test/produccion sincronizado; sin suite productiva. F8 CLOSED.
- [x] F9 — Returns & Refunds Frontend. CLOSED: detalle Sale con summary/historial, registro y detalle Return, allocations/caja/idempotencia y permisos. Build/lint aplicable y 52 tests aislados aprobados; QA visual con API en memoria en desktop/mobile/tablet, sin DB real. [Evidencias](f09-returns-refunds-frontend-validation.md).
- [x] Roadmap actual Orders -> Sales -> Delivery -> Returns COMPLETED, con limites de validacion documentados; sin certificar produccion.
- [x] Rediseño SalePrintDocument — comprobante compacto con branding del negocio y datos operativos; resumen solo subtotal/descuento/total a la derecha, sin pagos ni linea de envio; impresion aislada del layout. Build/lint acotado y 18 tests aprobados; QA A4 escenarios A..G (10 productos en 1 pagina, 25 en 2), desktop/mobile con fixtures, sin backend/DB. [Evidencias](f10-sale-print-document-validation.md).
- [x] F10.1 — Wholesale Pricing Core DB/backend/API publica implementado: politica global por negocio, tier Customer persistente y pricingType historico; migracion manual 007 preparada. Typecheck/build/baseline y 280 tests DB-free aprobados; sin frontend ni SQL ejecutado. [Evidencias](f10-1-wholesale-pricing-core-validation.md).
- [x] Gate real F10.1 — 19/19 HTTP/DB aprobados al iniciar F10.2 en loopback / punto_venta_integration_test, cleanup UUID verificado. SQL local/test sincronizado segun operador; sin migraciones ejecutadas por el agente ni suite productiva. [Evidencia actualizada](f10-1-wholesale-pricing-core-validation.md).
- [x] F10.2 — Wholesale Pricing Admin Frontend CLOSED: Mi Empresa configura politica, Clientes muestra tier/fecha de solo lectura, POS deriva precios y envia pricingType, detalle muestra historico. 71 tests nuevos + 70 regresiones, build/lint acotado y QA local 32/32 desktop/tablet/mobile aprobados; [evidencia](f10-2-wholesale-pricing-admin-frontend-validation.md).
- [x] F10.2.1 — Wholesale Price Visibility Polish CLOSED: modal de Nueva Venta muestra ambos precios y badge aplicado; Productos distingue costo/minorista/mayorista. Ausencia clara, bloqueo mayorista y pricing preservados. 91 tests, build/lint acotado y QA local 15/15 aprobados; [evidencias](f10-2-1-wholesale-price-visibility-validation.md).
- [ ] Buscador publico por producto/categoria/relevancia — implementado en SP canonico y baseline; 305 tests DB-free, typecheck/build y baseline aprobados. Gate HTTP/DB preparado (20 casos), pendiente de autorizacion/aplicacion del SP en test; no CLOSED ni despliegue certificado. [Evidencias](storefront-catalog-search-category-validation.md).
- [x] CORS multi-storefront — allowlist exacta con `STOREFRONT_URLS`, compatible con las tres variables previas. 25 pruebas aisladas, typecheck y build aprobados. [Evidencias](storefront-cors-validation.md).
- [ ] T1 — Transferencia múltiple de stock backend implementada. 24 pruebas DB-free, typecheck, build y baseline aprobados. El operador confirma bases local, de test y de producción sincronizadas. Gate HTTP/MySQL preparado y pendiente de ejecución autorizada. [Evidencias](stock-batch-transfer-backend-validation.md).
- [x] T2 — Transferencia múltiple de stock frontend. Acción con permiso `stock.transfer`, selector por origen y borrador local con revalidación tras 409. Ajuste individual admite destino sin fila. 22 pruebas aisladas, build, lint acotado y 29 comprobaciones de navegador con fixtures aprobados. El gate HTTP/MySQL de T1 sigue pendiente. [Evidencias](stock-batch-transfer-frontend-validation.md).
- [x] T2.1 — Comprobante provisional de transferencia. Abre con respuesta confirmada y permite imprimir en A4 o reabrir durante la visita a Stock. Protege el borrador ante resultado incierto. 46 pruebas aisladas y de regresión, build, lint acotado y 25 comprobaciones de navegador e impresión con fixtures aprobados. [Evidencias](stock-transfer-receipt-frontend-validation.md).
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
