DROP PROCEDURE IF EXISTS sp_create_initial_stock;
DELIMITER $$

CREATE PROCEDURE sp_create_initial_stock(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_idProduct INT,
  IN p_idDeposit INT,
  IN p_quantity DECIMAL(18,2),
  IN p_observation VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_idStock INT;
  DECLARE v_idMovement INT;
  DECLARE v_unit_type VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

  SELECT unit_type
  INTO v_unit_type
  FROM products
  WHERE idBusiness = p_idBusiness
    AND idProduct = p_idProduct
  LIMIT 1;

  IF p_quantity IS NULL OR p_quantity < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La cantidad inicial no puede ser negativa';
  END IF;

  IF v_unit_type = 'UNIT' AND p_quantity <> FLOOR(p_quantity) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Los productos por unidad solo permiten cantidades enteras';
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

  IF p_quantity > 0 THEN
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
  END IF;

  COMMIT;

  CALL sp_get_stock_by_id(p_idBusiness, v_idStock);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_advanced_stock_inventory;
DELIMITER $$

CREATE PROCEDURE sp_get_advanced_stock_inventory(
  IN p_idBusiness INT,
  IN p_search VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_idDeposit INT,
  IN p_quantity DECIMAL(18,2),
  IN p_minQuantity DECIMAL(18,2),
  IN p_maxQuantity DECIMAL(18,2),
  IN p_alertStatus VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
    s.idStock,
    s.idProduct,
    p.name AS productName,
    pc.name AS categoryName,
    p.barcode,
    p.image_url AS imageUrl,
    p.unit_type AS unitType,
    p.price_cost AS priceCost,
    p.price_sale AS priceSale,
    s.idDeposit,
    d.name AS depositName,
    s.quantity,
    p.stock_min AS stockMin,
    CASE
      WHEN s.quantity = 0 THEN 'ZERO'
      WHEN s.quantity > 0 AND s.quantity <= p.stock_min THEN 'LOW'
      ELSE 'OK'
    END AS alertStatus
  FROM stock s
  INNER JOIN products p
    ON p.idProduct = s.idProduct
    AND p.idBusiness = s.idBusiness
  INNER JOIN deposits d
    ON d.idDeposit = s.idDeposit
    AND d.idBusiness = s.idBusiness
  LEFT JOIN product_categories pc
    ON pc.idProductCategory = p.idProductCategory
    AND pc.idBusiness = p.idBusiness
  WHERE s.idBusiness = p_idBusiness
    AND (
      p_search IS NULL
      OR p_search = ''
      OR p.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR p.barcode COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
    )
    AND (p_idDeposit IS NULL OR s.idDeposit = p_idDeposit)
    AND (p_quantity IS NULL OR s.quantity = p_quantity)
    AND (p_minQuantity IS NULL OR s.quantity >= p_minQuantity)
    AND (p_maxQuantity IS NULL OR s.quantity <= p_maxQuantity)
    AND (
      p_alertStatus IS NULL
      OR p_alertStatus = ''
      OR (
        CASE
          WHEN s.quantity = 0 THEN 'ZERO'
          WHEN s.quantity > 0 AND s.quantity <= p.stock_min THEN 'LOW'
          ELSE 'OK'
        END
      ) COLLATE utf8mb4_unicode_ci = p_alertStatus COLLATE utf8mb4_unicode_ci
    )
  ORDER BY p.name ASC, d.name ASC, s.idStock ASC
  LIMIT p_limit OFFSET p_offset;

  SELECT
    COUNT(*) AS totalRecords
  FROM stock s
  INNER JOIN products p
    ON p.idProduct = s.idProduct
    AND p.idBusiness = s.idBusiness
  INNER JOIN deposits d
    ON d.idDeposit = s.idDeposit
    AND d.idBusiness = s.idBusiness
  LEFT JOIN product_categories pc
    ON pc.idProductCategory = p.idProductCategory
    AND pc.idBusiness = p.idBusiness
  WHERE s.idBusiness = p_idBusiness
    AND (
      p_search IS NULL
      OR p_search = ''
      OR p.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR p.barcode COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
    )
    AND (p_idDeposit IS NULL OR s.idDeposit = p_idDeposit)
    AND (p_quantity IS NULL OR s.quantity = p_quantity)
    AND (p_minQuantity IS NULL OR s.quantity >= p_minQuantity)
    AND (p_maxQuantity IS NULL OR s.quantity <= p_maxQuantity)
    AND (
      p_alertStatus IS NULL
      OR p_alertStatus = ''
      OR (
        CASE
          WHEN s.quantity = 0 THEN 'ZERO'
          WHEN s.quantity > 0 AND s.quantity <= p.stock_min THEN 'LOW'
          ELSE 'OK'
        END
      ) COLLATE utf8mb4_unicode_ci = p_alertStatus COLLATE utf8mb4_unicode_ci
    );
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_stock;
DELIMITER $$

CREATE PROCEDURE sp_get_stock(
  IN p_idBusiness INT,
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
    s.idStock,
    s.idBusiness,
    b.name AS business_name,
    s.idProduct,
    p.name AS product_name,
    p.image_url AS product_image_url,
    p.unit_type AS product_unit_type,
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
    AND pc.idBusiness = s.idBusiness
  WHERE s.idBusiness = p_idBusiness
  ORDER BY p.name ASC, d.name ASC, s.idStock ASC
  LIMIT p_limit OFFSET p_offset;

  SELECT
    COUNT(*) AS totalRecords
  FROM stock s
  INNER JOIN products p
    ON p.idProduct = s.idProduct
    AND p.idBusiness = s.idBusiness
  INNER JOIN deposits d
    ON d.idDeposit = s.idDeposit
    AND d.idBusiness = s.idBusiness
  INNER JOIN product_categories pc
    ON p.idProductCategory = pc.idProductCategory
    AND pc.idBusiness = s.idBusiness
  WHERE s.idBusiness = p_idBusiness;
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
    p.unit_type AS product_unit_type,
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
  IN p_idDeposit INT,
  IN p_searchProduct VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_alertStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_maxQuantity DECIMAL(18,2)
)
BEGIN
  SELECT *
  FROM (
    SELECT
      s.idStock,
      s.idBusiness,
      s.idProduct,
      p.name AS product_name,
      p.barcode,
      p.image_url AS image_url,
      p.unit_type,
      p.price_cost,
      s.idDeposit,
      d.name AS deposit_name,
      s.quantity,
      p.stock_min,
      CASE
        WHEN s.quantity = 0 THEN 'CRITICAL_ZERO'
        WHEN s.quantity > 0 AND s.quantity < p.stock_min THEN 'CRITICAL_LOW'
        WHEN s.quantity = p.stock_min THEN 'CRITICAL_EQUAL'
      END AS alert_status,
      CASE
        WHEN s.quantity = 0 THEN 'Sin stock'
        WHEN s.quantity > 0 AND s.quantity < p.stock_min THEN 'Bajo minimo'
        WHEN s.quantity = p.stock_min THEN 'En el minimo'
      END AS alert_message
    FROM stock s
    INNER JOIN products p
      ON p.idProduct = s.idProduct
      AND p.idBusiness = s.idBusiness
    INNER JOIN deposits d
      ON d.idDeposit = s.idDeposit
      AND d.idBusiness = s.idBusiness
    WHERE s.idBusiness = p_idBusiness
      AND p.is_active = 1
      AND d.is_active = 1
      AND s.quantity <= p.stock_min
      AND (p_maxQuantity IS NULL OR s.quantity <= p_maxQuantity)
      AND (p_idDeposit IS NULL OR s.idDeposit = p_idDeposit)
      AND (
        p_searchProduct IS NULL
        OR p_searchProduct = ''
        OR p.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_searchProduct COLLATE utf8mb4_unicode_ci, '%')
        OR p.barcode COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_searchProduct COLLATE utf8mb4_unicode_ci, '%')
      )
  ) critical_stock
  WHERE critical_stock.alert_status IS NOT NULL
    AND (
      p_alertStatus IS NULL
      OR p_alertStatus = ''
      OR critical_stock.alert_status COLLATE utf8mb4_unicode_ci = p_alertStatus COLLATE utf8mb4_unicode_ci
    )
  ORDER BY
    CASE
      WHEN critical_stock.alert_status = 'CRITICAL_ZERO' THEN 1
      WHEN critical_stock.alert_status = 'CRITICAL_LOW' THEN 2
      WHEN critical_stock.alert_status = 'CRITICAL_EQUAL' THEN 3
      ELSE 4
    END ASC,
    critical_stock.quantity ASC,
    critical_stock.product_name ASC;
END$$

DELIMITER ;
