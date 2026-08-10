DELIMITER $$

DROP PROCEDURE IF EXISTS sp_add_column_if_not_exists$$
CREATE PROCEDURE sp_add_column_if_not_exists(
  IN p_tableName VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_columnName VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_alterSql TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tableName
      AND COLUMN_NAME = p_columnName
  ) THEN
    SET @addColumnSql = p_alterSql;
    PREPARE stmt FROM @addColumnSql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_add_index_if_not_exists_migration$$
CREATE PROCEDURE sp_add_index_if_not_exists_migration(
  IN p_tableName VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_indexName VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_alterSql TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tableName
      AND INDEX_NAME = p_indexName
  ) THEN
    SET @addIndexSql = p_alterSql;
    PREPARE stmt FROM @addIndexSql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DELIMITER ;

CALL sp_add_column_if_not_exists(
  'sales',
  'idempotency_key',
  'ALTER TABLE `sales` ADD COLUMN `idempotency_key` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `sale_number`'
);

UPDATE sales
SET idempotency_key = CONCAT('legacy-sale-', idSale)
WHERE idSale > 0
  AND (idempotency_key IS NULL OR TRIM(idempotency_key) = '');

ALTER TABLE `sales`
  MODIFY COLUMN `idempotency_key` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

CALL sp_add_index_if_not_exists_migration(
  'sales',
  'uq_sales_business_idempotency',
  'ALTER TABLE `sales` ADD UNIQUE KEY `uq_sales_business_idempotency` (`idBusiness`,`idempotency_key`)'
);

CALL sp_add_column_if_not_exists(
  'purchases',
  'idempotency_key',
  'ALTER TABLE `purchases` ADD COLUMN `idempotency_key` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `purchase_number`'
);

UPDATE purchases
SET idempotency_key = CONCAT('legacy-purchase-', idPurchase)
WHERE idPurchase > 0
  AND (idempotency_key IS NULL OR TRIM(idempotency_key) = '');

ALTER TABLE `purchases`
  MODIFY COLUMN `idempotency_key` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

CALL sp_add_index_if_not_exists_migration(
  'purchases',
  'uq_purchases_business_idempotency',
  'ALTER TABLE `purchases` ADD UNIQUE KEY `uq_purchases_business_idempotency` (`idBusiness`,`idempotency_key`)'
);

DROP PROCEDURE IF EXISTS sp_add_index_if_not_exists_migration;
DROP PROCEDURE IF EXISTS sp_add_column_if_not_exists;
