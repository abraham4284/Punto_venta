USE `punto_venta_dev_clean_2`;

DROP PROCEDURE IF EXISTS sp_platform_audit_create;
DROP PROCEDURE IF EXISTS sp_platform_audit_list;
DROP PROCEDURE IF EXISTS sp_platform_audit_get_by_id;

DELIMITER $$

CREATE PROCEDURE sp_platform_audit_create(
  IN p_idPlatformUser INT,
  IN p_action VARCHAR(100),
  IN p_entityType VARCHAR(80),
  IN p_entityId VARCHAR(100),
  IN p_idBusiness INT,
  IN p_previousData JSON,
  IN p_newData JSON,
  IN p_metadata JSON,
  IN p_ipAddress VARCHAR(64),
  IN p_userAgent VARCHAR(255)
)
BEGIN
  INSERT INTO platform_audit_logs (
    idPlatformUser,
    action,
    entityType,
    entityId,
    idBusiness,
    previousData,
    newData,
    metadata,
    ipAddress,
    userAgent
  ) VALUES (
    p_idPlatformUser,
    p_action,
    p_entityType,
    p_entityId,
    p_idBusiness,
    p_previousData,
    p_newData,
    p_metadata,
    p_ipAddress,
    p_userAgent
  );

  CALL sp_platform_audit_get_by_id(LAST_INSERT_ID());
END$$

CREATE PROCEDURE sp_platform_audit_list(
  IN p_platformUserId INT,
  IN p_action VARCHAR(100),
  IN p_entityType VARCHAR(80),
  IN p_entityId VARCHAR(100),
  IN p_idBusiness INT,
  IN p_dateFrom DATETIME,
  IN p_dateTo DATETIME,
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
    pal.idPlatformAuditLog,
    pal.idPlatformUser,
    u.name AS platformUserName,
    u.username AS platformUsername,
    pu.role AS platformRole,
    pal.action,
    pal.entityType,
    pal.entityId,
    pal.idBusiness,
    b.name AS businessName,
    pal.ipAddress,
    pal.userAgent,
    pal.createdAt
  FROM platform_audit_logs pal
  INNER JOIN platform_users pu ON pu.idPlatformUser = pal.idPlatformUser
  INNER JOIN users u ON u.idUser = pu.idUser
  LEFT JOIN businesses b ON b.idBusiness = pal.idBusiness
  WHERE (p_platformUserId IS NULL OR pal.idPlatformUser = p_platformUserId)
    AND (p_action IS NULL OR p_action = '' OR pal.action = p_action)
    AND (p_entityType IS NULL OR p_entityType = '' OR pal.entityType = p_entityType)
    AND (p_entityId IS NULL OR p_entityId = '' OR pal.entityId = p_entityId)
    AND (p_idBusiness IS NULL OR pal.idBusiness = p_idBusiness)
    AND (p_dateFrom IS NULL OR pal.createdAt >= p_dateFrom)
    AND (p_dateTo IS NULL OR pal.createdAt <= p_dateTo)
  ORDER BY pal.createdAt DESC, pal.idPlatformAuditLog DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM platform_audit_logs pal
  WHERE (p_platformUserId IS NULL OR pal.idPlatformUser = p_platformUserId)
    AND (p_action IS NULL OR p_action = '' OR pal.action = p_action)
    AND (p_entityType IS NULL OR p_entityType = '' OR pal.entityType = p_entityType)
    AND (p_entityId IS NULL OR p_entityId = '' OR pal.entityId = p_entityId)
    AND (p_idBusiness IS NULL OR pal.idBusiness = p_idBusiness)
    AND (p_dateFrom IS NULL OR pal.createdAt >= p_dateFrom)
    AND (p_dateTo IS NULL OR pal.createdAt <= p_dateTo);
END$$

CREATE PROCEDURE sp_platform_audit_get_by_id(IN p_idPlatformAuditLog BIGINT)
BEGIN
  SELECT
    pal.idPlatformAuditLog,
    pal.idPlatformUser,
    u.name AS platformUserName,
    u.username AS platformUsername,
    pu.role AS platformRole,
    pal.action,
    pal.entityType,
    pal.entityId,
    pal.idBusiness,
    b.name AS businessName,
    pal.previousData,
    pal.newData,
    pal.metadata,
    pal.ipAddress,
    pal.userAgent,
    pal.createdAt
  FROM platform_audit_logs pal
  INNER JOIN platform_users pu ON pu.idPlatformUser = pal.idPlatformUser
  INNER JOIN users u ON u.idUser = pu.idUser
  LEFT JOIN businesses b ON b.idBusiness = pal.idBusiness
  WHERE pal.idPlatformAuditLog = p_idPlatformAuditLog
  LIMIT 1;
END$$

DELIMITER ;
