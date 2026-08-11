import { Loader2 } from "lucide-react";

interface ViewLoadingStateProps {
  message: string;
  description?: string;
}

export const ViewLoadingState = ({
  message,
  description,
}: ViewLoadingStateProps) => {
  return (
    <div
      className="flex min-h-[320px] items-center justify-center rounded-xl border bg-card/60 p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="grid max-w-md gap-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{message}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
