# Decisiones que condicionan futuras fases

Fecha de registro: 2026-10-30. Las fechas indican incorporacion a esta base documental, no la fecha original de implementacion. Accepted refleja codigo inspeccionado; Accepted / planned refleja acuerdos de roadmap del prompt F0, aun sin implementacion.

## ADR-001 — idBusiness delimita el tenant

Status: Accepted. Date: 2026-10-30.

Context: una identidad puede operar en negocios diferentes; PLATFORM es otro contexto.

Decision: usar el negocio del contexto BUSINESS autenticado y filtrar las entidades operativas por `idBusiness`, con autorizacion backend y FKs compuestas donde corresponda.

Consequences: body/query no definen el tenant; cada nueva referencia debe comprobar pertenencia. Evidencia: [barrel BUSINESS](../server/src/modules/businesses-app/index.ts), [Customers controller](../server/src/modules/businesses-app/customers/controllers/customers.controller.ts) y [FKs](../server/src/db/schema/004_add_foreign_keys.sql).

## ADR-002 — Procedures y transacciones coordinadas por services

Status: Accepted. Date: 2026-10-30.

Context: operaciones comerciales combinan cabecera, lineas, stock, pagos y eventos.

Decision: mantener stored procedures como limite DB habitual; services poseen transacciones complejas como creacion de Sales. Hay SQL directo parametrizado y procedures con ownership propio; no asumir una regla uniforme sin inspeccion.

Consequences: reutilizar conexion/locks y preservar atomicidad; no introducir ORM/repositories ni commits internos que rompan la transaccion llamadora. Evidencia: [Sales service](../server/src/modules/businesses-app/sales/services/sales.service.ts).

## ADR-003 — Identidad de Customer v2

Status: Accepted. Date: 2026-10-30.

Context: se necesitan nombres separados y documentos opcionales sin perder identidad entre negocios.

Decision: persistir `first_name`/`last_name`, derivar `fullName` y normalizar documento como par opcional unico por negocio. No mantener `Customer.name` legacy; Sales/Tickets conservan sus aliases `customerName`.

Consequences: actualizar consumidores y desplegar schema/procedures/backend/frontend compatibles; no convertir documentos a numero ni inferir apellidos reales. Evidencia y migracion: [Customers v2](../server/src/db/CUSTOMERS_V2.md).

## ADR-004 — Baseline limpio y migraciones manuales separados

Status: Accepted. Date: 2026-10-30.

Context: instalaciones nuevas y bases existentes tienen necesidades diferentes.

Decision: schema/seeds/procedures/publications forman baseline generado; `manual` actualiza instalaciones existentes bajo revision del operador.

Consequences: no ejecutar install sobre datos existentes ni editar generado a mano; mantener ambas rutas cuando cambia el modelo. Evidencia: [DB README](../server/src/db/README.md).

## ADR-005 — Order y Sale seran entidades diferentes

Status: Accepted / planned. Date: 2026-10-30.

Context: un pedido expresa intencion y preparacion, una venta produce efectos economicos.

Decision: F3 creara pedidos manuales internos independientes. COMPLETED quedara reservado para futura conversion atomica Order -> Sale, fuera de F3.

Consequences: no crear ventas, pagos, caja ni deliveries reales desde Orders Core. No hay tablas/modulo Orders hoy. Fuente: roadmap acordado en F0; [contrato F3](tasks.md).

## ADR-006 — Stock solo informativo en Orders inicial

Status: Accepted / planned. Date: 2026-10-30.

Context: los pedidos iniciales deben admitir disponibilidad insuficiente y productos por encargo.

Decision: F3 no reserva ni descuenta stock; cero/insuficiente y ON_ORDER no bloquean el pedido.

Consequences: consultar disponibilidad no promete entrega ni exclusividad; reservas requieren fase separada justificada por uso real. No existe implementacion de reservas Orders en este checkout.

## ADR-007 — VITRUNO permanece fuera del flujo administrativo de Orders

Status: Accepted / planned (acuerdo de integracion). Date: 2026-10-30.

Context: Cajora expone catalogo publico y VITRUNO pertenece a otro proyecto.

Decision: mantener consumo de `/api/public`, cierre por WhatsApp y sin creacion automatica de Orders ni consumo de endpoints administrativos.

Consequences: F3 no toca VITRUNO/storefront ni agrega checkout publico. El limite publico de Cajora esta implementado; el comportamiento externo de VITRUNO se toma del acuerdo aportado, no de una inspeccion de su repo/despliegue.
