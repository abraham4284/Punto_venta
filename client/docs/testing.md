# Validacion frontend

Comandos reales de [package.json](../package.json), desde `client`:

```sh
npm run build
npm run lint
```

Build ejecuta `tsc -b && vite build`; verifica tipado/compilacion/bundle, no operaciones API ni UX. Lint ejecuta `eslint .`; [eslint.config.js](../eslint.config.js) incluye TypeScript, React hooks y React Refresh. Si falla por deuda global ajena, informar el resultado y ejecutar lint acotado a archivos afectados (`npx eslint <rutas-reales-modificadas>`); no presentar el acotado como lint global aprobado.

## Evidencias distintas

| Nivel | Que demuestra |
| --- | --- |
| Build | Tipado y construccion del frontend. Warnings de bundle/imports deben reportarse si aparecen. |
| Lint | Reglas estaticas en el alcance ejecutado. |
| QA manual | Flujo visible, formularios, errores, carga/vacio, permisos, responsive y accesibilidad comprobados en navegador. Registrar escenarios y ambiente. |
| E2E | Flujo integrado automatizado solo si existe y se ejecuta; no inferirlo de build/QA manual. |

No hay scripts test/E2E en package.json ni suites test/spec encontradas bajo src en la inspeccion F0.1. Las 35 comprobaciones ad hoc informadas en F2 no constituyen una suite persistente ni una ejecucion actual.

Para cambios visuales, probar teclado/foco, labels, modales, tablas y navegacion con permisos relevantes. [PlatformLayout](../src/views/platform/components/layout/PlatformLayout.tsx) usa clases `lg` para alternar sidebar/menu movil y [AdminLayout](../src/components/layout/AdminLayout.tsx) usa `sm` en acciones; probar a ambos lados de esos cortes y en escritorio/movil. No hay una matriz de breakpoints QA propia formalizada; no inventar pixeles del producto.

Para Markdown basta comprobar enlaces, paths y diff segun AGENTS. No ejecutar build/lint por rutina documental. Registrar solo lo ejecutado en validation doc de fase; no afirmar QA API/navegador ni despliegue por inspeccion de codigo.


## F9 — Tests aislados persistentes

`npm run test:sale-returns` ejecuta [scripts/sale-returns.test.mjs](../scripts/sale-returns.test.mjs) con node:test y el compilador TypeScript ya instalado, sin framework/dependencia nuevos. Transpila helpers frontend en memoria, usa dependencias locales y no importa backend ni conecta a DB. Cubre preview/residual, precision UNIT/decimal, allocations mixed/cash, saldos/campos, gratuitos/envio, UUID/fingerprint y errores/refresh. No sustituye lifecycle DOM ni E2E. QA navegador F9 usa fixture aislado temporal y adaptador Axios en memoria, eliminado al terminar; ninguna operacion financiera/DB real. [Evidencias](../../docs/f09-returns-refunds-frontend-validation.md).

## F10.2 — Wholesale Pricing Admin Frontend

`npm run test:wholesale-pricing` usa [scripts/wholesale-pricing.test.mjs](../scripts/wholesale-pricing.test.mjs), node:test y TypeScript instalado. 71 tests persistentes de candidato/mode/minimo/lineas/Decimal, reprice/discount payload, historico/errores y schema de politica. Sin backend/DB/dependencias nuevas. Regresion ejecutada: `node --test scripts/wholesale-pricing.test.mjs scripts/sale-returns.test.mjs scripts/sale-print.test.mjs`, 141/141 aprobados. Build y ESLint acotado a las 15 fuentes afectadas aprobados; global no reejecutado, deuda anterior fuera de scope.

Gate backend previo autorizado: 19/19 HTTP/DB local/test F10.1, sin cambios backend ni migraciones por el agente; evidencia separada de UI. QA frontend local en Chrome headless con paginas/componentes reales y adaptador Axios en memoria: 32/32 casos, desktop 1424 px, tablet 768 px y mobile 390x844. Capturas inspeccionadas; incluye promocion/refetch/compra baja siguiente, errores/refresh, carrito incompatible retenido, pagos manuales y permisos settings. Browser use y node_repl no pudieron inicializar assets; se uso Chrome headless con harness propio temporal y sin API/DB real. Chrome impone ventana minima 500 px: movil probado dentro de iframe real de 390 px. No es E2E frontend contra API real ni prueba de teclado/dispositivo fisico. Harness removido del repo y servidor detenido; artefactos locales conservados fuera del repo. [Evidencia](../../docs/f10-2-wholesale-pricing-admin-frontend-validation.md).
