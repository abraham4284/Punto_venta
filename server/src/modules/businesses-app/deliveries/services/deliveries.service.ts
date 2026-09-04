import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import { mapDelivery } from "../helpers/delivery.mapper.js";
import type {
  DeliveryActionPayload,
  DeliveryDbRow,
  DeliveryListFilters,
  DeliveryResponse,
  PaginatedDeliveriesResponse,
  TotalRecordsDbRow,
} from "../types/index.js";

function getFirstDelivery(rows: RowDataPacket[], errorMessage: string): DeliveryResponse {
  const result = rows as unknown as DeliveryDbRow[][];
  const delivery = result[0]?.[0];

  if (!delivery) {
    throw new Error(errorMessage);
  }

  return mapDelivery(delivery);
}

export async function listDeliveriesService(
  filters: DeliveryListFilters,
): Promise<PaginatedDeliveriesResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_deliveries_list(?, ?, ?, ?, ?, ?)",
    [
      filters.idBusiness,
      filters.limit,
      filters.offset,
      filters.status ?? null,
      filters.assignedToUserId ?? null,
      filters.search ?? null,
    ],
  );
  const result = rows as unknown as [DeliveryDbRow[], TotalRecordsDbRow[]];
  const totalRecords = Number(result[1]?.[0]?.totalRecords ?? 0);

  return {
    deliveries: (result[0] ?? []).map(mapDelivery),
    pagination: {
      totalRecords,
      currentPage: filters.page,
      totalPages: Math.max(Math.ceil(totalRecords / filters.limit), 1),
      limit: filters.limit,
    },
  };
}

export async function getDeliveryByIdService(
  idBusiness: number,
  idSaleDelivery: number,
): Promise<DeliveryResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_delivery_get_by_id(?, ?)",
    [idBusiness, idSaleDelivery],
  );

  return getFirstDelivery(rows, "Entrega no encontrada");
}

export async function assignDeliveryService(
  data: DeliveryActionPayload,
): Promise<DeliveryResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_delivery_assign(?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idSaleDelivery,
      data.assignedToUserId ?? null,
      data.idUser,
    ],
  );

  return getFirstDelivery(rows, "No se pudo asignar la entrega");
}

export async function changeDeliveryStatusService(
  data: DeliveryActionPayload,
): Promise<DeliveryResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_delivery_change_status(?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idSaleDelivery,
      data.status,
      data.idUser,
      data.failureReason ?? null,
      data.scheduledAt ?? null,
      data.observation ?? null,
    ],
  );

  return getFirstDelivery(rows, "No se pudo actualizar la entrega");
}
