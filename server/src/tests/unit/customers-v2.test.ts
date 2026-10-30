import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { Request, Response } from "express";
import { createCustomerSchema, updateCustomerSchema, customerSearchSchema } from "../../modules/businesses-app/customers/validations/customers.validations.js";
import { mapCustomer } from "../../modules/businesses-app/customers/helpers/customer.mapper.js";
import { normalizeCustomerDocument } from "../../modules/businesses-app/customers/helpers/customer-document.helper.js";
import type { CustomerDbRow, CustomerDocumentType } from "../../modules/businesses-app/customers/types/index.js";

const { query } = vi.hoisted(function mocks() { return { query: vi.fn() }; });
vi.mock("@/db/db.js", function mockDatabase() { return { pool: { query } }; });
import { createCustomerService, updateCustomerService, getCustomersService } from "../../modules/businesses-app/customers/services/customers.service.js";
import { createCustomerController, getCustomersController, updateCustomerController } from "../../modules/businesses-app/customers/controllers/customers.controller.js";

const base = { idBusiness: 7, firstName: "Juan Carlos", lastName: "De la Vega" };
const row: CustomerDbRow = {
  idCustomer: 3, idBusiness: 7, first_name: base.firstName, last_name: base.lastName,
  document_type: null, document_number: null, phone: null, email: null,
  address: null, observation: null, is_active: 1, created_at: new Date(), updated_at: null,
};

function responseMock() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

describe("Customers v2 DB-free", function suite() {
  beforeEach(function reset() { query.mockReset(); query.mockResolvedValue([[[row]]]); });

  it.each<[CustomerDocumentType, string, string]>([
    ["DNI", " 00.123.456 ", "00123456"],
    ["CUIL", "20-12345678-3", "20123456783"],
    ["CUIT", "20 12345678 3", "20123456783"],
    ["PASSPORT", " ab-123 ", "AB-123"],
    ["OTHER", " ref 123-a ", "REF 123-A"],
  ])("normaliza %s sin convertir a numero", function test(type, value, expected) {
    expect(normalizeCustomerDocument(type, value)).toBe(expected);
    expect(createCustomerSchema.parse({ ...base, documentType: type, documentNumber: value }).documentNumber).toBe(expected);
  });

  it("deriva fullName y no devuelve name", function test() {
    expect(mapCustomer(row)).toMatchObject({ firstName: base.firstName, lastName: base.lastName, fullName: "Juan Carlos De la Vega", isActive: true });
    expect(mapCustomer(row)).not.toHaveProperty("name");
  });

  it("acepta nombres no restrictivos, documento omitido y null", function test() {
    expect(createCustomerSchema.parse({ ...base, firstName: "  Jose Maria  ", lastName: "O'Connor-Silva" }).firstName).toBe("Jose Maria");
    expect(createCustomerSchema.safeParse({ ...base, documentType: null, documentNumber: null }).success).toBe(true);
    expect(createCustomerSchema.parse({ ...base, phone: "  ", email: " " })).toMatchObject({ phone: null, email: null });
  });

  it.each([
    { documentType: "DNI" }, { documentNumber: "123" },
    { documentType: "DNI", documentNumber: null },
    { documentType: null, documentNumber: "123" },
    { documentType: "DNI", documentNumber: "12X3" },
    { documentType: "DNI", documentNumber: "...--" },
    { documentType: "OTHER", documentNumber: "a".repeat(51) },
    { documentType: "INVALID", documentNumber: "123" },
  ])("rechaza documento invalido %j", function test(document) {
    expect(createCustomerSchema.safeParse({ ...base, ...document }).success).toBe(false);
  });

  it("valida longitud despues de normalizar", function test() {
    expect(createCustomerSchema.parse({ ...base, documentType: "DNI", documentNumber: "1.".repeat(50) }).documentNumber).toHaveLength(50);
  });

  it.each([{ documentType: null }, { documentNumber: null }, { documentType: "DNI" }, { documentNumber: "123" }])("update rechaza par incompleto %j", function test(document) {
    expect(updateCustomerSchema.safeParse({ idBusiness: 7, idCustomer: 3, ...document }).success).toBe(false);
  });

  it("update permite conservar o limpiar explicitamente", function test() {
    const update = updateCustomerSchema.parse({ idBusiness: 7, idCustomer: 3, firstName: "Maria" });
    expect(update).not.toHaveProperty("documentType");
    expect(updateCustomerSchema.parse({ idBusiness: 7, idCustomer: 3, documentType: null, documentNumber: null })).toMatchObject({ documentType: null, documentNumber: null });
    expect(updateCustomerSchema.safeParse({ idBusiness: 7, idCustomer: 3 }).success).toBe(false);
  });

  it("rechaza name legacy, nombres cortos y campos desconocidos", function test() {
    expect(createCustomerSchema.safeParse({ ...base, name: "Legacy" }).success).toBe(false);
    expect(createCustomerSchema.safeParse({ ...base, firstName: "x" }).success).toBe(false);
    expect(createCustomerSchema.safeParse({ ...base, lastName: "x".repeat(121) }).success).toBe(false);
  });

  it("valida search opcional sin permitir query tenant", function test() {
    expect(customerSearchSchema.parse({})).toEqual({});
    expect(customerSearchSchema.parse({ search: "  Juan  " })).toEqual({ search: "Juan" });
    for (const search of ["", " ", "a".repeat(161), ["Juan"], { name: "Juan" }]) {
      expect(customerSearchSchema.safeParse({ search }).success).toBe(false);
    }
    expect(customerSearchSchema.safeParse({ idBusiness: 9 }).success).toBe(false);
  });

  it("mapea todos los argumentos de create", async function test() {
    await createCustomerService({ ...base, documentType: "DNI", documentNumber: "123" });
    expect(query).toHaveBeenCalledWith("CALL sp_create_customer(?, ?, ?, ?, ?, ?, ?, ?, ?)", [7, base.firstName, base.lastName, "DNI", "123", null, null, null, null]);
  });

  it("update usa flags para conservar o limpiar sin lectura previa", async function test() {
    await updateCustomerService({ idBusiness: 7, idCustomer: 3, firstName: "Maria" });
    expect(query.mock.calls[0]?.[1]).toEqual([7, 3, "Maria", null, null, null, 0, null, 0, null, 0, null, 0, null, 0]);
    await updateCustomerService({ idBusiness: 7, idCustomer: 3, documentType: null, documentNumber: null, phone: null });
    expect(query.mock.calls[1]?.[1]).toEqual([7, 3, null, null, null, null, 1, null, 1, null, 0, null, 0, null, 0]);
  });

  it("pasa search al procedure y null cuando se omite", async function test() {
    await getCustomersService(7, "12.345.678");
    expect(query).toHaveBeenLastCalledWith("CALL sp_get_customers(?, ?)", [7, "12.345.678"]);
    await getCustomersService(7);
    expect(query).toHaveBeenLastCalledWith("CALL sp_get_customers(?, ?)", [7, null]);
  });

  it("controller toma el tenant del token", async function test() {
    const res = responseMock();
    await createCustomerController({ body: { ...base, idBusiness: 999 }, user: { idBusiness: 7 } } as Request, res as unknown as Response);
    expect(query.mock.calls[0]?.[1]?.[0]).toBe(7);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("controller devuelve errores de search por campo sin consultar DB", async function test() {
    const res = responseMock();
    await getCustomersController({ query: { search: " " }, user: { idBusiness: 7 } } as unknown as Request, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors: [expect.objectContaining({ field: "search" })] }));
    expect(query).not.toHaveBeenCalled();
  });

  it.each(["create", "update"])("%s convierte UNIQUE duplicada en error de documento", async function test(operation) {
    query.mockRejectedValue({ code: "ER_DUP_ENTRY", sqlMessage: "Duplicate entry for key uk_customers_business_document" });
    const res = responseMock();
    const req = { body: { ...base }, params: { id: "3" }, user: { idBusiness: 7 } } as unknown as Request;
    await (operation === "create" ? createCustomerController : updateCustomerController)(req, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors: [{ field: "documentNumber", message: "Ya existe un cliente con ese documento" }] }));
  });

  it("schema mantiene PK/FK tenant, indices y no persiste name/fullName", function test() {
    const tables = readFileSync(new URL("../../db/schema/002_create_tables.sql", import.meta.url), "utf8");
    const customerTable = tables.split("CREATE TABLE IF NOT EXISTS `customers` (")[1]?.split("CREATE TABLE IF NOT EXISTS")[0];
    expect(customerTable).toContain("`first_name` varchar(120)");
    expect(customerTable).toContain("`last_name` varchar(120)");
    expect(customerTable).not.toMatch(/`(?:name|full_name|fullName)`/);
    const indexes = readFileSync(new URL("../../db/schema/003_add_indexes.sql", import.meta.url), "utf8");
    expect(indexes).toContain("uk_customer_business_id");
    expect(indexes).toContain("uk_customers_business_document");
    expect(indexes).toContain("idx_customers_business_last_first");
    expect(indexes).not.toContain("idx_customers_business_name");
    const fks = readFileSync(new URL("../../db/schema/004_add_foreign_keys.sql", import.meta.url), "utf8");
    expect(fks).toContain("FOREIGN KEY (`idBusiness`, `idCustomer`) REFERENCES `customers` (`idBusiness`, `idCustomer`)");
  });

  it("SQL de consumidores conserva aliases y elimina referencias legacy", function test() {
    for (const file of ["sales", "tickets", "cash_settlements", "dashboard", "platform_businesses"]) {
      const sql = readFileSync(new URL(`../../db/procedures/${file}.sql`, import.meta.url), "utf8");
      expect(sql).not.toMatch(/\b(?:c|customer)\.name\b/);
      expect(sql).toMatch(/AS customer(?:Name|_name)/);
      expect(sql).toContain("CONCAT_WS(' ',");
    }
  });

  it("migracion exige autorizacion para convertir datos de prueba sin borrar relaciones", function test() {
    const sql = readFileSync(new URL("../../db/manual/002_customers_v2.sql", import.meta.url), "utf8");
    expect(sql.indexOf("SIGNAL SQLSTATE")).toBeLessThan(sql.indexOf("ALTER TABLE"));
    expect(sql).toContain("COALESCE(p_allow_test_data, 0) <> 1");
    expect(sql).toContain("CALL sp_migrate_customers_v2(1)");
    expect(sql).toContain("WHERE idCustomer = ?");
    expect(sql).toContain("Sin apellido");
    expect(sql).not.toMatch(/DELETE FROM|TRUNCATE TABLE|DROP TABLE|SUBSTRING_INDEX/i);
  });
});
