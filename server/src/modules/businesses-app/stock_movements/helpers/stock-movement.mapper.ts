import type {
  StockMovementDbRow,
  StockMovementResponse,
} from "../types/index.js";

export function mapStockMovement(
  movement: StockMovementDbRow,
): StockMovementResponse {
  return {
    idStockMovement: movement.idStockMovement,
    idBusiness: movement.idBusiness,
    businessName: movement.business_name,
    idProduct: movement.idProduct,
    productName: movement.product_name,
    productImageUrl: movement.product_image_url,
    idUser: movement.idUser,
    userName: movement.user_name,
    movementType: movement.movement_type,
    idDepositFrom: movement.idDepositFrom,
    depositFromName: movement.deposit_from_name,
    idDepositTo: movement.idDepositTo,
    depositToName: movement.deposit_to_name,
    quantity: Number(movement.quantity),
    referenceType: movement.reference_type,
    referenceId: movement.reference_id,
    observation: movement.observation,
    createdAt: movement.created_at,
  };
}
