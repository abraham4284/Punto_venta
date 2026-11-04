# Rediseño de SalePrintDocument — validacion

Fecha: 2026-11-04. Rama dev, HEAD inicial `884207d5d2297ee7921c22e8b397ecb64a29124b` (F9), checkout limpio al comenzar. Solicitud: rediseñar exclusivamente el comprobante del boton Imprimir comprobante. Sin cambio de rama, staging, commit, push ni otras mutaciones Git.

## Implementacion y archivos

- [SalePrintDocument.tsx](../client/src/views/businesses-app/module/sales/components/print/SalePrintDocument.tsx): reemplaza cabecera decorativa alta/min-height fijo por encabezado compacto con logo/nombre/rubro dinamicos, numero/fecha y estado Completada/Cancelada. VITRUNO se muestra cuando es el negocio recibido; no se impone esa identidad a otros tenants. Cancelada tiene aviso legible sin marca de agua sobre productos.
- Mismo componente expone SalePrintContent para previews/pruebas aisladas. Datos compactos cliente/delivery solo si existen; no reserva bloques para null. Tabla semantica Foto/Producto/Cant./Precio unit./Total, imagen 36 px (32 movil), fallback para ausente/rota, barcode, cantidad decimal sin asumir UNIT, descuento de linea cuando existe. Subtotal usa grossSubtotal recibido, descuento/envio/total usan importes originales, sin nueva aritmetica ni reglas economicas.
- Pagos originales una sola vez, metodo/importe y estados no confirmados legibles; fallback legacy solo si no hay rows. Resumen incorpora deliveryFee cobrado al cliente (incluye envio cero si hay entrega); nunca externalCost ni referencia/proveedor logístico internos, deposito o vendedor. Observaciones solo cuando tienen texto, respetan saltos de linea. Pie compacto de agradecimiento/comprobante comercial, sin nomenclatura fiscal, CAE, QR fiscal ni barcode nuevo.
- [sale-print.styles.ts](../client/src/views/businesses-app/module/sales/components/print/sale-print.styles.ts): CSS exclusivo del documento. A4/10 mm, tabla con thead repetible y filas/sumario sin cortes, flujo sin altura minima/padding de hoja ficticio. Overrides movil solo screen, nunca cambian columnas print.
- SalePrintDocument usa portal directo a body, oculto en pantalla. En print, body:has(> .sale-print-root) oculta los otros hijos (incluido #root/layout/alertas/controles) y muestra solo documento. Evita heredar overflow de contenedores administrativos. El estilo se monta/desmonta con el comprobante, sin modificar index.css ni otras impresiones.
- [Test persistente](../client/scripts/sale-print.test.mjs) y [fixtures A..G](../client/scripts/fixtures/sale-print.fixtures.mjs): node:test, compilador TypeScript existente y React SSR; sin nuevas dependencias, framework o scripts package.json. El mismo test puede generar HTML de QA con --fixtures=directorio para reproduccion.
- Actualizados [tasks](tasks.md) y [project-state](project-state.md). Este registro es la evidencia de la fase actual posterior a F9; no agrega fases futuras ni modifica el roadmap funcional ya completado.

Sin cambios en ViewSaleDetails/SaleDetailsView, boton/handler window.print, panel/listado/dialog de ventas, Returns/Delivery/Payment UI, navegacion, layout o estilos globales. Sin cambios server/**, DB, logica de stock/caja/pagos/entregas, client/text.txt, dependencias o contratos HTTP. No se necesitaba backend: props existentes de Sale, Business, Customer y grossSubtotal contienen todos los datos requeridos. No se agrego QR/barcode porque no habia necesidad ni dependencia dedicada en este alcance.

## Validacion tecnica ejecutada

- Client npm run build aprobado: TypeScript + Vite. Persisten warnings previos de bundle grande (~1.86 MB) y imports dinamicos inefectivos auth/subscription/toast. No se ejecuta API/DB al compilar.
- ESLint acotado a los dos TS/TSX del comprobante: aprobado; node --check en ambos scripts de test/fixtures: aprobado. No se repitio lint global ni se afirma reparada la deuda global previa.
- Desde client: node --test scripts/sale-print.test.mjs, **18/18 aprobados**. Cubren tabla y cantidades decimales, branding tenant, campos opcionales/consumer fallback, ausencia de bloques vacios, deliveryFee, ausencia de externalCost/logistica/deposito/vendedor en A..G, pagos/estados sin duplicacion legacy, fallback sin imagen, importes/descuento sin mutacion del input, cancelada, escape de markup en observaciones y aislamiento/paginacion CSS. Pruebas SSR no sustituyen navegacion ni impresora fisica.

## QA PDF y visual obligatoria A..G

Skill PDF aplicada con runtime/Python/Poppler locales. HTML generado desde el componente real (SSR) con assets SVG ficticios embebidos y estilos globales print actuales antes de estilos propios; simula #root con header/sidebar/mensaje de suscripcion que deben desaparecer. Chrome headless exporta PDF A4 sin headers/footers del navegador. Primer intento sandbox no produjo PDF (exit 2147483651); render fuera del sandbox con perfil temporal propio completo todos los casos. No utiliza perfil/datos reales del usuario ni backend/DB.

| Escenario | Fixture / resultado | Paginas A4 |
| --- | --- | --- |
| A | 3 productos, sin delivery, un pago, sin observaciones; sin bloques vacios. | 1 |
| B | 5 productos, envio 5000, destinatario/telefono/direccion/referencia, observaciones. | 1 |
| C | 6 productos, multiples pagos; pendiente identificado para no afirmar cobro completo. | 1 |
| D | 4 productos, imagenes y logo ausentes, cliente null; fallback compacto. | 1 |
| E | 25 productos, nombres extendidos, entrega y pagos mixtos. Thead repetido, filas completas: 14 + 11, resumen junto al cierre, sin pagina casi vacia. | 2 |
| F | 10 productos, descuento 500 y envio 5000. Subtotal 123125 / total 127625, mismos datos recibidos. | 1 |
| G | Venta cancelada, aviso/estado y pagos cancelados, importes historicos legibles. | 1 |

Todos los PDFs miden aproximadamente 595 x 841.9 pt (A4). Python/pypdf verifico page count, presencia de SKUs esperados por pagina y ausencia de canarios internos/header/sidebar/suscripcion. Poppler renderizo **8 paginas PNG** y se inspeccionaron visualmente todas: sin filas partidas, recortes, solapes ni desbordes de importes en estas fixtures. Se genero prueba visual y no se infiere que todo nombre/importe arbitrario siempre entrara en una pagina.

QA navegador Chrome adicional en preview temporal de componentes React reales, exclusivamente fixtures: desktop y viewport 390x844, comprobante/tabla legibles sin scroll horizontal (pageWidth 375 <= innerWidth 390), imagen rota cambia al fallback y mantiene fila; portal como hijo directo de body, display none en pantalla. Header/sidebar/alertas ficticias permanecen en screen, desaparecen del PDF. Viewport restaurado, pestaña cerrada, archivos de preview eliminados y Vite detenido al terminar.

Evidencias locales fuera del repo: carpeta sale-print-qa en el workspace de visualizaciones de este chat (HTML/PDF/PNG A..G). Son datos ficticios; no archivos de clientes reales. Limites: no impresora fisica, no E2E autenticado/API real ni produccion; margenes/opciones de impresora y otros navegadores pueden variar. El boton existente se conserva sin cambio de codigo; no se envio nada a una impresora real.

## Revision final

7 archivos dentro del alcance (3 modificados, 4 nuevos), 36 enlaces Markdown locales y 7 imports relativos/alias comprobados. Git diff --check y whitespace aprobados; git status --short y git diff --stat revisados. Allowlist verificada: solo componente/estilos/tests/fixtures del comprobante y los tres documentos de cierre. Perfil temporal de Chrome eliminado; HTML/PDF/PNG de evidencia conservados fuera del repo.

## Cierre

Cambio principal concentrado en SalePrintDocument y estilos exclusivos. Panel y detalle administrativos conservados, flujo de impresion existente conservado. Build/lint aplicable/tests y QA visual requeridos aprobados en el alcance descrito.

Commit sugerido: `feat(sales): rediseñar comprobante imprimible compacto para A4`.
Descripcion: compactar cabecera, datos y tabla; mostrar envio/pagos originales y aislar impresion del layout sin costos internos; agregar fixtures/tests y evidencia A4/mobile, preservando panel, backend y DB.


## Ajuste posterior solicitado — resumen sin pagos

Se elimina del comprobante el bloque completo de metodos/importes/estados de pago, incluido fallback legacy, y la linea de envio del resumen. Solo quedan Subtotal, Descuento y TOTAL, conservando sus valores originales y alineacion a la derecha mediante flex + ancho de totales existente. Se retiran labels/CSS de pagos sin uso. Entrega y resto del documento conservados; sin cambios al panel/backend/DB. Tests existentes ajustados al nuevo contenido: 18/18 aprobados; ESLint acotado y build frontend aprobados. Las capturas/PDF A..G anteriores corresponden al diseño inicial: no se regeneraron para este ajuste puntual. Git diff --check aprobado; tasks/project-state sincronizados.

Commit sugerido del ajuste: `fix(sales): simplificar resumen del comprobante`; descripcion: quitar pagos y desglose de envio, dejando subtotal, descuento y total a la derecha.
