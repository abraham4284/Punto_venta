DROP PROCEDURE IF EXISTS sp_notifications_create;
DELIMITER $$

CREATE PROCEDURE sp_notifications_create(
  IN p_context VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_idBusiness INT,
  IN p_type VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_severity VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_title VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_actionUrl VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_metadata JSON,
  IN p_deduplicationKey VARCHAR(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_expiresAt DATETIME,
  IN p_createdByUserId INT,
  IN p_createdByPlatformUserId INT,
  IN p_recipientUserIds JSON,
  IN p_recipientPlatformUserIds JSON
)
BEGIN
  DECLARE v_idNotification BIGINT;

  IF p_context COLLATE utf8mb4_unicode_ci NOT IN ('BUSINESS', 'PLATFORM') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_NOTIFICATION_CONTEXT';
  END IF;

  IF p_context COLLATE utf8mb4_unicode_ci = 'BUSINESS' AND p_idBusiness IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'BUSINESS_NOTIFICATION_REQUIRES_BUSINESS';
  END IF;

  IF p_context COLLATE utf8mb4_unicode_ci = 'PLATFORM' AND p_idBusiness IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PLATFORM_NOTIFICATION_CANNOT_HAVE_BUSINESS';
  END IF;

  IF p_severity COLLATE utf8mb4_unicode_ci NOT IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_NOTIFICATION_SEVERITY';
  END IF;

  IF p_deduplicationKey IS NOT NULL AND p_deduplicationKey <> '' THEN
    SELECT idNotification INTO v_idNotification
    FROM notifications
    WHERE context COLLATE utf8mb4_unicode_ci = p_context COLLATE utf8mb4_unicode_ci
      AND ((p_idBusiness IS NULL AND idBusiness IS NULL) OR idBusiness = p_idBusiness)
      AND deduplication_key COLLATE utf8mb4_unicode_ci = p_deduplicationKey COLLATE utf8mb4_unicode_ci
      AND status = 'ACTIVE'
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY idNotification DESC
    LIMIT 1;
  END IF;

  IF v_idNotification IS NULL THEN
    INSERT INTO notifications (
      context,
      idBusiness,
      type,
      severity,
      title,
      message,
      action_url,
      metadata,
      deduplication_key,
      expires_at,
      created_by_user_id,
      created_by_platform_user_id
    )
    VALUES (
      p_context,
      p_idBusiness,
      p_type,
      p_severity,
      p_title,
      p_message,
      NULLIF(p_actionUrl, ''),
      p_metadata,
      NULLIF(p_deduplicationKey, ''),
      p_expiresAt,
      p_createdByUserId,
      p_createdByPlatformUserId
    );

    SET v_idNotification = LAST_INSERT_ID();
  END IF;

  IF p_recipientUserIds IS NOT NULL AND JSON_LENGTH(p_recipientUserIds) > 0 THEN
    INSERT IGNORE INTO notification_recipients (idNotification, idUser)
    SELECT v_idNotification, jt.idUser
    FROM JSON_TABLE(
      p_recipientUserIds,
      '$[*]' COLUMNS (idUser INT PATH '$')
    ) jt
    WHERE jt.idUser IS NOT NULL;
  END IF;

  IF p_recipientPlatformUserIds IS NOT NULL AND JSON_LENGTH(p_recipientPlatformUserIds) > 0 THEN
    INSERT IGNORE INTO notification_recipients (idNotification, idPlatformUser)
    SELECT v_idNotification, jt.idPlatformUser
    FROM JSON_TABLE(
      p_recipientPlatformUserIds,
      '$[*]' COLUMNS (idPlatformUser INT PATH '$')
    ) jt
    WHERE jt.idPlatformUser IS NOT NULL;
  END IF;

  SELECT idNotification
  FROM notifications
  WHERE idNotification = v_idNotification;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_notifications_resolve;
DELIMITER $$

CREATE PROCEDURE sp_notifications_resolve(
  IN p_context VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_idBusiness INT,
  IN p_deduplicationKey VARCHAR(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  UPDATE notifications
  SET status = 'RESOLVED',
      resolved_at = NOW()
  WHERE context COLLATE utf8mb4_unicode_ci = p_context COLLATE utf8mb4_unicode_ci
    AND ((p_idBusiness IS NULL AND idBusiness IS NULL) OR idBusiness = p_idBusiness)
    AND deduplication_key COLLATE utf8mb4_unicode_ci = p_deduplicationKey COLLATE utf8mb4_unicode_ci
    AND status = 'ACTIVE';

  SELECT ROW_COUNT() AS affectedRows;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_notifications_get_business;
DELIMITER $$

CREATE PROCEDURE sp_notifications_get_business(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_limit INT,
  IN p_offset INT,
  IN p_isRead TINYINT,
  IN p_severity VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_type VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_dateFrom DATETIME,
  IN p_dateTo DATETIME
)
BEGIN
  SELECT
    n.idNotification,
    n.context,
    n.idBusiness,
    n.type,
    n.severity,
    n.title,
    n.message,
    n.action_url,
    n.metadata,
    n.deduplication_key,
    n.status,
    n.resolved_at,
    n.expires_at,
    n.created_at,
    nr.idNotificationRecipient,
    nr.idUser,
    nr.idPlatformUser,
    nr.is_read,
    nr.read_at,
    nr.is_archived,
    nr.archived_at
  FROM notification_recipients nr
  INNER JOIN notifications n ON n.idNotification = nr.idNotification
  WHERE n.context = 'BUSINESS'
    AND n.idBusiness = p_idBusiness
    AND nr.idUser = p_idUser
    AND nr.is_archived = 0
    AND n.status = 'ACTIVE'
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (p_isRead IS NULL OR nr.is_read = p_isRead)
    AND (p_severity IS NULL OR n.severity COLLATE utf8mb4_unicode_ci = p_severity COLLATE utf8mb4_unicode_ci)
    AND (p_type IS NULL OR n.type COLLATE utf8mb4_unicode_ci = p_type COLLATE utf8mb4_unicode_ci)
    AND (p_dateFrom IS NULL OR n.created_at >= p_dateFrom)
    AND (p_dateTo IS NULL OR n.created_at <= p_dateTo)
  ORDER BY n.created_at DESC, n.idNotification DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM notification_recipients nr
  INNER JOIN notifications n ON n.idNotification = nr.idNotification
  WHERE n.context = 'BUSINESS'
    AND n.idBusiness = p_idBusiness
    AND nr.idUser = p_idUser
    AND nr.is_archived = 0
    AND n.status = 'ACTIVE'
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (p_isRead IS NULL OR nr.is_read = p_isRead)
    AND (p_severity IS NULL OR n.severity COLLATE utf8mb4_unicode_ci = p_severity COLLATE utf8mb4_unicode_ci)
    AND (p_type IS NULL OR n.type COLLATE utf8mb4_unicode_ci = p_type COLLATE utf8mb4_unicode_ci)
    AND (p_dateFrom IS NULL OR n.created_at >= p_dateFrom)
    AND (p_dateTo IS NULL OR n.created_at <= p_dateTo);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_notifications_get_platform;
DELIMITER $$

CREATE PROCEDURE sp_notifications_get_platform(
  IN p_idPlatformUser INT,
  IN p_limit INT,
  IN p_offset INT,
  IN p_isRead TINYINT,
  IN p_severity VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_type VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_dateFrom DATETIME,
  IN p_dateTo DATETIME
)
BEGIN
  SELECT
    n.idNotification,
    n.context,
    n.idBusiness,
    n.type,
    n.severity,
    n.title,
    n.message,
    n.action_url,
    n.metadata,
    n.deduplication_key,
    n.status,
    n.resolved_at,
    n.expires_at,
    n.created_at,
    nr.idNotificationRecipient,
    nr.idUser,
    nr.idPlatformUser,
    nr.is_read,
    nr.read_at,
    nr.is_archived,
    nr.archived_at
  FROM notification_recipients nr
  INNER JOIN notifications n ON n.idNotification = nr.idNotification
  WHERE n.context = 'PLATFORM'
    AND n.idBusiness IS NULL
    AND nr.idPlatformUser = p_idPlatformUser
    AND nr.is_archived = 0
    AND n.status = 'ACTIVE'
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (p_isRead IS NULL OR nr.is_read = p_isRead)
    AND (p_severity IS NULL OR n.severity COLLATE utf8mb4_unicode_ci = p_severity COLLATE utf8mb4_unicode_ci)
    AND (p_type IS NULL OR n.type COLLATE utf8mb4_unicode_ci = p_type COLLATE utf8mb4_unicode_ci)
    AND (p_dateFrom IS NULL OR n.created_at >= p_dateFrom)
    AND (p_dateTo IS NULL OR n.created_at <= p_dateTo)
  ORDER BY n.created_at DESC, n.idNotification DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM notification_recipients nr
  INNER JOIN notifications n ON n.idNotification = nr.idNotification
  WHERE n.context = 'PLATFORM'
    AND n.idBusiness IS NULL
    AND nr.idPlatformUser = p_idPlatformUser
    AND nr.is_archived = 0
    AND n.status = 'ACTIVE'
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (p_isRead IS NULL OR nr.is_read = p_isRead)
    AND (p_severity IS NULL OR n.severity COLLATE utf8mb4_unicode_ci = p_severity COLLATE utf8mb4_unicode_ci)
    AND (p_type IS NULL OR n.type COLLATE utf8mb4_unicode_ci = p_type COLLATE utf8mb4_unicode_ci)
    AND (p_dateFrom IS NULL OR n.created_at >= p_dateFrom)
    AND (p_dateTo IS NULL OR n.created_at <= p_dateTo);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_notifications_get_unread_count_business;
DELIMITER $$

CREATE PROCEDURE sp_notifications_get_unread_count_business(
  IN p_idBusiness INT,
  IN p_idUser INT
)
BEGIN
  SELECT COUNT(*) AS unreadCount
  FROM notification_recipients nr
  INNER JOIN notifications n ON n.idNotification = nr.idNotification
  WHERE n.context = 'BUSINESS'
    AND n.idBusiness = p_idBusiness
    AND nr.idUser = p_idUser
    AND nr.is_read = 0
    AND nr.is_archived = 0
    AND n.status = 'ACTIVE'
    AND (n.expires_at IS NULL OR n.expires_at > NOW());
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_notifications_get_unread_count_platform;
DELIMITER $$

CREATE PROCEDURE sp_notifications_get_unread_count_platform(
  IN p_idPlatformUser INT
)
BEGIN
  SELECT COUNT(*) AS unreadCount
  FROM notification_recipients nr
  INNER JOIN notifications n ON n.idNotification = nr.idNotification
  WHERE n.context = 'PLATFORM'
    AND n.idBusiness IS NULL
    AND nr.idPlatformUser = p_idPlatformUser
    AND nr.is_read = 0
    AND nr.is_archived = 0
    AND n.status = 'ACTIVE'
    AND (n.expires_at IS NULL OR n.expires_at > NOW());
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_notifications_mark_read_business;
DELIMITER $$

CREATE PROCEDURE sp_notifications_mark_read_business(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_idNotification BIGINT
)
BEGIN
  UPDATE notification_recipients nr
  INNER JOIN notifications n ON n.idNotification = nr.idNotification
  SET nr.is_read = 1,
      nr.read_at = COALESCE(nr.read_at, NOW())
  WHERE n.context = 'BUSINESS'
    AND n.idBusiness = p_idBusiness
    AND n.idNotification = p_idNotification
    AND nr.idUser = p_idUser
    AND nr.is_archived = 0;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOTIFICATION_NOT_FOUND';
  END IF;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_notifications_mark_read_platform;
DELIMITER $$

CREATE PROCEDURE sp_notifications_mark_read_platform(
  IN p_idPlatformUser INT,
  IN p_idNotification BIGINT
)
BEGIN
  UPDATE notification_recipients nr
  INNER JOIN notifications n ON n.idNotification = nr.idNotification
  SET nr.is_read = 1,
      nr.read_at = COALESCE(nr.read_at, NOW())
  WHERE n.context = 'PLATFORM'
    AND n.idBusiness IS NULL
    AND n.idNotification = p_idNotification
    AND nr.idPlatformUser = p_idPlatformUser
    AND nr.is_archived = 0;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOTIFICATION_NOT_FOUND';
  END IF;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_notifications_mark_all_read_business;
DELIMITER $$

CREATE PROCEDURE sp_notifications_mark_all_read_business(
  IN p_idBusiness INT,
  IN p_idUser INT
)
BEGIN
  UPDATE notification_recipients nr
  INNER JOIN notifications n ON n.idNotification = nr.idNotification
  SET nr.is_read = 1,
      nr.read_at = COALESCE(nr.read_at, NOW())
  WHERE n.context = 'BUSINESS'
    AND n.idBusiness = p_idBusiness
    AND nr.idUser = p_idUser
    AND nr.is_read = 0
    AND nr.is_archived = 0
    AND n.status = 'ACTIVE'
    AND (n.expires_at IS NULL OR n.expires_at > NOW());

  SELECT ROW_COUNT() AS affectedRows;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_notifications_mark_all_read_platform;
DELIMITER $$

CREATE PROCEDURE sp_notifications_mark_all_read_platform(
  IN p_idPlatformUser INT
)
BEGIN
  UPDATE notification_recipients nr
  INNER JOIN notifications n ON n.idNotification = nr.idNotification
  SET nr.is_read = 1,
      nr.read_at = COALESCE(nr.read_at, NOW())
  WHERE n.context = 'PLATFORM'
    AND n.idBusiness IS NULL
    AND nr.idPlatformUser = p_idPlatformUser
    AND nr.is_read = 0
    AND nr.is_archived = 0
    AND n.status = 'ACTIVE'
    AND (n.expires_at IS NULL OR n.expires_at > NOW());

  SELECT ROW_COUNT() AS affectedRows;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_notifications_archive_business;
DELIMITER $$

CREATE PROCEDURE sp_notifications_archive_business(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_idNotification BIGINT
)
BEGIN
  UPDATE notification_recipients nr
  INNER JOIN notifications n ON n.idNotification = nr.idNotification
  SET nr.is_archived = 1,
      nr.archived_at = COALESCE(nr.archived_at, NOW())
  WHERE n.context = 'BUSINESS'
    AND n.idBusiness = p_idBusiness
    AND n.idNotification = p_idNotification
    AND nr.idUser = p_idUser;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOTIFICATION_NOT_FOUND';
  END IF;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_notifications_archive_platform;
DELIMITER $$

CREATE PROCEDURE sp_notifications_archive_platform(
  IN p_idPlatformUser INT,
  IN p_idNotification BIGINT
)
BEGIN
  UPDATE notification_recipients nr
  INNER JOIN notifications n ON n.idNotification = nr.idNotification
  SET nr.is_archived = 1,
      nr.archived_at = COALESCE(nr.archived_at, NOW())
  WHERE n.context = 'PLATFORM'
    AND n.idBusiness IS NULL
    AND n.idNotification = p_idNotification
    AND nr.idPlatformUser = p_idPlatformUser;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOTIFICATION_NOT_FOUND';
  END IF;
END$$

DELIMITER ;
