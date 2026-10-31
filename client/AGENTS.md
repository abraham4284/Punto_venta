Hereda reglas de [../AGENTS.md](../AGENTS.md).

# Trabajo en client

Tras el orden global, leer [arquitectura](docs/architecture.md), [convenciones](docs/coding-rules.md) y [testing](docs/testing.md); consultar [contratos](../docs/contracts.md) si cambia consumo HTTP. Leer solo el codigo relevante.

- React/TypeScript y modulos existentes: Route -> Page -> Hook -> API; usar Axios del contexto correspondiente.
- Estado local en componente/hook; Zustand cuando aporta estado compartido. Zod para formularios y contratos existentes.
- Preservar permission checks, responsive, accesibilidad y UI Base UI/shadcn; no introducir otra libreria UI sin necesidad.
- Una tarea solo frontend no modifica backend; si requiere cambiar un contrato, explicitar ese alcance antes de avanzar fuera de la tarea.
- Validacion tipica desde `client`: `npm run build` y `npm run lint`, o lint acotado cuando existe deuda global ajena. Markdown requiere solo comprobacion documental; niveles de evidencia en testing.

Para tareas full-stack leer tambien [server/AGENTS.md](../server/AGENTS.md). Las reglas globales de Git, DB y cierre se heredan sin excepciones locales.
