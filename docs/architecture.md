# Arquitectura del sistema

Cajora integra una SPA de administracion, una API backend y MySQL/MariaDB. Esta pagina define responsabilidades y fronteras; los detalles de implementacion viven en cada subsistema.

## Componentes y comunicacion

| Componente | Responsabilidad | Documentacion principal |
| --- | --- | --- |
| Client SPA | React/TypeScript: interfaz de negocio y plataforma, navegacion, formularios y estado de presentacion. Habla HTTP/JSON con API; no accede directamente a DB. | [client/architecture](../client/docs/architecture.md) |
| Backend API | Node/Express/TypeScript: autenticacion, autorizacion, validacion, reglas comerciales y persistencia. Usa mysql2/procedures y algunas queries parametrizadas. | [server/architecture](../server/docs/architecture.md) |
| MySQL/MariaDB | Persistencia, integridad relacional, operaciones SQL y auditoria/eventos del dominio. | [database](database.md) y [DB tecnica](../server/src/db/README.md) |
| Consumidor publico externo | VITRUNO consume catalogo publicado por Cajora; es un proyecto independiente. | [contracts](contracts.md), [PRD](prd.md) |

Direccion de comunicacion: usuario -> SPA -> API -> DB -> API -> SPA. Consumidores publicos -> API publica -> DB; no llaman al API administrativo ni se conectan a la DB. No hay ORM ni una Clean Architecture formal que imponer al codigo existente.

## Contextos

- businesses-app: operacion diaria de cada negocio (maestros, inventario, compras, ventas, pagos, entregas, caja/rendiciones y tickets).
- platform: administracion SaaS (negocios, usuarios, planes/suscripciones/pagos, dashboard, auditoria y notificaciones).
- storefront-app: catalogo publico de solo lectura asociado a un negocio, separado de la administracion. La configuracion por slug y proyeccion publica viven en backend.

La identidad autenticada distingue BUSINESS y PLATFORM. `idBusiness` delimita datos y operaciones del negocio; plataforma no equivale a pertenencia a un negocio. Permisos backend, aislamiento SQL y relaciones tenant-safe complementan autenticacion. Decision: [ADR-001](decisions.md); implementacion: [server/security-tenancy](../server/docs/security-tenancy.md).

## Contratos y responsabilidades

[contracts.md](contracts.md) es la fuente principal de prefijos HTTP, cookies/Bearer, CSRF, headers, envelopes, paginacion y errores compartidos. No hay un envelope global uniforme. Los guards del client ayudan a presentar acceso; el backend mantiene la autoridad.

La arquitectura interna de React, layouts, Axios y stores vive en client/docs; montaje Express, services/mappers y middleware vive en server/docs. Ownership transaccional por flujo e idempotencia: [server/transactions](../server/docs/transactions.md). Reglas transversales: [coding-rules](coding-rules.md).

Order y Sale son entidades distintas: Orders Core tiene DB/backend interno y Orders Admin F4 agrega su interfaz administrativa, sin efectos economicos/inventario. Conversion y reservas son futuras fases en [tasks](tasks.md); decisiones en [decisions](decisions.md). El acuerdo externo de VITRUNO/WhatsApp no certifica su despliegue ni implementacion desde este checkout.
