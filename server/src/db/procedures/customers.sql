-- Customers v2: fullName is derived; document uniqueness is enforced by the table index.
DROP PROCEDURE IF EXISTS sp_get_customer_by_id;
DELIMITER $$
CREATE PROCEDURE sp_get_customer_by_id(IN p_idBusiness INT, IN p_idCustomer INT)
BEGIN
  SELECT idCustomer, idBusiness, first_name, last_name, document_type, document_number,
    phone, email, address, observation, is_active, created_at, updated_at
  FROM customers
  WHERE idBusiness = p_idBusiness AND idCustomer = p_idCustomer
  LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_create_customer;
DELIMITER $$
CREATE PROCEDURE sp_create_customer(
  IN p_idBusiness INT,
  IN p_first_name VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_last_name VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_document_type VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_document_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_phone VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_email VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_observation VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  IF (p_document_type IS NULL) <> (p_document_number IS NULL)
     OR (p_document_number IS NOT NULL AND TRIM(p_document_number) = '')
     OR (p_document_type IS NOT NULL AND p_document_type NOT IN ('DNI', 'CUIL', 'CUIT', 'PASSPORT', 'OTHER')) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo y numero de documento deben informarse juntos';
  END IF;
  INSERT INTO customers (
    idBusiness, first_name, last_name, document_type, document_number,
    phone, email, address, observation, is_active, created_at, updated_at
  ) VALUES (
    p_idBusiness, p_first_name, p_last_name, p_document_type, p_document_number,
    p_phone, p_email, p_address, p_observation, 1, NOW(), NOW()
  );
  CALL sp_get_customer_by_id(p_idBusiness, LAST_INSERT_ID());
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_customers;
DELIMITER $$
CREATE PROCEDURE sp_get_customers(
  IN p_idBusiness INT,
  IN p_search VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_search VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_document_search VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  SET v_search = NULLIF(TRIM(p_search), '');
  -- Preserve the original text for names/passports; normalize only the numeric alternative.
  SET v_document_search = REGEXP_REPLACE(v_search, '[[:space:].-]', '');
  SELECT idCustomer, idBusiness, first_name, last_name, document_type, document_number,
    phone, email, address, observation, is_active, created_at, updated_at
  FROM customers
  WHERE idBusiness = p_idBusiness
    AND (
      v_search IS NULL
      OR LOCATE(v_search, first_name) > 0
      OR LOCATE(v_search, last_name) > 0
      OR LOCATE(v_search, TRIM(CONCAT_WS(' ', first_name, last_name))) > 0
      OR LOCATE(v_search, document_number) > 0
      OR (document_type IN ('DNI', 'CUIL', 'CUIT')
          AND v_document_search REGEXP '^[0-9]+$'
          AND LOCATE(v_document_search, document_number) > 0)
      OR LOCATE(v_search, phone) > 0
      OR LOCATE(v_search, email) > 0
    )
  ORDER BY last_name ASC, first_name ASC, idCustomer ASC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_update_customer;
DELIMITER $$
CREATE PROCEDURE sp_update_customer(
  IN p_idBusiness INT,
  IN p_idCustomer INT,
  IN p_first_name VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_last_name VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_document_type VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_document_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_update_document TINYINT,
  IN p_phone VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_update_phone TINYINT,
  IN p_email VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_update_email TINYINT,
  IN p_address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_update_address TINYINT,
  IN p_observation VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_update_observation TINYINT
)
BEGIN
  IF (p_document_type IS NULL) <> (p_document_number IS NULL)
     OR (p_document_number IS NOT NULL AND TRIM(p_document_number) = '')
     OR (p_document_type IS NOT NULL AND p_document_type NOT IN ('DNI', 'CUIL', 'CUIT', 'PASSPORT', 'OTHER')) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo y numero de documento deben informarse juntos';
  END IF;
  UPDATE customers SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    document_type = CASE WHEN p_update_document = 1 THEN p_document_type ELSE document_type END,
    document_number = CASE WHEN p_update_document = 1 THEN p_document_number ELSE document_number END,
    phone = CASE WHEN p_update_phone = 1 THEN p_phone ELSE phone END,
    email = CASE WHEN p_update_email = 1 THEN p_email ELSE email END,
    address = CASE WHEN p_update_address = 1 THEN p_address ELSE address END,
    observation = CASE WHEN p_update_observation = 1 THEN p_observation ELSE observation END,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness AND idCustomer = p_idCustomer;
  CALL sp_get_customer_by_id(p_idBusiness, p_idCustomer);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_toggle_customer_status;
DELIMITER $$
CREATE PROCEDURE sp_toggle_customer_status(
  IN p_idBusiness INT, IN p_idCustomer INT, IN p_is_active TINYINT
)
BEGIN
  UPDATE customers SET is_active = p_is_active, updated_at = NOW()
  WHERE idBusiness = p_idBusiness AND idCustomer = p_idCustomer;
  CALL sp_get_customer_by_id(p_idBusiness, p_idCustomer);
END$$
DELIMITER ;
