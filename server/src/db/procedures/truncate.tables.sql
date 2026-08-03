-- Seleccioná primero la base correcta.
USE punto_venta_dev_clean_2;

-- Permite truncar tablas relacionadas mediante foreign keys.
SET FOREIGN_KEY_CHECKS = 0;

DROP PROCEDURE IF EXISTS truncate_all_tables;

DELIMITER $$

CREATE PROCEDURE truncate_all_tables()
BEGIN
    DECLARE finished INT DEFAULT 0;
    DECLARE current_table_name VARCHAR(255);

    DECLARE table_cursor CURSOR FOR
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_TYPE = 'BASE TABLE';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

    OPEN table_cursor;

    truncate_loop: LOOP
        FETCH table_cursor INTO current_table_name;

        IF finished = 1 THEN
            LEAVE truncate_loop;
        END IF;

        SET @truncate_statement = CONCAT(
            'TRUNCATE TABLE `',
            REPLACE(current_table_name, '`', '``'),
            '`'
        );

        PREPARE truncate_command FROM @truncate_statement;
        EXECUTE truncate_command;
        DEALLOCATE PREPARE truncate_command;
    END LOOP;

    CLOSE table_cursor;
END$$

DELIMITER ;

CALL truncate_all_tables();

DROP PROCEDURE IF EXISTS truncate_all_tables;

SET FOREIGN_KEY_CHECKS = 1;