-- F5: existing baseline + Customers v2 + Orders F3/F4.1. OPERATOR ONLY.
-- Backup, confirm selected DB, stop writes. DDL commits implicitly; not atomic.
-- Review existing Sales totals before applying; do not repair/truncate data here.
-- Then import procedures/sales.sql and procedures/orders.sql in full, then deploy backend.
-- Do not run install.sql, the full permissions seed, or generated baseline on an existing DB.
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_migrate_order_to_sale$$
CREATE PROCEDURE sp_migrate_order_to_sale()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'idOrder') THEN
    ALTER TABLE sales ADD COLUMN idOrder INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'delivery_fee') THEN
    ALTER TABLE sales ADD COLUMN delivery_fee DECIMAL(18,2) NOT NULL DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND INDEX_NAME = 'uq_sales_business_order') THEN
    ALTER TABLE sales ADD UNIQUE KEY uq_sales_business_order (idBusiness, idOrder);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND CONSTRAINT_NAME = 'fk_sales_order') THEN
    ALTER TABLE sales ADD CONSTRAINT fk_sales_order FOREIGN KEY (idBusiness, idOrder) REFERENCES orders (idBusiness, idOrder);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND CONSTRAINT_NAME = 'chk_sales_delivery_fee') THEN
    ALTER TABLE sales ADD CONSTRAINT chk_sales_delivery_fee CHECK (delivery_fee >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND CONSTRAINT_NAME = 'chk_sales_totals') THEN
    ALTER TABLE sales ADD CONSTRAINT chk_sales_totals CHECK (subtotal >= 0 AND discount_total >= 0 AND discount_total <= subtotal AND total = subtotal - discount_total + delivery_fee);
  END IF;
END$$
CALL sp_migrate_order_to_sale()$$
DROP PROCEDURE IF EXISTS sp_migrate_order_to_sale$$
DELIMITER ;

INSERT INTO permissions (code, module, action, name, description, is_active)
VALUES ('orders.convert','orders','convert','Convertir pedidos a venta','Permite convertir un pedido READY a venta',1)
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);
INSERT IGNORE INTO role_permissions (role, idPermission)
SELECT 'ADMIN', idPermission FROM permissions WHERE code = 'orders.convert';
