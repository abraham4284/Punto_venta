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

DELIMITER ;

CALL sp_add_check_if_not_exists('cash_sessions', 'chk_cash_sessions_opening_amount_non_negative', 'ALTER TABLE `cash_sessions` ADD CONSTRAINT `chk_cash_sessions_opening_amount_non_negative` CHECK (`opening_amount` >= 0)');
CALL sp_add_check_if_not_exists('cash_sessions', 'chk_cash_sessions_expected_cash_non_negative', 'ALTER TABLE `cash_sessions` ADD CONSTRAINT `chk_cash_sessions_expected_cash_non_negative` CHECK (`expected_cash_amount` IS NULL OR `expected_cash_amount` >= 0)');
CALL sp_add_check_if_not_exists('cash_sessions', 'chk_cash_sessions_counted_cash_non_negative', 'ALTER TABLE `cash_sessions` ADD CONSTRAINT `chk_cash_sessions_counted_cash_non_negative` CHECK (`counted_cash_amount` IS NULL OR `counted_cash_amount` >= 0)');
CALL sp_add_check_if_not_exists('cash_sessions', 'chk_cash_sessions_status_fields', 'ALTER TABLE `cash_sessions` ADD CONSTRAINT `chk_cash_sessions_status_fields` CHECK ((`status` = ''OPEN'' AND `closed_at` IS NULL AND `closed_by_user_id` IS NULL AND `counted_cash_amount` IS NULL AND `difference_amount` IS NULL) OR (`status` = ''CLOSED'' AND `closed_at` IS NOT NULL AND `closed_by_user_id` IS NOT NULL AND `expected_cash_amount` IS NOT NULL AND `counted_cash_amount` IS NOT NULL AND `difference_amount` IS NOT NULL))');
CALL sp_add_check_if_not_exists('cash_movements', 'chk_cash_movements_amount_positive', 'ALTER TABLE `cash_movements` ADD CONSTRAINT `chk_cash_movements_amount_positive` CHECK (`amount` > 0)');
CALL sp_add_check_if_not_exists('cash_session_payment_summaries', 'chk_cash_summary_sales_count_non_negative', 'ALTER TABLE `cash_session_payment_summaries` ADD CONSTRAINT `chk_cash_summary_sales_count_non_negative` CHECK (`sales_count` >= 0)');
CALL sp_add_check_if_not_exists('cash_session_payment_summaries', 'chk_cash_summary_total_amount_non_negative', 'ALTER TABLE `cash_session_payment_summaries` ADD CONSTRAINT `chk_cash_summary_total_amount_non_negative` CHECK (`total_amount` >= 0)');
CALL sp_add_check_if_not_exists('payment_methods', 'chk_payment_methods_affects_cash_boolean', 'ALTER TABLE `payment_methods` ADD CONSTRAINT `chk_payment_methods_affects_cash_boolean` CHECK (`affects_cash` IN (0, 1))');
CALL sp_add_check_if_not_exists('payment_methods', 'chk_payment_methods_default_boolean', 'ALTER TABLE `payment_methods` ADD CONSTRAINT `chk_payment_methods_default_boolean` CHECK (`is_default` IN (0, 1))');
CALL sp_add_check_if_not_exists('payment_methods', 'chk_payment_methods_active_boolean', 'ALTER TABLE `payment_methods` ADD CONSTRAINT `chk_payment_methods_active_boolean` CHECK (`is_active` IN (0, 1))');
CALL sp_add_check_if_not_exists('payment_methods', 'chk_payment_methods_cash_affects_cash', 'ALTER TABLE `payment_methods` ADD CONSTRAINT `chk_payment_methods_cash_affects_cash` CHECK ((`code` = ''CASH'' AND `affects_cash` = 1) OR (`code` <> ''CASH'' AND `affects_cash` = 0))');

DROP PROCEDURE IF EXISTS sp_add_check_if_not_exists;
