import type { ProductUnitType } from "../types/index.js";
import { normalizeImportValue } from "./normalize-import-value.js";

export function parseImportUnitType(value: unknown): ProductUnitType {
  const normalized = normalizeImportValue(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const units: Record<string, ProductUnitType> = {
    unidad: "UNIT",
    unidades: "UNIT",
    unit: "UNIT",
    u: "UNIT",
    kg: "KG",
    kilo: "KG",
    kilos: "KG",
    kilogramo: "KG",
    kilogramos: "KG",
    gramo: "GRAM",
    gramos: "GRAM",
    gram: "GRAM",
    g: "GRAM",
    litro: "LITER",
    litros: "LITER",
    liter: "LITER",
    l: "LITER",
    metro: "METER",
    metros: "METER",
    meter: "METER",
    m: "METER",
  };

  return units[normalized] ?? "UNIT";
}
