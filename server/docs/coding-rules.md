# Convenciones backend

Hereda [reglas transversales](../../docs/coding-rules.md) y [server/AGENTS](../AGENTS.md). Arquitectura existente: [architecture](architecture.md); no introducir ORM, repository layer ni un framework nuevo.

- Funciones convencionales exportadas (`export async function nombre(...)`), tambien en helpers/adapters/validaciones nuevas; no arrow functions nuevas para esos roles. Mantener nombres y carpetas del modulo.
- TypeScript estricto, ESM/NodeNext; imports locales con `.js` aun cuando el fuente es `.ts`, aliases existentes y `import type` para tipos. [tsconfig](../tsconfig.json) define resolucion, root/outDir y aliases. No agregar `any` para evitar modelar DB/response.
- DB rows reflejan nombres SQL, incluyendo snake_case e IDs historicos camelCase; separar payload, row y response mediante types/mappers. Convertir booleans/decimales y derivar campos explicitamente sin filtrar datos privados. No asumir columnas como updated_at donde no existen.
- Zod valida entradas; `.strict()` cuando el patron del modulo lo exige. Mantener errores por campo donde existen; el controller agrega tenant/actor autenticados. Implementacion detallada de autorizacion/aislamiento en [security-tenancy](security-tenancy.md).
- Procedures forman parte de la arquitectura; usar placeholders y parametros, nunca concatenacion de valores del usuario. Algunas queries directas son parte del service actual. Mantener compatibilidad MySQL/MariaDB; no introducir `CAST(? AS JSON)` por conveniencia, conservar serializacion JSON existente.
- Decimal.js para calculos monetarios/descuentos/comparaciones, DECIMAL en persistencia. Validar totales y cantidades segun unidad/precision real; conversion de salida a number no habilita aritmetica monetaria ingenua.
- Transaction ownership, misma conexion, locks, replay y carreras se documentan en [transactions](transactions.md). No asumir que Purchases y Sales tienen el mismo owner ni agregar commits internos por copia de patrones.
- Mapear Zod, dominio y SQL a errores del endpoint; no imponer una capa global nueva. Customers usa 400/404 y duplicado documental 400 con campo; Sales puede usar 409 para estado incompatible. [contracts](../../docs/contracts.md) es la fuente principal de envelopes/codigos compartidos. No exponer errores SQL inesperados, stack o secretos.
- Mantener eventos/auditoria e idempotencia de flujos existentes. Para modificar SQL, seguir [database](../../docs/database.md), incluyendo baseline/manual cuando corresponda; no aplicar DB real como parte implicita de una edicion.

Validacion tipado/build/tests DB-free segun [testing](testing.md). No ejecutar suites conectadas ni corregir deuda de otros modulos fuera de scope.
