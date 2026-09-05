DROP PROCEDURE IF EXISTS sp_get_sale_ticket_data;
DELIMITER $$

CREATE PROCEDURE sp_get_sale_ticket_data(
  IN p_idSale INT,
  IN p_idBusiness INT
)
BEGIN
  SELECT
    s.idSale,
    s.sale_number,
    s.idBusiness,
    b.name AS business_name,
    b.business_type,
    b.logo_url,
    s.sale_date,
    s.subtotal,
    s.discount_total,
    s.total,
    s.observation,
    s.status,
    COALESCE(c.name, 'Consumidor Final') AS customer_name,
    u.name AS user_name,
    d.name AS deposit_name,
    GROUP_CONCAT(DISTINCT pm.code ORDER BY pm.name SEPARATOR ', ') AS payment_method_code,
    COALESCE(GROUP_CONCAT(DISTINCT pm.name ORDER BY pm.name SEPARATOR ', '), 'Sin metodo de pago') AS payment_method_name
  FROM sales s
  INNER JOIN businesses b
    ON b.idBusiness = s.idBusiness
  INNER JOIN users u
    ON u.idUser = s.idUser
  INNER JOIN deposits d
    ON d.idDeposit = s.idDeposit
    AND d.idBusiness = s.idBusiness
  LEFT JOIN customers c
    ON c.idCustomer = s.idCustomer
    AND c.idBusiness = s.idBusiness
  LEFT JOIN sale_payments sp
    ON sp.idSale = s.idSale
    AND sp.idBusiness = s.idBusiness
    AND sp.status <> 'CANCELLED'
  LEFT JOIN payment_methods pm
    ON pm.idPaymentMethod = sp.idPaymentMethod
    AND pm.idBusiness = sp.idBusiness
  WHERE s.idSale = p_idSale
    AND s.idBusiness = p_idBusiness
  GROUP BY
    s.idSale,
    s.sale_number,
    s.idBusiness,
    b.name,
    b.business_type,
    b.logo_url,
    s.sale_date,
    s.subtotal,
    s.discount_total,
    s.total,
    s.observation,
    s.status,
    c.name,
    u.name,
    d.name
  LIMIT 1;

  SELECT
    sd.idSaleDetail,
    p.name AS product_name,
    sd.quantity,
    sd.unit_price,
    sd.discount_amount AS discount,
    sd.subtotal
  FROM sale_details sd
  INNER JOIN products p
    ON p.idProduct = sd.idProduct
    AND p.idBusiness = sd.idBusiness
  WHERE sd.idSale = p_idSale
    AND sd.idBusiness = p_idBusiness
  ORDER BY sd.idSaleDetail ASC;

  SELECT
    sp.idSalePayment,
    sp.idPaymentMethod,
    pm.name AS payment_method_name,
    pm.code AS payment_method_code,
    pm.affects_cash,
    sp.amount,
    sp.status,
    sp.reference,
    sp.observation
  FROM sale_payments sp
  INNER JOIN payment_methods pm
    ON pm.idPaymentMethod = sp.idPaymentMethod
    AND pm.idBusiness = sp.idBusiness
  WHERE sp.idSale = p_idSale
    AND sp.idBusiness = p_idBusiness
  ORDER BY sp.idSalePayment ASC;
END$$

DELIMITER ;
