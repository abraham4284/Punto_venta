# Convenciones frontend

Aplicar [reglas globales](../../docs/coding-rules.md), [client/AGENTS](../AGENTS.md) y [contratos HTTP](../../docs/contracts.md). No duplicar politicas Git/DB ni cambiar backend durante una tarea solo frontend.

- Componentes, hooks, handlers y utilitarios con arrow functions; React/TypeScript, tipos de props/respuesta explicitos donde aportan valor. Alias `@/` apunta a src; conservar convenciones de imports existentes y `import type` cuando corresponde.
- Respetar modulos y flujo page -> hook -> api. Estado de interaccion en componente, carga/datos del modulo en hook; Zustand solo si varios consumidores necesitan compartir/persistir estado. No duplicar la misma fuente de estado en stores y componente.
- Reutilizar [useForm](../src/hooks/useForm.ts): sus nombres actuales son `formSate`, `setFormSate`, `onInputChange`, `onResetForm`. No renombrar como limpieza incidental ni copiar su `any` a codigo nuevo.
- Zod valida formularios segun contrato existente; `.strict()` donde el modulo lo exige. Mantener tipos/payloads consistentes con API, no agregar aliases legacy para ocultar incompatibilidad.
- En modales, conservar datos y `errors: [{ field, message }]` al fallar; no cerrar/reiniciar por un error de validacion. Evitar effects dependientes de objetos/callbacks inestables que reseteen inputs mientras se escribe. [CustomerFormModal](../src/views/businesses-app/module/customers/components/modal/CustomerFormModal.tsx) usa formulario nuevo por apertura/cliente en lugar de resets via effects.
- Telefono como string y `type="tel"`; documento identificatorio como string/texto, normalizacion segun tipo sin convertir a numero. Mantener ceros iniciales, campos opcionales y limpieza explicita del par documental. No asumir Date real a partir de JSON.
- Usar la instancia Axios del contexto, no fetch/instancias sueltas para esquivar interceptores. No reintroducir token BUSINESS en localStorage. PLATFORM mantiene su mecanismo actual descrito en contracts; no migrarlo incidentalmente.
- Mostrar mensajes/errores por campo y estados loading/vacio/fallo claros; manejar 402, 401 y permisos como casos distintos segun interceptores existentes. Evitar reintentos recursivos y ciclos de importacion en auth/suscripcion.
- Mantener guards de rutas y permission checks; no dar privilegios amplios para resolver una dependencia visual. Backend sigue siendo autoridad.
- Reutilizar Base UI/shadcn de [components/ui](../src/components/ui), Lucide y tema Cajora. No asumir API Radix ni introducir librerias UI nuevas sin necesidad.
- Preservar responsive y accesibilidad: labels asociados, botones semanticos, foco/teclado en dialogos, estados disabled/loading y nombres accesibles en acciones de icono. Verificar layouts/tablas/modales en anchos relevantes; no considerar build como prueba visual.

Validacion y deuda global: [testing](testing.md). No cambiar estilo de codigo ajeno ni reparar lint global fuera del scope.
