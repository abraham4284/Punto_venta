import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import type {
  BusinessDbRow,
  BusinessResponse,
  UpdateBusinessBody,
} from "../types/business.types.js";

const mapBusiness = (business: BusinessDbRow): BusinessResponse => ({
  idBusiness: business.idBusiness,
  name: business.name,
  slug: business.slug,
  logoUrl: business.logo_url,
  businessType: business.business_type,
  isActive: Boolean(business.is_active),
  createdAt: business.created_at,
  updatedAt: business.updated_at,
});

export const getBusinessService = async (
  idBusiness: number,
): Promise<BusinessResponse> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_business_by_id(?)",
    [idBusiness],
  );

  const result = rows as unknown as BusinessDbRow[][];
  const business = result[0]?.[0];

  if (!business) {
    throw new Error("Negocio no encontrado");
  }

  return mapBusiness(business);
};

export const updateBusinessService = async (
  idBusiness: number,
  data: UpdateBusinessBody,
): Promise<BusinessResponse> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_update_business(?, ?, ?, ?, ?, ?)",
      [
        idBusiness,
        data.name ?? null,
        data.slug ?? null,
        data.logoUrl ?? null,
        Object.hasOwn(data, "logoUrl") ? 1 : 0,
        data.businessType ?? null,
      ],
    );

    const result = rows as unknown as BusinessDbRow[][];
    const business = result[0]?.[0];

    if (!business) {
      throw new Error("Negocio no encontrado");
    }

    return mapBusiness(business);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      throw new Error("El slug del negocio ya esta en uso");
    }

    throw error;
  }
};
