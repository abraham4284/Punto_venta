DROP PROCEDURE IF EXISTS sp_create_supplier;
DELIMITER $$

CREATE PROCEDURE sp_create_supplier(
  IN p_idBusiness INT,
  IN p_name VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_phone VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_email VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_observation VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_idSupplier INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  INSERT INTO suppliers (
    idBusiness,
    name,
    phone,
    email,
    address,
    observation,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    p_idBusiness,
    p_name,
    p_phone,
    p_email,
    p_address,
    p_observation,
    1,
    NOW(),
    NOW()
  );

  SET v_idSupplier = LAST_INSERT_ID();

  COMMIT;

  CALL sp_get_supplier_by_id(v_idSupplier, p_idBusiness);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_suppliers;
DELIMITER $$

CREATE PROCEDURE sp_get_suppliers(
  IN p_idBusiness INT
)
BEGIN
  SELECT
    idSupplier,
    idBusiness,
    name,
    phone,
    email,
    address,
    observation,
    is_active,
    created_at,
    updated_at
  FROM suppliers
  WHERE idBusiness = p_idBusiness
  ORDER BY created_at DESC, idSupplier DESC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_supplier_by_id;
DELIMITER $$

CREATE PROCEDURE sp_get_supplier_by_id(
  IN p_idSupplier INT,
  IN p_idBusiness INT
)
BEGIN
  SELECT
    idSupplier,
    idBusiness,
    name,
    phone,
    email,
    address,
    observation,
    is_active,
    created_at,
    updated_at
  FROM suppliers
  WHERE idSupplier = p_idSupplier
    AND idBusiness = p_idBusiness
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_update_supplier;
DELIMITER $$

CREATE PROCEDURE sp_update_supplier(
  IN p_idSupplier INT,
  IN p_idBusiness INT,
  IN p_name VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_phone VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_email VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_observation VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_is_active TINYINT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  UPDATE suppliers
  SET
    name = p_name,
    phone = p_phone,
    email = p_email,
    address = p_address,
    observation = p_observation,
    is_active = p_is_active,
    updated_at = NOW()
  WHERE idSupplier = p_idSupplier
    AND idBusiness = p_idBusiness;

  COMMIT;

  CALL sp_get_supplier_by_id(p_idSupplier, p_idBusiness);
END$$

DELIMITER ;
