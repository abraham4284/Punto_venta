import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import type {
  BusinessNotificationTarget,
  CreateBusinessNotificationInput,
  CreatePlatformNotificationInput,
  NotificationCountRow,
  NotificationIdRow,
  NotificationListFilters,
  NotificationListResponse,
  NotificationResponse,
  NotificationRow,
  NotificationTotalRow,
  PlatformNotificationTarget,
  StockEvaluationInput,
  StockEvaluationRow,
} from "../types/index.js";

function parseMetadata(value: string | Record<string, unknown> | null): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function mapNotification(row: NotificationRow): NotificationResponse {
  return {
    idNotification: row.idNotification,
    type: row.type,
    severity: row.severity,
    title: row.title,
    message: row.message,
    actionUrl: row.actionUrl ?? row.action_url ?? null,
    metadata: parseMetadata(row.metadata),
    status: row.status,
    isRead: Boolean(row.isRead ?? row.is_read),
    readAt: row.readAt ?? row.read_at ?? null,
    createdAt: row.createdAt ?? row.created_at ?? new Date(),
  };
}

function uniqueNumbers(values: number[] | undefined): number[] {
  return Array.from(new Set((values ?? []).filter(function filterValue(value) {
    return Number.isInteger(value) && value > 0;
  })));
}

async function getBusinessRecipientUserIds(
  idBusiness: number,
  target: BusinessNotificationTarget,
): Promise<number[]> {
  const explicitUserIds = uniqueNumbers(target.userIds);
  const roles = target.roles ?? [];

  if (roles.length === 0) {
    return explicitUserIds;
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT bu.idUser
       FROM business_users bu
       INNER JOIN users u ON u.idUser = bu.idUser
      WHERE bu.idBusiness = ?
        AND bu.role IN (?)
        AND bu.is_active = 1
        AND u.is_active = 1`,
    [idBusiness, roles],
  );

  const roleUserIds = rows.map(function mapRow(row) {
    return Number(row.idUser);
  });

  return uniqueNumbers([...explicitUserIds, ...roleUserIds]);
}

async function getPlatformRecipientUserIds(
  target: PlatformNotificationTarget,
): Promise<number[]> {
  const explicitPlatformUserIds = uniqueNumbers(target.platformUserIds);
  const roles = target.roles ?? [];

  if (roles.length === 0) {
    return explicitPlatformUserIds;
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT pu.idPlatformUser
       FROM platform_users pu
       INNER JOIN users u ON u.idUser = pu.idUser
      WHERE pu.role IN (?)
        AND pu.is_active = 1
        AND u.is_active = 1`,
    [roles],
  );

  const rolePlatformUserIds = rows.map(function mapRow(row) {
    return Number(row.idPlatformUser);
  });

  return uniqueNumbers([...explicitPlatformUserIds, ...rolePlatformUserIds]);
}

async function callCreateNotificationProcedure(params: {
  context: "BUSINESS" | "PLATFORM";
  idBusiness: number | null;
  type: string;
  severity: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  deduplicationKey?: string | null;
  expiresAt?: Date | string | null;
  createdByUserId?: number | null;
  createdByPlatformUserId?: number | null;
  recipientUserIds: number[];
  recipientPlatformUserIds: number[];
}): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_notifications_create(?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON))",
    [
      params.context,
      params.idBusiness,
      params.type,
      params.severity,
      params.title,
      params.message,
      params.actionUrl ?? null,
      JSON.stringify(params.metadata ?? null),
      params.deduplicationKey ?? null,
      params.expiresAt ?? null,
      params.createdByUserId ?? null,
      params.createdByPlatformUserId ?? null,
      JSON.stringify(params.recipientUserIds),
      JSON.stringify(params.recipientPlatformUserIds),
    ],
  );
  const result = rows as unknown as NotificationIdRow[][];
  return Number(result[0]?.[0]?.idNotification ?? 0);
}

export async function createBusinessNotification(
  input: CreateBusinessNotificationInput,
): Promise<number | null> {
  const recipientUserIds = await getBusinessRecipientUserIds(input.idBusiness, input);

  if (recipientUserIds.length === 0) {
    return null;
  }

  return callCreateNotificationProcedure({
    context: "BUSINESS",
    idBusiness: input.idBusiness,
    type: input.type,
    severity: input.severity,
    title: input.title,
    message: input.message,
    actionUrl: input.actionUrl,
    metadata: input.metadata,
    deduplicationKey: input.deduplicationKey,
    expiresAt: input.expiresAt,
    createdByUserId: input.createdByUserId,
    createdByPlatformUserId: input.createdByPlatformUserId,
    recipientUserIds,
    recipientPlatformUserIds: [],
  });
}

export async function safeCreateBusinessNotification(
  input: CreateBusinessNotificationInput,
): Promise<void> {
  try {
    await createBusinessNotification(input);
  } catch (error) {
    console.error({ message: "Error creando notificacion interna", error });
  }
}

export async function createPlatformNotification(
  input: CreatePlatformNotificationInput,
): Promise<number | null> {
  const recipientPlatformUserIds = await getPlatformRecipientUserIds(input);

  if (recipientPlatformUserIds.length === 0) {
    return null;
  }

  return callCreateNotificationProcedure({
    context: "PLATFORM",
    idBusiness: null,
    type: input.type,
    severity: input.severity,
    title: input.title,
    message: input.message,
    actionUrl: input.actionUrl,
    metadata: input.metadata,
    deduplicationKey: input.deduplicationKey,
    expiresAt: input.expiresAt,
    createdByUserId: null,
    createdByPlatformUserId: input.createdByPlatformUserId,
    recipientUserIds: [],
    recipientPlatformUserIds,
  });
}

export async function safeCreatePlatformNotification(
  input: CreatePlatformNotificationInput,
): Promise<void> {
  try {
    await createPlatformNotification(input);
  } catch (error) {
    console.error({ message: "Error creando notificacion de plataforma", error });
  }
}

export async function resolveBusinessNotificationByDeduplicationKey(
  idBusiness: number,
  deduplicationKey: string,
): Promise<void> {
  await pool.query<RowDataPacket[]>(
    "CALL sp_notifications_resolve(?, ?, ?)",
    ["BUSINESS", idBusiness, deduplicationKey],
  );
}

export async function safeResolveBusinessNotificationByDeduplicationKey(
  idBusiness: number,
  deduplicationKey: string,
): Promise<void> {
  try {
    await resolveBusinessNotificationByDeduplicationKey(idBusiness, deduplicationKey);
  } catch (error) {
    console.error({ message: "Error resolviendo notificacion interna", error });
  }
}

export async function evaluateStockNotification(
  input: StockEvaluationInput,
): Promise<void> {
  const [rows] = await pool.query<StockEvaluationRow[]>(
    `SELECT s.idBusiness,
            s.idProduct,
            s.idDeposit,
            p.name AS productName,
            d.name AS depositName,
            s.quantity,
            p.stock_min AS stockMin
       FROM stock s
       INNER JOIN products p ON p.idProduct = s.idProduct AND p.idBusiness = s.idBusiness
       INNER JOIN deposits d ON d.idDeposit = s.idDeposit AND d.idBusiness = s.idBusiness
      WHERE s.idBusiness = ?
        AND s.idProduct = ?
        AND s.idDeposit = ?
      LIMIT 1`,
    [input.idBusiness, input.idProduct, input.idDeposit],
  );
  const stock = rows[0];

  if (!stock) {
    return;
  }

  const quantity = Number(stock.quantity);
  const stockMin = Number(stock.stockMin ?? 0);
  const criticalKey = `STOCK_CRITICAL:B${input.idBusiness}:P${input.idProduct}:D${input.idDeposit}`;
  const outKey = `STOCK_OUT:B${input.idBusiness}:P${input.idProduct}:D${input.idDeposit}`;

  if (quantity <= 0) {
    await safeResolveBusinessNotificationByDeduplicationKey(input.idBusiness, criticalKey);
    await createBusinessNotification({
      idBusiness: input.idBusiness,
      type: "STOCK_OUT",
      severity: "ERROR",
      title: "Producto sin stock",
      message: `${stock.productName} quedo sin stock en ${stock.depositName}.`,
      actionUrl: "/admin/stock",
      metadata: {
        idProduct: input.idProduct,
        idDeposit: input.idDeposit,
        productName: stock.productName,
        depositName: stock.depositName,
        quantity,
        stockMin,
      },
      deduplicationKey: outKey,
      roles: ["OWNER", "ADMIN"],
    });
    return;
  }

  if (quantity <= stockMin) {
    await safeResolveBusinessNotificationByDeduplicationKey(input.idBusiness, outKey);
    await createBusinessNotification({
      idBusiness: input.idBusiness,
      type: "STOCK_CRITICAL",
      severity: "WARNING",
      title: "Stock critico",
      message: `${stock.productName} esta por debajo del minimo en ${stock.depositName}.`,
      actionUrl: "/admin/stock",
      metadata: {
        idProduct: input.idProduct,
        idDeposit: input.idDeposit,
        productName: stock.productName,
        depositName: stock.depositName,
        quantity,
        stockMin,
      },
      deduplicationKey: criticalKey,
      roles: ["OWNER", "ADMIN"],
    });
    return;
  }

  await safeResolveBusinessNotificationByDeduplicationKey(input.idBusiness, criticalKey);
  await safeResolveBusinessNotificationByDeduplicationKey(input.idBusiness, outKey);
}

export async function safeEvaluateStockNotification(
  input: StockEvaluationInput,
): Promise<void> {
  try {
    await evaluateStockNotification(input);
  } catch (error) {
    console.error({ message: "Error evaluando alerta de stock", error });
  }
}

export async function getBusinessNotificationsService(
  idBusiness: number,
  idUser: number,
  filters: NotificationListFilters,
): Promise<NotificationListResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_notifications_get_business(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      idBusiness,
      idUser,
      filters.limit,
      filters.offset,
      filters.unreadOnly ? 0 : null,
      filters.severity ?? null,
      filters.type ?? null,
      null,
      null,
    ],
  );
  const result = rows as unknown as [NotificationRow[], NotificationTotalRow[]];
  const totalRecords = Number(result[1]?.[0]?.totalRecords ?? 0);

  return {
    notifications: (result[0] ?? []).map(mapNotification),
    pagination: {
      totalRecords,
      currentPage: filters.page,
      totalPages: Math.max(Math.ceil(totalRecords / filters.limit), 1),
      limit: filters.limit,
    },
  };
}

export async function getPlatformNotificationsService(
  idPlatformUser: number,
  filters: NotificationListFilters,
): Promise<NotificationListResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_notifications_get_platform(?, ?, ?, ?, ?, ?, ?, ?)",
    [
      idPlatformUser,
      filters.limit,
      filters.offset,
      filters.unreadOnly ? 0 : null,
      filters.severity ?? null,
      filters.type ?? null,
      null,
      null,
    ],
  );
  const result = rows as unknown as [NotificationRow[], NotificationTotalRow[]];
  const totalRecords = Number(result[1]?.[0]?.totalRecords ?? 0);

  return {
    notifications: (result[0] ?? []).map(mapNotification),
    pagination: {
      totalRecords,
      currentPage: filters.page,
      totalPages: Math.max(Math.ceil(totalRecords / filters.limit), 1),
      limit: filters.limit,
    },
  };
}

export async function getBusinessUnreadNotificationCountService(
  idBusiness: number,
  idUser: number,
): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_notifications_get_unread_count_business(?, ?)",
    [idBusiness, idUser],
  );
  const result = rows as unknown as NotificationCountRow[][];
  return Number(result[0]?.[0]?.unreadCount ?? 0);
}

export async function getPlatformUnreadNotificationCountService(
  idPlatformUser: number,
): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_notifications_get_unread_count_platform(?)",
    [idPlatformUser],
  );
  const result = rows as unknown as NotificationCountRow[][];
  return Number(result[0]?.[0]?.unreadCount ?? 0);
}

export async function getPlatformRecipientIdByUserIdService(
  idUser: number,
): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT idPlatformUser
       FROM platform_users
      WHERE idUser = ?
        AND is_active = 1
      LIMIT 1`,
    [idUser],
  );
  const idPlatformUser = Number(rows[0]?.idPlatformUser ?? 0);

  if (!idPlatformUser) {
    throw new Error("PLATFORM_USER_NOT_FOUND");
  }

  return idPlatformUser;
}

export async function markBusinessNotificationReadService(
  idBusiness: number,
  idUser: number,
  idNotification: number,
): Promise<void> {
  await pool.query<RowDataPacket[]>(
    "CALL sp_notifications_mark_read_business(?, ?, ?)",
    [idBusiness, idUser, idNotification],
  );
}

export async function markPlatformNotificationReadService(
  idPlatformUser: number,
  idNotification: number,
): Promise<void> {
  await pool.query<RowDataPacket[]>(
    "CALL sp_notifications_mark_read_platform(?, ?)",
    [idPlatformUser, idNotification],
  );
}

export async function markAllBusinessNotificationsReadService(
  idBusiness: number,
  idUser: number,
): Promise<void> {
  await pool.query<RowDataPacket[]>(
    "CALL sp_notifications_mark_all_read_business(?, ?)",
    [idBusiness, idUser],
  );
}

export async function markAllPlatformNotificationsReadService(
  idPlatformUser: number,
): Promise<void> {
  await pool.query<RowDataPacket[]>(
    "CALL sp_notifications_mark_all_read_platform(?)",
    [idPlatformUser],
  );
}

export async function archiveBusinessNotificationService(
  idBusiness: number,
  idUser: number,
  idNotification: number,
): Promise<void> {
  await pool.query<RowDataPacket[]>(
    "CALL sp_notifications_archive_business(?, ?, ?)",
    [idBusiness, idUser, idNotification],
  );
}

export async function archivePlatformNotificationService(
  idPlatformUser: number,
  idNotification: number,
): Promise<void> {
  await pool.query<RowDataPacket[]>(
    "CALL sp_notifications_archive_platform(?, ?)",
    [idPlatformUser, idNotification],
  );
}
