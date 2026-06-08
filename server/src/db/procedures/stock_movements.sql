DROP PROCEDURE IF EXISTS sp_process_stock_adjustment;
DELIMITER $$

CREATE PROCEDURE sp_process_stock_adjustment(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_idProduct INT,
  IN p_idDeposit INT,
  IN p_quantity DECIMAL(18,2),
  IN p_movement_type VARCHAR(30),
  IN p_observation VARCHAR(255)
)
BEGIN
  DECLARE v_current_quantity DECIMAL(18,2);
  DECLARE v_idMovement INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_movement_type NOT IN ('ADJUSTMENT_IN', 'ADJUSTMENT_OUT') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Tipo de ajuste invalido';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM stock
    WHERE idBusiness = p_idBusiness
      AND idProduct = p_idProduct
      AND idDeposit = p_idDeposit
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El producto no tiene stock registrado en el deposito indicado';
  END IF;

  SELECT quantity
  INTO v_current_quantity
  FROM stock
  WHERE idBusiness = p_idBusiness
    AND idProduct = p_idProduct
    AND idDeposit = p_idDeposit
  LIMIT 1;

  IF p_movement_type = 'ADJUSTMENT_OUT' AND v_current_quantity < p_quantity THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Stock insuficiente para realizar el ajuste';
  END IF;

  START TRANSACTION;

  UPDATE stock
  SET
    quantity = CASE
      WHEN p_movement_type = 'ADJUSTMENT_IN' THEN quantity + p_quantity
      ELSE quantity - p_quantity
    END,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idProduct = p_idProduct
    AND idDeposit = p_idDeposit;

  INSERT INTO stock_movements (
    idBusiness,
    idProduct,
    idUser,
    movement_type,
    idDepositFrom,
    idDepositTo,
    quantity,
    reference_type,
    reference_id,
    observation,
    created_at
  )
  VALUES (
    p_idBusiness,
    p_idProduct,
    p_idUser,
    p_movement_type,
    CASE WHEN p_movement_type = 'ADJUSTMENT_OUT' THEN p_idDeposit ELSE NULL END,
    CASE WHEN p_movement_type = 'ADJUSTMENT_IN' THEN p_idDeposit ELSE NULL END,
    p_quantity,
    'ADJUSTMENT',
    NULL,
    p_observation,
    NOW()
  );

  SET v_idMovement = LAST_INSERT_ID();

  UPDATE stock_movements
  SET reference_id = v_idMovement
  WHERE idStockMovement = v_idMovement;

  COMMIT;

  CALL sp_get_stock_movements(p_idBusiness);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_process_stock_transfer;
DELIMITER $$

CREATE PROCEDURE sp_process_stock_transfer(
  IN p_idBusiness INT,
  IN p_idUser INT,
  IN p_idProduct INT,
  IN p_idDepositFrom INT,
  IN p_idDepositTo INT,
  IN p_quantity DECIMAL(18,2),
  IN p_observation VARCHAR(255)
)
BEGIN
  DECLARE v_current_quantity DECIMAL(18,2);
  DECLARE v_reference_id INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_idDepositFrom = p_idDepositTo THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El deposito origen y destino deben ser diferentes';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM deposits
    WHERE idBusiness = p_idBusiness
      AND idDeposit = p_idDepositFrom
      AND is_active = 1
  ) OR NOT EXISTS (
    SELECT 1
    FROM deposits
    WHERE idBusiness = p_idBusiness
      AND idDeposit = p_idDepositTo
      AND is_active = 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Los depositos indicados deben pertenecer al negocio y estar activos';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM stock
    WHERE idBusiness = p_idBusiness
      AND idProduct = p_idProduct
      AND idDeposit = p_idDepositFrom
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El producto no tiene stock registrado en el deposito origen';
  END IF;

  SELECT quantity
  INTO v_current_quantity
  FROM stock
  WHERE idBusiness = p_idBusiness
    AND idProduct = p_idProduct
    AND idDeposit = p_idDepositFrom
  LIMIT 1;

  IF v_current_quantity < p_quantity THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Stock insuficiente para realizar la transferencia';
  END IF;

  START TRANSACTION;

  UPDATE stock
  SET
    quantity = quantity - p_quantity,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idProduct = p_idProduct
    AND idDeposit = p_idDepositFrom;

  INSERT INTO stock (
    idBusiness,
    idProduct,
    idDeposit,
    quantity,
    updated_at
  )
  SELECT
    p_idBusiness,
    p_idProduct,
    p_idDepositTo,
    0,
    NOW()
  WHERE NOT EXISTS (
    SELECT 1
    FROM stock
    WHERE idBusiness = p_idBusiness
      AND idProduct = p_idProduct
      AND idDeposit = p_idDepositTo
  );

  UPDATE stock
  SET
    quantity = quantity + p_quantity,
    updated_at = NOW()
  WHERE idBusiness = p_idBusiness
    AND idProduct = p_idProduct
    AND idDeposit = p_idDepositTo;

  INSERT INTO stock_movements (
    idBusiness,
    idProduct,
    idUser,
    movement_type,
    idDepositFrom,
    idDepositTo,
    quantity,
    reference_type,
    reference_id,
    observation,
    created_at
  )
  VALUES (
    p_idBusiness,
    p_idProduct,
    p_idUser,
    'TRANSFER_OUT',
    p_idDepositFrom,
    p_idDepositTo,
    p_quantity,
    'TRANSFER',
    NULL,
    p_observation,
    NOW()
  );

  SET v_reference_id = LAST_INSERT_ID();

  INSERT INTO stock_movements (
    idBusiness,
    idProduct,
    idUser,
    movement_type,
    idDepositFrom,
    idDepositTo,
    quantity,
    reference_type,
    reference_id,
    observation,
    created_at
  )
  VALUES (
    p_idBusiness,
    p_idProduct,
    p_idUser,
    'TRANSFER_IN',
    p_idDepositFrom,
    p_idDepositTo,
    p_quantity,
    'TRANSFER',
    v_reference_id,
    p_observation,
    NOW()
  );

  UPDATE stock_movements
  SET reference_id = v_reference_id
  WHERE idStockMovement = v_reference_id;

  COMMIT;

  CALL sp_get_stock_movements(p_idBusiness);
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS sp_get_stock_movements;
DELIMITER $$

CREATE PROCEDURE sp_get_stock_movements(
  IN p_idBusiness INT
)
BEGIN
  SELECT
    sm.idStockMovement,
    sm.idBusiness,
    b.name AS business_name,
    sm.idProduct,
    p.name AS product_name,
    p.image_url AS product_image_url,
    sm.idUser,
    u.name AS user_name,
    sm.movement_type,
    sm.idDepositFrom,
    df.name AS deposit_from_name,
    sm.idDepositTo,
    dt.name AS deposit_to_name,
    sm.quantity,
    sm.reference_type,
    sm.reference_id,
    sm.observation,
    sm.created_at
  FROM stock_movements sm
  INNER JOIN businesses b ON b.idBusiness = sm.idBusiness
  INNER JOIN products p
    ON p.idProduct = sm.idProduct
    AND p.idBusiness = sm.idBusiness
  INNER JOIN users u ON u.idUser = sm.idUser
  LEFT JOIN deposits df
    ON df.idDeposit = sm.idDepositFrom
    AND df.idBusiness = sm.idBusiness
  LEFT JOIN deposits dt
    ON dt.idDeposit = sm.idDepositTo
    AND dt.idBusiness = sm.idBusiness
  WHERE sm.idBusiness = p_idBusiness
  ORDER BY sm.created_at DESC, sm.idStockMovement DESC;
END$$

DELIMITER ;
