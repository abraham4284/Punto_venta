import {
  cajoraIsotipoPrimary,
  cajoraIsotipoWhite,
  cajoraLogoPrimary,
  cajoraLogoWhite,
} from "@/assets/brand";
import { cn } from "@/lib/utils";

type BrandLogoVariant = "horizontal" | "isotype";
type BrandLogoTone = "primary" | "white";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  tone?: BrandLogoTone;
  className?: string;
  imageClassName?: string;
};

export const BrandLogo = ({
  variant = "horizontal",
  tone = "primary",
  className,
  imageClassName,
}: BrandLogoProps) => {
  const sourceByVariant = {
    horizontal: tone === "white" ? cajoraLogoWhite : cajoraLogoPrimary,
    isotype: tone === "white" ? cajoraIsotipoWhite : cajoraIsotipoPrimary,
  };

  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src={sourceByVariant[variant]}
        alt="Cajora"
        className={cn(
          variant === "horizontal" ? "h-9 w-auto" : "h-10 w-10",
          "shrink-0 object-contain",
          imageClassName,
        )}
      />
    </span>
  );
};
