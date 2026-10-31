# Estado vigente de Cajora

Revisado: 2026-10-30. Rama inspeccionada: `dev`.

Last reviewed commit: `6a381750eef240e9f36f403683b90e5723abd2d0` — `feat(orders): implementar Orders Core en DB y backend`. HEAD `dev` inspeccionado antes de la validacion real F3, distinto del master de referencia aportado `094c9f1f51c96d723cf16aaa28f019f80a2452fb`. El repositorio estaba limpio al comenzar; no se cambio de rama.

Current phase: F3 Orders Core implementada, validada DB-free y contra DB test real. Last completed functional phase: F3. Next functional phase: F4, pendiente. Ver [tasks](tasks.md) y [evidencias F3](f03-orders-core-validation.md). Operador confirma SQL aplicado/sincronizado en local, test y produccion; el agente solo probo la DB test local, no produccion ni su despliegue.

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

- F0/F0.1 y F1/F2 cerradas; F3 implementada/validada DB-free y DB real; F4..F6 pendientes.
- Orders: **IMPLEMENTED DB/BACKEND; REAL LOCAL TEST DB VALIDATED**. 11 pruebas HTTP/DB aprobadas en `localhost:3306 / punto_venta_integration_test`, servidor `DESKTOP-M4JH3TC`, MySQL 8.0.33. Flujo completo, tenant, permisos, actores inactivos, stock informativo y replay concurrente sin duplicados. Fixtures propios limpiados sin reset general ni desactivar FKs. Contrato: [contracts](contracts.md). Sin frontend/conversion/reservas; los 65 tests DB-free son evidencia de la entrega inicial.
- Stock identico y conteos globales de stock_movements/sales/sale_details/sale_payments/sale_deliveries/cash_movements en 0 antes/despues de la suite. Typecheck/build y validacion baseline aprobados nuevamente. No se detectaron bugs funcionales Orders; se corrigio solo la limpieza de la nueva suite.
- SQL de produccion sincronizado segun operador; no se consulto ni modifico produccion ni se probo MariaDB remoto, instalacion limpia o reaplicacion de migraciones. Los validadores de archivos no ejecutan SQL.
- `manual/002_customers_v2.sql` usa modo de datos descartables; no es migracion semantica de clientes reales.
- El README conserva contenido historico bajo aviso visible. La guia Customers v2 conserva la advertencia de fase frontend como antecedente backend; no describe una carencia vigente del cliente.
- Deuda previa informada: lint global y warnings de bundle/imports dinamicos. No se midio en F0; no afirmar builds actuales aprobados ni deuda resuelta.
- API no tiene envelope uniforme entre contextos; preservar consumidores. Precision decimal y columnas como timestamps deben comprobarse en schema concreto.

Fuera de alcance: implementar funcionalidad durante F0/F0.1, F4..F6 dentro de F3, reservas anticipadas, checkout publico e integracion automatica VITRUNO. No hay evidencia de despliegue/migracion activa verificada en esta fase.
