DROP PROCEDURE IF EXISTS sp_storefront_get_catalog;
DELIMITER $$

CREATE PROCEDURE sp_storefront_get_catalog(
  IN p_business_slug VARCHAR(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT
    b.name,
    b.slug,
    b.logo_url,
    b.business_type
  FROM businesses b
  WHERE b.slug = p_business_slug
    AND b.is_active = 1
    AND b.status = 'ACTIVE'
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_storefront_get_categories;
DELIMITER $$

CREATE PROCEDURE sp_storefront_get_categories(
  IN p_business_slug VARCHAR(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT
    pc.idProductCategory,
    pc.name,
    pc.slug
  FROM businesses b
  INNER JOIN product_categories pc
    ON pc.idBusiness = b.idBusiness
  WHERE b.slug = p_business_slug
    AND b.is_active = 1
    AND b.status = 'ACTIVE'
    AND pc.is_active = 1
  ORDER BY pc.name ASC, pc.idProductCategory ASC;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_storefront_get_products;
DELIMITER $$

CREATE PROCEDURE sp_storefront_get_products(
  IN p_business_slug VARCHAR(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_limit INT,
  IN p_offset INT,
  IN p_search VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_category_slug VARCHAR(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT
    p.idProduct,
    p.name,
    p.slug,
    p.description,
    p.price_sale,
    p.image_url,
    p.sale_mode,
    p.availability_note,
    (
      SELECT pi.image_url
      FROM product_images pi
      WHERE pi.idBusiness = b.idBusiness
        AND pi.idProduct = p.idProduct
        AND (
          p.image_url IS NULL
          OR pi.image_url <> p.image_url
        )
      ORDER BY pi.sort_order ASC, pi.idProductImage ASC
      LIMIT 1
    ) AS secondary_image_url,
    pc.idProductCategory,
    pc.slug AS product_category_slug,
    pc.name AS product_category_name,
    COALESCE(default_stock.stock_available, 0) AS stock_available
  FROM businesses b
  INNER JOIN products p
    ON p.idBusiness = b.idBusiness
  INNER JOIN product_categories pc
    ON pc.idBusiness = b.idBusiness
    AND pc.idProductCategory = p.idProductCategory
  LEFT JOIN (
    SELECT
      s.idBusiness,
      s.idProduct,
      COALESCE(SUM(
        CASE
          WHEN s.quantity > 0 THEN s.quantity
          ELSE 0
        END
      ), 0) AS stock_available
    FROM stock s
    INNER JOIN deposits d
      ON d.idBusiness = s.idBusiness
      AND d.idDeposit = s.idDeposit
      AND d.is_default = 1
      AND d.is_active = 1
    GROUP BY s.idBusiness, s.idProduct
  ) default_stock
    ON default_stock.idBusiness = b.idBusiness
    AND default_stock.idProduct = p.idProduct
  WHERE b.slug = p_business_slug
    AND b.is_active = 1
    AND b.status = 'ACTIVE'
    AND p.is_active = 1
    AND pc.is_active = 1
    AND (
      p_search IS NULL
      OR p_search = ''
      OR p.name LIKE CONCAT('%', p_search, '%')
      OR p.description LIKE CONCAT('%', p_search, '%')
    )
    AND (
      p_category_slug IS NULL
      OR p_category_slug = ''
      OR pc.slug = p_category_slug
    )
  ORDER BY p.name ASC, p.idProduct ASC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(DISTINCT p.idProduct) AS totalRecords
  FROM businesses b
  INNER JOIN products p
    ON p.idBusiness = b.idBusiness
  INNER JOIN product_categories pc
    ON pc.idBusiness = b.idBusiness
    AND pc.idProductCategory = p.idProductCategory
  WHERE b.slug = p_business_slug
    AND b.is_active = 1
    AND b.status = 'ACTIVE'
    AND p.is_active = 1
    AND pc.is_active = 1
    AND (
      p_search IS NULL
      OR p_search = ''
      OR p.name LIKE CONCAT('%', p_search, '%')
      OR p.description LIKE CONCAT('%', p_search, '%')
    )
    AND (
      p_category_slug IS NULL
      OR p_category_slug = ''
      OR pc.slug = p_category_slug
    );
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_storefront_get_product_by_id;
DROP PROCEDURE IF EXISTS sp_storefront_get_product_by_slug;
DELIMITER $$

CREATE PROCEDURE sp_storefront_get_product_by_slug(
  IN p_business_slug VARCHAR(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_product_slug VARCHAR(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT
    p.idProduct,
    p.name,
    p.slug,
    p.description,
    p.rich_content,
    p.price_sale,
    p.image_url,
    p.sale_mode,
    p.availability_note,
    pc.idProductCategory,
    pc.slug AS product_category_slug,
    pc.name AS product_category_name,
    COALESCE(default_stock.stock_available, 0) AS stock_available
  FROM businesses b
  INNER JOIN products p
    ON p.idBusiness = b.idBusiness
  INNER JOIN product_categories pc
    ON pc.idBusiness = b.idBusiness
    AND pc.idProductCategory = p.idProductCategory
  LEFT JOIN (
    SELECT
      s.idBusiness,
      s.idProduct,
      COALESCE(SUM(
        CASE
          WHEN s.quantity > 0 THEN s.quantity
          ELSE 0
        END
      ), 0) AS stock_available
    FROM stock s
    INNER JOIN deposits d
      ON d.idBusiness = s.idBusiness
      AND d.idDeposit = s.idDeposit
      AND d.is_default = 1
      AND d.is_active = 1
    GROUP BY s.idBusiness, s.idProduct
  ) default_stock
    ON default_stock.idBusiness = b.idBusiness
    AND default_stock.idProduct = p.idProduct
  WHERE b.slug = p_business_slug
    AND b.is_active = 1
    AND b.status = 'ACTIVE'
    AND p.slug = p_product_slug
    AND p.is_active = 1
    AND pc.is_active = 1
  LIMIT 1;

  SELECT
    pi.image_url,
    pi.alt_text,
    pi.sort_order
  FROM businesses b
  INNER JOIN products p
    ON p.idBusiness = b.idBusiness
  INNER JOIN product_categories pc
    ON pc.idBusiness = b.idBusiness
    AND pc.idProductCategory = p.idProductCategory
  INNER JOIN product_images pi
    ON pi.idBusiness = b.idBusiness
    AND pi.idProduct = p.idProduct
  WHERE b.slug = p_business_slug
    AND b.is_active = 1
    AND b.status = 'ACTIVE'
    AND p.slug = p_product_slug
    AND p.is_active = 1
    AND pc.is_active = 1
  ORDER BY pi.sort_order ASC, pi.idProductImage ASC;
END$$

DELIMITER ;
