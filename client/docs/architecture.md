# Arquitectura interna del frontend

La [arquitectura de sistema](../../docs/architecture.md) define limites y [contracts](../../docs/contracts.md) define HTTP. Este documento describe la SPA React 19/TypeScript/Vite 8, React Router, Tailwind 4, Base UI/shadcn, Zustand, Axios y Zod.

## Routing y layouts

[src/routes/AppRoutes.tsx](../src/routes/AppRoutes.tsx) dirige `/admin/*` a businesses-app, `/platform/*` a platform y el resto a [home](../src/views/home). Los modulos viven bajo `views/<contexto>/module` y suelen separar page, components, hooks, api, types, validations y routes.

- [PrivateRoute](../src/views/businesses-app/middlewares/PrivateRoute.tsx) usa estado de sesion BUSINESS (`checking`/authenticated) y redirige a home si falta sesion.
- [AdminRoutes](../src/views/businesses-app/routes/AdminRoutes.tsx) compone modulos y [PermissionRoute](../src/views/businesses-app/components/PermissionRoute.tsx), que comprueba cualquiera de los permisos solicitados mediante hooks de permisos.
- [AdminLayout](../src/components/layout/AdminLayout.tsx) provee sidebar, header, consulta de precios, notificaciones y restricciones visuales por suscripcion/cambio de contrasena; permite rutas de recuperacion como perfil/legal/suscripcion segun estado.
- [PlatformRoutes](../src/views/platform/routes/PlatformRoutes.tsx) mantiene login publico y vistas protegidas mediante [PlatformProtectedRoute](../src/views/platform/middlewares/PlatformProtectedRoute.tsx). Este verifica sesion y contexto PLATFORM; [PlatformLayout](../src/views/platform/components/layout/PlatformLayout.tsx) contiene navegacion/notificaciones propias, menu movil y logout.

Estos controles visuales complementan la autorizacion backend; no reemplazan comprobaciones de tenant/permiso del API.

## Flujo y estado

Flujo habitual: Route -> Page -> Hook -> API -> Backend. Ejemplo: [useCustomers](../src/views/businesses-app/module/customers/hooks/useCustomers.ts) mantiene lista/loading/metricas locales y llama API del modulo. Las validaciones de formulario y helpers no se concentran en la page.

Zustand se usa para estado compartido: [auth BUSINESS](../src/views/businesses-app/module/auth/store/auth.store.ts), [auth PLATFORM](../src/views/platform/module/auth/store/platformAuth.store.ts), [suscripcion](../src/views/businesses-app/module/subscription/store/businessSubscription.store.ts), [carrito compras](../src/views/businesses-app/module/purchases/store/purchaseCart.store.ts) y [consulta precios](../src/store/priceChecker.store.ts). No existe un unico directorio de stores para todo el proyecto; tambien hay stores dentro del modulo.

## Transporte y UI

[src/api/axios.config.ts](../src/api/axios.config.ts) gestiona credenciales BUSINESS, header CSRF, refresh compartido y reintento unico; coordina errores de suscripcion/limites y expiracion de sesion. [platformAuth.api.ts](../src/views/platform/module/auth/api/platformAuth.api.ts) tiene instancia/interceptores propios, Bearer y refresh PLATFORM. Los contratos exactos de autenticacion estan centralizados en contracts; no mezclar instancias por conveniencia.

[components/ui](../src/components/ui) contiene componentes UI existentes, basados en Base UI; componentes de negocio viven cerca del modulo y layouts compartidos en [components](../src/components). [hooks](../src/hooks) contiene utilidades como useForm; [index.css](../src/index.css) importa Tailwind y define tema. Convenciones de formularios, errores y accesibilidad: [coding-rules](coding-rules.md). Niveles de evidencia: [testing](testing.md).

## Orders Admin F4

[Modulo Orders](../src/views/businesses-app/module/orders/index.ts) monta listado, nuevo, detalle y edicion bajo `/admin/orders`. Hooks separan consultas, datos maestros existentes, formulario e informacion de disponibilidad; no agrega stores globales. El formulario conserva snapshots al editar, usa Decimal.js y mantiene clave de create mientras el payload no cambie. Detalle aplica useCan por accion y solo ofrece el siguiente estado permitido; COMPLETED y CANCELLED son de lectura. La API usa exclusivamente la instancia BUSINESS y endpoints Orders F3/F5; no modifica backend ni publica Orders. Evidencia y limites: [F4 validation](../../docs/f04-orders-admin-frontend-validation.md).

## F6 — Conversion de pedido a venta

Desde detalle READY, CTA solo con orders.convert y sales.create. [OrderConversionDialog](../src/views/businesses-app/module/orders/components/OrderConversionDialog.tsx) es un checkout reducido Base UI con resumen Order read-only; reutiliza useSaleCashSession, usePaymentMethods, SalePaymentsSection y getDeliveryUsersForSaleRequest. Hook local valida pagos/balance Decimal y serializa solo caja/pagos/metadata de entrega al endpoint F5; no manda importes/productos/destinatario del pedido. Sin store nuevo ni POS duplicado.

Key/fingerprint estables para retry incierto; cambios de caja/pagos/metadata invalidan el intento y mutex bloquea doble submit/cierre durante proceso. Error conserva formulario; 409 exige refrescar Order antes de reintentar y deja bloqueado si falla refresh. Exito/replay reemplaza Order con response y muestra linkedSale; sales.view habilita Ver venta. COMPLETED y Sale CANCELLED nunca ofrecen reconversion. El pequeno ajuste compartido de pagos agrega labels/errores asociados, limites y disabled sin reescribir Nueva Venta. Gate backend real 11/11, build/lint aplicable y comprobaciones aisladas: [F6 validation](../../docs/f06-order-to-sale-frontend-validation.md); QA navegador pendiente.

## F7 — Proveedor Delivery y anulacion

DeliveryProviderFields/helper compartido por Nueva Venta, checkout Orders y AssignDeliveryDialog: sin asignar/cadete propio/tercero, con validacion y campos externos. El builder limpia campos incompatibles al cambiar modo; externalCost no entra en totales/pagos. La conversion sigue enviando solo metadata, sin reenviar destinatario/importe historico del Order. DeliveryProviderSummary y timeline muestran proveedor/costo/referencia explicitamente, conservando estados del backend.

Sales detail/list usan saleCancellationReason para explicar bloqueos conocidos; datos agregados del listado no prueban estado de cada settlement y backend sigue siendo autoridad. Cancelacion mapea codigos nuevos y legacy a mensajes claros. Sin UI de reembolso/F8, maestro de proveedores, users ficticios, pagos externos o store nuevo. [Validacion F7](../../docs/f07-delivery-providers-cancellation-validation.md).
