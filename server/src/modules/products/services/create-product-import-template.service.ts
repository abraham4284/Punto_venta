import XLSX from "xlsx";

export function createProductImportTemplateService(): Buffer {
  const workbook = XLSX.utils.book_new();

  const productsRows = [
    {
      barcode: "7791234567890",
      name: "Coca-Cola 2.25 L",
      description: "Gaseosa retornable",
      imageUrl: "",
      categoryName: "Bebidas",
      depositName: "Deposito Central",
      priceCost: 1500,
      priceSale: 2500,
      priceWholesale: "",
      unitType: "UNIDAD",
      stockMin: 5,
      initialStock: 30,
      isActive: "SI",
    },
    {
      barcode: "0001234567895",
      name: "Queso cremoso",
      description: "Venta por kilogramo",
      imageUrl: "",
      categoryName: "Fiambreria",
      depositName: "Deposito Central",
      priceCost: 4200,
      priceSale: 6900,
      priceWholesale: "",
      unitType: "KG",
      stockMin: 1,
      initialStock: 0,
      isActive: "SI",
    },
  ];

  const instructionRows = [
    { regla: "No modificar nombres de columnas", detalle: "El sistema normaliza variantes, pero se recomienda conservar la plantilla." },
    { regla: "Codigo de barras", detalle: "Cargar como texto para preservar ceros a la izquierda." },
    { regla: "Categorias y depositos", detalle: "Deben existir y estar activos en el comercio autenticado." },
    { regla: "Stock inicial", detalle: "Puede ser 0. Solo genera movimiento de stock si es mayor a 0." },
    { regla: "Multi-tenant", detalle: "El negocio y usuario se toman de la sesion, nunca del Excel." },
  ];

  const allowedRows = [
    { tipo: "Unidades", valores: "UNIDAD, KG, GRAMO, LITRO, METRO" },
    { tipo: "Booleanos", valores: "SI, NO, 1, 0, TRUE, FALSE" },
    { tipo: "Modo", valores: "CREATE_ONLY, UPDATE_EXISTING" },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(productsRows),
    "Productos",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(instructionRows),
    "Instrucciones",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(allowedRows),
    "Valores Permitidos",
  );

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  }) as Buffer;
}
