import { Button } from "@/components/ui/button";

type Props = {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  onPageChange: (page: number) => void;
};

const getVisiblePages = (
  currentPage: number,
  totalPages: number,
): number[] => {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
};

export const MovementPagination = ({
  currentPage,
  totalPages,
  totalRecords,
  limit,
  onPageChange,
}: Props) => {
  const pages = getVisiblePages(currentPage, totalPages);
  const firstRecord = totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRecord = Math.min(currentPage * limit, totalRecords);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 md:flex-row">
      <p className="text-sm text-muted-foreground">
        Mostrando {firstRecord}-{lastRecord} de {totalRecords} movimientos
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Anterior
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            type="button"
            size="icon"
            variant={page === currentPage ? "default" : "outline"}
            aria-label={`Ir a la pagina ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        <Button
          type="button"
          variant="outline"
          disabled={totalPages === 0 || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};
