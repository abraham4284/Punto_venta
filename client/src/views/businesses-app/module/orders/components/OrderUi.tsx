import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { OrderPagination, OrderStatus } from "../types/orders.types";
import { orderStatusLabels } from "../helpers/orders.helpers";

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  const tone = { PENDING: "bg-amber-50 text-amber-900", CONFIRMED: "bg-blue-50 text-blue-900", PREPARING: "bg-violet-50 text-violet-900", READY: "bg-emerald-50 text-emerald-900", COMPLETED: "bg-slate-100 text-slate-800", CANCELLED: "bg-red-50 text-red-900" };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone[status]}`}>{orderStatusLabels[status]}</span>;
};
export const OrderSection = ({ title, children }: { title: string; children: ReactNode }) => <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6"><h2 className="text-base font-semibold">{title}</h2>{children}</section>;
export const OrderField = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => <div className="min-w-0 space-y-1.5"><label className="block space-y-1.5 text-sm font-medium"><span>{label}</span>{children}</label>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}</div>;
export const OrderErrorNotice = ({ message, retry }: { message: string; retry?: () => void }) => <div role="alert" className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"><p>{message}</p>{retry && <Button type="button" variant="outline" size="sm" onClick={retry}>Reintentar</Button>}</div>;
export const OrdersPager = ({ pagination, disabled, onPage, label = "Paginación de pedidos" }: { pagination: OrderPagination; disabled: boolean; onPage: (page: number) => void; label?: string }) => <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>{pagination.totalRecords} resultados · Página {pagination.currentPage} de {pagination.totalPages}</span><div className="flex gap-2"><Button type="button" variant="outline" disabled={disabled || pagination.currentPage <= 1} onClick={() => onPage(pagination.currentPage - 1)}>Anterior</Button><Button type="button" variant="outline" disabled={disabled || pagination.currentPage >= pagination.totalPages} onClick={() => onPage(pagination.currentPage + 1)}>Siguiente</Button></div></nav>;
