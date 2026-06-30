DROP PROCEDURE IF EXISTS sp_get_sale_ticket_data;
DELIMITER $$

CREATE PROCEDURE sp_get_sale_ticket_data(
  IN p_idSale INT,
  IN p_idBusiness INT
)
BEGIN
  SELECT
    s.idSale,
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
    COALESCE(pm.name, 'Sin metodo de pago') AS payment_method_name
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
  LEFT JOIN payment_methods pm
    ON pm.idPaymentMethod = s.idPaymentMethod
    AND pm.idBusiness = s.idBusiness
  WHERE s.idSale = p_idSale
    AND s.idBusiness = p_idBusiness
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
END$$

DELIMITER ;
