/*
  Cajora Legal Publication
  TERMS 1.0
  PRIVACY 1.0

  Official document date: 2026-08-31
  Runtime source: legal_document_versions.content
  Do not edit published versions. Any text change must be a new version.

  Hash normalization used before publication:
  - DOCX body text only.
  - CRLF/CR normalized to LF.
  - No trailing LF added.
  - SHA-256 calculated over exact UTF-8 stored content.
*/

USE punto_venta_dev_clean_2;

DROP PROCEDURE IF EXISTS sp_publish_cajora_legal_v1_0;
DELIMITER $$

CREATE PROCEDURE sp_publish_cajora_legal_v1_0()
BEGIN
  DECLARE v_terms_id INT DEFAULT NULL;
  DECLARE v_privacy_id INT DEFAULT NULL;
  DECLARE v_terms_existing_hash CHAR(64) DEFAULT NULL;
  DECLARE v_privacy_existing_hash CHAR(64) DEFAULT NULL;
  DECLARE v_terms_existing_count INT DEFAULT 0;
  DECLARE v_privacy_existing_count INT DEFAULT 0;
  DECLARE v_published_at DATETIME DEFAULT NULL;
  DECLARE v_terms_content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_privacy_content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_terms_hash CHAR(64) DEFAULT '5430d5d3870113f25f00d98f29ba85b14e78b6591f4f0809c3214b27ed021ab4';
  DECLARE v_privacy_hash CHAR(64) DEFAULT '9cd13785522dac3e837b54f1eb988e936f110ad6805dcf6063b88fcf7930f222';

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET v_terms_content =
  CONCAT(
    _utf8mb4'CAJORA', CHAR(10),
    _utf8mb4'Términos y Condiciones de Cajora', CHAR(10),
    _utf8mb4'Prueba gratuita, uso del servicio y futuras suscripciones', CHAR(10),
    _utf8mb4'', CHAR(10),
    _utf8mb4'Estado | VERSIÓN PARA PUBLICACIÓN - MVP', CHAR(10),
    _utf8mb4'Versión | 1.0', CHAR(10),
    _utf8mb4'Fecha | 31 de agosto de 2026', CHAR(10),
    _utf8mb4'Ámbito previsto | República Argentina - prueba gratuita y futuros planes pagos', CHAR(10),
    _utf8mb4'', CHAR(10),
    _utf8mb4'', CHAR(10),
    _utf8mb4'', CHAR(10),
    _utf8mb4'Preámbulo y aceptación', CHAR(10),
    _utf8mb4'Los presentes Términos y Condiciones (los “Términos”) regulan el acceso y uso de Cajora, una plataforma de software como servicio orientada a la gestión de pequeños comercios y emprendimientos. Cajora es operada por Apas Adrian Abraham, persona humana, con correo de contacto legal y soporte cajora62@gmail.com, en adelante “Cajora” o el “Proveedor”.', CHAR(10),
    _utf8mb4'La creación de una cuenta BUSINESS requiere que el OWNER lea y acepte expresamente estos Términos. La aceptación podrá registrarse junto con la versión del documento, la fecha y evidencia técnica proporcional, incluyendo datos de sesión cuando corresponda, conforme a la Política de Privacidad. La mera navegación pública no equivale por sí sola a contratar una suscripción.', CHAR(10),
    _utf8mb4'Si quien acepta actúa en representación de un negocio o persona jurídica, declara contar con facultades suficientes para obligarla. Si no está de acuerdo con estos Términos, no debe crear ni utilizar una cuenta BUSINESS.', CHAR(10),
    _utf8mb4'1. Definiciones', CHAR(10),
    _utf8mb4'BUSINESS o Negocio: espacio lógico independiente dentro de Cajora que agrupa usuarios, productos, clientes, proveedores, ventas, compras, inventario, cajas, depósitos, configuraciones y demás información relacionada.', CHAR(10),
    _utf8mb4'OWNER: usuario principal que crea o administra el BUSINESS, representa al Negocio frente a Cajora, gestiona la suscripción y habilita a otros usuarios.', CHAR(10),
    _utf8mb4'Usuario autorizado: persona invitada o creada por el OWNER para utilizar Cajora con roles y permisos determinados.', CHAR(10),
    _utf8mb4'Servicio: acceso remoto a las funcionalidades de Cajora disponibles según la modalidad o plan vigente.', CHAR(10),
    _utf8mb4'Plan: conjunto de funcionalidades, límites, precio, periodicidad y condiciones comerciales informadas antes de su contratación.', CHAR(10),
    _utf8mb4'Datos del Negocio: información que el Negocio o sus usuarios cargan, generan o administran mediante Cajora.', CHAR(10),
    _utf8mb4'Documentos legales: estos Términos, la Política de Privacidad y las condiciones particulares que correspondan.', CHAR(10),
    _utf8mb4'2. Objeto y naturaleza del Servicio', CHAR(10),
    _utf8mb4'Cajora proporciona herramientas de gestión accesibles por internet. Según las funcionalidades habilitadas, puede incluir ventas, compras, productos, categorías, inventario, depósitos, transferencias de stock, importación mediante planillas, caja, métodos de pago, clientes, proveedores, usuarios, roles, permisos, paneles, métricas, informes, reposición y otras funciones administrativas.', CHAR(10),
    _utf8mb4'Cajora es una herramienta administrativa. No es una entidad financiera, estudio contable, asesor legal ni autoridad fiscal. El Servicio no reemplaza el asesoramiento profesional que el Negocio pueda necesitar.', CHAR(10),
    _utf8mb4'El acceso se concede como servicio remoto. No se vende ni transfiere el código fuente, arquitectura o propiedad del software.', CHAR(10),
    _utf8mb4'3. Requisitos y registro', CHAR(10),
    _utf8mb4'El OWNER debe ser una persona humana mayor de dieciocho (18) años con capacidad para contratar, actuar en nombre propio o estar autorizado para representar al Negocio. Cajora podrá solicitar información razonable para verificar la cuenta, prevenir abusos o cumplir obligaciones legales.', CHAR(10),
    _utf8mb4'La información de registro debe ser verdadera, exacta, completa y mantenerse actualizada. No se permite crear cuentas con identidades falsas, datos de terceros sin autorización o medios automatizados no autorizados.', CHAR(10),
    _utf8mb4'4. Cuenta BUSINESS, OWNER y usuarios autorizados', CHAR(10),
    _utf8mb4'Cada BUSINESS constituye un entorno independiente. El OWNER administra usuarios, roles, permisos, depósitos, cajas y configuraciones del Negocio. Es responsable de verificar que cada usuario necesite el acceso concedido y de revocarlo oportunamente.', CHAR(10),
    _utf8mb4'Los usuarios autorizados no adquieren por ese solo hecho facultades para contratar, cambiar o cancelar una suscripción, salvo autorización expresa del OWNER o configuración habilitada por Cajora.', CHAR(10),
    _utf8mb4'El Negocio es responsable por las operaciones realizadas por sus usuarios dentro de los permisos concedidos, sin perjuicio de incidentes atribuibles a fallas de seguridad o incumplimientos propios de Cajora.', CHAR(10),
    _utf8mb4'5. Credenciales y seguridad de la cuenta', CHAR(10),
    _utf8mb4'Las cuentas son individuales. No deben compartirse contraseñas, tokens ni mecanismos de autenticación. Cada usuario debe emplear credenciales robustas, cerrar sesión en dispositivos compartidos y comunicar inmediatamente accesos sospechosos a cajora62@gmail.com.', CHAR(10),
    _utf8mb4'Cajora podrá cerrar sesiones, restablecer credenciales o suspender preventivamente accesos cuando existan indicios razonables de compromiso, procurando informar al OWNER cuando ello no aumente el riesgo.', CHAR(10),
    _utf8mb4'6. Prueba gratuita de catorce días', CHAR(10),
    _utf8mb4'Cajora otorgará una prueba gratuita de catorce (14) días corridos contados desde la creación del BUSINESS. Durante ese período estarán disponibles las funcionalidades del MVP habilitadas para la prueba.', CHAR(10),
    _utf8mb4'La prueba gratuita no se convertirá automáticamente en una suscripción paga. Cajora no generará cargos, débitos ni deuda por el solo vencimiento del período. Para continuar con un Plan pago, el OWNER deberá comunicarse con Cajora y aceptar expresamente el Plan, precio, periodicidad, impuestos, forma de renovación y demás condiciones particulares.', CHAR(10),
    _utf8mb4'Finalizada la prueba sin contratación, se bloqueará la creación o modificación de nuevas operaciones y el BUSINESS pasará a modo de solo lectura y exportación durante treinta (30) días. Transcurrido ese plazo, los datos activos del BUSINESS serán eliminados, salvo información que deba conservarse por obligación legal, seguridad, controversias o en copias de respaldo sujetas a su ciclo técnico de depuración.', CHAR(10),
    _utf8mb4'7. Planes y contratación de suscripciones', CHAR(10),
    _utf8mb4'Cajora podrá ofrecer Planes pagos cuyas funcionalidades, límites, precios, moneda, impuestos y periodicidad serán informados antes de cada contratación. Las condiciones particulares aceptadas por el OWNER complementan estos Términos y prevalecen respecto del Plan concreto cuando exista una diferencia específica.', CHAR(10),
    _utf8mb4'La contratación se inicia mediante comunicación con Cajora y deberá quedar confirmada por escrito o por un mecanismo electrónico que registre la conformidad del OWNER. El silencio, la falta de respuesta o el uso previo de la prueba no constituyen autorización de cobro.', CHAR(10),
    _utf8mb4'Cajora no recibirá pagos hasta encontrarse fiscalmente en condiciones de facturar la prestación.', CHAR(10),
    _utf8mb4'8. Precios, moneda, impuestos y facturación', CHAR(10),
    _utf8mb4'Los precios y su vigencia se informarán claramente antes de cada contratación. Los Planes iniciales serán ofrecidos en pesos argentinos (ARS). Cada oferta indicará si los impuestos están incluidos o deben adicionarse.', CHAR(10),
    _utf8mb4'Los pagos del Servicio se realizarán inicialmente mediante transferencia a la cuenta, CBU, CVU o medio equivalente informado por Cajora al momento de la contratación o renovación. Cajora no realizará débitos ni cargos automáticos en esta etapa.', CHAR(10),
    _utf8mb4'El Proveedor emitirá los comprobantes fiscales que correspondan a su situación tributaria y al tipo de operación una vez regularizada su situación fiscal.', CHAR(10),
    _utf8mb4'Los tickets, recibos, cierres de caja u otros documentos generados por los Negocios dentro de Cajora son documentos administrativos internos, salvo que una futura funcionalidad se identifique expresamente como integración fiscal habilitada.', CHAR(10),
    _utf8mb4'Los cambios de precio no tendrán efecto retroactivo sobre períodos ya abonados. Cajora comunicará cambios de precio con al menos treinta (30) días de anticipación respecto de su aplicación a una futura renovación.', CHAR(10),
    _utf8mb4'9. Renovación, cambio de Plan y cancelación', CHAR(10),
    _utf8mb4'La renovación de los Planes pagos será manual en esta etapa. Para renovar, el OWNER deberá comunicarse con Cajora y aceptar las condiciones vigentes del nuevo período. No habrá renovación automática ni débito automático.', CHAR(10),
    _utf8mb4'La cancelación impedirá nuevas renovaciones y producirá efectos al final del período ya abonado. Hasta esa fecha el Negocio conservará el acceso correspondiente a su Plan, salvo suspensión por incumplimiento o riesgo de seguridad.', CHAR(10),
    _utf8mb4'Finalizado el período abonado, el BUSINESS pasará a modo de solo lectura y exportación durante treinta (30) días. Luego se eliminarán los datos activos conforme a la sección 24.', CHAR(10),
    _utf8mb4'10. Falta de pago y suspensión', CHAR(10),
    _utf8mb4'Ante falta de pago de un Plan, Cajora podrá notificar al OWNER y otorgará una tolerancia de cinco (5) días corridos desde el vencimiento informado. Vencido ese plazo sin regularización, se suspenderá la creación o modificación de nuevas operaciones y se mantendrá acceso de solo lectura y exportación durante treinta (30) días.', CHAR(10),
    _utf8mb4'La suspensión no elimina automáticamente los Datos del Negocio. Finalizado el plazo de solo lectura, los datos activos serán eliminados conforme a la sección 24 y a la Política de Privacidad.', CHAR(10),
    _utf8mb4'11. Datos del Negocio', CHAR(10),
    _utf8mb4'El Negocio conserva los derechos y el control que legalmente le correspondan sobre su información comercial. Cajora no adquiere esa información por el solo hecho de alojarla. Las personas titulares conservan sus derechos sobre los datos personales que las identifican.', CHAR(10),
    _utf8mb4'El Negocio autoriza a Cajora a alojar, organizar, reproducir técnicamente, respaldar, transmitir y procesar los Datos del Negocio en la medida necesaria para prestar, proteger, mantener y brindar soporte sobre el Servicio.', CHAR(10),
    _utf8mb4'El Negocio declara contar con una base legítima para cargar y utilizar datos de clientes, proveedores, empleados u otras personas y debe proporcionarles la información que corresponda.', CHAR(10),
    _utf8mb4'Cajora no está diseñado ni autorizado para almacenar datos sensibles. El Negocio no deberá utilizar campos libres, observaciones u otras funciones para registrar datos relativos a salud, origen racial o étnico, opiniones políticas, convicciones religiosas, afiliación sindical, vida sexual u otros datos especialmente protegidos que no sean necesarios para la gestión comercial.', CHAR(10),
    _utf8mb4'12. Privacidad y protección de datos personales', CHAR(10),
    _utf8mb4'El tratamiento de datos personales realizado por Cajora se describe en la Política de Privacidad vigente, que deberá publicarse junto con estos Términos en el sitio oficial del Servicio.', CHAR(10),
    _utf8mb4'El OWNER debe informar a sus usuarios autorizados sobre el uso de Cajora. Los derechos de acceso, rectificación, actualización y supresión podrán ejercerse escribiendo a cajora62@gmail.com.', CHAR(10),
    _utf8mb4'13. Exactitud de la información y resultados', CHAR(10),
    _utf8mb4'Los cálculos, existencias, saldos, reportes y métricas dependen de la información ingresada, importada, omitida, anulada o configurada por el Negocio. Una venta omitida, un stock inicial incorrecto o una configuración errónea puede producir resultados inexactos.', CHAR(10),
    _utf8mb4'Cajora procurará ejecutar razonablemente las operaciones conforme a su diseño y corregir fallas atribuibles al software cuando sean reportadas y reproducibles. El Negocio debe verificar la información crítica antes de tomar decisiones comerciales, contables, fiscales o financieras.', CHAR(10),
    _utf8mb4'14. Ventas, compras, stock y caja', CHAR(10),
    _utf8mb4'El Negocio es responsable de registrar correctamente ventas, compras, cobros, pagos, movimientos de stock, aperturas y cierres de caja. Las anulaciones, ajustes, importaciones o transferencias deben ser realizadas por usuarios autorizados y revisadas según sus controles internos.', CHAR(10),
    _utf8mb4'Cajora no custodia dinero del Negocio ni procesa pagos de sus clientes finales. Los métodos o cuentas de pago configurados en Cajora son registros administrativos del Negocio. Si en el futuro se incorpora una pasarela de pagos, se informarán previamente las condiciones y proveedores aplicables.', CHAR(10),
    _utf8mb4'15. Comprobantes internos y obligaciones fiscales', CHAR(10),
    _utf8mb4'Mientras Cajora no implemente una integración fiscal expresamente habilitada, los documentos emitidos por el sistema no constituyen Facturas A, B o C ni comprobantes fiscales oficiales. El Negocio es responsable de cumplir sus obligaciones contables, impositivas y de facturación mediante los mecanismos autorizados.', CHAR(10),
    _utf8mb4'16. Importación y exportación de información', CHAR(10),
    _utf8mb4'La importación mediante planillas depende del formato, validaciones y límites informados. El Negocio debe revisar los datos antes de confirmar una importación y conservar una copia del archivo fuente cuando resulte relevante.', CHAR(10),
    _utf8mb4'En el MVP, Cajora permite exportar información de productos, clientes, ventas y stock mediante formatos Excel y PDF, según la funcionalidad disponible en cada módulo. Cajora no garantiza formatos o módulos de exportación que no se encuentren implementados.', CHAR(10),
    _utf8mb4'17. Uso permitido', CHAR(10),
    _utf8mb4'El Servicio debe utilizarse para actividades lícitas de gestión del Negocio, respetando estos Términos, la documentación funcional y los límites del Plan.', CHAR(10),
    _utf8mb4'18. Usos prohibidos', CHAR(10),
    _utf8mb4'Acceder o intentar acceder a cuentas, datos, endpoints o recursos de otro BUSINESS sin autorización.', CHAR(10),
    _utf8mb4'Realizar ingeniería inversa, descompilar o intentar descubrir el código fuente, salvo derechos expresamente reconocidos por normas inderogables.', CHAR(10),
    _utf8mb4'Eludir autenticación, autorización, límites, roles, permisos, rate limits o medidas de seguridad.', CHAR(10),
    _utf8mb4'Ejecutar pruebas de penetración, scraping masivo, automatización abusiva o cargas que afecten el Servicio sin autorización escrita.', CHAR(10),
    _utf8mb4'Introducir malware, código malicioso, datos ilícitos o contenido que vulnere derechos de terceros.', CHAR(10),
    _utf8mb4'Revender, sublicenciar, alquilar o compartir el acceso fuera del Negocio sin autorización.', CHAR(10),
    _utf8mb4'Utilizar Cajora para ocultar operaciones ilícitas, falsificar registros o infringir obligaciones legales.', CHAR(10),
    _utf8mb4'Almacenar datos sensibles o información personal innecesaria en campos libres u observaciones.', CHAR(10),
    _utf8mb4'19. Disponibilidad, mantenimiento y cambios técnicos', CHAR(10),
    _utf8mb4'Cajora procurará mantener el Servicio disponible mediante esfuerzos técnicos razonables, pero no garantiza disponibilidad ininterrumpida ni un porcentaje específico de uptime mientras no exista un SLA expresamente contratado. Pueden producirse interrupciones por mantenimiento, actualizaciones, fallas, incidentes de seguridad, proveedores, conectividad o fuerza mayor.', CHAR(10),
    _utf8mb4'Los mantenimientos programados se comunicarán cuando sea razonablemente posible. Las acciones urgentes de seguridad podrán realizarse sin aviso previo.', CHAR(10),
    _utf8mb4'20. Seguridad', CHAR(10),
    _utf8mb4'Cajora aplicará medidas técnicas y organizativas razonables para proteger la confidencialidad, integridad y disponibilidad de la información, incluyendo autenticación, autorización, aislamiento multi-tenant, controles de acceso y registro técnico de sesiones y errores cuando corresponda.', CHAR(10),
    _utf8mb4'Ningún sistema conectado a internet puede considerarse absolutamente invulnerable. Los incidentes serán investigados y comunicados cuando corresponda conforme a la normativa aplicable y a los riesgos identificados.', CHAR(10),
    _utf8mb4'21. Backups y recuperación', CHAR(10),
    _utf8mb4'Cajora realizará una copia de seguridad semanal y conservará las últimas cuatro (4) copias semanales conforme a su política técnica vigente. El procedimiento de restauración fue probado antes del lanzamiento del MVP.', CHAR(10),
    _utf8mb4'Las copias de seguridad constituyen una medida de continuidad y no sustituyen las copias o exportaciones que el Negocio deba conservar por razones operativas, contables o legales. Cajora no garantiza un tiempo de recuperación, RPO, RTO o SLA específico salvo acuerdo escrito posterior.', CHAR(10),
    _utf8mb4'Cuando un BUSINESS sea eliminado de la base activa, sus datos podrán permanecer transitoriamente en copias de respaldo hasta que dichas copias roten y sean depuradas conforme al ciclo de cuatro copias semanales.', CHAR(10),
    _utf8mb4'22. Soporte', CHAR(10),
    _utf8mb4'El soporte se brindará principalmente por correo electrónico a cajora62@gmail.com, de lunes a sábados de 08:00 a 13:00 y de 16:00 a 20:00. Los feriados no se computan a los efectos del objetivo de respuesta indicado a continuación.', CHAR(10),
    _utf8mb4'Cajora procurará brindar una primera respuesta dentro de un (1) día hábil. Este plazo es un objetivo de atención y no una garantía de resolución. El usuario debe proporcionar información suficiente para reproducir el problema sin compartir contraseñas ni datos innecesarios.', CHAR(10),
    _utf8mb4'23. Servicios y proveedores de terceros', CHAR(10),
    _utf8mb4'En el MVP, el frontend y backend de Cajora se encuentran alojados en Render y la base de datos MySQL en Hostinger. Cajora podrá cambiar proveedores o infraestructura cuando resulte necesario para mejorar, mantener o proteger el Servicio.', CHAR(10),
    _utf8mb4'Actualmente no se utilizan proveedores adicionales de analítica, monitoreo, pasarela de pagos o almacenamiento independiente declarados para el MVP. Si se incorporan servicios que impliquen nuevos tratamientos de datos, la Política de Privacidad será actualizada cuando corresponda.', CHAR(10),
    _utf8mb4'24. Cancelación, exportación, conservación y eliminación', CHAR(10),
    _utf8mb4'El OWNER podrá solicitar la cancelación escribiendo a cajora62@gmail.com. En un Plan pago, la cancelación tendrá efecto al finalizar el período ya abonado, salvo que legalmente corresponda otra solución.', CHAR(10),
    _utf8mb4'Tras finalizar la prueba gratuita sin contratación, vencer un Plan luego de la tolerancia aplicable o finalizar un período pago cancelado, Cajora mantendrá el BUSINESS durante treinta (30) días en modo de solo lectura y exportación.', CHAR(10),
    _utf8mb4'Durante dicho período podrán consultarse los datos y utilizarse las exportaciones disponibles de productos, clientes, ventas y stock en Excel o PDF, según el módulo.', CHAR(10),
    _utf8mb4'Finalizados los treinta (30) días, Cajora eliminará los datos activos del BUSINESS. Podrán conservarse por más tiempo únicamente aquellos datos cuya conservación resulte necesaria por obligación legal, evidencia contractual, seguridad, investigación de incidentes o controversias. Las copias de respaldo se depurarán mediante su ciclo técnico de cuatro copias semanales.', CHAR(10),
    _utf8mb4'25. Suspensión o terminación por incumplimiento', CHAR(10),
    _utf8mb4'Cajora podrá suspender o terminar una cuenta ante incumplimiento grave, uso ilícito, riesgo para terceros, ataque, fraude, acceso entre tenants o falta de pago, procurando notificar y permitir subsanar cuando la naturaleza del hecho lo permita. Las medidas preventivas serán proporcionales al riesgo.', CHAR(10),
    _utf8mb4'El Negocio podrá terminar la relación conforme al mecanismo de cancelación vigente, sin perjuicio de obligaciones pendientes y derechos inderogables.', CHAR(10),
    _utf8mb4'26. Propiedad intelectual', CHAR(10),
    _utf8mb4'Cajora, su código, arquitectura, interfaces, diseños, documentación y desarrollos pertenecen al Proveedor o se utilizan bajo licencias válidas. “Cajora” se utiliza como denominación comercial del Servicio. La referencia a esa denominación no implica una declaración sobre su situación registral marcaria.', CHAR(10),
    _utf8mb4'El Negocio recibe durante la vigencia de su cuenta un derecho limitado, no exclusivo, no sublicenciable e intransferible para acceder al Servicio conforme a estos Términos. Cajora puede incorporar software de terceros u open source sujeto a sus propias licencias.', CHAR(10),
    _utf8mb4'27. Responsabilidad', CHAR(10),
    _utf8mb4'Cada parte responde por sus propios actos y obligaciones. Cajora no responde por información incorrecta ingresada por el Negocio, omisiones operativas, decisiones comerciales adoptadas sin verificación, fallas de conectividad del usuario o servicios de terceros fuera de su control razonable.', CHAR(10),
    _utf8mb4'Cajora no pretende excluir responsabilidad por dolo, culpa grave, incumplimientos legalmente inderogables ni derechos que no puedan ser renunciados. Esta versión no establece un límite económico convencional adicional de responsabilidad. Cualquier limitación futura deberá incorporarse mediante una modificación válida de estos Términos o mediante condiciones particulares aceptadas cuando legalmente corresponda.', CHAR(10),
    _utf8mb4'28. Modificaciones del Servicio', CHAR(10),
    _utf8mb4'Cajora puede mejorar, agregar, modificar o discontinuar funcionalidades. Los cambios sustanciales que reduzcan materialmente una prestación contratada se comunicarán con antelación razonable cuando sea posible y respetarán los períodos ya abonados o las alternativas informadas.', CHAR(10),
    _utf8mb4'29. Modificaciones y versiones de los Términos', CHAR(10),
    _utf8mb4'Cada versión publicada tendrá identificación y fecha de vigencia. Las versiones históricas y sus aceptaciones no serán sustituidas. Los cambios sustanciales se notificarán y, cuando corresponda, requerirán una nueva aceptación explícita antes de continuar utilizando el Servicio.', CHAR(10),
    _utf8mb4'Los cambios meramente administrativos o aclaratorios podrán comunicarse sin reaceptación cuando no alteren derechos u obligaciones materiales. Si el OWNER no acepta una modificación sustancial, podrá cancelar y exportar sus datos conforme a las condiciones aplicables.', CHAR(10),
    _utf8mb4'30. Comunicaciones', CHAR(10),
    _utf8mb4'Cajora podrá enviar comunicaciones operativas, de seguridad, legales y de suscripción al correo del OWNER o mediante avisos dentro de la plataforma. El OWNER debe mantener sus datos de contacto actualizados. Las comunicaciones promocionales se regirán por la Política de Privacidad y permitirán ejercer las opciones aplicables.', CHAR(10),
    _utf8mb4'31. Legislación aplicable y jurisdicción', CHAR(10),
    _utf8mb4'Estos Términos se regirán por las leyes de la República Argentina. Cualquier controversia derivada de estos Términos o del uso del Servicio será sometida a los tribunales que resulten competentes conforme a la normativa aplicable.', CHAR(10),
    _utf8mb4'Nada de lo anterior limita la competencia territorial, los derechos del consumidor u otros fueros inderogables que resulten aplicables al caso concreto.', CHAR(10),
    _utf8mb4'32. Disposiciones generales', CHAR(10),
    _utf8mb4'Si una cláusula fuese declarada inválida o inaplicable, las restantes conservarán su vigencia en la medida permitida. La falta de ejercicio inmediato de un derecho no implica renuncia. Estos Términos, la Política de Privacidad y las condiciones particulares aceptadas integran el acuerdo aplicable.', CHAR(10),
    _utf8mb4'33. Contacto', CHAR(10),
    _utf8mb4'Proveedor: Apas Adrian Abraham.', CHAR(10),
    _utf8mb4'Contacto legal, privacidad, seguridad y soporte: cajora62@gmail.com.', CHAR(10),
    _utf8mb4'Sitio del MVP: https://cajora.onrender.com.'
  );

  SET v_privacy_content =
  CONCAT(
    _utf8mb4'CAJORA', CHAR(10),
    _utf8mb4'Política de Privacidad de Cajora', CHAR(10),
    _utf8mb4'Tratamiento de datos personales en la plataforma SaaS', CHAR(10),
    _utf8mb4'', CHAR(10),
    _utf8mb4'Estado | VERSIÓN PARA PUBLICACIÓN - MVP', CHAR(10),
    _utf8mb4'Versión | 1.0', CHAR(10),
    _utf8mb4'Fecha | 31 de agosto de 2026', CHAR(10),
    _utf8mb4'Ámbito previsto | República Argentina - prueba gratuita y futuros planes pagos', CHAR(10),
    _utf8mb4'', CHAR(10),
    _utf8mb4'', CHAR(10),
    _utf8mb4'', CHAR(10),
    _utf8mb4'1. Alcance y responsable', CHAR(10),
    _utf8mb4'Esta Política de Privacidad explica cómo Cajora recopila, utiliza, almacena, comunica y elimina datos personales relacionados con su sitio, registro, cuentas BUSINESS, soporte, seguridad, prueba gratuita y futuras suscripciones.', CHAR(10),
    _utf8mb4'El responsable de los tratamientos que Cajora realiza para administrar la plataforma es Apas Adrian Abraham, persona humana, con correo de privacidad cajora62@gmail.com, en adelante “Cajora” o el “Responsable”.', CHAR(10),
    _utf8mb4'Esta Política es independiente de los Términos y Condiciones y deberá estar disponible públicamente antes o al momento de recopilar datos personales.', CHAR(10),
    _utf8mb4'2. Roles respecto de los datos', CHAR(10),
    _utf8mb4'Cajora trata datos para finalidades propias cuando administra registros, autenticación, seguridad, soporte, documentos legales, suscripciones, facturación y comunicaciones del Servicio.', CHAR(10),
    _utf8mb4'Cuando un Negocio carga datos de sus clientes, proveedores, empleados u otras personas para gestionar sus operaciones, el Negocio determina normalmente la finalidad del tratamiento y debe contar con legitimidad e informar a las personas involucradas. Cajora procesa esos datos para prestar el Servicio conforme a las instrucciones y configuraciones del Negocio, sin apropiarse de ellos.', CHAR(10),
    _utf8mb4'Respecto de los datos de terceros que cada Negocio decide cargar, el Negocio conserva la responsabilidad sobre la finalidad, legitimidad, calidad de la información y deberes de información que le correspondan. Cajora limita su tratamiento a lo necesario para prestar, mantener, proteger y brindar soporte sobre el Servicio, conforme a estos documentos y a las instrucciones o configuraciones del Negocio.', CHAR(10),
    _utf8mb4'3. Categorías de datos que podemos tratar', CHAR(10),
    _utf8mb4'3.1. Datos de registro y cuenta: nombre y apellido, correo electrónico y otros datos de contacto habilitados, nombre y datos identificatorios del Negocio, rol, permisos, estado, relación con el BUSINESS y constancias de aceptación de documentos legales. Las credenciales se protegen mediante mecanismos de autenticación y Cajora no pretende almacenar contraseñas en texto plano.', CHAR(10),
    _utf8mb4'3.2. Datos cargados por el Negocio: respecto de clientes y proveedores, Cajora permite campos como nombre, teléfono, dirección, correo electrónico y observaciones; también pueden tratarse productos, categorías, precios, ventas, compras, stock, depósitos, movimientos, caja, métodos de pago administrativos, archivos de importación, notas, configuraciones y datos de usuarios autorizados.', CHAR(10),
    _utf8mb4'3.3. Datos técnicos y de seguridad: dirección IP, fecha y hora, user agent, identificadores y registros de sesión, así como logs de errores utilizados para autenticación, trazabilidad, prevención de accesos no autorizados, diagnóstico y seguridad.', CHAR(10),
    _utf8mb4'3.4. Soporte y comunicaciones: mensajes, consultas, archivos y antecedentes proporcionados al solicitar asistencia, así como registros de acciones de soporte cuando correspondan.', CHAR(10),
    _utf8mb4'3.5. Suscripciones, pagos y facturación: cuando se activen Planes pagos, Cajora podrá tratar datos de contratación, Plan, precio, moneda, periodicidad, estado de pago, comprobantes y condición fiscal. En esta etapa los pagos se realizarán mediante transferencia y Cajora no almacena datos completos de tarjetas ni utiliza una pasarela de pagos.', CHAR(10),
    _utf8mb4'4. Datos sensibles', CHAR(10),
    _utf8mb4'Cajora no está diseñado ni autorizado para almacenar datos sensibles. Los Negocios no deberán utilizar campos de observaciones u otras funciones para registrar datos sobre salud, origen racial o étnico, opiniones políticas, convicciones religiosas, afiliación sindical, vida sexual u otros datos especialmente protegidos que no sean necesarios para la gestión comercial.', CHAR(10),
    _utf8mb4'Si un Negocio incorpora información de este tipo contrariando estas reglas, Cajora podrá solicitar su eliminación o adoptar medidas técnicas razonables para reducir el riesgo, sin asumir que dicho tratamiento forma parte de las finalidades ordinarias del Servicio.', CHAR(10),
    _utf8mb4'5. Finalidades del tratamiento', CHAR(10),
    _utf8mb4'Crear, autenticar y administrar cuentas BUSINESS y usuarios.', CHAR(10),
    _utf8mb4'Prestar las funciones de ventas, compras, inventario, caja, reportes y demás módulos habilitados.', CHAR(10),
    _utf8mb4'Mantener el aislamiento entre tenants, aplicar roles y permisos y prevenir accesos no autorizados.', CHAR(10),
    _utf8mb4'Registrar aceptaciones legales y administrar versiones de documentos.', CHAR(10),
    _utf8mb4'Brindar soporte, investigar errores y recuperar operaciones cuando sea posible.', CHAR(10),
    _utf8mb4'Proteger el Servicio, detectar fraude, abuso, ataques e incidentes de seguridad.', CHAR(10),
    _utf8mb4'Realizar backups y tareas de continuidad conforme a la política técnica vigente.', CHAR(10),
    _utf8mb4'Gestionar pruebas, Planes, suscripciones, cobros mediante transferencia y facturación cuando se habiliten.', CHAR(10),
    _utf8mb4'Cumplir obligaciones legales, regulatorias, fiscales y requerimientos válidos de autoridad.', CHAR(10),
    _utf8mb4'Enviar comunicaciones operativas, legales, de seguridad y soporte.', CHAR(10),
    _utf8mb4'Generar métricas agregadas o anonimizadas para mejorar el Servicio, sin identificar personas ni revelar información comercial de un Negocio.', CHAR(10),
    _utf8mb4'6. Fundamentos y consentimiento', CHAR(10),
    _utf8mb4'Cajora tratará datos cuando resulte necesario para gestionar la relación contractual, cumplir obligaciones legales, proteger la seguridad del Servicio, atender intereses legítimos compatibles o cuando exista consentimiento válido, según corresponda al tratamiento concreto.', CHAR(10),
    _utf8mb4'La presentación de esta Política no convierte todo tratamiento en consentimiento. Cuando una finalidad requiera consentimiento específico, Cajora lo solicitará de forma separada, informada y demostrable y permitirá revocarlo cuando corresponda.', CHAR(10),
    _utf8mb4'7. Origen de los datos', CHAR(10),
    _utf8mb4'Los datos pueden provenir directamente del OWNER o usuarios autorizados, de la actividad generada en la plataforma, de archivos importados, de comunicaciones de soporte, de proveedores técnicos o de terceros cuyos datos sean cargados por el Negocio bajo su responsabilidad.', CHAR(10),
    _utf8mb4'8. Carácter obligatorio o facultativo', CHAR(10),
    _utf8mb4'Los campos necesarios para crear, autenticar y proteger una cuenta son obligatorios. Si no se proporcionan, Cajora puede no estar en condiciones de habilitar el Servicio. Los campos adicionales serán facultativos salvo indicación clara en contrario. Cajora procurará no recolectar datos excesivos respecto de las finalidades informadas.', CHAR(10),
    _utf8mb4'9. Destinatarios y proveedores', CHAR(10),
    _utf8mb4'Cajora no vende datos personales ni Datos del Negocio. Puede permitir acceso limitado a proveedores que actúan para prestar infraestructura, almacenamiento, soporte, seguridad, pagos o facturación, sujetos a obligaciones de confidencialidad y tratamiento adecuado.', CHAR(10),
    _utf8mb4'En el MVP, el frontend y backend se alojan en Render y la base de datos MySQL se aloja en Hostinger. Actualmente no se utilizan servicios adicionales declarados de analítica, monitoreo, pasarela de pagos o almacenamiento independiente.', CHAR(10),
    _utf8mb4'La infraestructura de Render y Hostinger puede utilizar centros de datos, subprocesadores o recursos ubicados fuera de Argentina según la configuración y prestación de cada proveedor. Cajora podrá cambiar proveedores o configuraciones y actualizará esta Política cuando el cambio implique un tratamiento materialmente distinto.', CHAR(10),
    _utf8mb4'También podrán comunicarse datos cuando exista obligación legal, orden válida de autoridad, necesidad de proteger derechos o una emergencia legítima, limitando la información a lo necesario.', CHAR(10),
    _utf8mb4'10. Transferencias internacionales', CHAR(10),
    _utf8mb4'El uso de Render, Hostinger u otros servicios de infraestructura puede implicar tratamiento, almacenamiento o acceso a datos desde otros países. Cuando corresponda una transferencia internacional de datos personales, Cajora aplicará las medidas y garantías exigidas por la normativa argentina vigente.', CHAR(10),
    _utf8mb4'La localización concreta y los subprocesadores pueden variar según los servicios contratados. Cajora evitará informar como definitivos países o mecanismos que no hayan sido confirmados y mantendrá esta Política actualizada ante cambios materiales.', CHAR(10),
    _utf8mb4'11. Seguridad y confidencialidad', CHAR(10),
    _utf8mb4'Cajora implementará medidas técnicas y organizativas razonables según el riesgo, incluyendo autenticación y autorización, aislamiento multi-tenant, controles de acceso, protección de endpoints, manejo de errores y registro técnico de sesiones.', CHAR(10),
    _utf8mb4'Para fines de seguridad, Cajora registra dirección IP, user agent y datos de sesión, además de logs de errores. Estos registros no se utilizan con fines publicitarios.', CHAR(10),
    _utf8mb4'El personal o colaboradores que accedan a información por soporte deberán hacerlo únicamente cuando sea necesario, con autorización y deber de confidencialidad. No se solicitarán contraseñas por canales de soporte.', CHAR(10),
    _utf8mb4'Ninguna transmisión o almacenamiento conectado a internet es absolutamente seguro. Cajora gestionará los riesgos y responderá a incidentes conforme a la normativa aplicable y sus procedimientos internos.', CHAR(10),
    _utf8mb4'12. Conservación y eliminación', CHAR(10),
    _utf8mb4'Los datos se conservarán durante el tiempo necesario para las finalidades informadas, la vigencia de la cuenta, los períodos de gracia y las obligaciones legales.', CHAR(10),
    _utf8mb4'Datos del BUSINESS activo: se conservan mientras la cuenta se encuentre activa o durante el período pago vigente.', CHAR(10),
    _utf8mb4'Fin de prueba, falta de pago o cancelación: el BUSINESS permanecerá durante treinta (30) días en modo de solo lectura y exportación. Transcurrido ese plazo, los datos activos serán eliminados, salvo conservación exigida por ley, necesaria para una controversia, evidencia contractual o seguridad.', CHAR(10),
    _utf8mb4'Logs técnicos, IP, user agent y registros históricos de sesión: se conservarán por noventa (90) días desde el cierre, vencimiento o revocación correspondiente, salvo que resulte necesario conservarlos por más tiempo para investigar fraude, abuso, incidentes de seguridad o cumplir una obligación legal.', CHAR(10),
    _utf8mb4'Backups: Cajora realizará una copia semanal y conservará las últimas cuatro (4) copias. Los datos eliminados de la base activa podrán permanecer temporalmente en dichas copias hasta que roten y sean depuradas por ese ciclo técnico.', CHAR(10),
    _utf8mb4'Aceptaciones legales y facturación: podrán conservarse durante el tiempo necesario como evidencia contractual y para cumplir obligaciones legales o fiscales. El plazo concreto deberá armonizarse con las obligaciones legales aplicables.', CHAR(10),
    _utf8mb4'Las solicitudes de supresión no producirán eliminación inmediata cuando exista una obligación legal de conservar, una controversia vigente o una necesidad legítima de seguridad; en esos casos los datos se limitarán o bloquearán cuando corresponda.', CHAR(10),
    _utf8mb4'13. Cookies y tecnologías similares', CHAR(10),
    _utf8mb4'Cajora podrá utilizar cookies o tecnologías estrictamente necesarias para autenticación, seguridad, preferencias y funcionamiento. Actualmente no se han declarado herramientas adicionales de analítica o publicidad para el MVP.', CHAR(10),
    _utf8mb4'Si en el futuro se incorporan cookies analíticas, publicitarias, SDK o tecnologías de terceros, se actualizará esta Política y se implementarán los avisos o mecanismos de consentimiento que correspondan.', CHAR(10),
    _utf8mb4'14. Derechos de las personas titulares', CHAR(10),
    _utf8mb4'Las personas titulares pueden solicitar información y ejercer los derechos de acceso, rectificación, actualización y supresión conforme a la normativa aplicable, acreditando razonablemente su identidad. Las solicitudes se recibirán en cajora62@gmail.com.', CHAR(10),
    _utf8mb4'Acceso: conocer si Cajora trata datos personales, su origen, finalidad y destinatarios.', CHAR(10),
    _utf8mb4'Rectificación o actualización: corregir información inexacta o desactualizada.', CHAR(10),
    _utf8mb4'Supresión: solicitar la eliminación cuando corresponda y no exista obligación o fundamento para conservar.', CHAR(10),
    _utf8mb4'Retiro del consentimiento: revocarlo respecto de tratamientos basados exclusivamente en consentimiento, sin afectar lo realizado válidamente con anterioridad.', CHAR(10),
    _utf8mb4'Cuando la solicitud se refiera a datos cargados por un Negocio, Cajora podrá coordinar la respuesta con ese Negocio, sin obstaculizar los derechos de la persona titular.', CHAR(10),
    _utf8mb4'15. Autoridad de control', CHAR(10),
    _utf8mb4'La Agencia de Acceso a la Información Pública (AAIP) es la autoridad de aplicación de la Ley 25.326 y recibe consultas, reclamos y denuncias por incumplimientos en materia de protección de datos personales. Sitio oficial: https://www.argentina.gob.ar/aaip/datospersonales.', CHAR(10),
    _utf8mb4'16. Usuarios autorizados y datos de terceros', CHAR(10),
    _utf8mb4'El OWNER debe informar a sus usuarios autorizados que Cajora tratará sus datos para autenticación, seguridad y operación. El Negocio es responsable de no cargar información de clientes, proveedores o empleados que resulte innecesaria, ilícita o incompatible con la finalidad de gestión.', CHAR(10),
    _utf8mb4'En particular, los campos de observaciones deben utilizarse únicamente para información comercial u operativa pertinente y no para datos sensibles.', CHAR(10),
    _utf8mb4'17. Personas menores de edad', CHAR(10),
    _utf8mb4'Cajora no está dirigido a personas menores de dieciocho (18) años como OWNER ni pretende recopilar deliberadamente sus datos para crear cuentas. Si se detecta una cuenta irregular, podrán adoptarse medidas de verificación, restricción o eliminación conforme al caso.', CHAR(10),
    _utf8mb4'18. Incidentes de seguridad', CHAR(10),
    _utf8mb4'Cajora documentará y evaluará incidentes que puedan afectar datos personales. Cuando corresponda legalmente o resulte necesario para mitigar riesgos, informará a las personas o Negocios afectados y adoptará medidas de contención, investigación y recuperación.', CHAR(10),
    _utf8mb4'Los usuarios deben reportar incidentes a cajora62@gmail.com sin divulgar públicamente información que aumente el riesgo.', CHAR(10),
    _utf8mb4'19. Cambios en esta Política', CHAR(10),
    _utf8mb4'Cada versión tendrá fecha de publicación y vigencia. Las modificaciones materiales se comunicarán de manera destacada. Cuando una nueva finalidad requiera consentimiento, este se solicitará antes de comenzar el tratamiento correspondiente.', CHAR(10),
    _utf8mb4'Las versiones históricas y las constancias asociadas podrán conservarse como evidencia contractual y de cumplimiento.', CHAR(10),
    _utf8mb4'20. Contacto', CHAR(10),
    _utf8mb4'Responsable: Apas Adrian Abraham.', CHAR(10),
    _utf8mb4'Privacidad, derechos, seguridad y soporte: cajora62@gmail.com.', CHAR(10),
    _utf8mb4'Sitio del MVP: https://cajora.onrender.com.'
  );

  SET v_published_at = NOW();

  IF LOWER(SHA2(v_terms_content, 256)) <> v_terms_hash THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CAJORA_TERMS_1_0_HASH_MISMATCH';
  END IF;

  IF LOWER(SHA2(v_privacy_content, 256)) <> v_privacy_hash THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CAJORA_PRIVACY_1_0_HASH_MISMATCH';
  END IF;

  START TRANSACTION;

  INSERT INTO legal_documents (
    code,
    name,
    description,
    required_action,
    is_active
  )
  VALUES
    (
      'TERMS',
      'Términos y condiciones',
      'Documento legal que debe ser aceptado por el propietario del negocio para operar la plataforma.',
      'ACCEPT',
      1
    ),
    (
      'PRIVACY',
      'Política de privacidad',
      'Documento informativo de privacidad que debe ser reconocido por el propietario del negocio.',
      'ACKNOWLEDGE',
      1
    )
  ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    required_action = VALUES(required_action),
    is_active = VALUES(is_active);

  SELECT idLegalDocument
  INTO v_terms_id
  FROM legal_documents
  WHERE code COLLATE utf8mb4_unicode_ci = 'TERMS' COLLATE utf8mb4_unicode_ci
    AND required_action = 'ACCEPT'
    AND is_active = 1
  LIMIT 1;

  SELECT idLegalDocument
  INTO v_privacy_id
  FROM legal_documents
  WHERE code COLLATE utf8mb4_unicode_ci = 'PRIVACY' COLLATE utf8mb4_unicode_ci
    AND required_action = 'ACKNOWLEDGE'
    AND is_active = 1
  LIMIT 1;

  IF v_terms_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'LEGAL_TERMS_DOCUMENT_NOT_FOUND_OR_INVALID_ACTION';
  END IF;

  IF v_privacy_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'LEGAL_PRIVACY_DOCUMENT_NOT_FOUND_OR_INVALID_ACTION';
  END IF;

  SELECT COUNT(*), MAX(content_hash)
  INTO v_terms_existing_count, v_terms_existing_hash
  FROM legal_document_versions
  WHERE idLegalDocument = v_terms_id
    AND version COLLATE utf8mb4_unicode_ci = '1.0' COLLATE utf8mb4_unicode_ci;

  SELECT COUNT(*), MAX(content_hash)
  INTO v_privacy_existing_count, v_privacy_existing_hash
  FROM legal_document_versions
  WHERE idLegalDocument = v_privacy_id
    AND version COLLATE utf8mb4_unicode_ci = '1.0' COLLATE utf8mb4_unicode_ci;

  IF v_terms_existing_count > 0 AND v_terms_existing_hash <> v_terms_hash THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CAJORA_TERMS_1_0_ALREADY_EXISTS_WITH_DIFFERENT_HASH';
  END IF;

  IF v_privacy_existing_count > 0 AND v_privacy_existing_hash <> v_privacy_hash THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CAJORA_PRIVACY_1_0_ALREADY_EXISTS_WITH_DIFFERENT_HASH';
  END IF;

  INSERT INTO legal_document_versions (
    idLegalDocument,
    version,
    title,
    content,
    content_hash,
    status,
    requires_user_action,
    published_at,
    effective_at,
    created_by_platform_user_id
  )
  SELECT
    v_terms_id,
    '1.0',
    'Términos y Condiciones de Cajora',
    v_terms_content,
    v_terms_hash,
    'PUBLISHED',
    0,
    v_published_at,
    v_published_at,
    NULL
  WHERE NOT EXISTS (
    SELECT 1
    FROM legal_document_versions
    WHERE idLegalDocument = v_terms_id
      AND version COLLATE utf8mb4_unicode_ci = '1.0' COLLATE utf8mb4_unicode_ci
  );

  INSERT INTO legal_document_versions (
    idLegalDocument,
    version,
    title,
    content,
    content_hash,
    status,
    requires_user_action,
    published_at,
    effective_at,
    created_by_platform_user_id
  )
  SELECT
    v_privacy_id,
    '1.0',
    'Política de Privacidad de Cajora',
    v_privacy_content,
    v_privacy_hash,
    'PUBLISHED',
    0,
    v_published_at,
    v_published_at,
    NULL
  WHERE NOT EXISTS (
    SELECT 1
    FROM legal_document_versions
    WHERE idLegalDocument = v_privacy_id
      AND version COLLATE utf8mb4_unicode_ci = '1.0' COLLATE utf8mb4_unicode_ci
  );

  COMMIT;

  SELECT
    'TERMS' AS code,
    '1.0' AS version,
    v_terms_hash AS contentHash,
    v_published_at AS publishedAt,
    v_published_at AS effectiveAt
  UNION ALL
  SELECT
    'PRIVACY' AS code,
    '1.0' AS version,
    v_privacy_hash AS contentHash,
    v_published_at AS publishedAt,
    v_published_at AS effectiveAt;
END$$

DELIMITER ;
CALL sp_publish_cajora_legal_v1_0();
DROP PROCEDURE IF EXISTS sp_publish_cajora_legal_v1_0;
