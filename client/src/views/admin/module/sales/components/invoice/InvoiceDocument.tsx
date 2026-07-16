import { useEffect } from "react";
import type { BusinessResponse } from "../../../businesses/types";
import { useCustomers } from "../../../customers/hooks/useCustomers";
import type { SaleWithDetailsResponse } from "../../types";
import { formatCurrency, formatDate } from "@/helpers";

type Props = {
  sale: SaleWithDetailsResponse;
  business: BusinessResponse | null;
  grossSubtotal: number;
};

const businessTypeLabels: Record<string, string> = {
  MAXIKIOSCO: "Maxikiosco",
  PRODUCTOS: "Venta de productos",
  FINANCIERA: "Financiera",
  KIOSCO: "Kiosco",
  ALMACEN: "Almacen / Despensa",
  MINIMERCADO: "Minimercado",
  SUPERMERCADO: "Supermercado",
  FARMACIA: "Farmacia",
  FERRETERIA: "Ferreteria",
  INDUMENTARIA: "Indumentaria",
  TECNOLOGIA: "Tecnologia",
  DISTRIBUIDORA: "Distribuidora",
  GASTRONOMIA: "Gastronomia",
  LIBRERIA: "Libreria",
  PERFUMERIA: "Perfumeria",
  VETERINARIA: "Veterinaria",
  OTRO: "Comercio",
};

const getBusinessTypeLabel = (value: string | null | undefined): string => {
  if (!value) return "Comercio";
  return businessTypeLabels[value] ?? value;
};

const formatQuantity = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
};

export const InvoiceDocument = ({ sale, business, grossSubtotal }: Props) => {
  const businessName = business?.name || "Punto de Venta";
  const businessType = getBusinessTypeLabel(business?.businessType);
  const isFinalConsumer = !sale.idCustomer || !sale.customerName;
  const saleNumber = sale.saleNumber || `#${sale.idSale}`;

  const { customerById, loadingById, getIdCustomers, resetIdCustomers } =
    useCustomers();

  useEffect(() => {
    if (sale.idCustomer) {
      getIdCustomers(sale.idCustomer);
      return;
    }

    resetIdCustomers();
  }, [getIdCustomers, resetIdCustomers, sale.idCustomer]);

  return (
    <article className="print-container relative mx-auto min-h-[1120px] w-full max-w-[800px] overflow-hidden bg-white text-slate-950 shadow-2xl print:min-h-screen print:max-w-full print:shadow-none">
      {sale.status === "CANCELLED" && (
        <>
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="-rotate-12 rounded-xl border-4 border-red-500/30 px-10 py-4 text-6xl font-black uppercase tracking-[0.2em] text-red-500/20 print:text-red-500/25">
              Anulada
            </div>
          </div>
          <div className="absolute left-10 top-64 z-20 rounded-full border border-red-200 bg-red-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Venta anulada
          </div>
        </>
      )}
      <header className="relative h-56 overflow-hidden bg-blue-700 text-white print:h-48">
        <div className="absolute inset-0 bg-blue-800" />
        <div className="absolute -left-20 top-12 h-40 w-[120%] rotate-[-4deg] rounded-[50%] bg-blue-950/45" />
        {/* <div className="absolute -left-24 top-24 h-44 w-[125%] rotate-[5deg] rounded-[50%] bg-white" /> */}
        <div className="absolute right-16 top-12 flex items-center gap-4 text-right">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-blue-100">
              Comprobante
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-wide">
              {businessName}
            </h1>
            <p className="text-sm text-blue-100">{businessType}</p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-2xl font-black text-blue-800 ring-8 ring-white/20">
            {business?.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={businessName}
                className="h-16 w-16 rounded-full object-contain"
              />
            ) : (
              businessName.slice(0, 1).toUpperCase()
            )}
          </div>
        </div>
      </header>

      <section className="px-14 pt-10 print:px-10 print:pt-8">
        <div className="grid gap-10 md:grid-cols-2">
          <section>
            <h2 className="text-xl font-black uppercase tracking-wide">
              Datos del cliente
            </h2>
            {loadingById ? (
              <div className="mt-3 space-y-1 text-[15px] leading-7 text-slate-700">
                <p>
                  <strong>Cliente:</strong> Cargando datos...
                </p>
              </div>
            ) : sale.idCustomer && customerById ? (
              <div className="mt-3 space-y-1 text-[15px] leading-7 text-slate-700">
                <p>
                  <strong>Nombre:</strong>{" "}
                  {customerById.name || "Sin nombre registrado"}
                </p>
                {customerById.phone && (
                  <p>
                    <strong>Telefono:</strong> {customerById.phone}
                  </p>
                )}
                {customerById.address && (
                  <p>
                    <strong>Direccion:</strong> {customerById.address}
                  </p>
                )}
                {customerById.email && (
                  <p>
                    <strong>Email:</strong> {customerById.email}
                  </p>
                )}
                {customerById.observation && (
                  <p>
                    <strong>Observacion:</strong> {customerById.observation}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-1 text-[15px] leading-7 text-slate-700">
                <p>
                  <strong>Nombre:</strong>{" "}
                  {isFinalConsumer ? "Consumidor Final" : sale.customerName}
                </p>
              </div>
            )}
          </section>

          <section className="md:text-right">
            <h2 className="text-xl font-black uppercase tracking-wide">
              Datos de la empresa
            </h2>
            <div className="mt-3 space-y-1 text-[15px] leading-7 text-slate-700">
              <p>
                <strong>Nombre:</strong> {businessName}
              </p>
              <p>
                <strong>Rubro:</strong> {businessType}
              </p>
              <p>
                <strong>Deposito:</strong> {sale.depositName}
              </p>
              <p>
                <strong>Vendedor:</strong> {sale.userName}
              </p>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-2 md:flex-row md:items-end">
          <div>
            <p className="text-lg font-black">
              Fecha: {formatDate(sale.saleDate)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {/* Forma de pago: {sale.paymentMethodName ?? "Sin metodo informado"} */}
            </p>
          </div>
          <div className="rounded-md bg-blue-50 px-4 py-2 text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-blue-700">
              N de comprobante
            </p>
            <p className="text-xl font-black text-blue-950">{saleNumber}</p>
          </div>
        </div>

        <section className="mt-6 overflow-x-auto">
          <div className="grid grid-cols-[1.8fr_0.7fr_0.9fr_0.9fr] gap-1 bg-white text-white">
            <div className="bg-sky-950 px-4 py-3 text-center font-semibold">
              Concepto
            </div>
            <div className="bg-sky-950 px-4 py-3 text-center font-semibold">
              Cantidad
            </div>
            <div className="bg-sky-950 px-4 py-3 text-center font-semibold">
              Precio
            </div>
            <div className="bg-sky-950 px-4 py-3 text-center font-semibold">
              Total
            </div>
          </div>

          <div className="divide-y divide-slate-300 overflow-x-auto">
            {sale.items.map((item) => (
              <div
                key={item.idSaleDetail}
                className="grid grid-cols-[1.8fr_0.7fr_0.9fr_0.9fr] items-center gap-1 py-4 text-[15px]"
              >
                <div className="px-1">
                  <div className="flex items-center gap-2">
                    <img src={item.productImageUrl || "/path/to/default-image.jpg"} alt={item.productName} className="h-12 w-12 object-cover" />
                    <p className="font-semibold">{item.productName}</p>
                  </div>
                </div>
                <div className="text-center">
                  {formatQuantity(item.quantity)}
                </div>
                <div className="text-center">
                  {formatCurrency(item.unitPrice)}
                </div>
                <div className="text-center font-semibold">
                  {formatCurrency(item.total)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-4 grid gap-8 md:grid-cols-[1fr_320px]">
          <section className="space-y-5 text-[15px] leading-7 text-slate-700">
            <p>
              <strong>Observacion:</strong>{" "}
              {sale.observation || "Sin observaciones asociadas."}
            </p>
            <p>
              <strong>Estado:</strong>{" "}
              {sale.status === "CANCELLED" ? "Venta anulada" : "Completada"}
            </p>
          </section>

          <section className="space-y-3 text-[16px]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(grossSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Descuento</span>
              <span>{formatCurrency(sale.discountTotal)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-slate-900 pt-4 text-xl font-black">
              <span>Total</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </section>
        </footer>
      </section>
    </article>
  );
};
