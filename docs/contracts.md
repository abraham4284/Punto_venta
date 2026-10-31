# Contratos entre componentes

Fuente principal de contratos transversales. Internos: [client](../client/docs/architecture.md) y [server](../server/docs/architecture.md). Preservar formatos del endpoint concreto; no existe un contrato global uniforme.

## HTTP y contextos

| Limite | Uso |
| --- | --- |
| `/api/*` | Operacion BUSINESS y rutas de sesion/contexto del negocio; los prefijos especializados se montan antes. |
| `/api/platform/*` | Administracion SaaS y sesion PLATFORM, separadas del negocio. |
| `/api/public/*` | GET de catalogo publico, sin autenticacion administrativa. |

La SPA usa `/admin/*`, `/platform/*` y home; esas rutas de navegador no son prefijos HTTP de API. `VITE_BACKEND_URL` define baseURL Axios en build; los requests del frontend agregan rutas relativas como `/customers` o `/platform/dashboard`. Verificar el valor configurado y no agregar/quitar `/api` por suposicion.

### Sesion y headers

- BUSINESS: cookies HttpOnly de backend; `requireAuth` acepta `access_token` de cookie, no Bearer para rutas de negocio. Axios envia credenciales, refresh por `/refresh`, inicializacion `/me`; login/register/refresh/logout se excluyen del reintento automatico de 401.
- PLATFORM: Axios propio usa `platform_access_token` de localStorage como `Authorization: Bearer ...`, con credenciales y refresh `/platform/auth/refresh`. Backend prioriza cookie `access_token` si existe y usa Bearer como alternativa en rutas platform; no intercambiar tokens BUSINESS/PLATFORM ni extrapolar almacenamiento BUSINESS a plataforma.
- `Content-Type: application/json` es habitual; respetar excepciones del endpoint (por ejemplo uploads). `Idempotency-Key` se usa en creacion Sales/Purchases; no es un requisito de todo POST.
- `X-CSRF-Protection: 1` acompana mutaciones BUSINESS desde Axios. El middleware actual verifica Origin permitido + header en POST/PUT/PATCH/DELETE no-platform cuando hay Origin; excluye platform y deja pasar sin Origin. Es un contrato actual, no un token CSRF por sesion. CORS permite Content-Type, Authorization, Idempotency-Key y X-CSRF-Protection con credenciales.

Evidencia: [requireAuth](../server/src/middlewares/requireAuth.ts), [CSRF](../server/src/middlewares/csrfProtection.middleware.ts), [app](../server/src/app.ts), [Axios BUSINESS](../client/src/api/axios.config.ts), [Axios PLATFORM](../client/src/views/platform/module/auth/api/platformAuth.api.ts).

## Datos y respuestas

JSON de dominio/API usa camelCase; DB rows pueden usar snake_case. Fechas viajan como strings serializadas, aunque interfaces existentes declaren Date. Documentos de cliente son strings y preservan ceros iniciales. Customers v2 no acepta/devuelve `name`; `fullName` es derivado, mientras Sales/Tickets conservan aliases `customerName`. Contrato especifico: [Customers v2](../server/src/db/CUSTOMERS_V2.md).

BUSINESS suele responder `{ status: true, message, data }`; platform usa `success` y varios middlewares tienen `status: "ERROR"`, `code` o `data`. `errors: [{ field, message }]` permite errores de campo donde se implementa. No sustituir envelopes ni asumir la misma forma en todos los errores.

### Listados

`page`/`limit` son comunes donde existe paginacion, no universales. [Sales service](../server/src/modules/businesses-app/sales/services/sales.service.ts) devuelve dentro de data `{ sales, pagination: { totalRecords, currentPage, totalPages, limit }, metrics }`; paginas empiezan en 1 y el totalPages minimo es 1. El procedimiento pagina en SQL y devuelve resumen para metricas.

[Catalog types](../server/src/modules/storefront-app/catalog/types/catalog.types.ts) define `{ items, pagination: { page, currentPage, limit, total, totalRecords, totalPages } }`. Customers GET devuelve lista completa del tenant, con search opcional y sin paginacion. Leer limites/defaults del endpoint antes de implementar un consumidor.

### Errores HTTP

| Codigo | Significado observado (segun endpoint) |
| --- | --- |
| 400 | Entrada invalida, Zod, documento Customer duplicado o regla de dominio. |
| 401 | Falta de autenticacion o token invalido/expirado; puede activar refresh del contexto. |
| 402 | Suscripcion sin acceso operativo (`SUBSCRIPTION_REQUIRED`); no tratar como sesion expirada. |
| 403 | Contexto/rol/permiso no autorizado o fallo CSRF. |
| 404 | Ruta/recurso no encontrado donde el controller lo mapea. |
| 409 | Conflicto de estado donde se implementa, por ejemplo caja cerrada en Sales. |

Tambien existen 413/429 por limites y 500 para fallos inesperados. No todos los controllers mapean iguales casos igual. Filosofia: mensajes seguros y errores de campo utiles, sin exponer SQL/secretos; mantener compatibilidad y revisar mapeo real del modulo.

## Publico frente a administracion

Catalogo: GET `/api/public/catalog`, `/categories`, `/products`, `/products/:slug` (los ultimos tres relativos a `/api/public/catalog`). Negocio seleccionado por `PUBLIC_CATALOG_BUSINESS_SLUG`; stock publico del deposito predeterminado activo y campos publicos sin costos. Los consumidores publicos/VITRUNO no deben consumir endpoints administrativos.

No hay endpoints Orders ni conversion a Sale implementados. WhatsApp/sin Orders automaticos es acuerdo de integracion externa: [ADR-007](decisions.md). F3 sigue [pendiente](tasks.md).
