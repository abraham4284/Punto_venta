import { useEffect } from "react";
import { toast } from "react-hot-toast";

interface UseSalesHotkeysProps {
  onOpenSearch: () => void;
  onFinalizeSale: () => void;
  isCartEmpty: boolean;
  isLoading: boolean;
}

export const useSalesHotkeys = ({
  onOpenSearch,
  onFinalizeSale,
  isCartEmpty,
  isLoading,
}: UseSalesHotkeysProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onOpenSearch();
      }

      if (event.key === "F9") {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (isLoading) {
          toast("La venta se esta procesando. Espera a que finalice.", {
            id: "sale-processing-warning",
          });
          return;
        }

        if (!isCartEmpty && !isLoading) {
          onFinalizeSale();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isCartEmpty, isLoading, onFinalizeSale, onOpenSearch]);
};
