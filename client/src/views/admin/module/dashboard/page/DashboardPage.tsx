import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  DollarSign,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import {
  CriticalStockTable,
  DashboardCharts,
  MetricCard,
  MonthlySalesChart,
  RecentSalesTable,
} from "../components";
import { useDashboard } from "../hooks/useDashboard";

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-lg border bg-muted"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-lg border bg-muted" />
        <div className="h-80 animate-pulse rounded-lg border bg-muted" />
      </div>
    </div>
  );
};

export const DashboardPage = () => {
  const {
    dashboardData,
    selectedYear,
    setSelectedYear,
    loading,
    error,
    refreshDashboard,
  } = useDashboard();

  if (loading && !dashboardData) {
    return (
      <>
        <Meta title="Dashboard" />
        <main className="space-y-6 p-6">
          <section>
            <h1 className="text-2xl font-bold tracking-tight">
              Dashboard de Control
            </h1>
            <p className="text-muted-foreground">
              Cargando metricas del negocio...
            </p>
          </section>
          <DashboardSkeleton />
        </main>
      </>
    );
  }

  return (
    <>
      <Meta title="Dashboard" />
      <main className="space-y-6 p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard de Control
          </h1>
          <p className="text-muted-foreground">
            Metricas clave de ventas, inventario y operacion.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => {
            void refreshDashboard(selectedYear);
          }}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </section>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {dashboardData && (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Ventas de hoy"
              value={formatMoney(dashboardData.metrics.todaySalesTotal)}
              description="Total facturado hoy"
              icon={DollarSign}
              tone="success"
            />
            <MetricCard
              title="Ventas del mes"
              value={formatMoney(dashboardData.metrics.monthSalesTotal)}
              description="Acumulado mensual"
              icon={TrendingUp}
              tone="info"
            />
            <MetricCard
              title="Operaciones de hoy"
              value={formatNumber(dashboardData.metrics.todaySalesCount)}
              description="Ventas completadas"
              icon={ShoppingCart}
              tone="default"
            />
            <MetricCard
              title="Ticket promedio"
              value={formatMoney(dashboardData.metrics.monthAverageTicket)}
              description="Promedio mensual"
              icon={CalendarDays}
              tone="info"
            />
            <MetricCard
              title="Stock bajo"
              value={formatNumber(dashboardData.metrics.lowStockProducts)}
              description="Productos bajo minimo"
              icon={AlertTriangle}
              tone={
                dashboardData.metrics.lowStockProducts > 0
                  ? "warning"
                  : "success"
              }
            />
            <MetricCard
              title="Sin stock"
              value={formatNumber(dashboardData.metrics.outOfStockProducts)}
              description="Reposicion urgente"
              icon={Boxes}
              tone={
                dashboardData.metrics.outOfStockProducts > 0
                  ? "danger"
                  : "success"
              }
            />
            <MetricCard
              title="Productos activos"
              value={formatNumber(dashboardData.metrics.activeProducts)}
              description="Catalogo disponible"
              icon={PackageCheck}
              tone="success"
            />
            <MetricCard
              title="Valor stock costo"
              value={formatMoney(dashboardData.metrics.stockCostValue)}
              description="Inventario valorizado"
              icon={DollarSign}
              tone="default"
            />
          </section>

          <MonthlySalesChart
            data={dashboardData.monthlySales}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={dashboardData.availableYears}
          />

          <DashboardCharts
            topProducts={dashboardData.topProducts}
            salesByPaymentMethod={dashboardData.salesByPaymentMethod}
          />

          <section className="grid gap-4 xl:grid-cols-2 overflow-x-auto">
            <RecentSalesTable sales={dashboardData.recentSales} />
            <CriticalStockTable items={dashboardData.criticalStock} />
          </section>
        </>
      )}
      </main>
    </>
  );
};
