# Roadmap operativo

Revisado: 2026-10-30. `[x]` indica fase cerrada con el alcance de validacion indicado, no certificacion de produccion. Estado tecnico y limites: [project-state](project-state.md).

- [x] F0 — Canonical documentation foundation. Validacion documental completada; evidencias en [f00-documentation-validation](f00-documentation-validation.md).
- [x] F0.1 — Hierarchical documentation by subsystem. Validacion documental completada; [evidencias](f00-1-documentation-hierarchy-validation.md).
- [x] F1 — Customers v2 DB/backend. Implementacion corroborada en schema/procedures/modulo/tests. Traspaso previo informa typecheck, build, baseline y 33 tests DB-free aprobados; no se repiten en F0. Ejecucion SQL/migracion real pendiente del operador.
- [x] F2 — Customers v2 frontend. Implementacion corroborada en tipos, validacion, formulario, busqueda y consumidores Sales. Traspaso previo informa build, lint acotado y 35 comprobaciones ad hoc aprobadas; no equivalen a suite persistente. Sin QA E2E real informado.
- [x] F3 — Orders Core DB/procedures/backend. Implementacion/DB-free y 11 pruebas HTTP/DB reales aprobadas en MySQL test local; [evidencias](f03-orders-core-validation.md). Operador confirma SQL sincronizado en local/test/produccion; produccion no sometida a pruebas por el agente.
- [ ] F4 — Orders Admin frontend. NEXT; sin implementar.
- [ ] F5 — Order -> Sale backend. Conversion atomica futura; sin implementar.
- [ ] F6 — Order -> Sale frontend. Posterior a F5; sin implementar.
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

F4 debe consumir el contrato actual y preservar COMPLETED reservado, stock informativo y permisos; no adelantar conversion/reservas. Mantener validacion de ambiente y fixtures acotados antes de repetir pruebas reales; [database](database.md).

## Mantenimiento

Al cerrar cada fase, actualizar este roadmap, [project-state](project-state.md) y su validation doc; [decisions](decisions.md) solo ante decisiones nuevas. Separar implementado, validado en archivos/tests aislados y comprobado contra DB/API real.
