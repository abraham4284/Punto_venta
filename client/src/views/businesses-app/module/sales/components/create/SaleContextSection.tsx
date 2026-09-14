import { CalendarDays, CircleDollarSign, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { CashSessionResponse } from "../../../cash/types";
import type { Customer } from "../../../customers/types/customers.types";
import type { DepositResponse } from "../../../deposits/types/deposits.types";
import { today } from "../../helpers/createSale.helpers";
import { CustomerSelectionModal } from "./CustomerSelectionModal";

type Props = {
  cashSession: CashSessionResponse | null;
  selectedCustomer: Customer | null;
  selectedDepositId: number | null;
  isCustomerModalOpen: boolean;
  customers: Customer[];
  deposits: DepositResponse[];
  depositError?: string;
  onOpenCustomerModal: () => void;
  onCloseCustomerModal: () => void;
  onCustomerClear: () => void;
  onCustomerSelect: (customer: Customer) => void;
  onDepositSelect: (deposit: DepositResponse) => void;
};

export const SaleContextSection = ({
  cashSession,
  selectedCustomer,
  selectedDepositId,
  isCustomerModalOpen,
  customers,
  deposits,
  depositError,
  onOpenCustomerModal,
  onCloseCustomerModal,
  onCustomerClear,
  onCustomerSelect,
  onDepositSelect,
}: Props) => {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Fecha
            </div>
            <p className="mt-2 text-sm font-semibold">{today}</p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <Store className="h-4 w-4" />
              Caja
            </div>
            {cashSession ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">
                  {cashSession.cashRegisterName}
                </p>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  Abierta
                </Badge>
              </div>
            ) : (
              <p className="mt-2 text-sm font-semibold text-destructive">
                Sin caja abierta
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <CircleDollarSign className="h-4 w-4" />
              Comprobante
            </div>
            <p className="mt-2 text-sm font-semibold">
              El número se genera automáticamente
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <span className="text-sm font-medium">Cliente</span>
            <Button
              type="button"
              variant="outline"
              className="h-11 justify-start overflow-hidden px-3 text-left font-normal"
              onClick={onOpenCustomerModal}
            >
              <span className="truncate">
                {selectedCustomer?.name ?? "Consumidor final"}
              </span>
            </Button>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium">
              Depósito <span className="text-destructive">*</span>
            </span>
            <Select
              value={selectedDepositId ? String(selectedDepositId) : ""}
              onValueChange={(value: string | null) => {
                const idDeposit = Number(value);
                const selectedDeposit = deposits.find((deposit) => {
                  return deposit.idDeposit === idDeposit;
                });

                if (selectedDeposit) {
                  onDepositSelect(selectedDeposit);
                }
              }}
            >
              <SelectTrigger className="h-11 w-full">
                <span
                  className={
                    selectedDepositId
                      ? "flex flex-1 text-left"
                      : "flex flex-1 text-left text-muted-foreground"
                  }
                >
                  {deposits.find((deposit) => {
                    return deposit.idDeposit === selectedDepositId;
                  })?.name ?? "Seleccioná un depósito"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {deposits.map((deposit) => (
                  <SelectItem
                    key={deposit.idDeposit}
                    value={String(deposit.idDeposit)}
                  >
                    {deposit.name}
                    {deposit.isDefault ? " · Predeterminado" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {depositError ? (
              <p className="text-sm text-destructive">{depositError}</p>
            ) : null}
          </div>
        </div>
      </CardContent>

      <CustomerSelectionModal
        isOpen={isCustomerModalOpen}
        customers={customers}
        onClose={onCloseCustomerModal}
        onClear={onCustomerClear}
        onSelect={onCustomerSelect}
      />
    </Card>
  );
};
