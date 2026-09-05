DROP PROCEDURE IF EXISTS sp_sale_payment_create;
DELIMITER $$

CREATE PROCEDURE sp_sale_payment_create(
  IN p_idBusiness INT,
  IN p_idSale INT,
  IN p_idPaymentMethod INT,
  IN p_amount DECIMAL(18,2),
  IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_createdByUserId INT,
  IN p_idCashSession BIGINT,
  IN p_reference VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_idSalePayment BIGINT;
  DECLARE v_saleTotal DECIMAL(18,2);
  DECLARE v_activePaymentsTotal DECIMAL(18,2);
  DECLARE v_methodActive TINYINT;
  DECLARE v_cashSessionStatus VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  IF p_status NOT IN ('PENDING', 'CONFIRMED') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_INITIAL_PAYMENT_STATUS';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PAYMENT_AMOUNT_MUST_BE_POSITIVE';
  END IF;

  SELECT total
  INTO v_saleTotal
  FROM sales
  WHERE idBusiness = p_idBusiness
    AND idSale = p_idSale
    AND status = 'COMPLETED'
  LIMIT 1
  FOR UPDATE;

  IF v_saleTotal IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SALE_NOT_FOUND_OR_NOT_ACTIVE';
  END IF;

  SELECT is_active
  INTO v_methodActive
  FROM payment_methods
  WHERE idBusiness = p_idBusiness
    AND idPaymentMethod = p_idPaymentMethod
  LIMIT 1;

  IF v_methodActive IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PAYMENT_METHOD_NOT_FOUND';
  END IF;

  IF v_methodActive = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PAYMENT_METHOD_INACTIVE';
  END IF;

  IF p_status = 'CONFIRMED' THEN
    IF p_idCashSession IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'OPEN_CASH_SESSION_REQUIRED';
    END IF;

    SELECT status
    INTO v_cashSessionStatus
    FROM cash_sessions
    WHERE idBusiness = p_idBusiness
      AND idCashSession = p_idCashSession
    LIMIT 1;

    IF v_cashSessionStatus IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_SESSION_NOT_FOUND';
    END IF;

    IF v_cashSessionStatus <> 'OPEN' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_SESSION_CLOSED';
    END IF;
  END IF;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_activePaymentsTotal
  FROM sale_payments
  WHERE idBusiness = p_idBusiness
    AND idSale = p_idSale
    AND status IN ('PENDING', 'COLLECTED', 'CONFIRMED');

  IF v_activePaymentsTotal + p_amount > v_saleTotal THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SALE_PAYMENT_OVERPAYMENT_NOT_ALLOWED';
  END IF;

  INSERT INTO sale_payments (
    idBusiness,
    idSale,
    idPaymentMethod,
    amount,
    status,
    created_by_user_id,
    confirmed_by_user_id,
    confirmed_at,
    idCashSession,
    reference,
    observation,
    created_at
  )
  VALUES (
    p_idBusiness,
    p_idSale,
    p_idPaymentMethod,
    p_amount,
    p_status,
    p_createdByUserId,
    CASE WHEN p_status = 'CONFIRMED' THEN p_createdByUserId ELSE NULL END,
    CASE WHEN p_status = 'CONFIRMED' THEN NOW() ELSE NULL END,
    CASE WHEN p_status = 'CONFIRMED' THEN p_idCashSession ELSE NULL END,
    NULLIF(TRIM(COALESCE(p_reference, '')), ''),
    NULLIF(TRIM(COALESCE(p_observation, '')), ''),
    NOW()
  );

  SET v_idSalePayment = LAST_INSERT_ID();

  INSERT INTO sale_payment_events (
    idBusiness,
    idSalePayment,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id,
    created_at
  )
  VALUES (
    p_idBusiness,
    v_idSalePayment,
    'PAYMENT_CREATED',
    NULL,
    p_status,
    JSON_OBJECT('amount', p_amount, 'idPaymentMethod', p_idPaymentMethod),
    p_createdByUserId,
    NOW()
  );

  CALL sp_sale_payment_get_by_id(p_idBusiness, v_idSalePayment);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_sale_payment_get_by_id;
DELIMITER $$

CREATE PROCEDURE sp_sale_payment_get_by_id(
  IN p_idBusiness INT,
  IN p_idSalePayment BIGINT
)
BEGIN
  SELECT
    sp.idSalePayment,
    sp.idBusiness,
    sp.idSale,
    s.sale_number,
    sp.idPaymentMethod,
    pm.code AS payment_method_code,
    pm.name AS payment_method_name,
    pm.affects_cash,
    sp.amount,
    sp.status,
    sp.created_by_user_id,
    createdUser.name AS created_by_user_name,
    sp.collected_by_user_id,
    collectedUser.name AS collected_by_user_name,
    sp.collected_at,
    sp.confirmed_by_user_id,
    confirmedUser.name AS confirmed_by_user_name,
    sp.confirmed_at,
    sp.cancelled_by_user_id,
    cancelledUser.name AS cancelled_by_user_name,
    sp.cancelled_at,
    sp.cancellation_reason,
    sp.idCashSession,
    sp.idCashSettlement,
    sp.reference,
    sp.observation,
    sp.created_at,
    sp.updated_at
  FROM sale_payments sp
  INNER JOIN sales s
    ON s.idBusiness = sp.idBusiness
    AND s.idSale = sp.idSale
  INNER JOIN payment_methods pm
    ON pm.idBusiness = sp.idBusiness
    AND pm.idPaymentMethod = sp.idPaymentMethod
  INNER JOIN users createdUser ON createdUser.idUser = sp.created_by_user_id
  LEFT JOIN users collectedUser ON collectedUser.idUser = sp.collected_by_user_id
  LEFT JOIN users confirmedUser ON confirmedUser.idUser = sp.confirmed_by_user_id
  LEFT JOIN users cancelledUser ON cancelledUser.idUser = sp.cancelled_by_user_id
  WHERE sp.idBusiness = p_idBusiness
    AND sp.idSalePayment = p_idSalePayment
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_sale_payment_list_by_sale;
DELIMITER $$

CREATE PROCEDURE sp_sale_payment_list_by_sale(
  IN p_idBusiness INT,
  IN p_idSale INT
)
BEGIN
  SELECT
    sp.idSalePayment,
    sp.idBusiness,
    sp.idSale,
    s.sale_number,
    sp.idPaymentMethod,
    pm.code AS payment_method_code,
    pm.name AS payment_method_name,
    pm.affects_cash,
    sp.amount,
    sp.status,
    sp.created_by_user_id,
    createdUser.name AS created_by_user_name,
    sp.collected_by_user_id,
    collectedUser.name AS collected_by_user_name,
    sp.collected_at,
    sp.confirmed_by_user_id,
    confirmedUser.name AS confirmed_by_user_name,
    sp.confirmed_at,
    sp.cancelled_by_user_id,
    cancelledUser.name AS cancelled_by_user_name,
    sp.cancelled_at,
    sp.cancellation_reason,
    sp.idCashSession,
    sp.idCashSettlement,
    sp.reference,
    sp.observation,
    sp.created_at,
    sp.updated_at
  FROM sale_payments sp
  INNER JOIN sales s
    ON s.idBusiness = sp.idBusiness
    AND s.idSale = sp.idSale
  INNER JOIN payment_methods pm
    ON pm.idBusiness = sp.idBusiness
    AND pm.idPaymentMethod = sp.idPaymentMethod
  INNER JOIN users createdUser ON createdUser.idUser = sp.created_by_user_id
  LEFT JOIN users collectedUser ON collectedUser.idUser = sp.collected_by_user_id
  LEFT JOIN users confirmedUser ON confirmedUser.idUser = sp.confirmed_by_user_id
  LEFT JOIN users cancelledUser ON cancelledUser.idUser = sp.cancelled_by_user_id
  WHERE sp.idBusiness = p_idBusiness
    AND sp.idSale = p_idSale
  ORDER BY sp.created_at ASC, sp.idSalePayment ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_sale_payment_update_pending;
DELIMITER $$

CREATE PROCEDURE sp_sale_payment_update_pending(
  IN p_idBusiness INT,
  IN p_idSalePayment BIGINT,
  IN p_actorUserId INT,
  IN p_idPaymentMethod INT,
  IN p_amount DECIMAL(18,2),
  IN p_reference VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_idSale INT;
  DECLARE v_saleTotal DECIMAL(18,2);
  DECLARE v_otherPaymentsTotal DECIMAL(18,2);
  DECLARE v_previousStatus VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_previousMethod INT;
  DECLARE v_methodActive TINYINT;

  SELECT idSale, status, idPaymentMethod
  INTO v_idSale, v_previousStatus, v_previousMethod
  FROM sale_payments
  WHERE idBusiness = p_idBusiness
    AND idSalePayment = p_idSalePayment
  LIMIT 1
  FOR UPDATE;

  IF v_idSale IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SALE_PAYMENT_NOT_FOUND';
  END IF;

  IF v_previousStatus <> 'PENDING' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ONLY_PENDING_PAYMENT_CAN_BE_UPDATED';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PAYMENT_AMOUNT_MUST_BE_POSITIVE';
  END IF;

  SELECT total
  INTO v_saleTotal
  FROM sales
  WHERE idBusiness = p_idBusiness
    AND idSale = v_idSale
    AND status = 'COMPLETED'
  LIMIT 1
  FOR UPDATE;

  SELECT is_active
  INTO v_methodActive
  FROM payment_methods
  WHERE idBusiness = p_idBusiness
    AND idPaymentMethod = p_idPaymentMethod
  LIMIT 1;

  IF v_methodActive IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PAYMENT_METHOD_NOT_FOUND';
  END IF;

  IF v_methodActive = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PAYMENT_METHOD_INACTIVE';
  END IF;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_otherPaymentsTotal
  FROM sale_payments
  WHERE idBusiness = p_idBusiness
    AND idSale = v_idSale
    AND idSalePayment <> p_idSalePayment
    AND status IN ('PENDING', 'COLLECTED', 'CONFIRMED');

  IF v_otherPaymentsTotal + p_amount > v_saleTotal THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SALE_PAYMENT_OVERPAYMENT_NOT_ALLOWED';
  END IF;

  UPDATE sale_payments
  SET
    idPaymentMethod = p_idPaymentMethod,
    amount = p_amount,
    reference = NULLIF(TRIM(COALESCE(p_reference, '')), ''),
    observation = NULLIF(TRIM(COALESCE(p_observation, '')), '')
  WHERE idBusiness = p_idBusiness
    AND idSalePayment = p_idSalePayment;

  INSERT INTO sale_payment_events (
    idBusiness,
    idSalePayment,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  VALUES (
    p_idBusiness,
    p_idSalePayment,
    CASE WHEN v_previousMethod <> p_idPaymentMethod THEN 'PAYMENT_METHOD_CHANGED' ELSE 'PAYMENT_UPDATED' END,
    v_previousStatus,
    v_previousStatus,
    JSON_OBJECT('amount', p_amount, 'idPaymentMethod', p_idPaymentMethod),
    p_actorUserId
  );

  CALL sp_sale_payment_get_by_id(p_idBusiness, p_idSalePayment);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_sale_payment_cancel_pending;
DELIMITER $$

CREATE PROCEDURE sp_sale_payment_cancel_pending(
  IN p_idBusiness INT,
  IN p_idSalePayment BIGINT,
  IN p_actorUserId INT,
  IN p_reason VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  SELECT status
  INTO v_status
  FROM sale_payments
  WHERE idBusiness = p_idBusiness
    AND idSalePayment = p_idSalePayment
  LIMIT 1
  FOR UPDATE;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SALE_PAYMENT_NOT_FOUND';
  END IF;

  IF v_status <> 'PENDING' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ONLY_PENDING_PAYMENT_CAN_BE_CANCELLED';
  END IF;

  UPDATE sale_payments
  SET
    status = 'CANCELLED',
    cancelled_by_user_id = p_actorUserId,
    cancelled_at = NOW(),
    cancellation_reason = NULLIF(TRIM(COALESCE(p_reason, '')), '')
  WHERE idBusiness = p_idBusiness
    AND idSalePayment = p_idSalePayment;

  INSERT INTO sale_payment_events (
    idBusiness,
    idSalePayment,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  VALUES (
    p_idBusiness,
    p_idSalePayment,
    'PAYMENT_CANCELLED',
    v_status,
    'CANCELLED',
    JSON_OBJECT('reason', p_reason),
    p_actorUserId
  );

  CALL sp_sale_payment_get_by_id(p_idBusiness, p_idSalePayment);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_sale_payment_collect;
DELIMITER $$

CREATE PROCEDURE sp_sale_payment_collect(
  IN p_idBusiness INT,
  IN p_idSalePayment BIGINT,
  IN p_actorUserId INT,
  IN p_idPaymentMethod INT,
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_currentMethod INT;
  DECLARE v_methodAffectsCash TINYINT;
  DECLARE v_deliveryAssignedUser INT;
  DECLARE v_deliveryStatus VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  SELECT sp.status, sp.idPaymentMethod, sd.assigned_to_user_id, sd.status
  INTO v_status, v_currentMethod, v_deliveryAssignedUser, v_deliveryStatus
  FROM sale_payments sp
  INNER JOIN sale_deliveries sd
    ON sd.idBusiness = sp.idBusiness
    AND sd.idSale = sp.idSale
  WHERE sp.idBusiness = p_idBusiness
    AND sp.idSalePayment = p_idSalePayment
  LIMIT 1
  FOR UPDATE;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SALE_PAYMENT_NOT_FOUND';
  END IF;

  IF v_status <> 'PENDING' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ONLY_PENDING_PAYMENT_CAN_BE_COLLECTED';
  END IF;

  IF v_deliveryStatus <> 'OUT_FOR_DELIVERY' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_MUST_BE_OUT_FOR_DELIVERY';
  END IF;

  IF v_deliveryAssignedUser IS NULL OR v_deliveryAssignedUser <> p_actorUserId THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_PAYMENT_FORBIDDEN';
  END IF;

  IF p_idPaymentMethod IS NOT NULL AND p_idPaymentMethod <> v_currentMethod THEN
    SELECT affects_cash
    INTO v_methodAffectsCash
    FROM payment_methods
    WHERE idBusiness = p_idBusiness
      AND idPaymentMethod = p_idPaymentMethod
      AND is_active = 1
    LIMIT 1;

    IF v_methodAffectsCash IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PAYMENT_METHOD_NOT_FOUND';
    END IF;

    IF v_methodAffectsCash <> 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_COLLECTION_REQUIRES_CASH_METHOD';
    END IF;

    UPDATE sale_payments
    SET idPaymentMethod = p_idPaymentMethod
    WHERE idBusiness = p_idBusiness
      AND idSalePayment = p_idSalePayment;

    INSERT INTO sale_payment_events (
      idBusiness,
      idSalePayment,
      event_type,
      previous_status,
      new_status,
      metadata,
      created_by_user_id
    )
    VALUES (
      p_idBusiness,
      p_idSalePayment,
      'PAYMENT_METHOD_CHANGED',
      v_status,
      v_status,
      JSON_OBJECT('previousIdPaymentMethod', v_currentMethod, 'newIdPaymentMethod', p_idPaymentMethod),
      p_actorUserId
    );
  END IF;

  UPDATE sale_payments
  SET
    status = 'COLLECTED',
    collected_by_user_id = p_actorUserId,
    collected_at = NOW(),
    observation = COALESCE(NULLIF(TRIM(COALESCE(p_observation, '')), ''), observation)
  WHERE idBusiness = p_idBusiness
    AND idSalePayment = p_idSalePayment;

  INSERT INTO sale_payment_events (
    idBusiness,
    idSalePayment,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  VALUES (
    p_idBusiness,
    p_idSalePayment,
    'PAYMENT_COLLECTED',
    v_status,
    'COLLECTED',
    JSON_OBJECT('collectedByUserId', p_actorUserId),
    p_actorUserId
  );

  CALL sp_sale_payment_get_by_id(p_idBusiness, p_idSalePayment);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_sale_payment_confirm;
DELIMITER $$

CREATE PROCEDURE sp_sale_payment_confirm(
  IN p_idBusiness INT,
  IN p_idSalePayment BIGINT,
  IN p_actorUserId INT,
  IN p_idCashSession BIGINT
)
BEGIN
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_cashSessionStatus VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  SELECT status
  INTO v_status
  FROM sale_payments
  WHERE idBusiness = p_idBusiness
    AND idSalePayment = p_idSalePayment
  LIMIT 1
  FOR UPDATE;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SALE_PAYMENT_NOT_FOUND';
  END IF;

  IF v_status NOT IN ('PENDING', 'COLLECTED') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ONLY_PENDING_OR_COLLECTED_PAYMENT_CAN_BE_CONFIRMED';
  END IF;

  SELECT status
  INTO v_cashSessionStatus
  FROM cash_sessions
  WHERE idBusiness = p_idBusiness
    AND idCashSession = p_idCashSession
  LIMIT 1;

  IF v_cashSessionStatus IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_SESSION_NOT_FOUND';
  END IF;

  IF v_cashSessionStatus <> 'OPEN' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_SESSION_CLOSED';
  END IF;

  UPDATE sale_payments
  SET
    status = 'CONFIRMED',
    confirmed_by_user_id = p_actorUserId,
    confirmed_at = NOW(),
    idCashSession = p_idCashSession
  WHERE idBusiness = p_idBusiness
    AND idSalePayment = p_idSalePayment;

  INSERT INTO sale_payment_events (
    idBusiness,
    idSalePayment,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  VALUES (
    p_idBusiness,
    p_idSalePayment,
    'PAYMENT_CONFIRMED',
    v_status,
    'CONFIRMED',
    JSON_OBJECT('idCashSession', p_idCashSession),
    p_actorUserId
  );

  CALL sp_sale_payment_get_by_id(p_idBusiness, p_idSalePayment);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_sale_payment_summary_by_sale;
DELIMITER $$

CREATE PROCEDURE sp_sale_payment_summary_by_sale(
  IN p_idBusiness INT,
  IN p_idSale INT
)
BEGIN
  SELECT
    s.idSale,
    s.total,
    COALESCE(SUM(CASE WHEN sp.status = 'CONFIRMED' THEN sp.amount ELSE 0 END), 0) AS confirmedAmount,
    COALESCE(SUM(CASE WHEN sp.status = 'COLLECTED' THEN sp.amount ELSE 0 END), 0) AS collectedAmount,
    COALESCE(SUM(CASE WHEN sp.status = 'PENDING' THEN sp.amount ELSE 0 END), 0) AS pendingPlannedAmount,
    COALESCE(SUM(CASE WHEN sp.status IN ('COLLECTED','CONFIRMED') THEN sp.amount ELSE 0 END), 0) AS paidAmount,
    s.total - COALESCE(SUM(CASE WHEN sp.status IN ('COLLECTED','CONFIRMED') THEN sp.amount ELSE 0 END), 0) AS balanceDue,
    CASE
      WHEN COALESCE(SUM(CASE WHEN sp.status IN ('COLLECTED','CONFIRMED') THEN sp.amount ELSE 0 END), 0) = 0 THEN 'UNPAID'
      WHEN COALESCE(SUM(CASE WHEN sp.status IN ('COLLECTED','CONFIRMED') THEN sp.amount ELSE 0 END), 0) < s.total THEN 'PARTIALLY_PAID'
      ELSE 'PAID'
    END AS paymentStatus,
    GROUP_CONCAT(DISTINCT pm.name ORDER BY pm.name SEPARATOR ', ') AS paymentMethods
  FROM sales s
  LEFT JOIN sale_payments sp
    ON sp.idBusiness = s.idBusiness
    AND sp.idSale = s.idSale
    AND sp.status <> 'CANCELLED'
  LEFT JOIN payment_methods pm
    ON pm.idBusiness = sp.idBusiness
    AND pm.idPaymentMethod = sp.idPaymentMethod
  WHERE s.idBusiness = p_idBusiness
    AND s.idSale = p_idSale
  GROUP BY s.idSale, s.total;
END$$

DELIMITER ;
