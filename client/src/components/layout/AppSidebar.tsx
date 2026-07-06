import {
  Archive,
  BarChart3,
  Boxes,
  Building2,
  ChevronLeft,
  CircleDollarSign,
  ClipboardList,
  Factory,
  Layers3,
  LogOut,
  Package,
  PackageSearch,
  ReceiptText,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { peopleNav, productNav, saleNav, stockNav } from "@/navigation";
import { useAuthStore } from "@/views/admin";
import { useBusinesses } from "@/views/admin/module/businesses/hooks/useBusinesses";
import { useEffect } from "react";

type NavigationItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

const iconByRoute: Record<string, LucideIcon> = {
  "/admin/dashboard": BarChart3,
  "/admin/dasbhoard": BarChart3,
  "/admin/businesses": Building2,
  "/admin/clients": Users,
  "/admin/suppliers": Truck,
  "/admin/categories-product": Tags,
  "/admin/products": Package,
  "/admin/deposits": Warehouse,
  "/admin/stock": Boxes,
  "/admin/stock/movements": ClipboardList,
  "/admin/stock/critical": PackageSearch,
  "/admin/sales": ShoppingCart,
  "/admin/sales/history": ReceiptText,
};

const buildItems = (
  links: { title: string; url: string }[],
): NavigationItem[] => {
  return links.map((link) => ({
    title: link.title,
    url: link.url,
    icon: iconByRoute[link.url] ?? Layers3,
  }));
};

const navigationGroups: NavigationGroup[] = [
  {
    title: "General",
    items: [
      {
        title: "Dashboard / Metricas",
        url: "/admin/dashboard",
        icon: BarChart3,
      },
      {
        title: "Configuracion del negocio",
        url: "/admin/businesses",
        icon: Building2,
      },
    ],
  },
  {
    title: "Ventas",
    items: buildItems(saleNav),
  },
  {
    title: "Stock / Inventario",
    items: buildItems(stockNav),
  },
  {
    title: "Productos",
    items: buildItems(productNav),
  },
  {
    title: "Personas",
    items: buildItems(peopleNav),
  },
];

const getActiveUrl = (pathname: string): string | undefined => {
  const allItems = navigationGroups.flatMap((group) => group.items);

  return allItems
    .map((item) => item.url)
    .filter((url) => {
      if (url === "/admin/dashboard") {
        return pathname === url || pathname.startsWith("/admin/dasbhoard");
      }

      return pathname === url || pathname.startsWith(`${url}/`);
    })
    .sort((a, b) => b.length - a.length)[0];
};

const getUserInitials = (name: string): string => {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "PV";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const NavItem = ({ item }: { item: NavigationItem }) => {
  const location = useLocation();
  const { setMobileOpen } = useSidebar();
  const Icon = item.icon;
  const isActive = getActiveUrl(location.pathname) === item.url;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} tooltip={item.title}>
        <Link to={item.url} onClick={() => setMobileOpen(false)}>
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              isActive ? "text-sidebar-primary" : "text-sidebar-foreground/62",
            )}
          />
          <span className="truncate transition-opacity duration-200 group-data-[state=collapsed]/sidebar-wrapper:lg:pointer-events-none group-data-[state=collapsed]/sidebar-wrapper:lg:w-0 group-data-[state=collapsed]/sidebar-wrapper:lg:opacity-0">
            {item.title}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export const AppSidebar = () => {
  const user = useAuthStore((state) => state.user);
  const profileUser = useAuthStore((state) => state.profileUser);
  const profileLoading = useAuthStore((state) => state.profileLoading);
  const fetchUserProfile = useAuthStore((state) => state.fetchUserProfile);
  const logout = useAuthStore((state) => state.logout);
  const { getBusiness, business, resetBusiness } = useBusinesses();
  const navigate = useNavigate();
  const displayName =
    profileUser?.name || profileUser?.username || `Usuario ${user?.idUser ?? ""}`.trim();
  const displayRole = profileUser?.role || user?.role || "Administrador";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    getBusiness();
    return () => {
      resetBusiness();
    };
  }, []);

  useEffect(() => {
    if (!user?.idUser || profileUser || profileLoading) {
      return;
    }

    void fetchUserProfile(user.idUser);
  }, [fetchUserProfile, profileLoading, profileUser, user?.idUser]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Factory className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 transition-opacity duration-200 group-data-[state=collapsed]/sidebar-wrapper:lg:pointer-events-none group-data-[state=collapsed]/sidebar-wrapper:lg:w-0 group-data-[state=collapsed]/sidebar-wrapper:lg:opacity-0">
            <p className="truncate text-sm font-semibold">
              {business?.name || "Nombre de la empresa"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/55">
              {business?.businessType || "RUC de la empresa"}
            </p>
          </div>

          <SidebarTrigger className="hidden h-9 w-9 shrink-0 rounded-lg border border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent lg:inline-flex group-data-[state=collapsed]/sidebar-wrapper:lg:[&_svg]:rotate-180">
            <ChevronLeft className="h-4 w-4" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/45 p-2">
          {profileLoading && !profileUser ? (
            <>
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-sidebar-foreground/10" />
              <div className="min-w-0 flex-1 space-y-2 transition-opacity duration-200 group-data-[state=collapsed]/sidebar-wrapper:lg:hidden">
                <div className="h-3 w-28 animate-pulse rounded bg-sidebar-foreground/10" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-sidebar-foreground/10" />
              </div>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                {getUserInitials(displayName)}
              </div>

              <div className="min-w-0 flex-1 transition-opacity duration-200 group-data-[state=collapsed]/sidebar-wrapper:lg:pointer-events-none group-data-[state=collapsed]/sidebar-wrapper:lg:w-0 group-data-[state=collapsed]/sidebar-wrapper:lg:opacity-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {displayName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/70">
                  {displayRole}
                </p>
              </div>
            </>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Cerrar sesion"
            className="h-9 w-9 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-sidebar-foreground/50 group-data-[state=collapsed]/sidebar-wrapper:lg:justify-center">
          <CircleDollarSign className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate group-data-[state=collapsed]/sidebar-wrapper:lg:hidden">
            Gestion financiera y ventas
          </span>
          <Archive className="hidden h-3.5 w-3.5 shrink-0 group-data-[state=collapsed]/sidebar-wrapper:lg:block" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
