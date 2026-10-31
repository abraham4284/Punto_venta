# Estado vigente de Cajora

Revisado: 2026-10-31. Rama inspeccionada: `dev`.

Last reviewed commit: `5906faaa74515e638a18d13c9be21f9c48012025` — `feat(orders): convertir pedidos a ventas de forma atómica`. HEAD dev inspeccionado antes de F6, distinto del master de referencia `22c28cd2ebbe156580a281b97f9da3a86bab7fe9`. Checkout limpio al comenzar, sin cambio de rama.

Current phase: F6 Order -> Sale frontend implementado, build/lint aplicable y validacion aislada aprobados. Last completed functional phase: F6; QA navegador pendiente por herramientas. Gate F5 real aprobado antes de modificar frontend: 11/11 casos en DB test loopback punto_venta_integration_test. Operador confirma SQL F5 aplicado en local/test/produccion; el agente no verifico produccion ni aplico migraciones. Ver [F5](f05-order-to-sale-backend-validation.md) y [F6](f06-order-to-sale-frontend-validation.md). No hay siguiente fase funcional autorizada; reservas solo si uso real las justifica.

## Identidad, stack y mapa actual

Cajora / Punto_Venta es gestion comercial multi-negocio; [PRD](prd.md) define producto y actores. Backend Node/Express 5/TypeScript/MySQL-MariaDB/procedures/Zod/Decimal.js; frontend React 19/Vite 8/TypeScript/Tailwind 4/Base UI/Zustand/Axios. Estructura y flujo: [architecture](architecture.md).

La jerarquia documental separa sistema/contratos/roadmap en root, implementacion frontend en [client/AGENTS](../client/AGENTS.md) y backend en [server/AGENTS](../server/AGENTS.md). Detalles DB permanecen en server/src/db; [contracts](contracts.md) concentra acuerdos HTTP sin uniformar envelopes.

BUSINESS monta auth, negocios, usuarios, permisos, suscripcion, legal, notificaciones, dashboard, customers, orders, suppliers, categorias, products/imagenes, deposits, stock/movimientos, purchases, sales, pagos, caja/sesiones/movimientos, entregas, rendiciones y tickets. PLATFORM monta auth, negocios, usuarios, suscripciones/planes/pagos, dashboard, auditoria y notificaciones. El dashboard de plataforma consulta API y `sp_platform_dashboard`; no es un placeholder estatico.

El catalogo publico vive en `/api/public`, aislado del API administrativo y configurado por slug de negocio. VITRUNO es externo: acuerdo de catalogo/WhatsApp y ausencia de Orders automaticos, no inspeccion de su implementacion.

## DB y Customers v2

Existe baseline canonico completo, schema 002..005, seeds, procedures, publicaciones legales y generado. Hay cuatro migraciones manuales (001 slugs/sale mode, 002 Customers v2, 003 Orders Core, 004 Order -> Sale; aplicada segun operador); no un runner automatico de migraciones. Operacion y riesgos: [database](database.md).

Customers backend y frontend estan implementados: `firstName`, `lastName`, `fullName` derivado, documento opcional y contacto. `Customer.name` fue eliminado. Sales/Tickets y otros consumidores conservan `customerName`/`customer_name` donde corresponde. El formulario, helper de busqueda, tipos y seleccion/detalle de Sales usan el contrato v2. [Guia de entrega](../server/src/db/CUSTOMERS_V2.md).

F1/F2 estan cerradas segun el roadmap aportado, con implementacion corroborada en archivos. Validaciones previas informadas: backend typecheck/build/baseline y 33 tests DB-free; frontend build/lint acotado y 35 comprobaciones ad hoc. F0 no las ejecuto de nuevo. No se afirma migracion aplicada ni pruebas reales de MariaDB/API/navegador.

## Sales y fronteras economicas

Ventas tienen numero comercial, cliente opcional, idempotencia por negocio, pagos y entrega separados. La creacion coordina transaccion en service y procedures, incluyendo detalles/stock. F5 extrae createSaleWithinTransaction sin ownership transaccional para reutilizarlo desde conversion; sales.idOrder nullable y delivery_fee identifican el origen y costo de entrega. Caja y rendicion no equivalen a cobrar una entrega. Consultar implementacion Sales antes de reutilizar ownership transaccional, permisos, errores y calculos.

## Roadmap y limites conocidos

- Orders F4.1: formulario por secciones y resumen lateral, cliente obligatorio mediante modal buscable, selects Base UI, deposito predeterminado activo solo en nuevos (edicion conserva el existente) y autofill DELIVERY opt-in, editable y sin copiar referencia. Picker/carrito con imagen actual y fallback; hoja de preparacion imprimible desde detalle con orders.view mediante window.print/Guardar PDF del navegador. Backend solo agrega imageUrl/productImageUrl desde products con tenant join, sin snapshot de imagen, schema ni migracion nuevos. Client build/lint Orders, server typecheck/build, 68 tests DB-free y baseline aprobados; 28 comprobaciones ad hoc frontend (sin suite persistente). Herramientas de navegador fallaron al inicializar assets: no se verifico layout/foco/impresion real. Al cierre F4.1 no se aplico SQL; posteriormente el operador confirma orders.sql aplicado y probado en local/test/produccion. [Detalle](f04-1-orders-ui-polish-validation.md).

- F0..F4.1 cerradas con sus limites; F5 backend implementado y gate real 11/11 aprobado; F6 frontend implementado con evidencia estatica/aislada. Conversion solo READY con orders.convert + sales.create; una transaccion/una conexion para venta, stock, pagos, entrega, COMPLETED y evento. Replays no repiten efectos; cancelar Sale no reabre Order. F6 agrega checkout modal en Orders: caja actual, 1..5 pagos, metadata DELIVERY, key estable, refresh tras 409 y linkedSale/Ver venta por permiso. Sin reservas ni cambios server/SQL durante F6.
- Orders Core: **IMPLEMENTED DB/BACKEND; REAL LOCAL TEST DB VALIDATED**. 11 pruebas HTTP/DB aprobadas en `localhost:3306 / punto_venta_integration_test`, servidor `DESKTOP-M4JH3TC`, MySQL 8.0.33. Flujo completo, tenant, permisos, actores inactivos, stock informativo y replay concurrente sin duplicados. Fixtures propios limpiados sin reset general ni desactivar FKs. Contrato HTTP original F3, extendido aditivamente por F4.1/F5: [contracts](contracts.md); sus referencias al alcance original sin frontend corresponden al cierre F3. Los 65 tests DB-free son evidencia de la entrega inicial.
- Orders Admin F4: UI de lista/filtros/metricas/paginacion, create/edit con Decimal.js e idempotencia estable, detalle/eventos y acciones por permiso/estado. Sidebar, rutas y labels integrados. 51 comprobaciones ad hoc (no suite persistente), build y lint acotado aprobados. Navegador/computer-use no pudieron inicializar assets: no hubo QA visual ni operaciones desde navegador contra backend real. Sin conversion/reservas/VITRUNO.
- Stock identico y conteos globales de stock_movements/sales/sale_details/sale_payments/sale_deliveries/cash_movements en 0 antes/despues de la suite. Typecheck/build y validacion baseline aprobados nuevamente. No se detectaron bugs funcionales Orders; se corrigio solo la limpieza de la nueva suite.
- SQL de produccion sincronizado segun operador; no se consulto ni modifico produccion ni se probo MariaDB remoto, instalacion limpia o reaplicacion de migraciones. Los validadores de archivos no ejecutan SQL.
- `manual/002_customers_v2.sql` usa modo de datos descartables; no es migracion semantica de clientes reales.
- El README conserva contenido historico bajo aviso visible. La guia Customers v2 conserva la advertencia de fase frontend como antecedente backend; no describe una carencia vigente del cliente.
- Lint global medido en F4: 8 errores y 2 warnings en seis archivos previos fuera de scope; lint F4 limpio. Build exitoso con warnings de bundle grande/imports dinamicos inefectivos. Deuda no corregida fuera de scope.
- API no tiene envelope uniforme entre contextos; preservar consumidores. Precision decimal y columnas como timestamps deben comprobarse en schema concreto.

Fuera de alcance de F6: cambios backend/SQL, reservas, checkout publico e integracion automatica VITRUNO. Gate F5 real ejecutado al iniciar F6: 11/11 aprobado en DB test local. Operador confirma tambien SQL F5 aplicado; no se verifico produccion. QA navegador/impresion F4.1 sigue pendiente.
