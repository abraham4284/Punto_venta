DROP PROCEDURE IF EXISTS sp_create_deposit;
DELIMITER $$

CREATE PROCEDURE sp_create_deposit(
  IN p_idBusiness INT,
  IN p_name VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_is_default TINYINT
)
BEGIN
  DECLARE v_idBusinessSubscription INT DEFAULT NULL;
  DECLARE v_maxDeposits INT DEFAULT NULL;
  DECLARE v_activeDeposits INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT bs.idBusinessSubscription, sp.max_deposits
  INTO v_idBusinessSubscription, v_maxDeposits
  FROM business_subscriptions bs
  INNER JOIN subscription_plans sp
    ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
  WHERE bs.idBusiness = p_idBusiness
    AND bs.status IN ('TRIAL','ACTIVE','PAST_DUE')
  ORDER BY bs.created_at DESC, bs.idBusinessSubscription DESC
  LIMIT 1
  FOR UPDATE;

  IF v_idBusinessSubscription IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'SUBSCRIPTION_REQUIRED';
  END IF;

  IF v_maxDeposits IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_activeDeposits
    FROM deposits
    WHERE idBusiness = p_idBusiness
      AND is_active = 1;

    IF v_activeDeposits + 1 > v_maxDeposits THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'SUBSCRIPTION_DEPOSIT_LIMIT_REACHED';
    END IF;
  END IF;

  IF p_is_default = 1 THEN
    UPDATE deposits
    SET is_default = 0,
        updated_at = NOW()
    WHERE idBusiness = p_idBusiness
      AND is_active = 1;
  END IF;

  INSERT INTO deposits (
    idBusiness,
    name,
    description,
    is_default,
    is_active,
    created_at
  )
  VALUES (
    p_idBusiness,
    p_name,
    p_description,
    p_is_default,
    1,
    NOW()
  );

  COMMIT;

  CALL sp_get_deposit_by_id(p_idBusiness, LAST_INSERT_ID());
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_deposits;
DELIMITER $$

CREATE PROCEDURE sp_get_deposits(
  IN p_idBusiness INT
)
BEGIN
  SELECT
    idDeposit,
    idBusiness,
    name,
    description,
    is_default,
    is_active,
    created_at,
    updated_at
  FROM deposits
  WHERE idBusiness = p_idBusiness
  ORDER BY is_default DESC, name ASC, idDeposit ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_deposit_by_id;
DELIMITER $$

CREATE PROCEDURE sp_get_deposit_by_id(
  IN p_idBusiness INT,
  IN p_idDeposit INT
)
BEGIN
  SELECT
    idDeposit,
    idBusiness,
    name,
    description,
    is_default,
    is_active,
    created_at,
    updated_at
  FROM deposits
  WHERE idBusiness = p_idBusiness
    AND idDeposit = p_idDeposit
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_update_deposit;
DELIMITER $$

CREATE PROCEDURE sp_update_deposit(
  IN p_idBusiness INT,
  IN p_idDeposit INT,
  IN p_name VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_update_description TINYINT,
  IN p_is_default TINYINT,
  IN p_update_is_default TINYINT,
  IN p_is_active TINYINT,
  IN p_update_is_active TINYINT
)
BEGIN
  DECLARE v_current_is_active TINYINT DEFAULT NULL;
  DECLARE v_idBusinessSubscription INT DEFAULT NULL;
  DECLARE v_maxDeposits INT DEFAULT NULL;
  DECLARE v_activeDeposits INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT is_active
  INTO v_current_is_active
  FROM deposits
  WHERE idBusiness = p_idBusiness
    AND idDeposit = p_idDeposit
  LIMIT 1
  FOR UPDATE;

  IF v_current_is_active IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Deposito no encontrado';
  END IF;

  IF p_update_is_active = 1 AND v_current_is_active = 0 AND p_is_active = 1 THEN
    SELECT bs.idBusinessSubscription, sp.max_deposits
    INTO v_idBusinessSubscription, v_maxDeposits
    FROM business_subscriptions bs
    INNER JOIN subscription_plans sp
      ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
    WHERE bs.idBusiness = p_idBusiness
      AND bs.status IN ('TRIAL','ACTIVE','PAST_DUE')
    ORDER BY bs.created_at DESC, bs.idBusinessSubscription DESC
    LIMIT 1
    FOR UPDATE;

    IF v_idBusinessSubscription IS NULL THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'SUBSCRIPTION_REQUIRED';
    END IF;

    IF v_maxDeposits IS NOT NULL THEN
      SELECT COUNT(*)
      INTO v_activeDeposits
      FROM deposits
      WHERE idBusiness = p_idBusiness
        AND is_active = 1;

      IF v_activeDeposits + 1 > v_maxDeposits THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'SUBSCRIPTION_DEPOSIT_LIMIT_REACHED';
      END IF;
    END IF;
  END IF;

  IF p_update_is_default = 1 AND p_is_default = 1 THEN
    UPDATE deposits
    SET is_default = 0,
        updated_at = NOW()
    WHERE idBusiness = p_idBusiness
      AND idDeposit <> p_idDeposit
      AND is_active = 1;
  END IF;

  UPDATE deposits
  SET
    name = COALESCE(p_name, name),
    description = CASE
      WHEN p_update_description = 1 THEN p_description
      ELSE description
    END,
    is_default = CASE
      WHEN p_update_is_default = 1 THEN p_is_default
      ELSE is_default
    END,
    is_active = CASE
      WHEN p_update_is_active = 1 THEN p_is_active
      ELSE is_active
    END,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idDeposit = p_idDeposit;

  COMMIT;

  CALL sp_get_deposit_by_id(p_idBusiness, p_idDeposit);
END$$

DELIMITER ;
