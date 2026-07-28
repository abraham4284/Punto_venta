DROP PROCEDURE IF EXISTS sp_business_user_list;
DELIMITER $$

CREATE PROCEDURE sp_business_user_list(
  IN p_idBusiness INT,
  IN p_search VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_role VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
    u.idUser,
    u.name,
    u.username,
    u.email,
    bu.role,
    u.is_active AS userIsActive,
    bu.is_active AS membershipIsActive,
    CASE WHEN u.is_active = 1 AND bu.is_active = 1 THEN 1 ELSE 0 END AS effectiveIsActive,
    u.must_change_password AS mustChangePassword,
    u.created_at AS createdAt,
    u.updated_at AS updatedAt,
    CASE WHEN COUNT(bup.idBusinessUserPermission) > 0 THEN 1 ELSE 0 END AS customizedPermissions
  FROM business_users bu
  INNER JOIN users u ON u.idUser = bu.idUser
  LEFT JOIN business_user_permissions bup
    ON bup.idBusiness = bu.idBusiness
    AND bup.idUser = bu.idUser
  WHERE bu.idBusiness = p_idBusiness
    AND (
      p_search IS NULL
      OR u.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR u.username COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR u.email COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
    )
    AND (p_role IS NULL OR bu.role COLLATE utf8mb4_unicode_ci = p_role)
    AND (
      p_status IS NULL
      OR (p_status COLLATE utf8mb4_unicode_ci = 'ACTIVE' AND u.is_active = 1 AND bu.is_active = 1)
      OR (p_status COLLATE utf8mb4_unicode_ci = 'INACTIVE' AND (u.is_active = 0 OR bu.is_active = 0))
    )
  GROUP BY
    u.idUser,
    u.name,
    u.username,
    u.email,
    bu.role,
    u.is_active,
    bu.is_active,
    u.must_change_password,
    u.created_at,
    u.updated_at
  ORDER BY u.created_at DESC, u.idUser DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM business_users bu
  INNER JOIN users u ON u.idUser = bu.idUser
  WHERE bu.idBusiness = p_idBusiness
    AND (
      p_search IS NULL
      OR u.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR u.username COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      OR u.email COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
    )
    AND (p_role IS NULL OR bu.role COLLATE utf8mb4_unicode_ci = p_role)
    AND (
      p_status IS NULL
      OR (p_status COLLATE utf8mb4_unicode_ci = 'ACTIVE' AND u.is_active = 1 AND bu.is_active = 1)
      OR (p_status COLLATE utf8mb4_unicode_ci = 'INACTIVE' AND (u.is_active = 0 OR bu.is_active = 0))
    );
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_user_get_by_id;
DELIMITER $$

CREATE PROCEDURE sp_business_user_get_by_id(
  IN p_idBusiness INT,
  IN p_idUser INT
)
BEGIN
  SELECT
    u.idUser,
    u.name,
    u.username,
    u.email,
    bu.role,
    u.is_active AS userIsActive,
    bu.is_active AS membershipIsActive,
    CASE WHEN u.is_active = 1 AND bu.is_active = 1 THEN 1 ELSE 0 END AS effectiveIsActive,
    u.must_change_password AS mustChangePassword,
    u.created_at AS createdAt,
    u.updated_at AS updatedAt,
    CASE WHEN COUNT(bup.idBusinessUserPermission) > 0 THEN 1 ELSE 0 END AS customizedPermissions
  FROM business_users bu
  INNER JOIN users u ON u.idUser = bu.idUser
  LEFT JOIN business_user_permissions bup
    ON bup.idBusiness = bu.idBusiness
    AND bup.idUser = bu.idUser
  WHERE bu.idBusiness = p_idBusiness
    AND bu.idUser = p_idUser
  GROUP BY
    u.idUser,
    u.name,
    u.username,
    u.email,
    bu.role,
    u.is_active,
    bu.is_active,
    u.must_change_password,
    u.created_at,
    u.updated_at
  LIMIT 1;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_user_create;
DELIMITER $$

CREATE PROCEDURE sp_business_user_create(
  IN p_idBusiness INT,
  IN p_name VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_username VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_email VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_passwordHash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_role VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_permissions JSON,
  IN p_createdByUserId INT
)
BEGIN
  DECLARE v_idUser INT;
  DECLARE v_permissionsCount INT DEFAULT 0;
  DECLARE v_validPermissionsCount INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_role COLLATE utf8mb4_unicode_ci NOT IN ('ADMIN','SELLER') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_BUSINESS_ROLE';
  END IF;

  START TRANSACTION;

  INSERT INTO users (
    name,
    username,
    email,
    password_hash,
    must_change_password
  )
  VALUES (
    p_name,
    p_username,
    NULLIF(p_email, ''),
    p_passwordHash,
    1
  );

  SET v_idUser = LAST_INSERT_ID();

  INSERT INTO business_users (
    idBusiness,
    idUser,
    role,
    is_active
  )
  VALUES (
    p_idBusiness,
    v_idUser,
    p_role,
    1
  );

  IF p_permissions IS NOT NULL AND JSON_LENGTH(p_permissions) > 0 THEN
    SELECT COUNT(*) INTO v_permissionsCount
    FROM JSON_TABLE(
      p_permissions,
      '$[*]' COLUMNS (
        code VARCHAR(100) PATH '$.code',
        effect VARCHAR(10) PATH '$.effect'
      )
    ) jt;

    SELECT COUNT(*) INTO v_validPermissionsCount
    FROM JSON_TABLE(
      p_permissions,
      '$[*]' COLUMNS (
        code VARCHAR(100) PATH '$.code',
        effect VARCHAR(10) PATH '$.effect'
      )
    ) jt
    INNER JOIN permissions p
      ON p.code COLLATE utf8mb4_unicode_ci = jt.code COLLATE utf8mb4_unicode_ci
      AND p.is_active = 1
    WHERE jt.effect COLLATE utf8mb4_unicode_ci IN ('ALLOW','DENY');

    IF v_permissionsCount <> v_validPermissionsCount THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_PERMISSION_CODE';
    END IF;

    INSERT INTO business_user_permissions (
      idBusiness,
      idUser,
      idPermission,
      effect,
      created_by_user_id
    )
    SELECT
      p_idBusiness,
      v_idUser,
      p.idPermission,
      jt.effect,
      p_createdByUserId
    FROM JSON_TABLE(
      p_permissions,
      '$[*]' COLUMNS (
        code VARCHAR(100) PATH '$.code',
        effect VARCHAR(10) PATH '$.effect'
      )
    ) jt
    INNER JOIN permissions p
      ON p.code COLLATE utf8mb4_unicode_ci = jt.code COLLATE utf8mb4_unicode_ci
      AND p.is_active = 1;
  END IF;

  COMMIT;

  CALL sp_business_user_get_by_id(p_idBusiness, v_idUser);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_user_update;
DELIMITER $$

CREATE PROCEDURE sp_business_user_update(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_name VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_username VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_email VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  UPDATE users u
  INNER JOIN business_users bu
    ON bu.idUser = u.idUser
    AND bu.idBusiness = p_idBusiness
  SET
    u.name = p_name,
    u.username = p_username,
    u.email = NULLIF(p_email, ''),
    u.updated_at = NOW()
  WHERE u.idUser = p_idUser
    AND bu.role COLLATE utf8mb4_unicode_ci <> 'OWNER';

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'BUSINESS_USER_NOT_FOUND';
  END IF;

  CALL sp_business_user_get_by_id(p_idBusiness, p_idUser);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_user_change_role;
DELIMITER $$

CREATE PROCEDURE sp_business_user_change_role(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_role VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  IF p_role COLLATE utf8mb4_unicode_ci NOT IN ('ADMIN','SELLER') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_BUSINESS_ROLE';
  END IF;

  UPDATE business_users
  SET role = p_role
  WHERE idBusiness = p_idBusiness
    AND idUser = p_idUser
    AND role COLLATE utf8mb4_unicode_ci <> 'OWNER';

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CANNOT_MODIFY_OWNER';
  END IF;

  CALL sp_business_user_get_by_id(p_idBusiness, p_idUser);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_user_change_status;
DELIMITER $$

CREATE PROCEDURE sp_business_user_change_status(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_actorUserId INT,
  IN p_isActive TINYINT
)
BEGIN
  DECLARE v_role VARCHAR(30);
  DECLARE v_ownerCount INT DEFAULT 0;

  SELECT role INTO v_role
  FROM business_users
  WHERE idBusiness = p_idBusiness
    AND idUser = p_idUser
  LIMIT 1;

  IF v_role IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'BUSINESS_USER_NOT_FOUND';
  END IF;

  IF p_isActive = 0 AND p_idUser = p_actorUserId THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CANNOT_DEACTIVATE_SELF';
  END IF;

  IF p_isActive = 0 AND v_role COLLATE utf8mb4_unicode_ci = 'OWNER' THEN
    SELECT COUNT(*) INTO v_ownerCount
    FROM business_users bu
    INNER JOIN users u ON u.idUser = bu.idUser
    WHERE bu.idBusiness = p_idBusiness
      AND bu.role COLLATE utf8mb4_unicode_ci = 'OWNER'
      AND bu.is_active = 1
      AND u.is_active = 1;

    IF v_ownerCount <= 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CANNOT_DEACTIVATE_LAST_OWNER';
    END IF;
  END IF;

  START TRANSACTION;

  UPDATE business_users
  SET is_active = p_isActive
  WHERE idBusiness = p_idBusiness
    AND idUser = p_idUser;

  IF p_isActive = 0 THEN
    UPDATE user_sessions
    SET revoked_at = NOW()
    WHERE idBusiness = p_idBusiness
      AND idUser = p_idUser
      AND revoked_at IS NULL;
  END IF;

  COMMIT;

  CALL sp_business_user_get_by_id(p_idBusiness, p_idUser);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_permission_catalog;
DELIMITER $$

CREATE PROCEDURE sp_permission_catalog()
BEGIN
  SELECT
    idPermission,
    code,
    module,
    action,
    name,
    description,
    is_active AS isActive
  FROM permissions
  WHERE is_active = 1
  ORDER BY module ASC, action ASC, code ASC;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_user_role_permissions;
DELIMITER $$

CREATE PROCEDURE sp_business_user_role_permissions(
  IN p_role VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  IF p_role COLLATE utf8mb4_unicode_ci = 'OWNER' THEN
    SELECT code
    FROM permissions
    WHERE is_active = 1
    ORDER BY code ASC;
  ELSE
    SELECT p.code
    FROM role_permissions rp
    INNER JOIN permissions p ON p.idPermission = rp.idPermission
    WHERE rp.role COLLATE utf8mb4_unicode_ci = p_role
      AND p.is_active = 1
    ORDER BY p.code ASC;
  END IF;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_user_permission_overrides;
DELIMITER $$

CREATE PROCEDURE sp_business_user_permission_overrides(
  IN p_idBusiness INT,
  IN p_idUser INT
)
BEGIN
  SELECT
    p.code,
    p.module,
    p.action,
    p.name,
    bup.effect
  FROM business_user_permissions bup
  INNER JOIN permissions p ON p.idPermission = bup.idPermission
  INNER JOIN business_users bu
    ON bu.idBusiness = bup.idBusiness
    AND bu.idUser = bup.idUser
  WHERE bup.idBusiness = p_idBusiness
    AND bup.idUser = p_idUser
    AND p.is_active = 1
  ORDER BY p.module ASC, p.action ASC, p.code ASC;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_user_set_permission_overrides;
DELIMITER $$

CREATE PROCEDURE sp_business_user_set_permission_overrides(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_permissions JSON,
  IN p_actorUserId INT
)
BEGIN
  DECLARE v_role VARCHAR(30);
  DECLARE v_permissionsCount INT DEFAULT 0;
  DECLARE v_validPermissionsCount INT DEFAULT 0;

  SELECT role INTO v_role
  FROM business_users
  WHERE idBusiness = p_idBusiness
    AND idUser = p_idUser
  LIMIT 1;

  IF v_role IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'BUSINESS_USER_NOT_FOUND';
  END IF;

  IF v_role COLLATE utf8mb4_unicode_ci = 'OWNER' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CANNOT_MODIFY_OWNER';
  END IF;

  IF p_permissions IS NOT NULL AND JSON_LENGTH(p_permissions) > 0 THEN
    SELECT COUNT(*) INTO v_permissionsCount
    FROM JSON_TABLE(
      p_permissions,
      '$[*]' COLUMNS (
        code VARCHAR(100) PATH '$.code',
        effect VARCHAR(10) PATH '$.effect'
      )
    ) jt;

    SELECT COUNT(*) INTO v_validPermissionsCount
    FROM JSON_TABLE(
      p_permissions,
      '$[*]' COLUMNS (
        code VARCHAR(100) PATH '$.code',
        effect VARCHAR(10) PATH '$.effect'
      )
    ) jt
    INNER JOIN permissions p
      ON p.code COLLATE utf8mb4_unicode_ci = jt.code COLLATE utf8mb4_unicode_ci
      AND p.is_active = 1
    WHERE jt.effect COLLATE utf8mb4_unicode_ci IN ('ALLOW','DENY');

    IF v_permissionsCount <> v_validPermissionsCount THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_PERMISSION_CODE';
    END IF;
  END IF;

  START TRANSACTION;

  DELETE FROM business_user_permissions
  WHERE idBusiness = p_idBusiness
    AND idUser = p_idUser;

  IF p_permissions IS NOT NULL AND JSON_LENGTH(p_permissions) > 0 THEN
    INSERT INTO business_user_permissions (
      idBusiness,
      idUser,
      idPermission,
      effect,
      created_by_user_id
    )
    SELECT
      p_idBusiness,
      p_idUser,
      p.idPermission,
      jt.effect,
      p_actorUserId
    FROM JSON_TABLE(
      p_permissions,
      '$[*]' COLUMNS (
        code VARCHAR(100) PATH '$.code',
        effect VARCHAR(10) PATH '$.effect'
      )
    ) jt
    INNER JOIN permissions p
      ON p.code COLLATE utf8mb4_unicode_ci = jt.code COLLATE utf8mb4_unicode_ci
      AND p.is_active = 1;
  END IF;

  COMMIT;

  CALL sp_business_user_permission_overrides(p_idBusiness, p_idUser);
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_user_reset_permission_overrides;
DELIMITER $$

CREATE PROCEDURE sp_business_user_reset_permission_overrides(
  IN p_idBusiness INT,
  IN p_idUser INT
)
BEGIN
  DECLARE v_role VARCHAR(30);

  SELECT role INTO v_role
  FROM business_users
  WHERE idBusiness = p_idBusiness
    AND idUser = p_idUser
  LIMIT 1;

  IF v_role IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'BUSINESS_USER_NOT_FOUND';
  END IF;

  IF v_role COLLATE utf8mb4_unicode_ci = 'OWNER' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CANNOT_MODIFY_OWNER';
  END IF;

  DELETE FROM business_user_permissions
  WHERE idBusiness = p_idBusiness
    AND idUser = p_idUser;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_business_user_effective_permissions;
DELIMITER $$

CREATE PROCEDURE sp_business_user_effective_permissions(
  IN p_idBusiness INT,
  IN p_idUser INT
)
BEGIN
  DECLARE v_role VARCHAR(30);

  SELECT bu.role INTO v_role
  FROM business_users bu
  INNER JOIN users u ON u.idUser = bu.idUser
  WHERE bu.idBusiness = p_idBusiness
    AND bu.idUser = p_idUser
    AND bu.is_active = 1
    AND u.is_active = 1
  LIMIT 1;

  IF v_role IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'BUSINESS_USER_NOT_FOUND';
  END IF;

  IF v_role COLLATE utf8mb4_unicode_ci = 'OWNER' THEN
    SELECT code
    FROM permissions
    WHERE is_active = 1
    ORDER BY code ASC;
  ELSE
    SELECT DISTINCT effective.code
    FROM (
      SELECT p.code
      FROM role_permissions rp
      INNER JOIN permissions p ON p.idPermission = rp.idPermission
      LEFT JOIN business_user_permissions denyOverride
        ON denyOverride.idBusiness = p_idBusiness
        AND denyOverride.idUser = p_idUser
        AND denyOverride.idPermission = p.idPermission
        AND denyOverride.effect COLLATE utf8mb4_unicode_ci = 'DENY'
      WHERE rp.role COLLATE utf8mb4_unicode_ci = v_role COLLATE utf8mb4_unicode_ci
        AND p.is_active = 1
        AND denyOverride.idBusinessUserPermission IS NULL

      UNION

      SELECT p.code
      FROM business_user_permissions allowOverride
      INNER JOIN permissions p ON p.idPermission = allowOverride.idPermission
      WHERE allowOverride.idBusiness = p_idBusiness
        AND allowOverride.idUser = p_idUser
        AND allowOverride.effect COLLATE utf8mb4_unicode_ci = 'ALLOW'
        AND p.is_active = 1
    ) effective
    ORDER BY effective.code ASC;
  END IF;
END$$

DELIMITER ;
