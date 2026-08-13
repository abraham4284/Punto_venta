import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Sheet = ({ ...props }: DialogPrimitive.Root.Props) => {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
};

const SheetTrigger = ({ ...props }: DialogPrimitive.Trigger.Props) => {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
};

const SheetPortal = ({ ...props }: DialogPrimitive.Portal.Props) => {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />;
};

const SheetClose = ({ ...props }: DialogPrimitive.Close.Props) => {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
};

const SheetOverlay = ({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) => {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/20 duration-150 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0",
        className,
      )}
      {...props}
    />
  );
};

const SheetContent = ({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  side?: "right" | "left";
  showCloseButton?: boolean;
}) => {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed top-0 z-50 flex h-dvh w-full max-w-md flex-col bg-background p-4 text-foreground shadow-xl duration-200 outline-none data-closed:animate-out data-open:animate-in sm:max-w-lg",
          side === "right"
            ? "right-0 data-closed:slide-out-to-right data-open:slide-in-from-right"
            : "left-0 data-closed:slide-out-to-left data-open:slide-in-from-left",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute right-3 top-3"
                size="icon-sm"
                aria-label="Cerrar panel"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Cerrar panel</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </SheetPortal>
  );
};

const SheetHeader = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-2 pr-9", className)}
      {...props}
    />
  );
};

const SheetFooter = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("-mx-4 -mb-4 mt-auto border-t bg-muted/40 p-4", className)}
      {...props}
    />
  );
};

const SheetTitle = ({ className, ...props }: DialogPrimitive.Title.Props) => {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-lg font-semibold leading-none", className)}
      {...props}
    />
  );
};

const SheetDescription = ({
  className,
  ...props
}: DialogPrimitive.Description.Props) => {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
};

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
