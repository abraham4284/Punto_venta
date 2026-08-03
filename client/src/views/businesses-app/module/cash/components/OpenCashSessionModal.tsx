import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { openCashSessionFormSchema } from "../validations/cash.validations";
import type { CashRegisterResponse, OpenCashSessionBody } from "../types";

interface OpenCashSessionModalProps {
  isOpen: boolean;
  registers: CashRegisterResponse[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: OpenCashSessionBody) => Promise<boolean>;
}

export const OpenCashSessionModal = ({
  isOpen,
  registers,
  saving,
  onClose,
  onSubmit,
}: OpenCashSessionModalProps) => {
  const defaultRegister = registers.find((register) => register.isDefault);
  const [idCashRegister, setIdCashRegister] = useState(
    defaultRegister?.idCashRegister ? String(defaultRegister.idCashRegister) : "",
  );
  const [openingAmount, setOpeningAmount] = useState("0");
  const [openingObservation, setOpeningObservation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const selectedIdCashRegister = useMemo(() => {
    if (idCashRegister) return idCashRegister;

    const activeDefaultRegister = registers.find((register) => {
      return register.isActive && register.isDefault;
    });
    const firstActiveRegister = registers.find((register) => register.isActive);
    const selectedRegister = activeDefaultRegister ?? firstActiveRegister;

    return selectedRegister ? String(selectedRegister.idCashRegister) : "";
  }, [idCashRegister, registers]);

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    const parsed = openCashSessionFormSchema.safeParse({
      idCashRegister: selectedIdCashRegister,
      openingAmount,
      openingObservation,
    });

    if (!parsed.success) {
      setErrors(
        parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          acc[issue.path.join(".")] = issue.message;
          return acc;
        }, {}),
      );
      return;
    }

    const saved = await onSubmit({
      idCashRegister: parsed.data.idCashRegister,
      openingAmount: parsed.data.openingAmount,
      openingObservation: parsed.data.openingObservation || null,
    });

    if (saved) {
      setOpeningAmount("0");
      setOpeningObservation("");
      setErrors({});
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir caja</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Caja</Label>
            <select
              value={selectedIdCashRegister}
              onChange={(event) => setIdCashRegister(event.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Seleccione una caja</option>
              {registers
                .filter((register) => register.isActive)
                .map((register) => (
                  <option key={register.idCashRegister} value={register.idCashRegister}>
                    {register.name}
                  </option>
                ))}
            </select>
            {errors.idCashRegister && (
              <p className="text-sm text-destructive">{errors.idCashRegister}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Monto inicial</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={openingAmount}
              onChange={(event) => setOpeningAmount(event.target.value)}
            />
            {errors.openingAmount && (
              <p className="text-sm text-destructive">{errors.openingAmount}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Observacion</Label>
            <Textarea
              value={openingObservation}
              onChange={(event) => setOpeningObservation(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={saving} onClick={handleSubmit}>
            {saving ? "Abriendo..." : "Abrir caja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
