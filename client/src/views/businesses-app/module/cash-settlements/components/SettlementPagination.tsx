import { Button } from "@/components/ui/button";
import type { CashSettlementPagination } from "../types";

type SettlementPaginationProps = {
  pagination: CashSettlementPagination;
  onChangePage: (page: number) => void;
};

const getVisiblePages = (currentPage: number, totalPages: number): number[] => {
  const start = Math.max(currentPage - 2, 1);
  const end = Math.min(start + 4, totalPages);
  const normalizedStart = Math.max(end - 4, 1);

  return Array.from(
    { length: end - normalizedStart + 1 },
    (_, index) => normalizedStart + index,
  );
};

export const SettlementPagination = ({
  pagination,
  onChangePage,
}: SettlementPaginationProps) => {
  const pages = getVisiblePages(pagination.currentPage, pagination.totalPages);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {pagination.totalRecords} rendiciones registradas
      </p>
      <div className="flex flex-wrap items-center gap-2">
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
            variant={page === pagination.currentPage ? "default" : "outline"}
            size="sm"
            className="min-w-9"
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
