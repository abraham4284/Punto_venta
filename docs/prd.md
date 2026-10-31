# Cajora: producto y alcance

Cajora es una aplicacion web de administracion comercial para multiples negocios. Centraliza ventas, compras, inventario, clientes, proveedores y caja, con usuarios y permisos por negocio. Los nombres Punto_Venta, MaxiKiosco y Vendix aparecen en antecedentes; la marca actual es Cajora.

## Contextos y actores

| Contexto | Proposito y actores |
| --- | --- |
| businesses-app | Operacion diaria de cada negocio. OWNER administra su negocio; ADMIN gestiona segun permisos; SELLER opera ventas; DELIVERY gestiona entregas/cobros habilitados. El rol no reemplaza la comprobacion de permisos. |
| platform | Administracion del servicio: negocios, usuarios, planes, suscripciones, pagos, auditoria y notificaciones. Roles SUPER_ADMIN, SUPPORT y ANALYST con acceso segun autorizacion. |
| storefront publico | Catalogo asociado a un negocio, separado de la administracion. Permite consultar oferta y disponibilidad publica. |

## Capacidades actuales

- Maestros comerciales: clientes, proveedores, categorias, productos con imagenes/contenido, depositos y metodos de pago.
- Inventario por deposito, ajustes, transferencias, movimientos y stock critico.
- Compras, ventas con o sin cliente, descuentos, historial, comprobantes y tickets.
- Pagos de ventas, entregas y rendiciones; apertura/cierre de caja y resumen por metodo.
- Usuarios del negocio, permisos, suscripciones, limites de plan y aceptacion de documentos legales.
- Panel de plataforma con dashboard y gestion SaaS; notificaciones internas por destinatario.

Estas capacidades tienen implementacion en el repositorio; su presencia no certifica QA integral ni despliegue. Estado y limites: [project-state](project-state.md).

## Reglas de producto que condicionan nuevas fases

Una venta sin cliente representa Consumidor Final, sin crear un cliente ficticio. Un cobro del cadete y una rendicion en caja son operaciones diferentes. Una compra puede distribuir sus lineas entre depositos. La desactivacion conserva registros operativos e historia.

Customers v2 separa nombre/apellido y permite documento opcional; la identidad visible se deriva de ambos nombres. No existe `Customer.name` en su contrato actual.

## Planificado y fuera de alcance

Orders esta planificado: primero pedidos manuales internos, luego administracion visual y conversion a venta en fases separadas. No esta implementado; no hay reserva de stock inicial. Ver [roadmap](tasks.md).

VITRUNO es un proyecto consumidor separado del catalogo publico. El acuerdo de producto mantiene el cierre por WhatsApp y excluye la creacion automatica de Orders y el uso de endpoints administrativos por ese consumidor. Su UX y despliegue no se verifican desde este repositorio.
