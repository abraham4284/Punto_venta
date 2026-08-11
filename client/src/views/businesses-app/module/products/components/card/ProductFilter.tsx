import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { ProductCategoryResponse } from "../../../product-categories/types/productCategories.types";

type Props = {
  value: string;
  idProductCategory: number | null;
  isActive: boolean | null;
  categories: ProductCategoryResponse[];
  onChange: (value: string) => void;
  onCategoryChange: (value: number | null) => void;
  onStatusChange: (value: boolean | null) => void;
};

const getCategoryLabel = (
  categories: ProductCategoryResponse[],
  idProductCategory: number | null,
): string => {
  if (idProductCategory === null) return "Todas las categorias";

  const category = categories.find((item) => {
    return item.idProductCategory === idProductCategory;
  });

  return category?.name ?? "Todas las categorias";
};

const getStatusLabel = (isActive: boolean | null): string => {
  if (isActive === null) return "Todos los estados";
  return isActive ? "Activos" : "Inactivos";
};

export const ProductFilter = ({
  value,
  idProductCategory,
  isActive,
  categories,
  onChange,
  onCategoryChange,
  onStatusChange,
}: Props) => {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_240px_200px]">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar producto por nombre, codigo o descripcion..."
      />

      <Select
        value={idProductCategory === null ? "all" : String(idProductCategory)}
        onValueChange={(value: string | null) => {
          onCategoryChange(value && value !== "all" ? Number(value) : null);
        }}
      >
        <SelectTrigger className="w-full">
          <span>{getCategoryLabel(categories, idProductCategory)}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem
              key={category.idProductCategory}
              value={String(category.idProductCategory)}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={isActive === null ? "all" : isActive ? "active" : "inactive"}
        onValueChange={(value: string | null) => {
          if (value === "active") {
            onStatusChange(true);
            return;
          }

          if (value === "inactive") {
            onStatusChange(false);
            return;
          }

          onStatusChange(null);
        }}
      >
        <SelectTrigger className="w-full">
          <span>{getStatusLabel(isActive)}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="active">Activos</SelectItem>
          <SelectItem value="inactive">Inactivos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
