# Arquitectura interna del backend

[Arquitectura macro](../../docs/architecture.md) delimita componentes y [contratos](../../docs/contracts.md) documenta HTTP. Backend: Node.js, Express 5, TypeScript estricto ESM/NodeNext, mysql2/promise, Zod 4, Decimal.js y JWT; sin ORM ni Clean Architecture formal.

## Montaje

[src/app.ts](../src/app.ts) configura proxy segun config, Helmet, CORS con credenciales, cookies, parsers/limites, CSRF, rate limit, rutas y error handler. [src/modules/index.ts](../src/modules/index.ts) exporta los tres routers principales:

- [businesses-app](../src/modules/businesses-app/index.ts), bajo `/api`: operacion por negocio. Agrupa auth, negocio, usuarios/permisos, suscripcion/legal/notificaciones, maestros, inventario, compras/ventas, pagos, entregas, caja/rendiciones, tickets y dashboard.
- [platform](../src/modules/platform/index.ts), bajo `/api/platform`: auth, negocios, usuarios, suscripciones, dashboard, auditoria y notificaciones SaaS. El router se monta bajo `/api` y agrega `/platform` internamente.
- [storefront-app](../src/modules/storefront-app/index.ts), bajo `/api/public`: catalogo de solo lectura. El negocio se resuelve por `PUBLIC_CATALOG_BUSINESS_SLUG`, no por un tenant elegido libremente desde body. Sin slug valido configurado el catalogo no esta disponible.

[modules/notifications](../src/modules/notifications) aporta infraestructura compartida; los contextos internos mantienen sus rutas/destinatarios separados.

## Flujo representativo

Request -> route -> middleware -> controller -> Zod -> service -> procedure/query -> mapper -> response.

Los modulos suelen separar routes, controllers, validations, services, types, helpers e index.ts. No todos tienen las mismas carpetas ni un mapper externo; no imponer una capa nueva para uniformarlos.

[Customers controller](../src/modules/businesses-app/customers/controllers/customers.controller.ts) toma tenant autenticado, valida y llama [service](../src/modules/businesses-app/customers/services/customers.service.ts), que usa CALL y [mapper](../src/modules/businesses-app/customers/helpers/customer.mapper.ts). Sus imports locales `.js` responden a NodeNext; el archivo fuente es `.ts`.

Services acceden a [pool DB](../src/db/db.ts) con procedures y algunas queries parametrizadas. Tipos separan DB rows de respuestas; helpers resuelven transformaciones/calculos. Los controllers conservan contratos y mapeo de errores del modulo; el error handler global no reemplaza todos los catch locales.

Seguridad y orden exacto de middleware BUSINESS: [security-tenancy](security-tenancy.md). Ownership por flujo, locks y replay: [transactions](transactions.md). Convenciones: [coding-rules](coding-rules.md). Comandos y restricciones de tests: [testing](testing.md).

## Catalogo y futuras fases

[Catalog routes](../src/modules/storefront-app/catalog/routes/catalog.routes.ts) expone GET de negocio/catalogo, categorias, productos y detalle por slug. Los procedures y mappers publicos usan stock del deposito predeterminado activo y campos publicos sin costos. API publica y administrativa son contratos distintos; no reutilizar respuestas privadas.

[Orders](../src/modules/businesses-app/orders/index.ts) implementa pedidos internos DB/backend, montados en BUSINESS despues de sus controles operativos. Create/update/status/cancel usan transacciones del service y procedures Orders; no escriben stock ni entidades economicas. API en [contracts](../../docs/contracts.md), ownership en [transactions](transactions.md) y evidencias en [F3](../../docs/f03-orders-core-validation.md). Frontend Orders F4/F4.1 implementado. F5 incorpora conversion backend READY -> Sale/COMPLETED reutilizando Sales en una transaccion. Frontend de conversion F6 y reservas siguen pendientes.
