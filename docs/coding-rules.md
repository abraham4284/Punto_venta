# Reglas transversales

Las reglas operativas globales, Git, seguridad DB y cierre de fase viven en [AGENTS](../AGENTS.md). Especializaciones: [client/coding-rules](../client/docs/coding-rules.md) y [server/coding-rules](../server/docs/coding-rules.md); los comandos y niveles de evidencia estan en [client/testing](../client/docs/testing.md) y [server/testing](../server/docs/testing.md).

## Alcance y claridad

Aplicar patrones del modulo, cambio minimo y tipado donde aporte valor; evitar any nuevo sin necesidad justificada. No convertir codigo ajeno solo por estilo ni adelantar fases. No introducir capas, librerias o arquitectura sin necesidad explicita. El estado real y las decisiones relevantes se registran en la documentacion correspondiente, sin duplicar fuentes de verdad.

## Nombres y contratos

Tablas SQL en snake_case y procedures con prefijo sp_; las columnas conservan convenciones reales, incluidos IDs como idBusiness/idCustomer. Domain/API y frontend usan camelCase. La separacion entre DB row y respuesta es responsabilidad backend; el frontend consume el contrato, no la forma SQL.

No renombrar campos publicos incidentalmente ni agregar aliases legacy para ocultar incompatibilidad. JSON serializa fechas como strings aunque interfaces existentes declaren Date. Headers, envelopes y errores HTTP tienen su fuente principal en [contracts](contracts.md); preservar diferencias por contexto/endpoint.

## Tenant y precision

idBusiness es el limite de tenant y proviene del contexto autenticado. La UI no define autorizacion; backend verifica permisos y pertenencia de referencias. [Implementacion de seguridad](../server/docs/security-tenancy.md) y [ADR-001](decisions.md).

Usar Decimal.js para operaciones monetarias/descuentos/comparaciones y DECIMAL al persistir; evitar igualdad/sumas monetarias con floating point directo. La precision de cantidades depende del schema: UNIT requiere enteros donde se valida, otras unidades segun columna. No prometer tres decimales sobre DECIMAL(18,2). [Operacion DB](database.md).

## Errores y mantenimiento

Validacion debe ser util para el usuario y conservar errores de campos donde el contrato los ofrece. No exponer SQL inesperado, stack ni secretos. No imponer una nueva capa/envelope global para una feature aislada. Mensajes, reintentos y errores deben mantener compatibilidad entre componentes.

Al cerrar una fase, actualizar tasks/project-state y registrar validacion real; decisions solo ante una decision nueva relevante. No editar PRD/arquitectura por ajustes que no cambian esos documentos. Las reglas locales de formularios, imports, mappers, transacciones y tests pertenecen a sus subsistemas enlazados arriba.
