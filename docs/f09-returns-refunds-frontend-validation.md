# F9 — Returns & Refunds Frontend

Fecha: 2026-10-31. Rama dev, HEAD inicial `1e0dfd65e9dee535d3d9c295db978a95df841faf` (F8 Core); checkout limpio al iniciar. Master del prompt solo referencia historica. Sin cambiar rama, staging, commit ni push.

## Gate F8 documentado antes de UI

El contexto operativo suministrado por el operador confirma SQL F8 aplicado/alineado en local, test y produccion; gate real **24/24**, localhost:3306 / punto_venta_integration_test, NODE_ENV=test, cleanup OK y FK checks preservados, sin bugs funcionales. Se registraron primero esos datos en [F8 validation](f08-returns-refunds-core-validation.md), tasks y project-state, cerrando F8 e iniciando F9. **Resultado informado por el operador, no reejecutado por el agente en F9.** Produccion no sometida a suite. No se ejecuto DB real, SQL o migracion durante esta tarea.

Discrepancia documental corregida: una frase inicial F8 decia envio solo sin items; contrato canonico y helper backend permiten envio combinado con productos y fee-only, incluido envio posterior al full de mercaderia. No se cambio backend para resolverlo.

## Implementacion

- [SaleDetailsView](../client/src/views/businesses-app/module/sales/components/details/SaleDetailsView.tsx) integra Devoluciones y reembolsos sin nueva ruta/sidebar. Hook local [useSaleReturns](../client/src/views/businesses-app/module/sales/hooks/useSaleReturns.ts) carga solo con view, con loading/error/retry independiente y descarte de respuestas viejas. Un fallo Returns conserva Sale completa. Actualizaciones de pagos refrescan tambien saldos Returns.
- Labels modulo sale_returns / permisos view/create; useCan efectivo existente, OWNER shortcut y overrides preservados. Lectura con view; CTA solo create + view, Sale COMPLETED y saldo de cantidad/envio. OUT deshabilita con explicacion; PENDING/COLLECTED o cobertura confirmada insuficiente bloquean. DELIVERED permite; nunca cambia estado Delivery desde dialog.
- [Componentes returns](../client/src/views/businesses-app/module/sales/components/returns) separados en section, summary, history, detail, registro, items, allocations y campo reutilizable. Summary distingue total original, mercaderia/envio devueltos, total reembolsado y neto; labels/badges en espanol. Sale.total/estado/reporting gross se conservan. Historial mas reciente primero; detalle consume GET /sale-returns/:id, con items/restock/refunds/caja/referencia/observacion, sin editar/borrar.
- Items: imagen actual desde Sale, nombre/barcode/unidad, vendido/devuelto/disponible y saldo monetario. Seleccion/cantidad/restock true por defecto, editable por linea; sin selector de deposito. UNIT entero, otras unidades dos decimales. Preview [Decimal local precision 40](../client/src/views/businesses-app/module/sales/helpers/sale-return.helpers.ts) desde total historico de linea / soldQuantity; residual exacto final y limite al saldo. Backend sigue siendo autoridad, mismatch exige refresh.
- Envio parcial/total junto a productos o fee-only; gratuito fisico permite refunds vacio. Full de productos oculta seleccionables sin saldo y permite envio restante; agotados ambos, oculta CTA. Si refresh agota una seleccion existente, permite quitarla sin perder el resto del draft.
- Allocations contra payments originales: confirmado/saldo, original/devuelto/disponible, cash/noncash y estado; distribucion automatica inicial en orden recibido y ajuste manual, referencia/observacion. Decimal exige suma exacta y limite por pago, maximo cinco allocations, nunca otro metodo. Boton para volver a distribuir. Cash usa useSaleCashSession, requiere caja OPEN; noncash envia idCashSession null aun si existe caja consultada. No simula transferencia bancaria ni modifica settlements.
- Formulario local useForm + validacion Zod, payload exclusivo F8 (sin producto/precio/importe linea/tenant/actor/deposito/metodo). [Hook de registro](../client/src/views/businesses-app/module/sales/hooks/useRegisterSaleReturn.ts) conserva UUID/fingerprint del payload efectivamente enviado para retry incierto; un payload distinto usa UUID nueva, cambios sin efecto serializado conservan el intento. Exito/replay limpia. Mutex/disabled bloquean doble submit/cierre durante procesamiento y refresh; errores no borran datos. Cerrar/reabrir tras error conserva draft/key mientras la seccion siga montada y permisos vigentes.
- Conflicto/saldo exige GET fresco antes de reintentar y bloquea si falla; retry de red incierto conserva datos/UUID. Errores por campo y codigos F8 profesionales, inesperados genericos sin SQL/stack. Success notifica, cierra, refleja Return/summary del POST y refresca Returns/Sale. El registro confirmado oculta Anular inmediatamente, incluso si falla lectura posterior; backend conserva autoridad y SALE_WITH_RETURNS_CANNOT_BE_CANCELLED mapeado tambien para otros consumidores.
- Dialog Base UI con labels/aria y errores asociados, scroll interno/footer accesible, responsive; sin dependencias, store o framework nuevos. Sin cambios server/**, DB, client/text.txt, reglas economicas o grants.

## Validacion tecnica ejecutada

- Client `npm run build`: aprobado (TypeScript + Vite). Persisten warnings previos de bundle grande (~1.86 MB) e imports dinamicos inefectivos auth/subscription/toast. No demuestra API/DB ni accesibilidad exhaustiva.
- `npm run lint`: falla por **8 errores y 2 warnings previos** en LiGeneral, badge/button, useForm, DepositModalForm y PaymentMethodModal. Primera corrida incluyo una advertencia nueva de cleanup de ref en useSaleReturns, corregida; resultado global final vuelve a la deuda previa. No se repararon archivos ajenos.
- ESLint acotado a **17 archivos TS/TSX F9**: aprobado. El script de pruebas pasa node --check y su ejecucion real.
- `npm run test:sale-returns`: **52/52 aprobados**, [suite persistente](../client/scripts/sale-returns.test.mjs). node:test + compilador TypeScript existente, transpila solo helpers frontend en memoria y resuelve dependencias locales; no importa backend ni conecta DB. Sin framework/dependencia nuevos. Primer conjunto 49/50 por fixture de observacion que no cambiaba null; corregido; 50/50 y luego dos regresiones de fingerprint semantico dan 52/52. Detectada/corregida codificacion de acentos en una edicion intermedia, con guard UTF-8 persistente.
- Cubren preview parcial/residual, UNIT/decimal, valores invalidos, historico faltante, auto-allocation/orden/saldos, mixed, cash/noncash/caja, suma exacta, overflow, envio combinado/fee-only, gratuito, vacio/full sin saldo, restock/payload limitado, longitudes, UUID estable/ediciones reales e irrelevantes, bloqueos por estados/cobertura, mensajes seguros/refresh y red incierta. No son tests backend ni lifecycle DOM completo.

## QA navegador ejecutado con API en memoria

Skill computer-use leida y runtime inicializado; navegador Chrome mediante cua/browser APIs. Preview temporal con componentes reales F9, tema real y fixtures ficticios; adaptador Axios en memoria intercepto requests y rechazo rutas no reconocidas. No autenticacion real, requests al backend ni DB. Archivos temporales eliminados y Vite detenido; override de viewport restaurado y pestaña temporal cerrada. Un primer servidor Vite dentro del sandbox no fue accesible desde navegador (timeout); preview fuera del sandbox, ligada solo a 127.0.0.1:5189, permitio QA.

Comprobados en ese alcance:

- Summary inicial, CTA habilitada para entregada, dialog y labels, partial de una unidad con preview 33.33, restock desmarcado, POST ficticio, toast, summary/refund/neto e historial; GET detalle muestra restock No/caja/metodo y no ofrece cambios.
- Segundo return con saldo reducido y residual, full de mercaderia con pago mixto; full conserva envio pendiente. Fee-only posterior noncash, referencia, sin caja; total refund completo/neto cero y CTA oculta sin saldos.
- 409 concurrente simulado: mensaje profesional, formulario/cantidades/motivo conservados, refresh de saldos y retry exitoso. Cambios/HMR del harness provocaron reloads y una captura inicial sin conflicto; se armo/verifico luego el 409 explicitamente. No se presenta la simulacion como prueba de concurrencia DB.
- Sin caja OPEN: allocation cash bloquea Confirmar con explicacion; ajuste manual a transferencia completa de 33.33 quita requisito/caja y habilita submit. OUT_FOR_DELIVERY bloquea CTA con motivo; flag create falso oculta CTA y conserva lectura. No se probaron sesiones reales ADMIN/OWNER/SELLER/DELIVERY: esas reglas se verifican por integracion useCan y guardas del codigo.
- Desktop (viewport normal), mobile 390x844 y tablet 768x1024 (dimensiones comprobadas desde DOM). Se inspeccionaron screenshot/AX, adaptacion de texto/cards, scroll interno, footer visible, foco inicial/campos asociados y cierre con Escape. No es auditoria completa de accesibilidad ni certificacion de dispositivos fisicos.

Limites: sin E2E contra API real, sin DB real F9, sin prueba de permisos reales autenticados ni de atomicidad/caja/stock. Algunas guardas (PENDING/COLLECTED, gratuitos y UUID) tienen pruebas aisladas y lectura de codigo, no todos los escenarios del prompt fueron recorridos visualmente. F8 gate 24/24 sigue siendo confirmacion del operador.

## Revision final de archivos

25 archivos involucrados (9 modificados y 16 nuevos); 89 enlaces Markdown locales y 80 imports relativos/alias verificados. Whitespace final y git diff --check aprobados; git status --short y git diff --stat revisados. Sin cambios server/** ni client/text.txt. Los archivos temporales de preview no forman parte de la entrega.

## Cierre y roadmap

Actualizados tasks/project-state, F8 validation inicial y [arquitectura frontend](../client/docs/architecture.md)/[testing frontend](../client/docs/testing.md); sin decision arquitectonica nueva que requiera ADR. F7 CLOSED, F8 CLOSED con gate real informado, **F9 CLOSED al alcance implementacion/build/tests/QA aislada**. Roadmap actual Orders -> Sales -> Delivery -> Returns COMPLETED con estos limites; no equivale a certificar produccion ni E2E real.

Fuera de alcance: reservas, nota fiscal/ARCA, store credit/exchange, devoluciones de compras, rendiciones externas y VITRUNO/public returns. Sin iniciar otra fase.

Commit sugerido: `feat(sale-returns): integrar devoluciones y reembolsos en detalle de venta`.
Descripcion: agregar summary/historial/detalle y dialog con preview Decimal, reingreso, envio, allocations/caja, permisos y retry idempotente; proteger UX de anulacion, incorporar pruebas aisladas y documentar gate F8 y cierre F9.
