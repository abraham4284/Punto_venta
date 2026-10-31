import { useState } from "react";
import { Package } from "lucide-react";

export const OrderProductImage = ({ imageUrl, name, className = "size-14" }: { imageUrl: string | null | undefined; name: string; className?: string }) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const style = `${className} shrink-0 rounded-lg border bg-muted object-contain`;
  return imageUrl && failedUrl !== imageUrl
    ? <img src={imageUrl} alt={name} className={style} onError={() => setFailedUrl(imageUrl)} />
    : <span role="img" aria-label={`Sin imagen de ${name}`} className={`${style} flex items-center justify-center text-muted-foreground`}><Package className="size-6" aria-hidden="true" /></span>;
};
