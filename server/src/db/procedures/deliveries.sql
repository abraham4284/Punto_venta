DELIMITER $$
DROP PROCEDURE IF EXISTS sp_delivery_validate_provider$$
CREATE PROCEDURE sp_delivery_validate_provider(IN p_idBusiness INT, IN p_assignedToUserId INT,
  IN p_providerType VARCHAR(20), IN p_externalProviderName VARCHAR(120), IN p_externalReference VARCHAR(150),
  IN p_externalContactName VARCHAR(160), IN p_externalContactPhone VARCHAR(80), IN p_externalCost DECIMAL(18,2))
BEGIN
  DECLARE v_deliveryUser INT;
  IF p_providerType IS NOT NULL AND p_providerType NOT IN ('INTERNAL','THIRD_PARTY') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_PROVIDER_INVALID';
  END IF;
  IF p_providerType = 'INTERNAL' THEN
    SELECT bu.idUser INTO v_deliveryUser FROM business_users bu JOIN users u ON u.idUser = bu.idUser WHERE bu.idBusiness = p_idBusiness AND bu.idUser = p_assignedToUserId AND bu.role = 'DELIVERY' AND bu.is_active = 1 AND u.is_active = 1 FOR UPDATE;
    IF v_deliveryUser IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_USER_NOT_FOUND';
    END IF;
  ELSEIF p_assignedToUserId IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_PROVIDER_INVALID';
  END IF;
  IF p_providerType = 'THIRD_PARTY' THEN
    IF p_externalProviderName IS NULL OR CHAR_LENGTH(TRIM(p_externalProviderName)) = 0 OR p_externalCost < 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_PROVIDER_INVALID';
    END IF;
  ELSEIF p_externalProviderName IS NOT NULL OR p_externalReference IS NOT NULL OR p_externalContactName IS NOT NULL OR p_externalContactPhone IS NOT NULL OR p_externalCost IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_PROVIDER_INVALID';
  END IF;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_delivery_create;
DELIMITER $$

CREATE PROCEDURE sp_delivery_create(
  IN p_idBusiness INT,
  IN p_idSale INT,
  IN p_createdByUserId INT,
  IN p_assignedToUserId INT,
  IN p_recipientName VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_recipientPhone VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_deliveryAddress VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_deliveryReference VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_scheduledAt DATETIME,
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_providerType VARCHAR(20), IN p_externalProviderName VARCHAR(120), IN p_externalReference VARCHAR(150),
  IN p_externalContactName VARCHAR(160), IN p_externalContactPhone VARCHAR(80), IN p_externalCost DECIMAL(18,2)
)
BEGIN
  DECLARE v_idSaleDelivery BIGINT;
  DECLARE v_initialStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING';

  CALL sp_delivery_validate_provider(p_idBusiness, p_assignedToUserId, p_providerType, p_externalProviderName, p_externalReference, p_externalContactName, p_externalContactPhone, p_externalCost);
  IF p_providerType IS NOT NULL THEN
    SET v_initialStatus = 'ASSIGNED';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM sales
    WHERE idBusiness = p_idBusiness
      AND idSale = p_idSale
      AND status = 'COMPLETED'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SALE_NOT_FOUND';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM sale_deliveries
    WHERE idBusiness = p_idBusiness
      AND idSale = p_idSale
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SALE_ALREADY_HAS_DELIVERY';
  END IF;

  IF p_assignedToUserId IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM business_users bu
    INNER JOIN users u ON u.idUser = bu.idUser
    WHERE bu.idBusiness = p_idBusiness
      AND bu.idUser = p_assignedToUserId
      AND bu.role = 'DELIVERY'
      AND bu.is_active = 1
      AND u.is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_USER_NOT_FOUND';
  END IF;

  INSERT INTO sale_deliveries (
    idBusiness,
    idSale,
    provider_type, external_provider_name, external_reference, external_contact_name, external_contact_phone, external_cost,
    assigned_to_user_id,
    created_by_user_id,
    status,
    recipient_name,
    recipient_phone,
    delivery_address,
    delivery_reference,
    scheduled_at,
    assigned_at,
    observation,
    created_at,
    updated_at
  )
  VALUES (
    p_idBusiness,
    p_idSale,
    p_providerType, p_externalProviderName, p_externalReference, p_externalContactName, p_externalContactPhone, p_externalCost,
    p_assignedToUserId,
    p_createdByUserId,
    v_initialStatus,
    p_recipientName,
    p_recipientPhone,
    p_deliveryAddress,
    p_deliveryReference,
    p_scheduledAt,
    IF(p_providerType IS NULL, NULL, NOW()),
    p_observation,
    NOW(),
    NOW()
  );

  SET v_idSaleDelivery = LAST_INSERT_ID();

  INSERT INTO delivery_events (
    idBusiness,
    idSaleDelivery,
    event_type,
    previous_status,
    new_status,
    metadata,
    created_by_user_id
  )
  VALUES (
    p_idBusiness,
    v_idSaleDelivery,
    'DELIVERY_CREATED',
    NULL,
    v_initialStatus,
    JSON_MERGE_PATCH(JSON_OBJECT('providerType', p_providerType, 'assignedToUserId', p_assignedToUserId, 'externalProviderName', p_externalProviderName, 'externalReference', p_externalReference, 'externalContactName', p_externalContactName, 'externalContactPhone', p_externalContactPhone, 'externalCost', p_externalCost), JSON_OBJECT('scheduledAt', p_scheduledAt)),
    p_createdByUserId
  );

  CALL sp_delivery_get_by_id(p_idBusiness, v_idSaleDelivery);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_delivery_events_list;
DELIMITER $$

CREATE PROCEDURE sp_delivery_events_list(
  IN p_idBusiness INT,
  IN p_idSaleDelivery BIGINT
)
BEGIN
  SELECT
    de.idDeliveryEvent,
    de.idBusiness,
    de.idSaleDelivery,
    de.event_type,
    de.previous_status,
    de.new_status,
    de.metadata,
    de.created_by_user_id,
    u.name AS created_by_user_name,
    de.created_at
  FROM delivery_events de
  INNER JOIN sale_deliveries sd
    ON sd.idBusiness = de.idBusiness
    AND sd.idSaleDelivery = de.idSaleDelivery
  LEFT JOIN users u ON u.idUser = de.created_by_user_id
  WHERE de.idBusiness = p_idBusiness
    AND de.idSaleDelivery = p_idSaleDelivery
  ORDER BY de.created_at ASC, de.idDeliveryEvent ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_delivery_get_by_id;
DELIMITER $$

CREATE PROCEDURE sp_delivery_get_by_id(
  IN p_idBusiness INT,
  IN p_idSaleDelivery BIGINT
)
BEGIN
  SELECT
    sd.idSaleDelivery,
    sd.idBusiness,
    sd.idSale,
    s.sale_number,
    s.total,
    sd.provider_type, sd.external_provider_name, sd.external_reference, sd.external_contact_name, sd.external_contact_phone, sd.external_cost,
    sd.assigned_to_user_id,
    assigned_user.name AS assigned_user_name,
    sd.created_by_user_id,
    creator.name AS created_by_user_name,
    sd.status,
    sd.recipient_name,
    sd.recipient_phone,
    sd.delivery_address,
    sd.delivery_reference,
    sd.scheduled_at,
    sd.assigned_at,
    sd.out_for_delivery_at,
    sd.delivered_at,
    sd.failed_at,
    sd.cancelled_at,
    sd.failure_reason,
    sd.observation,
    sd.created_at,
    sd.updated_at
  FROM sale_deliveries sd
  INNER JOIN sales s
    ON s.idSale = sd.idSale
    AND s.idBusiness = sd.idBusiness
  LEFT JOIN users assigned_user ON assigned_user.idUser = sd.assigned_to_user_id
  LEFT JOIN users creator ON creator.idUser = sd.created_by_user_id
  WHERE sd.idBusiness = p_idBusiness
    AND sd.idSaleDelivery = p_idSaleDelivery
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_deliveries_list;
DELIMITER $$

CREATE PROCEDURE sp_deliveries_list(
  IN p_idBusiness INT,
  IN p_limit INT,
  IN p_offset INT,
  IN p_status VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_assignedToUserId INT,
  IN p_search VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT
    sd.idSaleDelivery,
    sd.idBusiness,
    sd.idSale,
    s.sale_number,
    s.total,
    sd.provider_type, sd.external_provider_name, sd.external_reference, sd.external_contact_name, sd.external_contact_phone, sd.external_cost,
    sd.assigned_to_user_id,
    assigned_user.name AS assigned_user_name,
    sd.created_by_user_id,
    creator.name AS created_by_user_name,
    sd.status,
    sd.recipient_name,
    sd.recipient_phone,
    sd.delivery_address,
    sd.delivery_reference,
    sd.scheduled_at,
    sd.assigned_at,
    sd.out_for_delivery_at,
    sd.delivered_at,
    sd.failed_at,
    sd.cancelled_at,
    sd.failure_reason,
    sd.observation,
    sd.created_at,
    sd.updated_at
  FROM sale_deliveries sd
  INNER JOIN sales s
    ON s.idSale = sd.idSale
    AND s.idBusiness = sd.idBusiness
  LEFT JOIN users assigned_user ON assigned_user.idUser = sd.assigned_to_user_id
  LEFT JOIN users creator ON creator.idUser = sd.created_by_user_id
  WHERE sd.idBusiness = p_idBusiness
    AND (p_status IS NULL OR sd.status = p_status)
    AND (p_assignedToUserId IS NULL OR sd.assigned_to_user_id = p_assignedToUserId)
    AND (
      p_search IS NULL
      OR p_search = ''
      OR s.sale_number COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR sd.recipient_name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR sd.external_provider_name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR sd.external_reference COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR sd.delivery_address COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
    )
  ORDER BY sd.created_at DESC, sd.idSaleDelivery DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM sale_deliveries sd
  INNER JOIN sales s
    ON s.idSale = sd.idSale
    AND s.idBusiness = sd.idBusiness
  WHERE sd.idBusiness = p_idBusiness
    AND (p_status IS NULL OR sd.status = p_status)
    AND (p_assignedToUserId IS NULL OR sd.assigned_to_user_id = p_assignedToUserId)
    AND (
      p_search IS NULL
      OR p_search = ''
      OR s.sale_number COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR sd.recipient_name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR sd.external_provider_name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR sd.external_reference COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR sd.delivery_address COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
    );
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_delivery_assign;
DELIMITER $$

CREATE PROCEDURE sp_delivery_assign(
  IN p_idBusiness INT,
  IN p_idSaleDelivery BIGINT,
  IN p_assignedToUserId INT,
  IN p_actorUserId INT,
  IN p_providerType VARCHAR(20), IN p_externalProviderName VARCHAR(120), IN p_externalReference VARCHAR(150),
  IN p_externalContactName VARCHAR(160), IN p_externalContactPhone VARCHAR(80), IN p_externalCost DECIMAL(18,2)
)
BEGIN
  DECLARE v_previousStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_assignedToUserId INT;
  DECLARE v_previousProvider JSON;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  IF NOT EXISTS (SELECT 1 FROM business_users bu JOIN users u ON u.idUser = bu.idUser WHERE bu.idBusiness = p_idBusiness AND bu.idUser = p_actorUserId AND bu.is_active = 1 AND u.is_active = 1) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_ACTOR_NOT_FOUND'; END IF;


  SELECT status, assigned_to_user_id, JSON_OBJECT('providerType', provider_type, 'assignedToUserId', assigned_to_user_id, 'externalProviderName', external_provider_name, 'externalReference', external_reference, 'externalCost', external_cost)
  INTO v_previousStatus, v_assignedToUserId, v_previousProvider
  FROM sale_deliveries
  WHERE idBusiness = p_idBusiness
    AND idSaleDelivery = p_idSaleDelivery
  LIMIT 1
  FOR UPDATE;

  IF v_previousStatus IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_NOT_FOUND';
  END IF;

  IF v_previousStatus NOT IN ('PENDING', 'ASSIGNED') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_CANNOT_BE_ASSIGNED';
  END IF;

  IF p_providerType IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_PROVIDER_INVALID'; END IF;
  CALL sp_delivery_validate_provider(p_idBusiness, p_assignedToUserId, p_providerType, p_externalProviderName, p_externalReference, p_externalContactName, p_externalContactPhone, p_externalCost);

  UPDATE sale_deliveries
  SET
    provider_type = p_providerType, external_provider_name = p_externalProviderName, external_reference = p_externalReference, external_contact_name = p_externalContactName, external_contact_phone = p_externalContactPhone, external_cost = p_externalCost,
    assigned_to_user_id = p_assignedToUserId,
    status = 'ASSIGNED',
    assigned_at = NOW(),
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idSaleDelivery = p_idSaleDelivery;

  INSERT INTO delivery_events
    (idBusiness, idSaleDelivery, event_type, previous_status, new_status, metadata, created_by_user_id)
  VALUES
    (p_idBusiness, p_idSaleDelivery, 'DELIVERY_ASSIGNED', v_previousStatus, 'ASSIGNED', JSON_MERGE_PATCH(JSON_OBJECT('providerType', p_providerType, 'assignedToUserId', p_assignedToUserId, 'externalProviderName', p_externalProviderName, 'externalReference', p_externalReference, 'externalContactName', p_externalContactName, 'externalContactPhone', p_externalContactPhone, 'externalCost', p_externalCost), JSON_OBJECT('previousAssignment', JSON_EXTRACT(v_previousProvider, '$'))), p_actorUserId);

  COMMIT;

  CALL sp_delivery_get_by_id(p_idBusiness, p_idSaleDelivery);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_delivery_change_status;
DELIMITER $$

CREATE PROCEDURE sp_delivery_change_status(
  IN p_idBusiness INT,
  IN p_idSaleDelivery BIGINT,
  IN p_newStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_actorUserId INT,
  IN p_actorCanViewAll TINYINT,
  IN p_failureReason VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_scheduledAt DATETIME,
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_previousStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_eventType VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_assignedToUserId INT;
  DECLARE v_actorExists INT DEFAULT 0;
  DECLARE v_providerType VARCHAR(20);
  DECLARE v_saleId INT;
  DECLARE v_assignment JSON;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT s.idSale INTO v_saleId FROM sales s WHERE s.idBusiness = p_idBusiness AND s.idSale = (SELECT idSale FROM sale_deliveries WHERE idBusiness = p_idBusiness AND idSaleDelivery = p_idSaleDelivery) FOR UPDATE;

  SELECT status, assigned_to_user_id, provider_type
  INTO v_previousStatus, v_assignedToUserId, v_providerType
  FROM sale_deliveries
  WHERE idBusiness = p_idBusiness
    AND idSaleDelivery = p_idSaleDelivery
  LIMIT 1
  FOR UPDATE;

  IF v_previousStatus IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_NOT_FOUND';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM business_users bu JOIN users u ON u.idUser = bu.idUser WHERE bu.idBusiness = p_idBusiness AND bu.idUser = p_actorUserId AND bu.is_active = 1 AND u.is_active = 1) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_ACTOR_NOT_FOUND'; END IF;

  SELECT COUNT(*)
  INTO v_actorExists
  FROM business_users
  WHERE idBusiness = p_idBusiness
    AND idUser = p_actorUserId
    AND is_active = 1;

  IF v_actorExists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_ACTOR_NOT_FOUND';
  END IF;

  IF COALESCE(p_actorCanViewAll, 0) = 0
    AND (v_providerType IS NULL OR v_providerType <> 'INTERNAL' OR v_assignedToUserId IS NULL OR v_assignedToUserId <> p_actorUserId)
  THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_FORBIDDEN';
  END IF;

  IF v_previousStatus IN ('DELIVERED', 'CANCELLED') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_FINAL_STATUS';
  END IF;

  IF p_newStatus NOT IN ('OUT_FOR_DELIVERY','DELIVERED','FAILED','PENDING','CANCELLED') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_INVALID_TRANSITION'; END IF;

  IF p_newStatus = 'OUT_FOR_DELIVERY' AND (v_previousStatus <> 'ASSIGNED' OR v_providerType IS NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_MUST_BE_ASSIGNED';
  END IF;

  IF p_newStatus = 'OUT_FOR_DELIVERY' AND v_providerType = 'THIRD_PARTY' AND EXISTS (
    SELECT 1 FROM sale_payments sp JOIN sale_deliveries sd ON sd.idBusiness = sp.idBusiness AND sd.idSale = sp.idSale
    JOIN payment_methods pm ON pm.idBusiness = sp.idBusiness AND pm.idPaymentMethod = sp.idPaymentMethod
    WHERE sd.idBusiness = p_idBusiness AND sd.idSaleDelivery = p_idSaleDelivery AND sp.status = 'PENDING' AND pm.affects_cash = 1
  ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'THIRD_PARTY_PENDING_CASH_PAYMENT_NOT_ALLOWED'; END IF;

  IF p_newStatus = 'DELIVERED' AND v_previousStatus NOT IN ('OUT_FOR_DELIVERY') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_MUST_BE_OUT_FOR_DELIVERY';
  END IF;

  IF p_newStatus = 'DELIVERED' AND EXISTS (
    SELECT 1
    FROM sale_deliveries sd
    INNER JOIN sale_payments sp
      ON sp.idBusiness = sd.idBusiness
      AND sp.idSale = sd.idSale
    INNER JOIN payment_methods pm
      ON pm.idBusiness = sp.idBusiness
      AND pm.idPaymentMethod = sp.idPaymentMethod
    WHERE sd.idBusiness = p_idBusiness
      AND sd.idSaleDelivery = p_idSaleDelivery
      AND sp.status = 'PENDING'
      AND pm.affects_cash = 1
    LIMIT 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_PENDING_CASH_PAYMENT_MUST_BE_COLLECTED';
  END IF;

  IF p_newStatus = 'FAILED' AND v_previousStatus <> 'OUT_FOR_DELIVERY' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_CANNOT_FAIL';
  END IF;

  IF p_newStatus = 'PENDING' AND v_previousStatus <> 'FAILED' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ONLY_FAILED_DELIVERY_CAN_BE_RESCHEDULED';
  END IF;

  IF p_newStatus = 'CANCELLED' AND v_previousStatus NOT IN ('PENDING', 'ASSIGNED', 'FAILED') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_CANNOT_BE_CANCELLED';
  END IF;

  SET v_eventType = CASE p_newStatus
    WHEN 'OUT_FOR_DELIVERY' THEN 'DELIVERY_OUT_FOR_DELIVERY'
    WHEN 'DELIVERED' THEN 'DELIVERY_DELIVERED'
    WHEN 'FAILED' THEN 'DELIVERY_FAILED'
    WHEN 'CANCELLED' THEN 'DELIVERY_CANCELLED'
    WHEN 'PENDING' THEN 'DELIVERY_RESCHEDULED'
    ELSE 'DELIVERY_RESCHEDULED'
  END;

  SELECT JSON_OBJECT('providerType', provider_type, 'assignedToUserId', assigned_to_user_id, 'externalProviderName', external_provider_name, 'externalReference', external_reference, 'externalContactName', external_contact_name, 'externalContactPhone', external_contact_phone, 'externalCost', external_cost) INTO v_assignment FROM sale_deliveries WHERE idBusiness = p_idBusiness AND idSaleDelivery = p_idSaleDelivery;

  UPDATE sale_deliveries
  SET
    status = p_newStatus,
    provider_type = IF(p_newStatus = 'PENDING', NULL, provider_type),
    external_provider_name = IF(p_newStatus = 'PENDING', NULL, external_provider_name),
    external_reference = IF(p_newStatus = 'PENDING', NULL, external_reference),
    external_contact_name = IF(p_newStatus = 'PENDING', NULL, external_contact_name),
    external_contact_phone = IF(p_newStatus = 'PENDING', NULL, external_contact_phone),
    external_cost = IF(p_newStatus = 'PENDING', NULL, external_cost),
    assigned_to_user_id = IF(p_newStatus = 'PENDING', NULL, assigned_to_user_id),
    assigned_at = IF(p_newStatus = 'PENDING', NULL, assigned_at),
    scheduled_at = COALESCE(p_scheduledAt, scheduled_at),
    out_for_delivery_at = IF(p_newStatus = 'OUT_FOR_DELIVERY', NOW(), out_for_delivery_at),
    delivered_at = IF(p_newStatus = 'DELIVERED', NOW(), delivered_at),
    failed_at = IF(p_newStatus = 'FAILED', NOW(), failed_at),
    cancelled_at = IF(p_newStatus = 'CANCELLED', NOW(), cancelled_at),
    failure_reason = CASE
      WHEN p_newStatus = 'FAILED' THEN p_failureReason
      WHEN p_newStatus = 'PENDING' THEN NULL
      ELSE failure_reason
    END,
    observation = COALESCE(p_observation, observation),
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idSaleDelivery = p_idSaleDelivery;

  INSERT INTO delivery_events
    (idBusiness, idSaleDelivery, event_type, previous_status, new_status, metadata, created_by_user_id)
  VALUES
    (p_idBusiness, p_idSaleDelivery, v_eventType, v_previousStatus, p_newStatus, JSON_MERGE_PATCH(IF(p_newStatus = 'PENDING', JSON_OBJECT('previousAssignment', JSON_EXTRACT(v_assignment, '$')), v_assignment), JSON_OBJECT('failureReason', p_failureReason, 'scheduledAt', p_scheduledAt, 'observation', p_observation)), p_actorUserId);

  COMMIT;

  CALL sp_delivery_get_by_id(p_idBusiness, p_idSaleDelivery);
END$$

DELIMITER ;
