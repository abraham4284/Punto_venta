import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden transition-all duration-300">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:hidden">
          <SidebarTrigger className="h-10 w-10 rounded-lg border text-foreground">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
          <div>
            <p className="text-sm font-semibold">Punto de venta</p>
            <p className="text-xs text-muted-foreground">Panel administrativo</p>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 transition-all duration-300 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};
