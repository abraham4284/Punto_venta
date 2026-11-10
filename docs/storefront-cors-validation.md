# Validación de CORS multi-storefront

Fecha 2026-11-10. Rama `dev`, HEAD inicial `26efdbf371668332367590b7225f7c579613d899`.

- [Configuración](../server/src/config/security.config.ts) y [ejemplo de entorno](../server/.env.example). La lista opcional se separa por coma, recorta espacios, ignora entradas vacías, valida orígenes HTTP(S) canónicos y elimina duplicados al combinarla con las tres variables existentes. Un valor inválido de la lista aborta la carga e identifica `STOREFRONT_URLS`.
- [Suite](../server/src/tests/unit/storefront-cors.test.ts) y [config Vitest](../server/vitest.cors.config.ts). 25 casos aprobados con `node node_modules/vitest/vitest.mjs run --config vitest.cors.config.ts` desde `server`. El sandbox inicial falló al renombrar el caché con EPERM. La suite aprobó fuera del sandbox, con HTTP en loopback y módulos de rutas y servicios aislados. El import de DB está bloqueado en la suite.
- Los preflight confirman coincidencia exacta para Render, Railway y el dominio propio, con `credentials: true`. También se verificaron orígenes ajenos, peticiones sin `Origin` y la exigencia del header CSRF en las mutaciones correspondientes. Los orígenes ajenos reciben la respuesta HTTP sin los headers de autorización CORS.
- `npm run typecheck` y `npm run build` aprobados. El backend carece de configuración de lint.
- [Guía operativa](../server/SECURITY.md), [roadmap](tasks.md) y [estado](project-state.md). Validación local de configuración y middleware. Queda a cargo del operador cargar las variables en cada API y reiniciar su proceso. La tarea se limitó al repo Cajora, sin cambios en DB, VITRUNO ni servicios externos, y sin escrituras Git.
