# Punto de Venta

## 1. Descripcion general

Punto de Venta es una aplicacion web para administracion comercial de negocios que necesitan operar ventas, compras, productos, inventario, clientes, proveedores, depositos y reportes basicos desde un panel administrativo.

El codigo actual implementa una arquitectura multi-negocio con dos grandes contextos:

- **businesses-app**: aplicacion operativa usada por cada negocio.
- **platform**: panel interno para administracion de plataforma, usuarios de plataforma y suscripciones SaaS.

El aislamiento por negocio se apoya en `idBusiness`, JWT con contexto `BUSINESS` y middlewares que cargan contexto comercial y validan la suscripcion operativa.

Por la estructura de carpetas, middlewares y tablas de suscripciones, el proyecto esta orientado a funcionar como SaaS multi-negocio.

## 2. Estado actual del proyecto

### Implementado con rutas backend, servicios y vistas frontend

- Autenticacion del negocio.
- Registro de negocio + usuario administrador.
- Perfil de usuario y cambio de contrasena.
- Configuracion del negocio.
- Dashboard operativo.
- Clientes.
- Proveedores.
- Categorias de producto.
- Depositos.
- Productos.
- Importacion masiva de productos por Excel.
- Stock e inventario.
- Movimientos de stock.
- Ventas.
- Tickets de venta.
- Compras.
- Estado de suscripcion del negocio.
- Autenticacion de plataforma.
- Suscripciones SaaS de plataforma: planes, asignaciones, pagos, eventos y acciones administrativas.

### Parcialmente desarrollado

- **Dashboard de plataforma**: existe ruta y vista frontend en `client/src/views/platform/module/dashboard/page/PlatformDashboardPage.tsx`, pero muestra metricas estaticas en cero y un mensaje de modulo en desarrollo.
- **Modulo `copy` en frontend**: existe carpeta `client/src/views/businesses-app/module/copy`, pero no aparece conectado en `AdminRoutes.tsx`.
- **Base de datos versionada**: existen procedures, seeds y fixes, pero no se observa un conjunto completo de migraciones/versionado de tablas para toda la base. Solo se encontro `server/src/db/tables/platform_users.sql` como script de tabla.

### Pendiente de confirmar

- Estado final de todas las tablas reales de MySQL, porque el repositorio contiene principalmente procedimientos almacenados y no todos los `CREATE TABLE`.
- Cobertura de tests automatizados. El backend tiene script `test`, pero solo imprime un error por defecto.

## 3. Tecnologias utilizadas

### Backend

- **Lenguaje**: TypeScript.
- **Runtime**: Node.js con ESM (`"type": "module"`).
- **Framework HTTP**: Express 5.
- **Base de datos**: MySQL mediante `mysql2/promise`.
- **Autenticacion**: JWT con `jsonwebtoken`.
- **Passwords**: `bcrypt`.
- **Cookies**: `cookie-parser`.
- **CORS**: `cors` con allowlist desde variables de entorno.
- **Logs HTTP**: `morgan`.
- **Validaciones**: Zod.
- **Archivos Excel**: `xlsx` y `multer` para importacion de productos.
- **Calculos decimales**: `decimal.js`.
- **Desarrollo**: `tsx watch`.
- **Build**: `tsc` y `tsc-alias`.

### Frontend

- **Framework**: React 19.
- **Lenguaje**: TypeScript.
- **Bundler**: Vite.
- **Routing**: `react-router-dom`.
- **Estado global**: Zustand.
- **HTTP**: Axios con instancias separadas para negocio y plataforma.
- **UI / estilos**: Tailwind CSS 4, componentes propios estilo Shadcn UI en `client/src/components/ui`.
- **Iconos**: `lucide-react`.
- **Notificaciones**: `react-hot-toast`.
- **Metadatos**: `react-helmet-async` y componente `Meta`.
- **Graficos**: `recharts` y componentes de chart.
- **Validaciones**: Zod en formularios.
- **Calculos decimales**: `decimal.js`.

### Base de datos

- **Motor**: MySQL.
- **Conexion**: `server/src/db/db.ts`.
- **Procedures**: `server/src/db/procedures`.
- **Seeds**: `server/src/db/insert`.
- **Fixes**: `server/src/db/fixed`.
- **Tablas versionadas en repo**: `server/src/db/tables/platform_users.sql`.
- **Triggers**: no se encontraron scripts `CREATE TRIGGER`.

## 4. Estructura del repositorio

```text
App_MaxiKiosco/
|-- client/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |   |-- layout/
|   |   |   `-- ui/
|   |   |-- hooks/
|   |   |-- routes/
|   |   `-- views/
|   |       |-- businesses-app/
|   |       |   |-- middlewares/
|   |       |   |-- module/
|   |       |   `-- routes/
|   |       |-- home/
|   |       `-- platform/
|   |           |-- components/
|   |           |-- middlewares/
|   |           |-- module/
|   |           `-- routes/
|   |-- package.json
|   `-- vite.config.ts
|-- server/
|   |-- src/
|   |   |-- db/
|   |   |   |-- fixed/
|   |   |   |-- insert/
|   |   |   |-- procedures/
|   |   |   `-- tables/
|   |   |-- libs/
|   |   |-- middlewares/
|   |   |-- modules/
|   |   |   |-- businesses-app/
|   |   |   `-- platform/
|   |   |-- types/
|   |   |-- app.ts
|   |   `-- index.ts
|   |-- package.json
|   `-- tsconfig.json
|-- .gitignore
`-- README.md
```

Responsabilidades principales:

- `client/src/views/businesses-app`: panel operativo de cada negocio.
- `client/src/views/platform`: panel interno de plataforma.
- `client/src/components/ui`: componentes UI reutilizables.
- `client/src/api`: instancia Axios principal para negocio.
- `server/src/modules/businesses-app`: modulos backend del negocio.
- `server/src/modules/platform`: modulos backend de plataforma.
- `server/src/db/procedures`: procedimientos almacenados MySQL por dominio.
- `server/src/middlewares`: autenticacion, contexto, roles y control de suscripcion.
- `server/src/libs`: utilidades de JWT y cookies.

## 5. Arquitectura del backend

El backend combina arquitectura modular por dominio y separacion por capas. Cada modulo suele organizarse en:

- `routes`: define endpoints Express.
- `controllers`: recibe `Request`, valida datos cuando corresponde y arma respuestas HTTP.
- `services`: invoca procedures MySQL y concentra reglas de negocio.
- `validations`: esquemas Zod.
- `types`: tipos TypeScript de payloads, filas SQL y responses.
- `helpers`: mappers, generadores, validadores y utilidades especificas.
- `middlewares`: autorizacion, contexto y validaciones transversales.

Flujo tipico de una solicitud:

1. `server/src/app.ts` monta rutas bajo `/api`.
2. `server/src/modules/index.ts` exporta `platformRoutes` y `businessesAppRoutes`.
3. La ruta entra al modulo correspondiente.
4. `requireAuth` valida JWT desde cookie `access_token` o header `Authorization: Bearer`.
5. Para negocios, `requireBusinessContext` exige contexto `BUSINESS`.
6. Para operaciones del negocio, `requireOperationalSubscription` consulta la suscripcion y puede bloquear con HTTP 402.
7. El controller valida params/body/query con Zod o helpers.
8. El service ejecuta un `CALL sp_*` usando `pool.query`.
9. El resultado se mapea y se devuelve como JSON.

## 6. Arquitectura del frontend

El frontend esta dividido en tres areas:

- `home`: rutas publicas (`/`, `/login`, `/register`).
- `businesses-app`: panel administrativo del negocio en `/admin/*`.
- `platform`: panel interno SaaS en `/platform/*`.

Elementos principales:

- `AppRoutes.tsx`: separa rutas publicas, admin y plataforma.
- `PrivateRoute`: protege `/admin/*` usando `useAuthStore`.
- `PlatformProtectedRoute`: protege `/platform/*` usando `usePlatformAuthStore`.
- `AdminLayout`: layout principal del panel del negocio.
- `PlatformLayout`: layout del panel platform.
- Hooks por modulo: encapsulan carga, filtros, mutaciones y errores.
- Archivos `api/*.api.ts`: concentran llamadas Axios.
- Validaciones con Zod por modulo.
- Stores Zustand:
  - `businesses-app/module/auth/store/auth.store.ts`.
  - `businesses-app/module/subscription/store/businessSubscription.store.ts`.
  - `platform/module/auth/store/platformAuth.store.ts`.

Flujo tipico frontend:

1. Una page usa un hook de modulo.
2. El hook consume un archivo `api`.
3. Axios envia cookies y/o token.
4. Interceptores intentan refresh ante HTTP 401.
5. La respuesta actualiza estado local o global.
6. La UI renderiza tablas, modales, metricas o formularios.

## 7. Modulos funcionales

### Auth del negocio

- **Proposito**: login, registro con negocio, refresh, logout, usuario actual, perfil y cambio de contrasena.
- **Backend**:
  - `server/src/modules/businesses-app/auth`.
  - Procedures: `server/src/db/procedures/auth.sql`.
- **Endpoints**:
  - `POST /api/register`
  - `POST /api/login`
  - `POST /api/refresh`
  - `POST /api/logout`
  - `GET /api/me`
  - `GET /api/auth/user-info/:idUser`
  - `PATCH /api/auth/update-password/:idUser`
- **Frontend**:
  - `client/src/views/home/page/LoginPage.tsx`
  - `client/src/views/home/page/RegisterPage.tsx`
  - `client/src/views/businesses-app/module/auth/page/ProfilePage.tsx`
  - `client/src/views/businesses-app/module/auth/store/auth.store.ts`
- **Tablas involucradas**: `users`, `businesses`, `business_users`, `user_sessions`, `business_subscriptions`, `subscription_events`.
- **Estado**: implementado.

### Negocios

- **Proposito**: visualizar y editar datos del negocio actual.
- **Backend**: `server/src/modules/businesses-app/businesses`.
- **Endpoints**:
  - `GET /api/businesses`
  - `PATCH /api/businesses/me`
- **Frontend**: `client/src/views/businesses-app/module/businesses`.
- **Tabla**: `businesses`.
- **Estado**: implementado.

### Dashboard operativo

- **Proposito**: metricas y graficos del negocio.
- **Backend**: `server/src/modules/businesses-app/dashboard`, `server/src/db/procedures/dashboard.sql`.
- **Endpoint**: `GET /api/dashboard/metrics`.
- **Frontend**: `client/src/views/businesses-app/module/dashboard`.
- **Tablas consultadas**: `sales`, `stock`, `products`, `customers`, `sale_details`, `payment_methods`, `deposits`.
- **Estado**: implementado.

### Clientes

- **Proposito**: CRUD sin delete fisico; estado activo/inactivo.
- **Backend**: `server/src/modules/businesses-app/customers`.
- **Endpoints**:
  - `POST /api/customers`
  - `GET /api/customers`
  - `GET /api/customers/:id`
  - `PUT /api/customers/:id`
  - `PATCH /api/customers/:id/status`
- **Frontend**: `client/src/views/businesses-app/module/customers`.
- **Tabla**: `customers`.
- **Estado**: implementado.

### Proveedores

- **Proposito**: gestion de proveedores y estado.
- **Backend**: `server/src/modules/businesses-app/suppliers`.
- **Endpoints**:
  - `POST /api/suppliers`
  - `GET /api/suppliers`
  - `GET /api/suppliers/:id`
  - `PATCH /api/suppliers/:id`
- **Frontend**: `client/src/views/businesses-app/module/suppliers`.
- **Tabla**: `suppliers`.
- **Estado**: implementado.

### Categorias de producto

- **Proposito**: alta, lectura, edicion y cambio de estado de categorias.
- **Backend**: `server/src/modules/businesses-app/product-categories`.
- **Endpoints**:
  - `GET /api/product-categories`
  - `GET /api/product-categories/:idProductCategory`
  - `POST /api/product-categories`
  - `PATCH /api/product-categories/:idProductCategory`
  - `PATCH /api/product-categories/:idProductCategory/status`
- **Frontend**: `client/src/views/businesses-app/module/product-categories`.
- **Tabla**: `product_categories`.
- **Estado**: implementado.

### Depositos

- **Proposito**: gestion de depositos/almacenes del negocio.
- **Backend**: `server/src/modules/businesses-app/deposits`.
- **Endpoints**:
  - `GET /api/deposits`
  - `GET /api/deposits/:idDeposit`
  - `POST /api/deposits`
  - `PATCH /api/deposits/:idDeposit`
- **Frontend**: `client/src/views/businesses-app/module/deposits`.
- **Tabla**: `deposits`.
- **Estado**: implementado.

### Productos

- **Proposito**: gestion de productos, precios, estado, tipos de unidad y stock inicial.
- **Backend**: `server/src/modules/businesses-app/products`.
- **Endpoints**:
  - `POST /api/products`
  - `GET /api/products`
  - `GET /api/products/:id`
  - `PUT /api/products/:id`
  - `PATCH /api/products/:idProduct/prices`
  - `PATCH /api/products/:id/status`
- **Importacion**:
  - `GET /api/products/import/template`
  - `POST /api/products/import/preview`
  - `POST /api/products/import/confirm`
- **Frontend**: `client/src/views/businesses-app/module/products`.
- **Tablas**: `products`, `stock`, `product_categories`, `deposits`.
- **Estado**: implementado.

### Stock

- **Proposito**: existencias por producto/deposito, busqueda avanzada, reporte critico y balance.
- **Backend**: `server/src/modules/businesses-app/stock`.
- **Endpoints**:
  - `GET /api/stock`
  - `GET /api/stock/advanced-search`
  - `GET /api/stock/report/critical`
  - `GET /api/stock/balance`
  - `GET /api/stock/:id`
  - `POST /api/stock`
- **Frontend**:
  - `client/src/views/businesses-app/module/stock/page/StockPage.tsx`
  - `client/src/views/businesses-app/module/stock/page/InfoStockCritical.tsx`
- **Tablas**: `stock`, `products`, `deposits`, `product_categories`, `stock_movements`.
- **Estado**: implementado.

### Movimientos de stock

- **Proposito**: auditoria y ajustes/transferencias manuales.
- **Backend**: `server/src/modules/businesses-app/stock_movements`.
- **Endpoints**:
  - `GET /api/stock-movements`
  - `POST /api/stock-movements/adjust`
  - `POST /api/stock-movements/transfer`
- **Frontend**: `client/src/views/businesses-app/module/stock/page/StockMovementPage.tsx`.
- **Tablas**: `stock_movements`, `stock`, `products`, `users`, `deposits`, `businesses`.
- **Estado**: implementado.

### Ventas

- **Proposito**: registrar ventas, descontar stock, consultar historial, ver detalle y anular ventas.
- **Backend**: `server/src/modules/businesses-app/sales`.
- **Endpoints**:
  - `POST /api/sales`
  - `GET /api/sales`
  - `GET /api/sales/products-by-deposit/:idDeposit`
  - `GET /api/sales/:id`
  - `PATCH /api/sales/:id/cancel`
- **Frontend**:
  - `CreateSalePage.tsx`
  - `SaleAllPage.tsx`
  - `ViewSaleDetails.tsx`
- **Tablas**: `sales`, `sale_details`, `stock`, `stock_movements`, `customers`, `payment_methods`, `deposits`, `users`, `products`.
- **Estado**: implementado.

### Tickets

- **Proposito**: generar ticket HTML de venta.
- **Backend**: `server/src/modules/businesses-app/tickets`.
- **Endpoint**: `GET /api/tickets/sale/:idSale`.
- **Frontend relacionado**: acciones de impresion en ventas.
- **Tablas**: `sales`, `sale_details`, `businesses`, `users`, `deposits`, `customers`, `payment_methods`, `products`.
- **Estado**: implementado.

### Compras

- **Proposito**: registrar compras, sumar stock, consultar historial, detalle y anular compras.
- **Backend**: `server/src/modules/businesses-app/purchases`.
- **Endpoints**:
  - `POST /api/purchases`
  - `GET /api/purchases`
  - `GET /api/purchases/:id`
  - `PATCH /api/purchases/:id/cancel`
- **Frontend**:
  - `CreatePurchasePage.tsx`
  - `PurchaseAllPage.tsx`
  - `ViewPurchaseDetails.tsx`
- **Tablas**: `purchases`, `purchase_details`, `suppliers`, `products`, `deposits`, `stock`, `stock_movements`, `users`.
- **Estado**: implementado.

### Suscripcion del negocio

- **Proposito**: consultar estado comercial y limites de uso del negocio.
- **Backend**: `server/src/modules/businesses-app/subscription`.
- **Endpoint**: `GET /api/business/subscription`.
- **Frontend**: `client/src/views/businesses-app/module/subscription`.
- **Tablas**: `business_subscriptions`, `subscription_plans`, `businesses`.
- **Estado**: implementado.

### Auth de plataforma

- **Proposito**: login, refresh, logout, bootstrap y creacion de usuarios internos de plataforma.
- **Backend**: `server/src/modules/platform/auth`.
- **Endpoints**:
  - `POST /api/platform/auth/bootstrap`
  - `POST /api/platform/auth/base-user`
  - `POST /api/platform/auth/login`
  - `POST /api/platform/auth/refresh`
  - `POST /api/platform/auth/logout`
  - `GET /api/platform/auth/me`
  - `POST /api/platform/users`
- **Frontend**: `client/src/views/platform/module/auth`.
- **Tablas**: `users`, `platform_users`, `user_sessions`.
- **Estado**: implementado.

### Suscripciones de plataforma

- **Proposito**: administracion SaaS de planes, suscripciones, pagos y eventos.
- **Backend**: `server/src/modules/platform/subscriptions`.
- **Frontend**: `client/src/views/platform/module/subscriptions`.
- **Tablas**: `subscription_plans`, `business_subscriptions`, `subscription_payments`, `subscription_events`, `businesses`, `users`.
- **Estado**: implementado.

### Dashboard de plataforma

- **Proposito**: pantalla inicial del panel interno.
- **Frontend**: `client/src/views/platform/module/dashboard`.
- **Backend**: no se encontro modulo backend especifico.
- **Estado**: parcial; metricas estaticas en la vista.

## 8. Autenticacion, autorizacion y roles

### Negocio

- Login: `POST /api/login`.
- Registro: `POST /api/register`, crea usuario, negocio, relacion `business_users` y suscripcion inicial.
- Refresh: `POST /api/refresh`.
- Logout: `POST /api/logout`.
- Usuario actual: `GET /api/me`.
- JWT access token: expira en `15m`.
- JWT refresh token: expira en `7d`.
- El token de negocio contiene `context: "BUSINESS"`, `idUser`, `idBusiness` y `businessRole`.
- `requireAuth` acepta token desde cookie `access_token` o header `Authorization: Bearer`.

### Plataforma

- Login: `POST /api/platform/auth/login`.
- Refresh: `POST /api/platform/auth/refresh`.
- Bootstrap: `POST /api/platform/auth/bootstrap`, condicionado por variables `PLATFORM_BOOTSTRAP_ENABLED` y `PLATFORM_BOOTSTRAP_SECRET`.
- Usuarios de plataforma: tabla `platform_users`.
- Roles platform confirmados: `SUPER_ADMIN`, `SUPPORT`, `ANALYST`.
- El token de plataforma contiene `context: "PLATFORM"`.
- `requireAuth` impide usar tokens de plataforma en rutas de negocio y tokens de negocio en rutas `/api/platform`.

### Middlewares relevantes

- `requireAuth`: valida JWT y separa contexto `BUSINESS` / `PLATFORM`.
- `requireBusinessContext`: exige contexto de negocio.
- `requireOperationalSubscription`: consulta suscripcion y bloquea operaciones si `canOperate` es falso.
- `requirePlatformContext`: exige contexto de plataforma.
- `requirePlatformRoles`: valida roles internos de plataforma.

## 9. Arquitectura multi-negocio

El aislamiento multi-negocio se implementa principalmente con:

- `idBusiness` dentro del payload JWT de negocio.
- `req.user.idBusiness` inyectado por `requireAuth`.
- Middlewares de contexto antes de los modulos operativos.
- Procedures que reciben `p_idBusiness` y filtran consultas por negocio.
- Relaciones `business_users` entre usuarios y negocios.
- Tabla `businesses` como entidad principal del comercio.
- Tabla `business_subscriptions` para estado SaaS por negocio.

Observacion: gran parte de los procedures usa explicitamente `p_idBusiness`, por ejemplo productos, ventas, compras, stock, clientes y proveedores. El riesgo de acceso cruzado debe revisarse cada vez que se agreguen nuevos endpoints o procedures.

## 10. Sistema de suscripciones

El sistema de suscripciones esta implementado en backend platform y se consume tambien desde businesses-app.

### Tablas identificadas

- `subscription_plans`
- `business_subscriptions`
- `subscription_payments`
- `subscription_events`
- `businesses`
- `users`

### Estados identificados

Suscripcion:

- `TRIAL`
- `ACTIVE`
- `PAST_DUE`
- `SUSPENDED`
- `CANCELLED`
- `EXPIRED`

Pagos:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`
- `REFUNDED`

Eventos:

- `TRIAL_STARTED`
- `TRIAL_EXPIRED`
- `PAYMENT_CREATED`
- `PAYMENT_PENDING`
- `PAYMENT_APPROVED`
- `PAYMENT_REJECTED`
- `PAYMENT_CANCELLED`
- `PAYMENT_REFUNDED`
- `SUBSCRIPTION_ACTIVATED`
- `SUBSCRIPTION_RENEWED`
- `SUBSCRIPTION_PAST_DUE`
- `SUBSCRIPTION_SUSPENDED`
- `SUBSCRIPTION_REACTIVATED`
- `SUBSCRIPTION_CANCELLED`
- `SUBSCRIPTION_EXPIRED`
- `PLAN_CHANGED`
- `AUTO_RENEW_ENABLED`
- `AUTO_RENEW_DISABLED`

### Funciones implementadas

- CRUD/estado de planes.
- Listado y asignacion de suscripciones a negocios.
- Cambio de plan.
- Suspender, reactivar, cancelar y auto-renew.
- Registro de pagos.
- Actualizacion de estado de pagos.
- Listado de eventos.
- Proceso de expiraciones con `SUBSCRIPTION_GRACE_PERIOD_DAYS`.
- Consulta de suscripcion actual del negocio.
- Bloqueo operativo con `requireOperationalSubscription`.
- Banner/estado comercial en frontend businesses-app.

### Pendiente o parcial

- Dashboard platform con metricas reales: no se encontro consumo backend en la vista actual.
- Migraciones completas de las tablas de suscripcion: el repo contiene procedures y seed, pero no todos los `CREATE TABLE`.

## 11. Base de datos

Tablas principales identificadas desde procedures, scripts y codigo:

| Tabla | Funcion |
| --- | --- |
| `users` | Usuarios del sistema, tanto negocio como plataforma. |
| `businesses` | Negocios/comercios tenant. |
| `business_users` | Relacion usuario-negocio y rol de negocio. |
| `user_sessions` | Sesiones y refresh tokens; `platform_auth.sql` agrega `auth_context`. |
| `platform_users` | Usuarios internos de plataforma con rol `SUPER_ADMIN`, `SUPPORT` o `ANALYST`. |
| `subscription_plans` | Planes SaaS. |
| `business_subscriptions` | Suscripcion asociada a cada negocio. |
| `subscription_payments` | Pagos de suscripciones. |
| `subscription_events` | Auditoria de eventos de suscripcion. |
| `customers` | Clientes del negocio. |
| `suppliers` | Proveedores del negocio. |
| `product_categories` | Categorias de productos. |
| `deposits` | Depositos/almacenes. |
| `products` | Productos, precios, codigo de barras y tipo de unidad. |
| `stock` | Existencias por producto y deposito. |
| `stock_movements` | Auditoria de movimientos de inventario. |
| `sales` | Cabecera de ventas. |
| `sale_details` | Detalle de ventas. |
| `purchases` | Cabecera de compras. |
| `purchase_details` | Detalle de compras. |
| `payment_methods` | Metodos de pago consultados por ventas/tickets/dashboard. |

Procedures por archivo:

- `auth.sql`
- `businesses.sql`
- `customers.sql`
- `dashboard.sql`
- `deposits.sql`
- `platform_auth.sql`
- `product-categories.sql`
- `products.sql`
- `purchases.sql`
- `sales.sql`
- `stock.sql`
- `stock_movements.sql`
- `subscriptions.sql`
- `suppliers.sql`
- `tickets.sql`

Seeds y fixes:

- `server/src/db/insert/subscriptions_seed.sql`: asegura plan `BASIC_MONTHLY`.
- `server/src/db/fixed/fix_collations.sql`: correcciones de collations.
- `server/src/db/fixed/subscriptions_pk_fix.sql`: fix de claves relacionadas con suscripciones.

No se encontraron triggers versionados en `server/src/db`.

## 12. Endpoints principales

Todos los endpoints estan montados bajo `/api`.

| Metodo | Endpoint | Modulo | Autenticacion | Rol requerido | Descripcion |
| --- | --- | --- | --- | --- | --- |
| POST | `/register` | Auth negocio | No | No aplica | Registra negocio y usuario. |
| POST | `/login` | Auth negocio | No | No aplica | Inicia sesion negocio. |
| POST | `/refresh` | Auth negocio | Cookie refresh | No aplica | Refresca sesion. |
| POST | `/logout` | Auth negocio | Si | Negocio | Cierra sesion. |
| GET | `/me` | Auth negocio | Si | Negocio | Usuario autenticado. |
| GET | `/auth/user-info/:idUser` | Auth negocio | Si | Negocio | Perfil de usuario por ID. |
| PATCH | `/auth/update-password/:idUser` | Auth negocio | Si | Negocio | Cambia contrasena. |
| GET | `/businesses` | Negocios | Si | Negocio | Obtiene negocio actual. |
| PATCH | `/businesses/me` | Negocios | Si | Negocio | Actualiza negocio actual. |
| GET | `/dashboard/metrics` | Dashboard | Si | Negocio operativo | Metricas del negocio. |
| POST | `/customers` | Clientes | Si | Negocio operativo | Crea cliente. |
| GET | `/customers` | Clientes | Si | Negocio operativo | Lista clientes. |
| GET | `/customers/:id` | Clientes | Si | Negocio operativo | Obtiene cliente. |
| PUT | `/customers/:id` | Clientes | Si | Negocio operativo | Actualiza cliente. |
| PATCH | `/customers/:id/status` | Clientes | Si | Negocio operativo | Cambia estado. |
| POST | `/suppliers` | Proveedores | Si | Negocio operativo | Crea proveedor. |
| GET | `/suppliers` | Proveedores | Si | Negocio operativo | Lista proveedores. |
| GET | `/suppliers/:id` | Proveedores | Si | Negocio operativo | Obtiene proveedor. |
| PATCH | `/suppliers/:id` | Proveedores | Si | Negocio operativo | Actualiza proveedor/estado. |
| GET | `/product-categories` | Categorias | Si | Negocio operativo | Lista categorias. |
| GET | `/product-categories/:idProductCategory` | Categorias | Si | Negocio operativo | Obtiene categoria. |
| POST | `/product-categories` | Categorias | Si | Negocio operativo | Crea categoria. |
| PATCH | `/product-categories/:idProductCategory` | Categorias | Si | Negocio operativo | Actualiza categoria. |
| PATCH | `/product-categories/:idProductCategory/status` | Categorias | Si | Negocio operativo | Cambia estado. |
| GET | `/deposits` | Depositos | Si | Negocio operativo | Lista depositos. |
| GET | `/deposits/:idDeposit` | Depositos | Si | Negocio operativo | Obtiene deposito. |
| POST | `/deposits` | Depositos | Si | Negocio operativo | Crea deposito. |
| PATCH | `/deposits/:idDeposit` | Depositos | Si | Negocio operativo | Actualiza deposito. |
| POST | `/products` | Productos | Si | Negocio operativo | Crea producto. |
| GET | `/products` | Productos | Si | Negocio operativo | Lista productos. |
| GET | `/products/:id` | Productos | Si | Negocio operativo | Obtiene producto. |
| PUT | `/products/:id` | Productos | Si | Negocio operativo | Actualiza producto. |
| PATCH | `/products/:idProduct/prices` | Productos | Si | Negocio operativo | Actualiza precios. |
| PATCH | `/products/:id/status` | Productos | Si | Negocio operativo | Cambia estado. |
| GET | `/products/import/template` | Importacion productos | Si | Negocio operativo | Descarga plantilla. |
| POST | `/products/import/preview` | Importacion productos | Si | Negocio operativo | Previsualiza Excel. |
| POST | `/products/import/confirm` | Importacion productos | Si | Negocio operativo | Confirma importacion. |
| GET | `/stock` | Stock | Si | Negocio operativo | Lista stock. |
| GET | `/stock/advanced-search` | Stock | Si | Negocio operativo | Busqueda avanzada paginada. |
| GET | `/stock/report/critical` | Stock | Si | Negocio operativo | Reporte critico. |
| GET | `/stock/balance` | Stock | Si | Negocio operativo | Balance de stock. |
| GET | `/stock/:id` | Stock | Si | Negocio operativo | Obtiene stock. |
| POST | `/stock` | Stock | Si | Negocio operativo | Crea stock inicial. |
| GET | `/stock-movements` | Movimientos stock | Si | Negocio operativo | Lista movimientos. |
| POST | `/stock-movements/adjust` | Movimientos stock | Si | Negocio operativo | Ajuste manual. |
| POST | `/stock-movements/transfer` | Movimientos stock | Si | Negocio operativo | Transferencia. |
| POST | `/sales` | Ventas | Si | Negocio operativo | Crea venta. |
| GET | `/sales` | Ventas | Si | Negocio operativo | Lista ventas. |
| GET | `/sales/products-by-deposit/:idDeposit` | Ventas | Si | Negocio operativo | Productos disponibles por deposito. |
| GET | `/sales/:id` | Ventas | Si | Negocio operativo | Detalle de venta. |
| PATCH | `/sales/:id/cancel` | Ventas | Si | Negocio operativo | Anula venta. |
| GET | `/tickets/sale/:idSale` | Tickets | Si | Negocio operativo | Genera ticket HTML. |
| POST | `/purchases` | Compras | Si | Negocio operativo | Crea compra. |
| GET | `/purchases` | Compras | Si | Negocio operativo | Lista compras. |
| GET | `/purchases/:id` | Compras | Si | Negocio operativo | Detalle de compra. |
| PATCH | `/purchases/:id/cancel` | Compras | Si | Negocio operativo | Anula compra. |
| GET | `/business/subscription` | Suscripcion negocio | Si | Negocio | Estado comercial del negocio. |
| POST | `/platform/auth/bootstrap` | Auth plataforma | No | Condicionado por secret/env | Bootstrap inicial. |
| POST | `/platform/auth/base-user` | Auth plataforma | No | Condicionado por env | Crea usuario base. |
| POST | `/platform/auth/login` | Auth plataforma | No | No aplica | Login platform. |
| POST | `/platform/auth/refresh` | Auth plataforma | Cookie/header | No aplica | Refresh platform. |
| POST | `/platform/auth/logout` | Auth plataforma | Si | Platform | Logout platform. |
| GET | `/platform/auth/me` | Auth plataforma | Si | Platform | Usuario platform actual. |
| POST | `/platform/users` | Auth plataforma | Si | SUPER_ADMIN | Crea usuario platform. |
| GET | `/platform/business-options` | Suscripciones platform | Si | SUPER_ADMIN/SUPPORT/ANALYST | Opciones de negocios. |
| GET | `/platform/subscription-plans` | Suscripciones platform | Si | SUPER_ADMIN/SUPPORT/ANALYST | Lista planes. |
| GET | `/platform/subscription-plans/:idSubscriptionPlan` | Suscripciones platform | Si | SUPER_ADMIN/SUPPORT/ANALYST | Obtiene plan. |
| POST | `/platform/subscription-plans` | Suscripciones platform | Si | SUPER_ADMIN | Crea plan. |
| PATCH | `/platform/subscription-plans/:idSubscriptionPlan` | Suscripciones platform | Si | SUPER_ADMIN | Actualiza plan. |
| PATCH | `/platform/subscription-plans/:idSubscriptionPlan/status` | Suscripciones platform | Si | SUPER_ADMIN | Cambia estado de plan. |
| GET | `/platform/business-subscriptions` | Suscripciones platform | Si | SUPER_ADMIN/SUPPORT/ANALYST | Lista suscripciones. |
| GET | `/platform/business-subscriptions/:idBusinessSubscription` | Suscripciones platform | Si | SUPER_ADMIN/SUPPORT/ANALYST | Obtiene suscripcion. |
| POST | `/platform/business-subscriptions` | Suscripciones platform | Si | SUPER_ADMIN | Asigna suscripcion. |
| PATCH | `/platform/business-subscriptions/:idBusinessSubscription/plan` | Suscripciones platform | Si | SUPER_ADMIN | Cambia plan. |
| PATCH | `/platform/business-subscriptions/:idBusinessSubscription/suspend` | Suscripciones platform | Si | SUPER_ADMIN/SUPPORT | Suspende suscripcion. |
| PATCH | `/platform/business-subscriptions/:idBusinessSubscription/reactivate` | Suscripciones platform | Si | SUPER_ADMIN/SUPPORT | Reactiva suscripcion. |
| PATCH | `/platform/business-subscriptions/:idBusinessSubscription/cancel` | Suscripciones platform | Si | SUPER_ADMIN | Cancela suscripcion. |
| PATCH | `/platform/business-subscriptions/:idBusinessSubscription/auto-renew` | Suscripciones platform | Si | SUPER_ADMIN/SUPPORT | Actualiza auto-renew. |
| GET | `/platform/business-subscriptions/:idBusinessSubscription/events` | Suscripciones platform | Si | SUPER_ADMIN/SUPPORT/ANALYST | Eventos de suscripcion. |
| GET | `/platform/subscription-payments` | Pagos platform | Si | SUPER_ADMIN/SUPPORT/ANALYST | Lista pagos. |
| GET | `/platform/subscription-payments/:idSubscriptionPayment` | Pagos platform | Si | SUPER_ADMIN/SUPPORT/ANALYST | Obtiene pago. |
| POST | `/platform/subscription-payments` | Pagos platform | Si | SUPER_ADMIN/SUPPORT | Crea pago. |
| PATCH | `/platform/subscription-payments/:idSubscriptionPayment/:status` | Pagos platform | Si | SUPER_ADMIN/SUPPORT | Cambia estado de pago. |
| GET | `/platform/subscription-events` | Eventos platform | Si | SUPER_ADMIN/SUPPORT/ANALYST | Lista eventos. |
| POST | `/platform/subscriptions/process-expirations` | Suscripciones platform | Si | SUPER_ADMIN | Procesa vencimientos. |

## 13. Variables de entorno

Variables encontradas en codigo:

```env
PORT=
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
FRONTEND_URL=
FRONTEND_URL_LOCAL=
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
NODE_ENV=
DEFAULT_TRIAL_PLAN_CODE=
SUBSCRIPTION_GRACE_PERIOD_DAYS=
PLATFORM_BOOTSTRAP_ENABLED=
PLATFORM_BOOTSTRAP_SECRET=
VITE_BACKEND_URL=
VITE_SUPPORT_WHATSAPP=
VITE_SUPPORT_EMAIL=
```

No incluir valores secretos reales en el repositorio.

## 14. Instalacion y ejecucion local

1. Clonar el repositorio.
2. Instalar dependencias del backend:

```bash
cd server
npm install
```

3. Instalar dependencias del frontend:

```bash
cd client
npm install
```

4. Configurar variables de entorno en `server/.env` y `client/.env`.
5. Crear la base de datos MySQL indicada por `DB_NAME`.
6. Ejecutar scripts SQL necesarios:
   - Tablas base del proyecto: Pendiente de confirmar, no se encontraron todos los `CREATE TABLE` en el repo.
   - `server/src/db/tables/platform_users.sql`.
   - Procedures en `server/src/db/procedures`.
   - Seed `server/src/db/insert/subscriptions_seed.sql`.
   - Fixes en `server/src/db/fixed` si aplica al entorno.
7. Levantar backend:

```bash
cd server
npm run dev
```

8. Levantar frontend:

```bash
cd client
npm run dev
```

## 15. Scripts disponibles

### Backend

| Comando | Descripcion |
| --- | --- |
| `npm run dev` | Ejecuta `tsx watch src/index.ts`. |
| `npm run typecheck` | Ejecuta `tsc --noEmit`. |
| `npm run build` | Ejecuta `tsc && tsc-alias`. |
| `npm run start` | Ejecuta `node dist/index.js`. |
| `npm run test` | Script placeholder que imprime error. |

### Frontend

| Comando | Descripcion |
| --- | --- |
| `npm run dev` | Levanta Vite en modo desarrollo. |
| `npm run build` | Ejecuta `tsc -b && vite build`. |
| `npm run lint` | Ejecuta ESLint sobre el proyecto. |
| `npm run preview` | Sirve build de Vite para previsualizacion. |

## 16. Flujo principal del sistema

1. El usuario del negocio se registra o inicia sesion.
2. El backend genera access token y refresh token.
3. El frontend guarda el access token en `localStorage` y usa cookies con `withCredentials`.
4. `requireAuth` valida token y carga `req.user.idBusiness`.
5. Las rutas operativas pasan por `requireBusinessContext`.
6. `requireOperationalSubscription` consulta la suscripcion actual del negocio.
7. Si el negocio puede operar, se ejecuta la accion: por ejemplo venta, compra, ajuste de stock o edicion de producto.
8. Los services llaman procedures MySQL filtrando por `idBusiness`.
9. La operacion queda asociada al negocio y puede impactar stock, movimientos, reportes y auditoria.

## 17. Convenciones del proyecto

- Backend con imports ESM y extension `.js` en imports locales.
- Alias `@/*` hacia `src/*` en backend y frontend.
- Modulos backend organizados por dominio.
- Modulos frontend organizados por dominio bajo `views/businesses-app/module` y `views/platform/module`.
- Respuestas backend del negocio usan frecuentemente `status: true/false`; platform usa `success: true/false`.
- Validaciones con Zod y errores de campos en arrays `{ field, message }` en varios controladores.
- Base de datos con nombres de tablas en snake_case.
- Columnas principales con prefijos `idBusiness`, `idUser`, `idProduct`, etc.
- Procedures con prefijo `sp_`.
- CRUD sin delete fisico en entidades operativas; se usan estados como `is_active` o `status`.
- Frontend usa componentes y hooks con funciones flecha.
- Backend usa mayormente funciones convencionales exportadas.

## 18. Riesgos, inconsistencias y deuda tecnica

### Hechos confirmados

- No se encontro un set completo de scripts `CREATE TABLE` para todas las tablas del sistema.
- `server/package.json` tiene `test` como placeholder.
- `client/src/views/businesses-app/module/copy` existe, pero no esta conectado en `AdminRoutes.tsx`.
- `PlatformDashboardPage.tsx` usa metricas hardcodeadas en cero.
- Existen fixes de collation y primary keys en `server/src/db/fixed`, lo que indica ajustes manuales necesarios en algunos entornos.
- Hay dos formatos de respuesta API: `status` en business app y `success` en platform.

### Riesgos potenciales

- Procedures desactualizados respecto a tablas reales si la DB evoluciono fuera del repositorio.
- Riesgo de acceso cruzado si nuevos procedures o endpoints no filtran por `idBusiness`.
- Falta de migraciones versionadas completas puede dificultar reproducir ambientes limpios.
- Falta de tests automatizados antes de produccion.
- Dashboard platform necesita backend real para metricas si se usara operativamente.
- Pendiente revisar que todas las validaciones frontend/backend esten sincronizadas.

## 19. Proximos pasos recomendados

### Critico antes de produccion

- Versionar todos los `CREATE TABLE` reales o adoptar migraciones.
- Revisar todos los procedures para confirmar filtro por `p_idBusiness` en modulos de negocio.
- Agregar tests basicos de auth, ventas, compras, stock y suscripciones.
- Homogeneizar formato de respuestas API o documentar contrato definitivo.
- Validar proceso completo de despliegue con DB limpia.

### Importante para el MVP

- Completar dashboard de plataforma con metricas reales.
- Documentar scripts SQL en orden de ejecucion.
- Revisar estados de cancelacion/anulacion en ventas y compras con auditoria.
- Asegurar que la importacion masiva respete limites del plan.
- Mejorar observabilidad de errores SQL y Zod.

### Mejoras posteriores

- Agregar migraciones automatizadas.
- Agregar OpenAPI/Swagger.
- Agregar tests end-to-end para flujos principales.
- Unificar nomenclatura visual entre `businesses-app` y `platform`.
- Agregar monitoreo de vencimientos de suscripcion programado.
