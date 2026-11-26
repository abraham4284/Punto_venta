# Calendario comercial en Ventas, Compras y Dashboard

Implementado el 2026-11-25 en `dev` sobre `2644ce6`, con árbol inicial limpio. SQL preparado y gate real pendiente.

## Causa y almacenamiento confirmado

El operador confirmó que las fechas están guardadas en hora argentina. El schema usa DATETIME sin fracciones en `sales.sale_date`, `sales.created_at` y `purchases.purchase_date`, con default CURRENT_TIMESTAMP. Los procedures de alta usan NOW(). El pool no declara timezone ni dateStrings. La confirmación del marco temporal es del operador y no una medición de DB por el agente.

El filtro construía Date desde YYYY-MM-DD, interpretado como medianoche UTC, y luego mezclaba componentes locales y serialización del driver. Dashboard combinaba CURDATE para ventas, UTC_DATE para compras y un fallback basado en UTC de Node. Además, mysql2 y la UI interpretaban fechas con las zonas implícitas del proceso y navegador.

La política central es `America/Argentina/Tucuman`. El pool, los writes, NOW(), schema y los históricos conservan su implementación. [Decisión](decisions.md) · [Operación SQL](database.md).

## Corrección

- El [helper temporal](../server/src/helpers/business-time.helper.ts) valida días reales y rangos, y produce strings SQL en el marco civil argentino confirmado. El 25/11 se consulta con `[2026-11-25 00:00:00, 2026-11-26 00:00:00)`. La aritmética UTC del helper sirve para avanzar el calendario, sin convertir esos límites en instantes.
- Los controllers de Ventas y Compras pasan las fechas como strings. Ambos SELECT de cada procedure usan fin exclusivo y los mismos predicados temporales. Se corrigió el mismo bug de Compras.
- Dashboard obtiene un solo now, calcula día/mes/año comercial y pasa límites a los procedures. Ventas y compras efectivas conservan COMPLETED. Se eliminó el fallback de compras, porque el procedure actualizado provee las cuatro métricas con el mismo período y exige desplegarse junto al backend.
- El gráfico de métodos de pago usa el mismo mes. El anual usa intervalos mensuales en DATETIME argentino. Los años disponibles incluyen el año comercial actual. La actividad reciente y el top histórico mantienen su alcance.
- El [adaptador de lecturas](../server/src/helpers/business-datetime-query.helper.ts) habilita typeCast solo en las consultas afectadas y columnas de fecha comercial y cabecera identificadas. Lee DATETIME con field.string() y obtiene su instante mediante Intl y la zona canónica. Los mappers siguen recibiendo Date y el JSON conserva ISO con el instante correcto. Fechas de pagos, detalles, entregas programadas, otros módulos y el pool global conservan su tratamiento.
- El [helper frontend](../client/src/helpers/businessDate.ts) representa esos instantes en la zona comercial y formato de 24 horas. Se usa en tabla, detalle y comprobante de ventas/compras y ventas recientes. La selección de año y los meses visibles del gráfico usan el mismo calendario. Los filtros continúan enviando YYYY-MM-DD.

## Validación ejecutada

| Comando | Resultado |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run --config vitest.business-time.config.ts --reporter=dot` desde server | 347 aprobados, incluidos 23 temporales y regresiones Sales/Wholesale/Orders/Returns/Catálogo. |
| Mismo config limitado a `src/tests/unit/business-time.test.ts`, con TZ=UTC y TZ=America/Argentina/Tucuman | 23/23 aprobados en cada zona. |
| `npm run typecheck` y `npm run build` desde server | Aprobados. Typecheck incluye el gate preparado. |
| `npm run db:build-baseline` y `npm run db:validate-baseline` desde server | Regenerado y validado. SHA-256 `fe25f13358dbd9dec65cdd849f6bc669c5674553ddbae7de5393ca2c76152883`. |
| `node --test --test-reporter=dot scripts/business-date.test.mjs scripts/sale-print.test.mjs` desde client | 29 aprobados, incluidos 11 nuevos. |
| `npm run build` desde client | Aprobado con avisos de bundle/imports dinámicos existentes. |
| ESLint acotado a fuentes frontend afectadas y suite temporal | Aprobado. Lint global no ejecutado. |

El pool está simulado en las suites unitarias. Se verifican binds de controllers/services, SQL estático, día/mes/año, bisiestos, rangos abiertos, fechas inválidas y milisegundos. La paridad con dataset simulado verifica dos ventas COMPLETED de 10.000/20.000, exclusión de una CANCELLED de 50.000 y días adyacentes. Los casos 20:59, 21:00, 23:59 y medianoche evitan tomar el cambio UTC como cambio comercial. Las pruebas frontend verifican 00:30 y las demás fronteras bajo procesos UTC, Argentina y Tokio.

## Gate HTTP/MySQL preparado

**PREPARED / NOT RUN.** La [suite](../server/src/tests/integration/business-time/sales-dashboard.integration.test.ts) admite solo loopback y punto_venta_integration_test. Antes de crear fixtures verifica los cuerpos de cuatro procedures y que NOW() represente el reloj argentino confirmado. Requiere un plan activo existente. Crea negocios UUID aislados y limpia solo sus negocios/usuarios y dependencias, con FKs activas.

Compara por HTTP Historial COMPLETED, Dashboard y Compras sobre los mismos datos. Verifica rangos abiertos, múltiples días, totalRecords y summary. Los casos mensuales/anuales inyectan now en el service para probar noviembre/diciembre/enero sin cambiar el reloj ni la zona de MySQL. El día del gate HTTP es el día comercial real de la ejecución para mantener válidas las sesiones de autenticación.

Con autorización y SQL alineado, desde server:

```powershell
node node_modules/vitest/vitest.mjs run --config vitest.business-time-integration.config.ts
```

## Aplicación y pendientes

Reimportar completos sales.sql, purchases.sql y dashboard.sql, con backend/frontend compatibles en la misma ventana. El código nuevo es incompatible con las firmas anteriores del Dashboard y con el fin inclusivo anterior de Sales/Purchases. Ninguna DB local, test, QA o productiva fue consultada ni actualizada por el agente. El baseline es para instalaciones limpias.

Ya existen `idx_sales_business_date` y `idx_purchases_business_date`. EXPLAIN y paridad contra MySQL siguen pendientes. El smoke con API real debe confirmar 00:30, después de 21:00 y comprobantes. No se realizó QA de navegador en esta fase.

La búsqueda acotada encontró CURDATE en platform_dashboard.sql y platform_businesses.sql. Su calendario SaaS requiere una revisión separada. Otros flujos del pool global deberán auditarse si presentan el mismo síntoma. Si un ambiente contiene históricos UTC mezclados con locales, investigarlos por separado antes de convertir datos.
