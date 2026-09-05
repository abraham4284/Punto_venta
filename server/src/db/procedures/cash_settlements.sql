DROP PROCEDURE IF EXISTS sp_cash_settlement_create;
DELIMITER $$

CREATE PROCEDURE sp_cash_settlement_create(
  IN p_idBusiness INT,
  IN p_collectorUserId INT,
  IN p_receivedByUserId INT,
  IN p_idCashSession BIGINT,
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_idCashSettlement BIGINT;
  DECLARE v_totalAmount DECIMAL(18,2);
  DECLARE v_paymentsCount INT;
  DECLARE v_cashSessionStatus VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT status
  INTO v_cashSessionStatus
  FROM cash_sessions
  WHERE idBusiness = p_idBusiness
    AND idCashSession = p_idCashSession
  LIMIT 1
  FOR UPDATE;

  IF v_cashSessionStatus IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_SESSION_NOT_FOUND';
  END IF;

  IF v_cashSessionStatus <> 'OPEN' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_SESSION_CLOSED';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM business_users bu
    INNER JOIN users u ON u.idUser = bu.idUser
    WHERE bu.idBusiness = p_idBusiness
      AND bu.idUser = p_collectorUserId
      AND bu.role IN ('DELIVERY', 'ADMIN', 'OWNER')
      AND bu.is_active = 1
      AND u.is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'COLLECTOR_USER_NOT_FOUND';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM business_users bu
    INNER JOIN users u ON u.idUser = bu.idUser
    WHERE bu.idBusiness = p_idBusiness
      AND bu.idUser = p_receivedByUserId
      AND bu.role IN ('ADMIN', 'OWNER')
      AND bu.is_active = 1
      AND u.is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RECEIVER_USER_NOT_FOUND';
  END IF;

  SELECT
    COUNT(*),
    COALESCE(SUM(sp.amount), 0)
  INTO v_paymentsCount, v_totalAmount
  FROM sale_payments sp
  INNER JOIN payment_methods pm
    ON pm.idBusiness = sp.idBusiness
    AND pm.idPaymentMethod = sp.idPaymentMethod
  WHERE sp.idBusiness = p_idBusiness
    AND sp.collected_by_user_id = p_collectorUserId
    AND sp.status = 'COLLECTED'
    AND sp.idCashSettlement IS NULL
    AND pm.affects_cash = 1;

  IF v_paymentsCount = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NO_COLLECTED_CASH_PAYMENTS_TO_SETTLE';
  END IF;

  INSERT INTO cash_settlements (
    idBusiness,
    collector_user_id,
    received_by_user_id,
    idCashSession,
    total_amount,
    observation,
    settled_at,
    created_at
  )
  VALUES (
    p_idBusiness,
    p_collectorUserId,
    p_receivedByUserId,
    p_idCashSession,
    v_totalAmount,
    p_observation,
    NOW(),
    NOW()
  );

  SET v_idCashSettlement = LAST_INSERT_ID();

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
    'PAYMENT_SETTLED',
    'COLLECTED',
    'CONFIRMED',
    JSON_OBJECT('idCashSettlement', v_idCashSettlement, 'idCashSession', p_idCashSession),
    p_receivedByUserId
  FROM sale_payments sp
  INNER JOIN payment_methods pm
    ON pm.idBusiness = sp.idBusiness
    AND pm.idPaymentMethod = sp.idPaymentMethod
  WHERE sp.idBusiness = p_idBusiness
    AND sp.collected_by_user_id = p_collectorUserId
    AND sp.status = 'COLLECTED'
    AND sp.idCashSettlement IS NULL
    AND pm.affects_cash = 1;

  UPDATE sale_payments sp
  INNER JOIN payment_methods pm
    ON pm.idBusiness = sp.idBusiness
    AND pm.idPaymentMethod = sp.idPaymentMethod
  SET
    sp.status = 'CONFIRMED',
    sp.confirmed_by_user_id = p_receivedByUserId,
    sp.confirmed_at = NOW(),
    sp.idCashSession = p_idCashSession,
    sp.idCashSettlement = v_idCashSettlement
  WHERE sp.idBusiness = p_idBusiness
    AND sp.collected_by_user_id = p_collectorUserId
    AND sp.status = 'COLLECTED'
    AND sp.idCashSettlement IS NULL
    AND pm.affects_cash = 1;

  COMMIT;

  CALL sp_cash_settlement_get_by_id(p_idBusiness, v_idCashSettlement);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_settlement_get_by_id;
DELIMITER $$

CREATE PROCEDURE sp_cash_settlement_get_by_id(
  IN p_idBusiness INT,
  IN p_idCashSettlement BIGINT
)
BEGIN
  SELECT
    cs.idCashSettlement,
    cs.idBusiness,
    cs.collector_user_id,
    collector.name AS collector_user_name,
    cs.received_by_user_id,
    receiver.name AS received_by_user_name,
    cs.idCashSession,
    cs.total_amount,
    cs.observation,
    cs.settled_at,
    cs.created_at
  FROM cash_settlements cs
  INNER JOIN users collector ON collector.idUser = cs.collector_user_id
  INNER JOIN users receiver ON receiver.idUser = cs.received_by_user_id
  WHERE cs.idBusiness = p_idBusiness
    AND cs.idCashSettlement = p_idCashSettlement
  LIMIT 1;

  SELECT
    sp.idSalePayment,
    sp.idSale,
    s.sale_number,
    sp.idPaymentMethod,
    pm.name AS payment_method_name,
    sp.amount,
    sp.status,
    sp.collected_at,
    sp.confirmed_at,
    sp.reference,
    sp.observation
  FROM sale_payments sp
  INNER JOIN sales s
    ON s.idBusiness = sp.idBusiness
    AND s.idSale = sp.idSale
  INNER JOIN payment_methods pm
    ON pm.idBusiness = sp.idBusiness
    AND pm.idPaymentMethod = sp.idPaymentMethod
  WHERE sp.idBusiness = p_idBusiness
    AND sp.idCashSettlement = p_idCashSettlement
  ORDER BY sp.idSalePayment ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_settlements_list;
DELIMITER $$

CREATE PROCEDURE sp_cash_settlements_list(
  IN p_idBusiness INT,
  IN p_limit INT,
  IN p_offset INT,
  IN p_collectorUserId INT,
  IN p_startDate DATETIME,
  IN p_endDate DATETIME
)
BEGIN
  SELECT
    cs.idCashSettlement,
    cs.idBusiness,
    cs.collector_user_id,
    collector.name AS collector_user_name,
    cs.received_by_user_id,
    receiver.name AS received_by_user_name,
    cs.idCashSession,
    cs.total_amount,
    cs.observation,
    cs.settled_at,
    cs.created_at
  FROM cash_settlements cs
  INNER JOIN users collector ON collector.idUser = cs.collector_user_id
  INNER JOIN users receiver ON receiver.idUser = cs.received_by_user_id
  WHERE cs.idBusiness = p_idBusiness
    AND (p_collectorUserId IS NULL OR cs.collector_user_id = p_collectorUserId)
    AND (p_startDate IS NULL OR cs.settled_at >= p_startDate)
    AND (p_endDate IS NULL OR cs.settled_at <= p_endDate)
  ORDER BY cs.settled_at DESC, cs.idCashSettlement DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM cash_settlements cs
  WHERE cs.idBusiness = p_idBusiness
    AND (p_collectorUserId IS NULL OR cs.collector_user_id = p_collectorUserId)
    AND (p_startDate IS NULL OR cs.settled_at >= p_startDate)
    AND (p_endDate IS NULL OR cs.settled_at <= p_endDate);
END$$

DELIMITER ;
