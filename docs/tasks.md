# Roadmap operativo

Revisado: 2026-10-30. `[x]` indica fase cerrada con el alcance de validacion indicado, no certificacion de produccion. Estado tecnico y limites: [project-state](project-state.md).

- [x] F0 — Canonical documentation foundation. Validacion documental completada; evidencias en [f00-documentation-validation](f00-documentation-validation.md).
- [x] F0.1 — Hierarchical documentation by subsystem. Validacion documental completada; [evidencias](f00-1-documentation-hierarchy-validation.md). F3 sigue siendo la siguiente fase funcional.
- [x] F1 — Customers v2 DB/backend. Implementacion corroborada en schema/procedures/modulo/tests. Traspaso previo informa typecheck, build, baseline y 33 tests DB-free aprobados; no se repiten en F0. Ejecucion SQL/migracion real pendiente del operador.
- [x] F2 — Customers v2 frontend. Implementacion corroborada en tipos, validacion, formulario, busqueda y consumidores Sales. Traspaso previo informa build, lint acotado y 35 comprobaciones ad hoc aprobadas; no equivalen a suite persistente. Sin QA E2E real informado.
- [ ] F3 — Orders Core DB/procedures/backend. NEXT; contrato abajo.
- [ ] F4 — Orders Admin frontend. Posterior a F3; sin implementar.
- [ ] F5 — Order -> Sale backend. Conversion atomica futura; sin implementar.
- [ ] F6 — Order -> Sale frontend. Posterior a F5; sin implementar.
- [ ] Future — Stock reservations. Solo si el uso real justifica una fase especifica.

Fuera de alcance actual: creacion automatica de Orders desde VITRUNO, checkout publico e integracion automatica de pedidos.

## F3 — Contrato de la siguiente fase (planned, NOT IMPLEMENTED)

Goal: crear `orders`, `order_details`, `order_events`, procedures y modulo backend para pedidos manuales internos de Cajora. No crear frontend en esta fase.

- Order != Sale. Cliente y deposito obligatorios; metodo esperado de pago opcional. Tomar snapshots de cliente/productos desde DB, no confiar en snapshots del body.
- Estados: PENDING -> CONFIRMED -> PREPARING -> READY; CANCELLED desde no terminales con motivo obligatorio. COMPLETED existe como estado reservado a futura conversion atomica, nunca asignable por endpoint generico.
- Edicion completa solo en PENDING/CONFIRMED con transaccion y row lock. Eventos auditables para cambios relevantes; no borrar historia silenciosamente.
- Create con `Idempotency-Key`, UNIQUE por negocio y manejo de replay/carreras sin duplicar details/eventos. Tenant/actor autenticados, referencias del mismo negocio.
- Decimal.js, validacion de totales, 1..100 productos sin IDs repetidos; cantidades segun unidad y precision actual de DB.
- Stock informativo: cero/insuficiente y ON_ORDER no bloquean pedidos. No reservar ni descontar stock; no crear ventas, pagos, movimientos de caja, deliveries reales ni settlements.
- Consulta propia de productos por deposito que incluya stock cero. Listado con paginacion SQL, filtros y metricas del conjunto filtrado completo.
- Permisos backend planificados: `orders.view`, `orders.create`, `orders.update`, `orders.change_status`, `orders.cancel`, con `requirePermission`.
- Actualizar SQL canonico, manifest/install cuando corresponda, baseline generado y migracion manual aditiva 003 solo si sigue libre. No aplicar SQL real. Tests DB-free con setup aislado y mocks; validar archivos y tipado/build segun [reglas](coding-rules.md).
- Scope excluye `client/src`, storefront/VITRUNO, conversion a venta y reservas. Documentar validacion real en `docs/f03-orders-core-validation.md` al implementar, no crear ese archivo anticipadamente.

Este contrato permite orientar un prompt corto futuro. Si quedan detalles de API, transiciones o permisos sin definir, inspeccionar patrones Sales y resolverlos dentro de F3; no deducirlos de una feature inexistente ni adelantar F4/F5.

## Mantenimiento

Al cerrar cada fase, actualizar este roadmap, [project-state](project-state.md) y su validation doc; [decisions](decisions.md) solo ante decisiones nuevas. Separar implementado, validado en archivos/tests aislados y comprobado contra DB/API real.
