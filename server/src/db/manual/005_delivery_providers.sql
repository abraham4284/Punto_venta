-- F7: OPERATOR ONLY. Backup, confirm selected DB and stop writes. DDL commits implicitly.
-- Apply after F5. Then import procedures/deliveries.sql, procedures/sale_payments.sql and procedures/sales.sql; deploy matching backend/client.
-- Never infer THIRD_PARTY from a missing assigned user. No financial writes.
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_migrate_delivery_providers$$
CREATE PROCEDURE sp_migrate_delivery_providers()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_deliveries' AND COLUMN_NAME = 'provider_type') THEN
    ALTER TABLE sale_deliveries ADD COLUMN provider_type ENUM('INTERNAL','THIRD_PARTY') NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_deliveries' AND COLUMN_NAME = 'external_provider_name') THEN
    ALTER TABLE sale_deliveries ADD COLUMN external_provider_name VARCHAR(120) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_deliveries' AND COLUMN_NAME = 'external_reference') THEN
    ALTER TABLE sale_deliveries ADD COLUMN external_reference VARCHAR(150) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_deliveries' AND COLUMN_NAME = 'external_contact_name') THEN
    ALTER TABLE sale_deliveries ADD COLUMN external_contact_name VARCHAR(160) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_deliveries' AND COLUMN_NAME = 'external_contact_phone') THEN
    ALTER TABLE sale_deliveries ADD COLUMN external_contact_phone VARCHAR(80) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_deliveries' AND COLUMN_NAME = 'external_cost') THEN
    ALTER TABLE sale_deliveries ADD COLUMN external_cost DECIMAL(18,2) NULL;
  END IF;
  UPDATE sale_deliveries SET provider_type = 'INTERNAL' WHERE provider_type IS NULL AND assigned_to_user_id IS NOT NULL;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_deliveries' AND CONSTRAINT_NAME = 'chk_delivery_provider') THEN
    ALTER TABLE sale_deliveries ADD CONSTRAINT chk_delivery_provider CHECK (((provider_type IS NULL AND assigned_to_user_id IS NULL AND external_provider_name IS NULL AND external_reference IS NULL AND external_contact_name IS NULL AND external_contact_phone IS NULL AND external_cost IS NULL) OR (provider_type IS NOT NULL AND provider_type = 'INTERNAL' AND assigned_to_user_id IS NOT NULL AND external_provider_name IS NULL AND external_reference IS NULL AND external_contact_name IS NULL AND external_contact_phone IS NULL AND external_cost IS NULL) OR (provider_type IS NOT NULL AND provider_type = 'THIRD_PARTY' AND assigned_to_user_id IS NULL AND external_provider_name IS NOT NULL AND CHAR_LENGTH(TRIM(external_provider_name)) > 0 AND (external_cost IS NULL OR external_cost >= 0))));
  END IF;
END$$
CALL sp_migrate_delivery_providers()$$
DROP PROCEDURE IF EXISTS sp_migrate_delivery_providers$$
DELIMITER ;
