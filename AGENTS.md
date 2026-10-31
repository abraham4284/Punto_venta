# Cajora: instrucciones operativas

## Lectura y fuentes

1. Leer este archivo.
2. Leer [docs/tasks.md](docs/tasks.md).
3. Leer [docs/project-state.md](docs/project-state.md).

Luego abrir solo lo necesario: [producto](docs/prd.md), [arquitectura](docs/architecture.md), [convenciones](docs/coding-rules.md), [DB](docs/database.md), [decisiones](docs/decisions.md) y validaciones de la fase. Inspeccionar unicamente el codigo relevante; no leer todo el repositorio por defecto.

Si la tarea toca `client/`, leer [client/AGENTS.md](client/AGENTS.md) y su documentacion frontend; si toca `server/`, leer [server/AGENTS.md](server/AGENTS.md) y su documentacion backend (ademas DB si afecta persistencia). Si toca ambos, leer ambos AGENTS. Para contratos entre componentes consultar [docs/contracts.md](docs/contracts.md). Esta seleccion se realiza despues del orden global anterior; no requiere leer todo el otro subsistema.

La solicitud actual define el alcance. Codigo, schema, procedures, tests y configuracion actuales junto con docs canonicas prevalecen sobre chats, prompts y documentos historicos. Si docs contradice el codigo, registrar y resolver la discrepancia; no inventar funcionalidad.

## Trabajo y Git

- Rama de trabajo: `dev`; workflow `dev -> qa -> master`. Verificar estado y rama; no cambiarla automaticamente.
- Git permitido: `status`, `diff`, `diff --check`, `log`, `show`, `branch --show-current`.
- Sin pedido explicito, no ejecutar `add`, `commit`, `push`, `pull`, `reset`, `restore`, `clean`, `checkout`, `switch`, `merge` ni `rebase`. No hay excepciones documentadas. Entregar titulo y descripcion de commit en texto.
- Preservar cambios ajenos. Cambio minimo necesario, sin sobreingenieria ni adelantar fases. No modificar `client/text.txt`.
- No introducir ORM, repository layer, framework ni arquitectura nuevos sin justificacion explicita.

## Seguridad y validacion

- `idBusiness` es el limite de tenant: usar contexto BUSINESS autenticado; nunca confiar en el negocio enviado por el cliente. Actor desde `req.user.idUser`. Queries/procedures y relaciones deben aislar el negocio; permisos se verifican en backend.
- No ejecutar DB real, migraciones, SQL manual, `db:local:create/reset`, TRUNCATE, DELETE masivos ni queries destructivas sin autorizacion explicita. No inferir conexion local por el nombre de DB o por ejecutar la app localmente. No publicar secretos.
- Cuando corresponda se permite editar SQL estatico, generar/validar baseline, typecheck, build y tests DB-free. Revisar setup/imports antes de ejecutar suites; `npm test` del backend usa integracion.
- Validar segun el cambio: Markdown requiere enlaces/rutas, `git diff --check`, `git status --short` y `git diff --stat`. Para codigo usar comandos existentes segun [coding-rules](docs/coding-rules.md); para SQL consultar [database](docs/database.md). Reportar solo verificaciones ejecutadas y sus limites.

## Cierre de fase

Actualizar `docs/tasks.md` y `docs/project-state.md`; modificar `docs/decisions.md` solo ante una decision relevante. Registrar evidencias reales en `docs/fXX-<fase>-validation.md` (ejemplo futuro: `docs/f03-orders-core-validation.md`, aun no creado). No marcar completado sin validacion ni crear placeholders de fases futuras. PRD/arquitectura se actualizan cuando cambia su contenido, no por cada ajuste menor.
