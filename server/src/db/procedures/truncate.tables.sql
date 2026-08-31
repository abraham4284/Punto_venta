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


-----

DROP PROCEDURE IF EXISTS clear_all_tables;

DELIMITER $$

CREATE PROCEDURE clear_all_tables()
BEGIN
    DECLARE finished INT DEFAULT 0;
    DECLARE current_table_name VARCHAR(255);
    DECLARE has_auto_increment INT DEFAULT 0;

    DECLARE table_cursor CURSOR FOR
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_TYPE = 'BASE TABLE';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

    OPEN table_cursor;

    SET FOREIGN_KEY_CHECKS = 0;

    clear_loop: LOOP
        FETCH table_cursor INTO current_table_name;

        IF finished = 1 THEN
            LEAVE clear_loop;
        END IF;

        /* Vaciar la tabla */
        SET @delete_statement = CONCAT(
            'DELETE FROM `',
            REPLACE(current_table_name, '`', '``'),
            '`'
        );

        PREPARE delete_command FROM @delete_statement;
        EXECUTE delete_command;
        DEALLOCATE PREPARE delete_command;

        /* Verificar si posee AUTO_INCREMENT */
        SELECT COUNT(*)
        INTO has_auto_increment
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = current_table_name
          AND EXTRA LIKE '%auto_increment%';

        /* Reiniciar el AUTO_INCREMENT */
        IF has_auto_increment > 0 THEN
            SET @auto_increment_statement = CONCAT(
                'ALTER TABLE `',
                REPLACE(current_table_name, '`', '``'),
                '` AUTO_INCREMENT = 1'
            );

            PREPARE auto_increment_command
            FROM @auto_increment_statement;

            EXECUTE auto_increment_command;

            DEALLOCATE PREPARE auto_increment_command;
        END IF;

    END LOOP;

    CLOSE table_cursor;

    SET FOREIGN_KEY_CHECKS = 1;
END$$

DELIMITER ;

CALL clear_all_tables();

DROP PROCEDURE IF EXISTS clear_all_tables;

SET FOREIGN_KEY_CHECKS = 1;