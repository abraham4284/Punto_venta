import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Landmark,
  LogOut,
  Package,
  PackagePlus,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand";
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
import { useAuthStore } from "@/views/businesses-app";
import { useBusinesses } from "@/views/businesses-app/module/businesses/hooks/useBusinesses";

type NavigationChild = {
  title: string;
  url: string;
  permission?: string;
};

type NavigationParent = {
  title: string;
  icon: LucideIcon;
  children: NavigationChild[];
  activePatterns?: RegExp[];
};

type NavigationSection = {
  title: string;
  items: NavigationParent[];
};

const businessTypeLabels: Record<string, string> = {
  MAXIKIOSCO: "Maxikiosco",
  PRODUCTOS: "Venta de productos",
  VENTA_PRODUCTOS: "Venta de productos",
  FINANCIERA: "Financiera",
  KIOSCO: "Kiosco",
  ALMACEN: "Almacén / Despensa",
  MINIMERCADO: "Minimercado",
  SUPERMERCADO: "Supermercado",
  FARMACIA: "Farmacia",
  FERRETERIA: "Ferretería",
  INDUMENTARIA: "Indumentaria",
  TECNOLOGIA: "Tecnología",
  DISTRIBUIDORA: "Distribuidora",
  GASTRONOMIA: "Gastronomía",
  LIBRERIA: "Librería",
  PERFUMERIA: "Perfumería",
  VETERINARIA: "Veterinaria",
  OTRO: "Negocio",
};

const startItem: NavigationChild & { icon: LucideIcon } = {
  title: "Inicio",
  url: "/admin/dashboard",
  icon: BarChart3,
  permission: "dashboard.view",
};

const navigationSections: NavigationSection[] = [
  {
    title: "Operación",
    items: [
      {
        title: "Ventas",
        icon: ShoppingCart,
        activePatterns: [/^\/admin\/sales\/[^/]+$/],
        children: [
          {
            title: "Nueva venta",
            url: "/admin/sales",
            permission: "sales.create",
          },
          {
            title: "Historial",
            url: "/admin/sales/history",
            permission: "sales.view",
          },
        ],
      },
      {
        title: "Compras",
        icon: PackagePlus,
        activePatterns: [/^\/admin\/purchases\/[^/]+$/],
        children: [
          {
            title: "Nueva compra",
            url: "/admin/purchases",
            permission: "purchases.create",
          },
          {
            title: "Historial",
            url: "/admin/purchases/history",
            permission: "purchases.view",
          },
        ],
      },
      {
        title: "Inventario",
        icon: Boxes,
        activePatterns: [/^\/admin\/stock(\/.*)?$/],
        children: [
          {
            title: "Stock",
            url: "/admin/stock",
            permission: "stock.view",
          },
          {
            title: "Movimientos",
            url: "/admin/stock/movements",
            permission: "stock.view_movements",
          },
          {
            title: "Reposición",
            url: "/admin/stock/critical",
            permission: "stock.view_critical",
          },
        ],
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        title: "Productos",
        icon: Package,
        children: [
          {
            title: "Productos",
            url: "/admin/products",
            permission: "products.view",
          },
          {
            title: "Categorías",
            url: "/admin/categories-product",
            permission: "categories.view",
          },
        ],
      },
      {
        title: "Contactos",
        icon: Users,
        children: [
          {
            title: "Clientes",
            url: "/admin/clients",
            permission: "customers.view",
          },
          {
            title: "Proveedores",
            url: "/admin/suppliers",
            permission: "suppliers.view",
          },
        ],
      },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        title: "Caja",
        icon: Landmark,
        activePatterns: [/^\/admin\/cash(\/.*)?$/],
        children: [
          {
            title: "Caja actual",
            url: "/admin/cash",
            permission: "cash_sessions.view",
          },
          {
            title: "Historial",
            url: "/admin/cash/history",
            permission: "cash_sessions.view_history",
          },
          {
            title: "Configuración",
            url: "/admin/cash/registers",
            permission: "cash_registers.view",
          },
        ],
      },
      {
        title: "Configuración",
        icon: Settings,
        children: [
          {
            title: "Negocio",
            url: "/admin/businesses",
            permission: "business.view",
          },
          {
            title: "Depósitos",
            url: "/admin/deposits",
            permission: "deposits.view",
          },
          {
            title: "Métodos de pago",
            url: "/admin/payment-methods",
            permission: "payment_methods.view",
          },
          {
            title: "Usuarios y permisos",
            url: "/admin/users",
            permission: "users.view",
          },
          {
            title: "Suscripción",
            url: "/admin/subscription",
            permission: "subscription.view",
          },
          {
            title: "Legal",
            url: "/admin/legal",
          },
        ],
      },
    ],
  },
];

const getBusinessTypeLabel = (value: string | null | undefined): string => {
  if (!value) return "Negocio";
  return businessTypeLabels[value] ?? value;
};

const hasPermission = (
  permission: string | undefined,
  userRole: string | undefined,
  permissions: string[] | undefined,
) => {
  if (!permission || userRole === "OWNER") return true;
  return permissions?.includes(permission) ?? false;
};

const isDashboardActive = (pathname: string) => {
  return pathname === "/admin/dashboard" || pathname === "/admin/dasbhoard";
};

const isChildActive = (pathname: string, child: NavigationChild) => {
  if (child.url === "/admin/dashboard") {
    return isDashboardActive(pathname);
  }

  return pathname === child.url;
};

const isParentActive = (pathname: string, parent: NavigationParent) => {
  return (
    parent.children.some((child) => isChildActive(pathname, child)) ||
    parent.activePatterns?.some((pattern) => pattern.test(pathname)) ||
    false
  );
};

const getActiveParentTitles = (
  pathname: string,
  sections: NavigationSection[],
) => {
  return sections.flatMap((section) =>
    section.items
      .filter((item) => isParentActive(pathname, item))
      .map((item) => item.title),
  );
};

const getUserInitials = (name: string): string => {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "CJ";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const StartNavItem = ({ item }: { item: typeof startItem }) => {
  const location = useLocation();
  const { setMobileOpen } = useSidebar();
  const Icon = item.icon;
  const isActive = isDashboardActive(location.pathname);

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
          <span className="truncate transition-opacity duration-200 group-data-[state=collapsed]/sidebar-wrapper:lg:hidden">
            {item.title}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

type ParentNavItemProps = {
  item: NavigationParent;
  isOpen: boolean;
  isActive: boolean;
  activeChildUrl: string | null;
  onToggle: () => void;
};

const ParentNavItem = ({
  item,
  isOpen,
  isActive,
  activeChildUrl,
  onToggle,
}: ParentNavItemProps) => {
  const { setMobileOpen } = useSidebar();
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={false}
        tooltip={item.title}
        className={cn(
          isActive &&
            "text-sidebar-accent-foreground ring-1 ring-sidebar-border",
        )}
      >
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={onToggle}
        >
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              isActive ? "text-sidebar-primary" : "text-sidebar-foreground/62",
            )}
          />
          <span
            className={cn(
              "truncate transition-opacity duration-200 group-data-[state=collapsed]/sidebar-wrapper:lg:hidden",
              isActive && "font-semibold",
            )}
          >
            {item.title}
          </span>
          <ChevronRight
            className={cn(
              "ml-auto h-4 w-4 shrink-0 text-sidebar-foreground/45 transition-transform duration-200 group-data-[state=collapsed]/sidebar-wrapper:lg:hidden",
              isOpen && "rotate-90",
            )}
          />
        </button>
      </SidebarMenuButton>

      {isOpen ? (
        <ul className="ml-5 mt-1 space-y-1 border-l border-sidebar-border pl-3 group-data-[state=collapsed]/sidebar-wrapper:lg:hidden">
          {item.children.map((child) => {
            const isChildSelected = activeChildUrl === child.url;

            return (
              <li key={child.url}>
                <Link
                  to={child.url}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex h-8 items-center rounded-md px-3 text-sm text-sidebar-foreground/72 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isChildSelected &&
                      "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                  )}
                >
                  <span className="truncate">{child.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </SidebarMenuItem>
  );
};

export const AppSidebar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { getBusiness, business, resetBusiness } = useBusinesses();
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const displayName =
    user?.name ||
    user?.username ||
    `Usuario ${user?.idUser ?? ""}`.trim();
  const displayRole = user?.role || "Administrador";

  const visibleStartItem = hasPermission(
    startItem.permission,
    user?.role,
    user?.permissions,
  )
    ? startItem
    : null;

  const visibleNavigationSections = useMemo(() => {
    return navigationSections
      .map((section) => ({
        ...section,
        items: section.items
          .map((item) => ({
            ...item,
            children: item.children.filter((child) =>
              hasPermission(child.permission, user?.role, user?.permissions),
            ),
          }))
          .filter((item) => item.children.length > 0),
      }))
      .filter((section) => section.items.length > 0);
  }, [user?.permissions, user?.role]);

  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    getActiveParentTitles(location.pathname, visibleNavigationSections),
  );

  const handleToggleGroup = (title: string) => {
    if (!open) {
      setOpen(true);
    }

    setOpenGroups((current) => {
      if (current.includes(title)) {
        return current.filter((item) => item !== title);
      }

      return [...current, title];
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    getBusiness();
    return () => {
      resetBusiness();
    };
  }, [getBusiness, resetBusiness]);

  useEffect(() => {
    const activeGroups = getActiveParentTitles(
      location.pathname,
      visibleNavigationSections,
    );

    if (activeGroups.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setOpenGroups((current) => {
        const next = Array.from(new Set([...current, ...activeGroups]));
        return next.length === current.length ? current : next;
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, visibleNavigationSections]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex min-w-0 items-center gap-3 group-data-[state=collapsed]/sidebar-wrapper:lg:justify-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <BrandLogo
              variant="isotype"
              tone="white"
              imageClassName="h-7 w-7"
            />
          </div>

          <div className="min-w-0 flex-1 transition-opacity duration-200 group-data-[state=collapsed]/sidebar-wrapper:lg:hidden">
            <p className="truncate text-sm font-semibold">
              {business?.name || "Nombre de la empresa"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/55">
              {getBusinessTypeLabel(business?.businessType)}
            </p>
          </div>

          <SidebarTrigger className="hidden h-9 w-9 shrink-0 rounded-lg border border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent lg:inline-flex group-data-[state=collapsed]/sidebar-wrapper:lg:hidden">
            <ChevronLeft className="h-4 w-4" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {visibleStartItem ? (
          <SidebarGroup>
            <SidebarMenu>
              <StartNavItem item={visibleStartItem} />
            </SidebarMenu>
          </SidebarGroup>
        ) : null}

        {visibleNavigationSections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const activeChild =
                  item.children.find((child) =>
                    isChildActive(location.pathname, child),
                  ) ?? null;

                return (
                  <ParentNavItem
                    key={item.title}
                    item={item}
                    isOpen={openGroups.includes(item.title)}
                    isActive={isParentActive(location.pathname, item)}
                    activeChildUrl={activeChild?.url ?? null}
                    onToggle={() => handleToggleGroup(item.title)}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/45 p-2 group-data-[state=collapsed]/sidebar-wrapper:lg:justify-center">
          {!user ? (
            <>
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-sidebar-foreground/10" />
              <div className="min-w-0 flex-1 space-y-2 transition-opacity duration-200 group-data-[state=collapsed]/sidebar-wrapper:lg:hidden">
                <div className="h-3 w-28 animate-pulse rounded bg-sidebar-foreground/10" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-sidebar-foreground/10" />
              </div>
            </>
          ) : (
            <Link to="/admin/profile" className="flex min-w-0 flex-1 items-center gap-3 group-data-[state=collapsed]/sidebar-wrapper:lg:flex-none">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                {getUserInitials(displayName)}
              </div>

              <div className="min-w-0 flex-1 transition-opacity duration-200 group-data-[state=collapsed]/sidebar-wrapper:lg:hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {displayName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/70">
                  {displayRole}
                </p>
              </div>
            </Link>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Cerrar sesión"
            className="h-9 w-9 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[state=collapsed]/sidebar-wrapper:lg:hidden"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
