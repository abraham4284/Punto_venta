import {
  BarChart3,
  Building2,
  CalendarClock,
  CreditCard,
  FileClock,
  ShieldAlert,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PlatformRole } from "@/views/platform/module/auth/types";

export interface PlatformNavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: PlatformRole[];
}

export const platformNavigationItems: PlatformNavigationItem[] = [
  {
    label: "Dashboard",
    href: "/platform/dashboard",
    icon: BarChart3,
    allowedRoles: ["SUPER_ADMIN", "SUPPORT", "ANALYST"],
  },
  {
    label: "Negocios",
    href: "/platform/businesses",
    icon: Building2,
    allowedRoles: ["SUPER_ADMIN", "SUPPORT", "ANALYST"],
  },
  {
    label: "Planes",
    href: "/platform/subscriptions?section=plans",
    icon: CreditCard,
    allowedRoles: ["SUPER_ADMIN", "SUPPORT", "ANALYST"],
  },
  {
    label: "Suscripciones",
    href: "/platform/subscriptions?section=subscriptions",
    icon: WalletCards,
    allowedRoles: ["SUPER_ADMIN", "SUPPORT", "ANALYST"],
  },
  {
    label: "Pagos SaaS",
    href: "/platform/subscriptions?section=payments",
    icon: CalendarClock,
    allowedRoles: ["SUPER_ADMIN", "SUPPORT", "ANALYST"],
  },
  {
    label: "Auditoria SaaS",
    href: "/platform/subscriptions?section=events",
    icon: FileClock,
    allowedRoles: ["SUPER_ADMIN", "SUPPORT", "ANALYST"],
  },
  {
    label: "Auditoria Platform",
    href: "/platform/audit",
    icon: ShieldAlert,
    allowedRoles: ["SUPER_ADMIN", "ANALYST"],
  },
  {
    label: "Usuarios Platform",
    href: "/platform/users",
    icon: Users,
    allowedRoles: ["SUPER_ADMIN"],
  },
];
