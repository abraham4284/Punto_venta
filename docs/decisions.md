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

## ADR-005 — Order y Sale son entidades diferentes

Status: Accepted / implemented DB/backend, conversion backend F5. Date: 2026-10-30.

Context: un pedido expresa intencion y preparacion, una venta produce efectos economicos.

Decision: F3 implementa pedidos manuales internos independientes. COMPLETED solo se alcanza mediante conversion atomica Order -> Sale (F5), fuera de los endpoints genericos F3.

Consequences: alta/edicion/preparacion de Orders Core no crean ventas, pagos, caja ni deliveries reales. La conversion explicita F5 si crea los efectos Sales atomicos; UI F6 pendiente. Fuente: roadmap acordado en F0; [evidencia F3](f03-orders-core-validation.md) y [F5](f05-order-to-sale-backend-validation.md).

## ADR-006 — Stock solo informativo en Orders inicial

Status: Accepted / implemented DB/backend. Date: 2026-10-30.

Context: los pedidos iniciales deben admitir disponibilidad insuficiente y productos por encargo.

Decision: F3 no reserva ni descuenta stock; cero/insuficiente y ON_ORDER no bloquean el pedido. Estado actualizado en F3: Accepted / implemented DB/backend; reservas siguen fuera de alcance.

Consequences: consultar disponibilidad no promete entrega ni exclusividad; reservas requieren fase separada justificada por uso real. No existe implementacion de reservas Orders en este checkout.

## ADR-007 — VITRUNO permanece fuera del flujo administrativo de Orders

Status: Accepted / planned (acuerdo de integracion). Date: 2026-10-30.

Context: Cajora expone catalogo publico y VITRUNO pertenece a otro proyecto.

Decision: mantener consumo de `/api/public`, cierre por WhatsApp y sin creacion automatica de Orders ni consumo de endpoints administrativos.

Consequences: F3 no toca VITRUNO/storefront ni agrega checkout publico. El limite publico de Cajora esta implementado; el comportamiento externo de VITRUNO se toma del acuerdo aportado, no de una inspeccion de su repo/despliegue.

## ADR-008 — Conversion atomica con Sales como unico vinculo persistido

Status: Accepted / implemented backend F5. Date: 2026-10-31.

Decision: sales.idOrder nullable con unicidad/FK por negocio; nunca orders.idSale. READY -> COMPLETED solo tras crear Sale y efectos Sales en la misma conexion/transaccion. createSaleWithinTransaction no posee transaccion; caller directo o conversion controla ownership. Cancelar Sale no reabre Order ni libera el vinculo unico. delivery_fee forma parte del total Sales, default 0 para POS existente.

Consequences: lock Order, permisos orders.convert + sales.create, keys de POS/otro Order son conflicto, no replay. Valores incompatibles con Sales se rechazan sin cambiar precios ni relajar reglas. Observacion larga permanece solo en Order. expectedPaymentMethodId es expectativa; pagos reales son explicitos. Sin reservas, F6 o API publica. [Contrato](contracts.md), [ownership](../server/docs/transactions.md), [evidencias](f05-order-to-sale-backend-validation.md).

## ADR-009 — Proveedor de entrega y limite de anulacion

Status: Accepted / implemented F7, SQL real pendiente. Date: 2026-10-31.

Decision: providerType null (sin asignar), INTERNAL (usuario DELIVERY activo del negocio) o THIRD_PARTY (nombre libre sin usuario). No crear maestro ni users ficticios para Uber u otros. externalCost es informativo y distinto de sales.deliveryFee; no genera caja, cuentas por pagar ni settlement externo. Tercero no puede salir con efectivo pendiente ni participar de cash_settlements de empleados.

Anulacion != devolucion/reembolso: Sales DELIVERY solo se anula en PENDING/ASSIGNED/FAILED, sin pagos cobrados/confirmados/rendidos. En camino se resuelve estado operativo; entregada o cobrada requiere futura F8, no restauracion automatica de stock. Mantener atomicidad de la anulacion y Order COMPLETED aun si Sale se anula. Migration clasifica usuario existente como INTERNAL y ausencia de usuario como NULL, sin inferir terceros. Compatibilidad de requests legacy solo infiere INTERNAL desde user omitido providerType; nuevos clientes usan el modelo explicito. [Contrato](contracts.md), [evidencia](f07-delivery-providers-cancellation-validation.md).
