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
  IN p_name VARCHAR(160),
  IN p_slug VARCHAR(180),
  IN p_logo_url VARCHAR(500),
  IN p_update_logo_url TINYINT,
  IN p_business_type VARCHAR(100)
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
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND is_active = 1;

  SELECT
    idBusiness,
    name,
    slug,
    logo_url,
    business_type,
    is_active,
    created_at,
    updated_at
  FROM businesses
  WHERE idBusiness = p_idBusiness
    AND is_active = 1
  LIMIT 1;
END$$

DELIMITER ;
