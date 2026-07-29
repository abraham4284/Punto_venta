import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, ShieldAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlatformAuthStore } from "@/views/platform/module/auth/store/platformAuth.store";
import { PlatformSidebar } from "./PlatformSidebar";

interface PlatformLayoutProps {
  children: ReactNode;
}

export const PlatformLayout = ({ children }: PlatformLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const platformUser = usePlatformAuthStore((state) => state.platformUser);
  const logoutPlatformAction = usePlatformAuthStore(
    (state) => state.logoutPlatformAction,
  );

  const handleLogout = async () => {
    await logoutPlatformAction();
    navigate("/platform/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <PlatformSidebar className="hidden lg:flex" />

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 lg:hidden">
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-5 text-cyan-300" />
                <span className="font-semibold">Panel Plataforma</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-200 hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <PlatformSidebar
              className="min-h-[calc(100vh-65px)] w-full border-r-0"
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/85 px-4 backdrop-blur-xl lg:px-6">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <div>
                <p className="text-sm font-semibold">Panel interno</p>
                <p className="text-xs text-muted-foreground">
                  Control global de la plataforma
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden sm:inline-flex">
                {platformUser?.platformRole || "SUPER_ADMIN"}
              </Badge>
              <Button type="button" variant="outline" onClick={handleLogout}>
                Cerrar sesion
              </Button>
            </div>
          </header>

          <section className="min-w-0 flex-1 p-4 lg:p-8">{children}</section>
        </main>
      </div>
    </div>
  );
};
