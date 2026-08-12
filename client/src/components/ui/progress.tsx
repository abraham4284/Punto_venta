import * as React from "react";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => {
    const normalizedValue = Math.min(Math.max(value, 0), 100);

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-full bg-secondary",
          className,
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(normalizedValue)}
        {...props}
      >
        <div
          className="h-full w-full flex-1 rounded-full bg-primary transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
        />
      </div>
    );
  },
);

Progress.displayName = "Progress";
