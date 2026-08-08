# Backend Testing

Esta carpeta contiene la infraestructura automatizada de tests del backend,
organizada por suites de seguridad, aislamiento multi-tenant, flujos economicos,
permisos/autenticacion y notificaciones internas.

## Requisitos

- Node.js compatible con el proyecto.
- Dependencias instaladas con `npm install`.
- Archivo `.env.test` local basado en `.env.test.example`.
- La variable `DB_NAME` debe apuntar obligatoriamente a `punto_venta_integration_test`.

El setup de tests valida que el nombre de la base termine en `_test` y que sea exactamente `punto_venta_integration_test`. Si no se cumple, la suite se detiene antes de ejecutar cualquier prueba.

## Comandos

```bash
npm run typecheck
npm run build
npm run test:security
npm run test:tenant
npm run test:economic
npm run test:auth
npm run test:notifications
npm test
```

Para desarrollo:

```bash
npm run test:watch
npm run test:security:watch
npm run test:tenant:watch
npm run test:economic:watch
npm run test:auth:watch
npm run test:notifications:watch
```

## Alcance Actual

La suite actual cubre:

- Headers de seguridad de Helmet.
- Respuesta JSON estándar para rutas inexistentes.
- Manejo seguro de JSON inválido.
- Rechazo de payloads demasiado grandes.
- Error handler global sin exponer stack traces, SQL ni datos sensibles.
- Rate limit global.
- Rate limit de login del negocio.
- Rate limit de login de platform.
- Rate limit de registro.
- Rate limit de refresh token.
- Restricciones de importación de productos por tipo, tamaño y cantidad máxima de filas.

## Decisiones

- Los tests usan Supertest directamente contra la app de Express, sin levantar puerto HTTP.
- Morgan queda deshabilitado cuando `NODE_ENV=test` para evitar ruido en consola.
- Los stores de rate limit se reinician entre tests para evitar falsos positivos por contaminación de estado.
- No se prueban módulos funcionales como productos, ventas, stock, compras o caja en esta primera etapa.
- No se ejecutan scripts SQL ni se modifica la base de desarrollo desde la suite.

## Variables de Seguridad

`.env.test` no debe versionarse. Solo `.env.test.example` queda en el repositorio como plantilla segura.

## Tests de Aislamiento Multi-Tenant

La suite de aislamiento multi-tenant valida la regla central del sistema BUSINESS:

```text
NINGUN USUARIO BUSINESS PUEDE LEER,
MODIFICAR O UTILIZAR RECURSOS
PERTENECIENTES A OTRO NEGOCIO.
```

Para ejecutarla:

```bash
npm run test:tenant
```

En modo observacion:

```bash
npm run test:tenant:watch
```

Estos tests:

- Limpian datos comerciales de la base `punto_venta_integration_test`.
- Conservan seeds estructurales como planes de suscripcion, permisos y permisos por rol.
- Crean dos negocios independientes.
- Autentican usuarios reales mediante `/api/login`.
- Usan cookies reales de sesion.
- Crean recursos separados por tenant.
- Intentan accesos cruzados por parametros, body, filtros y operaciones indirectas.
- Verifican efectos directamente en MySQL con consultas parametrizadas.

La suite tenant desactiva rate limits solo cuando se cumplen simultaneamente estas condiciones:

```text
NODE_ENV=test
DB_NAME=punto_venta_integration_test
TEST_DISABLE_RATE_LIMITS=true
```

Esto evita falsos `429` en flujos funcionales largos sin debilitar `npm run test:security`, donde los rate limits siguen activos y con valores bajos.

MySQL debe estar iniciado. No hace falta levantar `npm run dev`, no hace falta frontend y no se debe apuntar nunca a una base de desarrollo.

## Tests de Flujos Economicos

La suite de flujos economicos valida operaciones criticas ejecutando el flujo real:

```text
HTTP -> route -> middleware -> controller -> service -> stored procedure -> MySQL
```

Para ejecutarla:

```bash
npm run test:economic
```

En modo observacion:

```bash
npm run test:economic:watch
```

Estos tests cubren:

- Compras que aumentan stock.
- Compras que crean movimientos `PURCHASE`.
- Compra sobre deposito sin stock previo.
- Anulacion de compras.
- Ventas que descuentan stock.
- Ventas con varias lineas.
- Anulacion de ventas y restauracion de stock.
- Transferencias entre depositos.
- Rollback por stock insuficiente.
- Rollback por metodo de pago inactivo.
- Rollback por sesion de caja cerrada o inexistente.
- Apertura y cierre de caja.
- Doble apertura y doble cierre.
- Impacto de CASH en efectivo esperado.
- Impacto de TRANSFER fuera del efectivo esperado.
- Snapshots por metodo de pago al cierre.
- Movimientos manuales de caja.

La suite usa `Decimal` para comparaciones monetarias y de stock, evitando igualdad insegura de floating point.

Igual que la suite tenant, desactiva rate limits solo bajo entorno seguro:

```text
NODE_ENV=test
DB_NAME=punto_venta_integration_test
TEST_DISABLE_RATE_LIMITS=true
```

La base `punto_venta_integration_test` sera limpiada durante los tests. No se ejecuta schema, no se levanta servidor HTTP y no se requiere frontend.

## Tests de Autenticacion y Permisos

La suite de autenticacion y permisos valida la regla principal de seguridad operativa:

```text
SOLO LOS USUARIOS AUTENTICADOS,
CON EL CONTEXTO, ROL, PERMISO
Y SUSCRIPCION CORRECTOS,
PUEDEN EJECUTAR CADA OPERACION.
```

Para ejecutarla:

```bash
npm run test:auth
```

En modo observacion:

```bash
npm run test:auth:watch
```

Estos tests cubren:

- Login BUSINESS valido e invalido.
- Login PLATFORM valido e invalido.
- Cookies reales de access y refresh token.
- Persistencia y revocacion de sesiones en `user_sessions`.
- Separacion estricta entre tokens BUSINESS y PLATFORM.
- Rechazo de tokens manipulados, expirados, incompletos o sin `context`.
- Refresh token BUSINESS y PLATFORM con rotacion de sesiones.
- Logout BUSINESS y PLATFORM.
- Roles BUSINESS `OWNER`, `ADMIN` y `SELLER`.
- Roles PLATFORM `SUPER_ADMIN`, `SUPPORT` y `ANALYST`.
- Permisos predeterminados por rol.
- Permisos personalizados `ALLOW` y `DENY`.
- Verificacion de que una mutacion denegada no produce efectos en DB.
- Contrasena temporal y bloqueo operativo por `must_change_password`.
- Cambio obligatorio de contrasena.
- Rechazo de cambio de contrasena ajena sin permiso.
- Reset administrativo de contrasena desde Platform.
- Suscripciones `TRIAL`, `ACTIVE`, `PAST_DUE`, `SUSPENDED`, `CANCELLED` y `EXPIRED`.
- Bloqueo operativo por suspension aplicado en tiempo real aunque la sesion ya exista.

La suite usa la misma base `punto_venta_integration_test`, no ejecuta schema, no levanta servidor HTTP, no requiere frontend y desactiva rate limits solamente bajo el entorno seguro de tests:

```text
NODE_ENV=test
DB_NAME=punto_venta_integration_test
TEST_DISABLE_RATE_LIMITS=true
```
