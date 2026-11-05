-- F10.1 OPERATOR ONLY. Backup required; confirm DATABASE()/host/environment and stop writes.
-- Existing DB must already have manual/001..006. No reset, historical pricing inference or global enablement.
-- DDL commits implicitly. Retomable by object existence, not a repair of mismatched definitions.
-- Apply this file, then reimport COMPLETE procedures/businesses.sql, customers.sql,
-- sales.sql and storefront_catalog.sql; deploy F10.1 backend before resuming writes.
-- sp_update_business: 6 -> 8 arguments. Sales/Customers signatures unchanged.
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_migrate_wholesale_pricing$$
CREATE PROCEDURE sp_migrate_wholesale_pricing()
BEGIN
  IF DATABASE() IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Select and verify the intended database first';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'businesses' AND COLUMN_NAME = 'wholesale_enabled') THEN
    ALTER TABLE businesses ADD COLUMN wholesale_enabled TINYINT(1) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'businesses' AND COLUMN_NAME = 'wholesale_minimum_amount') THEN
    ALTER TABLE businesses ADD COLUMN wholesale_minimum_amount DECIMAL(18,2) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'pricing_tier') THEN
    ALTER TABLE customers ADD COLUMN pricing_tier ENUM('RETAIL','WHOLESALE') NOT NULL DEFAULT 'RETAIL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'wholesale_since') THEN
    ALTER TABLE customers ADD COLUMN wholesale_since DATETIME NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'pricing_type') THEN
    ALTER TABLE sales ADD COLUMN pricing_type ENUM('RETAIL','WHOLESALE') NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'businesses' AND CONSTRAINT_NAME = 'chk_business_wholesale') THEN
    ALTER TABLE businesses ADD CONSTRAINT chk_business_wholesale CHECK (wholesale_enabled IN (0,1) AND (wholesale_minimum_amount IS NULL OR wholesale_minimum_amount > 0) AND (wholesale_enabled = 0 OR wholesale_minimum_amount IS NOT NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND CONSTRAINT_NAME = 'chk_customer_pricing_tier') THEN
    ALTER TABLE customers ADD CONSTRAINT chk_customer_pricing_tier CHECK ((pricing_tier = 'RETAIL' AND wholesale_since IS NULL) OR (pricing_tier = 'WHOLESALE' AND wholesale_since IS NOT NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND CONSTRAINT_NAME = 'chk_sale_wholesale_customer') THEN
    ALTER TABLE sales ADD CONSTRAINT chk_sale_wholesale_customer CHECK (pricing_type IS NULL OR pricing_type <> 'WHOLESALE' OR idCustomer IS NOT NULL);
  END IF;
END$$
CALL sp_migrate_wholesale_pricing()$$
DROP PROCEDURE IF EXISTS sp_migrate_wholesale_pricing$$
DELIMITER ;
