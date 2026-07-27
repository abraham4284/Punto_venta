DROP PROCEDURE IF EXISTS sp_create_deposit;
DELIMITER $$

CREATE PROCEDURE sp_create_deposit(
  IN p_idBusiness INT,
  IN p_name VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_is_default TINYINT
)
BEGIN
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

  CALL sp_get_deposit_by_id(p_idBusiness, p_idDeposit);
END$$

DELIMITER ;
