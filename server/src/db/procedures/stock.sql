DROP PROCEDURE IF EXISTS sp_create_initial_stock;
DELIMITER $$

CREATE PROCEDURE sp_create_initial_stock(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_idProduct INT,
  IN p_idDeposit INT,
  IN p_quantity DECIMAL(18,2),
  IN p_observation VARCHAR(255)
)
BEGIN
  DECLARE v_idStock INT;
  DECLARE v_idMovement INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF EXISTS (
    SELECT 1
    FROM stock
    WHERE idBusiness = p_idBusiness
      AND idProduct = p_idProduct
      AND idDeposit = p_idDeposit
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El producto ya se encuentra registrado en este deposito. Realice un ajuste de stock.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM products
    WHERE idBusiness = p_idBusiness
      AND idProduct = p_idProduct
      AND is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El producto indicado no existe o no pertenece al negocio';
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

  START TRANSACTION;

  INSERT INTO stock (
    idBusiness,
    idProduct,
    idDeposit,
    quantity,
    updated_at
  )
  VALUES (
    p_idBusiness,
    p_idProduct,
    p_idDeposit,
    p_quantity,
    NOW()
  );

  SET v_idStock = LAST_INSERT_ID();

  INSERT INTO stock_movements (
    idBusiness,
    idProduct,
    idUser,
    movement_type,
    idDepositFrom,
    idDepositTo,
    quantity,
    reference_type,
    reference_id,
    observation,
    created_at
  )
  VALUES (
    p_idBusiness,
    p_idProduct,
    p_idUser,
    'ADJUSTMENT_IN',
    NULL,
    p_idDeposit,
    p_quantity,
    'ADJUSTMENT',
    NULL,
    p_observation,
    NOW()
  );

  SET v_idMovement = LAST_INSERT_ID();

  UPDATE stock_movements
  SET reference_id = v_idMovement
  WHERE idStockMovement = v_idMovement;

  COMMIT;

  CALL sp_get_stock_by_id(p_idBusiness, v_idStock);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_stock;
DELIMITER $$

CREATE PROCEDURE sp_get_stock(
  IN p_idBusiness INT
)
BEGIN
 SELECT
    s.idStock,
    s.idBusiness,
    b.name AS business_name,
    s.idProduct,
    p.name AS product_name,
    p.image_url AS product_image_url,
    pc.name AS category_name,
    s.idDeposit,
    d.name AS deposit_name,
    s.quantity,
    s.updated_at,
    p.stock_min
  FROM stock s
  INNER JOIN businesses b ON b.idBusiness = s.idBusiness
  INNER JOIN products p
    ON p.idProduct = s.idProduct
    AND p.idBusiness = s.idBusiness
  INNER JOIN deposits d
    ON d.idDeposit = s.idDeposit
    AND d.idBusiness = s.idBusiness
  INNER JOIN product_categories pc
   ON p.idProductCategory = pc.idProductCategory
  WHERE s.idBusiness = p_idBusiness
  ORDER BY p.name ASC, d.name ASC, s.idStock ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_stock_by_id;
DELIMITER $$

CREATE PROCEDURE sp_get_stock_by_id(
  IN p_idBusiness INT,
  IN p_idStock INT
)
BEGIN
  SELECT
    s.idStock,
    s.idBusiness,
    b.name AS business_name,
    s.idProduct,
    p.name AS product_name,
    p.image_url AS product_image_url,
    s.idDeposit,
    d.name AS deposit_name,
    s.quantity,
    s.updated_at
  FROM stock s
  INNER JOIN businesses b ON b.idBusiness = s.idBusiness
  INNER JOIN products p
    ON p.idProduct = s.idProduct
    AND p.idBusiness = s.idBusiness
  INNER JOIN deposits d
    ON d.idDeposit = s.idDeposit
    AND d.idBusiness = s.idBusiness
  WHERE s.idBusiness = p_idBusiness
    AND s.idStock = p_idStock
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_stock_by_product_and_deposit;
DELIMITER $$

CREATE PROCEDURE sp_get_stock_by_product_and_deposit(
  IN p_idBusiness INT,
  IN p_idProduct INT,
  IN p_idDeposit INT
)
BEGIN
  SELECT
    s.idStock,
    s.idBusiness,
    s.idProduct,
    s.idDeposit,
    s.quantity,
    s.updated_at
  FROM stock s
  WHERE s.idBusiness = p_idBusiness
    AND s.idProduct = p_idProduct
    AND s.idDeposit = p_idDeposit
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_critical_stock_report;
DELIMITER $$

CREATE PROCEDURE sp_get_critical_stock_report(
  IN p_idBusiness INT,
  IN p_maxQuantity DECIMAL(18,2),
  IN p_idDeposit INT,
  IN p_searchProduct VARCHAR(100)
)
BEGIN
  SELECT
    s.idStock,
    s.idBusiness,
    s.idProduct,
    p.name AS product_name,
    p.barcode,
    p.image_url AS image_url,
    s.idDeposit,
    d.name AS deposit_name,
    s.quantity,
    p.stock_min,
    CASE
      WHEN s.quantity = 0 THEN 'CRITICAL_ZERO'
      WHEN s.quantity > 0 AND s.quantity < p.stock_min THEN 'CRITICAL_LOW'
      WHEN s.quantity = p.stock_min THEN 'CRITICAL_EQUAL'
      ELSE 'STOCK_OK'
    END AS alert_status,
    CASE
      WHEN s.quantity = 0 THEN 'Sin stock / Agotado'
      WHEN s.quantity > 0 AND s.quantity < p.stock_min THEN 'Stock por debajo del minimo'
      WHEN s.quantity = p.stock_min THEN 'Stock igual al minimo configurado'
      ELSE 'Stock optimo (Por encima del minimo)'
    END AS alert_message
  FROM stock s
  INNER JOIN products p
    ON p.idProduct = s.idProduct
    AND p.idBusiness = s.idBusiness
  INNER JOIN deposits d
    ON d.idDeposit = s.idDeposit
    AND d.idBusiness = s.idBusiness
  WHERE s.idBusiness = p_idBusiness
    AND s.quantity <= p_maxQuantity
    AND (p_idDeposit IS NULL OR s.idDeposit = p_idDeposit)
    AND (
      p_searchProduct IS NULL
      OR p_searchProduct = ''
      OR p.name LIKE CONCAT('%', p_searchProduct, '%')
      OR p.barcode LIKE CONCAT('%', p_searchProduct, '%')
    )
  ORDER BY
    CASE
      WHEN s.quantity = 0 THEN 1
      WHEN s.quantity > 0 AND s.quantity < p.stock_min THEN 2
      WHEN s.quantity = p.stock_min THEN 3
      ELSE 4
    END ASC,
    s.quantity ASC,
    p.name ASC;
END$$

DELIMITER ;
