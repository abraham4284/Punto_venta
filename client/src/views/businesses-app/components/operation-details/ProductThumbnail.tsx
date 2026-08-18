import { Package } from "lucide-react";

type ProductThumbnailProps = {
  imageUrl: string | null | undefined;
  name: string;
};

export const ProductThumbnail = ({ imageUrl, name }: ProductThumbnailProps) => {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-11 w-11 rounded-lg border bg-muted object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
      <Package className="h-5 w-5" />
    </div>
  );
};
