DROP PROCEDURE IF EXISTS sp_subscription_plan_list;
DELIMITER $$

CREATE PROCEDURE sp_subscription_plan_list(
  IN p_search VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_billingPeriod VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_isActive TINYINT,
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
    idSubscriptionPlan,
    code,
    name,
    description,
    billing_period AS billingPeriod,
    CAST(price AS CHAR) AS price,
    currency,
    trial_days AS trialDays,
    max_users AS maxUsers,
    max_products AS maxProducts,
    max_deposits AS maxDeposits,
    is_active AS isActive,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM subscription_plans
  WHERE (p_search IS NULL OR code COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%') OR name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%'))
    AND (p_billingPeriod IS NULL OR billing_period = p_billingPeriod)
    AND (p_isActive IS NULL OR is_active = p_isActive)
  ORDER BY created_at DESC, idSubscriptionPlan DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM subscription_plans
  WHERE (p_search IS NULL OR code COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%') OR name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%'))
    AND (p_billingPeriod IS NULL OR billing_period = p_billingPeriod)
    AND (p_isActive IS NULL OR is_active = p_isActive);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_subscription_plan_get_by_id;
DELIMITER $$

CREATE PROCEDURE sp_subscription_plan_get_by_id(IN p_idSubscriptionPlan INT)
BEGIN
  SELECT
    idSubscriptionPlan,
    code,
    name,
    description,
    billing_period AS billingPeriod,
    CAST(price AS CHAR) AS price,
    currency,
    trial_days AS trialDays,
    max_users AS maxUsers,
    max_products AS maxProducts,
    max_deposits AS maxDeposits,
    is_active AS isActive,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM subscription_plans
  WHERE idSubscriptionPlan = p_idSubscriptionPlan
  LIMIT 1;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_subscription_plan_create;
DELIMITER $$

CREATE PROCEDURE sp_subscription_plan_create(
  IN p_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_billingPeriod VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_price DECIMAL(18,2),
  IN p_currency CHAR(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_trialDays INT,
  IN p_maxUsers INT,
  IN p_maxProducts INT,
  IN p_maxDeposits INT,
  IN p_isActive TINYINT
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM subscription_plans
    WHERE code = p_code
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBSCRIPTION_PLAN_CODE_DUPLICATED';
  END IF;

  INSERT INTO subscription_plans (
    code,
    name,
    description,
    billing_period,
    price,
    currency,
    trial_days,
    max_users,
    max_products,
    max_deposits,
    is_active
  )
  VALUES (
    p_code,
    p_name,
    p_description,
    p_billingPeriod,
    p_price,
    p_currency,
    p_trialDays,
    p_maxUsers,
    p_maxProducts,
    p_maxDeposits,
    p_isActive
  );

  CALL sp_subscription_plan_get_by_id(LAST_INSERT_ID());
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_subscription_plan_update;
DELIMITER $$

CREATE PROCEDURE sp_subscription_plan_update(
  IN p_idSubscriptionPlan INT,
  IN p_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_updateDescription TINYINT,
  IN p_billingPeriod VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_price DECIMAL(18,2),
  IN p_currency CHAR(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_trialDays INT,
  IN p_maxUsers INT,
  IN p_updateMaxUsers TINYINT,
  IN p_maxProducts INT,
  IN p_updateMaxProducts TINYINT,
  IN p_maxDeposits INT,
  IN p_updateMaxDeposits TINYINT
)
BEGIN
  UPDATE subscription_plans
  SET
    name = COALESCE(p_name, name),
    description = CASE WHEN p_updateDescription = 1 THEN p_description ELSE description END,
    billing_period = COALESCE(p_billingPeriod, billing_period),
    price = COALESCE(p_price, price),
    currency = COALESCE(p_currency, currency),
    trial_days = COALESCE(p_trialDays, trial_days),
    max_users = CASE WHEN p_updateMaxUsers = 1 THEN p_maxUsers ELSE max_users END,
    max_products = CASE WHEN p_updateMaxProducts = 1 THEN p_maxProducts ELSE max_products END,
    max_deposits = CASE WHEN p_updateMaxDeposits = 1 THEN p_maxDeposits ELSE max_deposits END,
    updated_at = NOW()
  WHERE idSubscriptionPlan = p_idSubscriptionPlan;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBSCRIPTION_PLAN_NOT_FOUND';
  END IF;

  CALL sp_subscription_plan_get_by_id(p_idSubscriptionPlan);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_subscription_plan_toggle_status;
DELIMITER $$

CREATE PROCEDURE sp_subscription_plan_toggle_status(
  IN p_idSubscriptionPlan INT,
  IN p_isActive TINYINT
)
BEGIN
  UPDATE subscription_plans
  SET is_active = p_isActive, updated_at = NOW()
  WHERE idSubscriptionPlan = p_idSubscriptionPlan;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBSCRIPTION_PLAN_NOT_FOUND';
  END IF;

  CALL sp_subscription_plan_get_by_id(p_idSubscriptionPlan);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_subscription_list;
DELIMITER $$

CREATE PROCEDURE sp_business_subscription_list(
  IN p_search VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_idBusiness INT,
  IN p_idSubscriptionPlan INT,
  IN p_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_billingPeriod VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_trialEndsBefore DATETIME,
  IN p_periodEndsBefore DATETIME,
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
    bs.idBusinessSubscription,
    bs.idBusiness,
    b.name AS businessName,
    b.slug AS businessSlug,
    bs.idSubscriptionPlan,
    sp.code AS planCode,
    sp.name AS planName,
    sp.billing_period AS billingPeriod,
    CAST(sp.price AS CHAR) AS price,
    sp.currency,
    bs.status,
    bs.starts_at AS startsAt,
    bs.trial_starts_at AS trialStartsAt,
    bs.trial_ends_at AS trialEndsAt,
    bs.current_period_start AS currentPeriodStart,
    bs.current_period_end AS currentPeriodEnd,
    bs.grace_period_ends_at AS gracePeriodEndsAt,
    bs.auto_renew AS autoRenew,
    bs.cancel_at_period_end AS cancelAtPeriodEnd,
    bs.cancelled_at AS cancelledAt,
    bs.suspended_at AS suspendedAt,
    bs.expired_at AS expiredAt,
    bs.cancellation_reason AS cancellationReason,
    bs.suspension_reason AS suspensionReason,
    bs.created_at AS createdAt,
    bs.updated_at AS updatedAt
  FROM business_subscriptions bs
  INNER JOIN businesses b ON b.idBusiness = bs.idBusiness
  INNER JOIN subscription_plans sp ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
  WHERE (p_search IS NULL OR b.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%') OR b.slug COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%') OR sp.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%'))
    AND (p_idBusiness IS NULL OR bs.idBusiness = p_idBusiness)
    AND (p_idSubscriptionPlan IS NULL OR bs.idSubscriptionPlan = p_idSubscriptionPlan)
    AND (p_status IS NULL OR bs.status = p_status)
    AND (p_billingPeriod IS NULL OR sp.billing_period = p_billingPeriod)
    AND (p_trialEndsBefore IS NULL OR bs.trial_ends_at <= p_trialEndsBefore)
    AND (p_periodEndsBefore IS NULL OR bs.current_period_end <= p_periodEndsBefore)
  ORDER BY bs.created_at DESC, bs.idBusinessSubscription DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM business_subscriptions bs
  INNER JOIN businesses b ON b.idBusiness = bs.idBusiness
  INNER JOIN subscription_plans sp ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
  WHERE (p_search IS NULL OR b.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%') OR b.slug COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%') OR sp.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%'))
    AND (p_idBusiness IS NULL OR bs.idBusiness = p_idBusiness)
    AND (p_idSubscriptionPlan IS NULL OR bs.idSubscriptionPlan = p_idSubscriptionPlan)
    AND (p_status IS NULL OR bs.status = p_status)
    AND (p_billingPeriod IS NULL OR sp.billing_period = p_billingPeriod)
    AND (p_trialEndsBefore IS NULL OR bs.trial_ends_at <= p_trialEndsBefore)
    AND (p_periodEndsBefore IS NULL OR bs.current_period_end <= p_periodEndsBefore);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_subscription_get_by_id;
DELIMITER $$

CREATE PROCEDURE sp_business_subscription_get_by_id(IN p_idBusinessSubscription INT)
BEGIN
  SELECT
    bs.idBusinessSubscription,
    bs.idBusiness,
    b.name AS businessName,
    b.slug AS businessSlug,
    bs.idSubscriptionPlan,
    sp.code AS planCode,
    sp.name AS planName,
    sp.billing_period AS billingPeriod,
    CAST(sp.price AS CHAR) AS price,
    sp.currency,
    bs.status,
    bs.starts_at AS startsAt,
    bs.trial_starts_at AS trialStartsAt,
    bs.trial_ends_at AS trialEndsAt,
    bs.current_period_start AS currentPeriodStart,
    bs.current_period_end AS currentPeriodEnd,
    bs.grace_period_ends_at AS gracePeriodEndsAt,
    bs.auto_renew AS autoRenew,
    bs.cancel_at_period_end AS cancelAtPeriodEnd,
    bs.cancelled_at AS cancelledAt,
    bs.suspended_at AS suspendedAt,
    bs.expired_at AS expiredAt,
    bs.cancellation_reason AS cancellationReason,
    bs.suspension_reason AS suspensionReason,
    bs.created_at AS createdAt,
    bs.updated_at AS updatedAt
  FROM business_subscriptions bs
  INNER JOIN businesses b ON b.idBusiness = bs.idBusiness
  INNER JOIN subscription_plans sp ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
  WHERE bs.idBusinessSubscription = p_idBusinessSubscription
  LIMIT 1;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_subscription_event_create;
DELIMITER $$

CREATE PROCEDURE sp_subscription_event_create(
  IN p_idBusinessSubscription INT,
  IN p_eventType VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_previousStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_newStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_metadata JSON,
  IN p_createdByUserId INT
)
BEGIN
  INSERT INTO subscription_events (
    idBusinessSubscription,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  VALUES (
    p_idBusinessSubscription,
    p_eventType,
    p_previousStatus,
    p_newStatus,
    p_metadata,
    p_createdByUserId
  );
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_subscription_assign;
DELIMITER $$

CREATE PROCEDURE sp_business_subscription_assign(
  IN p_idBusiness INT,
  IN p_idSubscriptionPlan INT,
  IN p_startMode VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_currentPeriodStart DATETIME,
  IN p_currentPeriodEnd DATETIME,
  IN p_createdByUserId INT
)
BEGIN
  DECLARE v_trialDays INT DEFAULT 0;
  DECLARE v_planCode VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_existingActive INT DEFAULT 0;
  DECLARE v_previousTrials INT DEFAULT 0;
  DECLARE v_idBusinessSubscription INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT code, trial_days INTO v_planCode, v_trialDays
  FROM subscription_plans
  WHERE idSubscriptionPlan = p_idSubscriptionPlan
    AND is_active = 1
  FOR UPDATE;

  IF v_planCode IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBSCRIPTION_PLAN_NOT_FOUND';
  END IF;

  SELECT COUNT(*) INTO v_existingActive
  FROM business_subscriptions
  WHERE idBusiness = p_idBusiness
    AND status IN ('TRIAL','ACTIVE','PAST_DUE','SUSPENDED')
  FOR UPDATE;

  IF v_existingActive > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBSCRIPTION_ALREADY_EXISTS';
  END IF;

  IF p_startMode = 'TRIAL' THEN
    SELECT COUNT(*) INTO v_previousTrials
    FROM business_subscriptions
    WHERE idBusiness = p_idBusiness
      AND trial_starts_at IS NOT NULL
    FOR UPDATE;

    IF v_previousTrials > 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TRIAL_ALREADY_USED';
    END IF;
  END IF;

  INSERT INTO business_subscriptions (
    idBusiness,
    idSubscriptionPlan,
    status,
    starts_at,
    trial_starts_at,
    trial_ends_at,
    current_period_start,
    current_period_end,
    auto_renew,
    cancel_at_period_end
  )
  VALUES (
    p_idBusiness,
    p_idSubscriptionPlan,
    CASE WHEN p_startMode = 'TRIAL' THEN 'TRIAL' ELSE 'ACTIVE' END,
    NOW(),
    CASE WHEN p_startMode = 'TRIAL' THEN NOW() ELSE NULL END,
    CASE WHEN p_startMode = 'TRIAL' THEN DATE_ADD(NOW(), INTERVAL v_trialDays DAY) ELSE NULL END,
    CASE WHEN p_startMode = 'ACTIVE' THEN p_currentPeriodStart ELSE NULL END,
    CASE WHEN p_startMode = 'ACTIVE' THEN p_currentPeriodEnd ELSE NULL END,
    1,
    0
  );

  SET v_idBusinessSubscription = LAST_INSERT_ID();

  CALL sp_subscription_event_create(
    v_idBusinessSubscription,
    CASE WHEN p_startMode = 'TRIAL' THEN 'TRIAL_STARTED' ELSE 'SUBSCRIPTION_ACTIVATED' END,
    NULL,
    CASE WHEN p_startMode = 'TRIAL' THEN 'TRIAL' ELSE 'ACTIVE' END,
    JSON_OBJECT('planCode', v_planCode, 'trialDays', v_trialDays, 'startMode', p_startMode),
    p_createdByUserId
  );

  COMMIT;

  CALL sp_business_subscription_get_by_id(v_idBusinessSubscription);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_subscription_change_plan;
DELIMITER $$

CREATE PROCEDURE sp_business_subscription_change_plan(
  IN p_idBusinessSubscription INT,
  IN p_idSubscriptionPlan INT,
  IN p_effectiveMode VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_createdByUserId INT
)
BEGIN
  DECLARE v_previousPlanId INT;

  START TRANSACTION;

  SELECT idSubscriptionPlan INTO v_previousPlanId
  FROM business_subscriptions
  WHERE idBusinessSubscription = p_idBusinessSubscription
  FOR UPDATE;

  IF v_previousPlanId IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM subscription_plans
    WHERE idSubscriptionPlan = p_idSubscriptionPlan
      AND is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBSCRIPTION_PLAN_NOT_FOUND';
  END IF;

  UPDATE business_subscriptions
  SET idSubscriptionPlan = p_idSubscriptionPlan, updated_at = NOW()
  WHERE idBusinessSubscription = p_idBusinessSubscription;

  CALL sp_subscription_event_create(
    p_idBusinessSubscription,
    'PLAN_CHANGED',
    NULL,
    NULL,
    JSON_OBJECT('previousPlanId', v_previousPlanId, 'newPlanId', p_idSubscriptionPlan, 'effectiveMode', p_effectiveMode),
    p_createdByUserId
  );

  COMMIT;

  CALL sp_business_subscription_get_by_id(p_idBusinessSubscription);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_subscription_suspend;
DELIMITER $$

CREATE PROCEDURE sp_business_subscription_suspend(
  IN p_idBusinessSubscription INT,
  IN p_reason VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_createdByUserId INT
)
BEGIN
  DECLARE v_previousStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  START TRANSACTION;

  SELECT status INTO v_previousStatus
  FROM business_subscriptions
  WHERE idBusinessSubscription = p_idBusinessSubscription
  FOR UPDATE;

  IF v_previousStatus IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  UPDATE business_subscriptions
  SET status = 'SUSPENDED',
      suspended_at = NOW(),
      suspension_reason = p_reason,
      updated_at = NOW()
  WHERE idBusinessSubscription = p_idBusinessSubscription;

  CALL sp_subscription_event_create(
    p_idBusinessSubscription,
    'SUBSCRIPTION_SUSPENDED',
    v_previousStatus,
    'SUSPENDED',
    JSON_OBJECT('reason', p_reason),
    p_createdByUserId
  );

  COMMIT;

  CALL sp_business_subscription_get_by_id(p_idBusinessSubscription);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_subscription_reactivate;
DELIMITER $$

CREATE PROCEDURE sp_business_subscription_reactivate(
  IN p_idBusinessSubscription INT,
  IN p_createdByUserId INT
)
BEGIN
  DECLARE v_previousStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  START TRANSACTION;

  SELECT status INTO v_previousStatus
  FROM business_subscriptions
  WHERE idBusinessSubscription = p_idBusinessSubscription
  FOR UPDATE;

  IF v_previousStatus IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  IF v_previousStatus NOT IN ('PAST_DUE', 'SUSPENDED') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_SUBSCRIPTION_TRANSITION';
  END IF;

  UPDATE business_subscriptions
  SET status = 'ACTIVE',
      suspended_at = NULL,
      suspension_reason = NULL,
      grace_period_ends_at = NULL,
      updated_at = NOW()
  WHERE idBusinessSubscription = p_idBusinessSubscription;

  CALL sp_subscription_event_create(
    p_idBusinessSubscription,
    'SUBSCRIPTION_REACTIVATED',
    v_previousStatus,
    'ACTIVE',
    JSON_OBJECT('manual', true),
    p_createdByUserId
  );

  COMMIT;

  CALL sp_business_subscription_get_by_id(p_idBusinessSubscription);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_subscription_cancel;
DELIMITER $$

CREATE PROCEDURE sp_business_subscription_cancel(
  IN p_idBusinessSubscription INT,
  IN p_reason VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_cancelAtPeriodEnd TINYINT,
  IN p_createdByUserId INT
)
BEGIN
  DECLARE v_previousStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  START TRANSACTION;

  SELECT status INTO v_previousStatus
  FROM business_subscriptions
  WHERE idBusinessSubscription = p_idBusinessSubscription
  FOR UPDATE;

  IF v_previousStatus IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  IF p_cancelAtPeriodEnd = 1 THEN
    UPDATE business_subscriptions
    SET cancel_at_period_end = 1,
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE idBusinessSubscription = p_idBusinessSubscription;
  ELSE
    UPDATE business_subscriptions
    SET status = 'CANCELLED',
        cancelled_at = NOW(),
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE idBusinessSubscription = p_idBusinessSubscription;
  END IF;

  CALL sp_subscription_event_create(
    p_idBusinessSubscription,
    'SUBSCRIPTION_CANCELLED',
    v_previousStatus,
    CASE WHEN p_cancelAtPeriodEnd = 1 THEN v_previousStatus ELSE 'CANCELLED' END,
    JSON_OBJECT('reason', p_reason, 'scheduled', p_cancelAtPeriodEnd = 1),
    p_createdByUserId
  );

  COMMIT;

  CALL sp_business_subscription_get_by_id(p_idBusinessSubscription);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_subscription_auto_renew;
DELIMITER $$

CREATE PROCEDURE sp_business_subscription_auto_renew(
  IN p_idBusinessSubscription INT,
  IN p_autoRenew TINYINT,
  IN p_createdByUserId INT
)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM business_subscriptions WHERE idBusinessSubscription = p_idBusinessSubscription) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  UPDATE business_subscriptions
  SET auto_renew = p_autoRenew, updated_at = NOW()
  WHERE idBusinessSubscription = p_idBusinessSubscription;

  CALL sp_subscription_event_create(
    p_idBusinessSubscription,
    CASE WHEN p_autoRenew = 1 THEN 'AUTO_RENEW_ENABLED' ELSE 'AUTO_RENEW_DISABLED' END,
    NULL,
    NULL,
    JSON_OBJECT('autoRenew', p_autoRenew = 1),
    p_createdByUserId
  );

  CALL sp_business_subscription_get_by_id(p_idBusinessSubscription);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_subscription_payment_list;
DELIMITER $$

CREATE PROCEDURE sp_subscription_payment_list(
  IN p_idBusinessSubscription INT,
  IN p_idBusiness INT,
  IN p_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_paymentMethod VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_dateFrom DATETIME,
  IN p_dateTo DATETIME,
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
    pay.idSubscriptionPayment,
    pay.idBusinessSubscription,
    pay.payment_number AS paymentNumber,
    CAST(pay.amount AS CHAR) AS amount,
    pay.currency,
    pay.payment_method AS paymentMethod,
    pay.status,
    pay.paid_at AS paidAt,
    pay.period_start AS periodStart,
    pay.period_end AS periodEnd,
    pay.external_reference AS externalReference,
    pay.provider_payment_id AS providerPaymentId,
    pay.observation,
    pay.created_by_user_id AS createdByUserId,
    u.name AS createdByUserName,
    b.name AS businessName,
    sp.name AS planName,
    pay.created_at AS createdAt,
    pay.updated_at AS updatedAt
  FROM subscription_payments pay
  INNER JOIN business_subscriptions bs ON bs.idBusinessSubscription = pay.idBusinessSubscription
  INNER JOIN businesses b ON b.idBusiness = bs.idBusiness
  INNER JOIN subscription_plans sp ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
  LEFT JOIN users u ON u.idUser = pay.created_by_user_id
  WHERE (p_idBusinessSubscription IS NULL OR pay.idBusinessSubscription = p_idBusinessSubscription)
    AND (p_idBusiness IS NULL OR bs.idBusiness = p_idBusiness)
    AND (p_status IS NULL OR pay.status = p_status)
    AND (p_paymentMethod IS NULL OR pay.payment_method = p_paymentMethod)
    AND (p_dateFrom IS NULL OR pay.created_at >= p_dateFrom)
    AND (p_dateTo IS NULL OR pay.created_at <= p_dateTo)
  ORDER BY pay.created_at DESC, pay.idSubscriptionPayment DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM subscription_payments pay
  INNER JOIN business_subscriptions bs ON bs.idBusinessSubscription = pay.idBusinessSubscription
  WHERE (p_idBusinessSubscription IS NULL OR pay.idBusinessSubscription = p_idBusinessSubscription)
    AND (p_idBusiness IS NULL OR bs.idBusiness = p_idBusiness)
    AND (p_status IS NULL OR pay.status = p_status)
    AND (p_paymentMethod IS NULL OR pay.payment_method = p_paymentMethod)
    AND (p_dateFrom IS NULL OR pay.created_at >= p_dateFrom)
    AND (p_dateTo IS NULL OR pay.created_at <= p_dateTo);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_subscription_payment_get_by_id;
DELIMITER $$

CREATE PROCEDURE sp_subscription_payment_get_by_id(IN p_idSubscriptionPayment INT)
BEGIN
  SELECT
    pay.idSubscriptionPayment,
    pay.idBusinessSubscription,
    pay.payment_number AS paymentNumber,
    CAST(pay.amount AS CHAR) AS amount,
    pay.currency,
    pay.payment_method AS paymentMethod,
    pay.status,
    pay.paid_at AS paidAt,
    pay.period_start AS periodStart,
    pay.period_end AS periodEnd,
    pay.external_reference AS externalReference,
    pay.provider_payment_id AS providerPaymentId,
    pay.observation,
    pay.created_by_user_id AS createdByUserId,
    u.name AS createdByUserName,
    b.name AS businessName,
    sp.name AS planName,
    pay.created_at AS createdAt,
    pay.updated_at AS updatedAt
  FROM subscription_payments pay
  INNER JOIN business_subscriptions bs ON bs.idBusinessSubscription = pay.idBusinessSubscription
  INNER JOIN businesses b ON b.idBusiness = bs.idBusiness
  INNER JOIN subscription_plans sp ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
  LEFT JOIN users u ON u.idUser = pay.created_by_user_id
  WHERE pay.idSubscriptionPayment = p_idSubscriptionPayment
  LIMIT 1;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_subscription_payment_create;
DELIMITER $$

CREATE PROCEDURE sp_subscription_payment_create(
  IN p_idBusinessSubscription INT,
  IN p_paymentNumber VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_amount DECIMAL(18,2),
  IN p_currency CHAR(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_paymentMethod VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_paidAt DATETIME,
  IN p_periodStart DATETIME,
  IN p_periodEnd DATETIME,
  IN p_externalReference VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_providerPaymentId VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_createdByUserId INT
)
BEGIN
  DECLARE v_idSubscriptionPayment INT;
  DECLARE v_previousStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_eventType VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT status INTO v_previousStatus
  FROM business_subscriptions
  WHERE idBusinessSubscription = p_idBusinessSubscription
  FOR UPDATE;

  IF v_previousStatus IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  INSERT INTO subscription_payments (
    idBusinessSubscription,
    payment_number,
    amount,
    currency,
    payment_method,
    status,
    paid_at,
    period_start,
    period_end,
    external_reference,
    provider_payment_id,
    observation,
    created_by_user_id
  )
  VALUES (
    p_idBusinessSubscription,
    p_paymentNumber,
    p_amount,
    p_currency,
    p_paymentMethod,
    p_status,
    p_paidAt,
    p_periodStart,
    p_periodEnd,
    p_externalReference,
    p_providerPaymentId,
    p_observation,
    p_createdByUserId
  );

  SET v_idSubscriptionPayment = LAST_INSERT_ID();
  SET v_eventType = CASE
    WHEN p_status = 'APPROVED' THEN 'PAYMENT_APPROVED'
    WHEN p_status = 'REJECTED' THEN 'PAYMENT_REJECTED'
    WHEN p_status = 'CANCELLED' THEN 'PAYMENT_CANCELLED'
    WHEN p_status = 'REFUNDED' THEN 'PAYMENT_REFUNDED'
    ELSE 'PAYMENT_PENDING'
  END;

  CALL sp_subscription_event_create(
    p_idBusinessSubscription,
    'PAYMENT_CREATED',
    NULL,
    NULL,
    JSON_OBJECT('paymentNumber', p_paymentNumber, 'amount', p_amount, 'currency', p_currency),
    p_createdByUserId
  );

  CALL sp_subscription_event_create(
    p_idBusinessSubscription,
    v_eventType,
    NULL,
    NULL,
    JSON_OBJECT('paymentNumber', p_paymentNumber, 'status', p_status),
    p_createdByUserId
  );

  IF p_status = 'APPROVED' THEN
    UPDATE business_subscriptions
    SET status = 'ACTIVE',
        current_period_start = p_periodStart,
        current_period_end = p_periodEnd,
        grace_period_ends_at = NULL,
        suspended_at = NULL,
        suspension_reason = NULL,
        updated_at = NOW()
    WHERE idBusinessSubscription = p_idBusinessSubscription;

    CALL sp_subscription_event_create(
      p_idBusinessSubscription,
      CASE WHEN v_previousStatus = 'ACTIVE' THEN 'SUBSCRIPTION_RENEWED' ELSE 'SUBSCRIPTION_ACTIVATED' END,
      v_previousStatus,
      'ACTIVE',
      JSON_OBJECT('paymentNumber', p_paymentNumber, 'periodStart', p_periodStart, 'periodEnd', p_periodEnd),
      p_createdByUserId
    );
  END IF;

  COMMIT;

  CALL sp_subscription_payment_get_by_id(v_idSubscriptionPayment);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_subscription_payment_update_status;
DELIMITER $$

CREATE PROCEDURE sp_subscription_payment_update_status(
  IN p_idSubscriptionPayment INT,
  IN p_newStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_createdByUserId INT
)
BEGIN
  DECLARE v_idBusinessSubscription INT;
  DECLARE v_previousPaymentStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_previousSubscriptionStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_paymentNumber VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_periodStart DATETIME;
  DECLARE v_periodEnd DATETIME;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT
    idBusinessSubscription,
    status,
    payment_number,
    period_start,
    period_end
  INTO
    v_idBusinessSubscription,
    v_previousPaymentStatus,
    v_paymentNumber,
    v_periodStart,
    v_periodEnd
  FROM subscription_payments
  WHERE idSubscriptionPayment = p_idSubscriptionPayment
  FOR UPDATE;

  IF v_idBusinessSubscription IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PAYMENT_NOT_FOUND';
  END IF;

  IF p_newStatus IN ('APPROVED', 'REJECTED', 'CANCELLED')
    AND v_previousPaymentStatus <> 'PENDING' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PAYMENT_ALREADY_PROCESSED';
  END IF;

  IF p_newStatus = 'REFUNDED'
    AND v_previousPaymentStatus <> 'APPROVED' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_PAYMENT_STATUS_TRANSITION';
  END IF;

  IF p_newStatus NOT IN ('APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_PAYMENT_STATUS_TRANSITION';
  END IF;

  SELECT status INTO v_previousSubscriptionStatus
  FROM business_subscriptions
  WHERE idBusinessSubscription = v_idBusinessSubscription
  FOR UPDATE;

  UPDATE subscription_payments
  SET status = p_newStatus,
      observation = COALESCE(p_observation, observation),
      paid_at = CASE WHEN p_newStatus = 'APPROVED' THEN COALESCE(paid_at, NOW()) ELSE paid_at END,
      updated_at = NOW()
  WHERE idSubscriptionPayment = p_idSubscriptionPayment;

  CALL sp_subscription_event_create(
    v_idBusinessSubscription,
    CASE
      WHEN p_newStatus = 'APPROVED' THEN 'PAYMENT_APPROVED'
      WHEN p_newStatus = 'REJECTED' THEN 'PAYMENT_REJECTED'
      WHEN p_newStatus = 'CANCELLED' THEN 'PAYMENT_CANCELLED'
      ELSE 'PAYMENT_REFUNDED'
    END,
    NULL,
    NULL,
    JSON_OBJECT('paymentNumber', v_paymentNumber, 'observation', p_observation),
    p_createdByUserId
  );

  IF p_newStatus = 'APPROVED' THEN
    UPDATE business_subscriptions
    SET status = 'ACTIVE',
        current_period_start = v_periodStart,
        current_period_end = v_periodEnd,
        grace_period_ends_at = NULL,
        suspended_at = NULL,
        suspension_reason = NULL,
        updated_at = NOW()
    WHERE idBusinessSubscription = v_idBusinessSubscription;

    CALL sp_subscription_event_create(
      v_idBusinessSubscription,
      CASE WHEN v_previousSubscriptionStatus = 'ACTIVE' THEN 'SUBSCRIPTION_RENEWED' ELSE 'SUBSCRIPTION_ACTIVATED' END,
      v_previousSubscriptionStatus,
      'ACTIVE',
      JSON_OBJECT('paymentNumber', v_paymentNumber),
      p_createdByUserId
    );
  END IF;

  COMMIT;

  CALL sp_subscription_payment_get_by_id(p_idSubscriptionPayment);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_subscription_event_list;
DELIMITER $$

CREATE PROCEDURE sp_subscription_event_list(
  IN p_idBusinessSubscription INT,
  IN p_idBusiness INT,
  IN p_eventType VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_dateFrom DATETIME,
  IN p_dateTo DATETIME,
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
    se.idSubscriptionEvent,
    se.idBusinessSubscription,
    se.event_type AS eventType,
    se.previous_status AS previousStatus,
    se.new_status AS newStatus,
    CAST(se.metadata AS CHAR) AS metadata,
    se.created_by_user_id AS createdByUserId,
    u.name AS createdByUserName,
    b.name AS businessName,
    se.created_at AS createdAt
  FROM subscription_events se
  INNER JOIN business_subscriptions bs ON bs.idBusinessSubscription = se.idBusinessSubscription
  INNER JOIN businesses b ON b.idBusiness = bs.idBusiness
  LEFT JOIN users u ON u.idUser = se.created_by_user_id
  WHERE (p_idBusinessSubscription IS NULL OR se.idBusinessSubscription = p_idBusinessSubscription)
    AND (p_idBusiness IS NULL OR bs.idBusiness = p_idBusiness)
    AND (p_eventType IS NULL OR se.event_type = p_eventType)
    AND (p_dateFrom IS NULL OR se.created_at >= p_dateFrom)
    AND (p_dateTo IS NULL OR se.created_at <= p_dateTo)
  ORDER BY se.created_at DESC, se.idSubscriptionEvent DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM subscription_events se
  INNER JOIN business_subscriptions bs ON bs.idBusinessSubscription = se.idBusinessSubscription
  WHERE (p_idBusinessSubscription IS NULL OR se.idBusinessSubscription = p_idBusinessSubscription)
    AND (p_idBusiness IS NULL OR bs.idBusiness = p_idBusiness)
    AND (p_eventType IS NULL OR se.event_type = p_eventType)
    AND (p_dateFrom IS NULL OR se.created_at >= p_dateFrom)
    AND (p_dateTo IS NULL OR se.created_at <= p_dateTo);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_current_subscription;
DELIMITER $$

CREATE PROCEDURE sp_business_current_subscription(IN p_idBusiness INT)
BEGIN
  SELECT
    bs.idBusinessSubscription,
    bs.status,
    bs.starts_at AS startsAt,
    bs.trial_starts_at AS trialStartsAt,
    bs.trial_ends_at AS trialEndsAt,
    bs.current_period_start AS currentPeriodStart,
    bs.current_period_end AS currentPeriodEnd,
    bs.grace_period_ends_at AS gracePeriodEndsAt,
    bs.auto_renew AS autoRenew,
    bs.cancel_at_period_end AS cancelAtPeriodEnd,
    b.status AS businessStatus,
    sp.idSubscriptionPlan,
    sp.code AS planCode,
    sp.name AS planName,
    sp.billing_period AS billingPeriod,
    CAST(sp.price AS CHAR) AS price,
    sp.currency,
    sp.max_users AS maxUsers,
    sp.max_products AS maxProducts,
    sp.max_deposits AS maxDeposits,
    CASE
      WHEN bs.status = 'TRIAL' THEN DATEDIFF(bs.trial_ends_at, NOW())
      WHEN bs.status IN ('ACTIVE','PAST_DUE') THEN DATEDIFF(COALESCE(bs.current_period_end, bs.grace_period_ends_at), NOW())
      ELSE NULL
    END AS daysRemaining
  FROM business_subscriptions bs
  INNER JOIN businesses b ON b.idBusiness = bs.idBusiness
  INNER JOIN subscription_plans sp ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
  WHERE bs.idBusiness = p_idBusiness
    AND bs.status IN ('TRIAL','ACTIVE','PAST_DUE','SUSPENDED')
  ORDER BY bs.created_at DESC, bs.idBusinessSubscription DESC
  LIMIT 1;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_subscription_process_expirations;
DELIMITER $$

CREATE PROCEDURE sp_subscription_process_expirations(
  IN p_graceDays INT,
  IN p_limit INT
)
BEGIN
  DECLARE v_processedTrials INT DEFAULT 0;
  DECLARE v_processedActive INT DEFAULT 0;
  DECLARE v_processedGrace INT DEFAULT 0;
  DECLARE v_processedScheduledCancellations INT DEFAULT 0;

  INSERT INTO subscription_events (
    idBusinessSubscription,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  SELECT
    idBusinessSubscription,
    'TRIAL_EXPIRED',
    'TRIAL',
    'TRIAL',
    JSON_OBJECT('trialEndsAt', trial_ends_at),
    NULL
  FROM business_subscriptions
  WHERE status = 'TRIAL'
    AND trial_ends_at < NOW()
  LIMIT p_limit;

  INSERT INTO subscription_events (
    idBusinessSubscription,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  SELECT
    idBusinessSubscription,
    'SUBSCRIPTION_PAST_DUE',
    'TRIAL',
    'PAST_DUE',
    JSON_OBJECT('graceDays', p_graceDays),
    NULL
  FROM business_subscriptions
  WHERE status = 'TRIAL'
    AND trial_ends_at < NOW()
  LIMIT p_limit;

  UPDATE business_subscriptions
  SET status = 'PAST_DUE',
      grace_period_ends_at = DATE_ADD(trial_ends_at, INTERVAL p_graceDays DAY),
      updated_at = NOW()
  WHERE status = 'TRIAL'
    AND trial_ends_at < NOW()
  LIMIT p_limit;
  SET v_processedTrials = ROW_COUNT();

  INSERT INTO subscription_events (
    idBusinessSubscription,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  SELECT
    idBusinessSubscription,
    'SUBSCRIPTION_PAST_DUE',
    'ACTIVE',
    'PAST_DUE',
    JSON_OBJECT('periodEnd', current_period_end, 'graceDays', p_graceDays),
    NULL
  FROM business_subscriptions
  WHERE status = 'ACTIVE'
    AND current_period_end < NOW()
  LIMIT p_limit;

  UPDATE business_subscriptions
  SET status = 'PAST_DUE',
      grace_period_ends_at = DATE_ADD(current_period_end, INTERVAL p_graceDays DAY),
      updated_at = NOW()
  WHERE status = 'ACTIVE'
    AND current_period_end < NOW()
  LIMIT p_limit;
  SET v_processedActive = ROW_COUNT();

  INSERT INTO subscription_events (
    idBusinessSubscription,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  SELECT
    idBusinessSubscription,
    'SUBSCRIPTION_SUSPENDED',
    'PAST_DUE',
    'SUSPENDED',
    JSON_OBJECT('reason', 'Grace period expired'),
    NULL
  FROM business_subscriptions
  WHERE status = 'PAST_DUE'
    AND grace_period_ends_at < NOW()
  LIMIT p_limit;

  UPDATE business_subscriptions
  SET status = 'SUSPENDED',
      suspended_at = NOW(),
      suspension_reason = 'Grace period expired',
      updated_at = NOW()
  WHERE status = 'PAST_DUE'
    AND grace_period_ends_at < NOW()
  LIMIT p_limit;
  SET v_processedGrace = ROW_COUNT();

  INSERT INTO subscription_events (
    idBusinessSubscription,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  SELECT
    idBusinessSubscription,
    'SUBSCRIPTION_CANCELLED',
    status,
    'CANCELLED',
    JSON_OBJECT('scheduled', true),
    NULL
  FROM business_subscriptions
  WHERE cancel_at_period_end = 1
    AND status IN ('TRIAL','ACTIVE','PAST_DUE')
    AND COALESCE(current_period_end, trial_ends_at) < NOW()
  LIMIT p_limit;

  UPDATE business_subscriptions
  SET status = 'CANCELLED',
      cancelled_at = NOW(),
      updated_at = NOW()
  WHERE cancel_at_period_end = 1
    AND status IN ('TRIAL','ACTIVE','PAST_DUE')
    AND COALESCE(current_period_end, trial_ends_at) < NOW()
  LIMIT p_limit;
  SET v_processedScheduledCancellations = ROW_COUNT();

  SELECT
    v_processedTrials AS processedTrials,
    v_processedActive AS processedActive,
    v_processedGrace AS processedGrace,
    v_processedScheduledCancellations AS processedScheduledCancellations;
END$$

DELIMITER ;
