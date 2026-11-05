DROP PROCEDURE IF EXISTS sp_get_business_by_id;
DELIMITER $$

CREATE PROCEDURE sp_get_business_by_id(
  IN p_idBusiness INT
)
BEGIN
  SELECT
    idBusiness,
    name,
    slug,
    logo_url,
    business_type,
    wholesale_enabled,
    wholesale_minimum_amount,
    status,
    is_active,
    created_at,
    updated_at
  FROM businesses
  WHERE idBusiness = p_idBusiness
    AND is_active = 1
  LIMIT 1;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_update_business;
DELIMITER $$

CREATE PROCEDURE sp_update_business(
  IN p_idBusiness INT,
  IN p_name VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_slug VARCHAR(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_logo_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_update_logo_url TINYINT,
  IN p_business_type VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_wholesale_enabled TINYINT,
  IN p_wholesale_minimum_amount DECIMAL(18,2)
)
BEGIN
  UPDATE businesses
  SET
    name = COALESCE(p_name, name),
    slug = COALESCE(p_slug, slug),
    logo_url = CASE
      WHEN p_update_logo_url = 1 THEN p_logo_url
      ELSE logo_url
    END,
    business_type = COALESCE(p_business_type, business_type),
    wholesale_enabled = COALESCE(p_wholesale_enabled, wholesale_enabled),
    wholesale_minimum_amount = CASE WHEN p_wholesale_enabled IS NULL THEN wholesale_minimum_amount ELSE p_wholesale_minimum_amount END,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND is_active = 1;

  SELECT
    idBusiness,
    name,
    slug,
    logo_url,
    business_type,
    wholesale_enabled,
    wholesale_minimum_amount,
    status,
    is_active,
    created_at,
    updated_at
  FROM businesses
  WHERE idBusiness = p_idBusiness
    AND is_active = 1
  LIMIT 1;
END$$

DELIMITER ;
