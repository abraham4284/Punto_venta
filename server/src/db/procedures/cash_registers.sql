DROP PROCEDURE IF EXISTS sp_cash_register_create;
DELIMITER $$

CREATE PROCEDURE sp_cash_register_create(
  IN p_idBusiness INT,
  IN p_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_isDefault TINYINT
)
BEGIN
  DECLARE v_idCashRegister INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre de la caja es obligatorio';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM cash_registers
    WHERE idBusiness = p_idBusiness
      AND name COLLATE utf8mb4_unicode_ci = TRIM(p_name) COLLATE utf8mb4_unicode_ci
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_REGISTER_NAME_ALREADY_EXISTS';
  END IF;

  START TRANSACTION;

  IF p_isDefault = 1 THEN
    UPDATE cash_registers
    SET is_default = 0
    WHERE idBusiness = p_idBusiness;
  END IF;

  INSERT INTO cash_registers (
    idBusiness,
    name,
    description,
    is_default,
    is_active
  )
  VALUES (
    p_idBusiness,
    TRIM(p_name),
    NULLIF(TRIM(COALESCE(p_description, '')), ''),
    IFNULL(p_isDefault, 0),
    1
  );

  SET v_idCashRegister = LAST_INSERT_ID();

  COMMIT;

  CALL sp_cash_register_get_by_id(p_idBusiness, v_idCashRegister);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_register_list;
DELIMITER $$

CREATE PROCEDURE sp_cash_register_list(IN p_idBusiness INT)
BEGIN
  SELECT
    cr.idCashRegister,
    cr.idBusiness,
    cr.name,
    cr.description,
    cr.is_default,
    cr.is_active,
    EXISTS (
      SELECT 1
      FROM cash_sessions cs
      WHERE cs.idBusiness = cr.idBusiness
        AND cs.idCashRegister = cr.idCashRegister
        AND cs.status = 'OPEN'
    ) AS has_open_session,
    cr.created_at,
    cr.updated_at
  FROM cash_registers cr
  WHERE cr.idBusiness = p_idBusiness
  ORDER BY cr.is_default DESC, cr.is_active DESC, cr.name ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_register_get_by_id;
DELIMITER $$

CREATE PROCEDURE sp_cash_register_get_by_id(
  IN p_idBusiness INT,
  IN p_idCashRegister INT
)
BEGIN
  SELECT
    cr.idCashRegister,
    cr.idBusiness,
    cr.name,
    cr.description,
    cr.is_default,
    cr.is_active,
    EXISTS (
      SELECT 1
      FROM cash_sessions cs
      WHERE cs.idBusiness = cr.idBusiness
        AND cs.idCashRegister = cr.idCashRegister
        AND cs.status = 'OPEN'
    ) AS has_open_session,
    cr.created_at,
    cr.updated_at
  FROM cash_registers cr
  WHERE cr.idBusiness = p_idBusiness
    AND cr.idCashRegister = p_idCashRegister
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_register_update;
DELIMITER $$

CREATE PROCEDURE sp_cash_register_update(
  IN p_idBusiness INT,
  IN p_idCashRegister INT,
  IN p_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_isDefault TINYINT
)
BEGIN
  DECLARE v_exists INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre de la caja es obligatorio';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM cash_registers
    WHERE idBusiness = p_idBusiness
      AND idCashRegister <> p_idCashRegister
      AND name COLLATE utf8mb4_unicode_ci = TRIM(p_name) COLLATE utf8mb4_unicode_ci
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_REGISTER_NAME_ALREADY_EXISTS';
  END IF;

  START TRANSACTION;

  SELECT COUNT(*)
  INTO v_exists
  FROM cash_registers
  WHERE idBusiness = p_idBusiness
    AND idCashRegister = p_idCashRegister
  FOR UPDATE;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_REGISTER_NOT_FOUND';
  END IF;

  IF p_isDefault = 1 THEN
    UPDATE cash_registers
    SET is_default = 0
    WHERE idBusiness = p_idBusiness;
  END IF;

  UPDATE cash_registers
  SET
    name = TRIM(p_name),
    description = NULLIF(TRIM(COALESCE(p_description, '')), ''),
    is_default = IFNULL(p_isDefault, is_default)
  WHERE idBusiness = p_idBusiness
    AND idCashRegister = p_idCashRegister;

  COMMIT;

  CALL sp_cash_register_get_by_id(p_idBusiness, p_idCashRegister);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_register_change_status;
DELIMITER $$

CREATE PROCEDURE sp_cash_register_change_status(
  IN p_idBusiness INT,
  IN p_idCashRegister INT,
  IN p_isActive TINYINT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM cash_registers
    WHERE idBusiness = p_idBusiness
      AND idCashRegister = p_idCashRegister
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_REGISTER_NOT_FOUND';
  END IF;

  IF p_isActive = 0 AND EXISTS (
    SELECT 1
    FROM cash_sessions
    WHERE idBusiness = p_idBusiness
      AND idCashRegister = p_idCashRegister
      AND status = 'OPEN'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_REGISTER_HAS_OPEN_SESSION';
  END IF;

  UPDATE cash_registers
  SET
    is_active = p_isActive,
    is_default = CASE WHEN p_isActive = 0 THEN 0 ELSE is_default END
  WHERE idBusiness = p_idBusiness
    AND idCashRegister = p_idCashRegister;

  CALL sp_cash_register_get_by_id(p_idBusiness, p_idCashRegister);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_register_set_default;
DELIMITER $$

CREATE PROCEDURE sp_cash_register_set_default(
  IN p_idBusiness INT,
  IN p_idCashRegister INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM cash_registers
    WHERE idBusiness = p_idBusiness
      AND idCashRegister = p_idCashRegister
      AND is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_REGISTER_NOT_FOUND';
  END IF;

  START TRANSACTION;

  UPDATE cash_registers
  SET is_default = 0
  WHERE idBusiness = p_idBusiness;

  UPDATE cash_registers
  SET is_default = 1
  WHERE idBusiness = p_idBusiness
    AND idCashRegister = p_idCashRegister;

  COMMIT;

  CALL sp_cash_register_get_by_id(p_idBusiness, p_idCashRegister);
END$$

DELIMITER ;
