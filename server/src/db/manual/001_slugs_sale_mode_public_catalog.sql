/*
  Manual update for existing pre-release databases.

  Purpose:
  - Add public slugs to product_categories and products.
  - Add sale_mode and availability_note to products.
  - Backfill deterministic tenant-scoped slugs.
  - Add tenant-scoped unique constraints after data is consistent.

  Do not run this file against a clean database created from schema/.
  Back up the target database before running.
*/

ALTER TABLE `product_categories`
  ADD COLUMN `slug` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `name`;

ALTER TABLE `products`
  ADD COLUMN `slug` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `name`,
  ADD COLUMN `sale_mode` enum('STOCK','ON_ORDER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STOCK' AFTER `unit_type`,
  ADD COLUMN `availability_note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `sale_mode`;

DROP FUNCTION IF EXISTS fn_cajora_public_slug_base;
DELIMITER $$

CREATE FUNCTION fn_cajora_public_slug_base(p_value VARCHAR(255))
RETURNS VARCHAR(180)
DETERMINISTIC
BEGIN
  DECLARE v_value VARCHAR(255);

  SET v_value = LOWER(TRIM(COALESCE(p_value, 'item')));
  SET v_value = REPLACE(v_value, 'á', 'a');
  SET v_value = REPLACE(v_value, 'à', 'a');
  SET v_value = REPLACE(v_value, 'ä', 'a');
  SET v_value = REPLACE(v_value, 'â', 'a');
  SET v_value = REPLACE(v_value, 'é', 'e');
  SET v_value = REPLACE(v_value, 'è', 'e');
  SET v_value = REPLACE(v_value, 'ë', 'e');
  SET v_value = REPLACE(v_value, 'ê', 'e');
  SET v_value = REPLACE(v_value, 'í', 'i');
  SET v_value = REPLACE(v_value, 'ì', 'i');
  SET v_value = REPLACE(v_value, 'ï', 'i');
  SET v_value = REPLACE(v_value, 'î', 'i');
  SET v_value = REPLACE(v_value, 'ó', 'o');
  SET v_value = REPLACE(v_value, 'ò', 'o');
  SET v_value = REPLACE(v_value, 'ö', 'o');
  SET v_value = REPLACE(v_value, 'ô', 'o');
  SET v_value = REPLACE(v_value, 'ú', 'u');
  SET v_value = REPLACE(v_value, 'ù', 'u');
  SET v_value = REPLACE(v_value, 'ü', 'u');
  SET v_value = REPLACE(v_value, 'û', 'u');
  SET v_value = REPLACE(v_value, 'ñ', 'n');
  SET v_value = REGEXP_REPLACE(v_value, '[^a-z0-9]+', '-');
  SET v_value = REGEXP_REPLACE(v_value, '^-+|-+$', '');
  SET v_value = REGEXP_REPLACE(v_value, '-+', '-');

  IF v_value = '' THEN
    SET v_value = 'item';
  END IF;

  RETURN LEFT(v_value, 180);
END$$

DROP PROCEDURE IF EXISTS sp_backfill_product_category_slugs$$
CREATE PROCEDURE sp_backfill_product_category_slugs()
BEGIN
  DECLARE v_done TINYINT DEFAULT 0;
  DECLARE v_idBusiness INT;
  DECLARE v_idProductCategory INT;
  DECLARE v_base VARCHAR(180);
  DECLARE v_candidate VARCHAR(180);
  DECLARE v_suffix INT;

  DECLARE category_cursor CURSOR FOR
    SELECT idBusiness, idProductCategory, fn_cajora_public_slug_base(name)
    FROM product_categories
    WHERE slug IS NULL OR TRIM(slug) = ''
    ORDER BY idBusiness ASC, idProductCategory ASC;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  OPEN category_cursor;

  category_loop: LOOP
    FETCH category_cursor INTO v_idBusiness, v_idProductCategory, v_base;

    IF v_done = 1 THEN
      LEAVE category_loop;
    END IF;

    SET v_suffix = 1;
    SET v_candidate = v_base;

    WHILE EXISTS (
      SELECT 1
      FROM product_categories
      WHERE idBusiness = v_idBusiness
        AND slug = v_candidate
        AND idProductCategory <> v_idProductCategory
    ) DO
      SET v_suffix = v_suffix + 1;
      SET v_candidate = CONCAT(LEFT(v_base, 180 - CHAR_LENGTH(CONCAT('-', v_suffix))), '-', v_suffix);
    END WHILE;

    UPDATE product_categories
    SET slug = v_candidate
    WHERE idBusiness = v_idBusiness
      AND idProductCategory = v_idProductCategory;
  END LOOP;

  CLOSE category_cursor;
END$$

DROP PROCEDURE IF EXISTS sp_backfill_product_slugs$$
CREATE PROCEDURE sp_backfill_product_slugs()
BEGIN
  DECLARE v_done TINYINT DEFAULT 0;
  DECLARE v_idBusiness INT;
  DECLARE v_idProduct INT;
  DECLARE v_base VARCHAR(180);
  DECLARE v_candidate VARCHAR(180);
  DECLARE v_suffix INT;

  DECLARE product_cursor CURSOR FOR
    SELECT idBusiness, idProduct, fn_cajora_public_slug_base(name)
    FROM products
    WHERE slug IS NULL OR TRIM(slug) = ''
    ORDER BY idBusiness ASC, idProduct ASC;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  OPEN product_cursor;

  product_loop: LOOP
    FETCH product_cursor INTO v_idBusiness, v_idProduct, v_base;

    IF v_done = 1 THEN
      LEAVE product_loop;
    END IF;

    SET v_suffix = 1;
    SET v_candidate = v_base;

    WHILE EXISTS (
      SELECT 1
      FROM products
      WHERE idBusiness = v_idBusiness
        AND slug = v_candidate
        AND idProduct <> v_idProduct
    ) DO
      SET v_suffix = v_suffix + 1;
      SET v_candidate = CONCAT(LEFT(v_base, 180 - CHAR_LENGTH(CONCAT('-', v_suffix))), '-', v_suffix);
    END WHILE;

    UPDATE products
    SET slug = v_candidate,
        sale_mode = COALESCE(sale_mode, 'STOCK'),
        availability_note = availability_note
    WHERE idBusiness = v_idBusiness
      AND idProduct = v_idProduct;
  END LOOP;

  CLOSE product_cursor;
END$$

DELIMITER ;

CALL sp_backfill_product_category_slugs();
CALL sp_backfill_product_slugs();

ALTER TABLE `product_categories`
  MODIFY COLUMN `slug` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `products`
  MODIFY COLUMN `slug` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `product_categories`
  ADD UNIQUE KEY `uk_category_business_slug` (`idBusiness`, `slug`);

ALTER TABLE `products`
  ADD UNIQUE KEY `uk_product_business_slug` (`idBusiness`, `slug`);

DROP PROCEDURE IF EXISTS sp_backfill_product_category_slugs;
DROP PROCEDURE IF EXISTS sp_backfill_product_slugs;
DROP FUNCTION IF EXISTS fn_cajora_public_slug_base;

/*
  After this script, refresh procedure definitions from:
  - server/src/db/procedures/product-categories.sql
  - server/src/db/procedures/products.sql
  - server/src/db/procedures/storefront_catalog.sql
*/
