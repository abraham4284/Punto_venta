/*
  005_add_constraints.sql
  Generated from server/src/db/export_db structure-only dump.
  Target defaults: ENGINE=InnoDB, CHARACTER SET utf8mb4, COLLATE utf8mb4_unicode_ci.
*/

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

CALL sp_drop_check_if_exists('cash_session_payment_summaries', 'chk_cash_summary_sales_count_non_negative', 'ALTER TABLE `cash_session_payment_summaries` DROP CONSTRAINT `chk_cash_summary_sales_count_non_negative`');
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
CALL sp_add_check_if_not_exists('product_images', 'chk_product_images_sort_order_non_negative', 'ALTER TABLE `product_images` ADD CONSTRAINT `chk_product_images_sort_order_non_negative` CHECK (`sort_order` >= 0)');
CALL sp_add_check_if_not_exists('notifications', 'chk_notifications_context_business', 'ALTER TABLE `notifications` ADD CONSTRAINT `chk_notifications_context_business` CHECK ((`context` = ''BUSINESS'' AND `idBusiness` IS NOT NULL) OR (`context` = ''PLATFORM'' AND `idBusiness` IS NULL))');
CALL sp_add_check_if_not_exists('notifications', 'chk_notifications_resolved_fields', 'ALTER TABLE `notifications` ADD CONSTRAINT `chk_notifications_resolved_fields` CHECK ((`status` = ''ACTIVE'' AND `resolved_at` IS NULL) OR (`status` = ''RESOLVED'' AND `resolved_at` IS NOT NULL))');
CALL sp_add_check_if_not_exists('notification_recipients', 'chk_notification_recipient_target_xor', 'ALTER TABLE `notification_recipients` ADD CONSTRAINT `chk_notification_recipient_target_xor` CHECK ((`idUser` IS NOT NULL AND `idPlatformUser` IS NULL) OR (`idUser` IS NULL AND `idPlatformUser` IS NOT NULL))');
CALL sp_add_check_if_not_exists('notification_recipients', 'chk_notification_recipient_read_fields', 'ALTER TABLE `notification_recipients` ADD CONSTRAINT `chk_notification_recipient_read_fields` CHECK ((`is_read` = 0 AND `read_at` IS NULL) OR (`is_read` = 1 AND `read_at` IS NOT NULL))');
CALL sp_add_check_if_not_exists('notification_recipients', 'chk_notification_recipient_archived_fields', 'ALTER TABLE `notification_recipients` ADD CONSTRAINT `chk_notification_recipient_archived_fields` CHECK ((`is_archived` = 0 AND `archived_at` IS NULL) OR (`is_archived` = 1 AND `archived_at` IS NOT NULL))');

CALL sp_add_check_if_not_exists('customers', 'chk_customers_document_pair', 'ALTER TABLE customers ADD CONSTRAINT chk_customers_document_pair CHECK ((document_type IS NULL AND document_number IS NULL) OR (document_type IS NOT NULL AND document_number IS NOT NULL AND CHAR_LENGTH(TRIM(document_number)) > 0))');

-- Orders Core F3
CALL sp_add_check_if_not_exists('orders', 'chk_orders_totals', 'ALTER TABLE orders ADD CONSTRAINT chk_orders_totals CHECK (subtotal >= 0 AND discount_total >= 0 AND subtotal >= discount_total AND delivery_fee >= 0 AND total = subtotal - discount_total + delivery_fee)');
CALL sp_add_check_if_not_exists('orders', 'chk_orders_delivery', 'ALTER TABLE orders ADD CONSTRAINT chk_orders_delivery CHECK ((fulfillment_type = ''PICKUP'' AND delivery_recipient_name IS NULL AND delivery_recipient_phone IS NULL AND delivery_address IS NULL AND delivery_reference IS NULL AND delivery_fee = 0) OR (fulfillment_type = ''DELIVERY'' AND delivery_recipient_name IS NOT NULL AND CHAR_LENGTH(TRIM(delivery_recipient_name)) >= 2 AND delivery_recipient_phone IS NOT NULL AND CHAR_LENGTH(TRIM(delivery_recipient_phone)) > 0 AND delivery_address IS NOT NULL AND CHAR_LENGTH(TRIM(delivery_address)) >= 3))');
CALL sp_add_check_if_not_exists('orders', 'chk_orders_cancel_reason', 'ALTER TABLE orders ADD CONSTRAINT chk_orders_cancel_reason CHECK ((status = ''CANCELLED'' AND cancellation_reason IS NOT NULL AND CHAR_LENGTH(TRIM(cancellation_reason)) >= 3) OR (status <> ''CANCELLED'' AND cancellation_reason IS NULL))');
CALL sp_add_check_if_not_exists('order_details', 'chk_order_details_math', 'ALTER TABLE order_details ADD CONSTRAINT chk_order_details_math CHECK (quantity > 0 AND unit_price >= 0 AND discount >= 0 AND total >= 0 AND total = ROUND(quantity * unit_price, 2) - discount AND (unit_type <> ''UNIT'' OR quantity = FLOOR(quantity)))');
-- End Orders Core F3
-- Order to Sale F5
CALL sp_add_check_if_not_exists('sales', 'chk_sales_delivery_fee', 'ALTER TABLE sales ADD CONSTRAINT chk_sales_delivery_fee CHECK (delivery_fee >= 0)');
CALL sp_add_check_if_not_exists('sales', 'chk_sales_totals', 'ALTER TABLE sales ADD CONSTRAINT chk_sales_totals CHECK (subtotal >= 0 AND discount_total >= 0 AND discount_total <= subtotal AND total = subtotal - discount_total + delivery_fee)');
CALL sp_add_check_if_not_exists('sale_deliveries', 'chk_delivery_provider', 'ALTER TABLE sale_deliveries ADD CONSTRAINT chk_delivery_provider CHECK (((provider_type IS NULL AND assigned_to_user_id IS NULL AND external_provider_name IS NULL AND external_reference IS NULL AND external_contact_name IS NULL AND external_contact_phone IS NULL AND external_cost IS NULL) OR (provider_type IS NOT NULL AND provider_type = ''INTERNAL'' AND assigned_to_user_id IS NOT NULL AND external_provider_name IS NULL AND external_reference IS NULL AND external_contact_name IS NULL AND external_contact_phone IS NULL AND external_cost IS NULL) OR (provider_type IS NOT NULL AND provider_type = ''THIRD_PARTY'' AND assigned_to_user_id IS NULL AND external_provider_name IS NOT NULL AND CHAR_LENGTH(TRIM(external_provider_name)) > 0 AND (external_cost IS NULL OR external_cost >= 0))))');
DROP PROCEDURE IF EXISTS sp_add_check_if_not_exists;
DROP PROCEDURE IF EXISTS sp_rename_column_if_exists;
DROP PROCEDURE IF EXISTS sp_drop_check_if_exists;
