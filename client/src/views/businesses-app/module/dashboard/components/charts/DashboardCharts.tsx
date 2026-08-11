import type { SalesByPaymentMethod, TopProduct } from "../../types";

type Props = {
  topProducts: TopProduct[];
  salesByPaymentMethod: SalesByPaymentMethod[];
};

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

export const DashboardCharts = ({
  topProducts,
}: Props) => {
  const maxProductQuantity = Math.max(
    ...topProducts.map((product) => product.quantitySold),
    1,
  );
  // const maxPaymentTotal = Math.max(
  //   ...salesByPaymentMethod.map((payment) => payment.totalAmount),
  //   1,
  // );

  return (
    <section className="grid gap-4 lg:grid-cols-1">
      <article className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold">Top productos vendidos</h2>
          <p className="text-sm text-muted-foreground">
            Ranking por unidades vendidas
          </p>
        </div>

        <div className="space-y-4">
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin ventas registradas.
            </p>
          ) : (
            topProducts.map((product) => {
              const percentage = Math.max(
                (product.quantitySold / maxProductQuantity) * 100,
                6,
              );

              return (
                <div key={product.idProduct} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">
                      {product.productName}
                    </span>
                    <span className="text-muted-foreground">
                      {formatNumber(product.quantitySold)} u.
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recaudado: {formatMoney(product.totalRevenue)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </article>

      {/* <article className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold">Ventas por metodo de pago</h2>
          <p className="text-sm text-muted-foreground">
            Totales del mes actual
          </p>
        </div>

        <div className="space-y-4">
          {salesByPaymentMethod.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin datos de pago para este mes.
            </p>
          ) : (
            salesByPaymentMethod.map((payment) => {
              const percentage = Math.max(
                (payment.totalAmount / maxPaymentTotal) * 100,
                6,
              );

              return (
                <div key={payment.paymentMethodName} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">
                      {payment.paymentMethodName}
                    </span>
                    <span className="text-muted-foreground">
                      {formatMoney(payment.totalAmount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-sky-600"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </article> */}
    </section>
  );
};
