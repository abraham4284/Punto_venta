DROP PROCEDURE IF EXISTS sp_get_purchase_by_id;
DELIMITER $$

CREATE PROCEDURE sp_get_purchase_by_id(
  IN p_idBusiness INT,
  IN p_idPurchase INT
)
BEGIN
  SELECT
    p.idPurchase,
    p.purchase_number,
    p.idBusiness,
    p.idSupplier,
    s.name AS supplier_name,
    NULL AS idDeposit,
    GROUP_CONCAT(DISTINCT d.name ORDER BY d.name SEPARATOR ', ') AS deposit_name,
    p.idUser,
    u.name AS user_name,
    p.purchase_date,
    p.subtotal,
    p.discount_total,
    p.total,
    p.observation,
    p.status,
    p.created_at,
    NULL AS updated_at
  FROM purchases p
  LEFT JOIN suppliers s
    ON s.idSupplier = p.idSupplier
    AND s.idBusiness = p.idBusiness
  LEFT JOIN purchase_details pd
    ON pd.idPurchase = p.idPurchase
    AND pd.idBusiness = p.idBusiness
  LEFT JOIN deposits d
    ON d.idDeposit = pd.idDeposit
    AND d.idBusiness = pd.idBusiness
  INNER JOIN users u
    ON u.idUser = p.idUser
  WHERE p.idBusiness = p_idBusiness
    AND p.idPurchase = p_idPurchase
  GROUP BY
    p.idPurchase,
    p.purchase_number,
    p.idBusiness,
    p.idSupplier,
    s.name,
    p.idUser,
    u.name,
    p.purchase_date,
    p.subtotal,
    p.discount_total,
    p.total,
    p.observation,
    p.status,
    p.created_at
  LIMIT 1;

  SELECT
    pd.idPurchaseDetail,
    pd.idPurchase,
    pd.idBusiness,
    pd.idProduct,
    pd.idDeposit,
    d.name AS deposit_name,
    pr.name AS product_name,
    pr.barcode,
    pr.image_url AS product_image_url,
    pd.quantity,
    pd.unit_cost AS unit_price,
    pd.discount_amount,
    pd.subtotal,
    NULL AS created_at
  FROM purchase_details pd
  INNER JOIN products pr
    ON pr.idProduct = pd.idProduct
    AND pr.idBusiness = pd.idBusiness
  INNER JOIN deposits d
    ON d.idDeposit = pd.idDeposit
    AND d.idBusiness = pd.idBusiness
  WHERE pd.idBusiness = p_idBusiness
    AND pd.idPurchase = p_idPurchase
  ORDER BY pd.idPurchaseDetail ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_create_purchase;
DELIMITER $$

CREATE PROCEDURE sp_create_purchase(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_purchaseNumber VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_idempotencyKey VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_idSupplier INT,
  IN p_subtotal DECIMAL(18,2),
  IN p_discountTotal DECIMAL(18,2),
  IN p_total DECIMAL(18,2),
  IN p_observation VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_details JSON
)
BEGIN
  DECLARE v_idPurchase INT;
  DECLARE v_idProduct INT;
  DECLARE v_idDeposit INT;
  DECLARE v_quantity DECIMAL(18,2);
  DECLARE v_unitPrice DECIMAL(18,2);
  DECLARE v_discountAmount DECIMAL(18,2);
  DECLARE v_subtotal DECIMAL(18,2);
  DECLARE v_unitType VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_done INT DEFAULT 0;
  DECLARE v_existingPurchaseId INT;

  DECLARE details_cursor CURSOR FOR
    SELECT
      jt.idProduct,
      jt.idDeposit,
      jt.quantity,
      jt.unitPrice,
      jt.discountAmount,
      jt.subtotal
    FROM JSON_TABLE(
      p_details,
      '$[*]' COLUMNS (
        idProduct INT PATH '$.idProduct',
        idDeposit INT PATH '$.idDeposit',
        quantity DECIMAL(18,2) PATH '$.quantity',
        unitPrice DECIMAL(18,2) PATH '$.unitPrice',
        discountAmount DECIMAL(18,2) PATH '$.discountAmount',
        subtotal DECIMAL(18,2) PATH '$.subtotal'
      )
    ) AS jt;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_idempotencyKey IS NULL OR TRIM(p_idempotencyKey) = '' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'IDEMPOTENCY_KEY_REQUIRED';
  END IF;

  SELECT idPurchase
  INTO v_existingPurchaseId
  FROM purchases
  WHERE idBusiness = p_idBusiness
    AND idempotency_key = p_idempotencyKey
  LIMIT 1;

  IF v_existingPurchaseId IS NOT NULL THEN
    CALL sp_get_purchase_by_id(p_idBusiness, v_existingPurchaseId);
    SELECT 1 AS alreadyProcessed;
  ELSE

  IF p_idSupplier IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM suppliers
    WHERE idBusiness = p_idBusiness
      AND idSupplier = p_idSupplier
      AND is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El proveedor indicado no existe o no pertenece al negocio';
  END IF;

  START TRANSACTION;

  INSERT INTO purchases (
    purchase_number,
    idempotency_key,
    idBusiness,
    idSupplier,
    idUser,
    purchase_date,
    subtotal,
    discount_total,
    total,
    observation,
    status,
    created_at
  )
  VALUES (
    p_purchaseNumber,
    p_idempotencyKey,
    p_idBusiness,
    p_idSupplier,
    p_idUser,
    NOW(),
    p_subtotal,
    p_discountTotal,
    p_total,
    p_observation,
    'COMPLETED',
    NOW()
  );

  SET v_idPurchase = LAST_INSERT_ID();

  SET v_done = 0;

  OPEN details_cursor;

  read_loop: LOOP
    FETCH details_cursor
      INTO
        v_idProduct,
        v_idDeposit,
        v_quantity,
        v_unitPrice,
        v_discountAmount,
        v_subtotal;

    IF v_done = 1 THEN
      LEAVE read_loop;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM products
      WHERE idBusiness = p_idBusiness
        AND idProduct = v_idProduct
        AND is_active = 1
    ) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Uno de los productos indicados no existe o no pertenece al negocio';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM deposits
      WHERE idBusiness = p_idBusiness
        AND idDeposit = v_idDeposit
        AND is_active = 1
    ) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Uno de los depositos indicados no existe o no pertenece al negocio';
    END IF;

    SELECT unit_type
      INTO v_unitType
    FROM products
    WHERE idBusiness = p_idBusiness
      AND idProduct = v_idProduct
    LIMIT 1;

    IF COALESCE(v_unitType, 'UNIT') = 'UNIT' AND v_quantity <> FLOOR(v_quantity) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Los productos por unidad solo permiten cantidades enteras';
    END IF;

    INSERT INTO purchase_details (
      idBusiness,
      idPurchase,
      idProduct,
      idDeposit,
      quantity,
      unit_cost,
      discount_amount,
      subtotal
    )
    VALUES (
      p_idBusiness,
      v_idPurchase,
      v_idProduct,
      v_idDeposit,
      v_quantity,
      v_unitPrice,
      v_discountAmount,
      v_subtotal
    );

    IF EXISTS (
      SELECT 1
      FROM stock
      WHERE idBusiness = p_idBusiness
        AND idProduct = v_idProduct
        AND idDeposit = v_idDeposit
    ) THEN
      UPDATE stock
      SET
        quantity = quantity + v_quantity,
        updated_at = NOW()
      WHERE idBusiness = p_idBusiness
        AND idProduct = v_idProduct
        AND idDeposit = v_idDeposit;
    ELSE
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
        v_idDeposit,
        v_quantity,
        NOW()
      );
    END IF;

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
      v_idProduct,
      p_idUser,
      'PURCHASE',
      NULL,
      v_idDeposit,
      v_quantity,
      'PURCHASE',
      v_idPurchase,
      CONCAT('Compra ', p_purchaseNumber),
      NOW()
    );
  END LOOP;

  CLOSE details_cursor;

  COMMIT;

  CALL sp_get_purchase_by_id(p_idBusiness, v_idPurchase);
  SELECT 0 AS alreadyProcessed;
  END IF;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cancel_purchase;
DELIMITER $$

CREATE PROCEDURE sp_cancel_purchase(
  IN p_idPurchase INT,
  IN p_idBusiness INT
)
BEGIN
  DECLARE v_purchaseExists INT DEFAULT 0;
  DECLARE v_idDeposit INT;
  DECLARE v_idProduct INT;
  DECLARE v_quantity DECIMAL(18,2);
  DECLARE v_done INT DEFAULT 0;

  DECLARE details_cursor CURSOR FOR
    SELECT idProduct, idDeposit, quantity
    FROM purchase_details
    WHERE idBusiness = p_idBusiness
      AND idPurchase = p_idPurchase;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT idPurchase
    INTO v_purchaseExists
  FROM purchases
  WHERE idBusiness = p_idBusiness
    AND idPurchase = p_idPurchase
    AND status = 'COMPLETED'
  LIMIT 1
  FOR UPDATE;

  IF v_purchaseExists = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La compra no existe o ya se encuentra anulada';
  END IF;

  SET v_done = 0;

  OPEN details_cursor;

  read_loop: LOOP
    FETCH details_cursor INTO v_idProduct, v_idDeposit, v_quantity;

    IF v_done = 1 THEN
      LEAVE read_loop;
    END IF;

    UPDATE stock
    SET
      quantity = quantity - v_quantity,
      updated_at = NOW()
    WHERE idBusiness = p_idBusiness
      AND idProduct = v_idProduct
      AND idDeposit = v_idDeposit
      AND quantity >= v_quantity;

    IF ROW_COUNT() = 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No hay stock suficiente para anular la compra';
    END IF;
  END LOOP;

  CLOSE details_cursor;

  UPDATE purchases
  SET
    status = 'CANCELLED'
  WHERE idBusiness = p_idBusiness
    AND idPurchase = p_idPurchase;

  COMMIT;

  CALL sp_get_purchase_by_id(p_idBusiness, p_idPurchase);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_purchases_by_business;
DELIMITER $$

CREATE PROCEDURE sp_get_purchases_by_business(
  IN p_idBusiness INT,
  IN p_limit INT,
  IN p_offset INT,
  IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_idSupplier INT,
  IN p_idDeposit INT,
  IN p_purchaseNumberSearch VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_startDate DATETIME,
  IN p_endDate DATETIME
)
BEGIN
  SELECT
    p.idPurchase,
    p.purchase_number,
    p.idBusiness,
    p.idSupplier,
    s.name AS supplier_name,
    NULL AS idDeposit,
    GROUP_CONCAT(DISTINCT d.name ORDER BY d.name SEPARATOR ', ') AS deposit_name,
    p.idUser,
    u.name AS user_name,
    p.purchase_date,
    p.subtotal,
    p.discount_total,
    p.total,
    p.observation,
    p.status,
    p.created_at,
    NULL AS updated_at
  FROM purchases p
  LEFT JOIN suppliers s
    ON s.idSupplier = p.idSupplier
    AND s.idBusiness = p.idBusiness
  LEFT JOIN purchase_details pd
    ON pd.idPurchase = p.idPurchase
    AND pd.idBusiness = p.idBusiness
  LEFT JOIN deposits d
    ON d.idDeposit = pd.idDeposit
    AND d.idBusiness = pd.idBusiness
  INNER JOIN users u
    ON u.idUser = p.idUser
  WHERE p.idBusiness = p_idBusiness
    AND (p_status IS NULL OR p.status = p_status)
    AND (p_idSupplier IS NULL OR p.idSupplier = p_idSupplier)
    AND (
      p_idDeposit IS NULL
      OR EXISTS (
        SELECT 1
        FROM purchase_details pde
        WHERE pde.idBusiness = p.idBusiness
          AND pde.idPurchase = p.idPurchase
          AND pde.idDeposit = p_idDeposit
      )
    )
    AND (
      p_purchaseNumberSearch IS NULL
      OR p.purchase_number COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_purchaseNumberSearch COLLATE utf8mb4_unicode_ci, '%')
    )
    AND (p_startDate IS NULL OR p.purchase_date >= p_startDate)
    AND (p_endDate IS NULL OR p.purchase_date <= p_endDate)
  GROUP BY
    p.idPurchase,
    p.purchase_number,
    p.idBusiness,
    p.idSupplier,
    s.name,
    p.idUser,
    u.name,
    p.purchase_date,
    p.subtotal,
    p.discount_total,
    p.total,
    p.observation,
    p.status,
    p.created_at
  ORDER BY p.purchase_date DESC, p.idPurchase DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT
    COUNT(*) AS totalRecords,
    SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedRecords,
    SUM(CASE WHEN p.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledRecords,
    COALESCE(SUM(CASE WHEN p.status = 'COMPLETED' THEN p.total ELSE 0 END), 0) AS completedTotal
  FROM purchases p
  WHERE p.idBusiness = p_idBusiness
    AND (p_status IS NULL OR p.status = p_status)
    AND (p_idSupplier IS NULL OR p.idSupplier = p_idSupplier)
    AND (
      p_idDeposit IS NULL
      OR EXISTS (
        SELECT 1
        FROM purchase_details pde
        WHERE pde.idBusiness = p.idBusiness
          AND pde.idPurchase = p.idPurchase
          AND pde.idDeposit = p_idDeposit
      )
    )
    AND (
      p_purchaseNumberSearch IS NULL
      OR p.purchase_number COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_purchaseNumberSearch COLLATE utf8mb4_unicode_ci, '%')
    )
    AND (p_startDate IS NULL OR p.purchase_date >= p_startDate)
    AND (p_endDate IS NULL OR p.purchase_date <= p_endDate);
END$$

DELIMITER ;
