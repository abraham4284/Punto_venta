import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import type { RowDataPacket } from "mysql2";
import {
  executeInsert,
  querySingleRow,
} from "@/tests/helpers/test-database.helper.js";
import { loginBusinessTestUser } from "@/tests/helpers/business-auth-test.helper.js";

interface IdRow extends RowDataPacket {
  idSubscriptionPlan: number;
}

export interface OperationalBusinessFixture {
  business: {
    idBusiness: number;
    name: string;
    slug: string;
  };
  owner: {
    idUser: number;
    username: string;
    email: string;
    plainPasswordForTest: string;
  };
  auth: {
    cookies: string[];
  };
  defaultDeposit: {
    idDeposit: number;
  };
  defaultCashRegister: {
    idCashRegister: number;
  };
  cashPaymentMethod: {
    idPaymentMethod: number;
  };
}

export interface TwoTenantScenario {
  tenantA: OperationalBusinessFixture;
  tenantB: OperationalBusinessFixture;
}

async function getOrCreateTestSubscriptionPlan(): Promise<number> {
  const existing = await querySingleRow<IdRow>(
    "SELECT idSubscriptionPlan FROM subscription_plans WHERE is_active = 1 ORDER BY idSubscriptionPlan ASC LIMIT 1",
  );

  if (existing) {
    return existing.idSubscriptionPlan;
  }

  return executeInsert(
    `INSERT INTO subscription_plans
      (code, name, description, billing_period, price, currency, trial_days, max_users, max_products, max_deposits, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "TEST_TRIAL",
      "Plan de prueba",
      "Plan creado para tests de integracion",
      "MONTHLY",
      0,
      "ARS",
      30,
      null,
      null,
      null,
      1,
    ],
  );
}

export async function createOperationalBusinessFixture(
  label = "tenant",
): Promise<OperationalBusinessFixture> {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const password = `Test-${suffix}-123`;
  const username = `${label}_${suffix}`;
  const email = `${label}_${suffix}@tenant.test`;
  const businessName = `Negocio ${label} ${suffix}`;
  const businessSlug = `negocio-${label}-${suffix}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const idSubscriptionPlan = await getOrCreateTestSubscriptionPlan();

  const idUser = await executeInsert(
    `INSERT INTO users (name, username, email, password_hash, is_active, must_change_password)
     VALUES (?, ?, ?, ?, 1, 0)`,
    [`Owner ${label}`, username, email, passwordHash],
  );

  const idBusiness = await executeInsert(
    `INSERT INTO businesses (name, slug, business_type, is_active, status)
     VALUES (?, ?, ?, 1, 'ACTIVE')`,
    [businessName, businessSlug, "VENTA_PRODUCTOS"],
  );

  await executeInsert(
    `INSERT INTO business_users (idBusiness, idUser, role, is_active)
     VALUES (?, ?, 'OWNER', 1)`,
    [idBusiness, idUser],
  );

  await executeInsert(
    `INSERT INTO business_subscriptions
      (idBusiness, idSubscriptionPlan, status, starts_at, trial_starts_at, trial_ends_at, auto_renew, cancel_at_period_end)
     VALUES (?, ?, 'TRIAL', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 1, 0)`,
    [idBusiness, idSubscriptionPlan],
  );

  const idDeposit = await executeInsert(
    `INSERT INTO deposits (idBusiness, name, description, is_default, is_active)
     VALUES (?, ?, ?, 1, 1)`,
    [idBusiness, `Deposito principal ${suffix}`, "Deposito fixture"],
  );

  const idCashRegister = await executeInsert(
    `INSERT INTO cash_registers (idBusiness, name, description, is_default, is_active)
     VALUES (?, ?, ?, 1, 1)`,
    [idBusiness, `Caja principal ${suffix}`, "Caja fixture"],
  );

  const idPaymentMethod = await executeInsert(
    `INSERT INTO payment_methods (idBusiness, code, name, affects_cash, is_default, is_active)
     VALUES (?, 'CASH', ?, 1, 1, 1)`,
    [idBusiness, `Efectivo ${suffix}`],
  );

  const auth = await loginBusinessTestUser({ username, password });

  return {
    business: {
      idBusiness,
      name: businessName,
      slug: businessSlug,
    },
    owner: {
      idUser,
      username,
      email,
      plainPasswordForTest: password,
    },
    auth,
    defaultDeposit: {
      idDeposit,
    },
    defaultCashRegister: {
      idCashRegister,
    },
    cashPaymentMethod: {
      idPaymentMethod,
    },
  };
}

export async function createTwoTenantScenario(): Promise<TwoTenantScenario> {
  const tenantA = await createOperationalBusinessFixture("tenant_a");
  const tenantB = await createOperationalBusinessFixture("tenant_b");

  return { tenantA, tenantB };
}
