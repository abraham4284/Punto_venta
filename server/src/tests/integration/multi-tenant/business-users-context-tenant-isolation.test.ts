import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { RowDataPacket } from "mysql2";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import {
  querySingleRow,
  resetIntegrationTestData,
} from "@/tests/helpers/test-database.helper.js";
import {
  createTwoTenantScenario,
  type TwoTenantScenario,
} from "@/tests/fixtures/business.fixture.js";
import { createBusinessUserFixture } from "@/tests/fixtures/business-user.fixture.js";
import { createCustomerFixture } from "@/tests/fixtures/customer.fixture.js";
import { createSupplierFixture } from "@/tests/fixtures/supplier.fixture.js";
import {
  expectResponseDoesNotLeak,
  expectTenantBlocked,
  extractArrayFromBody,
} from "@/tests/helpers/tenant-assertions.helper.js";

interface BusinessCustomerRow extends RowDataPacket {
  idBusiness: number;
  first_name: string;
  last_name: string;
}

interface BusinessSupplierRow extends RowDataPacket {
  idBusiness: number;
  name: string;
}

interface BusinessUserStatusRow extends RowDataPacket {
  role: string;
  is_active: number;
}

describe("multi-tenant users, customers, suppliers and tenant context", function suite() {
  let scenario: TwoTenantScenario;

  beforeEach(async function setupScenario() {
    await resetIntegrationTestData();
    scenario = await createTwoTenantScenario();
  });

  it("aisla listado y busqueda de clientes", async function test() {
    const customerA = await createCustomerFixture(
      scenario.tenantA.business.idBusiness,
      "CLIENTE_SECRETO_TENANT_A",
    );
    const customerB = await createCustomerFixture(
      scenario.tenantB.business.idBusiness,
      "CLIENTE_VISIBLE_TENANT_B",
    );

    const list = await request(getTestApp())
      .get("/api/customers")
      .set("Cookie", scenario.tenantB.auth.cookies);
    const search = await request(getTestApp())
      .get(`/api/customers?search=${encodeURIComponent(customerA.fullName)}`)
      .set("Cookie", scenario.tenantB.auth.cookies);

    expect(list.status).toBe(200);
    expect(JSON.stringify(extractArrayFromBody(list.body))).toContain(customerB.fullName);
    expect(JSON.stringify(extractArrayFromBody(list.body))).not.toContain(customerA.fullName);
    expectResponseDoesNotLeak(search, customerA.fullName);
  });

  it("bloquea detalle, edicion y desactivacion de cliente ajeno", async function test() {
    const customerA = await createCustomerFixture(
      scenario.tenantA.business.idBusiness,
      "CLIENTE_SECRETO_TENANT_A",
    );

    const detail = await request(getTestApp())
      .get(`/api/customers/${customerA.idCustomer}`)
      .set("Cookie", scenario.tenantB.auth.cookies);
    const update = await request(getTestApp())
      .put(`/api/customers/${customerA.idCustomer}`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({ firstName: "Cliente alterado" });
    const status = await request(getTestApp())
      .patch(`/api/customers/${customerA.idCustomer}/status`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({ isActive: false });

    expectTenantBlocked(detail);
    expectTenantBlocked(update);
    expectTenantBlocked(status);

    const state = await querySingleRow<BusinessCustomerRow>(
      "SELECT idBusiness, first_name, last_name FROM customers WHERE idCustomer = ?",
      [customerA.idCustomer],
    );

    expect(state?.idBusiness).toBe(scenario.tenantA.business.idBusiness);
    expect(state?.first_name).toBe(customerA.firstName);
    expect(state?.last_name).toBe(customerA.lastName);
  });

  it("ignora idBusiness manipulado al crear cliente", async function test() {
    const response = await request(getTestApp())
      .post("/api/customers")
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({
        idBusiness: scenario.tenantA.business.idBusiness,
        firstName: "Cliente creado por tenant B",
        lastName: "Apellido",
        phone: null,
        email: null,
        address: null,
        observation: null,
      });

    expect(response.status).toBe(201);
    const state = await querySingleRow<BusinessCustomerRow>(
      "SELECT idBusiness, first_name, last_name FROM customers WHERE first_name = ?",
      ["Cliente creado por tenant B"],
    );

    expect(state?.idBusiness).toBe(scenario.tenantB.business.idBusiness);
  });

  it("normaliza documentos, bloquea duplicados por negocio y permite otro tenant", async function test() {
    const body = { firstName: "Ana", lastName: "Perez", documentType: "DNI", documentNumber: "12.345.678" };
    const first = await request(getTestApp()).post("/api/customers").set("Cookie", scenario.tenantA.auth.cookies).send(body);
    expect(first.status).toBe(201);
    expect(first.body.data.documentNumber).toBe("12345678");
    expect(first.body.data.fullName).toBe("Ana Perez");
    expect(first.body.data).not.toHaveProperty("name");
    const duplicate = await request(getTestApp()).post("/api/customers").set("Cookie", scenario.tenantA.auth.cookies).send({ ...body, documentNumber: "12345678" });
    expect(duplicate.status).toBe(400);
    expect(duplicate.body.errors[0].field).toBe("documentNumber");
    const other = await request(getTestApp()).post("/api/customers").set("Cookie", scenario.tenantB.auth.cookies).send(body);
    expect(other.status).toBe(201);

    for (const search of ["Ana Perez", "12.345.678", "12 345 678", "12-345-678"]) {
      const result = await request(getTestApp()).get(`/api/customers?search=${encodeURIComponent(search)}`).set("Cookie", scenario.tenantA.auth.cookies);
      expect(result.status).toBe(200);
      expect(result.body.data).toHaveLength(1);
      expect(result.body.data[0].idCustomer).toBe(first.body.data.idCustomer);
    }
    const another = await createCustomerFixture(scenario.tenantA.business.idBusiness);
    const conflictingUpdate = await request(getTestApp()).put(`/api/customers/${another.idCustomer}`).set("Cookie", scenario.tenantA.auth.cookies).send({ documentType: "DNI", documentNumber: "12.345.678" });
    expect(conflictingUpdate.status).toBe(400);
    const clear = await request(getTestApp()).put(`/api/customers/${first.body.data.idCustomer}`).set("Cookie", scenario.tenantA.auth.cookies).send({ documentType: null, documentNumber: null });
    expect(clear.status).toBe(200);
    expect(clear.body.data).toMatchObject({ documentType: null, documentNumber: null, firstName: "Ana", lastName: "Perez" });
    const assign = await request(getTestApp()).put(`/api/customers/${another.idCustomer}`).set("Cookie", scenario.tenantA.auth.cookies).send({ documentType: "DNI", documentNumber: "12345678" });
    expect(assign.status).toBe(200);
  });

  it("aisla listado y detalle de proveedores", async function test() {
    const supplierA = await createSupplierFixture(
      scenario.tenantA.business.idBusiness,
      "PROVEEDOR_SECRETO_TENANT_A",
    );
    const supplierB = await createSupplierFixture(
      scenario.tenantB.business.idBusiness,
      "PROVEEDOR_VISIBLE_TENANT_B",
    );

    const list = await request(getTestApp())
      .get("/api/suppliers")
      .set("Cookie", scenario.tenantB.auth.cookies);
    const detail = await request(getTestApp())
      .get(`/api/suppliers/${supplierA.idSupplier}`)
      .set("Cookie", scenario.tenantB.auth.cookies);

    expect(list.status).toBe(200);
    expect(JSON.stringify(extractArrayFromBody(list.body))).toContain(supplierB.name);
    expect(JSON.stringify(extractArrayFromBody(list.body))).not.toContain(supplierA.name);
    expectTenantBlocked(detail);
    expectResponseDoesNotLeak(detail, supplierA.name);
  });

  it("ignora idBusiness manipulado al crear proveedor", async function test() {
    const response = await request(getTestApp())
      .post("/api/suppliers")
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({
        idBusiness: scenario.tenantA.business.idBusiness,
        name: "Proveedor creado por tenant B",
        phone: null,
        email: null,
        address: null,
        observation: null,
      });

    expect(response.status).toBe(201);
    const state = await querySingleRow<BusinessSupplierRow>(
      "SELECT idBusiness, name FROM suppliers WHERE name = ?",
      ["Proveedor creado por tenant B"],
    );

    expect(state?.idBusiness).toBe(scenario.tenantB.business.idBusiness);
  });

  it("aisla listado y detalle de usuarios business", async function test() {
    const sellerA = await createBusinessUserFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
    });
    const sellerB = await createBusinessUserFixture({
      idBusiness: scenario.tenantB.business.idBusiness,
    });

    const list = await request(getTestApp())
      .get("/api/business-users")
      .set("Cookie", scenario.tenantB.auth.cookies);
    const detail = await request(getTestApp())
      .get(`/api/business-users/${sellerA.idUser}`)
      .set("Cookie", scenario.tenantB.auth.cookies);

    expect(list.status).toBe(200);
    const body = JSON.stringify(list.body);
    expect(body).toContain(sellerB.username);
    expect(body).not.toContain(sellerA.username);
    expectTenantBlocked(detail);
    expectResponseDoesNotLeak(detail, sellerA.username);
  });

  it("bloquea modificar rol y estado de usuario ajeno", async function test() {
    const sellerA = await createBusinessUserFixture({
      idBusiness: scenario.tenantA.business.idBusiness,
    });

    const role = await request(getTestApp())
      .patch(`/api/business-users/${sellerA.idUser}/role`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({ role: "ADMIN" });
    const status = await request(getTestApp())
      .patch(`/api/business-users/${sellerA.idUser}/status`)
      .set("Cookie", scenario.tenantB.auth.cookies)
      .send({ isActive: false });

    expectTenantBlocked(role);
    expectTenantBlocked(status);

    const state = await querySingleRow<BusinessUserStatusRow>(
      "SELECT role, is_active FROM business_users WHERE idBusiness = ? AND idUser = ?",
      [scenario.tenantA.business.idBusiness, sellerA.idUser],
    );

    expect(state?.role).toBe("SELLER");
    expect(state?.is_active).toBe(1);
  });
});
