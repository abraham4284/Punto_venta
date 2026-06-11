import { Button } from "@/components/ui/button";
import type { SalesPagination } from "../../types";

type Props = {
  pagination: SalesPagination;
  onPageChange: (page: number) => void;
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

export const PaginationControls = ({ pagination, onPageChange }: Props) => {
  const pages = getPages(pagination.currentPage, pagination.totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
      <p className="text-sm text-muted-foreground">
        {pagination.totalRecords} registros - pagina {pagination.currentPage} de{" "}
        {pagination.totalPages}
      </p>

      <div className="flex items-center gap-2">
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
            variant={page === pagination.currentPage ? "default" : "outline"}
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
  );
};
