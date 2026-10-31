# F0 — Validacion documental

Fecha: 2026-10-30. Base inspeccionada: `dev`, commit `892efcd03dbf31bd72cfd524e11afe66c5fb35c0`; arbol limpio antes de F0.

## Entrega

Creados: [AGENTS](../AGENTS.md), [prd](prd.md), [architecture](architecture.md), [coding-rules](coding-rules.md), [database](database.md), [decisions](decisions.md), [tasks](tasks.md), [project-state](project-state.md) y este registro. Actualizados: inicio de [README](../README.md) y unicamente frase final de [CUSTOMERS_V2](../server/src/db/CUSTOMERS_V2.md).

## Fuentes inspeccionadas

- README, package.json de client/server y tsconfig backend; entrypoints app/modules y barrels BUSINESS, PLATFORM, storefront; estructura de modulos backend/frontend y rutas AppRoutes/AdminRoutes.
- Customers backend: routes, controllers, validaciones, services, mapper referenciado por tests y tipos/contrato; frontend: tipos, validacion, helpers, hook, estructura de formulario y consumidores Sales. Config Vitest Customers v2 y tests unitarios con mock pool; config general y setup de integracion.
- Sales service/transaccion y busquedas dirigidas de locks, idempotencia, errores y calculos; procedures Customers, Sales, Tickets, Cash Settlements y catalogo publico. Axios, tipos auth, requireBusinessContext y configuracion de catalogo.
- Schema 002: entidades/columnas relevantes; indices 003, FKs 004 y checks 005; inventario de procedures/seeds/manual/tools, manifest, instalador/validator y documentacion DB, CUSTOMERS_V2, BASELINE_AUDIT y TESTING.
- Dashboard plataforma: pagina/hook referenciado, API, route y service hacia `sp_platform_dashboard`.

La inspeccion fue dirigida, no auditoria exhaustiva de cada funcion/procedure. El prompt F0 y traspaso anterior aportan decisiones de roadmap y resultados historicos; esos resultados se atribuyen, no se presentan como ejecuciones de F0.

## Contradicciones y resolucion

| Antecedente | Evidencia actual / resolucion |
| --- | --- |
| README afirma SQL incompleto y carpetas fixes/tables | Schema 002..005 y baseline/manifest existen. Database documenta layout actual; README recibe aviso visible y enlaces, sin limpieza exhaustiva. |
| README afirma test placeholder | package.json encadena cinco suites. Coding-rules documenta comandos y riesgo del setup DB; no se ejecutan. |
| README afirma dashboard plataforma estatico | Pagina usa hook/API y backend llama procedure. Project-state registra implementacion, sin certificar datos desplegados. |
| CUSTOMERS_V2 dice que AGENTS/tasks/project-state no existen | Se sustituye solo frase final por enlaces canonicos. |
| CUSTOMERS_V2 describe frontend pendiente en fase backend | Se conserva antecedente especifico; database/project-state aclaran que frontend v2 existe hoy. |
| Prompt cita master historico | Estado anclado al HEAD `dev` realmente inspeccionado. |
| Roadmap describe Orders y VITRUNO | Orders marcado no implementado y ADRs planned; flujo externo WhatsApp identificado como acuerdo, no comportamiento auditado. |

## Comprobaciones de cierre

- [x] Verificados los nueve archivos requeridos y el orden AGENTS -> tasks -> project-state.
- [x] Comprobados 82 enlaces Markdown locales (archivos y directorios) en los once documentos creados/actualizados mediante script temporal en memoria; revision dirigida de paths de codigo y comandos. Los nombres futuros de validation docs y migracion 003 estan explicitamente marcados como no creados.
- [x] Revisados F1/F2 con evidencia de implementacion y limites de validacion historica; F3 pending, sin Orders/reservas/conversion implementados.
- [x] Revisados diff y archivos nuevos: solo los once Markdown autorizados; nueve nuevos y dos historicos con cambios minimos. Comprobados fences y ausencia de espacios finales en archivos nuevos.
- [x] Ejecutados `git diff --check` (aprobado), `git status --short` y `git diff --stat`. Git advierte normalizacion futura LF/CRLF en CUSTOMERS_V2; no es un fallo de whitespace.

`git diff --stat` muestra solo los dos archivos ya versionados: 3 inserciones y 1 eliminacion. Los nueve nuevos aparecen sin seguimiento (AGENTS y docs) y se comprobaron por separado; no se hizo staging. F0 queda completada documentalmente.

No se ejecutaron build, lint, tests, queries, migraciones ni tooling DB en F0. El cierre documental no certifica SQL ejecutable en ambos motores, E2E, configuracion remota ni despliegue. No se modifican codigo funcional, SQL, configuraciones ni packages. Sin desviaciones de alcance ni bloqueos identificados.
