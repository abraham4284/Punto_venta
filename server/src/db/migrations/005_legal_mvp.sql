/*
  Migration 005 - Legal MVP.
  Crea la estructura legal minima para bases existentes.
  No inserta versiones ni contenido contractual de produccion.
*/

CREATE TABLE IF NOT EXISTS `legal_documents` (
  `idLegalDocument` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `required_action` enum('ACCEPT','ACKNOWLEDGE','NONE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NONE',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idLegalDocument`),
  UNIQUE KEY `uq_legal_documents_code` (`code`),
  KEY `idx_legal_documents_active` (`is_active`),
  CONSTRAINT `chk_legal_documents_active_boolean` CHECK (`is_active` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `legal_document_versions` (
  `idLegalDocumentVersion` bigint NOT NULL AUTO_INCREMENT,
  `idLegalDocument` int NOT NULL,
  `version` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_hash` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','PUBLISHED','RETIRED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `requires_user_action` tinyint(1) NOT NULL DEFAULT '0',
  `published_at` datetime DEFAULT NULL,
  `effective_at` datetime DEFAULT NULL,
  `created_by_platform_user_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idLegalDocumentVersion`),
  UNIQUE KEY `uq_legal_document_versions_document_version` (`idLegalDocument`,`version`),
  KEY `idx_legal_document_versions_document_status_effective` (`idLegalDocument`,`status`,`effective_at`,`idLegalDocumentVersion`),
  KEY `idx_legal_document_versions_platform_user` (`created_by_platform_user_id`),
  CONSTRAINT `chk_legal_document_versions_requires_action_boolean` CHECK (`requires_user_action` IN (0, 1)),
  CONSTRAINT `fk_legal_document_versions_document` FOREIGN KEY (`idLegalDocument`) REFERENCES `legal_documents` (`idLegalDocument`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_legal_document_versions_platform_user` FOREIGN KEY (`created_by_platform_user_id`) REFERENCES `platform_users` (`idPlatformUser`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `legal_acceptances` (
  `idLegalAcceptance` bigint NOT NULL AUTO_INCREMENT,
  `idLegalDocumentVersion` bigint NOT NULL,
  `idBusiness` int NOT NULL,
  `idUser` int NOT NULL,
  `action_type` enum('ACCEPTED','ACKNOWLEDGED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `acceptance_method` enum('REGISTRATION','LOGIN_REACCEPTANCE','SETTINGS') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `accepted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idLegalAcceptance`),
  UNIQUE KEY `uq_legal_acceptances_version_business_user` (`idLegalDocumentVersion`,`idBusiness`,`idUser`),
  KEY `idx_legal_acceptances_business_user` (`idBusiness`,`idUser`),
  KEY `idx_legal_acceptances_accepted_at` (`accepted_at`),
  CONSTRAINT `fk_legal_acceptances_version` FOREIGN KEY (`idLegalDocumentVersion`) REFERENCES `legal_document_versions` (`idLegalDocumentVersion`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_legal_acceptances_business_user` FOREIGN KEY (`idBusiness`, `idUser`) REFERENCES `business_users` (`idBusiness`, `idUser`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
