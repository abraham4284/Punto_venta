DROP PROCEDURE IF EXISTS sp_cash_settlement_create;
DELIMITER $$

CREATE PROCEDURE sp_cash_settlement_create(
  IN p_idBusiness INT,
  IN p_collectorUserId INT,
  IN p_receivedByUserId INT,
  IN p_idCashSession BIGINT,
  IN p_salePaymentIdsCsv TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'CASH_SETTLEMENT_CREATE_USES_SERVICE_TRANSACTION';
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


DROP PROCEDURE IF EXISTS sp_cash_settlement_pending_list;
DELIMITER $$

CREATE PROCEDURE sp_cash_settlement_pending_list(
  IN p_idBusiness INT,
  IN p_collectorUserId INT
)
BEGIN
  SELECT
    sp.collected_by_user_id AS collector_user_id,
    collector.name AS collector_user_name,
    sp.idSalePayment,
    sp.idSale,
    s.sale_number,
    sp.amount,
    sp.collected_at,
    customer.name AS customer_name
  FROM sale_payments sp
  INNER JOIN payment_methods pm
    ON pm.idBusiness = sp.idBusiness
    AND pm.idPaymentMethod = sp.idPaymentMethod
  INNER JOIN users collector
    ON collector.idUser = sp.collected_by_user_id
  INNER JOIN sales s
    ON s.idBusiness = sp.idBusiness
    AND s.idSale = sp.idSale
  LEFT JOIN customers customer
    ON customer.idBusiness = s.idBusiness
    AND customer.idCustomer = s.idCustomer
  WHERE sp.idBusiness = p_idBusiness
    AND sp.status = 'COLLECTED'
    AND sp.idCashSettlement IS NULL
    AND pm.affects_cash = 1
    AND (p_collectorUserId IS NULL OR sp.collected_by_user_id = p_collectorUserId)
  ORDER BY collector.name ASC, sp.collected_at ASC, sp.idSalePayment ASC;
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
