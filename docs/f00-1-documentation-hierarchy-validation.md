# F0.1 — Validacion de jerarquia documental

Revisado: 2026-10-30. Base: `dev`, HEAD `236eca1ca1c46c29d573fbf6a6e01a6d9f25fd82`; arbol limpio al comenzar. El master aportado no se uso como sustituto del checkout inspeccionado.

## Entrega y responsabilidades

- Creados [client/AGENTS](../client/AGENTS.md), [architecture](../client/docs/architecture.md), [coding-rules](../client/docs/coding-rules.md), [testing](../client/docs/testing.md).
- Creados [server/AGENTS](../server/AGENTS.md), [architecture](../server/docs/architecture.md), [coding-rules](../server/docs/coding-rules.md), [security-tenancy](../server/docs/security-tenancy.md), [transactions](../server/docs/transactions.md), [testing](../server/docs/testing.md).
- Creados [contracts](contracts.md) y este registro; refactorizados architecture/coding-rules root; enlazados AGENTS, README, database y actualizados tasks/project-state.

Root conserva producto, limites, contratos HTTP, DB operativa, ADRs y roadmap. Client concentra React/routing/estado/transporte/UI; server concentra Express/modulos/seguridad/atomicidad/tests. La documentacion tecnica DB no se movio; PRD, ADRs y validacion F0 se conservan.

Naming elegido: `f00-1-documentation-hierarchy-validation.md` distingue fase documental F0.1 de Customers F1; no renombra evidencias existentes ni crea placeholders. Es una convencion documental local, no un ADR arquitectonico nuevo.

## Inspeccion y reubicacion

Leidos AGENTS y documentos root, README, packages client/server, estructuras y entrypoints representativos. Inspeccion dirigida de AppRoutes/AdminRoutes/PlatformRoutes, guards/layouts, Axios de ambos contextos, stores identificados, useForm/formulario Customers de la fase anterior, CSS/tsconfig/eslint y configs/setup/helpers de tests backend. Inspeccionados app/barrels/middlewares de auth, tenant, permisos, roles, suscripcion/CSRF; Sales service, paginacion y errores; Purchases service/procedure; helper idempotencia e indices/SQL referenciados.

| Contenido previo en root | Fuente principal despues de F0.1 |
| --- | --- |
| Detalles React, stores, layouts/Axios | client/docs/architecture y coding-rules; root queda macro. |
| Imports NodeNext, DB rows/mappers, Zod backend | server/docs/coding-rules. |
| Orden middleware y tenant implementado | server/docs/security-tenancy; root mantiene decision/boundary y enlace. |
| Ownership y replay economico | server/docs/transactions; diferencia Sales service-owned de Purchases procedure-owned. |
| Comandos y limites de testing | testing de cada subsistema; reglas root solo enlazan. |
| Headers/envelopes/errores entre componentes | docs/contracts; internals referencian sin copiar todo el contrato. |

Se confirmo BUSINESS cookie-only en requireAuth frente a alternativa cookie/Bearer PLATFORM; CSRF con excepciones reales; paginacion distinta en Sales/catalogo y lista Customers sin paginar. La documentacion no los presenta como mecanismos uniformes. Orders/conversion/reservas siguen planned; no se inspecciono despliegue externo de VITRUNO.

## Comprobaciones de cierre

- [x] Estructura requerida, herencia y orden de lectura global/especifico revisados; global -> client/server segun alcance, ambos en full-stack.
- [x] Script en memoria recorrio los 32 Markdown del repositorio y comprobo 238 enlaces locales, incluidos 76 a codigo/config/SQL; paths concretos contrastados en inspeccion dirigida. Referencias futuras siguen explicitas como planificadas/no creadas.
- [x] Sin duplicacion de ADRs ni feature docs adicionales; informacion util de root reubicada segun matriz anterior. Revision de fences y espacios finales en documentos creados/refactorizados.
- [x] Scope comprobado con estado Git detallado: exactamente 12 Markdown nuevos y 7 modificados; DB especifica, PRD, ADRs y evidencia F0 conservados, sin modificaciones de aplicacion/configuracion/SQL.
- [x] `git diff --check` aprobado; ejecutados `git status --short` y `git diff --stat`. Solo avisos de normalizacion LF/CRLF, sin errores de whitespace.

El stat Git no incluye los doce archivos nuevos sin seguimiento; se validaron por separado sin staging. F0.1 queda cerrada documentalmente, ultima fase funcional F2 y siguiente F3 pendiente.

No se ejecutaron build, lint, tests, SQL, migraciones ni tooling DB en F0.1. La validacion documental no certifica runtime, QA manual, integracion ni despliegue. Sin bloqueos ni desviaciones de alcance identificados.
