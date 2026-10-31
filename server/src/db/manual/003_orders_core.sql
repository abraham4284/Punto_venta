-- F3 Orders Core: additive manual migration for an existing Cajora baseline + Customers v2.
-- OPERATOR ONLY: backup and confirm selected database; stop writes. DDL commits implicitly.
-- No SOURCE, no stock/economic mutation, no reset of existing role grants.
-- Then import procedures/orders.sql in full before deploying backend.

-- Orders Core F3: no economic or inventory effects.
CREATE TABLE IF NOT EXISTS `orders` (
  `idOrder` int NOT NULL AUTO_INCREMENT,
  `idBusiness` int NOT NULL,
  `idCustomer` int NOT NULL,
  `idDeposit` int NOT NULL,
  `expected_payment_method_id` int DEFAULT NULL,
  `order_number` varchar(50) NOT NULL,
  `idempotency_key` varchar(64) NOT NULL,
  `status` enum('PENDING','CONFIRMED','PREPARING','READY','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `fulfillment_type` enum('PICKUP','DELIVERY') NOT NULL,
  `customer_snapshot` json NOT NULL,
  `delivery_recipient_name` varchar(240) DEFAULT NULL,
  `delivery_recipient_phone` varchar(80) DEFAULT NULL,
  `delivery_address` varchar(255) DEFAULT NULL,
  `delivery_reference` varchar(500) DEFAULT NULL,
  `subtotal` decimal(18,2) NOT NULL,
  `discount_total` decimal(18,2) NOT NULL,
  `delivery_fee` decimal(18,2) NOT NULL DEFAULT '0.00',
  `total` decimal(18,2) NOT NULL,
  `observation` varchar(500) DEFAULT NULL,
  `cancellation_reason` varchar(500) DEFAULT NULL,
  `created_by_user_id` int NOT NULL,
  `updated_by_user_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_details` (
  `idOrderDetail` int NOT NULL AUTO_INCREMENT,
  `idBusiness` int NOT NULL,
  `idOrder` int NOT NULL,
  `idProduct` int NOT NULL,
  `product_name` varchar(160) NOT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `unit_type` enum('UNIT','KG','GRAM','LITER','METER') NOT NULL,
  `sale_mode` enum('STOCK','ON_ORDER') NOT NULL,
  `quantity` decimal(18,2) NOT NULL,
  `unit_price` decimal(18,2) NOT NULL,
  `discount` decimal(18,2) NOT NULL,
  `total` decimal(18,2) NOT NULL,
  PRIMARY KEY (`idOrderDetail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_events` (
  `idOrderEvent` int NOT NULL AUTO_INCREMENT,
  `idBusiness` int NOT NULL,
  `idOrder` int NOT NULL,
  `idUser` int NOT NULL,
  `event_type` enum('CREATED','UPDATED','STATUS_CHANGED','CANCELLED') NOT NULL,
  `from_status` enum('PENDING','CONFIRMED','PREPARING','READY','COMPLETED','CANCELLED') DEFAULT NULL,
  `to_status` enum('PENDING','CONFIRMED','PREPARING','READY','COMPLETED','CANCELLED') NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idOrderEvent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$
DROP PROCEDURE IF EXISTS sp_add_index_if_not_exists$$
CREATE PROCEDURE sp_add_index_if_not_exists(
  IN p_table_name VARCHAR(128),
  IN p_index_name VARCHAR(128),
  IN p_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND INDEX_NAME = p_index_name
  ) THEN
    SET @ddl = p_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- Orders Core F3
CALL sp_add_index_if_not_exists('orders', 'uk_orders_business_id', 'ALTER TABLE orders ADD UNIQUE KEY uk_orders_business_id (idBusiness, idOrder)');
CALL sp_add_index_if_not_exists('orders', 'uq_orders_business_number', 'ALTER TABLE orders ADD UNIQUE KEY uq_orders_business_number (idBusiness, order_number)');
CALL sp_add_index_if_not_exists('orders', 'uq_orders_business_idempotency', 'ALTER TABLE orders ADD UNIQUE KEY uq_orders_business_idempotency (idBusiness, idempotency_key)');
CALL sp_add_index_if_not_exists('orders', 'idx_orders_business_status_created', 'ALTER TABLE orders ADD KEY idx_orders_business_status_created (idBusiness, status, created_at, idOrder)');
CALL sp_add_index_if_not_exists('orders', 'idx_orders_business_created', 'ALTER TABLE orders ADD KEY idx_orders_business_created (idBusiness, created_at, idOrder)');
CALL sp_add_index_if_not_exists('order_details', 'uq_order_details_product', 'ALTER TABLE order_details ADD UNIQUE KEY uq_order_details_product (idBusiness, idOrder, idProduct)');
CALL sp_add_index_if_not_exists('order_events', 'idx_order_events_business_order', 'ALTER TABLE order_events ADD KEY idx_order_events_business_order (idBusiness, idOrder, idOrderEvent)');
DROP PROCEDURE IF EXISTS sp_add_index_if_not_exists;

DELIMITER $$
DROP PROCEDURE IF EXISTS sp_add_foreign_key_if_not_exists$$
CREATE PROCEDURE sp_add_foreign_key_if_not_exists(
  IN p_constraint_name VARCHAR(128),
  IN p_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = p_constraint_name
  ) THEN
    SET @ddl = p_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- Orders Core F3
CALL sp_add_foreign_key_if_not_exists('fk_orders_business', 'ALTER TABLE orders ADD CONSTRAINT fk_orders_business FOREIGN KEY (idBusiness) REFERENCES businesses (idBusiness)');
CALL sp_add_foreign_key_if_not_exists('fk_orders_customer', 'ALTER TABLE orders ADD CONSTRAINT fk_orders_customer FOREIGN KEY (idBusiness, idCustomer) REFERENCES customers (idBusiness, idCustomer)');
CALL sp_add_foreign_key_if_not_exists('fk_orders_deposit', 'ALTER TABLE orders ADD CONSTRAINT fk_orders_deposit FOREIGN KEY (idBusiness, idDeposit) REFERENCES deposits (idBusiness, idDeposit)');
CALL sp_add_foreign_key_if_not_exists('fk_orders_payment_method', 'ALTER TABLE orders ADD CONSTRAINT fk_orders_payment_method FOREIGN KEY (idBusiness, expected_payment_method_id) REFERENCES payment_methods (idBusiness, idPaymentMethod)');
CALL sp_add_foreign_key_if_not_exists('fk_orders_creator', 'ALTER TABLE orders ADD CONSTRAINT fk_orders_creator FOREIGN KEY (idBusiness, created_by_user_id) REFERENCES business_users (idBusiness, idUser)');
CALL sp_add_foreign_key_if_not_exists('fk_orders_updater', 'ALTER TABLE orders ADD CONSTRAINT fk_orders_updater FOREIGN KEY (idBusiness, updated_by_user_id) REFERENCES business_users (idBusiness, idUser)');
CALL sp_add_foreign_key_if_not_exists('fk_order_details_order', 'ALTER TABLE order_details ADD CONSTRAINT fk_order_details_order FOREIGN KEY (idBusiness, idOrder) REFERENCES orders (idBusiness, idOrder)');
CALL sp_add_foreign_key_if_not_exists('fk_order_details_product', 'ALTER TABLE order_details ADD CONSTRAINT fk_order_details_product FOREIGN KEY (idBusiness, idProduct) REFERENCES products (idBusiness, idProduct)');
CALL sp_add_foreign_key_if_not_exists('fk_order_events_order', 'ALTER TABLE order_events ADD CONSTRAINT fk_order_events_order FOREIGN KEY (idBusiness, idOrder) REFERENCES orders (idBusiness, idOrder)');
CALL sp_add_foreign_key_if_not_exists('fk_order_events_actor', 'ALTER TABLE order_events ADD CONSTRAINT fk_order_events_actor FOREIGN KEY (idBusiness, idUser) REFERENCES business_users (idBusiness, idUser)');
DROP PROCEDURE IF EXISTS sp_add_foreign_key_if_not_exists;

DELIMITER $$
DROP PROCEDURE IF EXISTS sp_add_check_if_not_exists$$
CREATE PROCEDURE sp_add_check_if_not_exists(
  IN p_table_name VARCHAR(128),
  IN p_constraint_name VARCHAR(128),
  IN p_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND CONSTRAINT_NAME = p_constraint_name
      AND CONSTRAINT_TYPE = 'CHECK'
  ) THEN
    SET @ddl = p_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- Orders Core F3
CALL sp_add_check_if_not_exists('orders', 'chk_orders_totals', 'ALTER TABLE orders ADD CONSTRAINT chk_orders_totals CHECK (subtotal >= 0 AND discount_total >= 0 AND subtotal >= discount_total AND delivery_fee >= 0 AND total = subtotal - discount_total + delivery_fee)');
CALL sp_add_check_if_not_exists('orders', 'chk_orders_delivery', 'ALTER TABLE orders ADD CONSTRAINT chk_orders_delivery CHECK ((fulfillment_type = ''PICKUP'' AND delivery_recipient_name IS NULL AND delivery_recipient_phone IS NULL AND delivery_address IS NULL AND delivery_reference IS NULL AND delivery_fee = 0) OR (fulfillment_type = ''DELIVERY'' AND delivery_recipient_name IS NOT NULL AND CHAR_LENGTH(TRIM(delivery_recipient_name)) >= 2 AND delivery_recipient_phone IS NOT NULL AND CHAR_LENGTH(TRIM(delivery_recipient_phone)) > 0 AND delivery_address IS NOT NULL AND CHAR_LENGTH(TRIM(delivery_address)) >= 3))');
CALL sp_add_check_if_not_exists('orders', 'chk_orders_cancel_reason', 'ALTER TABLE orders ADD CONSTRAINT chk_orders_cancel_reason CHECK ((status = ''CANCELLED'' AND cancellation_reason IS NOT NULL AND CHAR_LENGTH(TRIM(cancellation_reason)) >= 3) OR (status <> ''CANCELLED'' AND cancellation_reason IS NULL))');
CALL sp_add_check_if_not_exists('order_details', 'chk_order_details_math', 'ALTER TABLE order_details ADD CONSTRAINT chk_order_details_math CHECK (quantity > 0 AND unit_price >= 0 AND discount >= 0 AND total >= 0 AND total = ROUND(quantity * unit_price, 2) - discount AND (unit_type <> ''UNIT'' OR quantity = FLOOR(quantity)))');
DROP PROCEDURE IF EXISTS sp_add_check_if_not_exists;

-- Orders Core F3: additive grants, no unrelated permission changes.
INSERT INTO permissions (code, module, action, name, description, is_active) VALUES
('orders.view','orders','view','Ver pedidos','Permite consultar pedidos y productos para pedidos',1),
('orders.create','orders','create','Crear pedidos','Permite registrar pedidos internos',1),
('orders.update','orders','update','Editar pedidos','Permite editar pedidos pendientes o confirmados',1),
('orders.change_status','orders','change_status','Cambiar estado de pedidos','Permite avanzar la preparacion de pedidos',1),
('orders.cancel','orders','cancel','Cancelar pedidos','Permite cancelar pedidos no terminales',1)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), is_active = VALUES(is_active);
INSERT IGNORE INTO role_permissions (role, idPermission)
SELECT 'ADMIN', idPermission FROM permissions WHERE code IN ('orders.view','orders.create','orders.update','orders.change_status','orders.cancel');
INSERT IGNORE INTO role_permissions (role, idPermission)
SELECT 'SELLER', idPermission FROM permissions WHERE code IN ('orders.view','orders.create','orders.update');
