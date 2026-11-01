-- Caller owns transaction, Sale/Delivery/Payment/Detail locks and monetary plan.
-- No START TRANSACTION/COMMIT/ROLLBACK: never call independently of the Return service.
DROP PROCEDURE IF EXISTS sp_sale_return_apply_item;
DELIMITER $$
CREATE PROCEDURE sp_sale_return_apply_item(
 IN p_idBusiness INT, IN p_idSaleReturn BIGINT, IN p_idSaleDetail INT,
 IN p_quantity DECIMAL(18,2), IN p_refundAmount DECIMAL(18,2), IN p_restock TINYINT, IN p_idUser INT
)
BEGIN
 DECLARE v_idProduct INT; DECLARE v_idDeposit INT; DECLARE v_idSale INT;
 DECLARE v_sold DECIMAL(18,2); DECLARE v_returned DECIMAL(18,2); DECLARE v_net DECIMAL(18,2); DECLARE v_refunded DECIMAL(18,2);
 SELECT sd.idProduct, s.idDeposit, s.idSale, sd.quantity, sd.subtotal INTO v_idProduct, v_idDeposit, v_idSale, v_sold, v_net
 FROM sale_returns r JOIN sales s ON s.idBusiness = r.idBusiness AND s.idSale = r.idSale
 JOIN sale_details sd ON sd.idBusiness = s.idBusiness AND sd.idSale = s.idSale AND sd.idSaleDetail = p_idSaleDetail
 WHERE r.idBusiness = p_idBusiness AND r.idSaleReturn = p_idSaleReturn FOR UPDATE;
 IF v_idProduct IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SALE_RETURN_ITEM_NOT_FOUND'; END IF;
 SELECT COALESCE(SUM(quantity),0), COALESCE(SUM(refund_amount),0) INTO v_returned, v_refunded
 FROM sale_return_items WHERE idBusiness = p_idBusiness AND idSaleDetail = p_idSaleDetail;
 IF p_quantity <= 0 OR v_returned + p_quantity > v_sold THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SALE_RETURN_QUANTITY_EXCEEDED'; END IF;
 IF p_refundAmount < 0 OR v_refunded + p_refundAmount > v_net THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SALE_RETURN_REFUND_TOTAL_MISMATCH'; END IF;
 INSERT INTO sale_return_items (idBusiness,idSaleReturn,idSaleDetail,idProduct,quantity,refund_amount,restock)
 VALUES (p_idBusiness,p_idSaleReturn,p_idSaleDetail,v_idProduct,p_quantity,p_refundAmount,p_restock);
 IF p_restock = 1 THEN
   INSERT INTO stock (idBusiness,idProduct,idDeposit,quantity,updated_at) VALUES (p_idBusiness,v_idProduct,v_idDeposit,p_quantity,NOW())
   ON DUPLICATE KEY UPDATE quantity = quantity + p_quantity, updated_at = NOW();
   INSERT INTO stock_movements (idBusiness,idProduct,idUser,movement_type,idDepositTo,quantity,reference_type,reference_id,observation)
   VALUES (p_idBusiness,v_idProduct,p_idUser,'SALE_RETURN',v_idDeposit,p_quantity,'SALE_RETURN',p_idSaleReturn,CONCAT('Sale ',v_idSale,' / SaleReturn ',p_idSaleReturn));
 END IF;
END$$
DELIMITER ;
