# Convenciones de implementacion

Aplicar los patrones del modulo afectado. Las reglas operativas de Git/DB y cierre viven en [AGENTS](../AGENTS.md).

## TypeScript y nombres

- Backend: funciones convencionales exportadas (`export async function ...`); frontend: componentes, hooks, handlers y utilidades con arrow functions. No convertir codigo ajeno solo por estilo.
- Tipar entradas, DB rows y respuestas donde aporte valor; evitar `any` nuevo sin necesidad justificada. Backend estricto y ESM/NodeNext: imports locales con `.js`; conservar aliases existentes.
- Tablas SQL en snake_case, procedures `sp_`; muchas columnas usan snake_case pero IDs existentes son `idBusiness`, `idCustomer`, etc. No renombrarlos para forzar uniformidad.
- Domain/API y frontend usan camelCase. Separar DB row de respuesta mediante mapper; no filtrar snake_case ni campos privados accidentalmente. JSON serializa fechas como strings aunque interfaces existentes declaren Date.
- Mantener estructura modular de [arquitectura](architecture.md); no crear una nueva capa de repositories.

## Validacion, tenant y permisos

- Zod valida entradas; `.strict()` cuando lo exige el contrato del modulo (Customers v2 rechaza `name` y campos desconocidos).
- Obtener tenant/actor de `req.user`; IDs de entidades externas se validan tambien contra el negocio autenticado. Consultas y procedures business-scoped filtran por `idBusiness`; usar FKs tenant-safe donde corresponda.
- `requirePermission` en backend para operaciones sensibles. El chequeo de plan/suscripcion no sustituye autorizacion ni aislamiento.
- UNIT requiere cantidades enteras donde se valida; otros tipos admiten decimales segun precision real. No prometer tres decimales si la columna es DECIMAL(18,2).

## Dinero, DB y atomicidad

- Usar Decimal.js para operaciones monetarias, descuentos y comparaciones; persistir DECIMAL. Evitar igualdad y sumas monetarias con floating point directo.
- Stored procedures son parte del contrato actual. En flujos complejos el service posee la transaccion y pasa una misma conexion; verificar ownership antes de modificar SQL. Consultas parametrizadas y locks segun el patron existente.
- Creaciones economicas usan `Idempotency-Key` y unicidad por negocio. Preservar replay/carreras y eventos auditables, sin duplicar efectos.
- No usar `CAST(? AS JSON)` por conveniencia: mantener serializacion compatible con MySQL/MariaDB. Actualizar SQL canonico y generado mediante tooling: [database](database.md).

## Respuestas y errores

No existe un unico envelope global uniforme. Customers y otros modulos BUSINESS usan `{ status: true, message, data }`; platform/middlewares tambien usan `success`. Conservar el contrato del consumidor, sin imponer una migracion transversal.

Zod en Customers devuelve 400 y `errors: [{ field, message }]`; cliente inexistente devuelve 404, documento duplicado devuelve 400 con error de `documentNumber`, SIGNAL de dominio puede mapearse a 400. Otros flujos usan 409 para conflictos: inspeccionar controller/helper real. Errores inesperados deben dar mensajes seguros, sin SQL, stack ni secretos; no crear una nueva capa global de errores para un modulo.

## Frontend

- Respetar Base UI/shadcn, Lucide y sistema visual existente. API -> hooks -> componentes/paginas, con Zustand solo donde corresponda.
- `client/src/hooks/useForm.ts` devuelve `formSate`, `setFormSate`, `onInputChange`, `onResetForm`; conservar esos nombres actuales. Evitar dependencias inestables en effects que reseteen formularios.
- Mantener errores por campo y datos del modal ante fallos. Documento como texto, telefono `tel`; no convertir documentos a numero ni perder ceros iniciales.
- No reintroducir tokens BUSINESS en localStorage; conservar cookies, refresh, CSRF y manejo de suscripcion de Axios.

## Comandos de comprobacion

Desde `server`: `npm run typecheck`, `npm run build`. Tests aislados Customers: `npx vitest run --config vitest.customers-v2.config.ts` (setup vacio y pool mockeado). Desde `client`: `npm run build`, `npm run lint` o lint acotado justificado. Elegir validaciones segun el cambio; no corregir deuda global de lint fuera del alcance.

`server` tiene suites `test:security`, `test:tenant`, `test:economic`, `test:auth`, `test:notifications`; `npm test` las encadena. No asumir que son DB-free: [config general](../server/vitest.config.ts) carga [setup de integracion](../server/src/tests/setup.ts). El nombre `punto_venta_integration_test` no certifica host local. No ejecutarlas sin revisar efectos y autorizacion DB.
