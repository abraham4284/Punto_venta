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
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_idSaleDelivery BIGINT;
  DECLARE v_initialStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING';

  IF p_assignedToUserId IS NOT NULL THEN
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
      AND bu.role IN ('DELIVERY', 'ADMIN', 'OWNER')
      AND bu.is_active = 1
      AND u.is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_USER_NOT_FOUND';
  END IF;

  INSERT INTO sale_deliveries (
    idBusiness,
    idSale,
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
    p_assignedToUserId,
    p_createdByUserId,
    v_initialStatus,
    p_recipientName,
    p_recipientPhone,
    p_deliveryAddress,
    p_deliveryReference,
    p_scheduledAt,
    IF(p_assignedToUserId IS NULL, NULL, NOW()),
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
    JSON_OBJECT('assignedToUserId', p_assignedToUserId, 'scheduledAt', p_scheduledAt),
    p_createdByUserId
  );

  CALL sp_delivery_get_by_id(p_idBusiness, v_idSaleDelivery);
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
  IN p_actorUserId INT
)
BEGIN
  DECLARE v_previousStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_assignedToUserId INT;
  DECLARE v_actorRole VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  SELECT status, assigned_to_user_id
  INTO v_previousStatus, v_assignedToUserId
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

  IF NOT EXISTS (
    SELECT 1
    FROM business_users bu
    INNER JOIN users u ON u.idUser = bu.idUser
    WHERE bu.idBusiness = p_idBusiness
      AND bu.idUser = p_assignedToUserId
      AND bu.role IN ('DELIVERY', 'ADMIN', 'OWNER')
      AND bu.is_active = 1
      AND u.is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_USER_NOT_FOUND';
  END IF;

  UPDATE sale_deliveries
  SET
    assigned_to_user_id = p_assignedToUserId,
    status = 'ASSIGNED',
    assigned_at = NOW(),
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idSaleDelivery = p_idSaleDelivery;

  INSERT INTO delivery_events
    (idBusiness, idSaleDelivery, event_type, previous_status, new_status, metadata, created_by_user_id)
  VALUES
    (p_idBusiness, p_idSaleDelivery, 'DELIVERY_ASSIGNED', v_previousStatus, 'ASSIGNED', JSON_OBJECT('assignedToUserId', p_assignedToUserId), p_actorUserId);

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
  IN p_failureReason VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_scheduledAt DATETIME,
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_previousStatus VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_eventType VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_assignedToUserId INT;
  DECLARE v_actorRole VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  SELECT status, assigned_to_user_id
  INTO v_previousStatus, v_assignedToUserId
  FROM sale_deliveries
  WHERE idBusiness = p_idBusiness
    AND idSaleDelivery = p_idSaleDelivery
  LIMIT 1
  FOR UPDATE;

  IF v_previousStatus IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_NOT_FOUND';
  END IF;

  SELECT role
  INTO v_actorRole
  FROM business_users
  WHERE idBusiness = p_idBusiness
    AND idUser = p_actorUserId
    AND is_active = 1
  LIMIT 1;

  IF v_actorRole IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_ACTOR_NOT_FOUND';
  END IF;

  IF v_actorRole = 'DELIVERY'
    AND (v_assignedToUserId IS NULL OR v_assignedToUserId <> p_actorUserId)
  THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_FORBIDDEN';
  END IF;

  IF v_previousStatus IN ('DELIVERED', 'CANCELLED') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_FINAL_STATUS';
  END IF;

  IF p_newStatus = 'OUT_FOR_DELIVERY' AND v_previousStatus NOT IN ('ASSIGNED') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_MUST_BE_ASSIGNED';
  END IF;

  IF p_newStatus = 'DELIVERED' AND v_previousStatus NOT IN ('OUT_FOR_DELIVERY') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_MUST_BE_OUT_FOR_DELIVERY';
  END IF;

  IF p_newStatus = 'FAILED' AND v_previousStatus NOT IN ('ASSIGNED', 'OUT_FOR_DELIVERY') THEN
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

  UPDATE sale_deliveries
  SET
    status = p_newStatus,
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
    (p_idBusiness, p_idSaleDelivery, v_eventType, v_previousStatus, p_newStatus, JSON_OBJECT('failureReason', p_failureReason, 'scheduledAt', p_scheduledAt, 'observation', p_observation), p_actorUserId);

  CALL sp_delivery_get_by_id(p_idBusiness, p_idSaleDelivery);
END$$

DELIMITER ;
