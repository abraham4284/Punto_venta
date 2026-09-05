/*
  005_add_constraints.sql
  Generated from server/src/db/export_db structure-only dump.
  Target defaults: ENGINE=InnoDB, CHARACTER SET utf8mb4, COLLATE utf8mb4_unicode_ci.
*/

USE `punto_venta_dev_clean_2`;

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

CALL sp_drop_check_if_exists('cash_session_payment_summaries', 'chk_cash_summary_sales_count_non_negative', 'ALTER TABLE `cash_session_payment_summaries` DROP CHECK `chk_cash_summary_sales_count_non_negative`');
CALL sp_rename_column_if_exists('cash_session_payment_summaries', 'sales_count', 'payments_count', 'ALTER TABLE `cash_session_payment_summaries` CHANGE COLUMN `sales_count` `payments_count` int NOT NULL DEFAULT ''0''');

CALL sp_add_check_if_not_exists('legal_documents', 'chk_legal_documents_active_boolean', 'ALTER TABLE `legal_documents` ADD CONSTRAINT `chk_legal_documents_active_boolean` CHECK (`is_active` IN (0, 1))');
CALL sp_add_check_if_not_exists('legal_document_versions', 'chk_legal_document_versions_requires_action_boolean', 'ALTER TABLE `legal_document_versions` ADD CONSTRAINT `chk_legal_document_versions_requires_action_boolean` CHECK (`requires_user_action` IN (0, 1))');
CALL sp_add_check_if_not_exists('cash_sessions', 'chk_cash_sessions_opening_amount_non_negative', 'ALTER TABLE `cash_sessions` ADD CONSTRAINT `chk_cash_sessions_opening_amount_non_negative` CHECK (`opening_amount` >= 0)');
CALL sp_add_check_if_not_exists('cash_sessions', 'chk_cash_sessions_expected_cash_non_negative', 'ALTER TABLE `cash_sessions` ADD CONSTRAINT `chk_cash_sessions_expected_cash_non_negative` CHECK (`expected_cash_amount` IS NULL OR `expected_cash_amount` >= 0)');
CALL sp_add_check_if_not_exists('cash_sessions', 'chk_cash_sessions_counted_cash_non_negative', 'ALTER TABLE `cash_sessions` ADD CONSTRAINT `chk_cash_sessions_counted_cash_non_negative` CHECK (`counted_cash_amount` IS NULL OR `counted_cash_amount` >= 0)');
CALL sp_add_check_if_not_exists('cash_sessions', 'chk_cash_sessions_status_fields', 'ALTER TABLE `cash_sessions` ADD CONSTRAINT `chk_cash_sessions_status_fields` CHECK ((`status` = ''OPEN'' AND `closed_at` IS NULL AND `closed_by_user_id` IS NULL AND `counted_cash_amount` IS NULL AND `difference_amount` IS NULL) OR (`status` = ''CLOSED'' AND `closed_at` IS NOT NULL AND `closed_by_user_id` IS NOT NULL AND `expected_cash_amount` IS NOT NULL AND `counted_cash_amount` IS NOT NULL AND `difference_amount` IS NOT NULL))');
CALL sp_add_check_if_not_exists('cash_movements', 'chk_cash_movements_amount_positive', 'ALTER TABLE `cash_movements` ADD CONSTRAINT `chk_cash_movements_amount_positive` CHECK (`amount` > 0)');
CALL sp_add_check_if_not_exists('cash_session_payment_summaries', 'chk_cash_summary_payments_count_non_negative', 'ALTER TABLE `cash_session_payment_summaries` ADD CONSTRAINT `chk_cash_summary_payments_count_non_negative` CHECK (`payments_count` >= 0)');
CALL sp_add_check_if_not_exists('cash_session_payment_summaries', 'chk_cash_summary_total_amount_non_negative', 'ALTER TABLE `cash_session_payment_summaries` ADD CONSTRAINT `chk_cash_summary_total_amount_non_negative` CHECK (`total_amount` >= 0)');
CALL sp_add_check_if_not_exists('sale_payments', 'chk_sale_payments_amount_positive', 'ALTER TABLE `sale_payments` ADD CONSTRAINT `chk_sale_payments_amount_positive` CHECK (`amount` > 0)');
CALL sp_add_check_if_not_exists('cash_settlements', 'chk_cash_settlements_total_amount_positive', 'ALTER TABLE `cash_settlements` ADD CONSTRAINT `chk_cash_settlements_total_amount_positive` CHECK (`total_amount` > 0)');
CALL sp_add_check_if_not_exists('payment_methods', 'chk_payment_methods_affects_cash_boolean', 'ALTER TABLE `payment_methods` ADD CONSTRAINT `chk_payment_methods_affects_cash_boolean` CHECK (`affects_cash` IN (0, 1))');
CALL sp_add_check_if_not_exists('payment_methods', 'chk_payment_methods_default_boolean', 'ALTER TABLE `payment_methods` ADD CONSTRAINT `chk_payment_methods_default_boolean` CHECK (`is_default` IN (0, 1))');
CALL sp_add_check_if_not_exists('payment_methods', 'chk_payment_methods_active_boolean', 'ALTER TABLE `payment_methods` ADD CONSTRAINT `chk_payment_methods_active_boolean` CHECK (`is_active` IN (0, 1))');
CALL sp_add_check_if_not_exists('payment_methods', 'chk_payment_methods_cash_affects_cash', 'ALTER TABLE `payment_methods` ADD CONSTRAINT `chk_payment_methods_cash_affects_cash` CHECK ((`code` = ''CASH'' AND `affects_cash` = 1) OR (`code` <> ''CASH'' AND `affects_cash` = 0))');
CALL sp_add_check_if_not_exists('notifications', 'chk_notifications_context_business', 'ALTER TABLE `notifications` ADD CONSTRAINT `chk_notifications_context_business` CHECK ((`context` = ''BUSINESS'' AND `idBusiness` IS NOT NULL) OR (`context` = ''PLATFORM'' AND `idBusiness` IS NULL))');
CALL sp_add_check_if_not_exists('notifications', 'chk_notifications_resolved_fields', 'ALTER TABLE `notifications` ADD CONSTRAINT `chk_notifications_resolved_fields` CHECK ((`status` = ''ACTIVE'' AND `resolved_at` IS NULL) OR (`status` = ''RESOLVED'' AND `resolved_at` IS NOT NULL))');
CALL sp_add_check_if_not_exists('notification_recipients', 'chk_notification_recipient_target_xor', 'ALTER TABLE `notification_recipients` ADD CONSTRAINT `chk_notification_recipient_target_xor` CHECK ((`idUser` IS NOT NULL AND `idPlatformUser` IS NULL) OR (`idUser` IS NULL AND `idPlatformUser` IS NOT NULL))');
CALL sp_add_check_if_not_exists('notification_recipients', 'chk_notification_recipient_read_fields', 'ALTER TABLE `notification_recipients` ADD CONSTRAINT `chk_notification_recipient_read_fields` CHECK ((`is_read` = 0 AND `read_at` IS NULL) OR (`is_read` = 1 AND `read_at` IS NOT NULL))');
CALL sp_add_check_if_not_exists('notification_recipients', 'chk_notification_recipient_archived_fields', 'ALTER TABLE `notification_recipients` ADD CONSTRAINT `chk_notification_recipient_archived_fields` CHECK ((`is_archived` = 0 AND `archived_at` IS NULL) OR (`is_archived` = 1 AND `archived_at` IS NOT NULL))');

DROP PROCEDURE IF EXISTS sp_add_check_if_not_exists;
DROP PROCEDURE IF EXISTS sp_rename_column_if_exists;
DROP PROCEDURE IF EXISTS sp_drop_check_if_exists;
