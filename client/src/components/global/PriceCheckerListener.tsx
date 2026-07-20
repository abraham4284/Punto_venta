import { useEffect } from "react";
import { usePriceCheckerStore } from "@/store/priceChecker.store";

export const PriceCheckerListener = () => {
  const togglePriceChecker = usePriceCheckerStore(
    (state) => state.togglePriceChecker,
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "F8") return;

      event.preventDefault();
      togglePriceChecker();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [togglePriceChecker]);

  return null;
};
