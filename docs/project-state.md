# Estado vigente de Cajora

Revisado: 2026-10-30. Rama inspeccionada: `dev`.

Last reviewed commit: `fe846c3279af026a7516041dae85ccc46b5aae6b` — `docs: organizar documentacion jerarquica por subsistema`. Es el HEAD `dev` previo a los cambios F3, distinto del master de referencia aportado `5927aaf8c9c8d93ee4cdf57b63a59a309e49232f`. El repositorio estaba limpio al comenzar; no se cambio de rama.

Current phase: F3 Orders Core implementada y validada DB-free. Last completed functional phase: F3. Next functional phase: F4, pendiente. Ver [tasks](tasks.md) y [evidencias F3](f03-orders-core-validation.md). No implica SQL aplicado ni despliegue.

## Identidad, stack y mapa actual

Cajora / Punto_Venta es gestion comercial multi-negocio; [PRD](prd.md) define producto y actores. Backend Node/Express 5/TypeScript/MySQL-MariaDB/procedures/Zod/Decimal.js; frontend React 19/Vite 8/TypeScript/Tailwind 4/Base UI/Zustand/Axios. Estructura y flujo: [architecture](architecture.md).

La jerarquia documental separa sistema/contratos/roadmap en root, implementacion frontend en [client/AGENTS](../client/AGENTS.md) y backend en [server/AGENTS](../server/AGENTS.md). Detalles DB permanecen en server/src/db; [contracts](contracts.md) concentra acuerdos HTTP sin uniformar envelopes.

BUSINESS monta auth, negocios, usuarios, permisos, suscripcion, legal, notificaciones, dashboard, customers, orders, suppliers, categorias, products/imagenes, deposits, stock/movimientos, purchases, sales, pagos, caja/sesiones/movimientos, entregas, rendiciones y tickets. PLATFORM monta auth, negocios, usuarios, suscripciones/planes/pagos, dashboard, auditoria y notificaciones. El dashboard de plataforma consulta API y `sp_platform_dashboard`; no es un placeholder estatico.

El catalogo publico vive en `/api/public`, aislado del API administrativo y configurado por slug de negocio. VITRUNO es externo: acuerdo de catalogo/WhatsApp y ausencia de Orders automaticos, no inspeccion de su implementacion.

## DB y Customers v2

Existe baseline canonico completo, schema 002..005, seeds, procedures, publicaciones legales y generado. Hay tres migraciones manuales (001 slugs/sale mode, 002 Customers v2, 003 Orders Core); no un runner automatico de migraciones. Operacion y riesgos: [database](database.md).

Customers backend y frontend estan implementados: `firstName`, `lastName`, `fullName` derivado, documento opcional y contacto. `Customer.name` fue eliminado. Sales/Tickets y otros consumidores conservan `customerName`/`customer_name` donde corresponde. El formulario, helper de busqueda, tipos y seleccion/detalle de Sales usan el contrato v2. [Guia de entrega](../server/src/db/CUSTOMERS_V2.md).

F1/F2 estan cerradas segun el roadmap aportado, con implementacion corroborada en archivos. Validaciones previas informadas: backend typecheck/build/baseline y 33 tests DB-free; frontend build/lint acotado y 35 comprobaciones ad hoc. F0 no las ejecuto de nuevo. No se afirma migracion aplicada ni pruebas reales de MariaDB/API/navegador.

## Sales y fronteras economicas

Ventas tienen numero comercial, cliente opcional, idempotencia por negocio, pagos y entrega separados. La creacion coordina transaccion en service y procedures, incluyendo detalles/stock. Caja y rendicion no equivalen a cobrar una entrega. Consultar implementacion Sales antes de reutilizar ownership transaccional, permisos, errores y calculos.

## Roadmap y limites conocidos

- F0/F0.1 y F1/F2 cerradas; F3 implementada/validada DB-free; F4..F6 pendientes.
- Orders: **IMPLEMENTED DB/BACKEND; PENDING REAL DB VALIDATION**. Tablas, modulo, ocho rutas y permisos; snapshots DB, transacciones/locks, idempotencia y eventos. Stock informativo, sin frontend ni conversion/reservas. Contrato: [contracts](contracts.md); 65 tests DB-free, typecheck/build y baseline aprobados.
- SQL/migracion real y comportamiento de ambientes desplegados requieren verificacion del operador; los validadores de archivos no ejecutan SQL.
- `manual/002_customers_v2.sql` usa modo de datos descartables; no es migracion semantica de clientes reales.
- El README conserva contenido historico bajo aviso visible. La guia Customers v2 conserva la advertencia de fase frontend como antecedente backend; no describe una carencia vigente del cliente.
- Deuda previa informada: lint global y warnings de bundle/imports dinamicos. No se midio en F0; no afirmar builds actuales aprobados ni deuda resuelta.
- API no tiene envelope uniforme entre contextos; preservar consumidores. Precision decimal y columnas como timestamps deben comprobarse en schema concreto.

Fuera de alcance: implementar funcionalidad durante F0/F0.1, F4..F6 dentro de F3, reservas anticipadas, checkout publico e integracion automatica VITRUNO. No hay evidencia de despliegue/migracion activa verificada en esta fase.
