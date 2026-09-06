DROP PROCEDURE IF EXISTS sp_get_dashboard_metrics;
DELIMITER $$

CREATE PROCEDURE sp_get_dashboard_metrics(
  IN p_idBusiness INT
)
BEGIN
  SELECT
    COALESCE((
      SELECT SUM(s.total)
      FROM sales s
      WHERE s.idBusiness = p_idBusiness
        AND s.status = 'COMPLETED'
        AND DATE(s.sale_date) = CURDATE()
    ), 0) AS todaySalesTotal,

    COALESCE((
      SELECT SUM(s.total)
      FROM sales s
      WHERE s.idBusiness = p_idBusiness
        AND s.status = 'COMPLETED'
        AND YEAR(s.sale_date) = YEAR(CURDATE())
        AND MONTH(s.sale_date) = MONTH(CURDATE())
    ), 0) AS monthSalesTotal,

    COALESCE((
      SELECT COUNT(*)
      FROM sales s
      WHERE s.idBusiness = p_idBusiness
        AND s.status = 'COMPLETED'
        AND DATE(s.sale_date) = CURDATE()
    ), 0) AS todaySalesCount,

    COALESCE((
      SELECT SUM(s.total) / NULLIF(COUNT(s.idSale), 0)
      FROM sales s
      WHERE s.idBusiness = p_idBusiness
        AND s.status = 'COMPLETED'
        AND YEAR(s.sale_date) = YEAR(CURDATE())
        AND MONTH(s.sale_date) = MONTH(CURDATE())
    ), 0) AS monthAverageTicket,

    COALESCE((
      SELECT SUM(p.total)
      FROM purchases p
      WHERE p.idBusiness = p_idBusiness
        AND p.status = 'COMPLETED'
        AND DATE(p.purchase_date) = UTC_DATE()
    ), 0) AS todayPurchasesTotal,

    COALESCE((
      SELECT SUM(p.total)
      FROM purchases p
      WHERE p.idBusiness = p_idBusiness
        AND p.status = 'COMPLETED'
        AND YEAR(p.purchase_date) = YEAR(UTC_DATE())
        AND MONTH(p.purchase_date) = MONTH(UTC_DATE())
    ), 0) AS monthPurchasesTotal,

    COALESCE((
      SELECT COUNT(*)
      FROM purchases p
      WHERE p.idBusiness = p_idBusiness
        AND p.status = 'COMPLETED'
        AND DATE(p.purchase_date) = UTC_DATE()
    ), 0) AS todayPurchasesCount,

    COALESCE((
      SELECT SUM(p.total) / NULLIF(COUNT(p.idPurchase), 0)
      FROM purchases p
      WHERE p.idBusiness = p_idBusiness
        AND p.status = 'COMPLETED'
        AND YEAR(p.purchase_date) = YEAR(UTC_DATE())
        AND MONTH(p.purchase_date) = MONTH(UTC_DATE())
    ), 0) AS monthAveragePurchase,

    COALESCE((
      SELECT COUNT(*)
      FROM stock st
      INNER JOIN products p
        ON p.idProduct = st.idProduct
        AND p.idBusiness = st.idBusiness
      WHERE st.idBusiness = p_idBusiness
        AND st.quantity > 0
        AND st.quantity <= p.stock_min
    ), 0) AS lowStockProducts,

    COALESCE((
      SELECT COUNT(*)
      FROM stock st
      WHERE st.idBusiness = p_idBusiness
        AND st.quantity = 0
    ), 0) AS outOfStockProducts,

    COALESCE((
      SELECT COUNT(*)
      FROM products p
      WHERE p.idBusiness = p_idBusiness
        AND p.is_active = 1
    ), 0) AS activeProducts,

    COALESCE((
      SELECT SUM(st.quantity * p.price_cost)
      FROM stock st
      INNER JOIN products p
        ON p.idProduct = st.idProduct
        AND p.idBusiness = st.idBusiness
      WHERE st.idBusiness = p_idBusiness
    ), 0) AS stockCostValue;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_dashboard_charts_and_lists;
DELIMITER $$

CREATE PROCEDURE sp_get_dashboard_charts_and_lists(
  IN p_idBusiness INT,
  IN p_year INT
)
BEGIN
  SELECT
    s.idSale,
    s.idSale AS receiptNumber,
    COALESCE(c.name, 'Consumidor Final') AS customerName,
    s.total,
    s.status,
    s.sale_date AS saleDate,
    s.created_at AS createdAt
  FROM sales s
  LEFT JOIN customers c
    ON c.idCustomer = s.idCustomer
    AND c.idBusiness = s.idBusiness
  WHERE s.idBusiness = p_idBusiness
  ORDER BY s.created_at DESC, s.idSale DESC
  LIMIT 5;

  SELECT
    p.idProduct,
    p.name AS productName,
    SUM(sd.quantity) AS quantitySold,
    SUM(sd.subtotal) AS totalRevenue
  FROM sale_details sd
  INNER JOIN sales s
    ON s.idSale = sd.idSale
    AND s.idBusiness = sd.idBusiness
  INNER JOIN products p
    ON p.idProduct = sd.idProduct
    AND p.idBusiness = sd.idBusiness
  WHERE sd.idBusiness = p_idBusiness
    AND s.status = 'COMPLETED'
  GROUP BY p.idProduct, p.name
  ORDER BY quantitySold DESC, totalRevenue DESC
  LIMIT 5;

  SELECT
    COALESCE(pm.name, 'Sin metodo de pago') AS paymentMethodName,
    COALESCE(SUM(sp.amount), 0) AS totalAmount
  FROM sale_payments sp
  INNER JOIN sales s
    ON s.idSale = sp.idSale
    AND s.idBusiness = sp.idBusiness
  LEFT JOIN payment_methods pm
    ON pm.idPaymentMethod = sp.idPaymentMethod
    AND pm.idBusiness = sp.idBusiness
  WHERE sp.idBusiness = p_idBusiness
    AND sp.status = 'CONFIRMED'
    AND s.status = 'COMPLETED'
    AND YEAR(s.sale_date) = YEAR(CURDATE())
    AND MONTH(s.sale_date) = MONTH(CURDATE())
  GROUP BY COALESCE(pm.name, 'Sin metodo de pago')
  ORDER BY totalAmount DESC;

  SELECT
    d.idDeposit,
    d.name AS depositName,
    p.idProduct,
    p.name AS productName,
    st.quantity AS currentStock,
    p.stock_min AS stockMin
  FROM stock st
  INNER JOIN products p
    ON p.idProduct = st.idProduct
    AND p.idBusiness = st.idBusiness
  INNER JOIN deposits d
    ON d.idDeposit = st.idDeposit
    AND d.idBusiness = st.idBusiness
  WHERE st.idBusiness = p_idBusiness
    AND st.quantity <= p.stock_min
  ORDER BY st.quantity ASC, p.name ASC
  LIMIT 10;

  SELECT
    months.monthNumber,
    months.monthName,
    COALESCE(SUM(s.total), 0) AS totalAmount,
    COALESCE(COUNT(s.idSale), 0) AS salesCount
  FROM (
    SELECT 1 AS monthNumber, 'Enero' AS monthName
    UNION ALL SELECT 2, 'Febrero'
    UNION ALL SELECT 3, 'Marzo'
    UNION ALL SELECT 4, 'Abril'
    UNION ALL SELECT 5, 'Mayo'
    UNION ALL SELECT 6, 'Junio'
    UNION ALL SELECT 7, 'Julio'
    UNION ALL SELECT 8, 'Agosto'
    UNION ALL SELECT 9, 'Septiembre'
    UNION ALL SELECT 10, 'Octubre'
    UNION ALL SELECT 11, 'Noviembre'
    UNION ALL SELECT 12, 'Diciembre'
  ) months
  LEFT JOIN sales s
    ON s.idBusiness = p_idBusiness
    AND s.status = 'COMPLETED'
    AND YEAR(s.sale_date) = p_year
    AND MONTH(s.sale_date) = months.monthNumber
  GROUP BY months.monthNumber, months.monthName
  ORDER BY months.monthNumber ASC;

  SELECT availableYears.year
  FROM (
    SELECT YEAR(CURDATE()) AS year
    UNION
    SELECT DISTINCT YEAR(s.sale_date) AS year
    FROM sales s
    WHERE s.idBusiness = p_idBusiness
      AND s.sale_date IS NOT NULL
  ) availableYears
  ORDER BY availableYears.year DESC;
END$$

DELIMITER ;
