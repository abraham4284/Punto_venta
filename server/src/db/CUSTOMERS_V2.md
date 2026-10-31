# Customers v2 - DB y backend

## Contrato y decisiones

- Identidad persistida: `first_name` y `last_name`, VARCHAR(120) NOT NULL. API: `firstName` y `lastName`, trim y 2..120 caracteres.
- `fullName` se deriva en el mapper; no existe como columna. Customers API ya no devuelve ni acepta `name`.
- `documentType`: DNI, CUIL, CUIT, PASSPORT u OTHER. `documentNumber` es string nullable de hasta 50 caracteres normalizados.
- Documento opcional como par: ambos null/omitidos o ambos con valor. En PUT, si se incluye uno deben enviarse ambos. Ambos null limpia el documento.
- DNI/CUIL/CUIT eliminan espacios, puntos y guiones y requieren digitos. PASSPORT/OTHER aplican trim y uppercase, conservando guiones internos. No hay verificacion nacional de digitos.
- UNIQUE `(idBusiness, document_type, document_number)` es la autoridad ante concurrencia. Permite varios clientes sin documento y documentos iguales entre negocios diferentes. Error duplicado: HTTP 400, `errors: [{ field: "documentNumber", message: "Ya existe un cliente con ese documento" }]`.
- CHECK `chk_customers_document_pair` refuerza el par documental. Se mantiene `uk_customer_business_id` y la FK compuesta sales -> customers sin cambios.

### Respuesta

`{ idCustomer, idBusiness, firstName, lastName, fullName, documentType, documentNumber, phone, email, address, observation, isActive, createdAt, updatedAt }`.
Fechas se serializan como JSON desde los Date existentes; updatedAt y campos de contacto pueden ser null.

### Crear

POST `/api/customers`, autenticado, sin idBusiness del cliente:

```json
{
  "firstName": "Juan Carlos",
  "lastName": "De la Vega",
  "documentType": "DNI",
  "documentNumber": "12.345.678",
  "phone": null,
  "email": null,
  "address": null,
  "observation": null
}
```

Para crear sin documento, omitir ambos campos documentales. PUT `/api/customers/:id` conserva campos omitidos; null limpia campos nullable. Ejemplo para limpiar documento:

```json
{ "documentType": null, "documentNumber": null }
```

### Buscar

GET `/api/customers` conserva el listado completo del tenant, sin paginacion.
GET `/api/customers?search=12.345.678` busca por nombres, nombre completo, documento, telefono o email. Se conserva el texto original y se compara ademas una alternativa sin separadores para documentos numericos. Search presente debe tener 1..160 caracteres tras trim; vacio devuelve 400. Orden: apellido, nombre, idCustomer.
Todos los controllers toman idBusiness de req.user. Se mantienen rutas PUT/PATCH y permisos customers existentes.

## Compatibilidad y despliegue

Sales, Tickets, Cash Settlements, Dashboard y Platform siguen exponiendo sus aliases customer_name/customerName. La composicion SQL usa first_name + last_name; las ventas anonimas conservan Consumidor Final. No se alteraron Suppliers, stock, caja, auth, suscripciones, legal ni se implemento Orders.

**Breaking change:** Customers Admin UI requiere Fase Frontend 2 antes de un despliegue coordinado a produccion. No se modifico frontend ni se agrego un alias legacy name en Customers.

## Base vacia

Usar el instalador canonico o `generated/cajora_v1_0_full.sql`, segun README.md. No aplicar la migracion manual sobre instalaciones nuevas.

## Base existente: orden exacto

1. Respaldar la base seleccionada y detener las escrituras de la aplicacion.
2. Ejecutar `manual/002_customers_v2.sql`. No continuar si devuelve error.
3. Ejecutar `procedures/customers.sql` completo.
4. Ejecutar `procedures/sales.sql` completo.
5. Ejecutar `procedures/tickets.sql` completo.
6. Ejecutar `procedures/cash_settlements.sql` completo.
7. Ejecutar `procedures/dashboard.sql` completo.
8. Ejecutar `procedures/platform_businesses.sql` completo.
9. Desplegar backend y frontend compatible; comprobar creacion, busqueda, edicion, documentos duplicados y venta sin cliente antes de reabrir escrituras.

El script de estructura no recarga procedures automaticamente: los seis archivos anteriores son obligatorios en la misma ventana de mantenimiento. En CLI MySQL/MariaDB se puede usar SOURCE para cada archivo desde server/src/db. En phpMyAdmin/Workbench importar/ejecutar cada archivo completo en ese orden. No ejecutar install.sql contra una base existente.

Por autorizacion del operador para datos descartables, el archivo termina con `CALL sp_migrate_customers_v2(1)`: convierte clientes de prueba sin borrarlos ni modificar sus IDs o referencias en ventas. Los campos v2 ya completos se conservan. Para nombres pendientes, first_name recibe el name anterior con trim, recortado a 120 caracteres (o Cliente si tiene menos de 2); last_name recibe Sin apellido. No se intenta adivinar el apellido. La columna name se elimina al finalizar; este modo puede perder caracteres de nombres largos y NO es una migracion apta para clientes reales. Se actualiza por primary key para admitir SQL_SAFE_UPDATES.

Para datos reales, cambiar la llamada final a `CALL sp_migrate_customers_v2(0)` ANTES de ejecutar el archivo: conserva el bloqueo previo a cualquier ALTER si existen filas legacy. Preparar entonces una migracion revisada de nombres, sin borrar clientes relacionados con ventas. No usar el modo de prueba con clientes reales, aunque la base se llame development. En una base ya v2 la conversion legacy no se repite.

DDL hace commits implicitos: si una sentencia falla, conservar mantenimiento, revisar el error y reejecutar tras corregirlo. Las adiciones se verifican por nombre en information_schema. No es una transaccion rollback de toda la migracion.

## Verificacion de esta entrega

Desde server, sin conexiones DB:

```sh
npm run typecheck
npm run build
npm run db:build-baseline
npm run db:validate-baseline
npx vitest run --config vitest.customers-v2.config.ts
```

La configuracion Customers v2 omite setup de integracion y mockea pool. Los tests verifican validaciones, mapper, servicios, controllers y estructura SQL; no prueban ejecucion SQL real.
Fixtures y tests multi-tenant fueron actualizados, incluyendo normalizacion, duplicado, aislamiento y limpieza documental. No se ejecutaron suites conectadas, migraciones, resets ni consultas a DB. Validar el baseline no certifica su ejecucion en MySQL/MariaDB: esa comprobacion queda al operador en una DB de prueba.

La documentacion canonica ahora comienza en [AGENTS.md](../../../AGENTS.md), [docs/tasks.md](../../../docs/tasks.md) y [docs/project-state.md](../../../docs/project-state.md); este archivo conserva el contrato y las notas especificas de la entrega Customers v2.
