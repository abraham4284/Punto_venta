/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  open: boolean;
  mobileOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

const useSidebar = () => {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar debe usarse dentro de SidebarProvider");
  }

  return context;
};

const SidebarProvider = ({
  defaultOpen = true,
  children,
}: {
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    if (window.innerWidth < 1024) {
      setMobileOpen((current) => !current);
      return;
    }

    setOpen((current) => !current);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        open,
        mobileOpen,
        setOpen,
        setMobileOpen,
        toggleSidebar,
      }}
    >
      <div
        data-slot="sidebar-wrapper"
        data-state={open ? "expanded" : "collapsed"}
        className="group/sidebar-wrapper flex min-h-screen w-full overflow-x-hidden bg-background text-foreground"
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

const Sidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"aside"> & {
  collapsible?: "icon";
}) => {
  const { open, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar navegación"
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        data-slot="sidebar"
        data-state={open ? "expanded" : "collapsed"}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 lg:shadow-none",
          "group-data-[state=collapsed]/sidebar-wrapper:lg:w-[4.75rem]",
          mobileOpen && "translate-x-0",
          className,
        )}
        {...props}
      >
        {children}
      </aside>
    </>
  );
};

const SidebarTrigger = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("text-sidebar-foreground", className)}
      onClick={toggleSidebar}
      {...props}
    >
      {children || <PanelLeft className="h-5 w-5" />}
      <span className="sr-only">Alternar navegación</span>
    </Button>
  );
};

const SidebarHeader = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    data-slot="sidebar-header"
    className={cn("border-b border-sidebar-border p-3", className)}
    {...props}
  />
);

const SidebarContent = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    data-slot="sidebar-content"
    className={cn("flex-1 overflow-y-auto px-3 py-4", className)}
    {...props}
  />
);

const SidebarFooter = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    data-slot="sidebar-footer"
    className={cn("border-t border-sidebar-border p-3", className)}
    {...props}
  />
);

const SidebarGroup = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <section
    data-slot="sidebar-group"
    className={cn("space-y-1.5 py-2", className)}
    {...props}
  />
);

const SidebarGroupLabel = ({
  className,
  ...props
}: React.ComponentProps<"p">) => (
  <p
    data-slot="sidebar-group-label"
    className={cn(
      "px-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/55 transition-opacity duration-200 group-data-[state=collapsed]/sidebar-wrapper:lg:pointer-events-none group-data-[state=collapsed]/sidebar-wrapper:lg:opacity-0",
      className,
    )}
    {...props}
  />
);

const SidebarMenu = ({
  className,
  ...props
}: React.ComponentProps<"ul">) => (
  <ul data-slot="sidebar-menu" className={cn("space-y-1", className)} {...props} />
);

const SidebarMenuItem = ({
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    data-slot="sidebar-menu-item"
    className={cn("group/sidebar-menu-item relative", className)}
    {...props}
  />
);

const SidebarMenuButton = ({
  className,
  children,
  isActive = false,
  tooltip,
}: {
  className?: string;
  children: React.ReactElement<{ className?: string }>;
  isActive?: boolean;
  tooltip?: string;
}) => {
  const child = React.cloneElement(children, {
    className: cn(
      "group/sidebar-button relative flex h-10 w-full items-center gap-3 overflow-hidden rounded-lg px-3 text-sm font-medium text-sidebar-foreground/78 outline-none transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
      "group-data-[state=collapsed]/sidebar-wrapper:lg:h-11 group-data-[state=collapsed]/sidebar-wrapper:lg:justify-center group-data-[state=collapsed]/sidebar-wrapper:lg:px-0",
      isActive &&
        "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border",
      className,
      children.props.className,
    ),
  });

  return (
    <>
      {child}
      {tooltip && (
        <span className="pointer-events-none absolute left-[calc(100%+0.5rem)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-sidebar-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity group-hover/sidebar-menu-item:opacity-100 group-data-[state=collapsed]/sidebar-wrapper:lg:block">
          {tooltip}
        </span>
      )}
    </>
  );
};

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
