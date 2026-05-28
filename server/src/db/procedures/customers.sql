DROP PROCEDURE IF EXISTS sp_create_customer;
DELIMITER $$

CREATE PROCEDURE sp_create_customer(
  IN p_idBusiness INT,
  IN p_name VARCHAR(160),
  IN p_phone VARCHAR(80),
  IN p_email VARCHAR(160),
  IN p_address VARCHAR(255),
  IN p_observation VARCHAR(255)
)
BEGIN
  INSERT INTO customers (
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

  CALL sp_get_customer_by_id(p_idBusiness, LAST_INSERT_ID());
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_customers;
DELIMITER $$

CREATE PROCEDURE sp_get_customers(
  IN p_idBusiness INT
)
BEGIN
  SELECT
    idCustomer,
    idBusiness,
    name,
    phone,
    email,
    address,
    observation,
    is_active,
    created_at,
    updated_at
  FROM customers
  WHERE idBusiness = p_idBusiness
  ORDER BY name ASC, idCustomer ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_customer_by_id;
DELIMITER $$

CREATE PROCEDURE sp_get_customer_by_id(
  IN p_idBusiness INT,
  IN p_idCustomer INT
)
BEGIN
  SELECT
    idCustomer,
    idBusiness,
    name,
    phone,
    email,
    address,
    observation,
    is_active,
    created_at,
    updated_at
  FROM customers
  WHERE idBusiness = p_idBusiness
    AND idCustomer = p_idCustomer
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_update_customer;
DELIMITER $$

CREATE PROCEDURE sp_update_customer(
  IN p_idBusiness INT,
  IN p_idCustomer INT,
  IN p_name VARCHAR(160),
  IN p_phone VARCHAR(80),
  IN p_update_phone TINYINT,
  IN p_email VARCHAR(160),
  IN p_update_email TINYINT,
  IN p_address VARCHAR(255),
  IN p_update_address TINYINT,
  IN p_observation VARCHAR(255),
  IN p_update_observation TINYINT
)
BEGIN
  UPDATE customers
  SET
    name = COALESCE(p_name, name),
    phone = CASE
      WHEN p_update_phone = 1 THEN p_phone
      ELSE phone
    END,
    email = CASE
      WHEN p_update_email = 1 THEN p_email
      ELSE email
    END,
    address = CASE
      WHEN p_update_address = 1 THEN p_address
      ELSE address
    END,
    observation = CASE
      WHEN p_update_observation = 1 THEN p_observation
      ELSE observation
    END,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idCustomer = p_idCustomer;

  CALL sp_get_customer_by_id(p_idBusiness, p_idCustomer);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_toggle_customer_status;
DELIMITER $$

CREATE PROCEDURE sp_toggle_customer_status(
  IN p_idBusiness INT,
  IN p_idCustomer INT,
  IN p_is_active TINYINT
)
BEGIN
  UPDATE customers
  SET
    is_active = p_is_active,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idCustomer = p_idCustomer;

  CALL sp_get_customer_by_id(p_idBusiness, p_idCustomer);
END$$

DELIMITER ;
