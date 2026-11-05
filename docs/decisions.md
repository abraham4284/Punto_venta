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

Status: Accepted / implemented F7, gate real test 15/15 aprobado; SQL local/test/produccion confirmado por operador. Date: 2026-10-31.

Decision: providerType null (sin asignar), INTERNAL (usuario DELIVERY activo del negocio) o THIRD_PARTY (nombre libre sin usuario). No crear maestro ni users ficticios para Uber u otros. externalCost es informativo y distinto de sales.deliveryFee; no genera caja, cuentas por pagar ni settlement externo. Tercero no puede salir con efectivo pendiente ni participar de cash_settlements de empleados.

Anulacion != devolucion/reembolso: Sales DELIVERY solo se anula en PENDING/ASSIGNED/FAILED, sin pagos cobrados/confirmados/rendidos. En camino se resuelve estado operativo; entregada o cobrada requiere futura F8, no restauracion automatica de stock. Mantener atomicidad de la anulacion y Order COMPLETED aun si Sale se anula. Migration clasifica usuario existente como INTERNAL y ausencia de usuario como NULL, sin inferir terceros. Compatibilidad de requests legacy solo infiere INTERNAL desde user omitido providerType; nuevos clientes usan el modelo explicito. [Contrato](contracts.md), [evidencia](f07-delivery-providers-cancellation-validation.md).


## ADR-010 — Returns inmutables y reembolsos compensatorios

Status: Accepted / implemented Core F8; SQL/gate real pendientes del operador. Date: 2026-10-31.

Decision: Sale y Order permanecen COMPLETED, Payment CONFIRMED; no agregar estados REFUNDED/RETURNED ni reescribir settlements historicos. Returns, items y refunds se registran separados e inmutables. Se exige resolver PENDING/COLLECTED y cobertura confirmada original. Refund exacto de mercaderia calculada server-side mas envio opcional, contra pagos originales y con limites acumulados. Parciales usan Decimal local de precision 40 y residual exacto al completar linea.

Cash refund es EXPENSE SALE_REFUND en caja actual abierta/activa, aun para pago rendido; noncash solo evidencia sin caja. Restock opcional usa movimiento SALE_RETURN al deposito original. Full pre-dispatch cancela Delivery/evento; delivered se conserva, in-transit bloquea. Anular Sale con Returns bloquea doble reversion. Una conexion/transaccion, lock Sale y lecturas actuales de saldos protegen concurrencia; UNIQUE tenant/key + hash canonico diferencian replay/conflicto. API Returns concentra summary/saldos sin duplicar metricas Sales gross. No guardar snapshots inexistentes de producto en Sale: descripcion desde relaciones vigentes, importes desde linea original. [Contrato](contracts.md), [transacciones](../server/docs/transactions.md), [evidencia](f08-returns-refunds-core-validation.md).

## ADR-011 — Politica mayorista global y promocion comercial persistente

Status: Accepted / implemented F10.1, validado DB-free; gate real pendiente. Date: 2026-11-05.

Decision: minimo unico configurable por negocio para todas las categorias, sin tablas nuevas ni reglas por categoria/promociones. Mayorista requiere Customer activo del tenant y productos con precio mayorista positivo. Minimo inicial se calcula a precio mayorista DB antes de descuentos/envio. Cliente ya mayorista no repite minimo. Promocion y fecha se confirman en la misma transaccion de Sale; ni replay, cancelacion ni devolucion degradan al Customer o reescriben wholesaleSince. No se habilita edicion manual de tier/fecha en Customers.

Sales guarda pricingType historico; antiguas NULL sin backfill. Requests omitidos usan RETAIL para conservar precios explicitos/manuales y consumidores previos. WHOLESALE es explicito y exige unitPrice de catalogo DB; descuentos existentes se conservan y no contribuyen al candidato minimo. No se infiere una venta mayorista desde su importe. UI actual no envia pricingType; no queda integrada implicitamente por esta fase.

Consequences: defaults negocio false/null; settings existentes business.update reciben par enabled/minimum. Cabecera bloquea Customer antes de FK/INSERT y service valida/promueve en misma conexion sin cambiar ownership; persistencia comercial independiente de cancelaciones/refunds. Orders y su conversion quedan sin nuevas reglas (Sales RETAIL), no se agrega orders.pricing_type. Catalogo publico agrega precios/politica del slug configurado y mantiene price alias; sin costos ni login publico Customers. VITRUNO sigue externo, sin cambios en su repo/UX/WhatsApp. [Contratos](contracts.md), [despliegue](database.md), [evidencia](f10-1-wholesale-pricing-core-validation.md).
