DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_current_legal_documents;
DROP PROCEDURE IF EXISTS sp_get_current_legal_document;
DROP PROCEDURE IF EXISTS sp_get_legal_document_version;
DROP PROCEDURE IF EXISTS sp_get_business_user_legal_status;
DROP PROCEDURE IF EXISTS sp_record_legal_acceptance;

DELIMITER $$

CREATE PROCEDURE sp_get_current_legal_documents()
BEGIN
  SELECT
    d.idLegalDocument,
    d.code,
    d.name,
    d.description,
    d.required_action AS requiredAction,
    v.idLegalDocumentVersion,
    v.version,
    v.title,
    v.content_hash AS contentHash,
    v.requires_user_action AS requiresUserAction,
    v.published_at AS publishedAt,
    v.effective_at AS effectiveAt
  FROM legal_documents d
  INNER JOIN legal_document_versions v
    ON v.idLegalDocumentVersion = (
      SELECT v2.idLegalDocumentVersion
      FROM legal_document_versions v2
      WHERE v2.idLegalDocument = d.idLegalDocument
        AND v2.status = 'PUBLISHED'
        AND v2.published_at IS NOT NULL
        AND v2.published_at <= NOW()
        AND v2.effective_at IS NOT NULL
        AND v2.effective_at <= NOW()
      ORDER BY v2.effective_at DESC, v2.idLegalDocumentVersion DESC
      LIMIT 1
    )
  WHERE d.is_active = 1
  ORDER BY d.code;
END$$

CREATE PROCEDURE sp_get_current_legal_document(
  IN p_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT
    d.idLegalDocument,
    d.code,
    d.name,
    d.description,
    d.required_action AS requiredAction,
    v.idLegalDocumentVersion,
    v.version,
    v.title,
    v.content,
    v.content_hash AS contentHash,
    v.requires_user_action AS requiresUserAction,
    v.published_at AS publishedAt,
    v.effective_at AS effectiveAt
  FROM legal_documents d
  INNER JOIN legal_document_versions v
    ON v.idLegalDocumentVersion = (
      SELECT v2.idLegalDocumentVersion
      FROM legal_document_versions v2
      WHERE v2.idLegalDocument = d.idLegalDocument
        AND v2.status = 'PUBLISHED'
        AND v2.published_at IS NOT NULL
        AND v2.published_at <= NOW()
        AND v2.effective_at IS NOT NULL
        AND v2.effective_at <= NOW()
      ORDER BY v2.effective_at DESC, v2.idLegalDocumentVersion DESC
      LIMIT 1
    )
  WHERE d.is_active = 1
    AND d.code COLLATE utf8mb4_unicode_ci = p_code COLLATE utf8mb4_unicode_ci
  LIMIT 1;
END$$

CREATE PROCEDURE sp_get_legal_document_version(
  IN p_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_version VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT
    d.idLegalDocument,
    d.code,
    d.name,
    d.description,
    d.required_action AS requiredAction,
    v.idLegalDocumentVersion,
    v.version,
    v.title,
    v.content,
    v.content_hash AS contentHash,
    v.status,
    v.requires_user_action AS requiresUserAction,
    v.published_at AS publishedAt,
    v.effective_at AS effectiveAt
  FROM legal_documents d
  INNER JOIN legal_document_versions v
    ON v.idLegalDocument = d.idLegalDocument
  WHERE d.code COLLATE utf8mb4_unicode_ci = p_code COLLATE utf8mb4_unicode_ci
    AND v.version COLLATE utf8mb4_unicode_ci = p_version COLLATE utf8mb4_unicode_ci
    AND v.status IN ('PUBLISHED', 'RETIRED')
  LIMIT 1;
END$$

CREATE PROCEDURE sp_get_business_user_legal_status(
  IN p_idBusiness INT,
  IN p_idUser INT
)
BEGIN
  SELECT
    d.idLegalDocument,
    d.code,
    d.name,
    d.required_action AS requiredAction,
    cv.idLegalDocumentVersion,
    cv.version AS currentVersion,
    cv.title,
    cv.content_hash AS contentHash,
    cv.requires_user_action AS requiresUserAction,
    cv.effective_at AS effectiveAt,
    la.idLegalAcceptance,
    la.action_type AS actionType,
    la.acceptance_method AS acceptanceMethod,
    la.accepted_at AS acceptedAt,
    CASE
      WHEN cv.idLegalDocumentVersion IS NULL THEN 1
      WHEN d.required_action <> 'NONE'
        AND la.idLegalAcceptance IS NULL THEN 1
      WHEN cv.requires_user_action = 1
        AND la.idLegalAcceptance IS NULL THEN 1
      ELSE 0
    END AS actionRequired
  FROM legal_documents d
  LEFT JOIN legal_document_versions cv
    ON cv.idLegalDocumentVersion = (
      SELECT v2.idLegalDocumentVersion
      FROM legal_document_versions v2
      WHERE v2.idLegalDocument = d.idLegalDocument
        AND v2.status = 'PUBLISHED'
        AND v2.published_at IS NOT NULL
        AND v2.published_at <= NOW()
        AND v2.effective_at IS NOT NULL
        AND v2.effective_at <= NOW()
      ORDER BY v2.effective_at DESC, v2.idLegalDocumentVersion DESC
      LIMIT 1
    )
  LEFT JOIN legal_acceptances la
    ON la.idLegalDocumentVersion = cv.idLegalDocumentVersion
    AND la.idBusiness = p_idBusiness
    AND la.idUser = p_idUser
  WHERE d.is_active = 1
  ORDER BY d.code;
END$$

CREATE PROCEDURE sp_record_legal_acceptance(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_acceptanceMethod VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_ipAddress VARCHAR(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_userAgent VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_idLegalDocument INT DEFAULT NULL;
  DECLARE v_idLegalDocumentVersion BIGINT DEFAULT NULL;
  DECLARE v_requiredAction VARCHAR(30) DEFAULT NULL;
  DECLARE v_actionType VARCHAR(30) DEFAULT NULL;
  DECLARE v_role VARCHAR(30) DEFAULT NULL;

  SELECT role
  INTO v_role
  FROM business_users
  WHERE idBusiness = p_idBusiness
    AND idUser = p_idUser
    AND is_active = 1
  LIMIT 1;

  IF v_role IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'BUSINESS_USER_NOT_FOUND';
  END IF;

  SELECT d.idLegalDocument, d.required_action
  INTO v_idLegalDocument, v_requiredAction
  FROM legal_documents d
  WHERE d.code COLLATE utf8mb4_unicode_ci = p_code COLLATE utf8mb4_unicode_ci
    AND d.is_active = 1
  LIMIT 1;

  IF v_idLegalDocument IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'LEGAL_DOCUMENT_NOT_AVAILABLE';
  END IF;

  SELECT v.idLegalDocumentVersion
  INTO v_idLegalDocumentVersion
  FROM legal_document_versions v
  WHERE v.idLegalDocument = v_idLegalDocument
    AND v.status = 'PUBLISHED'
    AND v.published_at IS NOT NULL
    AND v.published_at <= NOW()
    AND v.effective_at IS NOT NULL
    AND v.effective_at <= NOW()
  ORDER BY v.effective_at DESC, v.idLegalDocumentVersion DESC
  LIMIT 1;

  IF v_idLegalDocumentVersion IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'LEGAL_DOCUMENT_NOT_AVAILABLE';
  END IF;

  IF p_code COLLATE utf8mb4_unicode_ci = 'TERMS' COLLATE utf8mb4_unicode_ci
    AND v_role <> 'OWNER' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'LEGAL_TERMS_OWNER_REQUIRED';
  END IF;

  IF v_requiredAction = 'ACCEPT' THEN
    SET v_actionType = 'ACCEPTED';
  ELSEIF v_requiredAction = 'ACKNOWLEDGE' THEN
    SET v_actionType = 'ACKNOWLEDGED';
  ELSE
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'LEGAL_ACTION_NOT_REQUIRED';
  END IF;

  INSERT INTO legal_acceptances (
    idLegalDocumentVersion,
    idBusiness,
    idUser,
    action_type,
    acceptance_method,
    ip_address,
    user_agent
  )
  VALUES (
    v_idLegalDocumentVersion,
    p_idBusiness,
    p_idUser,
    v_actionType,
    p_acceptanceMethod,
    NULLIF(p_ipAddress, ''),
    LEFT(NULLIF(p_userAgent, ''), 500)
  )
  ON DUPLICATE KEY UPDATE
    idLegalAcceptance = LAST_INSERT_ID(idLegalAcceptance);

  SELECT
    la.idLegalAcceptance,
    la.idLegalDocumentVersion,
    d.code,
    d.name,
    v.version,
    la.idBusiness,
    la.idUser,
    la.action_type AS actionType,
    la.acceptance_method AS acceptanceMethod,
    la.accepted_at AS acceptedAt,
    la.ip_address AS ipAddress,
    la.user_agent AS userAgent
  FROM legal_acceptances la
  INNER JOIN legal_document_versions v
    ON v.idLegalDocumentVersion = la.idLegalDocumentVersion
  INNER JOIN legal_documents d
    ON d.idLegalDocument = v.idLegalDocument
  WHERE la.idLegalAcceptance = LAST_INSERT_ID()
  LIMIT 1;
END$$

DELIMITER ;
