# Seguridad - primera etapa

Esta etapa implementa una primera capa de hardening en la API Express. No incluye CSRF, cambios de JWT, separacion de cookies, Redis, WAF, Cloudflare, captcha ni 2FA.

## Helmet

La API usa `helmet()` globalmente para agregar cabeceras de seguridad HTTP. Como el backend sirve principalmente JSON, no se configuro una CSP compleja para frontend en esta etapa.

## Rate limiting

Los limites se configuran por variables de entorno y usan `express-rate-limit` con `standardHeaders=true` y `legacyHeaders=false`.

- Global `/api/*`: 300 requests cada 15 minutos por IP.
- Login Business: 10 intentos cada 15 minutos por IP.
- Login Platform: 5 intentos cada 15 minutos por IP.
- Registro Business y bootstrap/base-user Platform: 5 solicitudes por hora por IP.
- Refresh Business y Platform: 60 solicitudes cada 15 minutos por IP.
- Reset administrativo de passwords: 10 solicitudes por hora por actor + IP.
- Importacion Excel: 5 solicitudes por hora por negocio + usuario.

El rate limiting dentro de Express reduce abuso y ataques basicos, pero no reemplaza proteccion DDoS de infraestructura como Cloudflare o un WAF.

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

`TRUST_PROXY_HOPS=0` por defecto. Si la API queda detras de un proxy confiable, configurar el numero exacto de saltos en produccion. No usar `trust proxy = true` sin conocer la infraestructura.
