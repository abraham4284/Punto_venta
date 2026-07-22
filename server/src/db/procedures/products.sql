DROP PROCEDURE IF EXISTS sp_create_product;
DELIMITER $$

CREATE PROCEDURE sp_create_product(
  IN p_idBusiness INT,
  IN p_idProductCategory INT,
  IN p_idDeposit INT,
  IN p_quantity DECIMAL(18,2),
  IN p_barcode VARCHAR(100),
  IN p_name VARCHAR(160),
  IN p_description VARCHAR(255),
  IN p_image_url VARCHAR(500),
  IN p_price_cost DECIMAL(18,2),
  IN p_price_sale DECIMAL(18,2),
  IN p_price_wholesale DECIMAL(18,2),
  IN p_unit_type VARCHAR(20),
  IN p_stock_min DECIMAL(18,2)
)
BEGIN
  DECLARE v_idProduct INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM product_categories
    WHERE idBusiness = p_idBusiness
      AND idProductCategory = p_idProductCategory
      AND is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La categoria indicada no existe o no pertenece al negocio';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM deposits
    WHERE idBusiness = p_idBusiness
      AND idDeposit = p_idDeposit
      AND is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El deposito indicado no existe o no pertenece al negocio';
  END IF;

  IF COALESCE(p_unit_type, 'UNIT') NOT IN ('UNIT', 'KG', 'GRAM', 'LITER', 'METER') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La unidad de medida indicada no es valida';
  END IF;

  IF p_quantity < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El stock inicial no puede ser un valor negativo';
  END IF;

  START TRANSACTION;

  INSERT INTO products (
    idBusiness,
    idProductCategory,
    barcode,
    name,
    description,
    image_url,
    price_cost,
    price_sale,
    price_wholesale,
    unit_type,
    stock_min,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    p_idBusiness,
    p_idProductCategory,
    p_barcode,
    p_name,
    p_description,
    p_image_url,
    p_price_cost,
    p_price_sale,
    p_price_wholesale,
    COALESCE(p_unit_type, 'UNIT'),
    p_stock_min,
    1,
    NOW(),
    NOW()
  );

  SET v_idProduct = LAST_INSERT_ID();

  INSERT INTO stock (
    idBusiness,
    idProduct,
    idDeposit,
    quantity,
    updated_at
  )
  VALUES (
    p_idBusiness,
    v_idProduct,
    p_idDeposit,
    p_quantity,
    NOW()
  );

  COMMIT;

  CALL sp_get_product_by_id(p_idBusiness, v_idProduct);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_products;
DELIMITER $$

CREATE PROCEDURE sp_get_products(
  IN p_idBusiness INT
)
BEGIN
  SELECT
    p.idProduct,
    p.idBusiness,
    p.idProductCategory,
    pc.name AS product_category_name,
    p.barcode,
    p.name,
    p.description,
    p.image_url,
    p.price_cost,
    p.price_sale,
    p.price_wholesale,
    p.unit_type,
    p.stock_min,
    p.is_active,
    p.created_at,
    p.updated_at
  FROM products p
  INNER JOIN product_categories pc
    ON pc.idProductCategory = p.idProductCategory
    AND pc.idBusiness = p.idBusiness
  WHERE p.idBusiness = p_idBusiness
  ORDER BY p.name ASC, p.idProduct ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_product_by_id;
DELIMITER $$

CREATE PROCEDURE sp_get_product_by_id(
  IN p_idBusiness INT,
  IN p_idProduct INT
)
BEGIN
  SELECT
    p.idProduct,
    p.idBusiness,
    p.idProductCategory,
    pc.name AS product_category_name,
    p.barcode,
    p.name,
    p.description,
    p.image_url,
    p.price_cost,
    p.price_sale,
    p.price_wholesale,
    p.unit_type,
    p.stock_min,
    p.is_active,
    p.created_at,
    p.updated_at
  FROM products p
  INNER JOIN product_categories pc
    ON pc.idProductCategory = p.idProductCategory
    AND pc.idBusiness = p.idBusiness
  WHERE p.idBusiness = p_idBusiness
    AND p.idProduct = p_idProduct
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_update_product;
DELIMITER $$

CREATE PROCEDURE sp_update_product(
  IN p_idBusiness INT,
  IN p_idProduct INT,
  IN p_idProductCategory INT,
  IN p_update_idProductCategory TINYINT,
  IN p_barcode VARCHAR(100),
  IN p_update_barcode TINYINT,
  IN p_name VARCHAR(160),
  IN p_description VARCHAR(255),
  IN p_update_description TINYINT,
  IN p_image_url VARCHAR(500),
  IN p_update_image_url TINYINT,
  IN p_price_cost DECIMAL(18,2),
  IN p_price_sale DECIMAL(18,2),
  IN p_price_wholesale DECIMAL(18,2),
  IN p_update_price_wholesale TINYINT,
  IN p_unit_type VARCHAR(20),
  IN p_update_unit_type TINYINT,
  IN p_stock_min DECIMAL(18,2)
)
BEGIN
  IF p_update_idProductCategory = 1 AND NOT EXISTS (
    SELECT 1
    FROM product_categories
    WHERE idBusiness = p_idBusiness
      AND idProductCategory = p_idProductCategory
      AND is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La categoria indicada no existe o no pertenece al negocio';
  END IF;

  IF p_update_unit_type = 1 AND p_unit_type NOT IN ('UNIT', 'KG', 'GRAM', 'LITER', 'METER') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La unidad de medida indicada no es valida';
  END IF;

  UPDATE products
  SET
    idProductCategory = CASE
      WHEN p_update_idProductCategory = 1 THEN p_idProductCategory
      ELSE idProductCategory
    END,
    barcode = CASE
      WHEN p_update_barcode = 1 THEN p_barcode
      ELSE barcode
    END,
    name = COALESCE(p_name, name),
    description = CASE
      WHEN p_update_description = 1 THEN p_description
      ELSE description
    END,
    image_url = CASE
      WHEN p_update_image_url = 1 THEN p_image_url
      ELSE image_url
    END,
    price_cost = COALESCE(p_price_cost, price_cost),
    price_sale = COALESCE(p_price_sale, price_sale),
    price_wholesale = CASE
      WHEN p_update_price_wholesale = 1 THEN p_price_wholesale
      ELSE price_wholesale
    END,
    unit_type = CASE
      WHEN p_update_unit_type = 1 THEN p_unit_type
      ELSE unit_type
    END,
    stock_min = COALESCE(p_stock_min, stock_min),
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idProduct = p_idProduct;

  CALL sp_get_product_by_id(p_idBusiness, p_idProduct);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_update_product_prices;
DELIMITER $$

CREATE PROCEDURE sp_update_product_prices(
  IN p_idProduct INT,
  IN p_idBusiness INT,
  IN p_priceCost DECIMAL(18,2),
  IN p_priceSale DECIMAL(18,2),
  IN p_priceWholesale DECIMAL(18,2)
)
BEGIN
  UPDATE products
  SET
    price_cost = p_priceCost,
    price_sale = p_priceSale,
    price_wholesale = p_priceWholesale,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idProduct = p_idProduct;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Producto no encontrado o no pertenece al negocio';
  END IF;

  CALL sp_get_product_by_id(p_idBusiness, p_idProduct);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_toggle_product_status;
DELIMITER $$

CREATE PROCEDURE sp_toggle_product_status(
  IN p_idBusiness INT,
  IN p_idProduct INT,
  IN p_is_active TINYINT
)
BEGIN
  UPDATE products
  SET
    is_active = p_is_active,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idProduct = p_idProduct;

  CALL sp_get_product_by_id(p_idBusiness, p_idProduct);
END$$

DELIMITER ;
