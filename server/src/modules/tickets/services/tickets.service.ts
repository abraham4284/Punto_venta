import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import { buildSaleTicketHtml } from "../helpers/ticketTemplate.helper.js";
import type {
  SaleTicketData,
  SaleTicketHeader,
  SaleTicketItem,
  SaleTicketResponse,
  TicketItemDbRow,
  TicketSaleDbRow,
} from "../types/index.js";

function mapTicketHeader(row: TicketSaleDbRow): SaleTicketHeader {
  return {
    idSale: row.idSale,
    idBusiness: row.idBusiness,
    businessName: row.business_name,
    businessType: row.business_type,
    logoUrl: row.logo_url,
    saleDate: row.sale_date,
    subtotal: Number(row.subtotal),
    discountTotal: Number(row.discount_total),
    total: Number(row.total),
    observation: row.observation,
    status: row.status,
    customerName: row.customer_name,
    userName: row.user_name,
    depositName: row.deposit_name,
    paymentMethodName: row.payment_method_name,
  };
}

function mapTicketItem(row: TicketItemDbRow): SaleTicketItem {
  return {
    idSaleDetail: row.idSaleDetail,
    productName: row.product_name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    discount: Number(row.discount),
    subtotal: Number(row.subtotal),
  };
}

export async function getSaleTicketService(
  idBusiness: number,
  idSale: number,
): Promise<SaleTicketResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_sale_ticket_data(?, ?)",
    [idSale, idBusiness],
  );

  const result = rows as unknown as [TicketSaleDbRow[], TicketItemDbRow[]];
  const saleRow = result[0]?.[0];

  if (!saleRow) {
    throw new Error("Venta no encontrada para generar ticket");
  }

  const ticketData: SaleTicketData = {
    sale: mapTicketHeader(saleRow),
    items: (result[1] ?? []).map(mapTicketItem),
  };

  return {
    ...ticketData,
    idSale: ticketData.sale.idSale,
    htmlTemplate: buildSaleTicketHtml(ticketData),
  };
}
