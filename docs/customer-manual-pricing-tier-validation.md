# Gestión manual de condición comercial en Clientes

Implementada el 2026-11-18 sobre `dbb1a31` en `dev`, con árbol inicial limpio. Aplicación de procedures y gate real pendientes.

## Contrato y persistencia

- `POST /api/customers` admite `pricingTier` opcional y utiliza `RETAIL` por defecto. `PUT /api/customers/:id` admite cambios de tier como único campo y conserva el valor actual si se omite. Se mantienen `customers.create`, `customers.update`, el negocio autenticado y la respuesta de Clientes. `wholesaleSince` es de solo lectura. [Contrato](contracts.md).
- SQL deja la fecha en `NULL` para Minorista, la inicia al entrar a Mayorista y la conserva al mantener esa condición. El PUT explícito a Mayorista completa una fecha ausente en datos legados. Se usan las columnas existentes. [Procedures](../server/src/db/procedures/customers.sql) · [Despliegue y rollback](database.md).
- El formulario permite elegir ambas condiciones y pide confirmación únicamente al pasar de Mayorista a Minorista. Si se editan otros datos con el mismo tier, la UI lo omite del PUT para evitar sobrescribir una promoción automática concurrente. La tabla usa la respuesta actualizada del listado. [Formulario](../client/src/views/businesses-app/module/customers/components/modal/CustomerFormModal.tsx).
- Sales sigue exigiendo el mínimo inicial solamente a Minorista y promociona automáticamente al alcanzarlo. Ventas históricas, política global y estado activo conservan sus reglas. La condición mayorista persiste hasta un cambio posterior, sin calendario ni expiración.

## Verificaciones ejecutadas

| Comando | Resultado |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run --config vitest.wholesale-pricing.config.ts --reporter=dot` desde `server/` | 289 pruebas DB-free aprobadas en 8 archivos, incluidas 9 nuevas de Clientes y la regresión Wholesale. |
| `npm run typecheck` y `npm run build` desde `server/` | Aprobados. El typecheck incluye el gate. |
| `npm run db:build-baseline` y `npm run db:validate-baseline` desde `server/` | Baseline regenerado y validado. SHA-256 `e786edc889aea8ebcbf83c340fd21a4cc8c2d3625c483627b45cdd532dc4998e`. |
| `node --test --test-reporter=dot scripts/wholesale-pricing.test.mjs scripts/wholesale-price-visibility.test.mjs` desde `client/` | 91 regresiones aprobadas. |
| `npm run build` desde `client/` | Aprobado con avisos de bundle e imports dinámicos. |
| ESLint acotado a tipos, validación, formulario y página de Clientes | Aprobado. No se ejecutó lint global. |

Los tests de backend simulan el pool y comprueban contrato, parámetros, guardas y SQL estático. El test de contrato anterior que prohibía escribir el tier se actualizó al nuevo contrato. Se mantiene el rechazo de la fecha y todos los asserts de Sales.

Chrome headless con `CustomersPage` y Axios simulado a 320, 768 y 1440 px verificó el default Minorista, validación de campos requeridos, alta Mayorista, precarga y actualización de la tabla, ausencia de tier en una edición común y confirmación del descenso. Cancelar conservó el formulario y emitió cero escrituras. Confirmar actualizó a Minorista y quitó «Desde». Ascender nuevamente guardó sin alerta. Ninguna petición envió `wholesaleSince`.

## Gate HTTP/MySQL

Preparado y tipado. El gate conserva los casos F10.1 y agrega alta manual mayorista, creación minorista implícita/expresa, mínimo y promoción automática, preservación de fecha en una edición, rechazo entre negocios, descenso, historial y rehabilitación del precio mediante ascenso manual. Comprueba las firmas antes de crear fixtures. Solo ejecutar con autorización, SQL vigente y DB de integración en loopback. [Suite](../server/src/tests/integration/wholesale-pricing/wholesale-pricing.integration.test.ts).

```powershell
# Desde server/
node node_modules/vitest/vitest.mjs run --config vitest.wholesale-pricing-integration.config.ts
```

No se consultó MySQL ni se aplicó SQL en ningún ambiente.
