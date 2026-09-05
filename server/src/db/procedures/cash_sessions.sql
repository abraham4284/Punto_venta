DROP PROCEDURE IF EXISTS sp_cash_session_open;
DELIMITER $$

CREATE PROCEDURE sp_cash_session_open(
  IN p_idBusiness INT,
  IN p_idCashRegister INT,
  IN p_idUser INT,
  IN p_openingAmount DECIMAL(18,2),
  IN p_openingObservation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_idCashSession BIGINT;
  DECLARE v_registerActive TINYINT;
  DECLARE v_openSessionId BIGINT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_openingAmount IS NULL OR p_openingAmount < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El monto inicial no puede ser negativo';
  END IF;

  START TRANSACTION;

  SELECT is_active
  INTO v_registerActive
  FROM cash_registers
  WHERE idBusiness = p_idBusiness
    AND idCashRegister = p_idCashRegister
  LIMIT 1
  FOR UPDATE;

  IF v_registerActive IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_REGISTER_NOT_FOUND';
  END IF;

  IF v_registerActive = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_REGISTER_INACTIVE';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM business_users bu
    INNER JOIN users u ON u.idUser = bu.idUser
    WHERE bu.idBusiness = p_idBusiness
      AND bu.idUser = p_idUser
      AND bu.is_active = 1
      AND u.is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario no autorizado para abrir caja';
  END IF;

  SELECT idCashSession
  INTO v_openSessionId
  FROM cash_sessions
  WHERE idBusiness = p_idBusiness
    AND idCashRegister = p_idCashRegister
    AND status = 'OPEN'
  LIMIT 1
  FOR UPDATE;

  IF v_openSessionId IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_SESSION_ALREADY_OPEN';
  END IF;

  INSERT INTO cash_sessions (
    idBusiness,
    idCashRegister,
    opened_by_user_id,
    status,
    opened_at,
    opening_amount,
    opening_observation
  )
  VALUES (
    p_idBusiness,
    p_idCashRegister,
    p_idUser,
    'OPEN',
    NOW(),
    p_openingAmount,
    NULLIF(TRIM(COALESCE(p_openingObservation, '')), '')
  );

  SET v_idCashSession = LAST_INSERT_ID();

  COMMIT;

  CALL sp_cash_session_get_by_id(p_idBusiness, v_idCashSession);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_session_get_current;
DELIMITER $$

CREATE PROCEDURE sp_cash_session_get_current(
  IN p_idBusiness INT,
  IN p_idCashRegister INT
)
BEGIN
  SELECT
    cs.idCashSession,
    cs.idBusiness,
    cs.idCashRegister,
    cr.name AS cashRegisterName,
    cr.is_default AS cashRegisterIsDefault,
    cs.opened_by_user_id,
    openedUser.name AS openedByUserName,
    cs.closed_by_user_id,
    closedUser.name AS closedByUserName,
    cs.status,
    cs.opened_at,
    cs.closed_at,
    cs.opening_amount,
    cs.expected_cash_amount,
    cs.counted_cash_amount,
    cs.difference_amount,
    cs.opening_observation,
    cs.closing_observation,
    cs.created_at,
    cs.updated_at
  FROM cash_sessions cs
  INNER JOIN cash_registers cr
    ON cr.idCashRegister = cs.idCashRegister
    AND cr.idBusiness = cs.idBusiness
  INNER JOIN users openedUser ON openedUser.idUser = cs.opened_by_user_id
  LEFT JOIN users closedUser ON closedUser.idUser = cs.closed_by_user_id
  WHERE cs.idBusiness = p_idBusiness
    AND cs.status = 'OPEN'
    AND (p_idCashRegister IS NULL OR cs.idCashRegister = p_idCashRegister)
  ORDER BY cr.is_default DESC, cs.opened_at DESC
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_session_get_by_id;
DELIMITER $$

CREATE PROCEDURE sp_cash_session_get_by_id(
  IN p_idBusiness INT,
  IN p_idCashSession BIGINT
)
BEGIN
  SELECT
    cs.idCashSession,
    cs.idBusiness,
    cs.idCashRegister,
    cr.name AS cashRegisterName,
    cr.is_default AS cashRegisterIsDefault,
    cs.opened_by_user_id,
    openedUser.name AS openedByUserName,
    cs.closed_by_user_id,
    closedUser.name AS closedByUserName,
    cs.status,
    cs.opened_at,
    cs.closed_at,
    cs.opening_amount,
    cs.expected_cash_amount,
    cs.counted_cash_amount,
    cs.difference_amount,
    cs.opening_observation,
    cs.closing_observation,
    cs.created_at,
    cs.updated_at
  FROM cash_sessions cs
  INNER JOIN cash_registers cr
    ON cr.idCashRegister = cs.idCashRegister
    AND cr.idBusiness = cs.idBusiness
  INNER JOIN users openedUser ON openedUser.idUser = cs.opened_by_user_id
  LEFT JOIN users closedUser ON closedUser.idUser = cs.closed_by_user_id
  WHERE cs.idBusiness = p_idBusiness
    AND cs.idCashSession = p_idCashSession
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_session_get_live_summary;
DELIMITER $$

CREATE PROCEDURE sp_cash_session_get_live_summary(
  IN p_idBusiness INT,
  IN p_idCashSession BIGINT
)
BEGIN
  DECLARE v_openingAmount DECIMAL(18,2);
  DECLARE v_cashSales DECIMAL(18,2) DEFAULT 0;
  DECLARE v_nonCashSales DECIMAL(18,2) DEFAULT 0;
  DECLARE v_manualIncome DECIMAL(18,2) DEFAULT 0;
  DECLARE v_manualExpense DECIMAL(18,2) DEFAULT 0;
  DECLARE v_totalSales DECIMAL(18,2) DEFAULT 0;
  DECLARE v_salesCount INT DEFAULT 0;
  DECLARE v_cancelledSalesCount INT DEFAULT 0;

  IF NOT EXISTS (
    SELECT 1
    FROM cash_sessions
    WHERE idBusiness = p_idBusiness
      AND idCashSession = p_idCashSession
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_SESSION_NOT_FOUND';
  END IF;

  SELECT opening_amount
  INTO v_openingAmount
  FROM cash_sessions
  WHERE idBusiness = p_idBusiness
    AND idCashSession = p_idCashSession
  LIMIT 1;

  SELECT
    COALESCE(SUM(CASE WHEN pm.affects_cash = 1 THEN sp.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN pm.affects_cash = 0 THEN sp.amount ELSE 0 END), 0)
  INTO v_cashSales, v_nonCashSales
  FROM sale_payments sp
  INNER JOIN sales s
    ON s.idSale = sp.idSale
    AND s.idBusiness = sp.idBusiness
  INNER JOIN payment_methods pm
    ON pm.idPaymentMethod = sp.idPaymentMethod
    AND pm.idBusiness = sp.idBusiness
  WHERE sp.idBusiness = p_idBusiness
    AND sp.idCashSession = p_idCashSession
    AND sp.status = 'CONFIRMED'
    AND s.status = 'COMPLETED';

  SELECT COALESCE(SUM(amount), 0)
  INTO v_manualIncome
  FROM cash_movements
  WHERE idBusiness = p_idBusiness
    AND idCashSession = p_idCashSession
    AND movement_type = 'INCOME';

  SELECT COALESCE(SUM(amount), 0)
  INTO v_manualExpense
  FROM cash_movements
  WHERE idBusiness = p_idBusiness
    AND idCashSession = p_idCashSession
    AND movement_type = 'EXPENSE';

  SELECT
    COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total ELSE 0 END), 0),
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END),
    COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)
  INTO v_totalSales, v_salesCount, v_cancelledSalesCount
  FROM sales
  WHERE idBusiness = p_idBusiness
    AND idCashSession = p_idCashSession;

  SELECT
    cs.idCashSession,
    cs.idBusiness,
    cs.idCashRegister,
    cr.name AS cashRegisterName,
    cs.status,
    cs.opened_at,
    cs.closed_at,
    cs.opening_amount AS openingAmount,
    v_cashSales AS cashSales,
    v_nonCashSales AS nonCashSales,
    v_manualIncome AS manualIncome,
    v_manualExpense AS manualExpense,
    (v_openingAmount + v_cashSales + v_manualIncome - v_manualExpense) AS expectedCash,
    v_totalSales AS totalSales,
    v_salesCount AS salesCount,
    v_cancelledSalesCount AS cancelledSalesCount
  FROM cash_sessions cs
  INNER JOIN cash_registers cr
    ON cr.idCashRegister = cs.idCashRegister
    AND cr.idBusiness = cs.idBusiness
  WHERE cs.idBusiness = p_idBusiness
    AND cs.idCashSession = p_idCashSession;

  SELECT
    pm.idPaymentMethod,
    pm.code AS paymentMethodCode,
    pm.name AS paymentMethodName,
    pm.affects_cash AS affectsCash,
    COUNT(sp.idSalePayment) AS salesCount,
    COUNT(sp.idSalePayment) AS paymentsCount,
    COALESCE(SUM(sp.amount), 0) AS totalAmount
  FROM sale_payments sp
  INNER JOIN sales s
    ON s.idSale = sp.idSale
    AND s.idBusiness = sp.idBusiness
  INNER JOIN payment_methods pm
    ON pm.idPaymentMethod = sp.idPaymentMethod
    AND pm.idBusiness = sp.idBusiness
  WHERE sp.idBusiness = p_idBusiness
    AND sp.idCashSession = p_idCashSession
    AND sp.status = 'CONFIRMED'
    AND s.status = 'COMPLETED'
  GROUP BY pm.idPaymentMethod, pm.code, pm.name, pm.affects_cash
  ORDER BY pm.affects_cash DESC, pm.name ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_session_close;
DELIMITER $$

CREATE PROCEDURE sp_cash_session_close(
  IN p_idBusiness INT,
  IN p_idCashSession BIGINT,
  IN p_idUser INT,
  IN p_countedCashAmount DECIMAL(18,2),
  IN p_closingObservation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_openingAmount DECIMAL(18,2);
  DECLARE v_cashSales DECIMAL(18,2);
  DECLARE v_manualIncome DECIMAL(18,2);
  DECLARE v_manualExpense DECIMAL(18,2);
  DECLARE v_expectedCash DECIMAL(18,2);
  DECLARE v_difference DECIMAL(18,2);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_countedCashAmount IS NULL OR p_countedCashAmount < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El efectivo contado no puede ser negativo';
  END IF;

  START TRANSACTION;

  SELECT status, opening_amount
  INTO v_status, v_openingAmount
  FROM cash_sessions
  WHERE idBusiness = p_idBusiness
    AND idCashSession = p_idCashSession
  LIMIT 1
  FOR UPDATE;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_SESSION_NOT_FOUND';
  END IF;

  IF v_status = 'CLOSED' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASH_SESSION_ALREADY_CLOSED';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM business_users bu
    INNER JOIN users u ON u.idUser = bu.idUser
    WHERE bu.idBusiness = p_idBusiness
      AND bu.idUser = p_idUser
      AND bu.is_active = 1
      AND u.is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario no autorizado para cerrar caja';
  END IF;

  SELECT COALESCE(SUM(sp.amount), 0)
  INTO v_cashSales
  FROM sale_payments sp
  INNER JOIN sales s
    ON s.idSale = sp.idSale
    AND s.idBusiness = sp.idBusiness
  INNER JOIN payment_methods pm
    ON pm.idPaymentMethod = sp.idPaymentMethod
    AND pm.idBusiness = sp.idBusiness
  WHERE sp.idBusiness = p_idBusiness
    AND sp.idCashSession = p_idCashSession
    AND sp.status = 'CONFIRMED'
    AND s.status = 'COMPLETED'
    AND pm.affects_cash = 1;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_manualIncome
  FROM cash_movements
  WHERE idBusiness = p_idBusiness
    AND idCashSession = p_idCashSession
    AND movement_type = 'INCOME';

  SELECT COALESCE(SUM(amount), 0)
  INTO v_manualExpense
  FROM cash_movements
  WHERE idBusiness = p_idBusiness
    AND idCashSession = p_idCashSession
    AND movement_type = 'EXPENSE';

  SET v_expectedCash = v_openingAmount + v_cashSales + v_manualIncome - v_manualExpense;
  SET v_difference = p_countedCashAmount - v_expectedCash;

  INSERT INTO cash_session_payment_summaries (
    idBusiness,
    idCashSession,
    idPaymentMethod,
    payments_count,
    total_amount
  )
  SELECT
    p_idBusiness,
    p_idCashSession,
    sp.idPaymentMethod,
    COUNT(*),
    COALESCE(SUM(sp.amount), 0)
  FROM sale_payments sp
  INNER JOIN sales s
    ON s.idSale = sp.idSale
    AND s.idBusiness = sp.idBusiness
  WHERE sp.idBusiness = p_idBusiness
    AND sp.idCashSession = p_idCashSession
    AND sp.status = 'CONFIRMED'
    AND s.status = 'COMPLETED'
  GROUP BY sp.idPaymentMethod;

  UPDATE cash_sessions
  SET
    status = 'CLOSED',
    closed_by_user_id = p_idUser,
    closed_at = NOW(),
    expected_cash_amount = v_expectedCash,
    counted_cash_amount = p_countedCashAmount,
    difference_amount = v_difference,
    closing_observation = NULLIF(TRIM(COALESCE(p_closingObservation, '')), '')
  WHERE idBusiness = p_idBusiness
    AND idCashSession = p_idCashSession;

  COMMIT;

  CALL sp_cash_session_get_by_id(p_idBusiness, p_idCashSession);
  CALL sp_cash_session_payment_summary_list(p_idBusiness, p_idCashSession);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_cash_session_list;
DELIMITER $$

CREATE PROCEDURE sp_cash_session_list(
  IN p_idBusiness INT,
  IN p_limit INT,
  IN p_offset INT,
  IN p_idCashRegister INT,
  IN p_idUser INT,
  IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_startDate DATETIME,
  IN p_endDate DATETIME
)
BEGIN
  SELECT
    cs.idCashSession,
    cs.idBusiness,
    cs.idCashRegister,
    cr.name AS cashRegisterName,
    cr.is_default AS cashRegisterIsDefault,
    cs.opened_by_user_id,
    openedUser.name AS openedByUserName,
    cs.closed_by_user_id,
    closedUser.name AS closedByUserName,
    cs.status,
    cs.opened_at,
    cs.closed_at,
    cs.opening_amount,
    cs.expected_cash_amount,
    cs.counted_cash_amount,
    cs.difference_amount,
    cs.opening_observation,
    cs.closing_observation,
    cs.created_at,
    cs.updated_at
  FROM cash_sessions cs
  INNER JOIN cash_registers cr
    ON cr.idCashRegister = cs.idCashRegister
    AND cr.idBusiness = cs.idBusiness
  INNER JOIN users openedUser ON openedUser.idUser = cs.opened_by_user_id
  LEFT JOIN users closedUser ON closedUser.idUser = cs.closed_by_user_id
  WHERE cs.idBusiness = p_idBusiness
    AND (p_idCashRegister IS NULL OR cs.idCashRegister = p_idCashRegister)
    AND (p_idUser IS NULL OR cs.opened_by_user_id = p_idUser OR cs.closed_by_user_id = p_idUser)
    AND (p_status IS NULL OR cs.status = p_status)
    AND (p_startDate IS NULL OR cs.opened_at >= p_startDate)
    AND (p_endDate IS NULL OR cs.opened_at <= p_endDate)
  ORDER BY cs.opened_at DESC, cs.idCashSession DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM cash_sessions cs
  WHERE cs.idBusiness = p_idBusiness
    AND (p_idCashRegister IS NULL OR cs.idCashRegister = p_idCashRegister)
    AND (p_idUser IS NULL OR cs.opened_by_user_id = p_idUser OR cs.closed_by_user_id = p_idUser)
    AND (p_status IS NULL OR cs.status = p_status)
    AND (p_startDate IS NULL OR cs.opened_at >= p_startDate)
    AND (p_endDate IS NULL OR cs.opened_at <= p_endDate);
END$$

DELIMITER ;
