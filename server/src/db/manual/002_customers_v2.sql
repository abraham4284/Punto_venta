/*
  Customers v2, existing pre-release DBs only. Back up first, stop application writes.
  DDL auto-commits: this is not a transactional migration.
  TEST DATA MODE: the final CALL explicitly authorizes conversion of disposable legacy names.
  IDs and sales references are preserved. first_name keeps up to 120 legacy characters;
  last_name defaults to 'Sin apellido'. No semantic name splitting is attempted.
  For real customer data use CALL sp_migrate_customers_v2(0) instead and migrate names manually.
  After successful CALL, reload canonical procedures IN ORDER (see CUSTOMERS_V2.md):
  customers.sql, sales.sql, tickets.sql, cash_settlements.sql, dashboard.sql, platform_businesses.sql.
  Keep the application stopped until all six files are loaded. Do not run install.sql on an existing DB.
*/
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_migrate_customers_v2$$
CREATE PROCEDURE sp_migrate_customers_v2(IN p_allow_test_data TINYINT)
BEGIN
  DECLARE v_done TINYINT DEFAULT 0;
  DECLARE v_idCustomer INT;
  DECLARE customer_cursor CURSOR FOR SELECT idCustomer FROM customers ORDER BY idCustomer;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'name')
     AND EXISTS (SELECT 1 FROM customers LIMIT 1)
     AND COALESCE(p_allow_test_data, 0) <> 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customers v2 requiere customers vacia o migracion manual de nombres existentes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'first_name') THEN
    ALTER TABLE customers ADD COLUMN first_name varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'last_name') THEN
    ALTER TABLE customers ADD COLUMN last_name varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
  END IF;
  IF p_allow_test_data = 1 AND EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'name'
  ) THEN
    -- Dynamic SQL avoids referencing a removed legacy column on subsequent executions.
    -- Update by primary key to support Workbench SQL_SAFE_UPDATES without disabling it.
    SET @customers_v2_update = 'UPDATE customers SET first_name = CASE WHEN first_name IS NULL OR CHAR_LENGTH(TRIM(first_name)) < 2 THEN CASE WHEN CHAR_LENGTH(TRIM(COALESCE(name, ''''))) >= 2 THEN LEFT(TRIM(name), 120) ELSE ''Cliente'' END ELSE first_name END, last_name = CASE WHEN last_name IS NULL OR CHAR_LENGTH(TRIM(last_name)) < 2 THEN ''Sin apellido'' ELSE last_name END WHERE idCustomer = ?';
    PREPARE customers_v2_stmt FROM @customers_v2_update;
    OPEN customer_cursor;
    customer_loop: LOOP
      FETCH customer_cursor INTO v_idCustomer;
      IF v_done = 1 THEN
        LEAVE customer_loop;
      END IF;
      SET @customers_v2_id = v_idCustomer;
      EXECUTE customers_v2_stmt USING @customers_v2_id;
    END LOOP;
    CLOSE customer_cursor;
    DEALLOCATE PREPARE customers_v2_stmt;
  END IF;
  ALTER TABLE customers
    MODIFY COLUMN first_name varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    MODIFY COLUMN last_name varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'document_type') THEN
    ALTER TABLE customers ADD COLUMN document_type enum('DNI','CUIL','CUIT','PASSPORT','OTHER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'document_number') THEN
    ALTER TABLE customers ADD COLUMN document_number varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND INDEX_NAME = 'uk_customer_business_id') THEN
    ALTER TABLE customers ADD UNIQUE KEY uk_customer_business_id (idBusiness, idCustomer);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND INDEX_NAME = 'idx_customers_business_last_first') THEN
    ALTER TABLE customers ADD KEY idx_customers_business_last_first (idBusiness, last_name, first_name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND INDEX_NAME = 'uk_customers_business_document') THEN
    ALTER TABLE customers ADD UNIQUE KEY uk_customers_business_document (idBusiness, document_type, document_number);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND CONSTRAINT_NAME = 'chk_customers_document_pair') THEN
    ALTER TABLE customers ADD CONSTRAINT chk_customers_document_pair CHECK ((document_type IS NULL AND document_number IS NULL) OR (document_type IS NOT NULL AND document_number IS NOT NULL AND CHAR_LENGTH(TRIM(document_number)) > 0));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND INDEX_NAME = 'idx_customers_business_name') THEN
    ALTER TABLE customers DROP INDEX idx_customers_business_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'name') THEN
    ALTER TABLE customers DROP COLUMN name;
  END IF;
END$$
DELIMITER ;
-- Explicit operator opt-in: ONLY disposable test customer data, even on hosted databases.
CALL sp_migrate_customers_v2(1);
DROP PROCEDURE IF EXISTS sp_migrate_customers_v2;
