DROP PROCEDURE IF EXISTS sp_create_product_category;
DELIMITER $$

CREATE PROCEDURE sp_create_product_category(
  IN p_idBusiness INT,
  IN p_name VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_is_default TINYINT
)
BEGIN
  IF p_is_default = 1 THEN
    UPDATE product_categories
    SET is_default = 0,
        updated_at = NOW()
    WHERE idBusiness = p_idBusiness
      AND is_active = 1;
  END IF;

  INSERT INTO product_categories (
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

  CALL sp_get_product_category_by_id(p_idBusiness, LAST_INSERT_ID());
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_product_categories;
DELIMITER $$

CREATE PROCEDURE sp_get_product_categories(
  IN p_idBusiness INT
)
BEGIN
  SELECT
    idProductCategory,
    idBusiness,
    name,
    description,
    is_default,
    is_active,
    created_at,
    updated_at
  FROM product_categories
  WHERE idBusiness = p_idBusiness
  ORDER BY is_default DESC, name ASC, idProductCategory ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_product_category_by_id;
DELIMITER $$

CREATE PROCEDURE sp_get_product_category_by_id(
  IN p_idBusiness INT,
  IN p_idProductCategory INT
)
BEGIN
  SELECT
    idProductCategory,
    idBusiness,
    name,
    description,
    is_default,
    is_active,
    created_at,
    updated_at
  FROM product_categories
  WHERE idBusiness = p_idBusiness
    AND idProductCategory = p_idProductCategory
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_update_product_category;
DELIMITER $$

CREATE PROCEDURE sp_update_product_category(
  IN p_idBusiness INT,
  IN p_idProductCategory INT,
  IN p_name VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_update_description TINYINT,
  IN p_is_default TINYINT,
  IN p_update_is_default TINYINT
)
BEGIN
  IF p_update_is_default = 1 AND p_is_default = 1 THEN
    UPDATE product_categories
    SET is_default = 0,
        updated_at = NOW()
    WHERE idBusiness = p_idBusiness
      AND idProductCategory <> p_idProductCategory
      AND is_active = 1;
  END IF;

  UPDATE product_categories
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
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idProductCategory = p_idProductCategory;

  CALL sp_get_product_category_by_id(p_idBusiness, p_idProductCategory);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_update_product_category_status;
DELIMITER $$

CREATE PROCEDURE sp_update_product_category_status(
  IN p_idBusiness INT,
  IN p_idProductCategory INT,
  IN p_is_active TINYINT
)
BEGIN
  UPDATE product_categories
  SET
    is_active = p_is_active,
    is_default = CASE
      WHEN p_is_active = 0 THEN 0
      ELSE is_default
    END,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idProductCategory = p_idProductCategory;

  CALL sp_get_product_category_by_id(p_idBusiness, p_idProductCategory);
END$$

DELIMITER ;
