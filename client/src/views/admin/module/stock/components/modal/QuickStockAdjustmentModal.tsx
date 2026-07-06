import { useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { ArrowDown, ArrowRightLeft, ArrowUp, Settings2 } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { DepositResponse } from "../../../deposits/types/deposits.types";
import {
  processStockAdjustmentRequest,
  processStockTransferRequest,
} from "../../api/stock.movement.api";
import type { StockBalanceResponse, StockResponse } from "../../types/stock.types";
import type { ApiErrorResponse } from "../../types/stock.types";

type QuickOperationType = "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "TRANSFER";

type Props = {
  isOpen: boolean;
  stock: StockResponse | null;
  deposits: DepositResponse[];
  loadingBalance: boolean;
  onClose: () => void;
  onSuccess: () => void;
  fetchCurrentStockBalance: (
    idProduct: number,
    idDeposit: number,
  ) => Promise<StockBalanceResponse | null>;
};

type FieldErrors = Partial<Record<"quantity" | "idDepositTo" | "operation", string>>;

const quickAdjustmentSchema = z
  .object({
    operation: z.enum(["ADJUSTMENT_IN", "ADJUSTMENT_OUT", "TRANSFER"], {
      error: "Selecciona una operacion valida",
    }),
    quantity: z
      .number({ error: "La cantidad es obligatoria" })
      .int("La cantidad debe ser un numero entero")
      .positive("La cantidad debe ser mayor a cero"),
    idDepositTo: z.number().int().positive().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.operation === "TRANSFER" && !data.idDepositTo) {
      ctx.addIssue({
        code: "custom",
        path: ["idDepositTo"],
        message: "Selecciona un deposito destino",
      });
    }
  });

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const operationOptions: Array<{
  value: QuickOperationType;
  label: string;
  icon: typeof ArrowUp;
}> = [
  { value: "ADJUSTMENT_IN", label: "Ingreso", icon: ArrowUp },
  { value: "ADJUSTMENT_OUT", label: "Egreso", icon: ArrowDown },
  { value: "TRANSFER", label: "Transferencia", icon: ArrowRightLeft },
];

export const QuickStockAdjustmentModal = ({
  isOpen,
  stock,
  deposits,
  loadingBalance,
  onClose,
  onSuccess,
  fetchCurrentStockBalance,
}: Props) => {
  const [operation, setOperation] =
    useState<QuickOperationType>("ADJUSTMENT_IN");
  const [quantity, setQuantity] = useState("");
  const [idDepositTo, setIdDepositTo] = useState("");
  const [observation, setObservation] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [destinationBalance, setDestinationBalance] =
    useState<StockBalanceResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const activeDestinationDeposits = useMemo(() => {
    return deposits.filter((deposit) => {
      return deposit.isActive && deposit.idDeposit !== stock?.idDeposit;
    });
  }, [deposits, stock?.idDeposit]);

  const selectedQuantity = Number(quantity);
  const isOutputOperation =
    operation === "ADJUSTMENT_OUT" || operation === "TRANSFER";
  const exceedsOriginStock =
    isOutputOperation &&
    Number.isInteger(selectedQuantity) &&
    selectedQuantity > 0 &&
    Boolean(stock) &&
    selectedQuantity > Number(stock?.quantity ?? 0);
  const destinationBlocked =
    operation === "TRANSFER" &&
    Boolean(idDepositTo) &&
    Boolean(destinationBalance) &&
    !destinationBalance?.exists;

  const resetForm = () => {
    setOperation("ADJUSTMENT_IN");
    setQuantity("");
    setIdDepositTo("");
    setObservation("");
    setErrors({});
    setDestinationBalance(null);
    setSubmitting(false);
    setServerError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDestinationChange = async (value: string | null) => {
    const nextValue = value ?? "";

    setIdDepositTo(nextValue);
    setDestinationBalance(null);
    setErrors((current) => ({
      ...current,
      idDepositTo: undefined,
    }));

    if (!stock || operation !== "TRANSFER" || !nextValue) return;

    const balance = await fetchCurrentStockBalance(
      stock.idProduct,
      Number(nextValue),
    );

    setDestinationBalance(balance);
  };

  const validateForm = (): boolean => {
    const validation = quickAdjustmentSchema.safeParse({
      operation,
      quantity: Number(quantity),
      idDepositTo: idDepositTo ? Number(idDepositTo) : null,
    });

    if (!validation.success) {
      const nextErrors = validation.error.issues.reduce<FieldErrors>(
        (acc, issue) => {
          const field = issue.path.join(".") as keyof FieldErrors;
          acc[field] = issue.message;
          return acc;
        },
        {},
      );

      setErrors(nextErrors);
      return false;
    }

    if (exceedsOriginStock) {
      setErrors({
        quantity: "La cantidad no puede superar el stock disponible en origen",
      });
      return false;
    }

    if (destinationBlocked) {
      setErrors({
        idDepositTo:
          "Primero debe dar de alta el stock del producto en el deposito al que desea transferir",
      });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!stock || !validateForm()) return;

    try {
      setSubmitting(true);
      setServerError(null);

      if (operation === "TRANSFER") {
        await processStockTransferRequest({
          idProduct: stock.idProduct,
          idDepositFrom: stock.idDeposit,
          idDepositTo: Number(idDepositTo),
          quantity: Number(quantity),
          observation: observation.trim() || null,
        });
      } else {
        await processStockAdjustmentRequest({
          idProduct: stock.idProduct,
          idDeposit: stock.idDeposit,
          quantity: Number(quantity),
          type: operation,
          observation: observation.trim() || null,
        });
      }

      onSuccess();
      handleClose();
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      setServerError(
        axiosError.response?.data?.message || "No se pudo procesar el ajuste",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Ajuste rapido de inventario
          </DialogTitle>
        </DialogHeader>

        {stock && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                {stock.productImageUrl ? (
                  <img
                    src={stock.productImageUrl}
                    alt={stock.productName}
                    className="h-14 w-14 rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border bg-background text-xs text-muted-foreground">
                    Sin img
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Producto</p>
                  <p className="truncate font-semibold">{stock.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    Deposito origen: {stock.depositName}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit">
                Stock actual en origen: {formatNumber(stock.quantity)}
              </Badge>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Operacion</Label>
            <div className="grid gap-2 md:grid-cols-3">
              {operationOptions.map((option) => {
                const Icon = option.icon;
                const selected = operation === option.value;

                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    onClick={() => {
                      setOperation(option.value);
                      setIdDepositTo("");
                      setDestinationBalance(null);
                      setErrors({});
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
            {errors.operation && (
              <p className="text-sm text-destructive">{errors.operation}</p>
            )}
          </div>

          {operation === "TRANSFER" && (
            <div className="grid gap-2">
              <Label>Deposito destino</Label>
              <Select
                value={idDepositTo}
                onValueChange={handleDestinationChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona deposito destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {activeDestinationDeposits.map((deposit) => (
                      <SelectItem
                        key={deposit.idDeposit}
                        value={String(deposit.idDeposit)}
                      >
                        {deposit.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {loadingBalance && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  Verificando stock en destino...
                </p>
              )}
              {destinationBlocked && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Primero debe dar de alta el stock del producto en el deposito
                  al que desea transferir
                </p>
              )}
              {destinationBalance?.exists && (
                <p className="text-sm text-muted-foreground">
                  Stock actual en destino: {formatNumber(destinationBalance.quantity)}
                </p>
              )}
              {errors.idDepositTo && (
                <p className="text-sm text-destructive">{errors.idDepositTo}</p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="quick-stock-quantity">Cantidad</Label>
            <Input
              id="quick-stock-quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                setErrors((current) => ({ ...current, quantity: undefined }));
              }}
              placeholder="Ej: 5"
            />
            {exceedsOriginStock && (
              <p className="text-sm text-destructive">
                La cantidad no puede superar el stock disponible en origen
              </p>
            )}
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quick-stock-observation">Observacion</Label>
            <Textarea
              id="quick-stock-observation"
              value={observation}
              maxLength={255}
              onChange={(event) => setObservation(event.target.value)}
              placeholder="Motivo del ajuste..."
            />
          </div>

          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={submitting || loadingBalance || destinationBlocked}
            onClick={handleSubmit}
          >
            {submitting && <Spinner className="mr-2 h-4 w-4" />}
            Confirmar ajuste
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
