-- Orders Core: service owns all write transactions. No stock or economic writes.
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_order_lock$$
CREATE PROCEDURE sp_order_lock(IN p_business INT, IN p_order INT)
BEGIN
  SELECT * FROM orders WHERE idBusiness = p_business AND idOrder = p_order FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_order_get$$
CREATE PROCEDURE sp_order_get(IN p_business INT, IN p_order INT)
BEGIN
  SELECT * FROM orders WHERE idBusiness = p_business AND idOrder = p_order;
  SELECT * FROM order_details WHERE idBusiness = p_business AND idOrder = p_order ORDER BY idOrderDetail;
END$$

DROP PROCEDURE IF EXISTS sp_order_create$$
CREATE PROCEDURE sp_order_create(
  IN p_business INT, IN p_actor INT, IN p_customer INT, IN p_deposit INT, IN p_payment INT,
  IN p_fulfillment VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_snapshot LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_recipient VARCHAR(240) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_phone VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_reference VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_subtotal DECIMAL(18,2), IN p_discount DECIMAL(18,2), IN p_fee DECIMAL(18,2), IN p_total DECIMAL(18,2),
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_key VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  IF p_key IS NULL OR CHAR_LENGTH(TRIM(p_key)) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'IDEMPOTENCY_KEY_REQUIRED';
  END IF;
  INSERT INTO orders (idBusiness, idCustomer, idDeposit, expected_payment_method_id, order_number, idempotency_key,
    fulfillment_type, customer_snapshot, delivery_recipient_name, delivery_recipient_phone, delivery_address,
    delivery_reference, subtotal, discount_total, delivery_fee, total, observation, created_by_user_id, updated_by_user_id)
  VALUES (p_business, p_customer, p_deposit, p_payment, p_number, p_key, p_fulfillment, p_snapshot,
    p_recipient, p_phone, p_address, p_reference, p_subtotal, p_discount, p_fee, p_total, p_observation, p_actor, p_actor);
  SELECT LAST_INSERT_ID() AS idOrder;
END$$

DROP PROCEDURE IF EXISTS sp_order_update$$
CREATE PROCEDURE sp_order_update(
  IN p_order INT, IN p_business INT, IN p_actor INT, IN p_customer INT, IN p_deposit INT, IN p_payment INT,
  IN p_fulfillment VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_snapshot LONGTEXT,
  IN p_recipient VARCHAR(240) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_phone VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_reference VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_subtotal DECIMAL(18,2), IN p_discount DECIMAL(18,2), IN p_fee DECIMAL(18,2), IN p_total DECIMAL(18,2),
  IN p_observation VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  SELECT status INTO v_status FROM orders WHERE idBusiness = p_business AND idOrder = p_order FOR UPDATE;
  IF v_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ORDER_NOT_FOUND'; END IF;
  IF v_status NOT IN ('PENDING','CONFIRMED') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ORDER_NOT_EDITABLE'; END IF;
  UPDATE orders SET idCustomer = p_customer, idDeposit = p_deposit, expected_payment_method_id = p_payment,
    fulfillment_type = p_fulfillment, customer_snapshot = p_snapshot, delivery_recipient_name = p_recipient,
    delivery_recipient_phone = p_phone, delivery_address = p_address, delivery_reference = p_reference,
    subtotal = p_subtotal, discount_total = p_discount, delivery_fee = p_fee, total = p_total,
    observation = p_observation, updated_by_user_id = p_actor, updated_at = NOW()
  WHERE idBusiness = p_business AND idOrder = p_order;
  DELETE FROM order_details WHERE idBusiness = p_business AND idOrder = p_order;
END$$

DROP PROCEDURE IF EXISTS sp_order_add_detail$$
CREATE PROCEDURE sp_order_add_detail(
  IN p_business INT, IN p_order INT, IN p_product INT, IN p_name VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_barcode VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_unit VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_mode VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_quantity DECIMAL(18,2), IN p_price DECIMAL(18,2),
  IN p_discount DECIMAL(18,2), IN p_total DECIMAL(18,2)
)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM orders WHERE idBusiness = p_business AND idOrder = p_order AND status IN ('PENDING','CONFIRMED')) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ORDER_NOT_EDITABLE';
  END IF;
  INSERT INTO order_details (idBusiness, idOrder, idProduct, product_name, barcode, unit_type, sale_mode, quantity, unit_price, discount, total)
  VALUES (p_business, p_order, p_product, p_name, p_barcode, p_unit, p_mode, p_quantity, p_price, p_discount, p_total);
END$$

DROP PROCEDURE IF EXISTS sp_order_change_status$$
CREATE PROCEDURE sp_order_change_status(
  IN p_business INT, IN p_order INT, IN p_actor INT, IN p_from VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_to VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_reason VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE v_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  SELECT status INTO v_status FROM orders WHERE idBusiness = p_business AND idOrder = p_order FOR UPDATE;
  IF v_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ORDER_NOT_FOUND'; END IF;
  IF p_to IS NULL OR p_from IS NULL OR v_status <> p_from OR NOT (
    (v_status = 'PENDING' AND p_to = 'CONFIRMED') OR
    (v_status = 'CONFIRMED' AND p_to = 'PREPARING') OR
    (v_status = 'PREPARING' AND p_to = 'READY') OR
    (v_status IN ('PENDING','CONFIRMED','PREPARING','READY') AND p_to = 'CANCELLED'
      AND p_reason IS NOT NULL AND CHAR_LENGTH(TRIM(p_reason)) >= 3)
  ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ORDER_INVALID_TRANSITION'; END IF;
  -- COMPLETED is reserved for a future atomic Order -> Sale conversion.
  UPDATE orders SET status = p_to, updated_by_user_id = p_actor, updated_at = NOW(),
    cancellation_reason = CASE WHEN p_to = 'CANCELLED' THEN TRIM(p_reason) ELSE NULL END
  WHERE idBusiness = p_business AND idOrder = p_order;
END$$

DROP PROCEDURE IF EXISTS sp_order_add_event$$
CREATE PROCEDURE sp_order_add_event(
  IN p_business INT, IN p_order INT, IN p_actor INT, IN p_type VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_from VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_to VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_reason VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  INSERT INTO order_events (idBusiness, idOrder, idUser, event_type, from_status, to_status, reason)
  VALUES (p_business, p_order, p_actor, p_type, p_from, p_to, p_reason);
END$$

DROP PROCEDURE IF EXISTS sp_order_events$$
CREATE PROCEDURE sp_order_events(IN p_business INT, IN p_order INT)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM orders WHERE idBusiness = p_business AND idOrder = p_order) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ORDER_NOT_FOUND';
  END IF;
  SELECT * FROM order_events WHERE idBusiness = p_business AND idOrder = p_order ORDER BY idOrderEvent;
END$$

DROP PROCEDURE IF EXISTS sp_order_list$$
CREATE PROCEDURE sp_order_list(
  IN p_business INT, IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_customer INT, IN p_deposit INT, IN p_fulfillment VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_search VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_from DATE, IN p_to DATE, IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT o.* FROM orders o
  WHERE o.idBusiness = p_business
    AND (p_status IS NULL OR o.status = p_status)
    AND (p_customer IS NULL OR o.idCustomer = p_customer)
    AND (p_deposit IS NULL OR o.idDeposit = p_deposit)
    AND (p_fulfillment IS NULL OR o.fulfillment_type = p_fulfillment)
    AND (p_search IS NULL OR LOCATE(p_search, o.order_number) > 0 OR LOCATE(p_search, JSON_UNQUOTE(JSON_EXTRACT(o.customer_snapshot, '$.fullName'))) > 0)
    AND (p_from IS NULL OR o.created_at >= p_from)
    AND (p_to IS NULL OR DATE(o.created_at) <= p_to)
  ORDER BY o.created_at DESC, o.idOrder DESC LIMIT p_limit OFFSET p_offset;

  -- Same full filtered set as rows, never only the page.
  SELECT COUNT(*) AS totalRecords, COALESCE(SUM(o.total), 0) AS totalAmount,
    COALESCE(SUM(o.status = 'PENDING'),0) AS pending, COALESCE(SUM(o.status = 'CONFIRMED'),0) AS confirmed,
    COALESCE(SUM(o.status = 'PREPARING'),0) AS preparing, COALESCE(SUM(o.status = 'READY'),0) AS ready,
    COALESCE(SUM(o.status = 'COMPLETED'),0) AS completed, COALESCE(SUM(o.status = 'CANCELLED'),0) AS cancelled
  FROM orders o WHERE o.idBusiness = p_business
    AND (p_status IS NULL OR o.status = p_status)
    AND (p_customer IS NULL OR o.idCustomer = p_customer)
    AND (p_deposit IS NULL OR o.idDeposit = p_deposit)
    AND (p_fulfillment IS NULL OR o.fulfillment_type = p_fulfillment)
    AND (p_search IS NULL OR LOCATE(p_search, o.order_number) > 0 OR LOCATE(p_search, JSON_UNQUOTE(JSON_EXTRACT(o.customer_snapshot, '$.fullName'))) > 0)
    AND (p_from IS NULL OR o.created_at >= p_from)
    AND (p_to IS NULL OR DATE(o.created_at) <= p_to);
END$$

DROP PROCEDURE IF EXISTS sp_order_products$$
CREATE PROCEDURE sp_order_products(IN p_business INT, IN p_deposit INT, IN p_search VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN p_limit INT, IN p_offset INT)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM deposits WHERE idBusiness = p_business AND idDeposit = p_deposit AND is_active = 1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ORDER_DEPOSIT_INVALID';
  END IF;
  SELECT p.idProduct, p.name, p.barcode, p.unit_type, p.sale_mode, p.price_sale, COALESCE(s.quantity, 0) AS stock_quantity
  FROM products p LEFT JOIN stock s ON s.idBusiness = p.idBusiness AND s.idProduct = p.idProduct AND s.idDeposit = p_deposit
  WHERE p.idBusiness = p_business AND p.is_active = 1
    AND (p_search IS NULL OR LOCATE(p_search, p.name) > 0 OR LOCATE(p_search, p.barcode) > 0)
  ORDER BY p.name, p.idProduct LIMIT p_limit OFFSET p_offset;
  SELECT COUNT(*) AS totalRecords FROM products p WHERE p.idBusiness = p_business AND p.is_active = 1
    AND (p_search IS NULL OR LOCATE(p_search, p.name) > 0 OR LOCATE(p_search, p.barcode) > 0);
END$$
DELIMITER ;
