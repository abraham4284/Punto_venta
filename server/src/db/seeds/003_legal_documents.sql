/*
  Seeds mínimos del módulo legal.
  No crea versiones legales ni contenido contractual de producción.
*/

USE `punto_venta_dev_clean_2`;

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
