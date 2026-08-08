/*
  003_add_indexes.sql
  Generated from server/src/db/export_db structure-only dump.
  Target defaults: ENGINE=InnoDB, CHARACTER SET utf8mb4, COLLATE utf8mb4_unicode_ci.
*/

USE `punto_venta_dev_clean_2`;

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

CALL sp_add_index_if_not_exists('businesses', 'slug', 'ALTER TABLE `businesses` ADD UNIQUE KEY `slug` (`slug`)');
CALL sp_add_index_if_not_exists('users', 'username_UNIQUE', 'ALTER TABLE `users` ADD UNIQUE KEY `username_UNIQUE` (`username`)');
CALL sp_add_index_if_not_exists('users', 'email_UNIQUE', 'ALTER TABLE `users` ADD UNIQUE KEY `email_UNIQUE` (`email`)');
CALL sp_add_index_if_not_exists('permissions', 'uq_permissions_code', 'ALTER TABLE `permissions` ADD UNIQUE KEY `uq_permissions_code` (`code`)');
CALL sp_add_index_if_not_exists('permissions', 'idx_permissions_module', 'ALTER TABLE `permissions` ADD KEY `idx_permissions_module` (`module`)');
CALL sp_add_index_if_not_exists('permissions', 'idx_permissions_active', 'ALTER TABLE `permissions` ADD KEY `idx_permissions_active` (`is_active`)');
CALL sp_add_index_if_not_exists('role_permissions', 'fk_role_permissions_permission', 'ALTER TABLE `role_permissions` ADD KEY `fk_role_permissions_permission` (`idPermission`)');
CALL sp_add_index_if_not_exists('business_users', 'uk_business_user', 'ALTER TABLE `business_users` ADD UNIQUE KEY `uk_business_user` (`idBusiness`,`idUser`)');
CALL sp_add_index_if_not_exists('business_users', 'fk_business_users_user', 'ALTER TABLE `business_users` ADD KEY `fk_business_users_user` (`idUser`)');
CALL sp_add_index_if_not_exists('platform_users', 'idUser_UNIQUE', 'ALTER TABLE `platform_users` ADD UNIQUE KEY `idUser_UNIQUE` (`idUser`)');
CALL sp_add_index_if_not_exists('platform_users', 'fk_platform_users_users1_idx', 'ALTER TABLE `platform_users` ADD KEY `fk_platform_users_users1_idx` (`idUser`)');
CALL sp_add_index_if_not_exists('business_user_permissions', 'uq_business_user_permission', 'ALTER TABLE `business_user_permissions` ADD UNIQUE KEY `uq_business_user_permission` (`idBusiness`,`idUser`,`idPermission`)');
CALL sp_add_index_if_not_exists('business_user_permissions', 'idx_business_user_permissions_business_user', 'ALTER TABLE `business_user_permissions` ADD KEY `idx_business_user_permissions_business_user` (`idBusiness`,`idUser`)');
CALL sp_add_index_if_not_exists('business_user_permissions', 'fk_business_user_permissions_user', 'ALTER TABLE `business_user_permissions` ADD KEY `fk_business_user_permissions_user` (`idUser`)');
CALL sp_add_index_if_not_exists('business_user_permissions', 'fk_business_user_permissions_permission', 'ALTER TABLE `business_user_permissions` ADD KEY `fk_business_user_permissions_permission` (`idPermission`)');
CALL sp_add_index_if_not_exists('business_user_permissions', 'fk_business_user_permissions_created_by', 'ALTER TABLE `business_user_permissions` ADD KEY `fk_business_user_permissions_created_by` (`created_by_user_id`)');
CALL sp_add_index_if_not_exists('business_subscriptions', 'fk_business_subscriptions_businesses1_idx', 'ALTER TABLE `business_subscriptions` ADD KEY `fk_business_subscriptions_businesses1_idx` (`idBusiness`)');
CALL sp_add_index_if_not_exists('business_subscriptions', 'fk_business_subscriptions_subscription_plans1_idx', 'ALTER TABLE `business_subscriptions` ADD KEY `fk_business_subscriptions_subscription_plans1_idx` (`idSubscriptionPlan`)');
CALL sp_add_index_if_not_exists('subscription_events', 'fk_subscription_events_business_subscriptions1_idx', 'ALTER TABLE `subscription_events` ADD KEY `fk_subscription_events_business_subscriptions1_idx` (`idBusinessSubscription`)');
CALL sp_add_index_if_not_exists('subscription_payments', 'fk_subscription_payments_business_subscriptions1_idx', 'ALTER TABLE `subscription_payments` ADD KEY `fk_subscription_payments_business_subscriptions1_idx` (`idBusinessSubscription`)');
CALL sp_add_index_if_not_exists('platform_audit_logs', 'idx_platform_audit_user', 'ALTER TABLE `platform_audit_logs` ADD KEY `idx_platform_audit_user` (`idPlatformUser`)');
CALL sp_add_index_if_not_exists('platform_audit_logs', 'idx_platform_audit_action', 'ALTER TABLE `platform_audit_logs` ADD KEY `idx_platform_audit_action` (`action`)');
CALL sp_add_index_if_not_exists('platform_audit_logs', 'idx_platform_audit_entity_type', 'ALTER TABLE `platform_audit_logs` ADD KEY `idx_platform_audit_entity_type` (`entityType`)');
CALL sp_add_index_if_not_exists('platform_audit_logs', 'idx_platform_audit_business', 'ALTER TABLE `platform_audit_logs` ADD KEY `idx_platform_audit_business` (`idBusiness`)');
CALL sp_add_index_if_not_exists('platform_audit_logs', 'idx_platform_audit_created_at', 'ALTER TABLE `platform_audit_logs` ADD KEY `idx_platform_audit_created_at` (`createdAt`)');
CALL sp_add_index_if_not_exists('platform_audit_logs', 'idx_platform_audit_business_created_at', 'ALTER TABLE `platform_audit_logs` ADD KEY `idx_platform_audit_business_created_at` (`idBusiness`,`createdAt`)');
CALL sp_add_index_if_not_exists('user_sessions', 'fk_user_sessions_users1_idx', 'ALTER TABLE `user_sessions` ADD KEY `fk_user_sessions_users1_idx` (`idUser`)');
CALL sp_add_index_if_not_exists('user_sessions', 'idx_user_sessions_business', 'ALTER TABLE `user_sessions` ADD KEY `idx_user_sessions_business` (`idBusiness`)');
CALL sp_add_index_if_not_exists('notifications', 'idx_notifications_context', 'ALTER TABLE `notifications` ADD KEY `idx_notifications_context` (`context`)');
CALL sp_add_index_if_not_exists('notifications', 'idx_notifications_business', 'ALTER TABLE `notifications` ADD KEY `idx_notifications_business` (`idBusiness`)');
CALL sp_add_index_if_not_exists('notifications', 'idx_notifications_type', 'ALTER TABLE `notifications` ADD KEY `idx_notifications_type` (`type`)');
CALL sp_add_index_if_not_exists('notifications', 'idx_notifications_severity', 'ALTER TABLE `notifications` ADD KEY `idx_notifications_severity` (`severity`)');
CALL sp_add_index_if_not_exists('notifications', 'idx_notifications_status', 'ALTER TABLE `notifications` ADD KEY `idx_notifications_status` (`status`)');
CALL sp_add_index_if_not_exists('notifications', 'idx_notifications_created_at', 'ALTER TABLE `notifications` ADD KEY `idx_notifications_created_at` (`created_at`)');
CALL sp_add_index_if_not_exists('notifications', 'idx_notifications_expires_at', 'ALTER TABLE `notifications` ADD KEY `idx_notifications_expires_at` (`expires_at`)');
CALL sp_add_index_if_not_exists('notifications', 'idx_notifications_dedup_active', 'ALTER TABLE `notifications` ADD KEY `idx_notifications_dedup_active` (`context`,`idBusiness`,`deduplication_key`,`status`)');
CALL sp_add_index_if_not_exists('notifications', 'idx_notifications_created_by_user', 'ALTER TABLE `notifications` ADD KEY `idx_notifications_created_by_user` (`created_by_user_id`)');
CALL sp_add_index_if_not_exists('notifications', 'idx_notifications_created_by_platform_user', 'ALTER TABLE `notifications` ADD KEY `idx_notifications_created_by_platform_user` (`created_by_platform_user_id`)');
CALL sp_add_index_if_not_exists('notification_recipients', 'idx_notification_recipients_notification', 'ALTER TABLE `notification_recipients` ADD KEY `idx_notification_recipients_notification` (`idNotification`)');
CALL sp_add_index_if_not_exists('notification_recipients', 'idx_notification_recipients_user', 'ALTER TABLE `notification_recipients` ADD KEY `idx_notification_recipients_user` (`idUser`)');
CALL sp_add_index_if_not_exists('notification_recipients', 'idx_notification_recipients_platform_user', 'ALTER TABLE `notification_recipients` ADD KEY `idx_notification_recipients_platform_user` (`idPlatformUser`)');
CALL sp_add_index_if_not_exists('notification_recipients', 'idx_notification_recipients_read_archived', 'ALTER TABLE `notification_recipients` ADD KEY `idx_notification_recipients_read_archived` (`is_read`,`is_archived`)');
CALL sp_add_index_if_not_exists('notification_recipients', 'idx_notification_recipients_created_at', 'ALTER TABLE `notification_recipients` ADD KEY `idx_notification_recipients_created_at` (`created_at`)');
CALL sp_add_index_if_not_exists('notification_recipients', 'uq_notification_recipient_user', 'ALTER TABLE `notification_recipients` ADD UNIQUE KEY `uq_notification_recipient_user` (`idNotification`,`idUser`)');
CALL sp_add_index_if_not_exists('notification_recipients', 'uq_notification_recipient_platform_user', 'ALTER TABLE `notification_recipients` ADD UNIQUE KEY `uq_notification_recipient_platform_user` (`idNotification`,`idPlatformUser`)');
CALL sp_add_index_if_not_exists('customers', 'uk_customer_business_id', 'ALTER TABLE `customers` ADD UNIQUE KEY `uk_customer_business_id` (`idBusiness`,`idCustomer`)');
CALL sp_add_index_if_not_exists('customers', 'idx_customers_business_name', 'ALTER TABLE `customers` ADD KEY `idx_customers_business_name` (`idBusiness`,`name`)');
CALL sp_add_index_if_not_exists('suppliers', 'uk_supplier_business_id', 'ALTER TABLE `suppliers` ADD UNIQUE KEY `uk_supplier_business_id` (`idBusiness`,`idSupplier`)');
CALL sp_add_index_if_not_exists('suppliers', 'idx_suppliers_business_name', 'ALTER TABLE `suppliers` ADD KEY `idx_suppliers_business_name` (`idBusiness`,`name`)');
CALL sp_add_index_if_not_exists('deposits', 'uk_deposit_business_name', 'ALTER TABLE `deposits` ADD UNIQUE KEY `uk_deposit_business_name` (`idBusiness`,`name`)');
CALL sp_add_index_if_not_exists('deposits', 'uk_deposit_business_id', 'ALTER TABLE `deposits` ADD UNIQUE KEY `uk_deposit_business_id` (`idBusiness`,`idDeposit`)');
CALL sp_add_index_if_not_exists('payment_methods', 'idx_payment_methods_business', 'ALTER TABLE `payment_methods` ADD KEY `idx_payment_methods_business` (`idBusiness`)');
CALL sp_add_index_if_not_exists('payment_methods', 'uk_payment_method_business_name', 'ALTER TABLE `payment_methods` ADD UNIQUE KEY `uk_payment_method_business_name` (`idBusiness`,`name`)');
CALL sp_add_index_if_not_exists('payment_methods', 'idx_payment_methods_business_code', 'ALTER TABLE `payment_methods` ADD KEY `idx_payment_methods_business_code` (`idBusiness`,`code`)');
CALL sp_add_index_if_not_exists('payment_methods', 'uk_payment_method_business_id', 'ALTER TABLE `payment_methods` ADD UNIQUE KEY `uk_payment_method_business_id` (`idBusiness`,`idPaymentMethod`)');
CALL sp_add_index_if_not_exists('cash_registers', 'uk_cash_register_business_name', 'ALTER TABLE `cash_registers` ADD UNIQUE KEY `uk_cash_register_business_name` (`idBusiness`,`name`)');
CALL sp_add_index_if_not_exists('cash_registers', 'uk_cash_register_business_id', 'ALTER TABLE `cash_registers` ADD UNIQUE KEY `uk_cash_register_business_id` (`idBusiness`,`idCashRegister`)');
CALL sp_add_index_if_not_exists('cash_registers', 'idx_cash_registers_business', 'ALTER TABLE `cash_registers` ADD KEY `idx_cash_registers_business` (`idBusiness`)');
CALL sp_add_index_if_not_exists('cash_registers', 'idx_cash_registers_active', 'ALTER TABLE `cash_registers` ADD KEY `idx_cash_registers_active` (`is_active`)');
CALL sp_add_index_if_not_exists('cash_sessions', 'idx_cash_sessions_business', 'ALTER TABLE `cash_sessions` ADD KEY `idx_cash_sessions_business` (`idBusiness`)');
CALL sp_add_index_if_not_exists('cash_sessions', 'idx_cash_sessions_register', 'ALTER TABLE `cash_sessions` ADD KEY `idx_cash_sessions_register` (`idCashRegister`)');
CALL sp_add_index_if_not_exists('cash_sessions', 'idx_cash_sessions_opened_by', 'ALTER TABLE `cash_sessions` ADD KEY `idx_cash_sessions_opened_by` (`opened_by_user_id`)');
CALL sp_add_index_if_not_exists('cash_sessions', 'idx_cash_sessions_closed_by', 'ALTER TABLE `cash_sessions` ADD KEY `idx_cash_sessions_closed_by` (`closed_by_user_id`)');
CALL sp_add_index_if_not_exists('cash_sessions', 'idx_cash_sessions_status', 'ALTER TABLE `cash_sessions` ADD KEY `idx_cash_sessions_status` (`status`)');
CALL sp_add_index_if_not_exists('cash_sessions', 'idx_cash_sessions_opened_at', 'ALTER TABLE `cash_sessions` ADD KEY `idx_cash_sessions_opened_at` (`opened_at`)');
CALL sp_add_index_if_not_exists('cash_sessions', 'idx_cash_sessions_closed_at', 'ALTER TABLE `cash_sessions` ADD KEY `idx_cash_sessions_closed_at` (`closed_at`)');
CALL sp_add_index_if_not_exists('cash_sessions', 'idx_cash_sessions_business_status', 'ALTER TABLE `cash_sessions` ADD KEY `idx_cash_sessions_business_status` (`idBusiness`,`status`)');
CALL sp_add_index_if_not_exists('cash_sessions', 'idx_cash_sessions_register_status', 'ALTER TABLE `cash_sessions` ADD KEY `idx_cash_sessions_register_status` (`idCashRegister`,`status`)');
CALL sp_add_index_if_not_exists('cash_sessions', 'idx_cash_sessions_business_opened_at', 'ALTER TABLE `cash_sessions` ADD KEY `idx_cash_sessions_business_opened_at` (`idBusiness`,`opened_at`)');
CALL sp_add_index_if_not_exists('cash_movements', 'idx_cash_movements_business', 'ALTER TABLE `cash_movements` ADD KEY `idx_cash_movements_business` (`idBusiness`)');
CALL sp_add_index_if_not_exists('cash_movements', 'idx_cash_movements_session', 'ALTER TABLE `cash_movements` ADD KEY `idx_cash_movements_session` (`idCashSession`)');
CALL sp_add_index_if_not_exists('cash_movements', 'idx_cash_movements_user', 'ALTER TABLE `cash_movements` ADD KEY `idx_cash_movements_user` (`idUser`)');
CALL sp_add_index_if_not_exists('cash_movements', 'idx_cash_movements_type', 'ALTER TABLE `cash_movements` ADD KEY `idx_cash_movements_type` (`movement_type`)');
CALL sp_add_index_if_not_exists('cash_movements', 'idx_cash_movements_created_at', 'ALTER TABLE `cash_movements` ADD KEY `idx_cash_movements_created_at` (`created_at`)');
CALL sp_add_index_if_not_exists('cash_movements', 'idx_cash_movements_session_created_at', 'ALTER TABLE `cash_movements` ADD KEY `idx_cash_movements_session_created_at` (`idCashSession`,`created_at`)');
CALL sp_add_index_if_not_exists('cash_session_payment_summaries', 'idx_cash_summaries_business', 'ALTER TABLE `cash_session_payment_summaries` ADD KEY `idx_cash_summaries_business` (`idBusiness`)');
CALL sp_add_index_if_not_exists('cash_session_payment_summaries', 'idx_cash_summaries_session', 'ALTER TABLE `cash_session_payment_summaries` ADD KEY `idx_cash_summaries_session` (`idCashSession`)');
CALL sp_add_index_if_not_exists('cash_session_payment_summaries', 'idx_cash_summaries_payment_method', 'ALTER TABLE `cash_session_payment_summaries` ADD KEY `idx_cash_summaries_payment_method` (`idPaymentMethod`)');
CALL sp_add_index_if_not_exists('cash_session_payment_summaries', 'uk_cash_summary_session_payment', 'ALTER TABLE `cash_session_payment_summaries` ADD UNIQUE KEY `uk_cash_summary_session_payment` (`idCashSession`,`idPaymentMethod`)');
CALL sp_add_index_if_not_exists('product_categories', 'uk_category_business_name', 'ALTER TABLE `product_categories` ADD UNIQUE KEY `uk_category_business_name` (`idBusiness`,`name`)');
CALL sp_add_index_if_not_exists('product_categories', 'uk_category_business_id', 'ALTER TABLE `product_categories` ADD UNIQUE KEY `uk_category_business_id` (`idBusiness`,`idProductCategory`)');
CALL sp_add_index_if_not_exists('products', 'uk_product_business_id', 'ALTER TABLE `products` ADD UNIQUE KEY `uk_product_business_id` (`idBusiness`,`idProduct`)');
CALL sp_add_index_if_not_exists('products', 'uk_product_business_barcode', 'ALTER TABLE `products` ADD UNIQUE KEY `uk_product_business_barcode` (`idBusiness`,`barcode`)');
CALL sp_add_index_if_not_exists('products', 'idx_products_business_name', 'ALTER TABLE `products` ADD KEY `idx_products_business_name` (`idBusiness`,`name`)');
CALL sp_add_index_if_not_exists('products', 'fk_products_category', 'ALTER TABLE `products` ADD KEY `fk_products_category` (`idBusiness`,`idProductCategory`)');
CALL sp_add_index_if_not_exists('stock', 'uk_stock_product_deposit', 'ALTER TABLE `stock` ADD UNIQUE KEY `uk_stock_product_deposit` (`idBusiness`,`idProduct`,`idDeposit`)');
CALL sp_add_index_if_not_exists('stock', 'fk_stock_deposit', 'ALTER TABLE `stock` ADD KEY `fk_stock_deposit` (`idBusiness`,`idDeposit`)');
CALL sp_add_index_if_not_exists('purchases', 'uk_purchase_business_id', 'ALTER TABLE `purchases` ADD UNIQUE KEY `uk_purchase_business_id` (`idBusiness`,`idPurchase`)');
CALL sp_add_index_if_not_exists('purchases', 'idx_purchases_business_date', 'ALTER TABLE `purchases` ADD KEY `idx_purchases_business_date` (`idBusiness`,`purchase_date`)');
CALL sp_add_index_if_not_exists('purchases', 'fk_purchases_user', 'ALTER TABLE `purchases` ADD KEY `fk_purchases_user` (`idUser`)');
CALL sp_add_index_if_not_exists('purchases', 'fk_purchases_supplier', 'ALTER TABLE `purchases` ADD KEY `fk_purchases_supplier` (`idBusiness`,`idSupplier`)');
CALL sp_add_index_if_not_exists('purchase_details', 'fk_purchase_details_purchase', 'ALTER TABLE `purchase_details` ADD KEY `fk_purchase_details_purchase` (`idBusiness`,`idPurchase`)');
CALL sp_add_index_if_not_exists('purchase_details', 'fk_purchase_details_product', 'ALTER TABLE `purchase_details` ADD KEY `fk_purchase_details_product` (`idBusiness`,`idProduct`)');
CALL sp_add_index_if_not_exists('purchase_details', 'fk_purchase_details_deposit', 'ALTER TABLE `purchase_details` ADD KEY `fk_purchase_details_deposit` (`idBusiness`,`idDeposit`)');
CALL sp_add_index_if_not_exists('sales', 'uk_sale_business_id', 'ALTER TABLE `sales` ADD UNIQUE KEY `uk_sale_business_id` (`idBusiness`,`idSale`)');
CALL sp_add_index_if_not_exists('sales', 'uk_sales_sale_number', 'ALTER TABLE `sales` ADD UNIQUE KEY `uk_sales_sale_number` (`sale_number`)');
CALL sp_add_index_if_not_exists('sales', 'idx_sales_business_date', 'ALTER TABLE `sales` ADD KEY `idx_sales_business_date` (`idBusiness`,`sale_date`)');
CALL sp_add_index_if_not_exists('sales', 'idx_sales_payment_method', 'ALTER TABLE `sales` ADD KEY `idx_sales_payment_method` (`idPaymentMethod`)');
CALL sp_add_index_if_not_exists('sales', 'idx_sales_cash_session', 'ALTER TABLE `sales` ADD KEY `idx_sales_cash_session` (`idCashSession`)');
CALL sp_add_index_if_not_exists('sales', 'idx_sales_business_cash_session_status', 'ALTER TABLE `sales` ADD KEY `idx_sales_business_cash_session_status` (`idBusiness`,`idCashSession`,`status`)');
CALL sp_add_index_if_not_exists('sales', 'fk_sales_user', 'ALTER TABLE `sales` ADD KEY `fk_sales_user` (`idUser`)');
CALL sp_add_index_if_not_exists('sales', 'fk_sales_customer', 'ALTER TABLE `sales` ADD KEY `fk_sales_customer` (`idBusiness`,`idCustomer`)');
CALL sp_add_index_if_not_exists('sales', 'fk_sales_payment_method', 'ALTER TABLE `sales` ADD KEY `fk_sales_payment_method` (`idBusiness`,`idPaymentMethod`)');
CALL sp_add_index_if_not_exists('sales', 'fk_sales_deposit', 'ALTER TABLE `sales` ADD KEY `fk_sales_deposit` (`idBusiness`,`idDeposit`)');
CALL sp_add_index_if_not_exists('sale_details', 'fk_sale_details_sale', 'ALTER TABLE `sale_details` ADD KEY `fk_sale_details_sale` (`idBusiness`,`idSale`)');
CALL sp_add_index_if_not_exists('sale_details', 'fk_sale_details_product', 'ALTER TABLE `sale_details` ADD KEY `fk_sale_details_product` (`idBusiness`,`idProduct`)');
CALL sp_add_index_if_not_exists('stock_movements', 'idx_stock_movements_business_product', 'ALTER TABLE `stock_movements` ADD KEY `idx_stock_movements_business_product` (`idBusiness`,`idProduct`)');
CALL sp_add_index_if_not_exists('stock_movements', 'idx_stock_movements_business_date', 'ALTER TABLE `stock_movements` ADD KEY `idx_stock_movements_business_date` (`idBusiness`,`created_at`)');
CALL sp_add_index_if_not_exists('stock_movements', 'fk_stock_movements_user', 'ALTER TABLE `stock_movements` ADD KEY `fk_stock_movements_user` (`idUser`)');
CALL sp_add_index_if_not_exists('stock_movements', 'fk_stock_movements_deposit_from', 'ALTER TABLE `stock_movements` ADD KEY `fk_stock_movements_deposit_from` (`idBusiness`,`idDepositFrom`)');
CALL sp_add_index_if_not_exists('stock_movements', 'fk_stock_movements_deposit_to', 'ALTER TABLE `stock_movements` ADD KEY `fk_stock_movements_deposit_to` (`idBusiness`,`idDepositTo`)');

DROP PROCEDURE IF EXISTS sp_add_index_if_not_exists;
