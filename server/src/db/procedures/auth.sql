DROP PROCEDURE IF EXISTS sp_user_login;
DELIMITER $$

CREATE PROCEDURE sp_user_login(
  IN p_username VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT
    u.idUser,
    u.name,
    u.username,
    u.email,
    u.password_hash,
    u.is_active AS user_active,
    u.must_change_password AS mustChangePassword,
    b.idBusiness,
    b.name AS business_name,
    b.slug AS business_slug,
    b.is_active AS business_active,
    b.status AS business_status,
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
    u.must_change_password AS mustChangePassword,
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
  IN p_newPassword VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
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
    u.must_change_password = 0,
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
  IN p_refresh_token_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_expires_at DATETIME,
  IN p_user_agent VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_ip VARCHAR(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
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
  IN p_name VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_username VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_email VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_password_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_business_name VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_business_slug VARCHAR(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_business_type VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_logoUrl VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_defaultTrialPlanCode VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_idUser INT;
  DECLARE v_idBusiness INT;
  DECLARE v_idSubscriptionPlan INT;
  DECLARE v_idBusinessSubscription INT;
  DECLARE v_trialDays INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

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
    logo_url,
    business_type,
    status
  )
  VALUES (
    p_business_name,
    p_business_slug,
    p_logoUrl,
    p_business_type,
    'ACTIVE'
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

  INSERT INTO cash_registers (
    idBusiness,
    name,
    description,
    is_default,
    is_active
  )
  VALUES (
    v_idBusiness,
    'Caja principal',
    'Caja creada automaticamente al registrar el negocio',
    1,
    1
  );

  INSERT INTO payment_methods (
    idBusiness,
    code,
    name,
    affects_cash,
    is_default,
    is_active
  )
  VALUES
    (v_idBusiness, 'CASH', 'Efectivo', 1, 1, 1),
    (v_idBusiness, 'TRANSFER', 'Transferencia', 0, 0, 1),
    (v_idBusiness, 'CARD', 'Tarjeta', 0, 0, 1),
    (v_idBusiness, 'OTHER', 'Otro', 0, 0, 1);

  SELECT idSubscriptionPlan, trial_days
  INTO v_idSubscriptionPlan, v_trialDays
  FROM subscription_plans
  WHERE code COLLATE utf8mb4_unicode_ci = p_defaultTrialPlanCode COLLATE utf8mb4_unicode_ci
    AND is_active = 1
  LIMIT 1;

  IF v_idSubscriptionPlan IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'SUBSCRIPTION_PLAN_NOT_FOUND';
  END IF;

  IF v_trialDays <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'DEFAULT_TRIAL_PLAN_WITHOUT_TRIAL_DAYS';
  END IF;

  INSERT INTO business_subscriptions (
    idBusiness,
    idSubscriptionPlan,
    status,
    starts_at,
    trial_starts_at,
    trial_ends_at,
    current_period_start,
    current_period_end,
    auto_renew,
    cancel_at_period_end
  )
  VALUES (
    v_idBusiness,
    v_idSubscriptionPlan,
    'TRIAL',
    NOW(),
    NOW(),
    DATE_ADD(NOW(), INTERVAL v_trialDays DAY),
    NULL,
    NULL,
    1,
    0
  );

  SET v_idBusinessSubscription = LAST_INSERT_ID();

  INSERT INTO subscription_events (
    idBusinessSubscription,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  VALUES (
    v_idBusinessSubscription,
    'TRIAL_STARTED',
    NULL,
    'TRIAL',
    JSON_OBJECT('planCode', p_defaultTrialPlanCode, 'trialDays', v_trialDays),
    v_idUser
  );

  COMMIT;

  SELECT
    v_idUser AS idUser,
    v_idBusiness AS idBusiness,
    p_name AS name,
    p_username AS username,
    NULLIF(p_email, '') AS email,
    p_business_name AS businessName,
    p_business_slug AS businessSlug,
    p_business_type AS businessType,
    p_logoUrl AS logoUrl,
    'ACTIVE' AS businessStatus,
    0 AS mustChangePassword,
    'OWNER' AS role;
END$$

DELIMITER ;
