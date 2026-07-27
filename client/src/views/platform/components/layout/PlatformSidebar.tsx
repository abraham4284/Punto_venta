import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CalendarClock,
  CreditCard,
  FileClock,
  LogOut,
  Settings,
  ShieldAlert,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlatformAuthStore } from "@/views/platform/module/auth/store/platformAuth.store";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/platform/dashboard",
    icon: BarChart3,
  },
  {
    label: "Negocios",
    href: "/platform/businesses",
    icon: Building2,
  },
  {
    label: "Planes",
    href: "/platform/subscriptions?section=plans",
    icon: CreditCard,
  },
  {
    label: "Suscripciones",
    href: "/platform/subscriptions?section=subscriptions",
    icon: WalletCards,
  },
  {
    label: "Pagos SaaS",
    href: "/platform/subscriptions?section=payments",
    icon: CalendarClock,
  },
  {
    label: "Auditoria SaaS",
    href: "/platform/subscriptions?section=events",
    icon: FileClock,
  },
  {
    label: "Auditoria",
    href: "/platform/audit",
    icon: ShieldAlert,
  },
  {
    label: "Configuracion",
    href: "/platform/settings",
    icon: Settings,
  },
];

export const PlatformSidebar = () => {
  const location = useLocation();
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
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-800 bg-slate-950 text-slate-100 lg:flex lg:flex-col">
      <div className="border-b border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
            <ShieldAlert className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide">
              MaxiKiosco App
            </p>
            <p className="truncate text-xs text-slate-400">
              Administracion SaaS
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigationItems.map((item) => {
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
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                isActive && "bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-400/20",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
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
            <Badge className="bg-cyan-400/15 text-cyan-100">
              {platformUser?.platformRole || "SUPER_ADMIN"}
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
