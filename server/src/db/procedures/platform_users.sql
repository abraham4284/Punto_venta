USE `punto_venta_dev_clean_2`;

DROP PROCEDURE IF EXISTS sp_platform_users_list;
DROP PROCEDURE IF EXISTS sp_platform_users_get_by_id;
DROP PROCEDURE IF EXISTS sp_platform_users_create;
DROP PROCEDURE IF EXISTS sp_platform_users_change_role;
DROP PROCEDURE IF EXISTS sp_platform_users_change_status;
DROP PROCEDURE IF EXISTS sp_platform_users_revoke_sessions;

DELIMITER $$

CREATE PROCEDURE sp_platform_users_list(
  IN p_search VARCHAR(150),
  IN p_role VARCHAR(30),
  IN p_isActive TINYINT,
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
    pu.idPlatformUser,
    u.idUser,
    u.name,
    u.username,
    u.email,
    pu.role,
    pu.is_active AS isActive,
    u.created_at AS createdAt,
    MAX(us.last_used_at) AS lastLoginAt,
    SUM(CASE WHEN us.revoked_at IS NULL AND us.expires_at > NOW() THEN 1 ELSE 0 END) AS activeSessions
  FROM platform_users pu
  INNER JOIN users u ON u.idUser = pu.idUser
  LEFT JOIN user_sessions us ON us.idUser = u.idUser AND us.auth_context = 'PLATFORM'
  WHERE (p_search IS NULL OR p_search = '' OR u.name LIKE CONCAT('%', p_search, '%') OR u.username LIKE CONCAT('%', p_search, '%') OR u.email LIKE CONCAT('%', p_search, '%'))
    AND (p_role IS NULL OR p_role = '' OR pu.role = p_role)
    AND (p_isActive IS NULL OR pu.is_active = p_isActive)
  GROUP BY pu.idPlatformUser, u.idUser, u.name, u.username, u.email, pu.role, pu.is_active, u.created_at
  ORDER BY u.created_at DESC, pu.idPlatformUser DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM platform_users pu
  INNER JOIN users u ON u.idUser = pu.idUser
  WHERE (p_search IS NULL OR p_search = '' OR u.name LIKE CONCAT('%', p_search, '%') OR u.username LIKE CONCAT('%', p_search, '%') OR u.email LIKE CONCAT('%', p_search, '%'))
    AND (p_role IS NULL OR p_role = '' OR pu.role = p_role)
    AND (p_isActive IS NULL OR pu.is_active = p_isActive);
END$$

CREATE PROCEDURE sp_platform_users_get_by_id(IN p_idPlatformUser INT)
BEGIN
  SELECT
    pu.idPlatformUser,
    u.idUser,
    u.name,
    u.username,
    u.email,
    pu.role,
    pu.is_active AS isActive,
    u.created_at AS createdAt,
    MAX(us.last_used_at) AS lastLoginAt,
    SUM(CASE WHEN us.revoked_at IS NULL AND us.expires_at > NOW() THEN 1 ELSE 0 END) AS activeSessions
  FROM platform_users pu
  INNER JOIN users u ON u.idUser = pu.idUser
  LEFT JOIN user_sessions us ON us.idUser = u.idUser AND us.auth_context = 'PLATFORM'
  WHERE pu.idPlatformUser = p_idPlatformUser
  GROUP BY pu.idPlatformUser, u.idUser, u.name, u.username, u.email, pu.role, pu.is_active, u.created_at
  LIMIT 1;
END$$

CREATE PROCEDURE sp_platform_users_create(
  IN p_name VARCHAR(120),
  IN p_username VARCHAR(120),
  IN p_email VARCHAR(160),
  IN p_passwordHash VARCHAR(255),
  IN p_role VARCHAR(30)
)
BEGIN
  INSERT INTO users (
    name,
    username,
    email,
    password_hash,
    is_active,
    must_change_password
  ) VALUES (
    p_name,
    p_username,
    p_email,
    p_passwordHash,
    1,
    1
  );

  INSERT INTO platform_users (
    idUser,
    role,
    is_active,
    updated_at
  ) VALUES (
    LAST_INSERT_ID(),
    p_role,
    1,
    NOW()
  );

  CALL sp_platform_users_get_by_id(LAST_INSERT_ID());
END$$

CREATE PROCEDURE sp_platform_users_change_role(
  IN p_idPlatformUser INT,
  IN p_role VARCHAR(30)
)
BEGIN
  DECLARE v_currentRole VARCHAR(30);
  DECLARE v_superAdminCount INT DEFAULT 0;

  SELECT role INTO v_currentRole
  FROM platform_users
  WHERE idPlatformUser = p_idPlatformUser
  LIMIT 1;

  IF v_currentRole IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PLATFORM_USER_NOT_FOUND';
  END IF;

  SELECT COUNT(*) INTO v_superAdminCount
  FROM platform_users
  WHERE role = 'SUPER_ADMIN' AND is_active = 1;

  IF v_currentRole = 'SUPER_ADMIN' AND p_role <> 'SUPER_ADMIN' AND v_superAdminCount <= 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CANNOT_DEMOTE_LAST_SUPER_ADMIN';
  END IF;

  UPDATE platform_users
  SET role = p_role, updated_at = NOW()
  WHERE idPlatformUser = p_idPlatformUser;

  CALL sp_platform_users_get_by_id(p_idPlatformUser);
END$$

CREATE PROCEDURE sp_platform_users_change_status(
  IN p_idPlatformUser INT,
  IN p_isActive TINYINT
)
BEGIN
  DECLARE v_currentRole VARCHAR(30);
  DECLARE v_superAdminCount INT DEFAULT 0;

  SELECT role INTO v_currentRole
  FROM platform_users
  WHERE idPlatformUser = p_idPlatformUser
  LIMIT 1;

  IF v_currentRole IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PLATFORM_USER_NOT_FOUND';
  END IF;

  SELECT COUNT(*) INTO v_superAdminCount
  FROM platform_users
  WHERE role = 'SUPER_ADMIN' AND is_active = 1;

  IF v_currentRole = 'SUPER_ADMIN' AND p_isActive = 0 AND v_superAdminCount <= 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CANNOT_DEACTIVATE_LAST_SUPER_ADMIN';
  END IF;

  UPDATE platform_users
  SET is_active = p_isActive, updated_at = NOW()
  WHERE idPlatformUser = p_idPlatformUser;

  IF p_isActive = 0 THEN
    UPDATE user_sessions us
    INNER JOIN platform_users pu ON pu.idUser = us.idUser
    SET us.revoked_at = NOW()
    WHERE pu.idPlatformUser = p_idPlatformUser
      AND us.auth_context = 'PLATFORM'
      AND us.revoked_at IS NULL;
  END IF;

  CALL sp_platform_users_get_by_id(p_idPlatformUser);
END$$

CREATE PROCEDURE sp_platform_users_revoke_sessions(
  IN p_idPlatformUser INT,
  IN p_exceptLoginId INT
)
BEGIN
  UPDATE user_sessions us
  INNER JOIN platform_users pu ON pu.idUser = us.idUser
  SET us.revoked_at = NOW()
  WHERE pu.idPlatformUser = p_idPlatformUser
    AND us.auth_context = 'PLATFORM'
    AND us.revoked_at IS NULL
    AND (p_exceptLoginId IS NULL OR us.idLogin <> p_exceptLoginId);

  SELECT ROW_COUNT() AS revokedSessions;
END$$

DELIMITER ;
