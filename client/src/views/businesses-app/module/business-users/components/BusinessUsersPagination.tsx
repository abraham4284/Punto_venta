import { Button } from "@/components/ui/button";
import type { BusinessUsersPagination as PaginationState } from "../types";

type BusinessUsersPaginationProps = {
  pagination: PaginationState;
  onChangePage: (page: number) => void;
};

const getVisiblePages = (currentPage: number, totalPages: number): number[] => {
  const start = Math.max(currentPage - 2, 1);
  const end = Math.min(start + 4, totalPages);
  const adjustedStart = Math.max(end - 4, 1);

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index,
  );
};

export const BusinessUsersPagination = ({
  pagination,
  onChangePage,
}: BusinessUsersPaginationProps) => {
  const pages = getVisiblePages(pagination.currentPage, pagination.totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-card p-3 text-sm text-muted-foreground sm:flex-row">
      <span>
        {pagination.totalRecords} usuarios encontrados - Pagina{" "}
        {pagination.currentPage} de {pagination.totalPages}
      </span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pagination.currentPage <= 1}
          onClick={() => onChangePage(pagination.currentPage - 1)}
        >
          Anterior
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            type="button"
            size="sm"
            variant={page === pagination.currentPage ? "default" : "outline"}
            onClick={() => onChangePage(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pagination.currentPage >= pagination.totalPages}
          onClick={() => onChangePage(pagination.currentPage + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

