ALTER TABLE user_sessions
  MODIFY COLUMN idBusiness INT NULL;

SET @auth_context_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_sessions'
    AND COLUMN_NAME = 'auth_context'
);

SET @auth_context_sql := IF(
  @auth_context_exists = 0,
  'ALTER TABLE user_sessions ADD COLUMN auth_context ENUM(''BUSINESS'', ''PLATFORM'') NOT NULL DEFAULT ''BUSINESS'' AFTER idBusiness',
  'SELECT 1'
);

PREPARE auth_context_stmt FROM @auth_context_sql;
EXECUTE auth_context_stmt;
DEALLOCATE PREPARE auth_context_stmt;

DROP PROCEDURE IF EXISTS sp_platform_user_bootstrap;
DELIMITER $$

CREATE PROCEDURE sp_platform_user_bootstrap(
  IN p_idUser INT,
  IN p_role VARCHAR(30)
)
BEGIN
  DECLARE v_user_exists INT DEFAULT 0;
  DECLARE v_platform_user_exists INT DEFAULT 0;
  DECLARE v_active_super_admins INT DEFAULT 0;
  DECLARE v_lock_acquired INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    DO RELEASE_LOCK('maxikiosco_platform_bootstrap');
    RESIGNAL;
  END;

  SELECT GET_LOCK('maxikiosco_platform_bootstrap', 10) INTO v_lock_acquired;

  IF v_lock_acquired <> 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PLATFORM_BOOTSTRAP_LOCK_TIMEOUT';
  END IF;

  START TRANSACTION;

  SELECT COUNT(*) INTO v_user_exists
  FROM users
  WHERE idUser = p_idUser
    AND is_active = 1;

  IF v_user_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'USER_NOT_FOUND_OR_INACTIVE';
  END IF;

  SELECT COUNT(*) INTO v_platform_user_exists
  FROM platform_users
  WHERE idUser = p_idUser;

  IF v_platform_user_exists > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PLATFORM_USER_ALREADY_EXISTS';
  END IF;

  IF p_role = 'SUPER_ADMIN' THEN
    SELECT COUNT(*) INTO v_active_super_admins
    FROM platform_users
    WHERE role = 'SUPER_ADMIN'
      AND is_active = 1;

    IF v_active_super_admins > 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'PLATFORM_ALREADY_BOOTSTRAPPED';
    END IF;
  END IF;

  INSERT INTO platform_users (
    idUser,
    role,
    is_active
  )
  VALUES (
    p_idUser,
    p_role,
    1
  );

  SELECT
    pu.idPlatformUser,
    pu.idUser,
    pu.role,
    pu.is_active AS isActive,
    pu.created_at AS createdAt
  FROM platform_users pu
  WHERE pu.idPlatformUser = LAST_INSERT_ID();

  COMMIT;
  DO RELEASE_LOCK('maxikiosco_platform_bootstrap');
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_platform_create_base_user;
DELIMITER $$

CREATE PROCEDURE sp_platform_create_base_user(
  IN p_name VARCHAR(120),
  IN p_username VARCHAR(120),
  IN p_email VARCHAR(160),
  IN p_password_hash VARCHAR(255)
)
BEGIN
  INSERT INTO users (
    name,
    username,
    email,
    password_hash,
    is_active
  )
  VALUES (
    p_name,
    p_username,
    NULLIF(p_email, ''),
    p_password_hash,
    1
  );

  SELECT
    idUser,
    name,
    username,
    email,
    is_active AS isActive,
    created_at AS createdAt
  FROM users
  WHERE idUser = LAST_INSERT_ID();
END$$

DELIMITER ;
