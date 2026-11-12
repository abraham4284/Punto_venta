-- T2.2 operator migration. Select and verify the target database before applying.
-- Reimport procedures/stock_movements.sql for reference search after this file.
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_migrate_stock_transfer_reference_lookup$$
CREATE PROCEDURE sp_migrate_stock_transfer_reference_lookup()
BEGIN
  IF DATABASE() IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Select and verify the intended database first';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stock_movements'
      AND INDEX_NAME = 'idx_stock_movements_business_reference'
  ) THEN
    ALTER TABLE stock_movements
      ADD KEY idx_stock_movements_business_reference (idBusiness, reference_type, reference_id);
  END IF;
END$$
CALL sp_migrate_stock_transfer_reference_lookup()$$
DROP PROCEDURE IF EXISTS sp_migrate_stock_transfer_reference_lookup$$
DELIMITER ;
