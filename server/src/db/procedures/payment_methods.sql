DROP PROCEDURE IF EXISTS sp_payment_method_list;
DELIMITER $$

CREATE PROCEDURE sp_payment_method_list(
  IN p_idBusiness INT,
  IN p_onlyActive TINYINT
)
BEGIN
  SELECT
    pm.idPaymentMethod,
    pm.idBusiness,
    pm.code,
    pm.name,
    pm.affects_cash,
    pm.is_default,
    pm.is_active,
    pm.created_at,
    (
      SELECT COUNT(*)
      FROM sales s
      WHERE s.idBusiness = pm.idBusiness
        AND s.idPaymentMethod = pm.idPaymentMethod
    ) AS sales_count
  FROM payment_methods pm
  WHERE pm.idBusiness = p_idBusiness
    AND (p_onlyActive = 0 OR pm.is_active = 1)
  ORDER BY pm.is_default DESC, pm.name ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_payment_method_get_by_id;
DELIMITER $$

CREATE PROCEDURE sp_payment_method_get_by_id(
  IN p_idBusiness INT,
  IN p_idPaymentMethod INT
)
BEGIN
  SELECT
    pm.idPaymentMethod,
    pm.idBusiness,
    pm.code,
    pm.name,
    pm.affects_cash,
    pm.is_default,
    pm.is_active,
    pm.created_at,
    (
      SELECT COUNT(*)
      FROM sales s
      WHERE s.idBusiness = pm.idBusiness
        AND s.idPaymentMethod = pm.idPaymentMethod
    ) AS sales_count
  FROM payment_methods pm
  WHERE pm.idBusiness = p_idBusiness
    AND pm.idPaymentMethod = p_idPaymentMethod
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_payment_method_create;
DELIMITER $$

CREATE PROCEDURE sp_payment_method_create(
  IN p_idBusiness INT,
  IN p_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_name VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_actorUserId INT
)
BEGIN
  DECLARE v_idPaymentMethod INT;
  DECLARE v_affectsCash TINYINT DEFAULT 0;

  IF p_code COLLATE utf8mb4_unicode_ci = 'CASH' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CASH_PAYMENT_METHOD_IS_SYSTEM_MANAGED';
  END IF;

  IF p_code IS NULL OR p_code COLLATE utf8mb4_unicode_ci NOT IN ('TRANSFER','CARD','OTHER') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'INVALID_PAYMENT_METHOD_CODE';
  END IF;

  IF p_name IS NULL OR CHAR_LENGTH(TRIM(p_name)) < 2 OR CHAR_LENGTH(TRIM(p_name)) > 80 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PAYMENT_METHOD_NAME_INVALID';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM business_users bu
    INNER JOIN users u ON u.idUser = bu.idUser
    WHERE bu.idBusiness = p_idBusiness
      AND bu.idUser = p_actorUserId
      AND bu.is_active = 1
      AND u.is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Usuario no autorizado';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM payment_methods
    WHERE idBusiness = p_idBusiness
      AND name COLLATE utf8mb4_unicode_ci = TRIM(p_name) COLLATE utf8mb4_unicode_ci
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PAYMENT_METHOD_NAME_ALREADY_EXISTS';
  END IF;

  INSERT INTO payment_methods (
    idBusiness,
    code,
    name,
    affects_cash,
    is_default,
    is_active
  )
  VALUES (
    p_idBusiness,
    p_code,
    TRIM(p_name),
    v_affectsCash,
    0,
    1
  );

  SET v_idPaymentMethod = LAST_INSERT_ID();

  CALL sp_payment_method_get_by_id(p_idBusiness, v_idPaymentMethod);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_payment_method_update;
DELIMITER $$

CREATE PROCEDURE sp_payment_method_update(
  IN p_idBusiness INT,
  IN p_idPaymentMethod INT,
  IN p_name VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  SELECT code
  INTO v_code
  FROM payment_methods
  WHERE idBusiness = p_idBusiness
    AND idPaymentMethod = p_idPaymentMethod
  LIMIT 1;

  IF v_code IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PAYMENT_METHOD_NOT_FOUND';
  END IF;

  IF v_code COLLATE utf8mb4_unicode_ci = 'CASH' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CASH_PAYMENT_METHOD_IS_SYSTEM_MANAGED';
  END IF;

  IF p_name IS NULL OR CHAR_LENGTH(TRIM(p_name)) < 2 OR CHAR_LENGTH(TRIM(p_name)) > 80 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PAYMENT_METHOD_NAME_INVALID';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM payment_methods
    WHERE idBusiness = p_idBusiness
      AND idPaymentMethod <> p_idPaymentMethod
      AND name COLLATE utf8mb4_unicode_ci = TRIM(p_name) COLLATE utf8mb4_unicode_ci
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PAYMENT_METHOD_NAME_ALREADY_EXISTS';
  END IF;

  UPDATE payment_methods
  SET name = TRIM(p_name)
  WHERE idBusiness = p_idBusiness
    AND idPaymentMethod = p_idPaymentMethod;

  CALL sp_payment_method_get_by_id(p_idBusiness, p_idPaymentMethod);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_payment_method_change_status;
DELIMITER $$

CREATE PROCEDURE sp_payment_method_change_status(
  IN p_idBusiness INT,
  IN p_idPaymentMethod INT,
  IN p_isActive TINYINT
)
BEGIN
  DECLARE v_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_isDefault TINYINT;
  DECLARE v_currentActive TINYINT;

  SELECT code, is_default, is_active
  INTO v_code, v_isDefault, v_currentActive
  FROM payment_methods
  WHERE idBusiness = p_idBusiness
    AND idPaymentMethod = p_idPaymentMethod
  LIMIT 1;

  IF v_code IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PAYMENT_METHOD_NOT_FOUND';
  END IF;

  IF p_isActive IS NULL OR p_isActive NOT IN (0, 1) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PAYMENT_METHOD_STATUS_INVALID';
  END IF;

  IF v_currentActive = p_isActive THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PAYMENT_METHOD_STATUS_UNCHANGED';
  END IF;

  IF p_isActive = 0 AND v_code COLLATE utf8mb4_unicode_ci = 'CASH' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CASH_PAYMENT_METHOD_CANNOT_BE_DISABLED';
  END IF;

  IF p_isActive = 0 AND v_isDefault = 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'DEFAULT_PAYMENT_METHOD_CANNOT_BE_DISABLED';
  END IF;

  UPDATE payment_methods
  SET is_active = p_isActive
  WHERE idBusiness = p_idBusiness
    AND idPaymentMethod = p_idPaymentMethod;

  CALL sp_payment_method_get_by_id(p_idBusiness, p_idPaymentMethod);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_payment_method_set_default;
DELIMITER $$

CREATE PROCEDURE sp_payment_method_set_default(
  IN p_idBusiness INT,
  IN p_idPaymentMethod INT
)
BEGIN
  DECLARE v_idPaymentMethod INT DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT idPaymentMethod
  INTO v_idPaymentMethod
  FROM payment_methods
  WHERE idBusiness = p_idBusiness
    AND idPaymentMethod = p_idPaymentMethod
    AND is_active = 1
  LIMIT 1
  FOR UPDATE;

  IF v_idPaymentMethod IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PAYMENT_METHOD_NOT_FOUND';
  END IF;

  UPDATE payment_methods
  SET is_default = 0
  WHERE idBusiness = p_idBusiness;

  UPDATE payment_methods
  SET is_default = 1
  WHERE idBusiness = p_idBusiness
    AND idPaymentMethod = p_idPaymentMethod;

  COMMIT;

  CALL sp_payment_method_get_by_id(p_idBusiness, p_idPaymentMethod);
END$$

DELIMITER ;
