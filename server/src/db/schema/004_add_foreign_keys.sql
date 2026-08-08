/*
  004_add_foreign_keys.sql
  Generated from server/src/db/export_db structure-only dump.
  Target defaults: ENGINE=InnoDB, CHARACTER SET utf8mb4, COLLATE utf8mb4_unicode_ci.
*/

USE `punto_venta_dev_clean_2`;

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

CALL sp_add_foreign_key_if_not_exists('fk_role_permissions_permission', 'ALTER TABLE `role_permissions` ADD CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`idPermission`) REFERENCES `permissions` (`idPermission`)');
CALL sp_add_foreign_key_if_not_exists('fk_business_users_business', 'ALTER TABLE `business_users` ADD CONSTRAINT `fk_business_users_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_business_users_user', 'ALTER TABLE `business_users` ADD CONSTRAINT `fk_business_users_user` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`)');
CALL sp_add_foreign_key_if_not_exists('fk_platform_users_users1', 'ALTER TABLE `platform_users` ADD CONSTRAINT `fk_platform_users_users1` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`)');
CALL sp_add_foreign_key_if_not_exists('fk_business_user_permissions_business', 'ALTER TABLE `business_user_permissions` ADD CONSTRAINT `fk_business_user_permissions_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_business_user_permissions_created_by', 'ALTER TABLE `business_user_permissions` ADD CONSTRAINT `fk_business_user_permissions_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`idUser`)');
CALL sp_add_foreign_key_if_not_exists('fk_business_user_permissions_permission', 'ALTER TABLE `business_user_permissions` ADD CONSTRAINT `fk_business_user_permissions_permission` FOREIGN KEY (`idPermission`) REFERENCES `permissions` (`idPermission`)');
CALL sp_add_foreign_key_if_not_exists('fk_business_user_permissions_user', 'ALTER TABLE `business_user_permissions` ADD CONSTRAINT `fk_business_user_permissions_user` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`)');
CALL sp_add_foreign_key_if_not_exists('fk_business_subscriptions_businesses1', 'ALTER TABLE `business_subscriptions` ADD CONSTRAINT `fk_business_subscriptions_businesses1` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_business_subscriptions_subscription_plans1', 'ALTER TABLE `business_subscriptions` ADD CONSTRAINT `fk_business_subscriptions_subscription_plans1` FOREIGN KEY (`idSubscriptionPlan`) REFERENCES `subscription_plans` (`idSubscriptionPlan`)');
CALL sp_add_foreign_key_if_not_exists('fk_subscription_events_business_subscriptions1', 'ALTER TABLE `subscription_events` ADD CONSTRAINT `fk_subscription_events_business_subscriptions1` FOREIGN KEY (`idBusinessSubscription`) REFERENCES `business_subscriptions` (`idBusinessSubscription`)');
CALL sp_add_foreign_key_if_not_exists('fk_subscription_payments_business_subscriptions1', 'ALTER TABLE `subscription_payments` ADD CONSTRAINT `fk_subscription_payments_business_subscriptions1` FOREIGN KEY (`idBusinessSubscription`) REFERENCES `business_subscriptions` (`idBusinessSubscription`)');
CALL sp_add_foreign_key_if_not_exists('fk_platform_audit_logs_platform_user', 'ALTER TABLE `platform_audit_logs` ADD CONSTRAINT `fk_platform_audit_logs_platform_user` FOREIGN KEY (`idPlatformUser`) REFERENCES `platform_users` (`idPlatformUser`)');
CALL sp_add_foreign_key_if_not_exists('fk_platform_audit_logs_business', 'ALTER TABLE `platform_audit_logs` ADD CONSTRAINT `fk_platform_audit_logs_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_user_sessions_users1', 'ALTER TABLE `user_sessions` ADD CONSTRAINT `fk_user_sessions_users1` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`)');
CALL sp_add_foreign_key_if_not_exists('fk_notifications_business', 'ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_notifications_created_by_user', 'ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_created_by_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`idUser`)');
CALL sp_add_foreign_key_if_not_exists('fk_notifications_created_by_platform_user', 'ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_created_by_platform_user` FOREIGN KEY (`created_by_platform_user_id`) REFERENCES `platform_users` (`idPlatformUser`)');
CALL sp_add_foreign_key_if_not_exists('fk_notification_recipients_notification', 'ALTER TABLE `notification_recipients` ADD CONSTRAINT `fk_notification_recipients_notification` FOREIGN KEY (`idNotification`) REFERENCES `notifications` (`idNotification`) ON DELETE CASCADE ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_notification_recipients_user', 'ALTER TABLE `notification_recipients` ADD CONSTRAINT `fk_notification_recipients_user` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`)');
CALL sp_add_foreign_key_if_not_exists('fk_notification_recipients_platform_user', 'ALTER TABLE `notification_recipients` ADD CONSTRAINT `fk_notification_recipients_platform_user` FOREIGN KEY (`idPlatformUser`) REFERENCES `platform_users` (`idPlatformUser`)');
CALL sp_add_foreign_key_if_not_exists('fk_customers_business', 'ALTER TABLE `customers` ADD CONSTRAINT `fk_customers_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_suppliers_business', 'ALTER TABLE `suppliers` ADD CONSTRAINT `fk_suppliers_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_deposits_business', 'ALTER TABLE `deposits` ADD CONSTRAINT `fk_deposits_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_payment_methods_business', 'ALTER TABLE `payment_methods` ADD CONSTRAINT `fk_payment_methods_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_cash_registers_business', 'ALTER TABLE `cash_registers` ADD CONSTRAINT `fk_cash_registers_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_cash_sessions_business', 'ALTER TABLE `cash_sessions` ADD CONSTRAINT `fk_cash_sessions_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_cash_sessions_register', 'ALTER TABLE `cash_sessions` ADD CONSTRAINT `fk_cash_sessions_register` FOREIGN KEY (`idBusiness`, `idCashRegister`) REFERENCES `cash_registers` (`idBusiness`, `idCashRegister`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_cash_sessions_opened_by_user', 'ALTER TABLE `cash_sessions` ADD CONSTRAINT `fk_cash_sessions_opened_by_user` FOREIGN KEY (`opened_by_user_id`) REFERENCES `users` (`idUser`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_cash_sessions_closed_by_user', 'ALTER TABLE `cash_sessions` ADD CONSTRAINT `fk_cash_sessions_closed_by_user` FOREIGN KEY (`closed_by_user_id`) REFERENCES `users` (`idUser`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_cash_movements_business', 'ALTER TABLE `cash_movements` ADD CONSTRAINT `fk_cash_movements_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_cash_movements_session', 'ALTER TABLE `cash_movements` ADD CONSTRAINT `fk_cash_movements_session` FOREIGN KEY (`idCashSession`) REFERENCES `cash_sessions` (`idCashSession`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_cash_movements_user', 'ALTER TABLE `cash_movements` ADD CONSTRAINT `fk_cash_movements_user` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_cash_summaries_business', 'ALTER TABLE `cash_session_payment_summaries` ADD CONSTRAINT `fk_cash_summaries_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_cash_summaries_session', 'ALTER TABLE `cash_session_payment_summaries` ADD CONSTRAINT `fk_cash_summaries_session` FOREIGN KEY (`idCashSession`) REFERENCES `cash_sessions` (`idCashSession`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_cash_summaries_payment_method', 'ALTER TABLE `cash_session_payment_summaries` ADD CONSTRAINT `fk_cash_summaries_payment_method` FOREIGN KEY (`idPaymentMethod`) REFERENCES `payment_methods` (`idPaymentMethod`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_product_categories_business', 'ALTER TABLE `product_categories` ADD CONSTRAINT `fk_product_categories_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_products_business', 'ALTER TABLE `products` ADD CONSTRAINT `fk_products_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_products_category', 'ALTER TABLE `products` ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`idBusiness`, `idProductCategory`) REFERENCES `product_categories` (`idBusiness`, `idProductCategory`)');
CALL sp_add_foreign_key_if_not_exists('fk_stock_business', 'ALTER TABLE `stock` ADD CONSTRAINT `fk_stock_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_stock_deposit', 'ALTER TABLE `stock` ADD CONSTRAINT `fk_stock_deposit` FOREIGN KEY (`idBusiness`, `idDeposit`) REFERENCES `deposits` (`idBusiness`, `idDeposit`)');
CALL sp_add_foreign_key_if_not_exists('fk_stock_product', 'ALTER TABLE `stock` ADD CONSTRAINT `fk_stock_product` FOREIGN KEY (`idBusiness`, `idProduct`) REFERENCES `products` (`idBusiness`, `idProduct`)');
CALL sp_add_foreign_key_if_not_exists('fk_purchases_business', 'ALTER TABLE `purchases` ADD CONSTRAINT `fk_purchases_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_purchases_supplier', 'ALTER TABLE `purchases` ADD CONSTRAINT `fk_purchases_supplier` FOREIGN KEY (`idBusiness`, `idSupplier`) REFERENCES `suppliers` (`idBusiness`, `idSupplier`)');
CALL sp_add_foreign_key_if_not_exists('fk_purchases_user', 'ALTER TABLE `purchases` ADD CONSTRAINT `fk_purchases_user` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`)');
CALL sp_add_foreign_key_if_not_exists('fk_purchase_details_deposit', 'ALTER TABLE `purchase_details` ADD CONSTRAINT `fk_purchase_details_deposit` FOREIGN KEY (`idBusiness`, `idDeposit`) REFERENCES `deposits` (`idBusiness`, `idDeposit`)');
CALL sp_add_foreign_key_if_not_exists('fk_purchase_details_product', 'ALTER TABLE `purchase_details` ADD CONSTRAINT `fk_purchase_details_product` FOREIGN KEY (`idBusiness`, `idProduct`) REFERENCES `products` (`idBusiness`, `idProduct`)');
CALL sp_add_foreign_key_if_not_exists('fk_purchase_details_purchase', 'ALTER TABLE `purchase_details` ADD CONSTRAINT `fk_purchase_details_purchase` FOREIGN KEY (`idBusiness`, `idPurchase`) REFERENCES `purchases` (`idBusiness`, `idPurchase`)');
CALL sp_add_foreign_key_if_not_exists('fk_sales_business', 'ALTER TABLE `sales` ADD CONSTRAINT `fk_sales_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_sales_cash_session', 'ALTER TABLE `sales` ADD CONSTRAINT `fk_sales_cash_session` FOREIGN KEY (`idCashSession`) REFERENCES `cash_sessions` (`idCashSession`) ON DELETE RESTRICT ON UPDATE RESTRICT');
CALL sp_add_foreign_key_if_not_exists('fk_sales_customer', 'ALTER TABLE `sales` ADD CONSTRAINT `fk_sales_customer` FOREIGN KEY (`idBusiness`, `idCustomer`) REFERENCES `customers` (`idBusiness`, `idCustomer`)');
CALL sp_add_foreign_key_if_not_exists('fk_sales_deposit', 'ALTER TABLE `sales` ADD CONSTRAINT `fk_sales_deposit` FOREIGN KEY (`idBusiness`, `idDeposit`) REFERENCES `deposits` (`idBusiness`, `idDeposit`)');
CALL sp_add_foreign_key_if_not_exists('fk_sales_payment_method', 'ALTER TABLE `sales` ADD CONSTRAINT `fk_sales_payment_method` FOREIGN KEY (`idBusiness`, `idPaymentMethod`) REFERENCES `payment_methods` (`idBusiness`, `idPaymentMethod`)');
CALL sp_add_foreign_key_if_not_exists('fk_sales_user', 'ALTER TABLE `sales` ADD CONSTRAINT `fk_sales_user` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`)');
CALL sp_add_foreign_key_if_not_exists('fk_sale_details_product', 'ALTER TABLE `sale_details` ADD CONSTRAINT `fk_sale_details_product` FOREIGN KEY (`idBusiness`, `idProduct`) REFERENCES `products` (`idBusiness`, `idProduct`)');
CALL sp_add_foreign_key_if_not_exists('fk_sale_details_sale', 'ALTER TABLE `sale_details` ADD CONSTRAINT `fk_sale_details_sale` FOREIGN KEY (`idBusiness`, `idSale`) REFERENCES `sales` (`idBusiness`, `idSale`)');
CALL sp_add_foreign_key_if_not_exists('fk_stock_movements_business', 'ALTER TABLE `stock_movements` ADD CONSTRAINT `fk_stock_movements_business` FOREIGN KEY (`idBusiness`) REFERENCES `businesses` (`idBusiness`)');
CALL sp_add_foreign_key_if_not_exists('fk_stock_movements_deposit_from', 'ALTER TABLE `stock_movements` ADD CONSTRAINT `fk_stock_movements_deposit_from` FOREIGN KEY (`idBusiness`, `idDepositFrom`) REFERENCES `deposits` (`idBusiness`, `idDeposit`)');
CALL sp_add_foreign_key_if_not_exists('fk_stock_movements_deposit_to', 'ALTER TABLE `stock_movements` ADD CONSTRAINT `fk_stock_movements_deposit_to` FOREIGN KEY (`idBusiness`, `idDepositTo`) REFERENCES `deposits` (`idBusiness`, `idDeposit`)');
CALL sp_add_foreign_key_if_not_exists('fk_stock_movements_product', 'ALTER TABLE `stock_movements` ADD CONSTRAINT `fk_stock_movements_product` FOREIGN KEY (`idBusiness`, `idProduct`) REFERENCES `products` (`idBusiness`, `idProduct`)');
CALL sp_add_foreign_key_if_not_exists('fk_stock_movements_user', 'ALTER TABLE `stock_movements` ADD CONSTRAINT `fk_stock_movements_user` FOREIGN KEY (`idUser`) REFERENCES `users` (`idUser`)');

DROP PROCEDURE IF EXISTS sp_add_foreign_key_if_not_exists;
