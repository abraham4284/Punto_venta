import { beforeEach, describe, expect, it } from "vitest";
import { pool } from "@/db/db.js";
import {
  archiveBusinessNotificationService,
  createBusinessNotification,
  createPlatformNotification,
  getBusinessNotificationsService,
  getBusinessUnreadNotificationCountService,
  getPlatformNotificationsService,
  getPlatformRecipientIdByUserIdService,
  getPlatformUnreadNotificationCountService,
  markAllBusinessNotificationsReadService,
  markBusinessNotificationReadService,
  resolveBusinessNotificationByDeduplicationKey,
} from "@/modules/notifications/services/notifications.service.js";
import {
  executeInsert,
  querySingleRow,
  resetIntegrationTestData,
} from "@/tests/helpers/test-database.helper.js";
import type { RowDataPacket } from "mysql2";

interface Fixture {
  idBusiness: number;
  ownerId: number;
  adminId: number;
  sellerId: number;
  platformUserId: number;
  secondPlatformUserId: number;
}

async function createUser(username: string): Promise<number> {
  return executeInsert(
    `INSERT INTO users (name, username, email, password_hash)
     VALUES (?, ?, ?, ?)`,
    [username, username, `${username}@test.local`, "hash"],
  );
}

async function createFixture(): Promise<Fixture> {
  const idBusiness = await executeInsert(
    `INSERT INTO businesses (name, slug, business_type, status)
     VALUES (?, ?, ?, ?)`,
    ["Negocio Test", "negocio-test", "VENTA_PRODUCTOS", "ACTIVE"],
  );
  const ownerId = await createUser("owner_notifications");
  const adminId = await createUser("admin_notifications");
  const sellerId = await createUser("seller_notifications");
  const platformBaseUserId = await createUser("platform_notifications");
  const secondPlatformBaseUserId = await createUser("platform_two_notifications");

  await pool.query(
    `INSERT INTO business_users (idBusiness, idUser, role, is_active)
     VALUES (?, ?, 'OWNER', 1), (?, ?, 'ADMIN', 1), (?, ?, 'SELLER', 1)`,
    [idBusiness, ownerId, idBusiness, adminId, idBusiness, sellerId],
  );

  const platformUserId = await executeInsert(
    `INSERT INTO platform_users (idUser, role, is_active)
     VALUES (?, 'SUPER_ADMIN', 1)`,
    [platformBaseUserId],
  );
  const secondPlatformUserId = await executeInsert(
    `INSERT INTO platform_users (idUser, role, is_active)
     VALUES (?, 'SUPPORT', 1)`,
    [secondPlatformBaseUserId],
  );

  return {
    idBusiness,
    ownerId,
    adminId,
    sellerId,
    platformUserId,
    secondPlatformUserId,
  };
}

async function createOwnerNotification(fixture: Fixture): Promise<number | null> {
  return createBusinessNotification({
    idBusiness: fixture.idBusiness,
    type: "BUSINESS_USER_CREATED",
    severity: "INFO",
    title: "Usuario creado",
    message: "Se creo un usuario",
    roles: ["OWNER"],
    metadata: { test: true },
  });
}

beforeEach(async function resetData() {
  await resetIntegrationTestData();
});

describe("notifications integration", function suite() {
  it("crea una notificacion business para roles definidos", async function test() {
    const fixture = await createFixture();
    const idNotification = await createOwnerNotification(fixture);

    expect(idNotification).toBeGreaterThan(0);
  });

  it("lista notificaciones del usuario destinatario", async function test() {
    const fixture = await createFixture();
    await createOwnerNotification(fixture);

    const result = await getBusinessNotificationsService(
      fixture.idBusiness,
      fixture.ownerId,
      { page: 1, limit: 15, offset: 0 },
    );

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].title).toBe("Usuario creado");
  });

  it("no expone notificaciones business a usuarios no destinatarios", async function test() {
    const fixture = await createFixture();
    await createOwnerNotification(fixture);

    const result = await getBusinessNotificationsService(
      fixture.idBusiness,
      fixture.sellerId,
      { page: 1, limit: 15, offset: 0 },
    );

    expect(result.notifications).toHaveLength(0);
  });

  it("calcula contador unread business", async function test() {
    const fixture = await createFixture();
    await createOwnerNotification(fixture);

    const count = await getBusinessUnreadNotificationCountService(
      fixture.idBusiness,
      fixture.ownerId,
    );

    expect(count).toBe(1);
  });

  it("marca una notificacion business como leida", async function test() {
    const fixture = await createFixture();
    const idNotification = await createOwnerNotification(fixture);

    await markBusinessNotificationReadService(
      fixture.idBusiness,
      fixture.ownerId,
      Number(idNotification),
    );

    const count = await getBusinessUnreadNotificationCountService(
      fixture.idBusiness,
      fixture.ownerId,
    );

    expect(count).toBe(0);
  });

  it("marca todas las notificaciones business como leidas", async function test() {
    const fixture = await createFixture();
    await createBusinessNotification({
      idBusiness: fixture.idBusiness,
      type: "STOCK_CRITICAL",
      severity: "WARNING",
      title: "Stock critico",
      message: "Producto con bajo stock",
      roles: ["OWNER"],
    });
    await createOwnerNotification(fixture);

    await markAllBusinessNotificationsReadService(
      fixture.idBusiness,
      fixture.ownerId,
    );

    const count = await getBusinessUnreadNotificationCountService(
      fixture.idBusiness,
      fixture.ownerId,
    );

    expect(count).toBe(0);
  });

  it("archiva una notificacion business sin eliminar el registro", async function test() {
    const fixture = await createFixture();
    const idNotification = await createOwnerNotification(fixture);

    await archiveBusinessNotificationService(
      fixture.idBusiness,
      fixture.ownerId,
      Number(idNotification),
    );

    const result = await getBusinessNotificationsService(
      fixture.idBusiness,
      fixture.ownerId,
      { page: 1, limit: 15, offset: 0 },
    );
    const row = await querySingleRow<RowDataPacket>(
      "SELECT COUNT(*) AS total FROM notifications WHERE idNotification = ?",
      [idNotification],
    );

    expect(result.notifications).toHaveLength(0);
    expect(Number(row?.total ?? 0)).toBe(1);
  });

  it("deduplica notificaciones activas por clave", async function test() {
    const fixture = await createFixture();
    const payload = {
      idBusiness: fixture.idBusiness,
      type: "STOCK_OUT" as const,
      severity: "ERROR" as const,
      title: "Sin stock",
      message: "Producto sin stock",
      roles: ["OWNER" as const],
      deduplicationKey: "STOCK_OUT:B1:P1:D1",
    };

    const first = await createBusinessNotification(payload);
    const second = await createBusinessNotification(payload);

    expect(second).toBe(first);
  });

  it("resuelve notificaciones por deduplication key", async function test() {
    const fixture = await createFixture();
    await createBusinessNotification({
      idBusiness: fixture.idBusiness,
      type: "STOCK_OUT",
      severity: "ERROR",
      title: "Sin stock",
      message: "Producto sin stock",
      roles: ["OWNER"],
      deduplicationKey: "STOCK_OUT:B1:P1:D1",
    });

    await resolveBusinessNotificationByDeduplicationKey(
      fixture.idBusiness,
      "STOCK_OUT:B1:P1:D1",
    );

    const result = await getBusinessNotificationsService(
      fixture.idBusiness,
      fixture.ownerId,
      { page: 1, limit: 15, offset: 0 },
    );

    expect(result.notifications).toHaveLength(0);
  });

  it("filtra notificaciones business por severidad", async function test() {
    const fixture = await createFixture();
    await createOwnerNotification(fixture);
    await createBusinessNotification({
      idBusiness: fixture.idBusiness,
      type: "STOCK_OUT",
      severity: "ERROR",
      title: "Sin stock",
      message: "Producto sin stock",
      roles: ["OWNER"],
    });

    const result = await getBusinessNotificationsService(
      fixture.idBusiness,
      fixture.ownerId,
      { page: 1, limit: 15, offset: 0, severity: "ERROR" },
    );

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].severity).toBe("ERROR");
  });

  it("filtra notificaciones business no leidas", async function test() {
    const fixture = await createFixture();
    const idNotification = await createOwnerNotification(fixture);
    await createBusinessNotification({
      idBusiness: fixture.idBusiness,
      type: "STOCK_CRITICAL",
      severity: "WARNING",
      title: "Stock critico",
      message: "Producto con bajo stock",
      roles: ["OWNER"],
    });
    await markBusinessNotificationReadService(
      fixture.idBusiness,
      fixture.ownerId,
      Number(idNotification),
    );

    const result = await getBusinessNotificationsService(
      fixture.idBusiness,
      fixture.ownerId,
      { page: 1, limit: 15, offset: 0, unreadOnly: true },
    );

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].isRead).toBe(false);
  });

  it("pagina notificaciones business con totalRecords", async function test() {
    const fixture = await createFixture();
    await createOwnerNotification(fixture);
    await createBusinessNotification({
      idBusiness: fixture.idBusiness,
      type: "STOCK_CRITICAL",
      severity: "WARNING",
      title: "Stock critico",
      message: "Producto con bajo stock",
      roles: ["OWNER"],
    });

    const result = await getBusinessNotificationsService(
      fixture.idBusiness,
      fixture.ownerId,
      { page: 1, limit: 1, offset: 0 },
    );

    expect(result.notifications).toHaveLength(1);
    expect(result.pagination.totalRecords).toBe(2);
    expect(result.pagination.totalPages).toBe(2);
  });

  it("resuelve idPlatformUser desde idUser autenticado", async function test() {
    const fixture = await createFixture();
    const idUserRow = await querySingleRow<RowDataPacket>(
      "SELECT idUser FROM platform_users WHERE idPlatformUser = ?",
      [fixture.platformUserId],
    );

    const idPlatformUser = await getPlatformRecipientIdByUserIdService(
      Number(idUserRow?.idUser),
    );

    expect(idPlatformUser).toBe(fixture.platformUserId);
  });

  it("crea y lista notificaciones platform", async function test() {
    const fixture = await createFixture();
    await createPlatformNotification({
      type: "SUBSCRIPTION_PAST_DUE",
      severity: "WARNING",
      title: "Pago vencido",
      message: "Hay un negocio con pago vencido",
      platformUserIds: [fixture.platformUserId],
    });

    const result = await getPlatformNotificationsService(
      fixture.platformUserId,
      { page: 1, limit: 15, offset: 0 },
    );
    const count = await getPlatformUnreadNotificationCountService(
      fixture.platformUserId,
    );

    expect(result.notifications).toHaveLength(1);
    expect(count).toBe(1);
  });

  it("aisla notificaciones platform por destinatario", async function test() {
    const fixture = await createFixture();
    await createPlatformNotification({
      type: "SUBSCRIPTION_PAST_DUE",
      severity: "WARNING",
      title: "Pago vencido",
      message: "Hay un negocio con pago vencido",
      platformUserIds: [fixture.platformUserId],
    });

    const result = await getPlatformNotificationsService(
      fixture.secondPlatformUserId,
      { page: 1, limit: 15, offset: 0 },
    );

    expect(result.notifications).toHaveLength(0);
  });
});
