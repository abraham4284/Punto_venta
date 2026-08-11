import { Loader2 } from "lucide-react";

interface ViewProcessingOverlayProps {
  message: string;
  description?: string;
}

export const ViewProcessingOverlay = ({
  message,
  description,
}: ViewProcessingOverlayProps) => {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-background/80 p-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="grid w-full max-w-sm gap-3 rounded-xl border bg-card p-5 text-center shadow-lg">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{message}</h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
