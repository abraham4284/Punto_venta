import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlatformAuthStore } from "@/views/platform/module/auth/store/platformAuth.store";
import { cn } from "@/lib/utils";
import { platformNavigationItems } from "./platformNavigationItems";

interface PlatformSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const PlatformSidebar = ({ className, onNavigate }: PlatformSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const platformUser = usePlatformAuthStore((state) => state.platformUser);
  const logoutPlatformAction = usePlatformAuthStore(
    (state) => state.logoutPlatformAction,
  );
  const visibleItems = platformNavigationItems.filter((item) => {
    return platformUser?.platformRole
      ? item.allowedRoles.includes(platformUser.platformRole)
      : false;
  });

  const handleLogout = async () => {
    await logoutPlatformAction();
    navigate("/platform/login", { replace: true });
  };

  return (
    <aside
      className={cn(
        "flex min-h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-[#101828] text-slate-100",
        className,
      )}
    >
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <BrandLogo
              variant="isotype"
              tone="white"
              imageClassName="h-7 w-7"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide">
              Cajora
            </p>
            <p className="truncate text-xs text-slate-400">
              Administracion SaaS
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const itemUrl = new URL(item.href, window.location.origin);
          const isActive =
            location.pathname === itemUrl.pathname &&
            (itemUrl.search === "" ||
              location.search === itemUrl.search ||
              (itemUrl.search === "?section=plans" && location.search === ""));

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                isActive && "bg-primary/15 text-white ring-1 ring-primary/30",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {platformUser?.name || platformUser?.username || "Plataforma"}
              </p>
              <p className="truncate text-xs text-slate-400">
                {platformUser?.email || "Usuario interno"}
              </p>
            </div>
            <Badge className="bg-primary/15 text-white">
              {platformUser?.platformRole || "PLATFORM"}
            </Badge>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="mt-3 w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Cerrar sesion
          </Button>
        </div>
      </div>
    </aside>
  );
};
