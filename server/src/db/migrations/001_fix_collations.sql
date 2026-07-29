ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS sp_fix_database_collations;
DELIMITER $$

CREATE PROCEDURE sp_fix_database_collations()
BEGIN
  DECLARE v_done TINYINT DEFAULT 0;
  DECLARE v_table_name VARCHAR(255);
  DECLARE v_target_schema VARCHAR(255);
  DECLARE v_sql TEXT;

  DECLARE table_cursor CURSOR FOR
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = v_target_schema
      AND TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  SET v_target_schema = DATABASE();

  IF v_target_schema IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Debe seleccionar una base con USE nombre_base antes de ejecutar el fix';
  END IF;

  OPEN table_cursor;

  table_loop: LOOP
    FETCH table_cursor INTO v_table_name;

    IF v_done = 1 THEN
      LEAVE table_loop;
    END IF;

    SET v_sql = CONCAT(
      'ALTER TABLE `',
      REPLACE(v_table_name, '`', '``'),
      '` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    );

    SET @fix_collation_sql = v_sql;
    PREPARE fix_collation_stmt FROM @fix_collation_sql;
    EXECUTE fix_collation_stmt;
    DEALLOCATE PREPARE fix_collation_stmt;
  END LOOP;

  CLOSE table_cursor;
END$$

DELIMITER ;

CALL sp_fix_database_collations();

DROP PROCEDURE IF EXISTS sp_fix_database_collations;

SET @target_schema = DATABASE();

SELECT
  TABLE_NAME,
  TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = @target_schema
  AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

SELECT
  TABLE_NAME,
  COLUMN_NAME,
  CHARACTER_SET_NAME,
  COLLATION_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @target_schema
  AND CHARACTER_SET_NAME IS NOT NULL
  AND COLLATION_NAME <> 'utf8mb4_unicode_ci'
ORDER BY TABLE_NAME, ORDINAL_POSITION;
