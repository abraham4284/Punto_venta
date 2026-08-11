import { Loader2, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLoadingScreenProps {
  message: string;
  description?: string;
  variant?: "fullscreen" | "overlay";
}

export const AppLoadingScreen = ({
  message,
  description,
  variant = "fullscreen",
}: AppLoadingScreenProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-background/95 text-foreground",
        variant === "fullscreen"
          ? "min-h-screen"
          : "fixed inset-0 z-50 backdrop-blur-sm",
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-4 grid w-full max-w-md gap-5 rounded-xl border bg-card p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Store className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            <h2 className="text-base font-semibold">{message}</h2>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
