function removeAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeKey(value: string): string {
  return removeAccents(value)
    .toLowerCase()
    .trim()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function normalizeImportHeader(value: unknown): string {
  const normalized = normalizeKey(String(value ?? ""));
  const aliases: Record<string, string> = {
    codigo: "barcode",
    codigo_barras: "barcode",
    codigo_de_barras: "barcode",
    codigodebarras: "barcode",
    barcode: "barcode",
    barras: "barcode",
    nombre: "name",
    producto: "name",
    name: "name",
    descripcion: "description",
    description: "description",
    url_imagen: "imageUrl",
    imagen: "imageUrl",
    image_url: "imageUrl",
    imageurl: "imageUrl",
    image: "imageUrl",
    categoria: "categoryName",
    categoria_nombre: "categoryName",
    category: "categoryName",
    categoryname: "categoryName",
    category_name: "categoryName",
    deposito: "depositName",
    almacen: "depositName",
    deposit: "depositName",
    depositname: "depositName",
    deposit_name: "depositName",
    precio_costo: "priceCost",
    costo: "priceCost",
    price_cost: "priceCost",
    pricecost: "priceCost",
    precio_venta: "priceSale",
    venta: "priceSale",
    price_sale: "priceSale",
    pricesale: "priceSale",
    precio_mayorista: "priceWholesale",
    mayorista: "priceWholesale",
    price_wholesale: "priceWholesale",
    pricewholesale: "priceWholesale",
    unidad: "unitType",
    tipo_unidad: "unitType",
    unit: "unitType",
    unit_type: "unitType",
    unittype: "unitType",
    stock_minimo: "stockMin",
    stock_min: "stockMin",
    stockmin: "stockMin",
    stock_inicial: "initialStock",
    stock: "initialStock",
    initial_stock: "initialStock",
    initialstock: "initialStock",
    activo: "isActive",
    active: "isActive",
    is_active: "isActive",
    isactive: "isActive",
  };

  return aliases[normalized] ?? normalized;
}
