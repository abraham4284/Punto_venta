DROP PROCEDURE IF EXISTS sp_cash_session_payment_summary_list;
DELIMITER $$

CREATE PROCEDURE sp_cash_session_payment_summary_list(
  IN p_idBusiness INT,
  IN p_idCashSession BIGINT
)
BEGIN
  SELECT
    csps.idCashSessionPaymentSummary,
    csps.idBusiness,
    csps.idCashSession,
    csps.idPaymentMethod,
    pm.name AS paymentMethodName,
    pm.code AS paymentMethodCode,
    pm.affects_cash AS affectsCash,
    csps.payments_count AS sales_count,
    csps.payments_count AS payments_count,
    csps.total_amount,
    csps.created_at
  FROM cash_session_payment_summaries csps
  INNER JOIN payment_methods pm
    ON pm.idPaymentMethod = csps.idPaymentMethod
    AND pm.idBusiness = csps.idBusiness
  INNER JOIN cash_sessions cs
    ON cs.idCashSession = csps.idCashSession
    AND cs.idBusiness = csps.idBusiness
  WHERE csps.idBusiness = p_idBusiness
    AND csps.idCashSession = p_idCashSession
  ORDER BY pm.affects_cash DESC, pm.name ASC;
END$$

DELIMITER ;
