# Backend Testing

Esta carpeta contiene la primera infraestructura automatizada de tests del backend, enfocada solamente en seguridad y comportamiento transversal de Express.

## Requisitos

- Node.js compatible con el proyecto.
- Dependencias instaladas con `npm install`.
- Archivo `.env.test` local basado en `.env.test.example`.
- La variable `DB_NAME` debe apuntar obligatoriamente a `punto_venta_integration_test`.

El setup de tests valida que el nombre de la base termine en `_test` y que sea exactamente `punto_venta_integration_test`. Si no se cumple, la suite se detiene antes de ejecutar cualquier prueba.

## Comandos

```bash
npm run typecheck
npm run build
npm run test:security
npm test
```

Para desarrollo:

```bash
npm run test:watch
npm run test:security:watch
```

## Alcance Actual

La suite actual cubre:

- Headers de seguridad de Helmet.
- Respuesta JSON estándar para rutas inexistentes.
- Manejo seguro de JSON inválido.
- Rechazo de payloads demasiado grandes.
- Error handler global sin exponer stack traces, SQL ni datos sensibles.
- Rate limit global.
- Rate limit de login del negocio.
- Rate limit de login de platform.
- Rate limit de registro.
- Rate limit de refresh token.
- Restricciones de importación de productos por tipo, tamaño y cantidad máxima de filas.

## Decisiones

- Los tests usan Supertest directamente contra la app de Express, sin levantar puerto HTTP.
- Morgan queda deshabilitado cuando `NODE_ENV=test` para evitar ruido en consola.
- Los stores de rate limit se reinician entre tests para evitar falsos positivos por contaminación de estado.
- No se prueban módulos funcionales como productos, ventas, stock, compras o caja en esta primera etapa.
- No se ejecutan scripts SQL ni se modifica la base de desarrollo desde la suite.

## Variables de Seguridad

`.env.test` no debe versionarse. Solo `.env.test.example` queda en el repositorio como plantilla segura.
