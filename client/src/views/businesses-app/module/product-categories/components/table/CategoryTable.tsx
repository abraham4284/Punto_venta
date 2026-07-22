import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductCategoryResponse } from "../../types/productCategories.types";

type Props = {
  data: ProductCategoryResponse[];
  loading: boolean;
  addDataEdit: (category: ProductCategoryResponse | null) => void;
  toggleModal: () => void;
  toggleProductCategoryStatus: (
    idProductCategory: number,
    payload: { isActive: boolean },
  ) => Promise<{ status: boolean; message: string }>;
};

export const CategoryTable = ({
  data,
  loading,
  addDataEdit,
  toggleModal,
  toggleProductCategoryStatus,
}: Props) => {
  const handleEdit = (category: ProductCategoryResponse) => {
    addDataEdit(category);
    toggleModal();
  };

  const handleToggleStatus = async (category: ProductCategoryResponse) => {
    await toggleProductCategoryStatus(category.idProductCategory, {
      isActive: !category.isActive,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No hay categorías registradas.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Por defecto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {data.map((category) => (
          <TableRow key={category.idProductCategory}>
            <TableCell className="font-medium">{category.name}</TableCell>

            <TableCell>{category.description || "-"}</TableCell>

            <TableCell>
              <Badge variant={category.isDefault ? "default" : "secondary"}>
                {category.isDefault ? "Sí" : "No"}
              </Badge>
            </TableCell>

            <TableCell>
              <Badge variant={category.isActive ? "default" : "destructive"}>
                {category.isActive ? "Activa" : "Inactiva"}
              </Badge>
            </TableCell>

            <TableCell className="space-x-2 text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleEdit(category)}
              >
                Editar
              </Button>

              <Button
                type="button"
                variant={category.isActive ? "destructive" : "outline"}
                size="sm"
                onClick={() => handleToggleStatus(category)}
              >
                {category.isActive ? "Desactivar" : "Activar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};