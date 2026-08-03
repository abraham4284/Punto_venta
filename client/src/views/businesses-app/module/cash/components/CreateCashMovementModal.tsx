import { useState } from "react";
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
import { cashMovementFormSchema } from "../validations/cash.validations";
import type { CreateCashMovementBody } from "../types";

interface CreateCashMovementModalProps {
  isOpen: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: CreateCashMovementBody) => Promise<boolean>;
}

export const CreateCashMovementModal = ({
  isOpen,
  saving,
  onClose,
  onSubmit,
}: CreateCashMovementModalProps) => {
  const [movementType, setMovementType] = useState("INCOME");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const parsed = cashMovementFormSchema.safeParse({
      movementType,
      category,
      amount,
      description,
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
      movementType: parsed.data.movementType,
      category: parsed.data.category,
      amount: parsed.data.amount,
      description: parsed.data.description || null,
    });

    if (saved) {
      setCategory("");
      setAmount("");
      setDescription("");
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Operacion</Label>
            <select
              value={movementType}
              onChange={(event) => setMovementType(event.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="INCOME">Ingreso de efectivo</option>
              <option value="EXPENSE">Egreso de efectivo</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Input value={category} onChange={(event) => setCategory(event.target.value)} />
            {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
          </div>
          <div className="grid gap-2">
            <Label>Importe</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
          </div>
          <div className="grid gap-2">
            <Label>Descripcion</Label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={saving} onClick={handleSubmit}>
            {saving ? "Guardando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
