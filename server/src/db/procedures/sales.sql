DROP PROCEDURE IF EXISTS sp_create_sale;
DELIMITER $$

CREATE PROCEDURE sp_create_sale(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_sale_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_idempotency_key VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_idCustomer INT,
  IN p_idDeposit INT,
  IN p_idCashSession BIGINT,
  IN p_subtotal DECIMAL(18,2),
  IN p_discount_total DECIMAL(18,2),
  IN p_total DECIMAL(18,2),
  IN p_observation VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_idSale INT;
  DECLARE v_cashSessionStatus VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_cashRegisterActive TINYINT;
  DECLARE v_existingSaleNumber VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  DECLARE EXIT HANDLER FOR 1062
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_sale_number IS NULL OR TRIM(p_sale_number) = '' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El numero de venta es obligatorio';
  END IF;

  IF p_idempotency_key IS NULL OR TRIM(p_idempotency_key) = '' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'IDEMPOTENCY_KEY_REQUIRED';
  END IF;

  SELECT idSale, sale_number
  INTO v_idSale, v_existingSaleNumber
  FROM sales
  WHERE idBusiness = p_idBusiness
    AND idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_idSale IS NOT NULL THEN
    SELECT
      v_idSale AS idSale,
      v_existingSaleNumber AS saleNumber,
      1 AS alreadyProcessed;
  ELSE

  IF NOT EXISTS (
    SELECT 1
    FROM business_users bu
    INNER JOIN users u ON u.idUser = bu.idUser
    WHERE bu.idBusiness = p_idBusiness
      AND bu.idUser = p_idUser
      AND bu.is_active = 1
      AND u.is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Usuario no autorizado para registrar ventas';
  END IF;

  IF p_idCashSession IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OPEN_CASH_SESSION_REQUIRED';
  END IF;

  SELECT cs.status, cr.is_active
  INTO v_cashSessionStatus, v_cashRegisterActive
  FROM cash_sessions cs
  INNER JOIN cash_registers cr
    ON cr.idCashRegister = cs.idCashRegister
    AND cr.idBusiness = cs.idBusiness
  WHERE cs.idCashSession = p_idCashSession
    AND cs.idBusiness = p_idBusiness
  LIMIT 1
  FOR UPDATE;

  IF v_cashSessionStatus IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OPEN_CASH_SESSION_REQUIRED';
  END IF;

  IF v_cashSessionStatus <> 'OPEN' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CASH_SESSION_CLOSED';
  END IF;

  IF v_cashRegisterActive = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CASH_REGISTER_INACTIVE';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM deposits
    WHERE idDeposit = p_idDeposit
      AND idBusiness = p_idBusiness
      AND is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El deposito indicado no pertenece al negocio o esta inactivo';
  END IF;

  IF p_idCustomer IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM customers
    WHERE idCustomer = p_idCustomer
      AND idBusiness = p_idBusiness
      AND is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El cliente indicado no pertenece al negocio o esta inactivo';
  END IF;

  INSERT INTO sales (
    idBusiness,
    idUser,
    sale_number,
    idempotency_key,
    idCustomer,
    idDeposit,
    idCashSession,
    sale_date,
    subtotal,
    discount_total,
    total,
    status,
    observation,
    created_at
  )
  VALUES (
    p_idBusiness,
    p_idUser,
    p_sale_number,
    p_idempotency_key,
    p_idCustomer,
    p_idDeposit,
    p_idCashSession,
    NOW(),
    p_subtotal,
    p_discount_total,
    p_total,
    'COMPLETED',
    p_observation,
    NOW()
  );

  SET v_idSale = LAST_INSERT_ID();

    SELECT v_idSale AS idSale, p_sale_number AS saleNumber, 0 AS alreadyProcessed;
  END IF;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_create_sale_detail_and_discount_stock;
DELIMITER $$

CREATE PROCEDURE sp_create_sale_detail_and_discount_stock(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_idSale INT,
  IN p_idProduct INT,
  IN p_idDeposit INT,
  IN p_quantity DECIMAL(18,2),
  IN p_unit_price DECIMAL(18,2),
  IN p_discount DECIMAL(18,2),
  IN p_total DECIMAL(18,2)
)
BEGIN
  DECLARE v_current_quantity DECIMAL(18,2);
  DECLARE v_unit_type VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_sale_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sales
    WHERE idSale = p_idSale
      AND idBusiness = p_idBusiness
      AND status = 'COMPLETED'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La venta indicada no existe o no esta activa';
  END IF;

  SELECT sale_number
  INTO v_sale_number
  FROM sales
  WHERE idSale = p_idSale
    AND idBusiness = p_idBusiness
  LIMIT 1;

  IF NOT EXISTS (
    SELECT 1
    FROM products
    WHERE idProduct = p_idProduct
      AND idBusiness = p_idBusiness
      AND is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El producto indicado no existe o esta inactivo';
  END IF;

  SELECT s.quantity, p.unit_type
  INTO v_current_quantity, v_unit_type
  FROM stock s
  INNER JOIN products p
    ON p.idProduct = s.idProduct
    AND p.idBusiness = s.idBusiness
  WHERE s.idBusiness = p_idBusiness
    AND s.idProduct = p_idProduct
    AND s.idDeposit = p_idDeposit
  LIMIT 1
  FOR UPDATE;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La cantidad debe ser mayor a cero';
  END IF;

  IF v_unit_type = 'UNIT' AND p_quantity <> FLOOR(p_quantity) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Los productos por unidad solo permiten cantidades enteras';
  END IF;

  IF v_current_quantity IS NULL OR v_current_quantity < p_quantity THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Stock insuficiente para procesar la venta';
  END IF;

  INSERT INTO sale_details (
    idBusiness,
    idSale,
    idProduct,
    quantity,
    unit_price,
    discount_amount,
    subtotal
  )
  VALUES (
    p_idBusiness,
    p_idSale,
    p_idProduct,
    p_quantity,
    p_unit_price,
    p_discount,
    p_total
  );

  UPDATE stock
  SET
    quantity = quantity - p_quantity,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idProduct = p_idProduct
    AND idDeposit = p_idDeposit;

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
    'SALE',
    p_idDeposit,
    NULL,
    p_quantity,
    'SALE',
    p_idSale,
    CONCAT('Venta ', COALESCE(v_sale_number, CONCAT('#', p_idSale))),
    NOW()
  );

  SELECT p_idSale AS idSale;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cancel_sale_and_revert_stock;
DELIMITER $$

CREATE PROCEDURE sp_cancel_sale_and_revert_stock(
  IN p_idSale INT,
  IN p_idBusiness INT
)
BEGIN
  DECLARE v_done INT DEFAULT 0;
  DECLARE v_idProduct INT;
  DECLARE v_idDeposit INT;
  DECLARE v_quantity DECIMAL(18,2);
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_cashSessionStatus VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_deliveryStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_collectedOrConfirmedPayments INT DEFAULT 0;

  DECLARE sale_detail_cursor CURSOR FOR
    SELECT sd.idProduct, s.idDeposit, sd.quantity
    FROM sale_details sd
    INNER JOIN sales s
      ON s.idSale = sd.idSale
      AND s.idBusiness = sd.idBusiness
    WHERE sd.idSale = p_idSale
      AND sd.idBusiness = p_idBusiness;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT s.status, cs.status
  INTO v_status, v_cashSessionStatus
  FROM sales s
  INNER JOIN cash_sessions cs
    ON cs.idCashSession = s.idCashSession
    AND cs.idBusiness = s.idBusiness
  WHERE s.idSale = p_idSale
    AND s.idBusiness = p_idBusiness
  LIMIT 1
  FOR UPDATE;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Venta no encontrada';
  END IF;

  IF v_status = 'CANCELLED' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La venta ya se encuentra anulada';
  END IF;

  IF v_status <> 'COMPLETED' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Solo se pueden anular ventas completadas';
  END IF;

  IF v_cashSessionStatus = 'CLOSED' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CLOSED_CASH_SESSION_SALE_CANNOT_BE_CANCELLED';
  END IF;

  SELECT status
  INTO v_deliveryStatus
  FROM sale_deliveries
  WHERE idBusiness = p_idBusiness
    AND idSale = p_idSale
  LIMIT 1
  FOR UPDATE;

  IF v_deliveryStatus IN ('OUT_FOR_DELIVERY', 'DELIVERED') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'DELIVERY_SALE_IN_PROGRESS_CANNOT_BE_CANCELLED';
  END IF;

  SELECT COUNT(*)
  INTO v_collectedOrConfirmedPayments
  FROM sale_payments
  WHERE idBusiness = p_idBusiness
    AND idSale = p_idSale
    AND status IN ('COLLECTED', 'CONFIRMED');

  IF v_deliveryStatus IS NOT NULL AND v_collectedOrConfirmedPayments > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'DELIVERY_SALE_WITH_PAYMENTS_CANNOT_BE_CANCELLED';
  END IF;

  UPDATE sales
  SET status = 'CANCELLED'
  WHERE idSale = p_idSale
    AND idBusiness = p_idBusiness;

  INSERT INTO sale_payment_events (
    idBusiness,
    idSalePayment,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  SELECT
    p_idBusiness,
    sp.idSalePayment,
    'PAYMENT_CANCELLED',
    sp.status,
    'CANCELLED',
    JSON_OBJECT('reason', 'Venta anulada'),
    NULL
  FROM sale_payments sp
  WHERE sp.idBusiness = p_idBusiness
    AND sp.idSale = p_idSale
    AND sp.status IN ('PENDING', 'COLLECTED', 'CONFIRMED');

  UPDATE sale_payments
  SET
    status = 'CANCELLED',
    cancelled_at = NOW(),
    cancellation_reason = 'Venta anulada'
  WHERE idBusiness = p_idBusiness
    AND idSale = p_idSale
    AND status IN ('PENDING', 'COLLECTED', 'CONFIRMED');

  INSERT INTO delivery_events (
    idBusiness,
    idSaleDelivery,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  SELECT
    p_idBusiness,
    sdv.idSaleDelivery,
    'DELIVERY_CANCELLED',
    v_deliveryStatus,
    'CANCELLED',
    JSON_OBJECT('reason', 'Venta anulada'),
    NULL
  FROM sale_deliveries sdv
  WHERE sdv.idBusiness = p_idBusiness
    AND sdv.idSale = p_idSale
    AND sdv.status IN ('PENDING', 'ASSIGNED', 'FAILED');

  UPDATE sale_deliveries
  SET
    status = 'CANCELLED',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idSale = p_idSale
    AND status IN ('PENDING', 'ASSIGNED', 'FAILED');

  OPEN sale_detail_cursor;

  read_loop: LOOP
    FETCH sale_detail_cursor INTO v_idProduct, v_idDeposit, v_quantity;

    IF v_done = 1 THEN
      LEAVE read_loop;
    END IF;

    INSERT INTO stock (
      idBusiness,
      idProduct,
      idDeposit,
      quantity,
      updated_at
    )
    SELECT
      p_idBusiness,
      v_idProduct,
      v_idDeposit,
      0,
      NOW()
    WHERE NOT EXISTS (
      SELECT 1
      FROM stock
      WHERE idBusiness = p_idBusiness
        AND idProduct = v_idProduct
        AND idDeposit = v_idDeposit
    );

    UPDATE stock
    SET
      quantity = quantity + v_quantity,
      updated_at = NOW()
    WHERE idBusiness = p_idBusiness
      AND idProduct = v_idProduct
      AND idDeposit = v_idDeposit;
  END LOOP;

  CLOSE sale_detail_cursor;

  COMMIT;

  CALL sp_get_sale_by_id(p_idBusiness, p_idSale);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_sales;
DELIMITER $$

CREATE PROCEDURE sp_get_sales(
  IN p_idBusiness INT,
  IN p_limit INT,
  IN p_offset INT,
  IN p_idDeposit INT,
  IN p_idPaymentMethod INT,
  IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_saleNumberSearch VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_startDate DATETIME,
  IN p_endDate DATETIME
)
BEGIN
  SELECT
    s.idSale,
    s.sale_number,
    s.idBusiness,
    s.idUser,
    u.name AS user_name,
    s.idCustomer,
    c.name AS customer_name,
    s.idDeposit,
    d.name AS deposit_name,
    s.idCashSession,
    MIN(sp.idPaymentMethod) AS idPaymentMethod,
    GROUP_CONCAT(DISTINCT pm.code ORDER BY pm.name SEPARATOR ', ') AS payment_method_code,
    GROUP_CONCAT(DISTINCT pm.name ORDER BY pm.name SEPARATOR ', ') AS payment_method_name,
    COALESCE(SUM(CASE WHEN sp.status = 'CONFIRMED' THEN sp.amount ELSE 0 END), 0) AS confirmed_amount,
    COALESCE(SUM(CASE WHEN sp.status = 'COLLECTED' THEN sp.amount ELSE 0 END), 0) AS collected_amount,
    COALESCE(SUM(CASE WHEN sp.status = 'PENDING' THEN sp.amount ELSE 0 END), 0) AS pending_amount,
    MAX(sdv.status) AS delivery_status,
    CASE
      WHEN COALESCE(SUM(CASE WHEN sp.status IN ('COLLECTED','CONFIRMED') THEN sp.amount ELSE 0 END), 0) = 0 THEN 'UNPAID'
      WHEN COALESCE(SUM(CASE WHEN sp.status IN ('COLLECTED','CONFIRMED') THEN sp.amount ELSE 0 END), 0) < s.total THEN 'PARTIALLY_PAID'
      ELSE 'PAID'
    END AS payment_status,
    s.sale_date,
    s.subtotal,
    s.discount_total,
    s.total,
    NULL AS payment_detail,
    s.status,
    s.observation,
    s.created_at,
    NULL AS updated_at
  FROM sales s
  INNER JOIN users u ON u.idUser = s.idUser
  INNER JOIN deposits d
    ON d.idDeposit = s.idDeposit
    AND d.idBusiness = s.idBusiness
  LEFT JOIN customers c
    ON c.idCustomer = s.idCustomer
    AND c.idBusiness = s.idBusiness
  LEFT JOIN sale_payments sp
    ON sp.idSale = s.idSale
    AND sp.idBusiness = s.idBusiness
    AND sp.status <> 'CANCELLED'
  LEFT JOIN payment_methods pm
    ON pm.idPaymentMethod = sp.idPaymentMethod
    AND pm.idBusiness = sp.idBusiness
  LEFT JOIN sale_deliveries sdv
    ON sdv.idSale = s.idSale
    AND sdv.idBusiness = s.idBusiness
  WHERE s.idBusiness = p_idBusiness
    AND (p_idDeposit IS NULL OR s.idDeposit = p_idDeposit)
    AND (
      p_idPaymentMethod IS NULL
      OR EXISTS (
        SELECT 1
        FROM sale_payments spf
        WHERE spf.idBusiness = s.idBusiness
          AND spf.idSale = s.idSale
          AND spf.idPaymentMethod = p_idPaymentMethod
          AND spf.status <> 'CANCELLED'
      )
    )
    AND (p_status IS NULL OR s.status = p_status)
    AND (
      p_saleNumberSearch IS NULL
      OR p_saleNumberSearch = ''
      OR s.sale_number COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_saleNumberSearch COLLATE utf8mb4_unicode_ci, '%')
    )
    AND (p_startDate IS NULL OR s.sale_date >= p_startDate)
    AND (p_endDate IS NULL OR s.sale_date <= p_endDate)
  GROUP BY
    s.idSale,
    s.sale_number,
    s.idBusiness,
    s.idUser,
    u.name,
    s.idCustomer,
    c.name,
    s.idDeposit,
    d.name,
    s.idCashSession,
    s.sale_date,
    s.subtotal,
    s.discount_total,
    s.total,
    s.status,
    s.observation,
    s.created_at
  ORDER BY s.created_at DESC, s.idSale DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT
    COUNT(*) AS totalRecords,
    SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedRecords,
    SUM(CASE WHEN s.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledRecords,
    COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.total ELSE 0 END), 0) AS completedTotal
  FROM sales s
  WHERE s.idBusiness = p_idBusiness
    AND (p_idDeposit IS NULL OR s.idDeposit = p_idDeposit)
    AND (
      p_idPaymentMethod IS NULL
      OR EXISTS (
        SELECT 1
        FROM sale_payments spf
        WHERE spf.idBusiness = s.idBusiness
          AND spf.idSale = s.idSale
          AND spf.idPaymentMethod = p_idPaymentMethod
          AND spf.status <> 'CANCELLED'
      )
    )
    AND (p_status IS NULL OR s.status = p_status)
    AND (
      p_saleNumberSearch IS NULL
      OR p_saleNumberSearch = ''
      OR s.sale_number COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_saleNumberSearch COLLATE utf8mb4_unicode_ci, '%')
    )
    AND (p_startDate IS NULL OR s.sale_date >= p_startDate)
    AND (p_endDate IS NULL OR s.sale_date <= p_endDate);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_sale_by_id;
DELIMITER $$

CREATE PROCEDURE sp_get_sale_by_id(
  IN p_idBusiness INT,
  IN p_idSale INT
)
BEGIN
  SELECT
    s.idSale,
    s.sale_number,
    s.idBusiness,
    s.idUser,
    u.name AS user_name,
    s.idCustomer,
    c.name AS customer_name,
    s.idDeposit,
    d.name AS deposit_name,
    s.idCashSession,
    MIN(sp.idPaymentMethod) AS idPaymentMethod,
    GROUP_CONCAT(DISTINCT pm.code ORDER BY pm.name SEPARATOR ', ') AS payment_method_code,
    GROUP_CONCAT(DISTINCT pm.name ORDER BY pm.name SEPARATOR ', ') AS payment_method_name,
    COALESCE(SUM(CASE WHEN sp.status = 'CONFIRMED' THEN sp.amount ELSE 0 END), 0) AS confirmed_amount,
    COALESCE(SUM(CASE WHEN sp.status = 'COLLECTED' THEN sp.amount ELSE 0 END), 0) AS collected_amount,
    COALESCE(SUM(CASE WHEN sp.status = 'PENDING' THEN sp.amount ELSE 0 END), 0) AS pending_amount,
    MAX(sdv.status) AS delivery_status,
    CASE
      WHEN COALESCE(SUM(CASE WHEN sp.status IN ('COLLECTED','CONFIRMED') THEN sp.amount ELSE 0 END), 0) = 0 THEN 'UNPAID'
      WHEN COALESCE(SUM(CASE WHEN sp.status IN ('COLLECTED','CONFIRMED') THEN sp.amount ELSE 0 END), 0) < s.total THEN 'PARTIALLY_PAID'
      ELSE 'PAID'
    END AS payment_status,
    s.sale_date,
    s.subtotal,
    s.discount_total,
    s.total,
    NULL AS payment_detail,
    s.status,
    s.observation,
    s.created_at,
    NULL AS updated_at
  FROM sales s
  INNER JOIN users u ON u.idUser = s.idUser
  INNER JOIN deposits d
    ON d.idDeposit = s.idDeposit
    AND d.idBusiness = s.idBusiness
  LEFT JOIN customers c
    ON c.idCustomer = s.idCustomer
    AND c.idBusiness = s.idBusiness
  LEFT JOIN sale_payments sp
    ON sp.idSale = s.idSale
    AND sp.idBusiness = s.idBusiness
    AND sp.status <> 'CANCELLED'
  LEFT JOIN payment_methods pm
    ON pm.idPaymentMethod = sp.idPaymentMethod
    AND pm.idBusiness = sp.idBusiness
  LEFT JOIN sale_deliveries sdv
    ON sdv.idSale = s.idSale
    AND sdv.idBusiness = s.idBusiness
  WHERE s.idBusiness = p_idBusiness
    AND s.idSale = p_idSale
  GROUP BY
    s.idSale,
    s.sale_number,
    s.idBusiness,
    s.idUser,
    u.name,
    s.idCustomer,
    c.name,
    s.idDeposit,
    d.name,
    s.idCashSession,
    s.sale_date,
    s.subtotal,
    s.discount_total,
    s.total,
    s.status,
    s.observation,
    s.created_at
  LIMIT 1;

  SELECT
    sd.idSaleDetail,
    sd.idSale,
    sd.idBusiness,
    sd.idProduct,
    p.name AS product_name,
    p.barcode,
    p.image_url AS product_image_url,
    s.idDeposit,
    d.name AS deposit_name,
    sd.quantity,
    sd.unit_price,
    sd.discount_amount AS discount,
    sd.subtotal AS total,
    s.created_at
  FROM sale_details sd
  INNER JOIN sales s
    ON s.idSale = sd.idSale
    AND s.idBusiness = sd.idBusiness
  INNER JOIN products p
    ON p.idProduct = sd.idProduct
    AND p.idBusiness = sd.idBusiness
  INNER JOIN deposits d
    ON d.idDeposit = s.idDeposit
    AND d.idBusiness = sd.idBusiness
  WHERE sd.idBusiness = p_idBusiness
    AND sd.idSale = p_idSale
  ORDER BY sd.idSaleDetail ASC;

  SELECT
    sp.idSalePayment,
    sp.idBusiness,
    sp.idSale,
    sp.idPaymentMethod,
    pm.code AS payment_method_code,
    pm.name AS payment_method_name,
    pm.affects_cash,
    sp.amount,
    sp.status,
    sp.idCashSession,
    sp.idCashSettlement,
    sp.reference,
    sp.observation,
    sp.created_at,
    sp.collected_at,
    sp.confirmed_at,
    sp.cancelled_at
  FROM sale_payments sp
  INNER JOIN payment_methods pm
    ON pm.idPaymentMethod = sp.idPaymentMethod
    AND pm.idBusiness = sp.idBusiness
  WHERE sp.idBusiness = p_idBusiness
    AND sp.idSale = p_idSale
  ORDER BY sp.idSalePayment ASC;

  SELECT
    sdv.idSaleDelivery,
    sdv.idBusiness,
    sdv.idSale,
    sdv.assigned_to_user_id,
    assigned_user.name AS assigned_user_name,
    sdv.status,
    sdv.recipient_name,
    sdv.recipient_phone,
    sdv.delivery_address,
    sdv.delivery_reference,
    sdv.scheduled_at,
    sdv.assigned_at,
    sdv.out_for_delivery_at,
    sdv.delivered_at,
    sdv.failed_at,
    sdv.cancelled_at,
    sdv.failure_reason,
    sdv.observation,
    sdv.created_at,
    sdv.updated_at
  FROM sale_deliveries sdv
  LEFT JOIN users assigned_user ON assigned_user.idUser = sdv.assigned_to_user_id
  WHERE sdv.idBusiness = p_idBusiness
    AND sdv.idSale = p_idSale
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_products_with_stock_by_deposit;
DELIMITER $$

CREATE PROCEDURE sp_get_products_with_stock_by_deposit(
  IN p_idBusiness INT,
  IN p_idDeposit INT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM deposits
    WHERE idDeposit = p_idDeposit
      AND idBusiness = p_idBusiness
      AND is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El deposito indicado no pertenece al negocio o esta inactivo';
  END IF;

  SELECT
    p.idProduct,
    p.idBusiness,
    p.idProductCategory,
    pc.name AS category_name,
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
    COALESCE(s.quantity, 0) AS stock_quantity
  FROM products p
  LEFT JOIN product_categories pc
    ON pc.idProductCategory = p.idProductCategory
    AND pc.idBusiness = p.idBusiness
  LEFT JOIN stock s
    ON s.idBusiness = p.idBusiness
    AND s.idProduct = p.idProduct
    AND s.idDeposit = p_idDeposit
  WHERE p.idBusiness = p_idBusiness
    AND p.is_active = 1
    AND COALESCE(s.quantity, 0) > 0
  ORDER BY p.name ASC;
END$$

DELIMITER ;
