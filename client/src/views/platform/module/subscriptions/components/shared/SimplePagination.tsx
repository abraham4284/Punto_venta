import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "../../types/subscriptions.types";

interface SimplePaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

const getVisiblePages = (currentPage: number, totalPages: number) => {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export const SimplePagination = ({
  pagination,
  onPageChange,
  disabled = false,
}: SimplePaginationProps) => {
  const pages = getVisiblePages(pagination.currentPage, pagination.totalPages);

  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {pagination.totalRecords} registros - Pagina {pagination.currentPage} de{" "}
        {pagination.totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || pagination.currentPage <= 1}
          onClick={() => onPageChange(pagination.currentPage - 1)}
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            type="button"
            variant={page === pagination.currentPage ? "default" : "outline"}
            size="sm"
            disabled={disabled}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || pagination.currentPage >= pagination.totalPages}
          onClick={() => onPageChange(pagination.currentPage + 1)}
        >
          Siguiente
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};
