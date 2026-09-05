/*
  Migration: sale payments + delivery + cash settlements
  WARNING: run only against existing databases after taking a backup.
  Do not run this file as part of the clean schema installation.
*/

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_migration_rename_column_if_exists$$
CREATE PROCEDURE sp_migration_rename_column_if_exists(
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

DROP PROCEDURE IF EXISTS sp_migration_add_index_if_not_exists$$
CREATE PROCEDURE sp_migration_add_index_if_not_exists(
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

DROP PROCEDURE IF EXISTS sp_migration_drop_foreign_key_if_exists$$
CREATE PROCEDURE sp_migration_drop_foreign_key_if_exists(
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
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  ) THEN
    SET @ddl = p_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_migration_drop_column_if_exists$$
CREATE PROCEDURE sp_migration_drop_column_if_exists(
  IN p_table_name VARCHAR(128),
  IN p_column_name VARCHAR(128),
  IN p_sql TEXT
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_column_name
  ) THEN
    SET @ddl = p_sql;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_migration_drop_check_if_exists$$
CREATE PROCEDURE sp_migration_drop_check_if_exists(
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

ALTER TABLE `subscription_plans`
  MODIFY `trial_days` int NOT NULL DEFAULT '14';

ALTER TABLE `business_users`
  MODIFY `role` enum('OWNER','ADMIN','SELLER','DELIVERY') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SELLER';

INSERT INTO permissions (code, module, action, name, description, is_active)
VALUES
('sale_payments.view','sale_payments','view','Ver pagos de venta','Permite ver pagos asociados a ventas',1),
('sale_payments.create','sale_payments','create','Crear pagos de venta','Permite registrar pagos asociados a ventas',1),
('sale_payments.update','sale_payments','update','Editar pagos de venta','Permite corregir pagos pendientes',1),
('sale_payments.collect','sale_payments','collect','Cobrar pagos en reparto','Permite marcar pagos como cobrados por cadete',1),
('sale_payments.confirm','sale_payments','confirm','Confirmar pagos','Permite confirmar pagos en caja',1),
('sale_payments.cancel','sale_payments','cancel','Anular pagos','Permite anular pagos pendientes',1),
('deliveries.view','deliveries','view','Ver entregas','Permite ver entregas de ventas',1),
('deliveries.view_all','deliveries','view_all','Ver todas las entregas','Permite ver entregas asignadas a cualquier cadete',1),
('deliveries.assign','deliveries','assign','Asignar entregas','Permite asignar cadetes a entregas',1),
('deliveries.update_status','deliveries','update_status','Actualizar entregas','Permite cambiar estado de entregas',1),
('cash_settlements.view','cash_settlements','view','Ver liquidaciones','Permite ver liquidaciones de efectivo cobradas por cadetes',1),
('cash_settlements.create','cash_settlements','create','Crear liquidaciones','Permite liquidar efectivo cobrado por cadetes',1)
ON DUPLICATE KEY UPDATE
  module = VALUES(module),
  action = VALUES(action),
  name = VALUES(name),
  description = VALUES(description),
  is_active = VALUES(is_active),
  updated_at = NOW();

INSERT IGNORE INTO role_permissions (role, idPermission)
SELECT 'ADMIN', idPermission
FROM permissions
WHERE code IN (
  'sale_payments.view','sale_payments.create','sale_payments.update','sale_payments.collect','sale_payments.confirm','sale_payments.cancel',
  'deliveries.view','deliveries.view_all','deliveries.assign','deliveries.update_status',
  'cash_settlements.view','cash_settlements.create'
);

INSERT IGNORE INTO role_permissions (role, idPermission)
SELECT 'DELIVERY', idPermission
FROM permissions
WHERE code IN (
  'deliveries.view',
  'deliveries.update_status',
  'sale_payments.view',
  'sale_payments.collect'
);

CREATE TABLE IF NOT EXISTS `sale_payments` (
  `idSalePayment` bigint NOT NULL AUTO_INCREMENT,
  `idBusiness` int NOT NULL,
  `idSale` int NOT NULL,
  `idPaymentMethod` int NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `status` enum('PENDING','COLLECTED','CONFIRMED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_by_user_id` int NOT NULL,
  `collected_by_user_id` int DEFAULT NULL,
  `confirmed_by_user_id` int DEFAULT NULL,
  `cancelled_by_user_id` int DEFAULT NULL,
  `collected_at` datetime DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `cancellation_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idCashSession` bigint DEFAULT NULL,
  `idCashSettlement` bigint DEFAULT NULL,
  `reference` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observation` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idSalePayment`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sale_payment_events` (
  `idSalePaymentEvent` bigint NOT NULL AUTO_INCREMENT,
  `idBusiness` int NOT NULL,
  `idSalePayment` bigint NOT NULL,
  `event_type` enum('PAYMENT_CREATED','PAYMENT_UPDATED','PAYMENT_METHOD_CHANGED','PAYMENT_COLLECTED','PAYMENT_CONFIRMED','PAYMENT_CANCELLED','PAYMENT_SETTLED','PAYMENT_MIGRATED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_status` enum('PENDING','COLLECTED','CONFIRMED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` enum('PENDING','COLLECTED','CONFIRMED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_by_user_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idSalePaymentEvent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sale_deliveries` (
  `idSaleDelivery` bigint NOT NULL AUTO_INCREMENT,
  `idBusiness` int NOT NULL,
  `idSale` int NOT NULL,
  `assigned_to_user_id` int DEFAULT NULL,
  `created_by_user_id` int NOT NULL,
  `status` enum('PENDING','ASSIGNED','OUT_FOR_DELIVERY','DELIVERED','FAILED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_phone` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `out_for_delivery_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `failed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `failure_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observation` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idSaleDelivery`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_events` (
  `idDeliveryEvent` bigint NOT NULL AUTO_INCREMENT,
  `idBusiness` int NOT NULL,
  `idSaleDelivery` bigint NOT NULL,
  `event_type` enum('DELIVERY_CREATED','DELIVERY_ASSIGNED','DELIVERY_UNASSIGNED','DELIVERY_OUT_FOR_DELIVERY','DELIVERY_FAILED','DELIVERY_RESCHEDULED','DELIVERY_DELIVERED','DELIVERY_CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_status` enum('PENDING','ASSIGNED','OUT_FOR_DELIVERY','DELIVERED','FAILED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` enum('PENDING','ASSIGNED','OUT_FOR_DELIVERY','DELIVERED','FAILED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_by_user_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idDeliveryEvent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cash_settlements` (
  `idCashSettlement` bigint NOT NULL AUTO_INCREMENT,
  `idBusiness` int NOT NULL,
  `collector_user_id` int NOT NULL,
  `received_by_user_id` int NOT NULL,
  `idCashSession` bigint NOT NULL,
  `total_amount` decimal(18,2) NOT NULL,
  `observation` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settled_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idCashSettlement`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL sp_migration_add_index_if_not_exists('sale_payments', 'uk_sale_payment_business_id', 'ALTER TABLE `sale_payments` ADD UNIQUE KEY `uk_sale_payment_business_id` (`idBusiness`,`idSalePayment`)');
CALL sp_migration_add_index_if_not_exists('sale_payments', 'idx_sale_payments_business_sale', 'ALTER TABLE `sale_payments` ADD KEY `idx_sale_payments_business_sale` (`idBusiness`,`idSale`)');
CALL sp_migration_add_index_if_not_exists('sale_payments', 'idx_sale_payments_business_status', 'ALTER TABLE `sale_payments` ADD KEY `idx_sale_payments_business_status` (`idBusiness`,`status`)');
CALL sp_migration_add_index_if_not_exists('sale_payments', 'idx_sale_payments_business_method', 'ALTER TABLE `sale_payments` ADD KEY `idx_sale_payments_business_method` (`idBusiness`,`idPaymentMethod`)');
CALL sp_migration_add_index_if_not_exists('sale_payments', 'idx_sale_payments_collector_status', 'ALTER TABLE `sale_payments` ADD KEY `idx_sale_payments_collector_status` (`idBusiness`,`collected_by_user_id`,`status`)');
CALL sp_migration_add_index_if_not_exists('sale_payments', 'idx_sale_payments_cash_session', 'ALTER TABLE `sale_payments` ADD KEY `idx_sale_payments_cash_session` (`idBusiness`,`idCashSession`)');
CALL sp_migration_add_index_if_not_exists('sale_payments', 'idx_sale_payments_cash_settlement', 'ALTER TABLE `sale_payments` ADD KEY `idx_sale_payments_cash_settlement` (`idBusiness`,`idCashSettlement`)');

CALL sp_migration_add_index_if_not_exists('sale_deliveries', 'uk_sale_delivery_business_sale', 'ALTER TABLE `sale_deliveries` ADD UNIQUE KEY `uk_sale_delivery_business_sale` (`idBusiness`,`idSale`)');
CALL sp_migration_add_index_if_not_exists('sale_deliveries', 'uk_sale_delivery_business_id', 'ALTER TABLE `sale_deliveries` ADD UNIQUE KEY `uk_sale_delivery_business_id` (`idBusiness`,`idSaleDelivery`)');
CALL sp_migration_add_index_if_not_exists('sale_deliveries', 'idx_sale_deliveries_business_status', 'ALTER TABLE `sale_deliveries` ADD KEY `idx_sale_deliveries_business_status` (`idBusiness`,`status`)');
CALL sp_migration_add_index_if_not_exists('sale_deliveries', 'idx_sale_deliveries_assigned_status', 'ALTER TABLE `sale_deliveries` ADD KEY `idx_sale_deliveries_assigned_status` (`idBusiness`,`assigned_to_user_id`,`status`)');
CALL sp_migration_add_index_if_not_exists('sale_deliveries', 'idx_sale_deliveries_scheduled', 'ALTER TABLE `sale_deliveries` ADD KEY `idx_sale_deliveries_scheduled` (`idBusiness`,`scheduled_at`)');

CALL sp_migration_add_index_if_not_exists('cash_settlements', 'uk_cash_settlement_business_id', 'ALTER TABLE `cash_settlements` ADD UNIQUE KEY `uk_cash_settlement_business_id` (`idBusiness`,`idCashSettlement`)');
CALL sp_migration_add_index_if_not_exists('cash_settlements', 'idx_cash_settlements_collector_settled', 'ALTER TABLE `cash_settlements` ADD KEY `idx_cash_settlements_collector_settled` (`idBusiness`,`collector_user_id`,`settled_at`)');
CALL sp_migration_add_index_if_not_exists('cash_settlements', 'idx_cash_settlements_cash_session', 'ALTER TABLE `cash_settlements` ADD KEY `idx_cash_settlements_cash_session` (`idBusiness`,`idCashSession`)');

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_migration_backfill_legacy_sale_payments$$
CREATE PROCEDURE sp_migration_backfill_legacy_sale_payments()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sales'
      AND COLUMN_NAME = 'idPaymentMethod'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sales'
      AND COLUMN_NAME = 'payment_detail'
  ) THEN
    INSERT INTO sale_payments (
      idBusiness,
      idSale,
      idPaymentMethod,
      amount,
      status,
      created_by_user_id,
      confirmed_by_user_id,
      confirmed_at,
      idCashSession,
      reference,
      observation,
      created_at
    )
    SELECT
      s.idBusiness,
      s.idSale,
      s.idPaymentMethod,
      s.total,
      CASE WHEN s.status = 'CANCELLED' THEN 'CANCELLED' ELSE 'CONFIRMED' END,
      s.idUser,
      CASE WHEN s.status = 'CANCELLED' THEN NULL ELSE s.idUser END,
      CASE WHEN s.status = 'CANCELLED' THEN NULL ELSE s.sale_date END,
      s.idCashSession,
      s.sale_number,
      s.payment_detail,
      s.created_at
    FROM sales s
    WHERE s.idPaymentMethod IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM sale_payments sp
        WHERE sp.idBusiness = s.idBusiness
          AND sp.idSale = s.idSale
      );
  END IF;
END$$

DELIMITER ;

CALL sp_migration_backfill_legacy_sale_payments();

DROP PROCEDURE IF EXISTS sp_migration_backfill_legacy_sale_payments;

INSERT INTO sale_payment_events (
  idBusiness,
  idSalePayment,
  event_type,
  previous_status,
  new_status,
  metadata,
  created_by_user_id,
  created_at
)
SELECT
  sp.idBusiness,
  sp.idSalePayment,
  'PAYMENT_MIGRATED',
  NULL,
  sp.status,
  JSON_OBJECT('source', 'sales_legacy_payment_method'),
  sp.created_by_user_id,
  sp.created_at
FROM sale_payments sp
WHERE NOT EXISTS (
  SELECT 1
  FROM sale_payment_events spe
  WHERE spe.idBusiness = sp.idBusiness
    AND spe.idSalePayment = sp.idSalePayment
    AND spe.event_type = 'PAYMENT_MIGRATED'
);

CALL sp_migration_drop_check_if_exists('cash_session_payment_summaries', 'chk_cash_summary_sales_count_non_negative', 'ALTER TABLE `cash_session_payment_summaries` DROP CHECK `chk_cash_summary_sales_count_non_negative`');
CALL sp_migration_rename_column_if_exists('cash_session_payment_summaries', 'sales_count', 'payments_count', 'ALTER TABLE `cash_session_payment_summaries` CHANGE COLUMN `sales_count` `payments_count` int NOT NULL DEFAULT ''0''');

CALL sp_migration_drop_foreign_key_if_exists('sales', 'fk_sales_payment_method', 'ALTER TABLE `sales` DROP FOREIGN KEY `fk_sales_payment_method`');

CALL sp_migration_drop_column_if_exists('sales', 'idPaymentMethod', 'ALTER TABLE `sales` DROP COLUMN `idPaymentMethod`');
CALL sp_migration_drop_column_if_exists('sales', 'payment_detail', 'ALTER TABLE `sales` DROP COLUMN `payment_detail`');

DROP PROCEDURE IF EXISTS sp_migration_rename_column_if_exists;
DROP PROCEDURE IF EXISTS sp_migration_add_index_if_not_exists;
DROP PROCEDURE IF EXISTS sp_migration_drop_foreign_key_if_exists;
DROP PROCEDURE IF EXISTS sp_migration_drop_column_if_exists;
DROP PROCEDURE IF EXISTS sp_migration_drop_check_if_exists;
