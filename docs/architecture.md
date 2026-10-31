# Arquitectura actual

## Componentes y limites

| Componente | Implementacion / entrada |
| --- | --- |
| client | React 19, TypeScript, Vite 8, React Router, Tailwind CSS 4, Base UI/shadcn, Zustand, Axios y Zod. [AppRoutes](../client/src/routes/AppRoutes.tsx) separa `/admin/*`, `/platform/*` y home. |
| server | Node.js, Express 5, TypeScript ESM/NodeNext, mysql2/promise, Zod 4, Decimal.js y JWT. [app.ts](../server/src/app.ts) configura HTTP y monta los contextos. |
| database | MySQL/MariaDB, tablas InnoDB, stored procedures y SQL versionado. [Operacion canonica](database.md). |

El backend monta storefront en `/api/public`, platform en `/api/platform` y negocios bajo `/api`. No hay una Clean Architecture formal ni ORM. Los services llaman procedures y, en algunos casos, SQL parametrizado directo.

## Backend

Flujo representativo: route -> middleware -> controller -> validacion Zod -> service -> procedure/DB -> mapper -> respuesta. Los helpers/mappers no son una capa obligatoria uniforme en todos los modulos.

- [businesses-app](../server/src/modules/businesses-app/index.ts): operacion de negocio; agrupa rutas de maestros, stock, compras, ventas, pagos, caja, entregas, rendiciones y tickets.
- [platform](../server/src/modules/platform/index.ts): auth, negocios, usuarios, dashboard, suscripciones, auditoria y notificaciones. Mantiene identidad/contexto PLATFORM separado.
- [storefront-app](../server/src/modules/storefront-app/index.ts): catalogo publico de solo lectura.
- [notifications compartido](../server/src/modules/notifications): infraestructura consumida por los contextos internos.

Cada modulo suele separar `routes`, `controllers`, `validations`, `services`, `types`, helpers e `index.ts`. Customers es un ejemplo compacto; Sales muestra coordinacion transaccional compleja.

### Tenant, identidad y autorizacion

`users` representa identidad, `business_users` pertenencia/rol en un negocio y `platform_users` acceso de plataforma. El token distingue BUSINESS y PLATFORM. `requireAuth` carga el contexto; `req.user.idBusiness` fija el tenant y `req.user.idUser` el actor.

La cadena operativa BUSINESS es `requireAuth -> requireBusinessContext -> requirePasswordChangeCompleted -> requireOperationalSubscription`. Auth, businesses, subscription, notifications y legal se montan antes y tienen controles propios. No moverlas indiscriminadamente ni asumir proteccion heredada para una ruta nueva.

`requirePermission` protege operaciones backend; filtros SQL por negocio y FKs compuestas refuerzan aislamiento. Ocultar UI no autoriza operaciones. Revisar permisos de SELLER/DELIVERY y endpoints de contexto antes de ampliar privilegios administrativos.

### HTTP y transacciones

`app.ts` configura Helmet, CORS con credenciales, limites de payload, CSRF, rate limiting y manejo global de errores. BUSINESS usa cookies HttpOnly con refresh y `/me`; [Axios](../client/src/api/axios.config.ts) usa `withCredentials`, header CSRF y coordinacion de refresh/suscripcion.

[Sales service](../server/src/modules/businesses-app/sales/services/sales.service.ts) posee la transaccion de creacion: misma conexion para cabecera, detalles/stock, pagos y entrega; commit/rollback y recuperacion idempotente. Los procedures participan en ese contrato; no agregar transacciones anidadas por suposicion. Existen otros procedures con manejo propio: inspeccionar el flujo afectado.

## Frontend

Las vistas viven en `client/src/views/businesses-app`, `platform` y `home`. El flujo habitual es page -> hook -> api -> backend; cada modulo separa componentes, tipos, validaciones y rutas. Zustand se usa para estado compartido, por ejemplo sesion y carritos; los hooks tambien mantienen estado local (Customers).

Los formularios usan `useForm` y utilidades del repo cuando corresponde. La UI es Base UI, no se debe asumir API Radix. Las rutas privadas y controles visuales complementan los permisos del servidor.

## Frontera publica y futura

[Catalog routes](../server/src/modules/storefront-app/catalog/routes/catalog.routes.ts) expone GET `/catalog`, `/catalog/categories`, `/catalog/products` y `/catalog/products/:slug`, relativos a `/api/public`. `PUBLIC_CATALOG_BUSINESS_SLUG` selecciona un negocio; sin configuracion valida el catalogo no esta disponible. Los procedures publicos consultan stock del deposito predeterminado activo y los mappers exponen datos publicos, no costos.

Admin API y storefront no se intercambian. VITRUNO es externo; el acuerdo de uso esta en [PRD](prd.md). Order y Sale seran entidades distintas: Orders aun no tiene tablas/modulo/rutas en este checkout. Conversion y reservas son fases futuras: [tasks](tasks.md).
