DELIMITER $$

DROP PROCEDURE IF EXISTS sp_drop_payment_method_index_if_exists$$
CREATE PROCEDURE sp_drop_payment_method_index_if_exists(
  IN p_indexName VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'payment_methods'
      AND index_name = p_indexName
  ) THEN
    SET @dropIndexSql = CONCAT('ALTER TABLE `payment_methods` DROP INDEX `', p_indexName, '`');
    PREPARE stmt FROM @dropIndexSql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_add_payment_method_index_if_not_exists$$
CREATE PROCEDURE sp_add_payment_method_index_if_not_exists(
  IN p_indexName VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_alterSql TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'payment_methods'
      AND index_name = p_indexName
  ) THEN
    SET @addIndexSql = p_alterSql;
    PREPARE stmt FROM @addIndexSql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_fix_payment_methods_unique_indexes$$
CREATE PROCEDURE sp_fix_payment_methods_unique_indexes()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM payment_methods
    GROUP BY idBusiness, name
    HAVING COUNT(*) > 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'DUPLICATED_PAYMENT_METHOD_NAMES_FOUND';
  END IF;

  CALL sp_drop_payment_method_index_if_exists('uk_payment_method_business_code');

  CALL sp_add_payment_method_index_if_not_exists(
    'uk_payment_method_business_name',
    'ALTER TABLE `payment_methods` ADD UNIQUE KEY `uk_payment_method_business_name` (`idBusiness`,`name`)'
  );

  CALL sp_add_payment_method_index_if_not_exists(
    'idx_payment_methods_business_code',
    'ALTER TABLE `payment_methods` ADD KEY `idx_payment_methods_business_code` (`idBusiness`,`code`)'
  );
END$$

DELIMITER ;

CALL sp_fix_payment_methods_unique_indexes();

DROP PROCEDURE IF EXISTS sp_fix_payment_methods_unique_indexes;
DROP PROCEDURE IF EXISTS sp_add_payment_method_index_if_not_exists;
DROP PROCEDURE IF EXISTS sp_drop_payment_method_index_if_exists;
