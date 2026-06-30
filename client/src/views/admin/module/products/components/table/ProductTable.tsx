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
import type { ProductResponse } from "../../types/products.types";

type Props = {
  data: ProductResponse[];
  loading: boolean;
  addDataEdit: (product: ProductResponse | null) => void;
  toggleModal: () => void;
  toggleProductStatus: (
    idProduct: number,
    payload: { isActive: boolean },
  ) => Promise<{ status: boolean; message: string }>;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
};

export const ProductTable = ({
  data,
  loading,
  addDataEdit,
  toggleModal,
  toggleProductStatus,
}: Props) => {
  const handleEdit = (product: ProductResponse) => {
    addDataEdit(product);
    toggleModal();
  };

  const handleToggleStatus = async (product: ProductResponse) => {
    await toggleProductStatus(product.idProduct, {
      isActive: !product.isActive,
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
        No hay productos registrados.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Imagen</TableHead>
          <TableHead>Código</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Costo</TableHead>
          <TableHead>Precio venta</TableHead>
          <TableHead>Stock mínimo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {data.map((product) => (
          <TableRow key={product.idProduct}>
            <TableCell>
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-10 w-10 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                  Sin img
                </div>
              )}
            </TableCell>

            <TableCell>{product.barcode || "-"}</TableCell>

            <TableCell className="font-medium">{product.name}</TableCell>

            <TableCell>{product.categoryName || "-"}</TableCell>

            <TableCell>{formatCurrency(product.priceCost)}</TableCell>

            <TableCell>{formatCurrency(product.priceSale)}</TableCell>

            <TableCell>
              <Badge
                variant={
                  product.stock <= product.stockMin ? "destructive" : "secondary"
                }
              >
                {product.stock} / mín. {product.stockMin}
              </Badge>
            </TableCell>

            <TableCell>
              <Badge variant={product.isActive ? "default" : "destructive"}>
                {product.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>

            <TableCell className="space-x-2 text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleEdit(product)}
              >
                Editar
              </Button>

              <Button
                type="button"
                variant={product.isActive ? "destructive" : "outline"}
                size="sm"
                onClick={() => handleToggleStatus(product)}
              >
                {product.isActive ? "Desactivar" : "Activar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};