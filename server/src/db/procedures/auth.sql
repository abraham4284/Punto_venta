DROP PROCEDURE IF EXISTS sp_user_login;
DELIMITER $$

CREATE PROCEDURE sp_user_login(
  IN p_username VARCHAR(120)
)
BEGIN
  SELECT
    u.idUser,
    u.name,
    u.username,
    u.email,
    u.password_hash,
    u.is_active AS user_active,
    b.idBusiness,
    b.name AS business_name,
    b.slug AS business_slug,
    b.is_active AS business_active,
    bu.role,
    bu.is_active AS business_user_active
  FROM users u
  INNER JOIN business_users bu ON bu.idUser = u.idUser
  INNER JOIN businesses b ON b.idBusiness = bu.idBusiness
  WHERE u.username = p_username
    AND u.is_active = 1
    AND bu.is_active = 1
    AND b.is_active = 1
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_user_info_by_id;
DELIMITER $$

CREATE PROCEDURE sp_get_user_info_by_id(
  IN p_idUser INT,
  IN p_idBusiness INT
)
BEGIN
  SELECT
    u.idUser,
    u.name,
    u.username,
    u.email,
    bu.role,
    u.is_active AS isActive,
    u.created_at AS createdAt
  FROM users u
  INNER JOIN business_users bu
    ON bu.idUser = u.idUser
    AND bu.idBusiness = p_idBusiness
  INNER JOIN businesses b
    ON b.idBusiness = bu.idBusiness
  WHERE u.idUser = p_idUser
    AND bu.idBusiness = p_idBusiness
    AND u.is_active = 1
    AND bu.is_active = 1
    AND b.is_active = 1
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_update_user_password;
DELIMITER $$

CREATE PROCEDURE sp_update_user_password(
  IN p_idUser INT,
  IN p_idBusiness INT,
  IN p_newPassword VARCHAR(255)
)
BEGIN
  START TRANSACTION;

  UPDATE users u
  INNER JOIN business_users bu
    ON bu.idUser = u.idUser
    AND bu.idBusiness = p_idBusiness
    AND bu.is_active = 1
  INNER JOIN businesses b
    ON b.idBusiness = bu.idBusiness
    AND b.is_active = 1
  SET
    u.password_hash = p_newPassword,
    u.updated_at = NOW()
  WHERE u.idUser = p_idUser
    AND u.is_active = 1;

  IF ROW_COUNT() = 0 THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Usuario no encontrado o no pertenece al negocio';
  END IF;

  COMMIT;

  SELECT
    p_idUser AS idUser,
    1 AS updated;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_create_session;
DELIMITER $$

CREATE PROCEDURE sp_create_session(
  IN p_refresh_token_hash VARCHAR(255),
  IN p_expires_at DATETIME,
  IN p_user_agent VARCHAR(255),
  IN p_ip VARCHAR(45),
  IN p_idUser INT,
  IN p_idBusiness INT
)
BEGIN
  INSERT INTO user_sessions (
    refresh_token_hash,
    created_at,
    expires_at,
    user_agent,
    ip,
    idUser,
    idBusiness
  )
  VALUES (
    p_refresh_token_hash,
    NOW(),
    p_expires_at,
    p_user_agent,
    p_ip,
    p_idUser,
    p_idBusiness
  );

  SELECT LAST_INSERT_ID() AS idLogin;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_session;
DELIMITER $$

CREATE PROCEDURE sp_get_session(
  IN p_idLogin INT,
  IN p_idUser INT,
  IN p_idBusiness INT
)
BEGIN
  SELECT
    us.idLogin,
    us.refresh_token_hash,
    us.expires_at,
    us.revoked_at,
    us.idUser,
    u.name,
    u.email,
    us.idBusiness,
    bu.role
  FROM user_sessions us
  INNER JOIN users u ON u.idUser = us.idUser
  INNER JOIN business_users bu
    ON bu.idUser = u.idUser
    AND bu.idBusiness = us.idBusiness
  INNER JOIN businesses b ON b.idBusiness = us.idBusiness
  WHERE us.idLogin = p_idLogin
    AND us.idUser = p_idUser
    AND (p_idBusiness IS NULL OR us.idBusiness = p_idBusiness)
    AND us.revoked_at IS NULL
    AND us.expires_at > NOW()
    AND u.is_active = 1
    AND bu.is_active = 1
    AND b.is_active = 1
  LIMIT 1;
END$$

DELIMITER ;



DROP PROCEDURE IF EXISTS sp_revoke_session;
DELIMITER $$

CREATE PROCEDURE sp_revoke_session(
  IN p_idLogin INT
)
BEGIN
  UPDATE user_sessions
  SET revoked_at = NOW()
  WHERE idLogin = p_idLogin
    AND revoked_at IS NULL;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_user_register_with_business;
DELIMITER $$

CREATE PROCEDURE sp_user_register_with_business(
  IN p_name VARCHAR(120),
  IN p_username VARCHAR(120),
  IN p_email VARCHAR(160),
  IN p_password_hash VARCHAR(255),
  IN p_business_name VARCHAR(160),
  IN p_business_slug VARCHAR(180),
  IN p_business_type VARCHAR(100)
)
BEGIN
  DECLARE v_idUser INT;
  DECLARE v_idBusiness INT;

  START TRANSACTION;

  INSERT INTO users (
    name,
    username,
    email,
    password_hash
  )
  VALUES (
    p_name,
    p_username,
    NULLIF(p_email, ''),
    p_password_hash
  );

  SET v_idUser = LAST_INSERT_ID();

  INSERT INTO businesses (
    name,
    slug,
    business_type
  )
  VALUES (
    p_business_name,
    p_business_slug,
    p_business_type
  );

  SET v_idBusiness = LAST_INSERT_ID();

  INSERT INTO business_users (
    idBusiness,
    idUser,
    role
  )
  VALUES (
    v_idBusiness,
    v_idUser,
    'OWNER'
  );

  COMMIT;

  SELECT
    v_idUser AS idUser,
    v_idBusiness AS idBusiness,
    'OWNER' AS role;
END$$

DELIMITER ;
