USE `punto_venta_dev_clean_2`;

DROP PROCEDURE IF EXISTS sp_platform_business_list;
DROP PROCEDURE IF EXISTS sp_platform_business_get_by_id;
DROP PROCEDURE IF EXISTS sp_platform_business_users;
DROP PROCEDURE IF EXISTS sp_platform_business_activity;
DROP PROCEDURE IF EXISTS sp_platform_business_usage;
DROP PROCEDURE IF EXISTS sp_platform_business_recent_sales;
DROP PROCEDURE IF EXISTS sp_platform_business_recent_purchases;
DROP PROCEDURE IF EXISTS sp_platform_business_change_status;

DELIMITER $$

CREATE PROCEDURE sp_platform_business_list(
  IN p_search VARCHAR(150),
  IN p_businessStatus VARCHAR(30),
  IN p_subscriptionStatus VARCHAR(30),
  IN p_planId INT,
  IN p_businessType VARCHAR(100),
  IN p_activityStatus VARCHAR(40),
  IN p_createdFrom DATETIME,
  IN p_createdTo DATETIME,
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
    b.idBusiness,
    b.name,
    b.slug,
    b.logo_url AS logoUrl,
    b.business_type AS businessType,
    b.is_active AS isActive,
    b.status AS businessStatus,
    ownerUser.idUser AS ownerIdUser,
    ownerUser.name AS ownerName,
    ownerUser.username AS ownerUsername,
    ownerUser.email AS ownerEmail,
    bs.idBusinessSubscription,
    sp.name AS planName,
    sp.code AS planCode,
    bs.status AS subscriptionStatus,
    bs.starts_at AS startDate,
    COALESCE(bs.current_period_end, bs.trial_ends_at) AS endDate,
    COALESCE(usageData.activeUsers, 0) AS activeUsers,
    COALESCE(usageData.products, 0) AS products,
    COALESCE(usageData.deposits, 0) AS deposits,
    activityData.lastLoginAt,
    activityData.lastSaleAt,
    activityData.lastPurchaseAt,
    CASE
      WHEN activityData.lastAnyActivityAt IS NULL OR activityData.lastAnyActivityAt = '1000-01-01' THEN 'NEVER_ACTIVATED'
      WHEN activityData.lastAnyActivityAt >= CURDATE() THEN 'ACTIVE_TODAY'
      WHEN activityData.lastAnyActivityAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'ACTIVE_7_DAYS'
      WHEN activityData.lastAnyActivityAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'ACTIVE_30_DAYS'
      ELSE 'INACTIVE_30_DAYS'
    END AS activityStatus,
    b.created_at AS createdAt
  FROM businesses b
  LEFT JOIN business_users ownerLink
    ON ownerLink.idBusiness = b.idBusiness AND ownerLink.role = 'OWNER'
  LEFT JOIN users ownerUser ON ownerUser.idUser = ownerLink.idUser
  LEFT JOIN business_subscriptions bs
    ON bs.idBusiness = b.idBusiness
    AND bs.idBusinessSubscription = (
      SELECT bs2.idBusinessSubscription
      FROM business_subscriptions bs2
      WHERE bs2.idBusiness = b.idBusiness
      ORDER BY bs2.created_at DESC, bs2.idBusinessSubscription DESC
      LIMIT 1
    )
  LEFT JOIN subscription_plans sp ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
  LEFT JOIN (
    SELECT
      b1.idBusiness,
      (SELECT COUNT(*) FROM business_users bu INNER JOIN users u ON u.idUser = bu.idUser WHERE bu.idBusiness = b1.idBusiness AND bu.is_active = 1 AND u.is_active = 1) AS activeUsers,
      (SELECT COUNT(*) FROM products p WHERE p.idBusiness = b1.idBusiness AND p.is_active = 1) AS products,
      (SELECT COUNT(*) FROM deposits d WHERE d.idBusiness = b1.idBusiness AND d.is_active = 1) AS deposits
    FROM businesses b1
  ) usageData ON usageData.idBusiness = b.idBusiness
  LEFT JOIN (
    SELECT
      b2.idBusiness,
      (SELECT MAX(us.last_used_at) FROM user_sessions us WHERE us.idBusiness = b2.idBusiness AND us.auth_context = 'BUSINESS') AS lastLoginAt,
      (SELECT MAX(s.sale_date) FROM sales s WHERE s.idBusiness = b2.idBusiness) AS lastSaleAt,
      (SELECT MAX(p.purchase_date) FROM purchases p WHERE p.idBusiness = b2.idBusiness) AS lastPurchaseAt,
      GREATEST(
        COALESCE((SELECT MAX(us.last_used_at) FROM user_sessions us WHERE us.idBusiness = b2.idBusiness AND us.auth_context = 'BUSINESS'), '1000-01-01'),
        COALESCE((SELECT MAX(s.sale_date) FROM sales s WHERE s.idBusiness = b2.idBusiness), '1000-01-01'),
        COALESCE((SELECT MAX(p.purchase_date) FROM purchases p WHERE p.idBusiness = b2.idBusiness), '1000-01-01'),
        COALESCE((SELECT MAX(sm.created_at) FROM stock_movements sm WHERE sm.idBusiness = b2.idBusiness), '1000-01-01')
      ) AS lastAnyActivityAt
    FROM businesses b2
  ) activityData ON activityData.idBusiness = b.idBusiness
  WHERE (p_search IS NULL OR p_search = '' OR b.name LIKE CONCAT('%', p_search, '%') OR b.slug LIKE CONCAT('%', p_search, '%') OR ownerUser.email LIKE CONCAT('%', p_search, '%'))
    AND (p_businessStatus IS NULL OR p_businessStatus = '' OR b.status = p_businessStatus)
    AND (p_subscriptionStatus IS NULL OR p_subscriptionStatus = '' OR bs.status = p_subscriptionStatus)
    AND (p_planId IS NULL OR bs.idSubscriptionPlan = p_planId)
    AND (p_businessType IS NULL OR p_businessType = '' OR b.business_type = p_businessType)
    AND (p_createdFrom IS NULL OR b.created_at >= p_createdFrom)
    AND (p_createdTo IS NULL OR b.created_at <= p_createdTo)
    AND (
      p_activityStatus IS NULL OR p_activityStatus = '' OR
      CASE
        WHEN activityData.lastAnyActivityAt IS NULL OR activityData.lastAnyActivityAt = '1000-01-01' THEN 'NEVER_ACTIVATED'
        WHEN activityData.lastAnyActivityAt >= CURDATE() THEN 'ACTIVE_TODAY'
        WHEN activityData.lastAnyActivityAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'ACTIVE_7_DAYS'
        WHEN activityData.lastAnyActivityAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'ACTIVE_30_DAYS'
        ELSE 'INACTIVE_30_DAYS'
      END = p_activityStatus
    )
  ORDER BY b.created_at DESC, b.idBusiness DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT COUNT(*) AS totalRecords
  FROM businesses b
  LEFT JOIN business_users ownerLink
    ON ownerLink.idBusiness = b.idBusiness AND ownerLink.role = 'OWNER'
  LEFT JOIN users ownerUser ON ownerUser.idUser = ownerLink.idUser
  LEFT JOIN business_subscriptions bs
    ON bs.idBusiness = b.idBusiness
    AND bs.idBusinessSubscription = (
      SELECT bs2.idBusinessSubscription
      FROM business_subscriptions bs2
      WHERE bs2.idBusiness = b.idBusiness
      ORDER BY bs2.created_at DESC, bs2.idBusinessSubscription DESC
      LIMIT 1
    )
  LEFT JOIN (
    SELECT
      b2.idBusiness,
      GREATEST(
        COALESCE((SELECT MAX(us.last_used_at) FROM user_sessions us WHERE us.idBusiness = b2.idBusiness AND us.auth_context = 'BUSINESS'), '1000-01-01'),
        COALESCE((SELECT MAX(s.sale_date) FROM sales s WHERE s.idBusiness = b2.idBusiness), '1000-01-01'),
        COALESCE((SELECT MAX(p.purchase_date) FROM purchases p WHERE p.idBusiness = b2.idBusiness), '1000-01-01'),
        COALESCE((SELECT MAX(sm.created_at) FROM stock_movements sm WHERE sm.idBusiness = b2.idBusiness), '1000-01-01')
      ) AS lastAnyActivityAt
    FROM businesses b2
  ) activityData ON activityData.idBusiness = b.idBusiness
  WHERE (p_search IS NULL OR p_search = '' OR b.name LIKE CONCAT('%', p_search, '%') OR b.slug LIKE CONCAT('%', p_search, '%') OR ownerUser.email LIKE CONCAT('%', p_search, '%'))
    AND (p_businessStatus IS NULL OR p_businessStatus = '' OR b.status = p_businessStatus)
    AND (p_subscriptionStatus IS NULL OR p_subscriptionStatus = '' OR bs.status = p_subscriptionStatus)
    AND (p_planId IS NULL OR bs.idSubscriptionPlan = p_planId)
    AND (p_businessType IS NULL OR p_businessType = '' OR b.business_type = p_businessType)
    AND (p_createdFrom IS NULL OR b.created_at >= p_createdFrom)
    AND (p_createdTo IS NULL OR b.created_at <= p_createdTo)
    AND (
      p_activityStatus IS NULL OR p_activityStatus = '' OR
      CASE
        WHEN activityData.lastAnyActivityAt IS NULL OR activityData.lastAnyActivityAt = '1000-01-01' THEN 'NEVER_ACTIVATED'
        WHEN activityData.lastAnyActivityAt >= CURDATE() THEN 'ACTIVE_TODAY'
        WHEN activityData.lastAnyActivityAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'ACTIVE_7_DAYS'
        WHEN activityData.lastAnyActivityAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'ACTIVE_30_DAYS'
        ELSE 'INACTIVE_30_DAYS'
      END = p_activityStatus
    );
END$$

CREATE PROCEDURE sp_platform_business_get_by_id(IN p_idBusiness INT)
BEGIN
  SELECT
    b.idBusiness,
    b.name,
    b.slug,
    b.logo_url AS logoUrl,
    b.business_type AS businessType,
    b.is_active AS isActive,
    b.status AS businessStatus,
    b.created_at AS createdAt,
    b.updated_at AS updatedAt,
    ownerUser.idUser AS ownerIdUser,
    ownerUser.name AS ownerName,
    ownerUser.username AS ownerUsername,
    ownerUser.email AS ownerEmail,
    bs.idBusinessSubscription,
    bs.status AS subscriptionStatus,
    bs.starts_at AS startsAt,
    bs.trial_ends_at AS trialEndsAt,
    bs.current_period_start AS currentPeriodStart,
    bs.current_period_end AS currentPeriodEnd,
    bs.auto_renew AS autoRenew,
    sp.idSubscriptionPlan,
    sp.name AS planName,
    sp.code AS planCode,
    sp.billing_period AS billingPeriod,
    sp.max_users AS maxUsers,
    sp.max_products AS maxProducts,
    sp.max_deposits AS maxDeposits
  FROM businesses b
  LEFT JOIN business_users ownerLink
    ON ownerLink.idBusiness = b.idBusiness AND ownerLink.role = 'OWNER'
  LEFT JOIN users ownerUser ON ownerUser.idUser = ownerLink.idUser
  LEFT JOIN business_subscriptions bs
    ON bs.idBusiness = b.idBusiness
    AND bs.idBusinessSubscription = (
      SELECT bs2.idBusinessSubscription
      FROM business_subscriptions bs2
      WHERE bs2.idBusiness = b.idBusiness
      ORDER BY bs2.created_at DESC, bs2.idBusinessSubscription DESC
      LIMIT 1
    )
  LEFT JOIN subscription_plans sp ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
  WHERE b.idBusiness = p_idBusiness
  LIMIT 1;

  CALL sp_platform_business_activity(p_idBusiness);
  CALL sp_platform_business_usage(p_idBusiness);
END$$

CREATE PROCEDURE sp_platform_business_users(IN p_idBusiness INT)
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
    bu.created_at AS createdAt,
    (SELECT MAX(us.last_used_at) FROM user_sessions us WHERE us.idUser = u.idUser AND us.idBusiness = p_idBusiness AND us.auth_context = 'BUSINESS') AS lastLoginAt
  FROM business_users bu
  INNER JOIN users u ON u.idUser = bu.idUser
  WHERE bu.idBusiness = p_idBusiness
  ORDER BY bu.created_at DESC, u.name ASC;
END$$

CREATE PROCEDURE sp_platform_business_activity(IN p_idBusiness INT)
BEGIN
  SELECT
    (SELECT MAX(us.last_used_at) FROM user_sessions us WHERE us.idBusiness = p_idBusiness AND us.auth_context = 'BUSINESS') AS lastLoginAt,
    (SELECT MAX(s.sale_date) FROM sales s WHERE s.idBusiness = p_idBusiness) AS lastSaleAt,
    (SELECT MAX(p.purchase_date) FROM purchases p WHERE p.idBusiness = p_idBusiness) AS lastPurchaseAt,
    (SELECT MAX(sm.created_at) FROM stock_movements sm WHERE sm.idBusiness = p_idBusiness) AS lastStockMovementAt,
    (SELECT COUNT(*) FROM sales s WHERE s.idBusiness = p_idBusiness AND s.sale_date >= CURDATE()) AS salesToday,
    (SELECT COUNT(*) FROM sales s WHERE s.idBusiness = p_idBusiness AND s.sale_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS salesLast7Days,
    (SELECT COUNT(*) FROM sales s WHERE s.idBusiness = p_idBusiness AND s.sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS salesLast30Days,
    (SELECT COUNT(*) FROM purchases p WHERE p.idBusiness = p_idBusiness AND p.purchase_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS purchasesLast30Days,
    (SELECT COUNT(*) FROM stock_movements sm WHERE sm.idBusiness = p_idBusiness AND sm.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS stockMovementsLast30Days,
    (SELECT COUNT(DISTINCT us.idUser) FROM user_sessions us WHERE us.idBusiness = p_idBusiness AND us.auth_context = 'BUSINESS' AND us.last_used_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS activeUsersLast30Days,
    CASE
      WHEN GREATEST(
        COALESCE((SELECT MAX(us.last_used_at) FROM user_sessions us WHERE us.idBusiness = p_idBusiness AND us.auth_context = 'BUSINESS'), '1000-01-01'),
        COALESCE((SELECT MAX(s.sale_date) FROM sales s WHERE s.idBusiness = p_idBusiness), '1000-01-01'),
        COALESCE((SELECT MAX(p.purchase_date) FROM purchases p WHERE p.idBusiness = p_idBusiness), '1000-01-01'),
        COALESCE((SELECT MAX(sm.created_at) FROM stock_movements sm WHERE sm.idBusiness = p_idBusiness), '1000-01-01')
      ) = '1000-01-01' THEN 'NEVER_ACTIVATED'
      WHEN GREATEST(
        COALESCE((SELECT MAX(us.last_used_at) FROM user_sessions us WHERE us.idBusiness = p_idBusiness AND us.auth_context = 'BUSINESS'), '1000-01-01'),
        COALESCE((SELECT MAX(s.sale_date) FROM sales s WHERE s.idBusiness = p_idBusiness), '1000-01-01'),
        COALESCE((SELECT MAX(p.purchase_date) FROM purchases p WHERE p.idBusiness = p_idBusiness), '1000-01-01'),
        COALESCE((SELECT MAX(sm.created_at) FROM stock_movements sm WHERE sm.idBusiness = p_idBusiness), '1000-01-01')
      ) >= CURDATE() THEN 'ACTIVE_TODAY'
      WHEN GREATEST(
        COALESCE((SELECT MAX(us.last_used_at) FROM user_sessions us WHERE us.idBusiness = p_idBusiness AND us.auth_context = 'BUSINESS'), '1000-01-01'),
        COALESCE((SELECT MAX(s.sale_date) FROM sales s WHERE s.idBusiness = p_idBusiness), '1000-01-01'),
        COALESCE((SELECT MAX(p.purchase_date) FROM purchases p WHERE p.idBusiness = p_idBusiness), '1000-01-01'),
        COALESCE((SELECT MAX(sm.created_at) FROM stock_movements sm WHERE sm.idBusiness = p_idBusiness), '1000-01-01')
      ) >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'ACTIVE_7_DAYS'
      WHEN GREATEST(
        COALESCE((SELECT MAX(us.last_used_at) FROM user_sessions us WHERE us.idBusiness = p_idBusiness AND us.auth_context = 'BUSINESS'), '1000-01-01'),
        COALESCE((SELECT MAX(s.sale_date) FROM sales s WHERE s.idBusiness = p_idBusiness), '1000-01-01'),
        COALESCE((SELECT MAX(p.purchase_date) FROM purchases p WHERE p.idBusiness = p_idBusiness), '1000-01-01'),
        COALESCE((SELECT MAX(sm.created_at) FROM stock_movements sm WHERE sm.idBusiness = p_idBusiness), '1000-01-01')
      ) >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'ACTIVE_30_DAYS'
      ELSE 'INACTIVE_30_DAYS'
    END AS activityStatus;
END$$

CREATE PROCEDURE sp_platform_business_usage(IN p_idBusiness INT)
BEGIN
  SELECT
    (SELECT COUNT(*) FROM business_users bu INNER JOIN users u ON u.idUser = bu.idUser WHERE bu.idBusiness = p_idBusiness AND bu.is_active = 1 AND u.is_active = 1) AS currentUsers,
    sp.max_users AS maxUsers,
    (SELECT COUNT(*) FROM products p WHERE p.idBusiness = p_idBusiness AND p.is_active = 1) AS currentProducts,
    sp.max_products AS maxProducts,
    (SELECT COUNT(*) FROM deposits d WHERE d.idBusiness = p_idBusiness AND d.is_active = 1) AS currentDeposits,
    sp.max_deposits AS maxDeposits,
    CASE WHEN sp.max_products IS NULL OR sp.max_products >= 1000 THEN 1 ELSE 0 END AS bulkImportEnabled
  FROM businesses b
  LEFT JOIN business_subscriptions bs
    ON bs.idBusiness = b.idBusiness
    AND bs.idBusinessSubscription = (
      SELECT bs2.idBusinessSubscription
      FROM business_subscriptions bs2
      WHERE bs2.idBusiness = b.idBusiness
      ORDER BY bs2.created_at DESC, bs2.idBusinessSubscription DESC
      LIMIT 1
    )
  LEFT JOIN subscription_plans sp ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
  WHERE b.idBusiness = p_idBusiness
  LIMIT 1;
END$$

CREATE PROCEDURE sp_platform_business_recent_sales(IN p_idBusiness INT, IN p_limit INT)
BEGIN
  SELECT
    s.idSale,
    s.sale_number AS saleNumber,
    s.sale_date AS saleDate,
    s.total,
    s.status,
    u.name AS userName,
    COALESCE(c.name, 'Consumidor Final') AS customerName
  FROM sales s
  INNER JOIN users u ON u.idUser = s.idUser
  LEFT JOIN customers c ON c.idBusiness = s.idBusiness AND c.idCustomer = s.idCustomer
  WHERE s.idBusiness = p_idBusiness
  ORDER BY s.sale_date DESC, s.idSale DESC
  LIMIT p_limit;
END$$

CREATE PROCEDURE sp_platform_business_recent_purchases(IN p_idBusiness INT, IN p_limit INT)
BEGIN
  SELECT
    p.idPurchase,
    p.purchase_number AS purchaseNumber,
    p.purchase_date AS purchaseDate,
    p.total,
    p.status,
    u.name AS userName,
    s.name AS supplierName
  FROM purchases p
  INNER JOIN users u ON u.idUser = p.idUser
  LEFT JOIN suppliers s ON s.idBusiness = p.idBusiness AND s.idSupplier = p.idSupplier
  WHERE p.idBusiness = p_idBusiness
  ORDER BY p.purchase_date DESC, p.idPurchase DESC
  LIMIT p_limit;
END$$

CREATE PROCEDURE sp_platform_business_change_status(
  IN p_idBusiness INT,
  IN p_isActive TINYINT
)
BEGIN
  DECLARE v_currentActive TINYINT;

  SELECT is_active INTO v_currentActive
  FROM businesses
  WHERE idBusiness = p_idBusiness
  LIMIT 1;

  IF v_currentActive IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PLATFORM_BUSINESS_NOT_FOUND';
  END IF;

  IF v_currentActive = p_isActive THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PLATFORM_BUSINESS_STATUS_UNCHANGED';
  END IF;

  UPDATE businesses
  SET
    is_active = p_isActive,
    status = CASE WHEN p_isActive = 1 THEN 'ACTIVE' ELSE 'SUSPENDED' END,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness;

  IF p_isActive = 0 THEN
    UPDATE user_sessions
    SET revoked_at = NOW()
    WHERE idBusiness = p_idBusiness
      AND auth_context = 'BUSINESS'
      AND revoked_at IS NULL;
  END IF;

  CALL sp_platform_business_get_by_id(p_idBusiness);
END$$

DELIMITER ;
