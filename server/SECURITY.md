# Seguridad - primera etapa

Esta etapa implementa una primera capa de hardening en la API Express. No incluye CSRF, cambios de JWT, separacion de cookies, Redis, WAF, Cloudflare, captcha ni 2FA.

## Helmet

La API usa `helmet()` globalmente para agregar cabeceras de seguridad HTTP. Como el backend sirve principalmente JSON, no se configuro una CSP compleja para frontend en esta etapa.

## Rate limiting

Los limites se configuran por variables de entorno y usan `express-rate-limit` con `standardHeaders=true` y `legacyHeaders=false`.

- Global `/api/*`: 1000 requests cada 15 minutos por IP.
- Login Business: 10 intentos cada 15 minutos por IP.
- Login Platform: 5 intentos cada 15 minutos por IP.
- Registro Business y bootstrap/base-user Platform: 5 solicitudes por hora por IP.
- Refresh Business y Platform: 60 solicitudes cada 15 minutos por IP.
- Reset administrativo de passwords: 10 solicitudes por hora por actor + IP.
- Importacion Excel: 5 solicitudes por hora por negocio + usuario.

El limiter global es una barrera de emergencia para abuso general de `/api/*`.
Los endpoints sensibles mantienen limiters especificos porque protegen flujos con
mayor riesgo, como login, registro, refresh, reset administrativo e importacion.

El limiter global usa IP como key porque se ejecuta antes de autenticacion. En un
comercio real varios empleados pueden compartir la misma IP publica, por eso el
default no debe ser excesivamente bajo. Si metricas reales de produccion muestran
trafico legitimo mayor, puede evaluarse subir `GLOBAL_RATE_LIMIT_MAX` a `1500`,
sin desactivar los limiters especificos.

Las solicitudes `OPTIONS` de CORS preflight no consumen el limiter global. No
representan una operacion funcional del usuario y, si contaran, podrian duplicar
el consumo normal desde navegadores.

`express-rate-limit` emite headers estandar de rate limit. En desarrollo pueden
inspeccionarse desde Chrome DevTools:

```text
Network -> request -> Response Headers -> RateLimit / Retry-After
```

No se agregan headers manuales adicionales porque la libreria ya publica la
informacion compatible con su version instalada.

Actualmente se usa `MemoryStore`. Esto es suficiente para una instancia unica,
pero funciona por proceso. Si en produccion se ejecutan varias instancias, cada
una tendra su propio contador. En ese escenario conviene evaluar un store
centralizado, por ejemplo Redis, sin cambiar la semantica de los limiters.

El rate limiting dentro de Express reduce abuso y ataques basicos, pero no
reemplaza proteccion DDoS de infraestructura como Cloudflare o un WAF.

Una evolucion posible, no implementada en esta etapa, es separar limiters:

```text
PUBLIC: IP
AUTHENTICATED BUSINESS: idBusiness + idUser
AUTHENTICATED PLATFORM: idPlatformUser
```

Por ahora se mantiene una configuracion conservadora para no reorganizar la
cadena de middlewares ni afectar tests existentes.

## Limites de requests

- JSON: `JSON_BODY_LIMIT`, por defecto `1mb`.
- URL encoded: `URL_ENCODED_BODY_LIMIT`, por defecto `100kb`.
- JSON invalido responde `INVALID_JSON_BODY`.
- Payload demasiado grande responde `PAYLOAD_TOO_LARGE`.

## Importacion Excel

- Solo se aceptan archivos `.xlsx` y `.xls`.
- Se usa `memoryStorage` con maximo 1 archivo.
- Tamano maximo: `UPLOAD_MAX_FILE_SIZE_MB`, por defecto `5`.
- Filas maximas: `IMPORT_MAX_ROWS`, por defecto `1000`.
- Columnas maximas: `IMPORT_MAX_COLUMNS`, por defecto `40`.
- Longitud maxima por celda: `IMPORT_MAX_CELL_LENGTH`, por defecto `500`.
- Los errores de parseo de XLSX no se devuelven crudos al cliente.

## Errores seguros

El error handler diferencia errores operacionales conocidos de errores internos. Los errores inesperados responden:

```json
{
  "success": false,
  "status": "ERROR",
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Ocurrio un error interno.",
  "data": null
}
```

No se exponen mensajes SQL, stack traces ni detalles internos en respuestas.

## Proxy

`TRUST_PROXY_HOPS=0` por defecto. Si la API queda detras de un proxy confiable,
configurar el numero exacto de saltos en produccion. No usar
`trust proxy = true` sin conocer la infraestructura.

Este punto es critico para rate limiting. Detras de Render, Railway,
Cloudflare, Nginx u otro proxy, un `TRUST_PROXY_HOPS` incorrecto puede hacer que
`req.ip` no represente al cliente real. Si todos los usuarios parecen venir de
la misma IP interna del proxy, podrian aparecer falsos `429` aunque el trafico
sea legitimo.
