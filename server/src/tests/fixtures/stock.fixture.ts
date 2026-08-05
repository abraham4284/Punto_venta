import {
  executeInsert,
  executeMutation,
  querySingleRow,
} from "@/tests/helpers/test-database.helper.js";
import type { RowDataPacket } from "mysql2";

interface StockRow extends RowDataPacket {
  idStock: number;
}

export async function ensureStockFixture(input: {
  idBusiness: number;
  idProduct: number;
  idDeposit: number;
  quantity: number;
}): Promise<void> {
  const existing = await querySingleRow<StockRow>(
    "SELECT idStock FROM stock WHERE idBusiness = ? AND idProduct = ? AND idDeposit = ?",
    [input.idBusiness, input.idProduct, input.idDeposit],
  );

  if (existing) {
    await executeMutation(
      "UPDATE stock SET quantity = ?, updated_at = NOW() WHERE idStock = ?",
      [input.quantity, existing.idStock],
    );
    return;
  }

  await executeInsert(
    "INSERT INTO stock (idBusiness, idProduct, idDeposit, quantity, updated_at) VALUES (?, ?, ?, ?, NOW())",
    [input.idBusiness, input.idProduct, input.idDeposit, input.quantity],
  );
}
