import type { ReactNode } from "react";
import { Menu, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { PriceCheckerListener } from "@/components/global/PriceCheckerListener";
import { PriceCheckerModal } from "@/components/global/PriceCheckerModal";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { usePriceCheckerStore } from "@/store/priceChecker.store";
import { SubscriptionBanner } from "@/views/businesses-app/module/subscription/components/SubscriptionBanner";
import { SubscriptionBlockedView } from "@/views/businesses-app/module/subscription/components/SubscriptionBlockedView";
import { useBusinessSubscriptionStore } from "@/views/businesses-app/module/subscription/store/businessSubscription.store";
import { PasswordChangeRequiredView } from "@/views/businesses-app/components/PasswordChangeRequiredView";
import { useAuthStore } from "@/views/businesses-app/module/auth/store/auth.store";
import { NotificationBell } from "@/views/businesses-app/module/notifications/components/NotificationBell";

type AdminLayoutProps = {
  children: ReactNode;
};

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const openPriceChecker = usePriceCheckerStore(
    (state) => state.openPriceChecker,
  );
  const subscriptionState = useBusinessSubscriptionStore(
    (state) => state.subscriptionState,
  );
  const mustChangePassword = useAuthStore(
    (state) => state.user?.mustChangePassword ?? false,
  );
  const shouldBlockApplication =
    subscriptionState?.notification.shouldBlockApplication ?? false;
  const isAllowedWhileBlocked =
    location.pathname.startsWith("/admin/subscription") ||
    location.pathname.startsWith("/admin/profile") ||
    location.pathname.startsWith("/admin/legal");
  const isProfileRoute = location.pathname.startsWith("/admin/profile");

  return (
    <SidebarProvider>
      <PriceCheckerListener />
      <PriceCheckerModal />
      <AppSidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden transition-all duration-300">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="h-10 w-10 rounded-lg border text-foreground">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Cajora</p>
            <p className="text-xs text-muted-foreground">Panel administrativo</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openPriceChecker}
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Consultar Precio</span>
            <span className="ml-1 text-xs text-muted-foreground">(F8)</span>
          </Button>
          <NotificationBell />
        </header>

        <SubscriptionBanner />

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 transition-all duration-300 sm:p-4 md:p-6">
          {mustChangePassword && !isProfileRoute ? (
            <PasswordChangeRequiredView />
          ) : shouldBlockApplication && !isAllowedWhileBlocked ? (
            <SubscriptionBlockedView />
          ) : (
            children
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};
