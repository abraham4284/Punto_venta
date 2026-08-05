import { Readable } from "node:stream";
import express from "express";
import request from "supertest";
import XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { productImportUploadMiddleware } from "@/modules/businesses-app/products/middlewares/product-import-upload.middleware.js";
import { previewProductImportService } from "@/modules/businesses-app/products/services/preview-product-import.service.js";
import { expectErrorResponse } from "@/tests/helpers/test-response.helper.js";

function createUploadTestApp(): express.Express {
  const app = express();

  app.post(
    "/upload",
    productImportUploadMiddleware,
    (_req, res) => {
      res.status(200).json({
        success: true,
      });
    },
  );

  return app;
}

function createWorkbookBuffer(rowCount: number): Buffer {
  const rows = [
    {
      Nombre: "Producto base",
      Categoria: "General",
      Deposito: "Principal",
      "Precio costo": 10,
      "Precio venta": 20,
      "Unidad de medida": "UNIT",
      "Stock minimo": 1,
      "Stock inicial": 1,
    },
  ];

  for (let index = 0; index < rowCount; index += 1) {
    rows.push({
      Nombre: `Producto ${index + 1}`,
      Categoria: "General",
      Deposito: "Principal",
      "Precio costo": 10,
      "Precio venta": 20,
      "Unidad de medida": "UNIT",
      "Stock minimo": 1,
      "Stock inicial": 1,
    });
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  }) as Buffer;
}

function createMulterFile(buffer: Buffer): Express.Multer.File {
  return {
    fieldname: "file",
    originalname: "productos.xlsx",
    encoding: "7bit",
    mimetype:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: buffer.length,
    stream: Readable.from(buffer),
    destination: "",
    filename: "",
    path: "",
    buffer,
  };
}

describe("Seguridad importacion Excel", function importSecuritySuite() {
  it("rechaza archivos con extension invalida", async function testInvalidFileType() {
    const response = await request(createUploadTestApp())
      .post("/upload")
      .attach("file", Buffer.from("contenido"), {
        filename: "productos.txt",
        contentType: "text/plain",
      });

    expectErrorResponse(response, {
      status: 400,
      code: "INVALID_FILE_TYPE",
    });
  });

  it("rechaza archivos que superan el tamano permitido", async function testFileTooLarge() {
    const response = await request(createUploadTestApp())
      .post("/upload")
      .attach("file", Buffer.alloc(1024 * 1024 + 1), {
        filename: "productos.xlsx",
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

    expectErrorResponse(response, {
      status: 413,
      code: "FILE_TOO_LARGE",
    });
  });

  it("rechaza Excel con mas filas que el limite funcional", async function testImportRowLimit() {
    const buffer = createWorkbookBuffer(4);
    const file = createMulterFile(buffer);

    await expect(previewProductImportService(1, 1, file)).rejects.toThrow(
      "IMPORT_ROW_LIMIT_EXCEEDED",
    );
  });
});
