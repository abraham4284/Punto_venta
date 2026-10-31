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
