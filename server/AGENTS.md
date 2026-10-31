Hereda reglas de [../AGENTS.md](../AGENTS.md).

# Trabajo en server

Tras el orden global, leer [arquitectura](docs/architecture.md), [convenciones](docs/coding-rules.md), [seguridad/tenant](docs/security-tenancy.md), [transacciones](docs/transactions.md) y [testing](docs/testing.md). Si toca persistencia, leer ademas [DB del sistema](../docs/database.md) y el documento tecnico cercano afectado. Consultar [contratos](../docs/contracts.md) ante cambios HTTP.

- Express/TypeScript: routes y middleware -> controllers/Zod -> services -> procedures/queries -> mappers; conservar el patron del modulo.
- Consultas tenant-safe y permisos backend; no tomar negocio/actor del body. Detalles en security-tenancy.
- Verificar ownership transaccional e idempotencia antes de modificar flujos economicos; Decimal.js y SQL parametrizado. No agregar ORM ni repository layer.
- No ejecutar DB ni suites conectadas por inferencia: heredar restricciones globales y elegir config DB-free verificada. Markdown requiere solo validacion documental.
- Una tarea solo backend preserva frontend y contratos vigentes salvo alcance expreso; full-stack requiere tambien [client/AGENTS.md](../client/AGENTS.md).

Los comandos reales y sus efectos estan en testing; los detalles de schema/baseline permanecen en DB, sin duplicarlos aqui.
