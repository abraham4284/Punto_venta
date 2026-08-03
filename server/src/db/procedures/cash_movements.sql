DROP PROCEDURE IF EXISTS sp_cash_movement_create;
DELIMITER $$

CREATE PROCEDURE sp_cash_movement_create(
  IN p_idBusiness INT,
  IN p_idCashSession BIGINT,
  IN p_idUser INT,
  IN p_movementType VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_amount DECIMAL(18,2),
  IN p_description VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_sessionStatus VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_idCashMovement BIGINT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_movementType NOT IN ('INCOME', 'EXPENSE') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El tipo de movimiento no es valido';
  END IF;

  IF p_category IS NULL OR TRIM(p_category) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La categoria es obligatoria';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El importe debe ser mayor a cero';
  END IF;

  START TRANSACTION;

  SELECT status
  INTO v_sessionStatus
  FROM cash_sessions
  WHERE idBusiness = p_idBusiness
    AND idCashSession = p_idCashSession
  LIMIT 1
  FOR UPDATE;

  IF v_sessionStatus IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_SESSION_NOT_FOUND';
  END IF;

  IF v_sessionStatus <> 'OPEN' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_MOVEMENT_REQUIRES_OPEN_SESSION';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM business_users bu
    INNER JOIN users u ON u.idUser = bu.idUser
    WHERE bu.idBusiness = p_idBusiness
      AND bu.idUser = p_idUser
      AND bu.is_active = 1
      AND u.is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario no autorizado para registrar movimientos';
  END IF;

  INSERT INTO cash_movements (
    idBusiness,
    idCashSession,
    idUser,
    movement_type,
    category,
    amount,
    description
  )
  VALUES (
    p_idBusiness,
    p_idCashSession,
    p_idUser,
    p_movementType,
    TRIM(p_category),
    p_amount,
    NULLIF(TRIM(COALESCE(p_description, '')), '')
  );

  SET v_idCashMovement = LAST_INSERT_ID();

  COMMIT;

  CALL sp_cash_movement_get_by_id(p_idBusiness, v_idCashMovement);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_movement_list_by_session;
DELIMITER $$

CREATE PROCEDURE sp_cash_movement_list_by_session(
  IN p_idBusiness INT,
  IN p_idCashSession BIGINT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM cash_sessions
    WHERE idBusiness = p_idBusiness
      AND idCashSession = p_idCashSession
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_SESSION_NOT_FOUND';
  END IF;

  SELECT
    cm.idCashMovement,
    cm.idBusiness,
    cm.idCashSession,
    cm.idUser,
    u.name AS userName,
    cm.movement_type,
    cm.category,
    cm.amount,
    cm.description,
    cm.created_at
  FROM cash_movements cm
  INNER JOIN users u ON u.idUser = cm.idUser
  WHERE cm.idBusiness = p_idBusiness
    AND cm.idCashSession = p_idCashSession
  ORDER BY cm.created_at DESC, cm.idCashMovement DESC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_movement_get_by_id;
DELIMITER $$

CREATE PROCEDURE sp_cash_movement_get_by_id(
  IN p_idBusiness INT,
  IN p_idCashMovement BIGINT
)
BEGIN
  SELECT
    cm.idCashMovement,
    cm.idBusiness,
    cm.idCashSession,
    cm.idUser,
    u.name AS userName,
    cm.movement_type,
    cm.category,
    cm.amount,
    cm.description,
    cm.created_at
  FROM cash_movements cm
  INNER JOIN users u ON u.idUser = cm.idUser
  WHERE cm.idBusiness = p_idBusiness
    AND cm.idCashMovement = p_idCashMovement
  LIMIT 1;
END$$

DELIMITER ;
