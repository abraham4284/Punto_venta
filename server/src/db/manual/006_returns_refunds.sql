-- F8 OPERATOR ONLY. Backup, confirm DB, stop writes. DDL commits implicitly.
-- After structure import procedures/sale_returns.sql and procedures/sales.sql; deploy matching backend.
-- No reset, seed reinstall, FK disabling or historical financial rewrites.

-- F8: immutable compensatory records; original Sales/Payments remain unchanged.
CREATE TABLE IF NOT EXISTS sale_returns (
  idSaleReturn BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  idBusiness INT NOT NULL, idSale INT NOT NULL,
  return_number VARCHAR(50) NOT NULL, idempotency_key VARCHAR(64) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  merchandise_amount DECIMAL(18,2) NOT NULL, delivery_fee_refund DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_refund DECIMAL(18,2) NOT NULL, reason VARCHAR(500) NOT NULL, observation VARCHAR(500) NULL,
  created_by_user_id INT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS sale_return_items (
  idSaleReturnItem BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  idBusiness INT NOT NULL, idSaleReturn BIGINT NOT NULL, idSaleDetail INT NOT NULL, idProduct INT NOT NULL,
  quantity DECIMAL(18,2) NOT NULL, refund_amount DECIMAL(18,2) NOT NULL, restock TINYINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS sale_refunds (
  idSaleRefund BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  idBusiness INT NOT NULL, idSaleReturn BIGINT NOT NULL, idSalePayment BIGINT NOT NULL,
  amount DECIMAL(18,2) NOT NULL, idCashSession BIGINT NULL, idCashMovement BIGINT NULL,
  reference VARCHAR(150) NULL, observation VARCHAR(500) NULL,
  created_by_user_id INT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE stock_movements MODIFY movement_type ENUM('PURCHASE','SALE','TRANSFER_IN','TRANSFER_OUT','ADJUSTMENT_IN','ADJUSTMENT_OUT','SALE_RETURN') NOT NULL,
 MODIFY reference_type ENUM('SALE','PURCHASE','TRANSFER','ADJUSTMENT','SALE_RETURN') NULL,
 MODIFY reference_id BIGINT NULL;
ALTER TABLE sale_payment_events MODIFY event_type ENUM('PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_METHOD_CHANGED','PAYMENT_COLLECTED','PAYMENT_CONFIRMED','PAYMENT_CANCELLED','PAYMENT_SETTLED','PAYMENT_MIGRATED','PAYMENT_REFUNDED') NOT NULL;
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

DROP PROCEDURE IF EXISTS sp_rename_column_if_exists$$
CREATE PROCEDURE sp_rename_column_if_exists(
  IN p_table_name VARCHAR(128),
  IN p_old_column_name VARCHAR(128),
  IN p_new_column_name VARCHAR(128),
  IN p_sql TEXT
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_old_column_name
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_new_column_name
  ) THEN
    SET @ddl = p_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_drop_check_if_exists$$
CREATE PROCEDURE sp_drop_check_if_exists(
  IN p_table_name VARCHAR(128),
  IN p_constraint_name VARCHAR(128),
  IN p_sql TEXT
)
BEGIN
  IF EXISTS (
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
CALL sp_add_index_if_not_exists('cash_sessions', 'uq_refund_cash_session_business', 'ALTER TABLE `cash_sessions` ADD UNIQUE KEY `uq_refund_cash_session_business` (`idBusiness`, `idCashSession`)');
CALL sp_add_index_if_not_exists('sale_returns', 'uq_sale_returns_business_id', 'ALTER TABLE `sale_returns` ADD UNIQUE KEY `uq_sale_returns_business_id` (`idBusiness`, `idSaleReturn`)');
CALL sp_add_index_if_not_exists('sale_details', 'uq_sale_details_business_id', 'ALTER TABLE `sale_details` ADD UNIQUE KEY `uq_sale_details_business_id` (`idBusiness`, `idSaleDetail`)');
CALL sp_add_index_if_not_exists('cash_movements', 'uq_cash_movements_business_id', 'ALTER TABLE `cash_movements` ADD UNIQUE KEY `uq_cash_movements_business_id` (`idBusiness`, `idCashMovement`)');
CALL sp_add_index_if_not_exists('sale_returns', 'uq_returns_key', 'ALTER TABLE `sale_returns` ADD UNIQUE KEY `uq_returns_key` (`idBusiness`, `idempotency_key`)');
CALL sp_add_index_if_not_exists('sale_returns', 'uq_returns_number', 'ALTER TABLE `sale_returns` ADD UNIQUE KEY `uq_returns_number` (`idBusiness`, `return_number`)');
CALL sp_add_index_if_not_exists('sale_returns', 'ix_returns_sale', 'ALTER TABLE `sale_returns` ADD KEY `ix_returns_sale` (`idBusiness`, `idSale`, `created_at`)');
CALL sp_add_index_if_not_exists('sale_return_items', 'uq_return_item', 'ALTER TABLE `sale_return_items` ADD UNIQUE KEY `uq_return_item` (`idBusiness`, `idSaleReturn`, `idSaleDetail`)');
CALL sp_add_index_if_not_exists('sale_return_items', 'ix_return_item_detail', 'ALTER TABLE `sale_return_items` ADD KEY `ix_return_item_detail` (`idBusiness`, `idSaleDetail`)');
CALL sp_add_index_if_not_exists('sale_refunds', 'uq_return_refund', 'ALTER TABLE `sale_refunds` ADD UNIQUE KEY `uq_return_refund` (`idBusiness`, `idSaleReturn`, `idSalePayment`)');
CALL sp_add_index_if_not_exists('sale_refunds', 'ix_refund_payment', 'ALTER TABLE `sale_refunds` ADD KEY `ix_refund_payment` (`idBusiness`, `idSalePayment`)');
CALL sp_add_foreign_key_if_not_exists('fk_return_sale', 'ALTER TABLE `sale_returns` ADD CONSTRAINT `fk_return_sale` FOREIGN KEY (`idBusiness`, `idSale`) REFERENCES `sales` (`idBusiness`, `idSale`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_return_actor', 'ALTER TABLE `sale_returns` ADD CONSTRAINT `fk_return_actor` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`idUser`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_sale_return_items_return', 'ALTER TABLE `sale_return_items` ADD CONSTRAINT `fk_sale_return_items_return` FOREIGN KEY (`idBusiness`, `idSaleReturn`) REFERENCES `sale_returns` (`idBusiness`, `idSaleReturn`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_sale_refunds_return', 'ALTER TABLE `sale_refunds` ADD CONSTRAINT `fk_sale_refunds_return` FOREIGN KEY (`idBusiness`, `idSaleReturn`) REFERENCES `sale_returns` (`idBusiness`, `idSaleReturn`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_return_item_detail', 'ALTER TABLE `sale_return_items` ADD CONSTRAINT `fk_return_item_detail` FOREIGN KEY (`idBusiness`, `idSaleDetail`) REFERENCES `sale_details` (`idBusiness`, `idSaleDetail`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_return_item_product', 'ALTER TABLE `sale_return_items` ADD CONSTRAINT `fk_return_item_product` FOREIGN KEY (`idBusiness`, `idProduct`) REFERENCES `products` (`idBusiness`, `idProduct`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_refund_payment', 'ALTER TABLE `sale_refunds` ADD CONSTRAINT `fk_refund_payment` FOREIGN KEY (`idBusiness`, `idSalePayment`) REFERENCES `sale_payments` (`idBusiness`, `idSalePayment`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_refund_session', 'ALTER TABLE `sale_refunds` ADD CONSTRAINT `fk_refund_session` FOREIGN KEY (`idBusiness`, `idCashSession`) REFERENCES `cash_sessions` (`idBusiness`, `idCashSession`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_refund_movement', 'ALTER TABLE `sale_refunds` ADD CONSTRAINT `fk_refund_movement` FOREIGN KEY (`idBusiness`, `idCashMovement`) REFERENCES `cash_movements` (`idBusiness`, `idCashMovement`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_refund_actor', 'ALTER TABLE `sale_refunds` ADD CONSTRAINT `fk_refund_actor` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`idUser`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_check_if_not_exists('sale_returns', 'chk_return_amounts', 'ALTER TABLE `sale_returns` ADD CONSTRAINT `chk_return_amounts` CHECK (merchandise_amount >= 0 AND delivery_fee_refund >= 0 AND total_refund >= 0 AND total_refund = merchandise_amount + delivery_fee_refund)');
CALL sp_add_check_if_not_exists('sale_return_items', 'chk_return_item', 'ALTER TABLE `sale_return_items` ADD CONSTRAINT `chk_return_item` CHECK (quantity > 0 AND refund_amount >= 0 AND restock IN (0,1))');
CALL sp_add_check_if_not_exists('sale_refunds', 'chk_refund_amount', 'ALTER TABLE `sale_refunds` ADD CONSTRAINT `chk_refund_amount` CHECK (amount > 0 AND ((idCashSession IS NULL AND idCashMovement IS NULL) OR (idCashSession IS NOT NULL AND idCashMovement IS NOT NULL)))');

-- F8: only ADMIN by default; OWNER uses authenticated shortcut.
INSERT INTO permissions (code, module, action, name, description, is_active) VALUES
('sale_returns.view','sale_returns','view','Ver devoluciones','Consultar devoluciones y saldos reembolsables',1),
('sale_returns.create','sale_returns','create','Crear devoluciones','Registrar devoluciones y reembolsos compensatorios',1)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), is_active = VALUES(is_active);
INSERT IGNORE INTO role_permissions (role, idPermission)
SELECT 'ADMIN', idPermission FROM permissions WHERE code IN ('sale_returns.view','sale_returns.create');

DROP PROCEDURE IF EXISTS sp_add_index_if_not_exists;
DROP PROCEDURE IF EXISTS sp_add_foreign_key_if_not_exists;
DROP PROCEDURE IF EXISTS sp_add_check_if_not_exists;
