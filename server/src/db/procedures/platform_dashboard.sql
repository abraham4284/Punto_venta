USE `punto_venta_dev_clean_2`;

DROP PROCEDURE IF EXISTS sp_platform_dashboard;

DELIMITER $$

CREATE PROCEDURE sp_platform_dashboard()
BEGIN
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN is_active = 1 AND status = 'ACTIVE' THEN 1 ELSE 0 END) AS active,
    SUM(CASE WHEN is_active = 0 OR status IN ('SUSPENDED','CANCELLED') THEN 1 ELSE 0 END) AS inactive,
    SUM(CASE WHEN created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 ELSE 0 END) AS newThisMonth,
    SUM(CASE
      WHEN created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
        AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
      THEN 1 ELSE 0
    END) AS newPreviousMonth
  FROM businesses;

  SELECT
    SUM(CASE WHEN status = 'TRIAL' THEN 1 ELSE 0 END) AS trial,
    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active,
    SUM(CASE WHEN status = 'PAST_DUE' THEN 1 ELSE 0 END) AS pastDue,
    SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) AS suspended,
    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
    SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) AS expired,
    SUM(CASE
      WHEN current_period_end BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        AND status IN ('TRIAL','ACTIVE','PAST_DUE')
      THEN 1 ELSE 0
    END) AS expiringSoon
  FROM business_subscriptions;

  SELECT
    (
      SELECT COALESCE(SUM(amount), 0)
      FROM subscription_payments
      WHERE status = 'APPROVED'
        AND paid_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
    ) AS approvedThisMonth,
    (
      SELECT COALESCE(SUM(amount), 0)
      FROM subscription_payments
      WHERE status = 'APPROVED'
        AND paid_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
        AND paid_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
    ) AS approvedPreviousMonth,
    (
      SELECT COALESCE(SUM(amount), 0)
      FROM subscription_payments
      WHERE status = 'PENDING'
    ) AS pendingAmount,
    (
      SELECT COALESCE(SUM(amount), 0)
      FROM subscription_payments
      WHERE status = 'REJECTED'
    ) AS rejectedAmount,
    (
      SELECT COALESCE(SUM(sp.price), 0)
      FROM business_subscriptions bs
      INNER JOIN subscription_plans sp ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
      WHERE bs.status = 'ACTIVE' AND sp.billing_period = 'MONTHLY'
    ) AS estimatedMrr;

  SELECT
    (SELECT COUNT(*) FROM sales WHERE status = 'COMPLETED' AND DATE(sale_date) = CURDATE()) AS salesToday,
    (SELECT COUNT(*) FROM sales WHERE status = 'COMPLETED' AND sale_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS salesLast7Days,
    (SELECT COUNT(DISTINCT idBusiness) FROM sales WHERE sale_date >= CURDATE()) AS activeBusinessesToday,
    (SELECT COUNT(DISTINCT idBusiness) FROM sales WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS activeBusinessesLast7Days,
    (
      SELECT COUNT(*)
      FROM businesses b
      LEFT JOIN (
        SELECT idBusiness, MAX(lastActivityAt) AS lastActivityAt
        FROM (
          SELECT idBusiness, MAX(sale_date) AS lastActivityAt FROM sales GROUP BY idBusiness
          UNION ALL
          SELECT idBusiness, MAX(purchase_date) AS lastActivityAt FROM purchases GROUP BY idBusiness
          UNION ALL
          SELECT idBusiness, MAX(created_at) AS lastActivityAt FROM stock_movements GROUP BY idBusiness
        ) activity
        GROUP BY idBusiness
      ) ba ON ba.idBusiness = b.idBusiness
      WHERE ba.lastActivityAt IS NULL OR ba.lastActivityAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
    ) AS inactiveBusinesses30Days,
    (SELECT COUNT(*) FROM business_users bu INNER JOIN users u ON u.idUser = bu.idUser WHERE bu.is_active = 1 AND u.is_active = 1) AS totalBusinessUsers,
    (SELECT COUNT(*) FROM products WHERE is_active = 1) AS totalProducts,
    (SELECT COUNT(*) FROM stock st INNER JOIN products p ON p.idBusiness = st.idBusiness AND p.idProduct = st.idProduct WHERE st.quantity <= p.stock_min) AS criticalStockItems;

  SELECT
    DATE_FORMAT(created_at, '%Y-%m') AS period,
    COUNT(*) AS total
  FROM businesses
  WHERE created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 11 MONTH)
  GROUP BY DATE_FORMAT(created_at, '%Y-%m')
  ORDER BY period;

  SELECT
    DATE_FORMAT(COALESCE(paid_at, created_at), '%Y-%m') AS period,
    COALESCE(SUM(amount), 0) AS amount
  FROM subscription_payments
  WHERE status = 'APPROVED'
    AND COALESCE(paid_at, created_at) >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 11 MONTH)
  GROUP BY DATE_FORMAT(COALESCE(paid_at, created_at), '%Y-%m')
  ORDER BY period;

  SELECT status, COUNT(*) AS total
  FROM business_subscriptions
  GROUP BY status
  ORDER BY status;

  SELECT
    'EXPIRING_SOON' AS type,
    'WARNING' AS severity,
    'Suscripciones por vencer' AS title,
    'Suscripciones con vencimiento dentro de los proximos 7 dias.' AS description,
    COUNT(*) AS total,
    '/platform/subscriptions?section=subscriptions' AS targetUrl
  FROM business_subscriptions
  WHERE current_period_end BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
    AND status IN ('TRIAL','ACTIVE','PAST_DUE')
  UNION ALL
  SELECT
    'PENDING_PAYMENTS',
    'INFO',
    'Pagos pendientes',
    'Pagos SaaS que aun no fueron aprobados.',
    COUNT(*),
    '/platform/subscriptions?section=payments'
  FROM subscription_payments
  WHERE status = 'PENDING'
  UNION ALL
  SELECT
    'REJECTED_PAYMENTS',
    'WARNING',
    'Pagos rechazados',
    'Pagos SaaS rechazados en los ultimos 30 dias.',
    COUNT(*),
    '/platform/subscriptions?section=payments'
  FROM subscription_payments
  WHERE status = 'REJECTED'
    AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  UNION ALL
  SELECT
    'INACTIVE_BUSINESSES',
    'CRITICAL',
    'Negocios sin actividad',
    'Negocios sin ventas, compras o movimientos en los ultimos 30 dias.',
    COUNT(*),
    '/platform/businesses'
  FROM businesses b
  LEFT JOIN (
    SELECT idBusiness, MAX(lastActivityAt) AS lastActivityAt
    FROM (
      SELECT idBusiness, MAX(sale_date) AS lastActivityAt FROM sales GROUP BY idBusiness
      UNION ALL
      SELECT idBusiness, MAX(purchase_date) AS lastActivityAt FROM purchases GROUP BY idBusiness
      UNION ALL
      SELECT idBusiness, MAX(created_at) AS lastActivityAt FROM stock_movements GROUP BY idBusiness
    ) activity
    GROUP BY idBusiness
  ) ba ON ba.idBusiness = b.idBusiness
  WHERE ba.lastActivityAt IS NULL OR ba.lastActivityAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
END$$

DELIMITER ;
