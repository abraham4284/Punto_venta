import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { ProductsPagination } from "../../types/products.types";

type Props = {
  pagination: ProductsPagination;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

const getPages = (currentPage: number, totalPages: number): number[] => {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
};

const getResultsLabel = (pagination: ProductsPagination): string => {
  if (pagination.totalRecords === 0) return "Mostrando 0 productos";

  const firstRecord = (pagination.currentPage - 1) * pagination.limit + 1;
  const lastRecord = Math.min(
    pagination.currentPage * pagination.limit,
    pagination.totalRecords,
  );

  return `Mostrando ${firstRecord}-${lastRecord} de ${pagination.totalRecords} productos`;
};

export const ProductPagination = ({
  pagination,
  onPageChange,
  onLimitChange,
}: Props) => {
  const pages = getPages(pagination.currentPage, pagination.totalPages);

  return (
    <div className="flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <span>{getResultsLabel(pagination)}</span>
        <span>
          Pagina {pagination.currentPage} de {pagination.totalPages}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={String(pagination.limit)}
          onValueChange={(value: string | null) => {
            if (value) {
              onLimitChange(Number(value));
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-36">
            <span>{pagination.limit} por pagina</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">20 por pagina</SelectItem>
            <SelectItem value="50">50 por pagina</SelectItem>
            <SelectItem value="100">100 por pagina</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pagination.currentPage <= 1}
            onClick={() => onPageChange(pagination.currentPage - 1)}
          >
            Anterior
          </Button>

          {pages.map((page) => (
            <Button
              key={page}
              type="button"
              size="icon"
              variant={page === pagination.currentPage ? "default" : "outline"}
              aria-current={page === pagination.currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}

          <Button
            type="button"
            variant="outline"
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => onPageChange(pagination.currentPage + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};
